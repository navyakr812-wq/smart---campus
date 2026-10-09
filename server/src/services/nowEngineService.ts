import mongoose from 'mongoose';
import { Timetable, ITimetable } from '../models/Timetable';
import { Event } from '../models/Event';
import { Attendance } from '../models/Attendance';
import { getAllFacilitiesWithCrowd, FacilityCrowdStatus } from './crowdService';
import { findFreeRooms, FreeRoomInfo, parseTimeToMinutes, minutesToTimeStr } from './roomFinderService';

export interface NowCard {
  id: string;
  rank: number;
  type: 'CURRENT_CLASS' | 'NEXT_CLASS' | 'STUDY_SPOT' | 'EVENT' | 'FOOD_BREAK' | 'FREE_ROOM' | 'ATTENDANCE_WARNING';
  priorityScore: number;
  title: string;
  subtitle: string;
  meta: string;
  badge: {
    label: string;
    variant: 'teal' | 'amber' | 'rose' | 'emerald' | 'indigo' | 'slate';
  };
  details: Record<string, any>;
  action?: {
    label: string;
    targetTab: string;
    param?: string;
  };
}

export interface NowEngineState {
  simulated: boolean;
  dayOfWeek: number;
  dayName: string;
  currentTimeStr: string;
  currentClass: {
    courseCode: string;
    courseName: string;
    facultyName: string;
    room: string;
    startTime: string;
    endTime: string;
    minutesRemaining: number;
  } | null;
  nextClass: {
    courseCode: string;
    courseName: string;
    facultyName: string;
    room: string;
    startTime: string;
    endTime: string;
    minutesUntilStart: number;
  } | null;
  gapMinutes: number;
  gapSummary: string;
  cards: NowCard[];
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function computeNowEngineState(options: {
  userId?: string | mongoose.Types.ObjectId;
  dayOfWeek?: number;
  currentTimeStr?: string;
}): Promise<NowEngineState> {
  const now = new Date();
  const isCustomTime = options.dayOfWeek !== undefined || options.currentTimeStr !== undefined;
  
  // Default to today or user specified
  let dayOfWeek = options.dayOfWeek !== undefined ? options.dayOfWeek : now.getDay();
  // If today is Sunday (0), default weekday fallback to Monday (1) for active schedule demo if no Sunday classes
  if (dayOfWeek === 0 && options.dayOfWeek === undefined) {
    dayOfWeek = 1;
  }

  let currentTimeStr = options.currentTimeStr;
  if (!currentTimeStr) {
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    currentTimeStr = `${hours}:${minutes}`;
  }

  const currentMinutes = parseTimeToMinutes(currentTimeStr);

  // 1. Fetch timetable for today
  let scheduleQuery: any = { dayOfWeek };
  if (options.userId) {
    scheduleQuery = {
      dayOfWeek,
      $or: [
        { studentIds: options.userId },
        { studentIds: { $size: 0 } },
        { studentIds: { $exists: false } },
      ],
    };
  }

  const todayClasses = await Timetable.find(scheduleQuery).sort({ startTime: 1 });

  // 2. Identify Current Class
  let currentClassObj: ITimetable | null = null;
  for (const c of todayClasses) {
    const start = parseTimeToMinutes(c.startTime);
    const end = parseTimeToMinutes(c.endTime);
    if (currentMinutes >= start && currentMinutes < end) {
      currentClassObj = c;
      break;
    }
  }

  // 3. Identify Next Class
  const upcomingClasses = todayClasses
    .filter(c => parseTimeToMinutes(c.startTime) > currentMinutes)
    .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
  const nextClassObj = upcomingClasses[0] || null;

  // Compute Gap
  let gapMinutes = 0;
  let gapSummary = '';

  if (currentClassObj && nextClassObj) {
    const currentEnd = parseTimeToMinutes(currentClassObj.endTime);
    const nextStart = parseTimeToMinutes(nextClassObj.startTime);
    gapMinutes = Math.max(0, nextStart - currentEnd);
    gapSummary = `${gapMinutes}m break between classes`;
  } else if (!currentClassObj && nextClassObj) {
    const nextStart = parseTimeToMinutes(nextClassObj.startTime);
    gapMinutes = Math.max(0, nextStart - currentMinutes);
    gapSummary = `${gapMinutes}m until next class starts`;
  } else if (currentClassObj && !nextClassObj) {
    const currentEnd = parseTimeToMinutes(currentClassObj.endTime);
    gapMinutes = Math.max(0, currentEnd - currentMinutes);
    gapSummary = `In last class of the day (${gapMinutes}m remaining)`;
  } else {
    gapMinutes = 240; // Done for the day
    gapSummary = 'No more classes scheduled today';
  }

  // 4. Fetch Live Data from DB
  const [facilityCrowds, freeRooms, upcomingEvents, lowAttendance] = await Promise.all([
    getAllFacilitiesWithCrowd(),
    findFreeRooms({ dayOfWeek, currentTimeStr, minFreeMinutes: 30 }),
    Event.find({
      startTime: {
        $gte: new Date(Date.now() - 2 * 3600 * 1000),
        $lte: new Date(Date.now() + 24 * 3600 * 1000),
      },
    }).sort({ startTime: 1 }).limit(3),
    options.userId ? Attendance.find({ studentId: options.userId, $expr: { $lt: ['$attendedClasses', { $multiply: ['$totalClasses', 0.75] }] } }) : [],
  ]);

  // 5. Generate and Rank Cards
  const candidateCards: Array<NowCard & { rawScore: number }> = [];

  // Card: Current Class
  if (currentClassObj) {
    const endMin = parseTimeToMinutes(currentClassObj.endTime);
    const remaining = Math.max(0, endMin - currentMinutes);
    candidateCards.push({
      id: 'card-current-class',
      rank: 1,
      type: 'CURRENT_CLASS',
      priorityScore: 100,
      rawScore: 100,
      title: `Current Class: ${currentClassObj.courseCode} — ${currentClassObj.courseName}`,
      subtitle: `In ${currentClassObj.room} with ${currentClassObj.facultyName}`,
      meta: `Ends at ${currentClassObj.endTime} (${remaining}m remaining)`,
      badge: { label: 'In Progress', variant: 'teal' },
      details: {
        room: currentClassObj.room,
        endTime: currentClassObj.endTime,
        faculty: currentClassObj.facultyName,
      },
      action: { label: 'View Timetable', targetTab: 'timetable' },
    });
  }

  // Card: Next Class
  if (nextClassObj) {
    const startMin = parseTimeToMinutes(nextClassObj.startTime);
    const minutesUntil = Math.max(0, startMin - currentMinutes);
    
    // Higher priority when class is imminent
    const score = minutesUntil <= 15 ? 95 : minutesUntil <= 45 ? 80 : 60;
    const badgeVariant = minutesUntil <= 15 ? 'rose' : minutesUntil <= 45 ? 'amber' : 'indigo';

    candidateCards.push({
      id: 'card-next-class',
      rank: 2,
      type: 'NEXT_CLASS',
      priorityScore: score,
      rawScore: score,
      title: `Next Class: ${nextClassObj.courseCode} (${nextClassObj.courseName})`,
      subtitle: `Starts at ${nextClassObj.startTime} in ${nextClassObj.room}`,
      meta: minutesUntil <= 15 ? `⚠️ Starting in ${minutesUntil} min! Head over now.` : `Starts in ${minutesUntil} minutes`,
      badge: {
        label: minutesUntil <= 15 ? `Starts in ${minutesUntil}m` : `Next at ${nextClassObj.startTime}`,
        variant: badgeVariant,
      },
      details: {
        room: nextClassObj.room,
        startTime: nextClassObj.startTime,
        faculty: nextClassObj.facultyName,
        minutesUntil,
      },
      action: { label: 'View Schedule', targetTab: 'timetable' },
    });
  }

  // Card: Study Spot from Facility Crowd
  const quietFacilities = facilityCrowds
    .filter(f => f.category === 'Library' || f.category === 'Lounge' || f.category === 'Lab')
    .sort((a, b) => (a.crowdScore || 99) - (b.crowdScore || 99));

  if (quietFacilities.length > 0) {
    const bestSpot = quietFacilities[0];
    const isQuiet = bestSpot.crowdLevel === 'EMPTY' || bestSpot.crowdLevel === 'NO_DATA';
    const score = gapMinutes >= 30 ? 75 : 40;

    candidateCards.push({
      id: `card-spot-${bestSpot.facilityId}`,
      rank: 3,
      type: 'STUDY_SPOT',
      priorityScore: score,
      rawScore: score,
      title: `Study Spot: ${bestSpot.name}`,
      subtitle: `${bestSpot.location} • ${bestSpot.statusLabel}`,
      meta: bestSpot.checkInCountLast30Min > 0 
        ? `${bestSpot.checkInCountLast30Min} check-ins in last 30m` 
        : 'Open and comfortable for focused study',
      badge: {
        label: bestSpot.crowdLevel === 'EMPTY' ? 'Quiet Spot' : bestSpot.crowdLevel === 'OKAY' ? 'Moderate' : 'Busy',
        variant: isQuiet ? 'emerald' : 'amber',
      },
      details: {
        facilityId: bestSpot.facilityId,
        crowdLevel: bestSpot.crowdLevel,
        crowdPercentage: bestSpot.crowdPercentage,
      },
      action: { label: 'View Crowd', targetTab: 'crowd' },
    });
  }

  // Card: Cafeteria / Food Break
  const cafeteria = facilityCrowds.find(f => f.category === 'Cafeteria');
  if (cafeteria && gapMinutes >= 25) {
    const isGoodTimeToEat = cafeteria.crowdLevel === 'EMPTY' || cafeteria.crowdLevel === 'OKAY';
    candidateCards.push({
      id: 'card-cafeteria',
      rank: 4,
      type: 'FOOD_BREAK',
      priorityScore: isGoodTimeToEat ? 70 : 50,
      rawScore: isGoodTimeToEat ? 70 : 50,
      title: `Food & Snacks: ${cafeteria.name}`,
      subtitle: `Crowd: ${cafeteria.statusLabel}`,
      meta: cafeteria.crowdLevel === 'EMPTY' ? 'Zero line right now! Ideal for a quick bite.' : 'Great window during your gap.',
      badge: {
        label: cafeteria.crowdLevel === 'EMPTY' ? 'No Queue' : cafeteria.crowdLevel === 'OKAY' ? 'Normal Wait' : 'Packed',
        variant: cafeteria.crowdLevel === 'EMPTY' ? 'emerald' : cafeteria.crowdLevel === 'OKAY' ? 'teal' : 'rose',
      },
      details: {
        facilityId: cafeteria.facilityId,
        crowdLevel: cafeteria.crowdLevel,
      },
      action: { label: 'Check In', targetTab: 'crowd' },
    });
  }

  // Card: Free Room Finder Suggestion
  const openRooms = freeRooms.filter(r => r.isFreeNow && r.minutesFree >= 45);
  if (openRooms.length > 0 && gapMinutes >= 30) {
    const topRoom = openRooms[0];
    candidateCards.push({
      id: `card-room-${topRoom.room}`,
      rank: 5,
      type: 'FREE_ROOM',
      priorityScore: 65,
      rawScore: 65,
      title: `Free Classroom: ${topRoom.room}`,
      subtitle: `${topRoom.building} • Free for next ${topRoom.minutesFree} min`,
      meta: `Free until ${topRoom.freeUntil}. Great for group work or solo prep.`,
      badge: { label: `Free for ${topRoom.minutesFree}m`, variant: 'teal' },
      details: topRoom,
      action: { label: 'Find Rooms', targetTab: 'rooms' },
    });
  }

  // Card: Upcoming Event
  if (upcomingEvents.length > 0) {
    const firstEvent = upcomingEvents[0];
    const eventTime = new Date(firstEvent.startTime);
    const diffMinutes = Math.round((eventTime.getTime() - now.getTime()) / (60 * 1000));
    const timeText = diffMinutes > 0 && diffMinutes <= 120 
      ? `Starting in ${diffMinutes} min` 
      : `${eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    candidateCards.push({
      id: `card-event-${firstEvent._id}`,
      rank: 6,
      type: 'EVENT',
      priorityScore: (diffMinutes > 0 && diffMinutes <= 90) ? 72 : 55,
      rawScore: (diffMinutes > 0 && diffMinutes <= 90) ? 72 : 55,
      title: `Campus Event: ${firstEvent.title}`,
      subtitle: `${firstEvent.location} • ${timeText}`,
      meta: `${firstEvent.category} • ${firstEvent.registeredUsers.length}/${firstEvent.capacity} spots filled`,
      badge: { label: timeText, variant: 'indigo' },
      details: {
        eventId: firstEvent._id.toString(),
        title: firstEvent.title,
        registeredCount: firstEvent.registeredUsers.length,
      },
      action: { label: 'View Event', targetTab: 'events' },
    });
  }

  // Card: Attendance Warning (if user is below 75% in any subject)
  if (lowAttendance && lowAttendance.length > 0) {
    const criticalSubject = lowAttendance[0];
    const pct = Math.round((criticalSubject.attendedClasses / criticalSubject.totalClasses) * 100);
    candidateCards.push({
      id: 'card-attendance-alert',
      rank: 7,
      type: 'ATTENDANCE_WARNING',
      priorityScore: 88,
      rawScore: 88,
      title: `Attendance Alert: ${criticalSubject.subjectCode} (${pct}%)`,
      subtitle: `${criticalSubject.attendedClasses}/${criticalSubject.totalClasses} classes attended`,
      meta: `Requires >= 75% attendance to qualify for examinations!`,
      badge: { label: `${pct}% (Low)`, variant: 'rose' },
      details: {
        subjectCode: criticalSubject.subjectCode,
        percentage: pct,
      },
      action: { label: 'View Attendance', targetTab: 'attendance' },
    });
  }

  // Sort candidate cards by raw score descending, then assign 1..N rank
  candidateCards.sort((a, b) => b.rawScore - a.rawScore);
  const rankedCards: NowCard[] = candidateCards.map((card, idx) => ({
    ...card,
    rank: idx + 1,
  }));

  return {
    simulated: isCustomTime,
    dayOfWeek,
    dayName: DAY_NAMES[dayOfWeek],
    currentTimeStr,
    currentClass: currentClassObj ? {
      courseCode: currentClassObj.courseCode,
      courseName: currentClassObj.courseName,
      facultyName: currentClassObj.facultyName,
      room: currentClassObj.room,
      startTime: currentClassObj.startTime,
      endTime: currentClassObj.endTime,
      minutesRemaining: Math.max(0, parseTimeToMinutes(currentClassObj.endTime) - currentMinutes),
    } : null,
    nextClass: nextClassObj ? {
      courseCode: nextClassObj.courseCode,
      courseName: nextClassObj.courseName,
      facultyName: nextClassObj.facultyName,
      room: nextClassObj.room,
      startTime: nextClassObj.startTime,
      endTime: nextClassObj.endTime,
      minutesUntilStart: Math.max(0, parseTimeToMinutes(nextClassObj.startTime) - currentMinutes),
    } : null,
    gapMinutes,
    gapSummary,
    cards: rankedCards,
  };
}
