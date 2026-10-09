import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AnnouncementItem } from '../types';
import { SkeletonList, EmptyState, ErrorState } from '../components/Skeleton';
import {
  Megaphone,
  AlertTriangle,
  Clock,
  User,
  Plus,
  Send,
  X
} from 'lucide-react';

export const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const canPost = user?.role === 'ADMIN' || user?.role === 'FACULTY';

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Post Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getAnnouncements();
      setAnnouncements(data || []);
    } catch (err: any) {
      console.error('[ANNOUNCEMENTS PAGE] Fetch error:', err);
      setError(err.message || 'Failed to retrieve announcements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      addToast('Missing Details', 'Please provide a title and announcement content.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createAnnouncement({
        title,
        content,
        category,
        priority,
      });

      addToast(
        'Notice Published! 📢',
        `Announcement posted and broadcast to all enrolled students!`,
        'success'
      );

      setAnnouncements(prev => [res.announcement, ...prev]);
      setIsModalOpen(false);
      setTitle('');
      setContent('');
    } catch (err: any) {
      addToast('Publish Failed', err.message || 'Could not post announcement', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 pb-20 pt-2">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">
              Campus Bulletin Board
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Official Announcements
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Official updates from University Faculty and Campus Operations with push broadcasts.
          </p>
        </div>

        {canPost && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Post Notice</span>
          </button>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && <SkeletonList count={3} />}

      {/* Error state */}
      {!isLoading && error && (
        <ErrorState
          title="Could not load announcements"
          message={error}
          onRetry={fetchAnnouncements}
        />
      )}

      {/* Announcements Stream */}
      {!isLoading && (
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <EmptyState
              title="No Announcements"
              description="No active announcements have been published recently."
            />
          ) : (
            announcements.map(notice => {
              const isUrgent = notice.priority === 'URGENT';
              return (
                <div
                  key={notice._id}
                  className={`glass-card rounded-2xl p-5 border transition-all ${
                    isUrgent
                      ? 'border-rose-500/40 bg-gradient-to-r from-rose-950/20 via-slate-900 to-slate-900'
                      : 'border-slate-800/80 bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                        {notice.category}
                      </span>
                      {isUrgent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> URGENT
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(notice.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base sm:text-lg text-white mb-2">
                    {notice.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line mb-4">
                    {notice.content}
                  </p>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      Published by <strong className="text-white">{notice.authorName}</strong> ({notice.authorRole})
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Post Notice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-card max-w-lg w-full rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Post Campus Announcement</h3>
                  <p className="text-xs text-slate-400">Broadcasts instant notification to all students</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Events">Events</option>
                    <option value="Urgent">Urgent</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as 'NORMAL' | 'URGENT')}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="NORMAL">Normal Priority</option>
                    <option value="URGENT">Urgent Alert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule for Midterm Examinations"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notice Content *</label>
                <textarea
                  rows={4}
                  placeholder="Detailed announcement content..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Publishing...' : 'Broadcast Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
