import bcrypt from 'bcryptjs';
import { User, Attendance, Timetable, Announcement, Event, Facility } from './models.js';

// Demo data only. Loaded when SEED_DEMO=true and the database has no users.
export async function seedDemo() {
  if (await User.countDocuments()) return;
  const pw = await bcrypt.hash('Demo@1234', 10);
  const [admin, faculty, student] = await User.create([
    { name: 'Campus Admin', email: 'admin@campus.test', password: pw, role: 'ADMIN' },
    { name: 'Dr. Rao', email: 'faculty@campus.test', password: pw, role: 'FACULTY' },
    { name: 'Asha Student', email: 'student@campus.test', password: pw, role: 'STUDENT' },
  ]);
  await Attendance.create([['Data Structures', 22, 25], ['DBMS', 23, 25], ['Operating Systems', 17, 21], ['Mathematics', 18, 20]].map(([subject, present, total]) => ({ student: student._id, subject, present, total })));
  const subjects = [['Data Structures', 'Dr. Rao', 'CS-101'], ['DBMS', 'Prof. Iyer', 'CS-204'], ['Operating Systems', 'Dr. Khan', 'CS-110'], ['Mathematics', 'Prof. Nair', 'MB-12']];
  const slots = [['09:00', '10:00'], ['10:15', '11:15'], ['11:30', '12:30'], ['14:00', '15:00']];
  const rows = [];
  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach((day, d) => slots.forEach(([start, end], i) => {
    const [subject, fac, room] = subjects[(i + d) % 4];
    rows.push({ day, start, end, subject, faculty: fac, room });
  }));
  await Timetable.create(rows);
  const day = 86400000;
  await Event.create([
    { name: 'Hack the Campus', date: Date.now() + 2 * day, time: '10:00', location: 'Auditorium', organizer: 'Coding Club', category: 'Technical', description: '24-hour hackathon.' },
    { name: 'Cultural Night', date: Date.now() + 4 * day, time: '18:00', location: 'Main Lawn', organizer: 'Cultural Committee', category: 'Cultural', description: 'Music, dance and drama.' },
    { name: 'Inter-College Football', date: Date.now() + 6 * day, time: '16:00', location: 'Sports Complex', organizer: 'Sports Dept', category: 'Sports', description: 'Quarter finals.' },
  ]);
  await Announcement.create([
    { title: 'Mid-semester exams from Monday', body: 'Timetable is on the notice board.', category: 'Exam', author: admin._id },
    { title: 'Library open till 10 PM this week', body: 'Extended hours for exam prep.', category: 'Notice', author: faculty._id },
  ]);
  await Facility.create([
    ['Main Gate', 'Entry and security desk', 50, 94], ['Library', 'Books, study rooms, 8 AM-8 PM', 30, 30], ['Cafeteria', 'Food court near the lawn', 65, 55],
    ['Computer Science Department', 'Block B, 2nd floor', 70, 22], ['Administration', 'Admissions and fee office', 45, 72], ['Auditorium', 'Events and seminars', 18, 62],
    ['Sports Complex', 'Ground, courts and gym', 85, 75], ['Hostel', 'Boys and girls blocks', 10, 12], ['Medical Center', 'Open 24x7', 88, 45], ['Parking', 'Two-wheeler and four-wheeler', 28, 88],
  ].map(([name, description, x, y]) => ({ name, description, x, y })));
  console.log('Demo data loaded.');
}
