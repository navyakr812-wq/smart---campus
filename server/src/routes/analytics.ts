import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { User } from '../models/User';
import { Issue } from '../models/Issue';
import { Event } from '../models/Event';
import { CheckIn } from '../models/CheckIn';
import { Facility } from '../models/Facility';

const router = Router();

// GET /api/analytics - Admin analytics dashboard (All from DB)
router.get('/', authenticate, requireRole('ADMIN'), async (_req: Request, res: Response) => {
  try {
    const [
      studentCount,
      facultyCount,
      totalIssues,
      resolvedIssues,
      reportedIssues,
      inProgressIssues,
      assignedIssues,
      topCategoriesAgg,
      mostUpvotedIssues,
      events,
      checkInsByFacilityAgg,
      facilities,
    ] = await Promise.all([
      User.countDocuments({ role: 'STUDENT' }),
      User.countDocuments({ role: 'FACULTY' }),
      Issue.countDocuments(),
      Issue.countDocuments({ status: 'Resolved' }),
      Issue.countDocuments({ status: 'Reported' }),
      Issue.countDocuments({ status: 'In Progress' }),
      Issue.countDocuments({ status: 'Assigned' }),
      Issue.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Issue.find()
        .sort({ upvoters: -1 })
        .limit(5)
        .populate('reportedBy', 'name email'),
      Event.find().sort({ startTime: -1 }),
      CheckIn.aggregate([
        { $group: { _id: '$facilityId', totalCheckIns: { $sum: 1 } } },
        { $sort: { totalCheckIns: -1 } },
        { $limit: 10 },
      ]),
      Facility.find(),
    ]);

    const openIssues = totalIssues - resolvedIssues;
    const resolutionRate = totalIssues > 0 ? Number(((resolvedIssues / totalIssues) * 100).toFixed(1)) : 0;

    // Map facility names to check-in counts
    const facilityMap = new Map(facilities.map(f => [f._id.toString(), f]));
    const busiestFacilities = checkInsByFacilityAgg.map(agg => {
      const facility = facilityMap.get(agg._id.toString());
      return {
        facilityId: agg._id,
        name: facility?.name || 'Unknown Facility',
        category: facility?.category || 'General',
        totalCheckIns: agg.totalCheckIns,
      };
    });

    // Also include facilities with 0 check-ins if fewer than 5
    for (const f of facilities) {
      if (!busiestFacilities.some(bf => bf.facilityId.toString() === f._id.toString())) {
        busiestFacilities.push({
          facilityId: f._id,
          name: f.name,
          category: f.category,
          totalCheckIns: 0,
        });
      }
    }

    // Event participation stats
    const totalEventCapacity = events.reduce((sum, e) => sum + e.capacity, 0);
    const totalEventRegistrations = events.reduce((sum, e) => sum + e.registeredUsers.length, 0);
    const eventParticipationRate = totalEventCapacity > 0 ? Number(((totalEventRegistrations / totalEventCapacity) * 100).toFixed(1)) : 0;

    const eventDetails = events.map(e => ({
      _id: e._id,
      title: e.title,
      category: e.category,
      capacity: e.capacity,
      registeredCount: e.registeredUsers.length,
      fillRate: e.capacity > 0 ? Math.round((e.registeredUsers.length / e.capacity) * 100) : 0,
    }));

    res.status(200).json({
      metrics: {
        studentCount,
        facultyCount,
        totalIssues,
        openIssues,
        resolvedIssues,
        reportedIssues,
        inProgressIssues,
        assignedIssues,
        resolutionRate,
        totalEvents: events.length,
        totalEventRegistrations,
        eventParticipationRate,
      },
      topCategories: topCategoriesAgg.map(c => ({ category: c._id, count: c.count })),
      mostUpvotedIssues: mostUpvotedIssues.map(i => ({
        _id: i._id,
        title: i.title,
        category: i.category,
        location: i.location,
        priority: i.priority,
        status: i.status,
        upvotesCount: i.upvoters.length,
        reportedBy: (i.reportedBy as any)?.name || 'Student',
        createdAt: i.createdAt,
      })),
      busiestFacilities: busiestFacilities.sort((a, b) => b.totalCheckIns - a.totalCheckIns),
      eventsSummary: eventDetails,
    });
  } catch (err: any) {
    console.error('[ANALYTICS ERROR]', err);
    res.status(500).json({ error: 'Failed to generate admin analytics' });
  }
});

export default router;
