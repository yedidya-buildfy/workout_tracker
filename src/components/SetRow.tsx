import React, { useState } from 'react';
import { WorkoutSet, Exercise } from '../types';
import { useWorkoutStore } from '../store/workoutStore';
import { Check, X, Clock } from 'lucide-react';

interface SetRowProps {
  set: WorkoutSet;
  exercise: Exercise;
  workoutId: string;
  onComplete: () => void;
  restTime?: number;
  isFirstSet: boolean;
  isFirstExercise: boolean;
}

export const SetRow: React.FC<SetRowProps> = ({
  set,
  exercise,
  workoutId,
  onComplete,
  restTime = 0,
  isFirstSet,
  isFirstExercise,
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

  const formatRestTime = (seconds: number) => {
    if (isFirstSet && isFirstExercise) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="flex items-center gap-2 bg-gray-700 p-2 rounded">
      <input
        type="number"
        inputMode="decimal"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={handleUpdate}
        className="w-20 bg-gray-600 text-white px-2 py-1 rounded placeholder-gray-400"
        placeholder="Weight"
      />
      <input
        type="number"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={handleUpdate}
        className="w-20 bg-gray-600 text-white px-2 py-1 rounded placeholder-gray-400"
        placeholder="Reps"
      />
      <div className="flex items-center gap-1 ml-auto text-gray-400">
        <Clock size={14} />
        <span className="text-sm">{formatRestTime(set.completed ? set.restTime || 0 : restTime)}</span>
      </div>
      <button
        onClick={onComplete}
        className={`p-2 rounded-full ${
          set.completed ? 'bg-green-600' : 'bg-gray-600'
        }`}
      >
        <Check size={16} />
      </button>
      <button
        onClick={() => deleteSet(workoutId, exercise.id, set.id)}
        className="p-2 bg-red-600 rounded-full"
      >
        <X size={16} />
      </button>
    </div>
  );
};