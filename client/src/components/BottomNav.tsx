import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Zap,
  Users,
  DoorOpen,
  AlertTriangle,
  Calendar,
  Sparkles,
  BarChart3,
  BookmarkCheck,
  Megaphone,
  Grid
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAI: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab, onOpenAI }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    { id: 'now', label: 'Now', icon: Zap },
    { id: 'crowd', label: 'Crowd', icon: Users },
    { id: 'rooms', label: 'Rooms', icon: DoorOpen },
    { id: 'issues', label: 'Issues', icon: AlertTriangle },
    { id: 'timetable', label: 'Classes', icon: Calendar },
    ...(isAdmin ? [{ id: 'analytics', label: 'Admin', icon: BarChart3 }] : []),
  ];

  return (
    <>
      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around safe-bottom">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-teal-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Desktop Top/Side Navigation Pill Bar */}
      <div className="hidden md:flex items-center gap-1.5 p-1.5 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 my-4 max-w-7xl mx-auto px-3">
        <button
          onClick={() => onSelectTab('now')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'now'
              ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Zap className="w-4 h-4 fill-current" />
          Now Engine
        </button>

        <button
          onClick={() => onSelectTab('crowd')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'crowd'
              ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          Live Crowd
        </button>

        <button
          onClick={() => onSelectTab('rooms')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'rooms'
              ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          Free Rooms
        </button>

        <button
          onClick={() => onSelectTab('issues')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'issues'
              ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Campus Issues
        </button>

        <button
          onClick={() => onSelectTab('timetable')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'timetable'
              ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Schedule & Attendance
        </button>

        <button
          onClick={() => onSelectTab('events')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'events'
              ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BookmarkCheck className="w-4 h-4" />
          Events
        </button>

        <button
          onClick={() => onSelectTab('announcements')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'announcements'
              ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Notices
        </button>

        {isAdmin && (
          <button
            onClick={() => onSelectTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-rose-500 text-white shadow-md font-bold'
                : 'text-rose-300 hover:text-white hover:bg-rose-950/40'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Admin Analytics
          </button>
        )}

        <div className="ml-auto pl-2">
          <button
            onClick={onOpenAI}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 text-teal-300 hover:bg-teal-500/20 border border-teal-500/30 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            CampusAI
          </button>
        </div>
      </div>
    </>
  );
};
