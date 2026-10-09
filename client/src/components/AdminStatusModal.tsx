import React, { useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Issue, IssueStatus } from '../types';
import { ShieldCheck, X, Send } from 'lucide-react';

interface AdminStatusModalProps {
  isOpen: boolean;
  issue: Issue | null;
  onClose: () => void;
  onStatusUpdated: (updatedIssue: Issue) => void;
}

const STATUSES: IssueStatus[] = ['Reported', 'Assigned', 'In Progress', 'Resolved'];

export const AdminStatusModal: React.FC<AdminStatusModalProps> = ({
  isOpen,
  issue,
  onClose,
  onStatusUpdated,
}) => {
  const { addToast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus>(issue?.status || 'Reported');
  const [comment, setComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  React.useEffect(() => {
    if (issue) {
      setSelectedStatus(issue.status);
      setComment('');
    }
  }, [issue]);

  if (!isOpen || !issue) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      const res = await api.updateIssueStatus(issue._id, selectedStatus, comment);
      addToast(
        'Status Updated',
        `Changed to "${selectedStatus}". ${res.notifiedStudentsCount || 0} students notified!`,
        'success'
      );
      onStatusUpdated(res.issue);
      onClose();
    } catch (err: any) {
      addToast('Update Failed', err.message || 'Could not update status', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-card max-w-md w-full rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Update Issue Status</h3>
              <p className="text-xs text-slate-400">Admin resolution workflow</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Issue summary */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-left">
          <p className="text-xs font-bold text-white line-clamp-1">{issue.title}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {issue.location} • {issue.upvoters?.length || 1} Me Too votes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select New Status *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map(s => {
                const isSelected = selectedStatus === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedStatus(s)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Admin Note / Resolution Comment
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Technician dispatched / Bulb replaced in Room 204"
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none resize-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              🔔 A push notification will be instantly sent to the reporter and all students who upvoted.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              {isUpdating ? 'Broadcasting...' : 'Update & Notify'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
