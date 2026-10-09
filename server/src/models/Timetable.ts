import mongoose, { Schema, Document } from 'mongoose';

export interface ITimetable extends Document {
  courseCode: string;
  courseName: string;
  facultyName: string;
  facultyId?: mongoose.Types.ObjectId;
  room: string;
  building?: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "09:00"
  endTime: string;   // "10:30"
  department: string;
  semester: number;
  studentIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TimetableSchema = new Schema<ITimetable>(
  {
    courseCode: { type: String, required: true, uppercase: true, trim: true },
    courseName: { type: String, required: true, trim: true },
    facultyName: { type: String, required: true, trim: true },
    facultyId: { type: Schema.Types.ObjectId, ref: 'User' },
    room: { type: String, required: true, trim: true, uppercase: true },
    building: { type: String, default: 'Main Academic Block' },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true, match: /^[0-2][0-9]:[0-5][0-9]$/ },
    endTime: { type: String, required: true, match: /^[0-2][0-9]:[0-5][0-9]$/ },
    department: { type: String, default: 'Computer Science' },
    semester: { type: Number, default: 5 },
    studentIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

TimetableSchema.index({ dayOfWeek: 1, startTime: 1 });
TimetableSchema.index({ room: 1, dayOfWeek: 1 });

export const Timetable = mongoose.model<ITimetable>('Timetable', TimetableSchema);
