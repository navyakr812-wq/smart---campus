import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { EventItem } from '../types';
import { SkeletonList, EmptyState, ErrorState } from '../components/Skeleton';
import {
  BookmarkCheck,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus
} from 'lucide-react';

const CATEGORIES = ['ALL', 'Tech', 'Cultural', 'Sports', 'Workshop', 'Career'];

export const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getEvents({
        category: selectedCategory,
      });
      setEvents(data || []);
    } catch (err: any) {
      console.error('[EVENTS PAGE] Fetch error:', err);
      setError(err.message || 'Failed to retrieve campus events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory]);

  const handleRegister = async (eventId: string, title: string) => {
    try {
      setActionLoadingId(eventId);
      const res = await api.registerEvent(eventId);
      addToast('Registered! 🎉', `You are confirmed for "${title}". Added to notifications.`, 'success');
      setEvents(prev => prev.map(e => (e._id === eventId ? res.event : e)));
    } catch (err: any) {
      addToast('Registration Failed', err.message || 'Could not register for event', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnregister = async (eventId: string, title: string) => {
    try {
      setActionLoadingId(eventId);
      const res = await api.unregisterEvent(eventId);
      addToast('Cancelled', `Cancelled registration for "${title}".`, 'info');
      setEvents(prev => prev.map(e => (e._id === eventId ? res.event : e)));
    } catch (err: any) {
      addToast('Error', err.message || 'Could not cancel registration', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 pb-20 pt-2">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">
            Campus Life & Activities
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
          Campus Events Hub
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Discover hackathons, guest lectures, athletics, and cultural events with instant registration.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full font-semibold border transition-all ${
              selectedCategory === cat
                ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold shadow-md'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {cat === 'ALL' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {isLoading && <SkeletonList count={3} />}

      {/* Error state */}
      {!isLoading && error && (
        <ErrorState
          title="Could not load events"
          message={error}
          onRetry={fetchEvents}
        />
      )}

      {/* Events Stream */}
      {!isLoading && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <EmptyState
              title="No Events Found"
              description="No campus events are currently listed under this category. Check back soon!"
            />
          ) : (
            events.map(event => {
              const isRegistered =
                user &&
                event.registeredUsers?.some(u =>
                  typeof u === 'string' ? u === user._id : u._id === user._id
                );
              const remainingSpots = Math.max(0, event.capacity - (event.registeredUsers?.length || 0));
              const fillPct = Math.round(((event.registeredUsers?.length || 0) / event.capacity) * 100);
              const isFull = remainingSpots === 0 && !isRegistered;
              const isActionLoading = actionLoadingId === event._id;

              return (
                <div
                  key={event._id}
                  className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                          {event.category}
                        </span>
                        {isRegistered && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> REGISTERED
                          </span>
                        )}
                        {isFull && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            FULL CAPACITY
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-base sm:text-lg text-white">
                        {event.title}
                      </h3>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {event.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(event.startTime).toLocaleDateString([], {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' – '}
                          {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {event.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          Organized by {event.organizer}
                        </span>
                      </div>
                    </div>

                    {/* Capacity & Register CTA */}
                    <div className="sm:text-right shrink-0 space-y-2 pt-2 sm:pt-0">
                      <div>
                        <div className="text-xs text-slate-400 flex sm:justify-end gap-1">
                          <span>Capacity:</span>
                          <span className="font-mono font-bold text-white">
                            {event.registeredUsers?.length || 0} / {event.capacity}
                          </span>
                        </div>
                        <div className="w-28 h-1.5 rounded-full bg-slate-800 mt-1 sm:ml-auto overflow-hidden">
                          <div
                            className="h-full bg-teal-400 transition-all"
                            style={{ width: `${Math.min(100, fillPct)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        {isRegistered ? (
                          <button
                            onClick={() => handleUnregister(event._id, event.title)}
                            disabled={isActionLoading}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-300 border border-slate-700 transition-colors"
                          >
                            {isActionLoading ? 'Updating...' : 'Cancel Registration'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRegister(event._id, event.title)}
                            disabled={isFull || isActionLoading}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 shadow-md shadow-teal-500/20 transition-all active:scale-95"
                          >
                            {isActionLoading ? 'Registering...' : isFull ? 'Event Full' : 'Register Now'}
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
};
