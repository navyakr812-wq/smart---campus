import mongoose, { Schema, Document } from 'mongoose';

export interface IFacility extends Document {
  name: string;
  category: 'Library' | 'Cafeteria' | 'Gym' | 'Lab' | 'Lounge' | 'Sports' | 'Other';
  location: string;
  capacity: number;
  openingHours: string;
  description: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FacilitySchema = new Schema<IFacility>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    category: { 
      type: String, 
      enum: ['Library', 'Cafeteria', 'Gym', 'Lab', 'Lounge', 'Sports', 'Other'], 
      required: true 
    },
    location: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, default: 50 },
    openingHours: { type: String, default: '08:00 - 22:00' },
    description: { type: String, default: '' },
    icon: { type: String, default: 'building' },
  },
  { timestamps: true }
);

export const Facility = mongoose.model<IFacility>('Facility', FacilitySchema);
