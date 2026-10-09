import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Issue } from '../models/Issue';
import { Notification } from '../models/Notification';
import { detectDuplicateIssue } from '../services/duplicateDetector';
import { IssueCategory, IssuePriority, IssueStatus } from '../types';

const router = Router();

const createIssueSchema = z.object({
  title: z.string().min(4, 'Title must be at least 4 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  category: z.enum([
    'Infrastructure',
    'IT & WiFi',
    'Cleanliness',
    'Lab Equipment',
    'Library',
    'Cafeteria',
    'Other',
  ]),
  location: z.string().min(2, 'Location is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  forceCreate: z.boolean().optional().default(false),
});

const duplicateCheckSchema = z.object({
  title: z.string().min(2),
  category: z.enum([
    'Infrastructure',
    'IT & WiFi',
    'Cleanliness',
    'Lab Equipment',
    'Library',
    'Cafeteria',
    'Other',
  ]),
  location: z.string().min(2),
  description: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['Reported', 'Assigned', 'In Progress', 'Resolved']),
  comment: z.string().optional(),
});

// GET /api/issues - List issues ranked by votes and priority
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, category } = req.query;

    const query: any = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (category && category !== 'ALL') {
      query.category = category;
    }

    const issues = await Issue.find(query)
      .populate('reportedBy', 'name email role')
      .populate('upvoters', 'name email');

    const priorityWeights: Record<IssuePriority, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    // Rank: 1. Upvotes count DESC, 2. Priority weight DESC, 3. CreatedAt DESC
    issues.sort((a, b) => {
      const votesDiff = (b.upvoters?.length || 0) - (a.upvoters?.length || 0);
      if (votesDiff !== 0) return votesDiff;

      const priorityDiff = priorityWeights[b.priority] - priorityWeights[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.status(200).json(issues);
  } catch (err: any) {
    console.error('[ISSUES ERROR] Failed to list issues:', err);
    res.status(500).json({ error: 'Failed to retrieve issues' });
  }
});

// POST /api/issues/check-duplicate - Check for duplicates before creation
router.post('/check-duplicate', authenticate, validate(duplicateCheckSchema), async (req: Request, res: Response) => {
  try {
    const result = await detectDuplicateIssue(req.body);
    res.status(200).json(result);
  } catch (err: any) {
    console.error('[ISSUES ERROR] Duplicate check failed:', err);
    res.status(500).json({ error: 'Duplicate check failed' });
  }
});

// POST /api/issues - Report a new issue
router.post('/', authenticate, validate(createIssueSchema), async (req: Request, res: Response) => {
  try {
    const { title, description, category, location, priority, forceCreate } = req.body;
    const userId = req.user!.id;

    // Duplicate detection check
    if (!forceCreate) {
      const duplicateResult = await detectDuplicateIssue({
        title,
        category: category as IssueCategory,
        location,
        description,
      });

      if (duplicateResult.isDuplicate && duplicateResult.matchedIssue) {
        res.status(409).json({
          duplicateDetected: true,
          message: duplicateResult.message,
          matchedIssue: duplicateResult.matchedIssue,
          similarityScore: duplicateResult.similarityScore,
        });
        return;
      }
    }

    const issue = await Issue.create({
      title,
      description,
      category,
      location,
      priority,
      status: 'Reported',
      reportedBy: userId,
      upvoters: [userId], // Reporter auto-upvotes
    });

    await issue.populate('reportedBy', 'name email role');

    res.status(201).json({
      message: 'Issue reported successfully',
      issue,
    });
  } catch (err: any) {
    console.error('[ISSUES ERROR] Create issue failed:', err);
    res.status(500).json({ error: 'Failed to report issue' });
  }
});

// POST /api/issues/:id/upvote - "Me too" upvote / toggle
router.post('/:id/upvote', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    const issue = await Issue.findById(id);
    if (!issue) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }

    const hasUpvoted = issue.upvoters.some(uid => uid.equals(userId));

    if (hasUpvoted) {
      // Toggle off upvote
      issue.upvoters = issue.upvoters.filter(uid => !uid.equals(userId));
    } else {
      // Add "Me too" upvote
      issue.upvoters.push(userId);
    }

    await issue.save();
    await issue.populate('reportedBy', 'name email role');
    await issue.populate('upvoters', 'name email');

    res.status(200).json({
      message: hasUpvoted ? 'Removed "Me too" vote' : 'Added "Me too" vote to issue',
      upvoted: !hasUpvoted,
      upvotesCount: issue.upvoters.length,
      issue,
    });
  } catch (err: any) {
    console.error('[ISSUES ERROR] Upvote failed:', err);
    res.status(500).json({ error: 'Failed to update issue upvote' });
  }
});

// PATCH /api/issues/:id/status - Admin updates status & triggers notifications
router.patch(
  '/:id/status',
  authenticate,
  requireRole('ADMIN'),
  validate(updateStatusSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, comment } = req.body;

      const issue = await Issue.findById(id);
      if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }

      const previousStatus = issue.status;
      issue.status = status as IssueStatus;
      await issue.save();

      // Collect all impacted users: reporter + upvoters (unique IDs)
      const userIdsSet = new Set<string>();
      if (issue.reportedBy) {
        userIdsSet.add(issue.reportedBy.toString());
      }
      issue.upvoters.forEach(uid => userIdsSet.add(uid.toString()));

      // Create notification for every impacted student
      const notificationMessage = `Issue "${issue.title}" at ${issue.location} was changed from "${previousStatus}" to "${status}" by Campus Administration.${comment ? ` Note: ${comment}` : ''}`;

      const notificationsToCreate = Array.from(userIdsSet).map(userId => ({
        userId: new mongoose.Types.ObjectId(userId),
        title: `Issue Status Update: ${status}`,
        message: notificationMessage,
        type: 'ISSUE_UPDATE' as const,
        link: '/issues',
        metadata: { issueId: issue._id, status },
      }));

      if (notificationsToCreate.length > 0) {
        await Notification.insertMany(notificationsToCreate);
      }

      await issue.populate('reportedBy', 'name email role');
      await issue.populate('upvoters', 'name email');

      res.status(200).json({
        message: `Issue status updated to ${status}. ${notificationsToCreate.length} students notified.`,
        issue,
        notifiedStudentsCount: notificationsToCreate.length,
      });
    } catch (err: any) {
      console.error('[ISSUES ERROR] Status update failed:', err);
      res.status(500).json({ error: 'Failed to update issue status' });
    }
  }
);

export default router;
