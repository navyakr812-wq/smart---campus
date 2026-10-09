import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTimeSim, TIME_PRESETS } from '../context/TimeSimContext';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import {
  Zap,
  Clock,
  Bell,
  CheckCheck,
  ChevronDown,
  User as UserIcon,
  LogOut,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Users
} from 'lucide-react';

interface NavbarProps {
  onOpenAI: () => void;
  onNavigateTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAI, onNavigateTab }) => {
  const { user, logout, loginDemo } = useAuth();
  const { isSimulated, activePresetId, setPreset, resetToRealTime, displayTimeLabel } = useTimeSim();

  const [showSimModal, setShowSimModal] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const loadNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.warn('[NAVBAR] Failed to fetch notifications:', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000); // 30s poll
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await api.markNotificationRead(notif._id);
        setNotifications(prev =>
          prev.map(n => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }
    if (notif.link) {
      const tab = notif.link.replace('/', '');
      onNavigateTab(tab);
      setShowNotifDropdown(false);
    }
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      case 'FACULTY':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'STUDENT':
      default:
        return 'bg-teal-500/10 text-teal-300 border-teal-500/30';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80 px-4 lg:px-8 py-2.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('now')}
              className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/25 group-hover:shadow-teal-500/40 transition-all">
                <Zap className="w-5 h-5 text-slate-950 fill-current" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                    CAMPUS<span className="text-teal-400">NOW</span>
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping mr-1"></span>
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                  Real-Time Campus Decision Engine
                </p>
              </div>
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Time Simulator Pill */}
            <button
              onClick={() => setShowSimModal(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isSimulated
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
              title="Toggle or change schedule time simulation"
            >
              <Clock className={`w-3.5 h-3.5 ${isSimulated ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden md:inline font-mono">{displayTimeLabel}</span>
              <span className="md:hidden font-mono">
                {isSimulated ? activePresetId?.split('-')[1] || 'Sim' : 'Live'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {/* CampusAI Quick Launch Button */}
            <button
              onClick={onOpenAI}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-md shadow-teal-500/20 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setShowNotifDropdown(prev => !prev);
                  if (!showNotifDropdown) loadNotifications();
                }}
                className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Drawer */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-card rounded-2xl border border-slate-800 shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-slate-400 hover:text-teal-400 flex items-center gap-1 transition-colors"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto mt-2 space-y-2 pr-1">
                    {loadingNotifs && (
                      <div className="text-center py-6 text-xs text-slate-500 animate-pulse">
                        Loading notifications...
                      </div>
                    )}
                    {!loadingNotifs && notifications.length === 0 && (
                      <div className="text-center py-8 text-xs text-slate-500">
                        No notifications yet. You're all caught up!
                      </div>
                    )}
                    {!loadingNotifs &&
                      notifications.map(n => (
                        <div
                          key={n._id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 rounded-xl cursor-pointer text-left transition-all border ${
                            n.isRead
                              ? 'bg-slate-900/40 border-slate-800/40 text-slate-400 hover:bg-slate-900/70'
                              : 'bg-teal-950/30 border-teal-500/30 text-slate-200 hover:bg-teal-950/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-xs text-white leading-tight">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs mt-1 text-slate-300/80 leading-normal line-clamp-2">
                            {n.message}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Demo Switcher */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setShowUserDropdown(prev => !prev)}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-600/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-xs uppercase">
                  {user?.name?.slice(0, 2) || 'U'}
                </div>
                <div className="text-left hidden sm:block leading-none">
                  <div className="text-xs font-semibold text-white truncate max-w-[100px]">
                    {user?.name?.split(' ')[0] || 'User'}
                  </div>
                  <span
                    className={`inline-block text-[9px] font-bold px-1 py-0.5 rounded border mt-0.5 ${getRoleBadgeStyle(
                      user?.role
                    )}`}
                  >
                    {user?.role || 'STUDENT'}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
              </button>

              {/* User / Demo Role Switcher Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 glass-card rounded-2xl border border-slate-800 shadow-2xl p-3 z-50">
                  <div className="px-2 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRoleBadgeStyle(user?.role)}`}>
                        {user?.role}
                      </span>
                      {user?.studentId && (
                        <span className="text-[10px] text-slate-400">ID: {user.studentId}</span>
                      )}
                    </div>
                  </div>

                  {/* Switch Demo Persona Quick Links */}
                  <div className="py-2 border-b border-slate-800">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-2 mb-1">
                      Quick Demo Switcher
                    </p>
                    <button
                      onClick={() => {
                        loginDemo('student');
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-800/80 flex items-center justify-between text-slate-300"
                    >
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-teal-400" />
                        Alex Rivera (Student 1)
                      </span>
                      {user?.email === 'student@campus.test' && <span className="text-teal-400 text-xs">●</span>}
                    </button>
                    <button
                      onClick={() => {
                        loginDemo('student2');
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-800/80 flex items-center justify-between text-slate-300"
                    >
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-teal-400" />
                        Jordan Lee (Student 2 - Me Too)
                      </span>
                      {user?.email === 'student2@campus.test' && <span className="text-teal-400 text-xs">●</span>}
                    </button>
                    <button
                      onClick={() => {
                        loginDemo('faculty');
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-800/80 flex items-center justify-between text-slate-300"
                    >
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                        Dr. Evelyn Reed (Faculty)
                      </span>
                      {user?.email === 'faculty@campus.test' && <span className="text-purple-400 text-xs">●</span>}
                    </button>
                    <button
                      onClick={() => {
                        loginDemo('admin');
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-800/80 flex items-center justify-between text-slate-300"
                    >
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                        Campus Admin (Admin)
                      </span>
                      {user?.email === 'admin@campus.test' && <span className="text-rose-400 text-xs">●</span>}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    className="w-full mt-2 px-2 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 transition-colors font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Time Simulation Modal */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card max-w-md w-full rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Time & Schedule Simulator</h3>
                  <p className="text-xs text-slate-400">Ensure judge demos are vibrant 24/7</p>
                </div>
              </div>
              <button
                onClick={() => setShowSimModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              University schedules depend on the time of day and week. Select a scenario preset below to simulate being right before a lecture, in a break gap, or at lunchtime!
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {TIME_PRESETS.map(preset => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setPreset(preset.id);
                      setShowSimModal(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white">{preset.label}</span>
                      {isSelected && <span className="text-xs font-bold text-amber-400">Active</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{preset.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <button
                onClick={() => {
                  resetToRealTime();
                  setShowSimModal(false);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Use Real System Clock
              </button>

              <button
                onClick={() => setShowSimModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
