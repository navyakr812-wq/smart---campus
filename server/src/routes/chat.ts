import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { processCampusAIQuery } from '../services/campusAIService';

const router = Router();

const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  simulatedTime: z.string().optional(),
  simulatedDay: z.number().optional(),
});

// POST /api/chat - Query CampusAI assistant
router.post('/', authenticate, validate(chatMessageSchema), async (req: Request, res: Response) => {
  try {
    const { message, simulatedTime, simulatedDay } = req.body;
    const userId = req.user!.id;

    const response = await processCampusAIQuery({
      userId,
      message,
      simulatedTime,
      simulatedDay,
    });

    res.status(200).json(response);
  } catch (err: any) {
    console.error('[CAMPUS AI ERROR] Chat error:', err);
    res.status(500).json({ error: 'Failed to process AI chat query' });
  }
});

export default router;
