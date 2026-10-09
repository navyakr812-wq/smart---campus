import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Announcement } from '../models/Announcement';
import { Notification } from '../models/Notification';
import { User } from '../models/User';

const router = Router();

const createAnnouncementSchema = z.object({
  title: z.string().min(4, 'Title must be at least 4 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  category: z.enum(['Academic', 'Administrative', 'Events', 'Urgent', 'General']).default('General'),
  priority: z.enum(['NORMAL', 'URGENT']).default('NORMAL'),
});

// GET /api/announcements - List announcements
router.get('/', async (_req: Request, res: Response) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate('authorId', 'name role department');

    res.status(200).json(announcements);
  } catch (err: any) {
    console.error('[ANNOUNCEMENTS ERROR] Failed to fetch announcements:', err);
    res.status(500).json({ error: 'Failed to retrieve announcements' });
  }
});

// POST /api/announcements - Admin and Faculty can post announcements
router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'FACULTY'),
  validate(createAnnouncementSchema),
  async (req: Request, res: Response) => {
    try {
      const { title, content, category, priority } = req.body;
      const user = req.user!;

      const announcement = await Announcement.create({
        title,
        content,
        category,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        priority,
      });

      // Broadcast notification to all students
      const students = await User.find({ role: 'STUDENT' }, '_id');
      if (students.length > 0) {
        const notifications = students.map(s => ({
          userId: s._id,
          title: priority === 'URGENT' ? `🚨 Urgent Announcement: ${title}` : `📢 New Announcement: ${title}`,
          message: content.length > 120 ? content.slice(0, 117) + '...' : content,
          type: 'ANNOUNCEMENT' as const,
          link: '/announcements',
        }));
        await Notification.insertMany(notifications);
      }

      res.status(201).json({
        message: 'Announcement published and broadcast to students',
        announcement,
      });
    } catch (err: any) {
      console.error('[ANNOUNCEMENTS ERROR] Failed to create announcement:', err);
      res.status(500).json({ error: 'Failed to post announcement' });
    }
  }
);

export default router;
