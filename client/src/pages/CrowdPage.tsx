import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { FacilityCrowdStatus, CrowdLevel } from '../types';
import { SkeletonList, EmptyState, ErrorState } from '../components/Skeleton';
import {
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Activity,
  Sparkles
} from 'lucide-react';

export const CrowdPage: React.FC = () => {
  const { addToast } = useToast();
  const [facilities, setFacilities] = useState<FacilityCrowdStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Rate-limiting cooldowns per facility (facilityId -> remainingSeconds)
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  const fetchFacilities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getCrowdFacilities();
      setFacilities(data);
    } catch (err: any) {
      console.error('[CROWD PAGE] Fetch error:', err);
      setError(err.message || 'Failed to load facility crowd data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
    const interval = setInterval(fetchFacilities, 15000); // 15s live refresh
    return () => clearInterval(interval);
  }, []);

  // Cooldown countdown timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCooldowns(prev => {
        let changed = false;
        const next: Record<string, number> = {};
        for (const [facId, sec] of Object.entries(prev)) {
          if (sec > 1) {
            next[facId] = sec - 1;
            changed = true;
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = async (facilityId: string, level: 'EMPTY' | 'OKAY' | 'PACKED', facilityName: string) => {
    if (cooldowns[facilityId] && cooldowns[facilityId] > 0) {
      addToast(
        'Rate Limited',
        `You can check in again in ${cooldowns[facilityId]} seconds. (1 check-in per 5 minutes)`,
        'warning'
      );
      return;
    }

    try {
      setSubmittingId(facilityId);
      const res = await api.checkIn(facilityId, level);
      
      addToast(
        'Check-In Recorded! ⚡',
        `Logged as "${level}" at ${facilityName}. Crowd weighted average updated!`,
        'success'
      );

      // Start 5-minute cooldown (300 seconds)
      setCooldowns(prev => ({ ...prev, [facilityId]: 300 }));

      // Update facility in state with newly computed weighted average
      setFacilities(prev =>
        prev.map(f =>
          f.facilityId === facilityId
            ? { ...f, ...res.updatedCrowd }
            : f
        )
      );
    } catch (err: any) {
      if (err.status === 429 && err.data?.remainingSeconds) {
        setCooldowns(prev => ({ ...prev, [facilityId]: err.data.remainingSeconds }));
        addToast(
          'Rate Limited',
          `You already checked in recently. Please wait ${err.data.remainingSeconds}s.`,
          'warning'
        );
      } else {
        addToast('Check-in Failed', err.message || 'Could not record check-in', 'error');
      }
    } finally {
      setSubmittingId(null);
    }
  };

  const getCrowdBanner = (level: CrowdLevel) => {
    switch (level) {
      case 'EMPTY':
        return {
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400',
          label: 'Empty / Quiet',
          barColor: 'bg-emerald-500',
        };
      case 'OKAY':
        return {
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400',
          label: 'Moderate / Okay',
          barColor: 'bg-amber-500',
        };
      case 'PACKED':
        return {
          bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          dot: 'bg-rose-400',
          label: 'Very Busy / Packed',
          barColor: 'bg-rose-500',
        };
      case 'NO_DATA':
      default:
        return {
          bg: 'bg-slate-800 text-slate-400 border-slate-700',
          dot: 'bg-slate-500',
          label: 'No recent data',
          barColor: 'bg-slate-700',
        };
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 pb-20 pt-2">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">
              Live Crowd Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Campus Facilities Crowd Status
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Powered by student 1-tap check-ins with 30-minute weighted decay. Older check-ins decay linearly.
          </p>
        </div>

        <button
          onClick={fetchFacilities}
          disabled={isLoading}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
        >
          <Activity className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : 'text-teal-400'}`} />
          Refresh
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && <SkeletonList count={3} />}

      {/* Error state */}
      {!isLoading && error && (
        <ErrorState
          title="Failed to load crowd data"
          message={error}
          onRetry={fetchFacilities}
        />
      )}

      {/* Facility Cards */}
      {!isLoading && facilities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {facilities.map(facility => {
            const badge = getCrowdBanner(facility.crowdLevel);
            const remainingCooldown = cooldowns[facility.facilityId] || 0;
            const isSubmitting = submittingId === facility.facilityId;

            return (
              <div
                key={facility.facilityId}
                className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  
                  {/* Top Bar: Name & Crowd Badge */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                        {facility.category}
                      </span>
                      <h3 className="font-extrabold text-base text-white">{facility.name}</h3>
                    </div>

                    <div
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shrink-0 ${badge.bg}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                      {badge.label}
                    </div>
                  </div>

                  {/* Location & Operating Hours */}
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400 mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {facility.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {facility.openingHours}
                    </span>
                  </div>

                  {facility.description && (
                    <p className="text-xs text-slate-400/90 mb-4 line-clamp-2">
                      {facility.description}
                    </p>
                  )}

                  {/* Crowd Meter Progress Bar */}
                  <div className="space-y-1.5 mb-5 bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">30-min Crowd Index:</span>
                      <span className="font-mono font-bold text-white">
                        {facility.crowdLevel === 'NO_DATA'
                          ? 'No recent check-ins'
                          : `${facility.crowdPercentage}% Capacity (${facility.checkInCountLast30Min} check-ins)`}
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${badge.barColor}`}
                        style={{
                          width:
                            facility.crowdLevel === 'NO_DATA'
                              ? '0%'
                              : `${Math.max(8, facility.crowdPercentage || 0)}%`,
                        }}
                      />
                    </div>
                  </div>

                </div>

                {/* 1-Tap Check-in Action Bar */}
                <div className="pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold text-slate-300">Are you here now? Check in:</span>
                    {remainingCooldown > 0 && (
                      <span className="text-amber-400 font-mono text-[11px] animate-pulse">
                        Cooldown: {Math.floor(remainingCooldown / 60)}:
                        {(remainingCooldown % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleCheckIn(facility.facilityId, 'EMPTY', facility.name)}
                      disabled={isSubmitting || remainingCooldown > 0}
                      className="py-2 px-2 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      🟢 Empty
                    </button>
                    <button
                      onClick={() => handleCheckIn(facility.facilityId, 'OKAY', facility.name)}
                      disabled={isSubmitting || remainingCooldown > 0}
                      className="py-2 px-2 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      🟡 Okay
                    </button>
                    <button
                      onClick={() => handleCheckIn(facility.facilityId, 'PACKED', facility.name)}
                      disabled={isSubmitting || remainingCooldown > 0}
                      className="py-2 px-2 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      🔴 Packed
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
