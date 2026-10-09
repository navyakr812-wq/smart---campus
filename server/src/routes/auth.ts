import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User';
import { authenticate, generateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  studentId: z.string().optional(),
  department: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/register - Public signup ALWAYS creates STUDENT only
router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { name, email, password, studentId, department } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Explicitly enforce role as STUDENT regardless of any request body inputs
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'STUDENT',
      studentId,
      department: department || 'General Studies',
    });

    const token = generateToken({
      id: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    res.status(201).json({
      message: 'Account successfully registered',
      token,
      user: newUser.toJSON(),
    });
  } catch (err: any) {
    console.error('[AUTH ERROR] Register failed:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: user.toJSON(),
    });
  } catch (err: any) {
    console.error('[AUTH ERROR] Login failed:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// GET /api/auth/me - Return authenticated user profile
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ user: user.toJSON() });
  } catch (err: any) {
    console.error('[AUTH ERROR] /me failed:', err);
    res.status(500).json({ error: 'Failed to retrieve user profile' });
  }
});

export default router;
