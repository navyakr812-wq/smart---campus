import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useTimeSim } from '../context/TimeSimContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { NowEngineState, NowCard } from '../types';
import { SkeletonList, EmptyState, ErrorState } from '../components/Skeleton';
import {
  Zap,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Coffee,
  CheckCircle2,
  Users
} from 'lucide-react';

interface NowPageProps {
  onNavigateTab: (tab: string) => void;
  onOpenAI: () => void;
}

export const NowPage: React.FC<NowPageProps> = ({ onNavigateTab, onOpenAI }) => {
  const { simulatedTime, simulatedDay, displayTimeLabel, isSimulated } = useTimeSim();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [state, setState] = useState<NowEngineState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNowState = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getNowEngine({
        time: simulatedTime,
        day: simulatedDay,
      });
      setState(data);
    } catch (err: any) {
      console.error('[NOW PAGE] Fetch error:', err);
      setError(err.message || 'Could not compute Now Engine state');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNowState();
  }, [simulatedTime, simulatedDay]);

  const getBadgeStyle = (variant: string) => {
    switch (variant) {
      case 'rose':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'amber':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'emerald':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'indigo':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'teal':
      default:
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
    }
  };

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'CURRENT_CLASS':
      case 'NEXT_CLASS':
        return <Calendar className="w-5 h-5 text-teal-400" />;
      case 'STUDY_SPOT':
        return <BookOpen className="w-5 h-5 text-emerald-400" />;
      case 'FOOD_BREAK':
        return <Coffee className="w-5 h-5 text-amber-400" />;
      case 'EVENT':
        return <Sparkles className="w-5 h-5 text-indigo-400" />;
      case 'FREE_ROOM':
        return <MapPin className="w-5 h-5 text-teal-400" />;
      case 'ATTENDANCE_WARNING':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      default:
        return <Zap className="w-5 h-5 text-teal-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 pb-20 pt-2">
      
      {/* Hero "What Should You Do Right Now?" Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950/40 to-slate-900 border border-teal-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                Now Engine • Ground Truth DB
              </span>
              {isSimulated && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Simulated: {displayTimeLabel}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              What should you do <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-400">right now</span>?
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Hello, <span className="font-semibold text-white">{user?.name}</span>! CampusNow synthesized your timetable, live facility crowds, and campus events to rank your optimal options.
            </p>
          </div>

          {/* Quick Schedule Stat Box */}
          {state && (
            <div className="glass-card rounded-2xl p-4 border border-slate-800 shrink-0 min-w-[220px]">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Timetable Status</span>
                <span className="font-mono text-teal-400">{state.dayName}</span>
              </div>
              <div className="text-lg font-bold text-white leading-tight">
                {state.currentClass ? (
                  <span className="text-teal-300">In Class ({state.currentClass.courseCode})</span>
                ) : state.nextClass ? (
                  <span className="text-amber-300">{state.nextClass.courseCode} in {state.nextClass.minutesUntilStart}m</span>
                ) : (
                  <span className="text-emerald-300">Free Rest of Day</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{state.gapSummary}</p>
            </div>
          )}
        </div>
      </section>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <SkeletonList count={4} />
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <ErrorState
          title="Could not compute Now Engine suggestions"
          message={error}
          onRetry={fetchNowState}
        />
      )}

      {/* Live Decision Cards Stream */}
      {!isLoading && state && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              Ranked Real-Time Recommendations
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {state.cards.length} verified options
            </span>
          </div>

          {state.cards.length === 0 ? (
            <EmptyState
              title="No Urgent Actions Needed"
              description="You have no immediate lectures scheduled right now. Check out campus events or relax in the student lounge!"
              actionText="Browse Campus Events"
              onAction={() => onNavigateTab('events')}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {state.cards.map(card => {
                const isTopRank = card.rank === 1;
                return (
                  <div
                    key={card.id}
                    className={`glass-card glass-card-hover rounded-2xl p-5 border transition-all ${
                      isTopRank
                        ? 'border-teal-500/50 bg-gradient-to-r from-teal-950/30 to-slate-900/90 shadow-xl shadow-teal-950/40'
                        : 'border-slate-800/80 bg-slate-900/70'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                            isTopRank
                              ? 'bg-teal-500/20 border border-teal-500/40'
                              : 'bg-slate-800/80 border border-slate-700/60'
                          }`}
                        >
                          {getCardIcon(card.type)}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              #{card.rank}
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(
                                card.badge.variant
                              )}`}
                            >
                              {card.badge.label}
                            </span>
                          </div>

                          <h3 className="font-bold text-base sm:text-lg text-white leading-tight">
                            {card.title}
                          </h3>

                          <p className="text-xs text-slate-300 font-medium">{card.subtitle}</p>

                          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                            {card.meta}
                          </p>
                        </div>
                      </div>

                      {/* Card Action Button */}
                      {card.action && (
                        <div className="sm:shrink-0 pt-2 sm:pt-0">
                          <button
                            onClick={() => onNavigateTab(card.action!.targetTab)}
                            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                              isTopRank
                                ? 'bg-teal-400 hover:bg-teal-300 text-slate-950 shadow-lg shadow-teal-500/20'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            }`}
                          >
                            <span>{card.action.label}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Instant Action Bar at bottom of Now Engine */}
      <section className="glass-card rounded-2xl p-5 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Have a specific question?</h4>
            <p className="text-[11px] text-slate-400">Ask CampusAI about rooms, attendance, or events</p>
          </div>
        </div>
        <button
          onClick={onOpenAI}
          className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 transition-all"
        >
          <span>Ask CampusAI Assistant</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>

    </div>
  );
};
