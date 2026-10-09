import mongoose, { Schema, Document } from 'mongoose';
import { EventCategory } from '../types';

export interface IEvent extends Document {
  title: string;
  description: string;
  category: EventCategory;
  location: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  registeredUsers: mongoose.Types.ObjectId[];
  organizer: string;
  bannerUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Tech', 'Cultural', 'Sports', 'Workshop', 'Career', 'Academic'],
      required: true,
      index: true,
    },
    location: { type: String, required: true, trim: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    capacity: { type: Number, required: true, default: 100 },
    registeredUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    organizer: { type: String, default: 'Campus Council' },
    bannerUrl: { type: String },
  },
  { timestamps: true }
);

export const Event = mongoose.model<IEvent>('Event', EventSchema);
