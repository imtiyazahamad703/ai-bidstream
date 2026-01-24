import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endTime: string;
  onExpire?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ endTime, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const endStr = endTime.endsWith('Z') ? endTime : endTime + 'Z';
      const end = new Date(endStr).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      return {
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isExpired: false
      };
    };

    // Initial calculation
    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    if (initialTime.isExpired) {
      if (onExpire) onExpire();
      return;
    }

    const timerId = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);

      if (newTime.isExpired) {
        clearInterval(timerId);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timerId);
  }, [endTime, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
        <Clock className="w-4 h-4" />
        <span className="font-mono text-sm font-bold tracking-widest">AUCTION ENDED</span>
      </div>
    );
  }

  // Visual cues based on time remaining
  const isDanger = timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds < 60;
  const isWarning = timeLeft.hours === 0 && timeLeft.minutes < 5 && !isDanger;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
        isDanger
          ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 animate-pulse'
          : isWarning
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
      }`}
    >
      <Clock className="w-4 h-4" />
      <div className="font-mono text-sm font-bold tracking-widest flex items-center">
        <span>{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="opacity-50 mx-0.5">:</span>
        <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="opacity-50 mx-0.5">:</span>
        <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
    </div>
  );
};
