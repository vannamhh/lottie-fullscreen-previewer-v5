import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { Notice, dismissNotice, subscribeToNotices } from '../utils/notify';

const TONE_STYLE: Record<Notice['tone'], string> = {
  error: 'bg-red-950/90 border-red-500/50 text-red-100',
  info: 'bg-slate-900/95 border-slate-700 text-slate-100',
  success: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100'
};

const TONE_ICON: Record<Notice['tone'], React.ComponentType<{ className?: string }>> = {
  error: AlertTriangle,
  info: Info,
  success: CheckCircle2
};

/** Renders the notices raised by `notify()`. Sits above every modal. */
const NoticeStackComponent: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => subscribeToNotices(setNotices), []);

  if (notices.length === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none w-full max-w-md px-4">
      {notices.map(notice => {
        const Icon = TONE_ICON[notice.tone];
        return (
          <div
            key={notice.id}
            role="status"
            className={`pointer-events-auto w-full flex items-start gap-2.5 px-3.5 py-2.5 backdrop-blur-xl border rounded-2xl shadow-2xl animate-fade-in ${TONE_STYLE[notice.tone]}`}
          >
            <Icon className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-xs font-medium leading-relaxed flex-1">{notice.message}</p>
            <button
              onClick={() => dismissNotice(notice.id)}
              className="p-0.5 opacity-60 hover:opacity-100 transition-opacity shrink-0"
              aria-label="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export const NoticeStack = React.memo(NoticeStackComponent);
