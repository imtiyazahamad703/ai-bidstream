import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Notification {
  id: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'OUTBID' | 'SUCCESS';
  timestamp: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map(notif => {
          let Icon = Info;
          let bgColor = 'bg-slate-900/90 border-slate-700';
          let textColor = 'text-white';
          let iconColor = 'text-indigo-400';
          let title = 'System Info';

          if (notif.type === 'OUTBID') {
            Icon = ShieldAlert;
            bgColor = 'bg-rose-950/90 border-rose-500/50';
            textColor = 'text-rose-100';
            iconColor = 'text-rose-400';
            title = 'Outbid Alert';
          } else if (notif.type === 'SUCCESS') {
            Icon = CheckCircle2;
            bgColor = 'bg-emerald-950/90 border-emerald-500/50';
            textColor = 'text-emerald-100';
            iconColor = 'text-emerald-400';
            title = 'Success';
          } else if (notif.type === 'WARNING') {
            Icon = AlertTriangle;
            bgColor = 'bg-amber-950/90 border-amber-500/50';
            textColor = 'text-amber-100';
            iconColor = 'text-amber-400';
            title = 'Warning';
          }

          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 20, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              layout
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${bgColor} pointer-events-auto flex items-start gap-3`}
            >
              <div className="shrink-0 mt-0.5">
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${iconColor}`}>
                  {title}
                </h4>
                <p className={`font-medium text-sm leading-snug ${textColor}`}>
                  {notif.message}
                </p>
                <div className="text-[10px] opacity-60 mt-2 font-mono flex items-center justify-between">
                  <span>{new Date(notif.timestamp).toLocaleTimeString()}</span>
                  {notif.type === 'OUTBID' && (
                    <span className="animate-pulse">Action Required</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter; 