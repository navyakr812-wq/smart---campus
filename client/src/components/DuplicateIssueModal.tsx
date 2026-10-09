import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Issue, IssueCategory, IssuePriority } from '../types';
import { AlertCircle, ThumbsUp, X, Sparkles, Send, ShieldAlert } from 'lucide-react';

interface DuplicateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueCreated: (newIssue: Issue) => void;
  onMeTooUpvoted: (issueId: string) => void;
}

const CATEGORIES: IssueCategory[] = [
  'Infrastructure',
  'IT & WiFi',
  'Cleanliness',
  'Lab Equipment',
  'Library',
  'Cafeteria',
  'Other',
];

const PRIORITIES: IssuePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const DuplicateIssueModal: React.FC<DuplicateIssueModalProps> = ({
  isOpen,
  onClose,
  onIssueCreated,
  onMeTooUpvoted,
}) => {
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('Infrastructure');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('MEDIUM');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    isDuplicate: boolean;
    confidence: number;
    matchedIssue: Issue | null;
    message?: string;
  } | null>(null);

  // Live duplicate checking on debounce
  useEffect(() => {
    if (title.trim().length < 4 || location.trim().length < 2) {
      setDuplicateWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsCheckingDuplicate(true);
        const res = await api.checkDuplicateIssue({
          title,
          category,
          location,
          description,
        });

        if (res.isDuplicate && res.matchedIssue) {
          setDuplicateWarning({
            isDuplicate: true,
            confidence: res.similarityScore,
            matchedIssue: res.matchedIssue,
            message: res.message,
          });
        } else {
          setDuplicateWarning(null);
        }
      } catch (err) {
        // Silently ignore check errors
      } finally {
        setIsCheckingDuplicate(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [title, category, location, description]);

  if (!isOpen) return null;

  const handleSubmit = async (force: boolean = false) => {
    if (!title.trim() || !location.trim() || !description.trim()) {
      addToast('Missing Fields', 'Please fill in all required fields.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createIssue({
        title,
        description,
        category,
        location,
        priority,
        forceCreate: force,
      });

      addToast('Issue Reported', 'Your issue has been logged and queued for review.', 'success');
      onIssueCreated(res.issue);
      onClose();
    } catch (err: any) {
      if (err.data?.duplicateDetected && err.data.matchedIssue) {
        setDuplicateWarning({
          isDuplicate: true,
          confidence: err.data.similarityScore || 85,
          matchedIssue: err.data.matchedIssue,
          message: err.data.message,
        });
      } else {
        addToast('Report Failed', err.message || 'Could not report issue', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChooseMeToo = () => {
    if (duplicateWarning?.matchedIssue) {
      onMeTooUpvoted(duplicateWarning.matchedIssue._id);
      addToast('Upvoted!', 'Added your "Me Too" vote to the existing issue.', 'success');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="glass-card max-w-lg w-full rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-5 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">Report Campus Issue</h3>
              <p className="text-xs text-slate-400">Automated duplicate detection helps prioritize fixes</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4">
          
          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as IssueCategory)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as IssuePriority)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Specific Location *
            </label>
            <input
              type="text"
              placeholder="e.g. Main Library 3rd Floor / Room 204 / Cafeteria"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Issue Title *</label>
              {isCheckingDuplicate && (
                <span className="text-[10px] text-teal-400 flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3 h-3" /> Checking duplicates...
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="e.g. AC unit making loud noise and not cooling"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Details *</label>
            <textarea
              rows={3}
              placeholder="Describe the issue, how long it has been broken, or specific symptoms..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none resize-none"
            />
          </div>

          {/* DUPLICATE DETECTION PROMINENT CARD */}
          {duplicateWarning && duplicateWarning.matchedIssue && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-left space-y-3 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-300">
                      Possible Duplicate Detected ({duplicateWarning.confidence}% Match)
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                      {duplicateWarning.matchedIssue.upvoters?.length || 1} Me Too Votes
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-semibold mt-1">
                    "{duplicateWarning.matchedIssue.title}"
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Location: {duplicateWarning.matchedIssue.location} • Status: {duplicateWarning.matchedIssue.status}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleChooseMeToo}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Tap "Me Too" Instead (Recommended)
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
                >
                  Create Anyway
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          {!duplicateWarning && (
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Submitting...' : 'Submit Issue'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
