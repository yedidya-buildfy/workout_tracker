import React from 'react';
import { format } from 'date-fns';
import { Workout } from '../types';

interface WorkoutSummaryViewProps {
  workout: Workout;
  onFinish: () => void;
}

export const WorkoutSummaryView: React.FC<WorkoutSummaryViewProps> = ({
  workout,
  onFinish,
}) => {
  // Calculate total sets
  const totalSets = workout.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.length,
    0
  );

  // Calculate workout duration in minutes
  const durationMinutes = Math.round(workout.duration / 60);

  // Format for displaying time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Format rest time
  const formatRestTime = (seconds?: number) => {
    if (!seconds) return '';
    if (seconds < 60) return `(${seconds}s)`;
    return `(${Math.floor(seconds / 60)}m ${seconds % 60}s)`;
  };

  // Divide exercises into columns
  const columns = 3;
  const exercisesPerColumn = Math.ceil(workout.exercises.length / columns);
  const exerciseColumns: Workout['exercises'][] = Array(columns)
    .fill(null)
    .map((_, i) => 
      workout.exercises.slice(
        i * exercisesPerColumn, 
        (i + 1) * exercisesPerColumn
      )
    )
    .filter(col => col.length > 0);

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col p-3 text-white">
      {/* Circles at the top */}
      <div className="relative flex justify-between items-center mb-4 mt-8 px-4">
        {/* Left Circle - Sets */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex flex-col items-center justify-center border border-blue-500">
            <div className="text-lg font-bold">{totalSets}</div>
            <div className="text-xs text-gray-400">SETS</div>
          </div>
        </div>

        {/* Middle Circle - Time (elevated) */}
        <div className="flex flex-col items-center -mt-4">
          <div className="w-24 h-24 rounded-full bg-gray-800 flex flex-col items-center justify-center border border-blue-500">
            <div className="text-lg font-bold">{formatTime(workout.duration)}</div>
            <div className="text-xs text-gray-400">TIME</div>
          </div>
        </div>

        {/* Right Circle - Exercises */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex flex-col items-center justify-center border border-blue-500">
            <div className="text-lg font-bold">{workout.exercises.length}</div>
            <div className="text-xs text-gray-400">EXERCISES</div>
          </div>
        </div>
      </div>

      {/* Date and Workout Name */}
      <div className="text-center mb-3">
        <h1 className="text-sm font-bold">{workout.name}</h1>
        <p className="text-xs text-gray-400">
          {format(new Date(workout.date), 'MMMM dd, yyyy')}
        </p>
      </div>

      {/* Exercises Grid */}
      <div className="flex-1 flex">
        {exerciseColumns.map((column, colIndex) => (
          <div key={colIndex} className="flex-1 px-1">
            {column.map((exercise, i) => (
              <div 
                key={exercise.id} 
                className="mb-2 bg-gray-800 rounded-sm p-1.5"
              >
                <div className="text-xs font-semibold mb-1">{exercise.name}</div>
                <div className="space-y-0.5">
                  {exercise.sets.map((set, setIndex) => (
                    <div key={set.id} className="text-[10px] flex justify-between">
                      <div>
                        {set.weight} × {set.reps}
                      </div>
                      <div className="text-gray-400">
                        {formatRestTime(set.restTime)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Finish Button */}
      <div className="mt-auto pt-3">
        <button
          onClick={onFinish}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium"
        >
          Finish
        </button>
      </div>
    </div>
  );
};