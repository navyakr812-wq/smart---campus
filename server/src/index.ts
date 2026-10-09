import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/db';
import { seedDemoDataIfRequired } from './seed';

// Route handlers
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import nowRouter from './routes/now';
import crowdRouter from './routes/crowd';
import roomsRouter from './routes/rooms';
import issuesRouter from './routes/issues';
import eventsRouter from './routes/events';
import attendanceRouter from './routes/attendance';
import announcementsRouter from './routes/announcements';
import notificationsRouter from './routes/notifications';
import chatRouter from './routes/chat';
import analyticsRouter from './routes/analytics';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (!isProduction) {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[REQ] ${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/now', nowRouter);
app.use('/api/crowd', crowdRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/issues', issuesRouter);
app.use('/api/events', eventsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/analytics', analyticsRouter);

// Serve built React client in production
const possibleClientDistPaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(__dirname, '../client/dist'),
];

let clientDistPath = possibleClientDistPaths.find(p => fs.existsSync(p));

if (clientDistPath) {
  console.log(`[CLIENT] Serving static client build from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    // Avoid intercepting API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath!, 'index.html'));
  });
} else if (isProduction) {
  console.warn('[CLIENT WARNING] client/dist not found. Ensure "npm run build" ran before starting.');
}

// Global 404 for unmatched API routes
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[UNCAUGHT SERVER ERROR]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

// Bootstrap server
async function startServer() {
  try {
    await connectDB();
    await seedDemoDataIfRequired();

    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`⚡ CampusNow Web Service running on port ${PORT}`);
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⚡ API Health: http://localhost:${PORT}/api/health`);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('[FATAL] Server bootstrap failed:', error);
    process.exit(1);
  }
}

startServer();
