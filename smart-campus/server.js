import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Attendance, Timetable, Announcement, Event, Issue, Notification, Facility, ISSUE_STATUSES } from './models.js';
import { seedDemo } from './seed.js';

const { PORT = 5000, MONGO_URI, JWT_SECRET, NODE_ENV, CORS_ORIGIN, SEED_DEMO } = process.env;
if (!JWT_SECRET) { console.error('JWT_SECRET is required.'); process.exit(1); }
const prod = NODE_ENV === 'production';

const app = express();
app.use(cors({ origin: CORS_ORIGIN ? CORS_ORIGIN.split(',') : true }));
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), 'public')));

const h = (fn) => (req, res) => fn(req, res).catch((e) => {
  if (e.name === 'ValidationError' || e.name === 'CastError') return res.status(400).json({ message: e.message });
  if (e.code === 11000) return res.status(409).json({ message: 'Already exists' });
  console.error(e); res.status(500).json({ message: 'Server error' });
});
const auth = (...roles) => async (req, res, next) => {
  try {
    const p = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), JWT_SECRET);
    const u = await User.findById(p.id).select('-password');
    if (!u) throw new Error('no user');
    if (roles.length && !roles.includes(u.role)) return res.status(403).json({ message: 'Forbidden' });
    req.user = u; next();
  } catch { res.status(401).json({ message: 'Unauthorized' }); }
};
const STAFF = ['FACULTY', 'ADMIN'];
const sign = (u) => ({ token: jwt.sign({ id: u._id }, JWT_SECRET, { expiresIn: '7d' }), user: { id: u._id, name: u.name, email: u.email, role: u.role } });
const notify = (users, text) => Notification.insertMany(users.map((user) => ({ user, text })));
const DEPT = { Electrical: 'Electrical Maintenance', Cleanliness: 'Housekeeping', Water: 'Plumbing', 'Wi-Fi': 'IT Services', Classroom: 'Facilities', Hostel: 'Hostel Office', Transport: 'Transport Office', Security: 'Security', Other: 'Administration' };
const pct = (rows) => { const t = rows.reduce((a, r) => a + r.total, 0); return t ? Math.round((rows.reduce((a, r) => a + r.present, 0) / t) * 100) : 0; };
const todayName = () => new Date().toLocaleDateString('en-US', { weekday: 'long' });
const hhmm = () => new Date().toTimeString().slice(0, 5);
async function nextClass() {
  const today = await Timetable.find({ day: todayName() }).sort('start');
  return today.find((c) => c.end > hhmm()) || null;
}

// Auth. Public sign-up always creates a STUDENT; staff accounts are created by an admin.
app.post('/api/auth/register', h(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 8) return res.status(400).json({ message: 'Name, email and a password of 8+ characters are required' });
  const u = await User.create({ name, email, password: await bcrypt.hash(password, 10), role: 'STUDENT' });
  res.status(201).json(sign(u));
}));
app.post('/api/auth/login', h(async (req, res) => {
  const u = await User.findOne({ email: String(req.body.email || '').toLowerCase().trim() });
  if (!u || !(await bcrypt.compare(String(req.body.password || ''), u.password))) return res.status(401).json({ message: 'Invalid email or password' });
  res.json(sign(u));
}));
app.get('/api/me', auth(), (req, res) => res.json({ id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role }));

app.get('/api/dashboard', auth(), h(async (req, res) => {
  const att = await Attendance.find({ student: req.user._id });
  const [today, next, events, announcements, unread] = await Promise.all([
    Timetable.find({ day: todayName() }).sort('start'), nextClass(),
    Event.find({ date: { $gte: new Date() } }).sort('date').limit(3),
    Announcement.find().sort('-createdAt').limit(3), Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ today, next, attendance: pct(att), events, announcements, unread });
}));

app.get('/api/announcements', auth(), h(async (req, res) => res.json(await Announcement.find(req.query.category ? { category: req.query.category } : {}).sort('-createdAt').populate('author', 'name'))));
app.post('/api/announcements', auth(...STAFF), h(async (req, res) => {
  const a = await Announcement.create({ ...req.body, author: req.user._id });
  const students = await User.find({ role: 'STUDENT' }, '_id');
  await notify(students.map((s) => s._id), `${a.category === 'Emergency' ? 'ALERT: ' : 'New announcement: '}${a.title}`);
  res.status(201).json(a);
}));

app.get('/api/events', auth(), h(async (req, res) => {
  const ev = await Event.find().sort('date');
  res.json(ev.map((e) => ({ ...e.toObject(), registrations: undefined, count: e.registrations.length, registered: e.registrations.some((r) => r.equals(req.user._id)) })));
}));
app.post('/api/events', auth('ADMIN'), h(async (req, res) => res.status(201).json(await Event.create({ ...req.body, registrations: [] }))));
app.post('/api/events/:id/register', auth('STUDENT'), h(async (req, res) => {
  const e = await Event.findById(req.params.id);
  if (!e) return res.status(404).json({ message: 'Event not found' });
  if (!e.registrations.some((r) => r.equals(req.user._id))) { e.registrations.push(req.user._id); await e.save(); await notify([req.user._id], `You are registered for ${e.name}`); }
  res.json({ registered: true });
}));

app.get('/api/attendance', auth('STUDENT'), h(async (req, res) => {
  const rows = await Attendance.find({ student: req.user._id });
  res.json({ overall: pct(rows), subjects: rows.map((r) => ({ subject: r.subject, present: r.present, absent: r.total - r.present, percent: Math.round((r.present / r.total) * 100) })) });
}));
app.get('/api/timetable', auth(), h(async (req, res) => res.json({ today: todayName(), next: await nextClass(), classes: await Timetable.find().sort('start') })));

app.get('/api/issues', auth(), h(async (req, res) => {
  const q = req.user.role === 'STUDENT' ? { reporter: req.user._id } : {};
  res.json(await Issue.find(q).sort('-createdAt').populate('reporter', 'name'));
}));
app.post('/api/issues', auth('STUDENT'), h(async (req, res) => {
  const { title, description, category, location, priority } = req.body;
  const issue = await Issue.create({ title, description, category, location, priority, department: DEPT[category] || DEPT.Other, reporter: req.user._id });
  const admins = await User.find({ role: 'ADMIN' }, '_id');
  await notify(admins.map((a) => a._id), `New ${issue.priority} priority issue: ${issue.title}`);
  res.status(201).json(issue);
}));
app.patch('/api/issues/:id', auth(...STAFF), h(async (req, res) => {
  if (!ISSUE_STATUSES.includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' });
  const issue = await Issue.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  await notify([issue.reporter], `Your issue "${issue.title}" is now ${issue.status}`);
  res.json(issue);
}));

app.get('/api/notifications', auth(), h(async (req, res) => res.json(await Notification.find({ user: req.user._id }).sort('-createdAt').limit(50))));
app.post('/api/notifications/read', auth(), h(async (req, res) => { await Notification.updateMany({ user: req.user._id }, { read: true }); res.json({ ok: true }); }));
app.get('/api/facilities', auth(), h(async (req, res) => res.json(await Facility.find())));

app.get('/api/admin/analytics', auth('ADMIN'), h(async (req, res) => {
  const [students, faculty, activeEvents, open, resolved, byCategory, events, att] = await Promise.all([
    User.countDocuments({ role: 'STUDENT' }), User.countDocuments({ role: 'FACULTY' }), Event.countDocuments({ date: { $gte: new Date() } }),
    Issue.countDocuments({ status: { $ne: 'Resolved' } }), Issue.countDocuments({ status: 'Resolved' }),
    Issue.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]), Event.find(), Attendance.find(),
  ]);
  res.json({ students, faculty, activeEvents, openIssues: open, resolvedIssues: resolved, issuesByCategory: byCategory.map((c) => ({ category: c._id, count: c.count })), eventParticipation: events.map((e) => ({ name: e.name, count: e.registrations.length })), avgAttendance: pct(att) });
}));

// CampusAI: rule-based, answers from the database. To use a real LLM, replace answer() and keep its signature.
async function answer(q, user) {
  if (/attendance/.test(q)) { const rows = await Attendance.find({ student: user._id }); return rows.length ? `Your overall attendance is ${pct(rows)}%. ` + rows.map((r) => `${r.subject}: ${Math.round((r.present / r.total) * 100)}%`).join(', ') + '.' : 'There is no attendance record for your account.'; }
  if (/next class|class|timetable/.test(q)) { const c = await nextClass(); return c ? `Your next class today is ${c.subject} with ${c.faculty} at ${c.start} in ${c.room}.` : 'You have no more classes today.'; }
  if (/event|happening/.test(q)) { const ev = await Event.find({ date: { $gte: new Date() } }).sort('date').limit(5); return ev.length ? 'Upcoming events: ' + ev.map((e) => `${e.name} (${e.date.toDateString()}, ${e.location})`).join('; ') + '.' : 'No upcoming events right now.'; }
  if (/report|issue|maintenance|complain/.test(q)) return 'Open the Issues page, fill in a title, category, location and priority, and submit. You can track its status there.';
  if (/shuttle|bus|transport/.test(q)) return 'Shuttle timings are not in the system yet. Please check with the Transport Office.';
  if (/club/.test(q)) return 'Club listings are not in the system yet. Check the Events page for club-run events.';
  const words = q.replace(/[^a-z ]/g, ' ').split(' ').filter((w) => w.length > 3 && !['where', 'what', 'find', 'campus'].includes(w));
  const fac = (await Facility.find()).find((f) => words.some((w) => f.name.toLowerCase().includes(w)));
  if (fac) return `${fac.name}: ${fac.description}. See it on the Facilities map.`;
  return 'I can help with your attendance, next class, events, reporting an issue, and finding places on campus.';
}
app.post('/api/assistant', auth(), h(async (req, res) => res.json({ reply: await answer(String(req.body.message || '').toLowerCase(), req.user), source: 'rule-based' })));

app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));

async function connect() {
  try { await mongoose.connect(MONGO_URI || 'mongodb://127.0.0.1:27017/smartcampus', { serverSelectionTimeoutMS: prod ? 10000 : 2500 }); console.log('MongoDB connected.'); }
  catch (e) {
    console.error('MongoDB connection failed:', e.message);
    if (prod) process.exit(1); // never run on a fake database in production
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    await mongoose.connect((await MongoMemoryServer.create()).getUri());
    console.log('Using a temporary in-memory database (development only).');
  }
}
await connect();
if (SEED_DEMO === 'true' && !prod) await seedDemo();
app.listen(PORT, () => console.log(`Smart Campus running on http://localhost:${PORT}`));
