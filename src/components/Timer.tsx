import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  label: string;
  duration?: number;
  onTick?: () => void;
  isRunning: boolean;
  onTimeUpdate?: (seconds: number) => void;
}

export const Timer: React.FC<TimerProps> = ({ 
  label, 
  duration, 
  onTick, 
  isRunning,
  onTimeUpdate 
}) => {
  const [time, setTime] = useState(duration || 0);

  // Only initialize the timer value when first mounted or when timer is not running
  useEffect(() => {
    if (!isRunning && duration !== undefined) {
      setTime(duration);
    }
  }, [duration, isRunning]);

  // Run the timer when isRunning is true
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => {
          const newTime = prev + 1;
          // Call the onTimeUpdate prop with the new time if provided
          if (onTimeUpdate) {
            onTimeUpdate(newTime);
          }
          return newTime;
        });
        onTick?.();
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, onTick, onTimeUpdate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg">
      <Clock size={20} className="text-blue-500" />
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-xl font-mono">{formatTime(time)}</p>
      </div>
    </div>
  );
};