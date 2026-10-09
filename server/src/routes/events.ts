import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Event } from '../models/Event';
import { Notification } from '../models/Notification';

const router = Router();

const createEventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  category: z.enum(['Tech', 'Cultural', 'Sports', 'Workshop', 'Career', 'Academic']),
  location: z.string().min(2),
  startTime: z.string(),
  endTime: z.string(),
  capacity: z.number().min(1).default(100),
  organizer: z.string().optional(),
});

// GET /api/events - List events with category filter
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, upcoming } = req.query;

    const query: any = {};
    if (category && category !== 'ALL') {
      query.category = category;
    }
    if (upcoming === 'true') {
      query.endTime = { $gte: new Date() };
    }

    const events = await Event.find(query)
      .sort({ startTime: 1 })
      .populate('registeredUsers', 'name email role');

    res.status(200).json(events);
  } catch (err: any) {
    console.error('[EVENTS ERROR] Failed to fetch events:', err);
    res.status(500).json({ error: 'Failed to retrieve events' });
  }
});

// POST /api/events/:id/register - Register user for an event
router.post('/:id/register', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const alreadyRegistered = event.registeredUsers.some(uid => uid.equals(userId));
    if (alreadyRegistered) {
      res.status(400).json({ error: 'You are already registered for this event' });
      return;
    }

    if (event.registeredUsers.length >= event.capacity) {
      res.status(400).json({ error: 'This event has reached full capacity' });
      return;
    }

    event.registeredUsers.push(userId);
    await event.save();

    // Create confirmation notification
    await Notification.create({
      userId,
      title: 'Event Registration Confirmed 🎉',
      message: `You are registered for "${event.title}" on ${new Date(event.startTime).toLocaleDateString()} at ${event.location}.`,
      type: 'EVENT_REMINDER',
      link: '/events',
    });

    await event.populate('registeredUsers', 'name email role');

    res.status(200).json({
      message: 'Successfully registered for event',
      event,
    });
  } catch (err: any) {
    console.error('[EVENTS ERROR] Registration failed:', err);
    res.status(500).json({ error: 'Failed to register for event' });
  }
});

// POST /api/events/:id/unregister - Cancel event registration
router.post('/:id/unregister', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    event.registeredUsers = event.registeredUsers.filter(uid => !uid.equals(userId));
    await event.save();
    await event.populate('registeredUsers', 'name email role');

    res.status(200).json({
      message: 'Registration cancelled',
      event,
    });
  } catch (err: any) {
    console.error('[EVENTS ERROR] Unregister failed:', err);
    res.status(500).json({ error: 'Failed to cancel registration' });
  }
});

// POST /api/events - Create event (Faculty or Admin only)
router.post(
  '/',
  authenticate,
  requireRole('FACULTY', 'ADMIN'),
  validate(createEventSchema),
  async (req: Request, res: Response) => {
    try {
      const { title, description, category, location, startTime, endTime, capacity, organizer } = req.body;

      const event = await Event.create({
        title,
        description,
        category,
        location,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        capacity,
        organizer: organizer || req.user!.name,
        registeredUsers: [],
      });

      res.status(201).json({
        message: 'Event created successfully',
        event,
      });
    } catch (err: any) {
      console.error('[EVENTS ERROR] Create event failed:', err);
      res.status(500).json({ error: 'Failed to create event' });
    }
  }
);

export default router;
