import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  category: 'Academic' | 'Administrative' | 'Events' | 'Urgent' | 'General';
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  authorRole: UserRole;
  priority: 'NORMAL' | 'URGENT';
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Academic', 'Administrative', 'Events', 'Urgent', 'General'],
      default: 'General',
    },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, enum: ['FACULTY', 'ADMIN'], required: true },
    priority: { type: String, enum: ['NORMAL', 'URGENT'], default: 'NORMAL' },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ createdAt: -1 });

export const Announcement = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
