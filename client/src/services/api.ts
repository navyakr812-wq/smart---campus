const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('campusnow_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data: any = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new ApiError(errorMsg, response.status, data);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (payload: { name: string; email: string; password: string; studentId?: string; department?: string }) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request<{ user: any }>('/auth/me'),

  // Now Engine
  getNowEngine: (params?: { time?: string; day?: number }) => {
    const query = new URLSearchParams();
    if (params?.time) query.set('time', params.time);
    if (params?.day !== undefined) query.set('day', params.day.toString());
    const qs = query.toString();
    return request<any>(`/now${qs ? `?${qs}` : ''}`);
  },

  // Crowd
  getCrowdFacilities: () => request<any[]>('/crowd'),
  
  checkIn: (facilityId: string, level: 'EMPTY' | 'OKAY' | 'PACKED') =>
    request<any>('/crowd/checkin', {
      method: 'POST',
      body: JSON.stringify({ facilityId, level }),
    }),

  getFacilityRecentCheckIns: (facilityId: string) =>
    request<any[]>(`/crowd/${facilityId}/recent`),

  // Free Rooms
  getFreeRooms: (params?: { minMinutes?: number; time?: string; day?: number }) => {
    const query = new URLSearchParams();
    if (params?.minMinutes) query.set('minMinutes', params.minMinutes.toString());
    if (params?.time) query.set('time', params.time);
    if (params?.day !== undefined) query.set('day', params.day.toString());
    const qs = query.toString();
    return request<any>(`/rooms/free${qs ? `?${qs}` : ''}`);
  },

  // Issues
  getIssues: (params?: { status?: string; category?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.category) query.set('category', params.category);
    const qs = query.toString();
    return request<any[]>(`/issues${qs ? `?${qs}` : ''}`);
  },

  checkDuplicateIssue: (payload: { title: string; category: string; location: string; description?: string }) =>
    request<any>('/issues/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createIssue: (payload: {
    title: string;
    description: string;
    category: string;
    location: string;
    priority: string;
    forceCreate?: boolean;
  }) =>
    request<any>('/issues', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  upvoteIssue: (id: string) =>
    request<any>(`/issues/${id}/upvote`, {
      method: 'POST',
    }),

  updateIssueStatus: (id: string, status: string, comment?: string) =>
    request<any>(`/issues/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, comment }),
    }),

  // Events
  getEvents: (params?: { category?: string; upcoming?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.upcoming) query.set('upcoming', 'true');
    const qs = query.toString();
    return request<any[]>(`/events${qs ? `?${qs}` : ''}`);
  },

  registerEvent: (id: string) =>
    request<any>(`/events/${id}/register`, {
      method: 'POST',
    }),

  unregisterEvent: (id: string) =>
    request<any>(`/events/${id}/unregister`, {
      method: 'POST',
    }),

  // Attendance & Timetable
  getAttendance: () => request<any>('/attendance'),
  
  getTimetable: (params?: { time?: string; day?: number }) => {
    const query = new URLSearchParams();
    if (params?.time) query.set('time', params.time);
    if (params?.day !== undefined) query.set('day', params.day.toString());
    const qs = query.toString();
    return request<any>(`/attendance/timetable${qs ? `?${qs}` : ''}`);
  },

  // Announcements
  getAnnouncements: () => request<any[]>('/announcements'),

  createAnnouncement: (payload: { title: string; content: string; category: string; priority: string }) =>
    request<any>('/announcements', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Notifications
  getNotifications: () => request<{ notifications: any[]; unreadCount: number }>('/notifications'),

  markNotificationRead: (id: string) =>
    request<any>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllNotificationsRead: () =>
    request<any>('/notifications/read-all', {
      method: 'POST',
    }),

  // Chat
  sendChatMessage: (payload: { message: string; simulatedTime?: string; simulatedDay?: number }) =>
    request<any>('/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Analytics
  getAnalytics: () => request<any>('/analytics'),

  // Health
  getHealth: () => request<any>('/health'),
};
