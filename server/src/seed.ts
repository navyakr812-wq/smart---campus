import bcrypt from 'bcryptjs';
import { User } from './models/User';
import { Facility } from './models/Facility';
import { CheckIn } from './models/CheckIn';
import { Timetable } from './models/Timetable';
import { Issue } from './models/Issue';
import { Event } from './models/Event';
import { Attendance } from './models/Attendance';
import { Announcement } from './models/Announcement';
import { Notification } from './models/Notification';

export const DEMO_PASSWORD = 'CampusNow2026!';

export async function seedDemoDataIfRequired(): Promise<void> {
  const shouldSeed = process.env.SEED_DEMO === 'true';
  if (!shouldSeed) {
    console.log('[SEED] SEED_DEMO is not "true". Skipping demo seed.');
    return;
  }

  const existingUsersCount = await User.countDocuments();
  if (existingUsersCount > 0) {
    console.log(`[SEED] Database already contains ${existingUsersCount} users. Skipping demo seed.`);
    return;
  }

  console.log('[SEED] Starting demo database seed for CampusNow...');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // 1. Create Demo Users
  const [student, student2, faculty, admin] = await Promise.all([
    User.create({
      name: 'Alex Rivera',
      email: 'student@campus.test',
      passwordHash,
      role: 'STUDENT',
      studentId: 'CS-2023-042',
      department: 'Computer Science',
    }),
    User.create({
      name: 'Jordan Lee',
      email: 'student2@campus.test',
      passwordHash,
      role: 'STUDENT',
      studentId: 'CS-2023-088',
      department: 'Computer Science',
    }),
    User.create({
      name: 'Dr. Evelyn Reed',
      email: 'faculty@campus.test',
      passwordHash,
      role: 'FACULTY',
      department: 'Computer Science',
    }),
    User.create({
      name: 'Campus Administrator',
      email: 'admin@campus.test',
      passwordHash,
      role: 'ADMIN',
      department: 'Operations & Facilities',
    }),
  ]);

  console.log('[SEED] Users created:');
  console.log(' - student@campus.test (Alex Rivera)');
  console.log(' - student2@campus.test (Jordan Lee)');
  console.log(' - faculty@campus.test (Dr. Evelyn Reed)');
  console.log(' - admin@campus.test (Campus Administrator)');

  // 2. Create Facilities
  const facilities = await Facility.create([
    {
      name: 'Central Cafeteria',
      category: 'Cafeteria',
      location: 'Ground Floor, Student Union',
      capacity: 180,
      openingHours: '07:30 - 21:00',
      description: 'Hot meals, sandwiches, espresso bar, and communal seating.',
      icon: 'utensils',
    },
    {
      name: 'Main University Library',
      category: 'Library',
      location: 'Block A, 2nd & 3rd Floors',
      capacity: 320,
      openingHours: '08:00 - 23:00',
      description: 'Silent study carrels, research archives, and study pods.',
      icon: 'book-open',
    },
    {
      name: 'Tech Innovation Hub & Lab',
      category: 'Lab',
      location: 'Block C, Room 301',
      capacity: 65,
      openingHours: '08:30 - 22:00',
      description: 'High-performance workstations, dual monitors, and IoT benches.',
      icon: 'cpu',
    },
    {
      name: 'Recreation & Fitness Gym',
      category: 'Gym',
      location: 'Sports Complex, Ground Floor',
      capacity: 75,
      openingHours: '06:00 - 22:00',
      description: 'Cardio equipment, free weights, and stretching zones.',
      icon: 'dumbbell',
    },
    {
      name: '24/7 Silent Study Lounge',
      category: 'Lounge',
      location: 'Block A, 1st Floor East',
      capacity: 90,
      openingHours: '24 Hours',
      description: 'Sound-dampened individual study desks with power outlets.',
      icon: 'coffee',
    },
    {
      name: 'Engineering MakerSpace',
      category: 'Lab',
      location: 'Block B, Basement Wing',
      capacity: 40,
      openingHours: '09:00 - 20:00',
      description: '3D printers, laser cutters, and electronics soldering stations.',
      icon: 'wrench',
    },
  ]);

  // 3. Create Live Check-ins (within last 30 minutes to showcase weighted calculations)
  const now = new Date();
  const cafeteria = facilities.find(f => f.category === 'Cafeteria')!;
  const library = facilities.find(f => f.category === 'Library')!;
  const gym = facilities.find(f => f.category === 'Gym')!;

  await CheckIn.create([
    // Library: recent check-ins show EMPTY
    {
      facilityId: library._id,
      userId: student._id,
      level: 'EMPTY',
      timestamp: new Date(now.getTime() - 4 * 60 * 1000), // 4 mins ago (weight = 26/30)
    },
    {
      facilityId: library._id,
      userId: student2._id,
      level: 'EMPTY',
      timestamp: new Date(now.getTime() - 14 * 60 * 1000), // 14 mins ago
    },
    // Gym: moderate check-ins
    {
      facilityId: gym._id,
      userId: student._id,
      level: 'OKAY',
      timestamp: new Date(now.getTime() - 10 * 60 * 1000),
    },
    // Cafeteria: currently EMPTY / OKAY
    {
      facilityId: cafeteria._id,
      userId: student2._id,
      level: 'OKAY',
      timestamp: new Date(now.getTime() - 8 * 60 * 1000),
    },
    {
      facilityId: cafeteria._id,
      userId: student._id,
      level: 'EMPTY',
      timestamp: new Date(now.getTime() - 18 * 60 * 1000),
    },
  ]);

  // 4. Create Timetable (Covers Monday - Friday + Sunday fallback)
  const timetableEntries = [
    // Monday (1)
    {
      courseCode: 'CS301',
      courseName: 'Distributed Systems',
      facultyName: 'Dr. Evelyn Reed',
      facultyId: faculty._id,
      room: 'ROOM 204',
      building: 'Main Academic Block',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:30',
      department: 'Computer Science',
      semester: 5,
      studentIds: [student._id, student2._id],
    },
    {
      courseCode: 'CS304',
      courseName: 'Database Internals',
      facultyName: 'Dr. Evelyn Reed',
      facultyId: faculty._id,
      room: 'LAB 102',
      building: 'Block C',
      dayOfWeek: 1,
      startTime: '11:00',
      endTime: '12:30',
      department: 'Computer Science',
      semester: 5,
      studentIds: [student._id, student2._id],
    },
    {
      courseCode: 'CS308',
      courseName: 'Artificial Intelligence',
      facultyName: 'Dr. Alan Vance',
      room: 'ROOM 305',
      building: 'Main Academic Block',
      dayOfWeek: 1,
      startTime: '14:00',
      endTime: '15:30',
      department: 'Computer Science',
      semester: 5,
      studentIds: [student._id, student2._id],
    },
    // Tuesday (2)
    {
      courseCode: 'CS312',
      courseName: 'Web Architecture & Cloud',
      facultyName: 'Prof. Nathan Chen',
      room: 'ROOM 201',
      building: 'Main Academic Block',
      dayOfWeek: 2,
      startTime: '09:30',
      endTime: '11:00',
      department: 'Computer Science',
      semester: 5,
      studentIds: [student._id, student2._id],
    },
    {
      courseCode: 'CS301',
      courseName: 'Distributed Systems',
      facultyName: 'Dr. Evelyn Reed',
      facultyId: faculty._id,
      room: 'ROOM 204',
      building: 'Main Academic Block',
      dayOfWeek: 2,
      startTime: '11:30',
      endTime: '13:00',
      department: 'Computer Science',
      semester: 5,
      studentIds: [student._id, student2._id],
    },
    // Wednesday (3)
    {
      courseCode: 'CS304',
      courseName: 'Database Internals',
      facultyName: 'Dr. Evelyn Reed',
      facultyId: faculty._id,
      room: 'LAB 102',
      building: 'Block C',
      dayOfWeek: 3,
      startTime: '10:00',
      endTime: '11:30',
      department: 'Computer Science',
      semester: 5,
      studentIds: [student._id, student2._id],
    },
    {
      courseCode: 'CS315',
      courseName: 'Computer Networks',
      facultyName: 'Prof. Sarah Miller',
      room: 'ROOM 101',
      building: 'Main Academic Block',
      dayOfWeek: 3,
      startTime: '13:00',
      endTime: '14:30',
      department: 'Computer Science',
      semester: 5,
      studentIds: [student._id, student2._id],
    },
    // Thursday (4)
    {
      courseCode: 'CS308',
      courseName: 'Artificial Intelligence',
      facultyName: 'Dr. Alan Vance',
      room: 'ROOM 305',
      building: 'Main Academic Block',
      dayOfWeek: 4,
      startTime: '09:00',
      endTime: '10:30',
      department: 'Computer Science',
      semester: 5,
      studentIds: [student._id, student2._id],
    },
    {
      courseCode: 'CS301L',
      courseName: 'Distributed Systems Lab',
      facultyName: 'Dr. Evelyn Reed',
      facultyId: faculty._id,
      room: 'LAB 301',
      building: 'Block C',
      dayOfWeek: 4,
      startTime: '14:00',
      endTime: '16:00',
      department: 'Computer Science',
      semester: 5,
      studentIds: [student._id, student2._id],
    },
    // Friday (5)
    {
      courseCode: 'CS312',
      courseName: 'Web Architecture & Cloud',
      facultyName: 'Prof. Nathan Chen',
      room: 'ROOM 201',
      building: 'Main Academic Block',
      dayOfWeek: 5,
      startTime: '10:00',
      endTime: '11:30',
      department: 'Computer Science',
      semester: 5,
      studentIds: [student._id, student2._id],
    },
    {
      courseCode: 'CS320',
      courseName: 'Software Engineering Seminar',
      facultyName: 'Prof. Sarah Miller',
      room: 'SEMINAR HALL A',
      building: 'Auditorium Complex',
      dayOfWeek: 5,
      startTime: '13:00',
      endTime: '14:30',
      department: 'Computer Science',
      semester: 5,
      studentIds: [student._id, student2._id],
    },
    // Sunday (0) & Saturday (6) Weekend Schedule for hackathon demo versatility
    {
      courseCode: 'CS399',
      courseName: 'Hackathon Prep & Mentorship',
      facultyName: 'Dr. Evelyn Reed',
      facultyId: faculty._id,
      room: 'ROOM 204',
      building: 'Main Academic Block',
      dayOfWeek: 0,
      startTime: '10:00',
      endTime: '11:30',
      department: 'Computer Science',
      semester: 5,
      studentIds: [student._id, student2._id],
    },
    {
      courseCode: 'CS399',
      courseName: 'Hackathon Prep & Mentorship',
      facultyName: 'Dr. Evelyn Reed',
      facultyId: faculty._id,
      room: 'ROOM 204',
      building: 'Main Academic Block',
      dayOfWeek: 6,
      startTime: '10:00',
      endTime: '11:30',
      department: 'Computer Science',
      semester: 5,
      studentIds: [student._id, student2._id],
    },
  ];

  await Timetable.create(timetableEntries);

  // 5. Create Attendance Records for Alex Rivera (student)
  await Attendance.create([
    {
      studentId: student._id,
      subjectCode: 'CS301',
      subjectName: 'Distributed Systems',
      totalClasses: 25,
      attendedClasses: 22, // 88%
    },
    {
      studentId: student._id,
      subjectCode: 'CS304',
      subjectName: 'Database Internals',
      totalClasses: 24,
      attendedClasses: 18, // 75%
    },
    {
      studentId: student._id,
      subjectCode: 'CS308',
      subjectName: 'Artificial Intelligence',
      totalClasses: 26,
      attendedClasses: 24, // 92.3%
    },
    {
      studentId: student._id,
      subjectCode: 'CS312',
      subjectName: 'Web Architecture & Cloud',
      totalClasses: 22,
      attendedClasses: 15, // 68.1% - Low attendance trigger!
    },
    {
      studentId: student._id,
      subjectCode: 'CS315',
      subjectName: 'Computer Networks',
      totalClasses: 20,
      attendedClasses: 17, // 85%
    },
  ]);

  // Attendance for Jordan Lee (student2)
  await Attendance.create([
    {
      studentId: student2._id,
      subjectCode: 'CS301',
      subjectName: 'Distributed Systems',
      totalClasses: 25,
      attendedClasses: 23,
    },
    {
      studentId: student2._id,
      subjectCode: 'CS304',
      subjectName: 'Database Internals',
      totalClasses: 24,
      attendedClasses: 20,
    },
  ]);

  // 6. Create Campus Events
  await Event.create([
    {
      title: 'Campus Hackathon 2026 Kickoff',
      description: '36-hour sprint to build next-generation smart campus solutions with mentor reviews.',
      category: 'Tech',
      location: 'Tech Innovation Hub & Lab',
      startTime: new Date(Date.now() + 45 * 60 * 1000), // starts in 45m
      endTime: new Date(Date.now() + 6 * 3600 * 1000),
      capacity: 120,
      registeredUsers: [student._id],
      organizer: 'Computer Science Department',
    },
    {
      title: 'Industry Fireside: Distributed Systems at Scale',
      description: 'Guest speaker session on high-throughput microservices and event streaming.',
      category: 'Tech',
      location: 'Seminar Hall A',
      startTime: new Date(Date.now() + 3 * 3600 * 1000),
      endTime: new Date(Date.now() + 5 * 3600 * 1000),
      capacity: 80,
      registeredUsers: [student2._id],
      organizer: 'ACM Student Chapter',
    },
    {
      title: 'Inter-College Badminton Tournament',
      description: 'Annual campus doubles tournament. Open to all students and faculty.',
      category: 'Sports',
      location: 'Sports Complex Indoor Arena',
      startTime: new Date(Date.now() + 28 * 3600 * 1000),
      endTime: new Date(Date.now() + 34 * 3600 * 1000),
      capacity: 64,
      registeredUsers: [],
      organizer: 'Athletics Council',
    },
  ]);

  // 7. Create Announcements
  await Announcement.create([
    {
      title: 'Midterm Examination Schedule Released',
      content: 'The official schedule for fall midterms is now available on the academic portal. Review room assignments carefully.',
      category: 'Academic',
      authorId: faculty._id,
      authorName: 'Dr. Evelyn Reed',
      authorRole: 'FACULTY',
      priority: 'NORMAL',
    },
    {
      title: 'Scheduled Core WiFi Maintenance Tonight at 11 PM',
      content: 'IT Infrastructure will be upgrading central access point firmware between 11:00 PM and 01:00 AM. Expect brief connectivity pauses in Block A and B.',
      category: 'Urgent',
      authorId: admin._id,
      authorName: 'Campus Administrator',
      authorRole: 'ADMIN',
      priority: 'URGENT',
    },
    {
      title: 'Main Library 24/7 Hours Extended for Finals',
      content: 'Starting this week, floors 2 and 3 of the Main Library will remain open 24 hours with nighttime security badges required.',
      category: 'Administrative',
      authorId: admin._id,
      authorName: 'Campus Administrator',
      authorRole: 'ADMIN',
      priority: 'NORMAL',
    },
  ]);

  // 8. Create Issues
  await Issue.create([
    {
      title: 'Projector bulb flickering violently',
      description: 'During CS301 lectures, the ceiling projector turns black every 40 seconds.',
      category: 'Lab Equipment',
      location: 'Main Academic Block - Room 204',
      priority: 'HIGH',
      status: 'In Progress',
      reportedBy: student._id,
      upvoters: [student._id, student2._id],
    },
    {
      title: 'AC unit blowing warm air in 3rd Floor Quiet Zone',
      description: 'Temperature is above 28°C on the west side of the library, making focus difficult.',
      category: 'Infrastructure',
      location: 'Main University Library 3rd Floor',
      priority: 'MEDIUM',
      status: 'Reported',
      reportedBy: student2._id,
      upvoters: [student2._id, student._id],
    },
    {
      title: 'Drinking water dispenser out of order',
      description: 'Cold water tap is completely dry near the elevator bank.',
      category: 'Cleanliness',
      location: 'Block C 2nd Floor',
      priority: 'LOW',
      status: 'Assigned',
      reportedBy: student._id,
      upvoters: [student._id],
    },
  ]);

  // 9. Create Notifications
  await Notification.create([
    {
      userId: student._id,
      title: 'Welcome to CampusNow ⚡',
      message: 'Your live campus companion is ready. Check your next class and current crowd levels!',
      type: 'ANNOUNCEMENT',
      isRead: false,
    },
    {
      userId: student._id,
      title: 'Attendance Alert',
      message: 'Your attendance in CS312 is currently 68.1% (below the required 75%).',
      type: 'TIMETABLE',
      isRead: false,
      link: '/attendance',
    },
    {
      userId: student2._id,
      title: 'Welcome to CampusNow ⚡',
      message: 'Check live crowd levels and report campus issues with one tap.',
      type: 'ANNOUNCEMENT',
      isRead: false,
    },
  ]);

  console.log('[SEED] Demo database seeding completed successfully!');
}
