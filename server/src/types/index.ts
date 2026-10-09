export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

export type CrowdLevel = 'EMPTY' | 'OKAY' | 'PACKED';

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

export type EventCategory = 
  | 'Tech'
  | 'Cultural'
  | 'Sports'
  | 'Workshop'
  | 'Career'
  | 'Academic';

export type NotificationType = 
  | 'ISSUE_UPDATE'
  | 'ANNOUNCEMENT'
  | 'EVENT_REMINDER'
  | 'TIMETABLE';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}
