import React from 'react';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import { useWorkoutStore } from '../store/workoutStore';
import { Plus, Dumbbell, Clock } from 'lucide-react';
import { Workout } from '../types';

interface CalendarViewProps {
  onAddWorkout: (date: Date) => void;
  onSelectWorkout: (workout: Workout) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onAddWorkout, onSelectWorkout }) => {
  const workouts = useWorkoutStore((state) => state.workouts);
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const tileContent = ({ date }: { date: Date }) => {
    const dayWorkouts = workouts.filter(
      (workout) => workout.date === format(date, 'yyyy-MM-dd')
    );
    
    if (dayWorkouts.length === 0) return null;

    return (
      <div className="workout-indicator">
        {[...Array(Math.min(dayWorkouts.length, 3))].map((_, i) => (
          <div key={i} className="workout-indicator-dot" />
        ))}
      </div>
    );
  };

  const selectedDateWorkouts = workouts.filter(
    (workout) => workout.date === format(selectedDate, 'yyyy-MM-dd')
  );

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="p-4 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Workout Tracker</h1>
          <p className="text-gray-400">Track your fitness journey</p>
        </div>
        <div className="bg-gray-800 p-3 rounded-lg">
          <Dumbbell size={24} className="text-blue-500" />
        </div>
      </div>

      <Calendar
        onChange={setSelectedDate}
        value={selectedDate}
        tileContent={tileContent}
        className="rounded-lg shadow-lg bg-gray-800 text-white p-4 w-full"
        nextLabel="›"
        prevLabel="‹"
        next2Label="»"
        prev2Label="«"
      />

      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">
          {format(selectedDate, 'MMMM dd, yyyy')}
        </h2>
        
        {selectedDateWorkouts.length > 0 ? (
          <div className="space-y-3 mb-4">
            {selectedDateWorkouts.map((workout) => (
              <button
                key={workout.id}
                onClick={() => onSelectWorkout(workout)}
                className="w-full bg-gray-700 p-3 rounded-lg hover:bg-gray-600 transition-colors text-left"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{workout.name}</span>
                  {workout.duration > 0 && (
                    <div className="flex items-center text-gray-400 text-sm">
                      <Clock size={14} className="mr-1" />
                      {formatDuration(workout.duration)}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {workout.exercises.length} exercises
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 mb-4">No workouts on this day</p>
        )}

        <button
          onClick={() => onAddWorkout(selectedDate)}
          className="w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Workout
        </button>
      </div>

      <button
        onClick={() => onAddWorkout(selectedDate)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        aria-label="Add workout"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};