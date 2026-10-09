import { Timetable, ITimetable } from '../models/Timetable';

export interface FreeRoomInfo {
  room: string;
  building: string;
  isFreeNow: boolean;
  freeUntil: string; // e.g. "11:30" or "End of Day (22:00)"
  minutesFree: number;
  currentClass: {
    courseCode: string;
    courseName: string;
    facultyName: string;
    endTime: string;
  } | null;
  nextClass: {
    courseCode: string;
    courseName: string;
    facultyName: string;
    startTime: string;
  } | null;
}

export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export async function findFreeRooms(options?: {
  dayOfWeek?: number;
  currentTimeStr?: string;
  minFreeMinutes?: number;
}): Promise<FreeRoomInfo[]> {
  const now = new Date();
  const dayOfWeek = options?.dayOfWeek ?? now.getDay();
  
  let currentTimeStr = options?.currentTimeStr;
  if (!currentTimeStr) {
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    currentTimeStr = `${hours}:${minutes}`;
  }

  const currentMinutes = parseTimeToMinutes(currentTimeStr);
  const closingMinutes = parseTimeToMinutes('22:00');

  // Discover all rooms registered across the campus timetables
  const allScheduledRooms = await Timetable.find().distinct('room');
  // Campus standard rooms fallback list
  const defaultRooms = [
    'ROOM 101', 'ROOM 102', 'ROOM 201', 'ROOM 204', 'ROOM 305',
    'LAB 102', 'LAB 301', 'SEMINAR HALL A', 'SEMINAR HALL B'
  ];
  
  const roomSet = new Set<string>([...allScheduledRooms, ...defaultRooms]);
  const roomList = Array.from(roomSet).sort();

  // Fetch all classes for the specified day
  const todayClasses: ITimetable[] = await Timetable.find({ dayOfWeek }).sort({ startTime: 1 });

  const freeRooms: FreeRoomInfo[] = [];

  for (const roomName of roomList) {
    const roomClasses = todayClasses.filter(c => c.room.toUpperCase() === roomName.toUpperCase());
    
    // Check if room is occupied right now
    const currentClass = roomClasses.find(c => {
      const startMin = parseTimeToMinutes(c.startTime);
      const endMin = parseTimeToMinutes(c.endTime);
      return currentMinutes >= startMin && currentMinutes < endMin;
    });

    // Find next upcoming class in this room today
    const upcomingClasses = roomClasses
      .filter(c => parseTimeToMinutes(c.startTime) > currentMinutes)
      .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

    const nextClass = upcomingClasses[0] || null;

    if (!currentClass) {
      // Room is FREE now!
      let minutesFree: number;
      let freeUntil: string;

      if (nextClass) {
        const nextStartMin = parseTimeToMinutes(nextClass.startTime);
        minutesFree = Math.max(0, nextStartMin - currentMinutes);
        freeUntil = nextClass.startTime;
      } else {
        // Free for the rest of the day until campus closing (22:00)
        minutesFree = Math.max(0, closingMinutes - currentMinutes);
        freeUntil = '22:00 (End of Day)';
      }

      const building = roomClasses[0]?.building || (roomName.includes('LAB') ? 'Block C' : 'Main Academic Block');

      if (!options?.minFreeMinutes || minutesFree >= options.minFreeMinutes) {
        freeRooms.push({
          room: roomName,
          building,
          isFreeNow: true,
          freeUntil,
          minutesFree,
          currentClass: null,
          nextClass: nextClass ? {
            courseCode: nextClass.courseCode,
            courseName: nextClass.courseName,
            facultyName: nextClass.facultyName,
            startTime: nextClass.startTime,
          } : null,
        });
      }
    } else {
      // Room is occupied right now, but we can compute when it becomes free
      const currentEndMin = parseTimeToMinutes(currentClass.endTime);
      const minutesUntilFree = Math.max(0, currentEndMin - currentMinutes);

      // Still record room status if user wants to see all room schedules
      freeRooms.push({
        room: roomName,
        building: currentClass.building || 'Main Academic Block',
        isFreeNow: false,
        freeUntil: `Occupied until ${currentClass.endTime}`,
        minutesFree: 0,
        currentClass: {
          courseCode: currentClass.courseCode,
          courseName: currentClass.courseName,
          facultyName: currentClass.facultyName,
          endTime: currentClass.endTime,
        },
        nextClass: nextClass ? {
          courseCode: nextClass.courseCode,
          courseName: nextClass.courseName,
          facultyName: nextClass.facultyName,
          startTime: nextClass.startTime,
        } : null,
      });
    }
  }

  // Sort: free rooms first, with longest free duration first
  freeRooms.sort((a, b) => {
    if (a.isFreeNow && !b.isFreeNow) return -1;
    if (!a.isFreeNow && b.isFreeNow) return 1;
    return b.minutesFree - a.minutesFree;
  });

  return freeRooms;
}
