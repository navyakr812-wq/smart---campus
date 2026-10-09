import React from 'react';
import { useToast, ToastMessage, ToastVariant } from '../context/ToastContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const getVariantStyles = (variant: ToastVariant) => {
    switch (variant) {
      case 'success':
        return {
          bg: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
        };
      case 'error':
        return {
          bg: 'bg-rose-950/90 border-rose-500/40 text-rose-200',
          icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/90 border-amber-500/40 text-amber-200',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-slate-900/90 border-teal-500/40 text-slate-200',
          icon: <Info className="w-5 h-5 text-teal-400 shrink-0" />,
        };
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast: ToastMessage) => {
        const { bg, icon } = getVariantStyles(toast.variant);
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform translate-y-0 ${bg}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm leading-tight text-white">{toast.title}</div>
              {toast.message && (
                <div className="text-xs mt-1 text-slate-300 leading-normal line-clamp-3">
                  {toast.message}
                </div>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors shrink-0"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
