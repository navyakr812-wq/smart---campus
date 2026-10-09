import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useTimeSim } from '../context/TimeSimContext';
import { FreeRoomInfo } from '../types';
import { SkeletonList, EmptyState, ErrorState } from '../components/Skeleton';
import {
  DoorOpen,
  Search,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Filter,
  Sparkles
} from 'lucide-react';

export const RoomsPage: React.FC = () => {
  const { simulatedTime, simulatedDay, displayTimeLabel, isSimulated } = useTimeSim();

  const [rooms, setRooms] = useState<FreeRoomInfo[]>([]);
  const [totalRooms, setTotalRooms] = useState<number>(0);
  const [freeNowCount, setFreeNowCount] = useState<number>(0);
  const [occupiedCount, setOccupiedCount] = useState<number>(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [minFreeMinutes, setMinFreeMinutes] = useState<number>(0);
  const [filterMode, setFilterMode] = useState<'ALL' | 'FREE_NOW'>('FREE_NOW');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getFreeRooms({
        minMinutes: minFreeMinutes > 0 ? minFreeMinutes : undefined,
        time: simulatedTime,
        day: simulatedDay,
      });

      setRooms(data.rooms || []);
      setTotalRooms(data.totalRooms || 0);
      setFreeNowCount(data.freeNowCount || 0);
      setOccupiedCount(data.occupiedCount || 0);
    } catch (err: any) {
      console.error('[ROOMS PAGE] Fetch error:', err);
      setError(err.message || 'Failed to compute free room availability');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [simulatedTime, simulatedDay, minFreeMinutes]);

  const filteredRooms = rooms.filter(r => {
    const matchesSearch =
      r.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.building.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterMode === 'FREE_NOW') {
      return matchesSearch && r.isFreeNow;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 pb-20 pt-2">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">
            Timetable-Derived Availability
          </span>
          {isSimulated && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {displayTimeLabel}
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
          Free Room Finder
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Find available classrooms and seminar halls right now or for study gaps, calculated directly from scheduled lectures.
        </p>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-2xl p-4 border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total Classrooms
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-white mt-0.5 font-mono">
            {totalRooms}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-emerald-500/30 bg-emerald-950/20 text-center">
          <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
            Free Right Now
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-0.5 font-mono">
            {freeNowCount}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-rose-500/30 bg-rose-950/20 text-center">
          <span className="text-[10px] uppercase font-bold text-rose-300 tracking-wider">
            Lectures Ongoing
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-400 mt-0.5 font-mono">
            {occupiedCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by room name or building..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          {/* Filter Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterMode('FREE_NOW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === 'FREE_NOW'
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Free Now
            </button>
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === 'ALL'
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Rooms
            </button>
          </div>

        </div>

        {/* Free Duration Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar text-xs">
          <span className="text-slate-400 shrink-0 font-medium">Free for at least:</span>
          {[0, 30, 45, 60, 90].map(mins => (
            <button
              key={mins}
              onClick={() => setMinFreeMinutes(mins)}
              className={`px-3 py-1 rounded-full shrink-0 font-semibold border transition-all ${
                minFreeMinutes === mins
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {mins === 0 ? 'Any duration' : `${mins} min+`}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && <SkeletonList count={4} />}

      {/* Error state */}
      {!isLoading && error && (
        <ErrorState
          title="Could not load room status"
          message={error}
          onRetry={fetchRooms}
        />
      )}

      {/* Room Cards List */}
      {!isLoading && (
        <div className="space-y-3">
          {filteredRooms.length === 0 ? (
            <EmptyState
              title="No Rooms Match Filter"
              description="No classrooms match your minimum free minutes criteria or search query. Try clearing the filter!"
              actionText="Reset Filters"
              onAction={() => {
                setSearchQuery('');
                setMinFreeMinutes(0);
                setFilterMode('ALL');
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredRooms.map((room, idx) => {
                return (
                  <div
                    key={idx}
                    className={`glass-card rounded-2xl p-4.5 border transition-all ${
                      room.isFreeNow
                        ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-900'
                        : 'border-slate-800/80 bg-slate-900/60 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-white">{room.room}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                              room.isFreeNow
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}
                          >
                            {room.isFreeNow ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> FREE NOW
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" /> OCCUPIED
                              </>
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {room.building}
                        </p>
                      </div>

                      {room.isFreeNow && (
                        <div className="text-right shrink-0">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Free For
                          </span>
                          <span className="text-base font-extrabold text-teal-400 font-mono">
                            {room.minutesFree}m
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-slate-800/80 text-xs text-slate-300 space-y-1">
                      {room.isFreeNow ? (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Available Until:</span>
                          <span className="font-semibold text-white">{room.freeUntil}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-rose-300">Ongoing Class:</span>
                          <span className="font-semibold text-white">
                            {room.currentClass?.courseCode} (until {room.currentClass?.endTime})
                          </span>
                        </div>
                      )}

                      {room.nextClass && (
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Next Lecture:</span>
                          <span>
                            {room.nextClass.courseCode} at {room.nextClass.startTime}
                          </span>
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

    </div>
  );
};
