export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

export type CrowdLevel = 'EMPTY' | 'OKAY' | 'PACKED' | 'NO_DATA';

export type IssueStatus = 'Reported' | 'Assigned' | 'In Progress' | 'Resolved';

export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IssueCategory =
  | 'Infrastructure'
  | 'IT & WiFi'
  | 'Cleanliness'
  | 'Lab Equipment'
  | 'Library'
  | 'Cafeteria'
  | 'Other';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  department?: string;
  createdAt: string;
}

export interface FacilityCrowdStatus {
  facilityId: string;
  name: string;
  category: string;
  location: string;
  capacity: number;
  openingHours: string;
  description: string;
  icon?: string;
  crowdLevel: CrowdLevel;
  crowdScore: number | null;
  crowdPercentage: number | null;
  checkInCountLast30Min: number;
  lastCheckInAt: string | null;
  statusLabel: string;
}

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

export interface FreeRoomInfo {
  room: string;
  building: string;
  isFreeNow: boolean;
  freeUntil: string;
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

export interface Issue {
  _id: string;
  title: string;
  description: string;
  category: IssueCategory;
  location: string;
  priority: IssuePriority;
  status: IssueStatus;
  reportedBy: {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  upvoters: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface EventItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  startTime: string;
  endTime: string;
  capacity: number;
  registeredUsers: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  organizer: string;
  bannerUrl?: string;
}

export interface AttendanceRecord {
  _id: string;
  subjectCode: string;
  subjectName: string;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  isLow: boolean;
  classesNeededFor75: number;
}

export interface TimetableEntry {
  _id: string;
  courseCode: string;
  courseName: string;
  facultyName: string;
  room: string;
  building: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isCurrentClass: boolean;
  isNextClass: boolean;
}

export interface AnnouncementItem {
  _id: string;
  title: string;
  content: string;
  category: string;
  authorName: string;
  authorRole: UserRole;
  priority: 'NORMAL' | 'URGENT';
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface AnalyticsData {
  metrics: {
    studentCount: number;
    facultyCount: number;
    totalIssues: number;
    openIssues: number;
    resolvedIssues: number;
    reportedIssues: number;
    inProgressIssues: number;
    assignedIssues: number;
    resolutionRate: number;
    totalEvents: number;
    totalEventRegistrations: number;
    eventParticipationRate: number;
  };
  topCategories: Array<{ category: string; count: number }>;
  mostUpvotedIssues: Array<{
    _id: string;
    title: string;
    category: string;
    location: string;
    priority: string;
    status: string;
    upvotesCount: number;
    reportedBy: string;
    createdAt: string;
  }>;
  busiestFacilities: Array<{
    facilityId: string;
    name: string;
    category: string;
    totalCheckIns: number;
  }>;
  eventsSummary: Array<{
    _id: string;
    title: string;
    category: string;
    capacity: number;
    registeredCount: number;
    fillRate: number;
  }>;
}

export interface CampusAIMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  intent?: string;
  suggestedActions?: Array<{ label: string; action: string; payload?: any }>;
}
