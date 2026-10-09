import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  studentId: mongoose.Types.ObjectId;
  subjectCode: string;
  subjectName: string;
  totalClasses: number;
  attendedClasses: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subjectCode: { type: String, required: true, uppercase: true, trim: true },
    subjectName: { type: String, required: true, trim: true },
    totalClasses: { type: Number, required: true, min: 0, default: 0 },
    attendedClasses: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

AttendanceSchema.index({ studentId: 1, subjectCode: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
