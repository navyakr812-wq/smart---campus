import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { Attendance } from '../models/Attendance';
import { Timetable } from '../models/Timetable';
import { parseTimeToMinutes } from '../services/roomFinderService';

const router = Router();

// GET /api/attendance - Subject-wise attendance from DB
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const records = await Attendance.find({ studentId: userId }).sort({ subjectCode: 1 });

    const formattedRecords = records.map(r => {
      const percentage = r.totalClasses > 0 ? Number(((r.attendedClasses / r.totalClasses) * 100).toFixed(1)) : 100;
      const isLow = percentage < 75;
      
      // Calculate how many more classes needed to reach 75%
      let classesNeededFor75 = 0;
      if (isLow) {
        // (attended + x) / (total + x) >= 0.75 => attended + x >= 0.75 total + 0.75 x => 0.25 x >= 0.75 total - attended
        const needed = (0.75 * r.totalClasses - r.attendedClasses) / 0.25;
        classesNeededFor75 = Math.max(0, Math.ceil(needed));
      }

      return {
        _id: r._id,
        subjectCode: r.subjectCode,
        subjectName: r.subjectName,
        totalClasses: r.totalClasses,
        attendedClasses: r.attendedClasses,
        percentage,
        isLow,
        classesNeededFor75,
      };
    });

    const overallAttended = records.reduce((acc, r) => acc + r.attendedClasses, 0);
    const overallTotal = records.reduce((acc, r) => acc + r.totalClasses, 0);
    const overallPercentage = overallTotal > 0 ? Number(((overallAttended / overallTotal) * 100).toFixed(1)) : 100;

    res.status(200).json({
      records: formattedRecords,
      overallAttended,
      overallTotal,
      overallPercentage,
      lowAttendanceCount: formattedRecords.filter(r => r.isLow).length,
    });
  } catch (err: any) {
    console.error('[ATTENDANCE ERROR] Failed to fetch attendance:', err);
    res.status(500).json({ error: 'Failed to retrieve attendance' });
  }
});

// GET /api/attendance/timetable - Weekly timetable with current class highlighted
router.get('/timetable', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { time, day } = req.query;

    const now = new Date();
    let currentDay = day !== undefined ? parseInt(day as string, 10) : now.getDay();
    // Default weekend fallback to Monday for rich schedule demo if no classes
    if (currentDay === 0 && day === undefined) {
      currentDay = 1;
    }

    let currentTimeStr = typeof time === 'string' ? time : undefined;
    if (!currentTimeStr) {
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      currentTimeStr = `${h}:${m}`;
    }

    const currentMinutes = parseTimeToMinutes(currentTimeStr);

    // Fetch all student timetable slots
    const entries = await Timetable.find({
      $or: [
        { studentIds: userId },
        { studentIds: { $size: 0 } },
        { studentIds: { $exists: false } },
      ],
    }).sort({ dayOfWeek: 1, startTime: 1 });

    const formattedEntries = entries.map(e => {
      const startMin = parseTimeToMinutes(e.startTime);
      const endMin = parseTimeToMinutes(e.endTime);
      
      const isToday = e.dayOfWeek === currentDay;
      const isCurrentClass = isToday && currentMinutes >= startMin && currentMinutes < endMin;
      const isNextClass = isToday && currentMinutes < startMin;

      return {
        _id: e._id,
        courseCode: e.courseCode,
        courseName: e.courseName,
        facultyName: e.facultyName,
        room: e.room,
        building: e.building,
        dayOfWeek: e.dayOfWeek,
        startTime: e.startTime,
        endTime: e.endTime,
        isCurrentClass,
        isNextClass,
      };
    });

    res.status(200).json({
      currentDay,
      currentTimeStr,
      timetable: formattedEntries,
    });
  } catch (err: any) {
    console.error('[TIMETABLE ERROR] Failed to fetch timetable:', err);
    res.status(500).json({ error: 'Failed to retrieve timetable' });
  }
});

export default router;
