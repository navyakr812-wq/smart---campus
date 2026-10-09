import mongoose, { Schema, Document } from 'mongoose';
import { IssueCategory, IssuePriority, IssueStatus } from '../types';

export interface IIssue extends Document {
  title: string;
  description: string;
  category: IssueCategory;
  location: string;
  priority: IssuePriority;
  status: IssueStatus;
  reportedBy: mongoose.Types.ObjectId;
  upvoters: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema = new Schema<IIssue>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Infrastructure', 'IT & WiFi', 'Cleanliness', 'Lab Equipment', 'Library', 'Cafeteria', 'Other'],
      required: true,
    },
    location: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      required: true,
    },
    status: {
      type: String,
      enum: ['Reported', 'Assigned', 'In Progress', 'Resolved'],
      default: 'Reported',
      required: true,
    },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    upvoters: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

IssueSchema.index({ status: 1, priority: 1, createdAt: -1 });

export const Issue = mongoose.model<IIssue>('Issue', IssueSchema);
