import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AnalyticsData } from '../types';
import { SkeletonList, EmptyState, ErrorState } from '../components/Skeleton';
import {
  BarChart3,
  Users,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Calendar,
  ThumbsUp,
  MapPin,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getAnalytics();
      setData(res);
    } catch (err: any) {
      console.error('[ANALYTICS PAGE] Fetch error:', err);
      setError(err.message || 'Failed to load administrative analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 pb-20 pt-2">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Administrative Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Campus Analytics & Live Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time administrative overview aggregated directly from verified database collections.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={isLoading}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
        >
          <Activity className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : 'text-teal-400'}`} />
          Refresh Stats
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && <SkeletonList count={4} />}

      {/* Error state */}
      {!isLoading && error && (
        <ErrorState
          title="Could not load analytics"
          message={error}
          onRetry={fetchAnalytics}
        />
      )}

      {!isLoading && data && (
        <div className="space-y-6">
          
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="glass-card rounded-2xl p-4.5 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Enrolled Students</span>
                <Users className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {data.metrics.studentCount}
              </div>
              <p className="text-[11px] text-teal-400 mt-1">Active Profiles</p>
            </div>

            <div className="glass-card rounded-2xl p-4.5 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Faculty Members</span>
                <GraduationCap className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {data.metrics.facultyCount}
              </div>
              <p className="text-[11px] text-purple-400 mt-1">Teaching Staff</p>
            </div>

            <div className="glass-card rounded-2xl p-4.5 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Open Issues</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {data.metrics.openIssues}
              </div>
              <p className="text-[11px] text-amber-300 mt-1">
                {data.metrics.resolvedIssues} Resolved ({data.metrics.resolutionRate}%)
              </p>
            </div>

            <div className="glass-card rounded-2xl p-4.5 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Event Participation</span>
                <Calendar className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {data.metrics.totalEventRegistrations}
              </div>
              <p className="text-[11px] text-emerald-300 mt-1">
                {data.metrics.eventParticipationRate}% Total Fill Rate
              </p>
            </div>
          </div>

          {/* Two-Column Analytics Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Top Issue Categories */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Issues by Category
              </h3>

              <div className="space-y-3">
                {data.topCategories.map(cat => {
                  const maxCount = Math.max(...data.topCategories.map(c => c.count), 1);
                  const pct = Math.round((cat.count / maxCount) * 100);
                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-semibold">{cat.category}</span>
                        <span className="font-mono text-slate-400">{cat.count} issues</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-amber-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Busiest Facilities by Check-ins */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-400" />
                Busiest Facilities by Check-ins
              </h3>

              <div className="space-y-3">
                {data.busiestFacilities.map(fac => {
                  const maxCheckIns = Math.max(...data.busiestFacilities.map(f => f.totalCheckIns), 1);
                  const pct = Math.round((fac.totalCheckIns / maxCheckIns) * 100);
                  return (
                    <div key={fac.facilityId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-semibold">{fac.name}</span>
                        <span className="font-mono text-teal-400 font-bold">
                          {fac.totalCheckIns} check-ins
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full"
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Most Upvoted Issues Leaderboard */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-teal-400" />
              Most Upvoted Issues Leaderboard (Prioritized by Students)
            </h3>

            <div className="space-y-2.5">
              {data.mostUpvotedIssues.map((issue, idx) => (
                <div
                  key={issue._id}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-teal-500/15 text-teal-300 font-bold flex items-center justify-center font-mono">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-white line-clamp-1">{issue.title}</h4>
                      <p className="text-slate-400 text-[11px]">
                        {issue.location} • Status: <strong className="text-teal-300">{issue.status}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/15 text-teal-300 font-bold font-mono shrink-0">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{issue.upvotesCount} Me Too</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
