import React, { useState } from 'react';
import { WorkoutSet, Exercise, Workout } from '../types';
import { useWorkoutStore } from '../store/workoutStore';
import { Check, X, Clock } from 'lucide-react';

interface SetRowProps {
  set: WorkoutSet;
  exercise: Exercise;
  workoutId: string;
  onComplete: () => void;
  isFirstSet: boolean;
  isFirstExercise: boolean;
  completedSetsOrder: { setId: string; completedAt: number; }[];
  currentRestTime: number;
  isRestTimerRunning: boolean;
}

export const SetRow: React.FC<SetRowProps> = ({
  set,
  exercise,
  workoutId,
  onComplete,
  isFirstSet,
  isFirstExercise,
  completedSetsOrder,
  currentRestTime,
  isRestTimerRunning,
}) => {
  const { updateSet, deleteSet } = useWorkoutStore();
  const [weight, setWeight] = useState(set.weight ? set.weight.toString() : '');
  const [reps, setReps] = useState(set.reps ? set.reps.toString() : '');

  const handleUpdate = () => {
    const newWeight = parseFloat(weight) || 0;
    const newReps = parseInt(reps) || 0;
    
    updateSet(workoutId, exercise.id, {
      ...set,
      weight: newWeight,
      reps: newReps,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateSavedRestTime = () => {
    if (!set.completed || (isFirstExercise && isFirstSet)) return null;

    const thisSetCompletion = completedSetsOrder.find(item => item.setId === set.id);
    if (!thisSetCompletion) return null;

    const thisSetIndex = completedSetsOrder.findIndex(item => item.setId === set.id);
    if (thisSetIndex <= 0) return null;

    const previousSetCompletion = completedSetsOrder[thisSetIndex - 1];

    const restDuration = (thisSetCompletion.completedAt - previousSetCompletion.completedAt) / 1000;
    return formatTime(Math.floor(restDuration));
  };

  const savedRestTime = calculateSavedRestTime();

  const showTickingTimer = !set.completed && isRestTimerRunning;

  return (
    <div className="flex items-center gap-4 bg-gray-700 p-3 rounded-lg">
      <div className="flex items-center gap-4 flex-grow">
        <div className="w-16">
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onBlur={handleUpdate}
            className="w-full bg-gray-600 text-white px-2 py-1 rounded placeholder-gray-400 text-sm"
            placeholder="Weight"
          />
        </div>
        <div className="w-16">
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onBlur={handleUpdate}
            className="w-full bg-gray-600 text-white px-2 py-1 rounded placeholder-gray-400 text-sm"
            placeholder="Reps"
          />
        </div>
        <div className="flex-1 text-right text-sm text-gray-400 flex items-center justify-end">
          {set.completed && savedRestTime !== null ? (
             <div className="flex items-center gap-1">
               <Clock size={14} />
               <span className="text-gray-400">{savedRestTime}</span>
             </div>
          ) : (
            showTickingTimer ? (
              <div className="flex items-center gap-1">
                <Clock size={14} className="text-blue-400 animate-pulse" />
                <span className="text-blue-400 font-mono">{formatTime(currentRestTime)}</span>
              </div>
            ) : (
               (set.completed && (isFirstExercise && isFirstSet)) ? <span className="text-gray-500 text-xs">First Set</span> : <span className="text-gray-500">--:--</span>
            )
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onComplete}
          className={`p-2 rounded-full ${
            set.completed ? 'bg-green-600' : 'bg-gray-600'
          }`}
        >
          <Check size={20} />
        </button>
        <button
          onClick={() => deleteSet(workoutId, exercise.id, set.id)}
          className="p-2 bg-red-600 rounded-full"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};