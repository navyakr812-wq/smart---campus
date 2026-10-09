import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { Notification } from '../models/Notification';

const router = Router();

// GET /api/notifications - User's notifications list
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    console.error('[NOTIFICATIONS ERROR]', err);
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.status(200).json({
      notification,
      unreadCount,
    });
  } catch (err: any) {
    console.error('[NOTIFICATIONS ERROR]', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// POST /api/notifications/read-all - Mark all user's notifications as read
router.post('/read-all', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });

    res.status(200).json({
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (err: any) {
    console.error('[NOTIFICATIONS ERROR]', err);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

export default router;
