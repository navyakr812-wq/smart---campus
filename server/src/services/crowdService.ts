import mongoose from 'mongoose';
import { CheckIn } from '../models/CheckIn';
import { Facility } from '../models/Facility';
import { CrowdLevel } from '../types';

export interface FacilityCrowdStatus {
  facilityId: string;
  name: string;
  category: string;
  location: string;
  capacity: number;
  openingHours: string;
  description: string;
  icon?: string;
  crowdLevel: CrowdLevel | 'NO_DATA';
  crowdScore: number | null; // 1.0 to 3.0
  crowdPercentage: number | null; // 0 to 100%
  checkInCountLast30Min: number;
  lastCheckInAt: Date | null;
  statusLabel: string;
}

export async function calculateFacilityCrowd(facilityId: string | mongoose.Types.ObjectId): Promise<{
  crowdLevel: CrowdLevel | 'NO_DATA';
  crowdScore: number | null;
  crowdPercentage: number | null;
  checkInCountLast30Min: number;
  lastCheckInAt: Date | null;
  statusLabel: string;
}> {
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

  const checkIns = await CheckIn.find({
    facilityId,
    timestamp: { $gte: thirtyMinutesAgo },
  }).sort({ timestamp: -1 });

  if (checkIns.length === 0) {
    return {
      crowdLevel: 'NO_DATA',
      crowdScore: null,
      crowdPercentage: null,
      checkInCountLast30Min: 0,
      lastCheckInAt: null,
      statusLabel: 'No recent data',
    };
  }

  const levelValues: Record<CrowdLevel, number> = {
    EMPTY: 1,
    OKAY: 2,
    PACKED: 3,
  };

  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const checkIn of checkIns) {
    const ageInMinutes = (now.getTime() - new Date(checkIn.timestamp).getTime()) / (60 * 1000);
    // Linear decay weight: weight = (30 - age) / 30. Current check-in = 1.0, 30m ago = 0.0
    const weight = Math.max(0, (30 - ageInMinutes) / 30);
    const value = levelValues[checkIn.level];

    totalWeightedScore += value * weight;
    totalWeight += weight;
  }

  if (totalWeight <= 0) {
    return {
      crowdLevel: 'NO_DATA',
      crowdScore: null,
      crowdPercentage: null,
      checkInCountLast30Min: checkIns.length,
      lastCheckInAt: checkIns[0]?.timestamp || null,
      statusLabel: 'No recent data',
    };
  }

  const weightedAverage = totalWeightedScore / totalWeight; // 1.0 to 3.0
  const percentage = Math.round(((weightedAverage - 1) / 2) * 100);

  let crowdLevel: CrowdLevel;
  let statusLabel: string;

  if (weightedAverage < 1.67) {
    crowdLevel = 'EMPTY';
    statusLabel = 'Quiet / Empty';
  } else if (weightedAverage < 2.33) {
    crowdLevel = 'OKAY';
    statusLabel = 'Moderate / Okay';
  } else {
    crowdLevel = 'PACKED';
    statusLabel = 'Very Busy / Packed';
  }

  return {
    crowdLevel,
    crowdScore: Number(weightedAverage.toFixed(2)),
    crowdPercentage: percentage,
    checkInCountLast30Min: checkIns.length,
    lastCheckInAt: checkIns[0].timestamp,
    statusLabel,
  };
}

export async function getAllFacilitiesWithCrowd(): Promise<FacilityCrowdStatus[]> {
  const facilities = await Facility.find().sort({ name: 1 });
  const results: FacilityCrowdStatus[] = [];

  for (const facility of facilities) {
    const crowd = await calculateFacilityCrowd(facility._id);
    results.push({
      facilityId: facility._id.toString(),
      name: facility.name,
      category: facility.category,
      location: facility.location,
      capacity: facility.capacity,
      openingHours: facility.openingHours,
      description: facility.description,
      icon: facility.icon,
      ...crowd,
    });
  }

  return results;
}

export async function checkRateLimit(
  facilityId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId
): Promise<{ allowed: boolean; remainingSeconds?: number }> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentCheckIn = await CheckIn.findOne({
    facilityId,
    userId,
    timestamp: { $gte: fiveMinutesAgo },
  }).sort({ timestamp: -1 });

  if (!recentCheckIn) {
    return { allowed: true };
  }

  const elapsedMs = Date.now() - new Date(recentCheckIn.timestamp).getTime();
  const remainingSeconds = Math.max(0, Math.ceil((5 * 60 * 1000 - elapsedMs) / 1000));
  return { allowed: false, remainingSeconds };
}
