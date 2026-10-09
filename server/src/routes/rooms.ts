import { Router, Request, Response } from 'express';
import { findFreeRooms } from '../services/roomFinderService';

const router = Router();

// GET /api/rooms/free - List free rooms derived from timetable
router.get('/free', async (req: Request, res: Response) => {
  try {
    const { minMinutes, time, day } = req.query;

    const minFreeMinutes = minMinutes ? parseInt(minMinutes as string, 10) : undefined;
    const dayOfWeek = day !== undefined ? parseInt(day as string, 10) : undefined;
    const currentTimeStr = typeof time === 'string' ? time : undefined;

    const rooms = await findFreeRooms({
      minFreeMinutes,
      dayOfWeek,
      currentTimeStr,
    });

    const freeNowCount = rooms.filter(r => r.isFreeNow).length;
    const occupiedCount = rooms.filter(r => !r.isFreeNow).length;

    res.status(200).json({
      totalRooms: rooms.length,
      freeNowCount,
      occupiedCount,
      rooms,
    });
  } catch (err: any) {
    console.error('[ROOMS ERROR] Failed to fetch free rooms:', err);
    res.status(500).json({ error: 'Failed to compute free room availability' });
  }
});

export default router;
