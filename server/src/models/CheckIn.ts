import mongoose, { Schema, Document } from 'mongoose';
import { CrowdLevel } from '../types';

export interface ICheckIn extends Document {
  facilityId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  level: CrowdLevel;
  timestamp: Date;
}

const CheckInSchema = new Schema<ICheckIn>(
  {
    facilityId: { type: Schema.Types.ObjectId, ref: 'Facility', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    level: { type: String, enum: ['EMPTY', 'OKAY', 'PACKED'], required: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

CheckInSchema.index({ facilityId: 1, timestamp: -1 });
CheckInSchema.index({ userId: 1, facilityId: 1, timestamp: -1 });

export const CheckIn = mongoose.model<ICheckIn>('CheckIn', CheckInSchema);
