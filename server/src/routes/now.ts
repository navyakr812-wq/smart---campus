import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { computeNowEngineState } from '../services/nowEngineService';

const router = Router();

// GET /api/now - Computes what student should do right now from DB
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { time, day } = req.query;

    const simulatedDay = day !== undefined ? parseInt(day as string, 10) : undefined;
    const simulatedTime = typeof time === 'string' ? time : undefined;

    const state = await computeNowEngineState({
      userId,
      dayOfWeek: simulatedDay,
      currentTimeStr: simulatedTime,
    });

    res.status(200).json(state);
  } catch (err: any) {
    console.error('[NOW ENGINE ERROR]', err);
    res.status(500).json({ error: 'Failed to compute Now Engine state' });
  }
});

export default router;
