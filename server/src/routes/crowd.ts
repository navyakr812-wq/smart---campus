import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CheckIn } from '../models/CheckIn';
import { Facility } from '../models/Facility';
import {
  getAllFacilitiesWithCrowd,
  calculateFacilityCrowd,
  checkRateLimit,
} from '../services/crowdService';

const router = Router();

const checkInSchema = z.object({
  facilityId: z.string().min(1, 'Facility ID is required'),
  level: z.enum(['EMPTY', 'OKAY', 'PACKED']),
});

// GET /api/crowd - All facilities with computed live crowd levels
router.get('/', async (_req: Request, res: Response) => {
  try {
    const facilities = await getAllFacilitiesWithCrowd();
    res.status(200).json(facilities);
  } catch (err: any) {
    console.error('[CROWD ERROR] Failed to fetch facilities:', err);
    res.status(500).json({ error: 'Failed to fetch crowd statuses' });
  }
});

// GET /api/crowd/:facilityId - Single facility crowd level
router.get('/:facilityId', async (req: Request, res: Response) => {
  try {
    const facilityId = req.params.facilityId as string;
    const facility = await Facility.findById(facilityId);
    if (!facility) {
      res.status(404).json({ error: 'Facility not found' });
      return;
    }

    const crowd = await calculateFacilityCrowd(facilityId);
    res.status(200).json({
      facility,
      ...crowd,
    });
  } catch (err: any) {
    console.error('[CROWD ERROR] Failed to fetch facility crowd:', err);
    res.status(500).json({ error: 'Failed to fetch facility crowd' });
  }
});

// POST /api/crowd/checkin - Submit 1-tap check-in with 5-minute rate limit
router.post('/checkin', authenticate, validate(checkInSchema), async (req: Request, res: Response) => {
  try {
    const { facilityId, level } = req.body;
    const userId = req.user!.id;

    const facility = await Facility.findById(facilityId);
    if (!facility) {
      res.status(404).json({ error: 'Facility not found' });
      return;
    }

    // Rate limit: 1 check-in per user per facility per 5 minutes
    const rateLimit = await checkRateLimit(facilityId, userId);
    if (!rateLimit.allowed) {
      res.status(429).json({
        error: `Rate limit reached. You can check in again in ${rateLimit.remainingSeconds} seconds.`,
        remainingSeconds: rateLimit.remainingSeconds,
      });
      return;
    }

    // Save check-in
    const newCheckIn = await CheckIn.create({
      facilityId,
      userId,
      level,
      timestamp: new Date(),
    });

    // Recompute weighted crowd for the facility
    const updatedCrowd = await calculateFacilityCrowd(facilityId);

    res.status(201).json({
      message: `Checked in as "${level}" at ${facility.name}`,
      checkIn: newCheckIn,
      updatedCrowd,
    });
  } catch (err: any) {
    console.error('[CROWD ERROR] Check-in failed:', err);
    res.status(500).json({ error: 'Failed to record check-in' });
  }
});

// GET /api/crowd/:facilityId/recent - Recent check-ins list
router.get('/:facilityId/recent', async (req: Request, res: Response) => {
  try {
    const { facilityId } = req.params;
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const checkIns = await CheckIn.find({
      facilityId,
      timestamp: { $gte: thirtyMinutesAgo },
    })
      .sort({ timestamp: -1 })
      .populate('userId', 'name role')
      .limit(20);

    res.status(200).json(checkIns);
  } catch (err: any) {
    console.error('[CROWD ERROR] Recent check-ins failed:', err);
    res.status(500).json({ error: 'Failed to fetch recent check-ins' });
  }
});

export default router;
