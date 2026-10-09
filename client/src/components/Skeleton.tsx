import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-800/60 border border-slate-700/20 ${className}`}
    />
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-4 border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-20 h-3" />
          </div>
        </div>
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      <Skeleton className="w-full h-12 rounded-xl" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-20 h-8 rounded-lg" />
      </div>
    </div>
  );
};

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ icon, title, description, actionText, onAction }) => {
  return (
    <div className="glass-card rounded-2xl p-8 text-center flex flex-col items-center justify-center my-6 border border-slate-800/80">
      <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700/50 flex items-center justify-center mb-4 text-teal-400">
        {icon || <span className="text-2xl">⚡</span>}
      </div>
      <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-lg transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}> = ({ title = 'Something went wrong', message = 'Could not load data from campus server.', onRetry }) => {
  return (
    <div className="glass-card rounded-2xl p-6 text-center border border-rose-900/40 bg-rose-950/20 my-4">
      <div className="w-12 h-12 rounded-xl bg-rose-900/30 text-rose-400 mx-auto flex items-center justify-center mb-3">
        ⚠️
      </div>
      <h4 className="text-base font-bold text-white mb-1">{title}</h4>
      <p className="text-xs text-rose-200/70 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3.5 py-1.5 text-xs font-semibold text-rose-300 bg-rose-900/50 hover:bg-rose-900/80 rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};
