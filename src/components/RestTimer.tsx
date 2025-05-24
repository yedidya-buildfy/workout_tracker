import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface RestTimerProps {
  onTimeUpdate?: (seconds: number) => void;
  isRunning: boolean;
  onStop?: (seconds: number) => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({ onTimeUpdate, isRunning, onStop }) => {
  const [displayTime, setDisplayTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Calculate elapsed time based on start time
  const calculateElapsedTime = () => {
    if (startTimeRef.current === null) return 0;
    return Math.floor((Date.now() - startTimeRef.current) / 1000);
  };

  // Initialize timer when isRunning becomes true
  useEffect(() => {
    if (isRunning && startTimeRef.current === null) {
      startTimeRef.current = Date.now();
      setDisplayTime(0);
    } else if (!isRunning && startTimeRef.current !== null) {
      const finalTime = calculateElapsedTime();
      if (onStop) {
        onStop(finalTime);
      }
      startTimeRef.current = null;
    }
  }, [isRunning, onStop]);

  // Update display time every second
  useEffect(() => {
    if (isRunning) {
      // Initial update
      const elapsed = calculateElapsedTime();
      setDisplayTime(elapsed);
      if (onTimeUpdate) {
        onTimeUpdate(elapsed);
      }

      // Set up interval for updates
      intervalRef.current = window.setInterval(() => {
        const elapsed = calculateElapsedTime();
        setDisplayTime(elapsed);
        if (onTimeUpdate) {
          onTimeUpdate(elapsed);
        }
      }, 1000);
    } else if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, onTimeUpdate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg">
      <Clock size={20} className="text-blue-500" />
      <div>
        <p className="text-sm text-gray-400">Rest Timer</p>
        <p className="text-xl font-mono">{formatTime(displayTime)}</p>
      </div>
    </div>
  );
}; 