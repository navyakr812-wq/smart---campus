import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useTimeSim } from '../context/TimeSimContext';
import { AttendanceRecord, TimetableEntry } from '../types';
import { SkeletonList, EmptyState, ErrorState } from '../components/Skeleton';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  GraduationCap,
  Sparkles,
  BarChart2
} from 'lucide-react';

const DAYS = [
  { day: 1, label: 'Monday' },
  { day: 2, label: 'Tuesday' },
  { day: 3, label: 'Wednesday' },
  { day: 4, label: 'Thursday' },
  { day: 5, label: 'Friday' },
  { day: 0, label: 'Weekend' },
];

export const TimetablePage: React.FC = () => {
  const { simulatedTime, simulatedDay } = useTimeSim();

  const [activeDay, setActiveDay] = useState<number>(() => {
    return simulatedDay !== undefined ? (simulatedDay === 6 ? 0 : simulatedDay) : 1;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [overallPercentage, setOverallPercentage] = useState<number>(0);
  const [overallAttended, setOverallAttended] = useState<number>(0);
  const [overallTotal, setOverallTotal] = useState<number>(0);

  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [currentDayNumber, setCurrentDayNumber] = useState<number>(1);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [attendanceRes, timetableRes] = await Promise.all([
        api.getAttendance(),
        api.getTimetable({
          time: simulatedTime,
          day: simulatedDay,
        }),
      ]);

      setAttendanceRecords(attendanceRes.records || []);
      setOverallPercentage(attendanceRes.overallPercentage || 0);
      setOverallAttended(attendanceRes.overallAttended || 0);
      setOverallTotal(attendanceRes.overallTotal || 0);

      setTimetableEntries(timetableRes.timetable || []);
      setCurrentDayNumber(timetableRes.currentDay);

      if (simulatedDay !== undefined) {
        setActiveDay(simulatedDay === 6 ? 0 : simulatedDay);
      }
    } catch (err: any) {
      console.error('[TIMETABLE PAGE] Fetch error:', err);
      setError(err.message || 'Failed to retrieve attendance & schedule');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [simulatedTime, simulatedDay]);

  const daySchedule = timetableEntries.filter(e => {
    if (activeDay === 0) return e.dayOfWeek === 0 || e.dayOfWeek === 6;
    return e.dayOfWeek === activeDay;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 pb-20 pt-2">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">
            Academic Status
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
          Attendance & Timetable
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Official subject-wise attendance percentages from campus records and live weekly schedule.
        </p>
      </div>

      {/* Loading Skeleton */}
      {isLoading && <SkeletonList count={3} />}

      {/* Error state */}
      {!isLoading && error && (
        <ErrorState
          title="Could not load timetable & attendance"
          message={error}
          onRetry={fetchData}
        />
      )}

      {!isLoading && (
        <>
          {/* SECTION 1: Subject-Wise Attendance Cards */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-teal-400" />
                Subject-Wise Attendance Records
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Overall:</span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    overallPercentage < 75
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {overallPercentage}% ({overallAttended}/{overallTotal})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {attendanceRecords.map(record => (
                <div
                  key={record._id}
                  className={`glass-card rounded-2xl p-4.5 border transition-all ${
                    record.isLow
                      ? 'border-rose-500/40 bg-gradient-to-br from-rose-950/25 via-slate-900 to-slate-900'
                      : 'border-slate-800/80 bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-teal-400 uppercase">
                        {record.subjectCode}
                      </span>
                      <h4 className="font-bold text-sm text-white line-clamp-1">
                        {record.subjectName}
                      </h4>
                    </div>

                    <div
                      className={`text-sm font-extrabold font-mono px-2 py-0.5 rounded-lg border shrink-0 ${
                        record.isLow
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {record.percentage}%
                    </div>
                  </div>

                  {/* Attendance Bar */}
                  <div className="space-y-1 my-3">
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          record.isLow ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, record.percentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                      <span>Attended: {record.attendedClasses}/{record.totalClasses} classes</span>
                      <span>Target: 75%</span>
                    </div>
                  </div>

                  {/* Low Attendance Alert */}
                  {record.isLow && (
                    <div className="mt-2.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-300 flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Attend next {record.classesNeededFor75} classes consecutively to cross 75%!
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 2: Weekly Timetable with Live Highlight */}
          <section className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-400" />
                Weekly Schedule & Active Class
              </h2>
            </div>

            {/* Day Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {DAYS.map(d => {
                const isSelected = activeDay === d.day;
                const isToday = currentDayNumber === d.day;
                return (
                  <button
                    key={d.day}
                    onClick={() => setActiveDay(d.day)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                      isSelected
                        ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold shadow-md'
                        : isToday
                        ? 'bg-slate-900 text-teal-300 border-teal-500/40 hover:border-teal-500/70'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {d.label} {isToday && !isSelected && '• Today'}
                  </button>
                );
              })}
            </div>

            {/* Daily Classes Stream */}
            <div className="space-y-3">
              {daySchedule.length === 0 ? (
                <EmptyState
                  title="No Classes Scheduled"
                  description="You have no classes scheduled on this day. Perfect time for campus activities or projects!"
                />
              ) : (
                daySchedule.map(entry => (
                  <div
                    key={entry._id}
                    className={`glass-card rounded-2xl p-5 border transition-all ${
                      entry.isCurrentClass
                        ? 'border-teal-400 bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 shadow-xl shadow-teal-500/10'
                        : entry.isNextClass
                        ? 'border-amber-500/30 bg-slate-900/80'
                        : 'border-slate-800/80 bg-slate-900/60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-teal-400">
                            {entry.courseCode}
                          </span>
                          {entry.isCurrentClass && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 animate-pulse flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                              LIVE NOW
                            </span>
                          )}
                          {entry.isNextClass && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              NEXT UP
                            </span>
                          )}
                        </div>

                        <h3 className="font-extrabold text-base text-white">{entry.courseName}</h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {entry.startTime} – {entry.endTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {entry.room} ({entry.building})
                          </span>
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                            {entry.facultyName}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pt-2 sm:pt-0">
                        <span className="text-xs font-mono font-bold text-slate-300 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800">
                          {entry.startTime}
                        </span>
                      </div>

                    </div>
                  </div>
                ))
              )}
            </div>

          </section>
        </>
      )}

    </div>
  );
};
