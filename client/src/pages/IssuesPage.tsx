import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Issue, IssueCategory, IssueStatus } from '../types';
import { SkeletonList, EmptyState, ErrorState } from '../components/Skeleton';
import { DuplicateIssueModal } from '../components/DuplicateIssueModal';
import { AdminStatusModal } from '../components/AdminStatusModal';
import {
  AlertTriangle,
  Plus,
  ThumbsUp,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Filter,
  User,
  ArrowUpDown
} from 'lucide-react';

export const IssuesPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const isAdmin = user?.role === 'ADMIN';

  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [adminModalIssue, setAdminModalIssue] = useState<Issue | null>(null);

  const fetchIssues = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getIssues({
        category: filterCategory,
        status: filterStatus,
      });
      setIssues(data || []);
    } catch (err: any) {
      console.error('[ISSUES PAGE] Fetch error:', err);
      setError(err.message || 'Failed to retrieve campus issues');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [filterCategory, filterStatus]);

  const handleUpvote = async (issueId: string) => {
    try {
      const res = await api.upvoteIssue(issueId);
      addToast(
        res.upvoted ? 'Upvoted! 👍' : 'Removed Vote',
        res.upvoted
          ? 'You upvoted this issue via "Me Too". Administrators will see this prioritized!'
          : 'Your upvote has been retracted.',
        res.upvoted ? 'success' : 'info'
      );

      // Re-sort / update issues list
      setIssues(prev =>
        prev.map(i => (i._id === issueId ? res.issue : i)).sort((a, b) => {
          const vDiff = (b.upvoters?.length || 0) - (a.upvoters?.length || 0);
          if (vDiff !== 0) return vDiff;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
      );
    } catch (err: any) {
      addToast('Vote Failed', err.message || 'Could not register upvote', 'error');
    }
  };

  const getStatusBadgeStyle = (status: IssueStatus) => {
    switch (status) {
      case 'Resolved':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'In Progress':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'Assigned':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'Reported':
      default:
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
  };

  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40 font-semibold';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'LOW':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 pb-20 pt-2">
      
      {/* Top Banner & Report CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">
              Community Issue Resolution
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Campus Issues & "Me Too"
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Issues are ranked by community votes and severity. Automated duplicate detection combines matching reports.
          </p>
        </div>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Report Campus Issue</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        
        {/* Category filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <span className="text-slate-400 shrink-0 font-medium">Category:</span>
          {['ALL', 'Infrastructure', 'IT & WiFi', 'Cleanliness', 'Lab Equipment'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-full shrink-0 font-semibold border transition-all ${
                filterCategory === cat
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Status:</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-2.5 py-1 text-xs text-white outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Reported">Reported</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

      </div>

      {/* Loading Skeleton */}
      {isLoading && <SkeletonList count={3} />}

      {/* Error state */}
      {!isLoading && error && (
        <ErrorState
          title="Could not load issues"
          message={error}
          onRetry={fetchIssues}
        />
      )}

      {/* Issues Cards Stream */}
      {!isLoading && (
        <div className="space-y-3.5">
          {issues.length === 0 ? (
            <EmptyState
              title="No Issues Found"
              description="No open issues match your filter criteria. Everything looks clean and operational!"
              actionText="Report an Issue"
              onAction={() => setIsReportModalOpen(true)}
            />
          ) : (
            issues.map(issue => {
              const hasUpvoted =
                user && issue.upvoters?.some(u => (typeof u === 'string' ? u === user._id : u._id === user._id));
              const voteCount = issue.upvoters?.length || 0;

              return (
                <div
                  key={issue._id}
                  className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                          {issue.category}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${getPriorityBadgeStyle(
                            issue.priority
                          )}`}
                        >
                          {issue.priority} Priority
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                            issue.status
                          )}`}
                        >
                          {issue.status}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight">
                        {issue.title}
                      </h3>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {issue.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {issue.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(issue.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          Reported by {issue.reportedBy?.name || 'Student'}
                        </span>
                      </div>
                    </div>

                    {/* Upvote / Admin Actions */}
                    <div className="flex sm:flex-col items-center justify-between sm:justify-start gap-2 pt-2 sm:pt-0 shrink-0">
                      
                      {/* "Me Too" Upvote Button */}
                      <button
                        onClick={() => handleUpvote(issue._id)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                          hasUpvoted
                            ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                        title='Tap "Me Too" to upvote this issue'
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-current' : ''}`} />
                        <span>Me Too ({voteCount})</span>
                      </button>

                      {/* Admin Status Update Button */}
                      {isAdmin && (
                        <button
                          onClick={() => setAdminModalIssue(issue)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Change Status</span>
                        </button>
                      )}

                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Duplicate Issue Modal */}
      <DuplicateIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onIssueCreated={newIssue => {
          setIssues(prev => [newIssue, ...prev]);
        }}
        onMeTooUpvoted={issueId => {
          handleUpvote(issueId);
        }}
      />

      {/* Admin Status Modal */}
      <AdminStatusModal
        isOpen={!!adminModalIssue}
        issue={adminModalIssue}
        onClose={() => setAdminModalIssue(null)}
        onStatusUpdated={updatedIssue => {
          setIssues(prev => prev.map(i => (i._id === updatedIssue._id ? updatedIssue : i)));
        }}
      />

    </div>
  );
};
