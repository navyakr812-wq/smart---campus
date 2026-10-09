import mongoose from 'mongoose';
import { Timetable } from '../models/Timetable';
import { Attendance } from '../models/Attendance';
import { Event } from '../models/Event';
import { Facility } from '../models/Facility';
import { Issue } from '../models/Issue';
import { getAllFacilitiesWithCrowd } from './crowdService';
import { findFreeRooms } from './roomFinderService';
import { computeNowEngineState } from './nowEngineService';

export interface CampusAIResponse {
  answer: string;
  intent: string;
  engine: 'RULE_BASED_DATABASE_ENGINE';
  suggestedActions?: Array<{ label: string; action: string; payload?: any }>;
  data?: any;
}

/**
 * ============================================================================
 * PLUGGABLE REAL LLM ADAPTER HOOK
 * ============================================================================
 * To connect a real LLM (OpenAI GPT-4o, Google Gemini, Anthropic Claude):
 * 1. Set environment variable: LLM_API_KEY and LLM_PROVIDER
 * 2. Implement the call below. CampusNow's database retrieval context is already
 *    structured and can be injected directly into the LLM prompt.
 */
export async function queryRealLLM(systemPrompt: string, userMessage: string, dbContext: any): Promise<string | null> {
  // If an external LLM API key is not configured, we strictly return null to ensure
  // transparent execution of the deterministic database rule engine.
  // DO NOT fake AI.
  if (!process.env.LLM_API_KEY) {
    return null;
  }

  // Example integration placeholder:
  // const response = await fetch('https://api.openai.com/v1/chat/completions', { ... });
  return null;
}

/**
 * Main CampusAI Query Engine
 * Deterministic, truthful database-backed intelligence.
 */
export async function processCampusAIQuery(params: {
  userId: string | mongoose.Types.ObjectId;
  message: string;
  simulatedTime?: string;
  simulatedDay?: number;
}): Promise<CampusAIResponse> {
  const { userId, message, simulatedTime, simulatedDay } = params;
  const lowerMsg = message.toLowerCase().trim();

  // 1. Next Class or Schedule Query
  if (
    lowerMsg.includes('next class') ||
    lowerMsg.includes('next lecture') ||
    lowerMsg.includes('my schedule') ||
    lowerMsg.includes('what do i have next') ||
    lowerMsg.includes('timetable') ||
    lowerMsg.includes('current class')
  ) {
    const nowState = await computeNowEngineState({
      userId,
      dayOfWeek: simulatedDay,
      currentTimeStr: simulatedTime,
    });

    if (nowState.currentClass && lowerMsg.includes('current')) {
      return {
        answer: `You are currently in **${nowState.currentClass.courseCode}: ${nowState.currentClass.courseName}** in **${nowState.currentClass.room}** with **${nowState.currentClass.facultyName}**. It ends at ${nowState.currentClass.endTime} (${nowState.currentClass.minutesRemaining} minutes remaining).`,
        intent: 'CURRENT_CLASS',
        engine: 'RULE_BASED_DATABASE_ENGINE',
        data: nowState.currentClass,
        suggestedActions: [{ label: 'View Full Timetable', action: 'NAVIGATE', payload: 'timetable' }],
      };
    }

    if (nowState.nextClass) {
      return {
        answer: `Your next class is **${nowState.nextClass.courseCode} (${nowState.nextClass.courseName})** at **${nowState.nextClass.startTime}** in **${nowState.nextClass.room}** with ${nowState.nextClass.facultyName}. You have a **${nowState.nextClass.minutesUntilStart}-minute gap** before it starts.`,
        intent: 'NEXT_CLASS',
        engine: 'RULE_BASED_DATABASE_ENGINE',
        data: nowState.nextClass,
        suggestedActions: [
          { label: 'Check Free Study Rooms', action: 'NAVIGATE', payload: 'rooms' },
          { label: 'View Timetable', action: 'NAVIGATE', payload: 'timetable' },
        ],
      };
    }

    return {
      answer: `You have no more classes scheduled for ${nowState.dayName}! Your day is clear. You can explore upcoming campus events or find a quiet study spot in the library.`,
      intent: 'NEXT_CLASS_NONE',
      engine: 'RULE_BASED_DATABASE_ENGINE',
      suggestedActions: [
        { label: 'Explore Events', action: 'NAVIGATE', payload: 'events' },
        { label: 'Check Facilities', action: 'NAVIGATE', payload: 'crowd' },
      ],
    };
  }

  // 2. Attendance Query
  if (
    lowerMsg.includes('attendance') ||
    lowerMsg.includes('absent') ||
    lowerMsg.includes('shortage') ||
    lowerMsg.includes('percentage')
  ) {
    const attendanceRecords = await Attendance.find({ studentId: userId });

    if (attendanceRecords.length === 0) {
      return {
        answer: `No attendance records found for your student profile. If you recently enrolled, please contact the faculty coordinator.`,
        intent: 'ATTENDANCE_EMPTY',
        engine: 'RULE_BASED_DATABASE_ENGINE',
      };
    }

    const lowAttendance = attendanceRecords.filter(
      r => r.totalClasses > 0 && (r.attendedClasses / r.totalClasses) < 0.75
    );

    const summaryList = attendanceRecords
      .map(r => {
        const pct = r.totalClasses > 0 ? Math.round((r.attendedClasses / r.totalClasses) * 100) : 100;
        const alert = pct < 75 ? ' ⚠️ (Below 75% threshold!)' : ' ✅';
        return `• **${r.subjectCode}** (${r.subjectName}): ${pct}% (${r.attendedClasses}/${r.totalClasses} classes)${alert}`;
      })
      .join('\n');

    let answer = `Here is your verified attendance from the campus database:\n\n${summaryList}`;
    if (lowAttendance.length > 0) {
      answer += `\n\n⚠️ **Action Required**: You are below the 75% threshold in **${lowAttendance.map(l => l.subjectCode).join(', ')}**. Make sure to attend the upcoming sessions to maintain eligibility.`;
    } else {
      answer += `\n\n🎉 Great job! Your attendance is above 75% in all registered courses.`;
    }

    return {
      answer,
      intent: 'ATTENDANCE',
      engine: 'RULE_BASED_DATABASE_ENGINE',
      data: attendanceRecords,
      suggestedActions: [{ label: 'View Attendance Breakdown', action: 'NAVIGATE', payload: 'attendance' }],
    };
  }

  // 3. Free Room / Study Space Finder
  if (
    lowerMsg.includes('free room') ||
    lowerMsg.includes('empty room') ||
    lowerMsg.includes('study spot') ||
    lowerMsg.includes('empty classroom') ||
    lowerMsg.includes('where can i study')
  ) {
    const freeRooms = await findFreeRooms({
      currentTimeStr: simulatedTime,
      dayOfWeek: simulatedDay,
      minFreeMinutes: 30,
    });

    const openNow = freeRooms.filter(r => r.isFreeNow);

    if (openNow.length === 0) {
      return {
        answer: `All campus classrooms are currently occupied with scheduled lectures. You can visit the **Main Library Quiet Zone** or **24/7 Study Lounge** instead!`,
        intent: 'FREE_ROOMS_NONE',
        engine: 'RULE_BASED_DATABASE_ENGINE',
        suggestedActions: [{ label: 'Check Library Crowd', action: 'NAVIGATE', payload: 'crowd' }],
      };
    }

    const top3 = openNow.slice(0, 3);
    const roomList = top3
      .map(r => `• **${r.room}** (${r.building}): Free for the next **${r.minutesFree} minutes** (until ${r.freeUntil})`)
      .join('\n');

    return {
      answer: `Found **${openNow.length} classrooms free right now**:\n\n${roomList}\n\nWould you like to reserve or see all available rooms?`,
      intent: 'FREE_ROOMS',
      engine: 'RULE_BASED_DATABASE_ENGINE',
      data: top3,
      suggestedActions: [{ label: 'View Free Room Finder', action: 'NAVIGATE', payload: 'rooms' }],
    };
  }

  // 4. Live Crowd Query
  if (
    lowerMsg.includes('crowd') ||
    lowerMsg.includes('busy') ||
    lowerMsg.includes('packed') ||
    lowerMsg.includes('cafeteria') ||
    lowerMsg.includes('library') ||
    lowerMsg.includes('gym')
  ) {
    const facilities = await getAllFacilitiesWithCrowd();

    // Check if user specifically asked about cafeteria, library, or gym
    let target = facilities;
    if (lowerMsg.includes('cafeteria')) {
      target = facilities.filter(f => f.category === 'Cafeteria');
    } else if (lowerMsg.includes('library')) {
      target = facilities.filter(f => f.category === 'Library');
    } else if (lowerMsg.includes('gym')) {
      target = facilities.filter(f => f.category === 'Gym');
    }

    const report = target
      .map(f => {
        const crowdTxt = f.crowdLevel === 'NO_DATA' 
          ? 'No recent check-ins' 
          : `**${f.statusLabel}** (${f.checkInCountLast30Min} check-ins in last 30m)`;
        return `• **${f.name}**: ${crowdTxt}`;
      })
      .join('\n');

    return {
      answer: `Live crowd levels computed from verified student check-ins:\n\n${report}`,
      intent: 'CROWD_STATUS',
      engine: 'RULE_BASED_DATABASE_ENGINE',
      data: target,
      suggestedActions: [{ label: 'Check In to Facility', action: 'NAVIGATE', payload: 'crowd' }],
    };
  }

  // 5. Events Query
  if (
    lowerMsg.includes('event') ||
    lowerMsg.includes('workshop') ||
    lowerMsg.includes('hackathon') ||
    lowerMsg.includes('activity') ||
    lowerMsg.includes('what is happening')
  ) {
    const events = await Event.find({
      startTime: { $gte: new Date(Date.now() - 2 * 3600 * 1000) },
    }).sort({ startTime: 1 }).limit(4);

    if (events.length === 0) {
      return {
        answer: `There are no scheduled events on the campus calendar for today. Check back later for weekend club events!`,
        intent: 'EVENTS_NONE',
        engine: 'RULE_BASED_DATABASE_ENGINE',
      };
    }

    const eventList = events
      .map(e => {
        const time = new Date(e.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `• **${e.title}** (${e.category}) at ${time} in **${e.location}** [${e.registeredUsers.length}/${e.capacity} registered]`;
      })
      .join('\n');

    return {
      answer: `Upcoming campus events from the database:\n\n${eventList}`,
      intent: 'EVENTS',
      engine: 'RULE_BASED_DATABASE_ENGINE',
      data: events,
      suggestedActions: [{ label: 'Register for Events', action: 'NAVIGATE', payload: 'events' }],
    };
  }

  // 6. Navigation / Where is X
  if (
    lowerMsg.includes('where is') ||
    lowerMsg.includes('location of') ||
    lowerMsg.includes('how to find') ||
    lowerMsg.includes('how do i reach')
  ) {
    const facilities = await Facility.find();
    const queryTerm = lowerMsg.replace(/where is|location of|how to find|how do i reach|\?/g, '').trim();

    const matchedFacility = facilities.find(
      f => f.name.toLowerCase().includes(queryTerm) || f.category.toLowerCase().includes(queryTerm)
    );

    if (matchedFacility) {
      return {
        answer: `**${matchedFacility.name}** is located at **${matchedFacility.location}**. Operating hours: ${matchedFacility.openingHours}.`,
        intent: 'LOCATION_FACILITY',
        engine: 'RULE_BASED_DATABASE_ENGINE',
        data: matchedFacility,
      };
    }

    // Check classrooms
    const classMatch = await Timetable.findOne({
      room: { $regex: new RegExp(queryTerm, 'i') },
    });

    if (classMatch) {
      return {
        answer: `**${classMatch.room}** is located in **${classMatch.building || 'Main Academic Block'}**.`,
        intent: 'LOCATION_ROOM',
        engine: 'RULE_BASED_DATABASE_ENGINE',
      };
    }

    return {
      answer: `I could not locate "${queryTerm}" on campus. Try searching for "Main Library", "Central Cafeteria", "Gym", "Lab 102", or "Room 204".`,
      intent: 'LOCATION_NOT_FOUND',
      engine: 'RULE_BASED_DATABASE_ENGINE',
    };
  }

  // 7. Issues Query
  if (
    lowerMsg.includes('issue') ||
    lowerMsg.includes('complaint') ||
    lowerMsg.includes('broken') ||
    lowerMsg.includes('report')
  ) {
    const issues = await Issue.find({ status: { $ne: 'Resolved' } })
      .sort({ upvoters: -1 })
      .limit(3);

    const issuesList = issues
      .map(i => `• **${i.title}** at ${i.location} — ${i.status} (${i.upvoters.length} Me Too upvotes)`)
      .join('\n');

    return {
      answer: `You can report campus problems (WiFi, broken projectors, AC, cleanliness) with duplicate detection to avoid repeating complaints!\n\nTop active issues right now:\n${issuesList}`,
      intent: 'ISSUES',
      engine: 'RULE_BASED_DATABASE_ENGINE',
      suggestedActions: [{ label: 'Report / Upvote Issue', action: 'NAVIGATE', payload: 'issues' }],
    };
  }

  // Fallback: Helpful Overview
  return {
    answer: `Hi! I'm **CampusAI**, your real-time campus assistant powered by live database integration. I can answer questions like:
- *"What is my next class?"*
- *"What is my attendance in CS301?"*
- *"Find me a free room right now"*
- *"Is the cafeteria crowded?"*
- *"What events are happening today?"*
- *"Where is the Tech Lab?"*`,
    intent: 'HELP',
    engine: 'RULE_BASED_DATABASE_ENGINE',
    suggestedActions: [
      { label: 'Next Class', action: 'ASK', payload: 'What is my next class?' },
      { label: 'Free Rooms', action: 'ASK', payload: 'Find me a free room right now' },
      { label: 'Cafeteria Crowd', action: 'ASK', payload: 'How crowded is the cafeteria?' },
      { label: 'My Attendance', action: 'ASK', payload: 'What is my attendance?' },
    ],
  };
}
