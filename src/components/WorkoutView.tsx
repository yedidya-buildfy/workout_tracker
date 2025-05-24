import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useWorkoutStore } from '../store/workoutStore';
import { Workout, Exercise, WorkoutSet } from '../types';
import { Plus, X, Check, Edit2, Trash, StopCircle, Clock, Calendar, BarChart, Download } from 'lucide-react';
import { SetRow } from './SetRow';
import { WorkoutTimer } from './WorkoutTimer';

interface WorkoutViewProps {
  workout: Workout;
  onClose: () => void;
  onFinishWorkout: () => void;
}

// Extend Workout and WorkoutSet types
declare module '../types' {
  interface Workout {
    totalRest?: number;
    // Add field to store the order and completion time of sets
    completedSetsOrder?: { setId: string; completedAt: number; }[];
  }
  interface WorkoutSet {
     // No longer storing restTime directly on the set based on new requirements
     // restTime?: number;
  }
}

export const WorkoutView: React.FC<WorkoutViewProps> = ({
  workout,
  onClose,
  onFinishWorkout
}) => {
  const { updateWorkout, deleteWorkout, addExercise, workouts, updateSet } = useWorkoutStore();
  const [editMode, setEditMode] = useState(false);
  const [workoutName, setWorkoutName] = useState(workout.name);
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(!!workout.startedAt);
  const [newExerciseId, setNewExerciseId] = useState<string | null>(null);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [isFirstSetCompleted, setIsFirstSetCompleted] = useState(false);
  // Removed totalRestTime state as it will be calculated from completedSetsOrder
  // const [totalRestTime, setTotalRestTime] = useState(workout.totalRest || 0);

  // State for the ticking rest timer
  const [currentRestTime, setCurrentRestTime] = useState(0);
  const [restTimerIntervalId, setRestTimerIntervalId] = useState<number | null>(null);

  // State for the floating header visibility
  const [showFloatingHeader, setShowFloatingHeader] = useState(false);

  // Get the last completed set timestamp from the workout data
  const lastCompletedTimestamp = workout.completedSetsOrder && workout.completedSetsOrder.length > 0
    ? workout.completedSetsOrder[workout.completedSetsOrder.length - 1].completedAt
    : null;

  // Start/Stop the current rest timer
  useEffect(() => {
    console.log('Rest timer useEffect triggered', { isWorkoutStarted, workoutEnded: workout.endedAt, lastCompletedTimestamp, restTimerIntervalId, completedSetsOrderLength: workout.completedSetsOrder?.length });

    if (isWorkoutStarted && !workout.endedAt && lastCompletedTimestamp !== null && restTimerIntervalId === null) {
      console.log('Starting rest timer...', { lastCompletedTimestamp });
      // Start the timer only if workout started, not ended, last set completed, and timer is not already running
      setCurrentRestTime(0); // Reset timer to 0 when starting
      const interval = window.setInterval(() => {
        setCurrentRestTime(Math.floor((Date.now() - lastCompletedTimestamp) / 1000));
      }, 1000);
      setRestTimerIntervalId(interval);
    } else if (restTimerIntervalId !== null && (!isWorkoutStarted || workout.endedAt || lastCompletedTimestamp === null)) {
      console.log('Stopping rest timer...', { isWorkoutStarted, workoutEnded: workout.endedAt, lastCompletedTimestamp });
      // Stop the timer if workout ended, not started, or no sets completed, and timer is running
      window.clearInterval(restTimerIntervalId);
      setRestTimerIntervalId(null);
      setCurrentRestTime(0);
    }

    // Cleanup interval on component unmount or when dependencies change
    return () => {
      console.log('Rest timer cleanup...');
      if (restTimerIntervalId) {
        window.clearInterval(restTimerIntervalId);
        setRestTimerIntervalId(null); // Ensure interval ID state is also cleared
      }
    };
  }, [isWorkoutStarted, workout.endedAt, lastCompletedTimestamp, workout.completedSetsOrder, restTimerIntervalId]); // Keep restTimerIntervalId as dependency

  // Calculate total rest time from completedSetsOrder (for floating header)
  const totalRestTime = workout.completedSetsOrder ?
    workout.completedSetsOrder.reduce((sum, current, index, array) => {
      if (index === 0) return 0; // First completed set has no preceding rest
      // Find the timestamp of the previous completed set
      const previousCompletedSet = array[index - 1];
      if (!previousCompletedSet) return sum; // Should not happen for index > 0, but safety check
      const timeAfterPrevious = current.completedAt - previousCompletedSet.completedAt;
      return sum + timeAfterPrevious;
    }, 0) / 1000 // Convert milliseconds to seconds
    : 0;

  // Add scroll event listener for floating header
  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingHeader(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAddExercise = () => {
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name: 'New Exercise',
      sets: [],
    };
    addExercise(workout.id, newExercise);
    setNewExerciseId(newExercise.id);
  };

  const handleEndWorkout = () => {
    const now = Date.now();
    // Stop current rest timer if running
    if (restTimerIntervalId) {
      window.clearInterval(restTimerIntervalId);
      setRestTimerIntervalId(null);
      setCurrentRestTime(0);
    }

    updateWorkout({
      ...workout,
      endedAt: now,
      duration: workoutDuration,
      totalRest: totalRestTime, // Save calculated total rest time
    });
    onFinishWorkout();
  };

  const handleSetComplete = (exercise: Exercise, set: WorkoutSet) => {
    console.log(`handleSetComplete called for set ${set.id}. Completed: ${set.completed}`);
    const now = Date.now();
    const updatedSet = { ...set };

    // Create a deep copy of the workout object to modify
    const updatedWorkout = JSON.parse(JSON.stringify(workout));

    // Find the exercise and set to update within the copied workout object
    const exerciseIndex = updatedWorkout.exercises.findIndex((ex: Exercise) => ex.id === exercise.id);
    if (exerciseIndex === -1) return; // Should not happen
    const setIndex = updatedWorkout.exercises[exerciseIndex].sets.findIndex((s: WorkoutSet) => s.id === set.id);
    if (setIndex === -1) return; // Should not happen

    let updatedCompletedSetsOrder = [...(updatedWorkout.completedSetsOrder || [])];

    if (!set.completed) {
      console.log(`Marking set ${set.id} as complete`);
      updatedSet.completed = true;
      updatedSet.completedAt = now;

      // Add the completed set to the order array
      updatedCompletedSetsOrder.push({ setId: set.id, completedAt: now });

      // Check if this is the first set being completed to start workout timer
      const isFirstSetOfWorkout = !workout.exercises.some((ex: Exercise) =>
        ex.sets.some((s: WorkoutSet) => s.completed && s.id !== set.id) // Check for other completed sets excluding the current one
      );

      if (!isFirstSetCompleted && isFirstSetOfWorkout) {
        console.log('First set of workout completed. Starting workout.');
        setIsFirstSetCompleted(true);
        updatedWorkout.startedAt = now;
        setIsWorkoutStarted(true);
      }

      // Update the set within the copied workout object
      updatedWorkout.exercises[exerciseIndex].sets[setIndex] = updatedSet;

      // Update completed sets order on the copied workout object
      updatedWorkout.completedSetsOrder = updatedCompletedSetsOrder;

      console.log('Updating workout with new completedSetsOrder:', updatedWorkout.completedSetsOrder);

      // Update the workout in the store with the modified copied object
      updateWorkout(updatedWorkout);

    } else {
      console.log(`Unmarking set ${set.id}`);
      updatedSet.completed = false;
      updatedSet.completedAt = undefined;

      // Remove the set from the completed sets order array in the copied workout object
      updatedWorkout.completedSetsOrder = updatedCompletedSetsOrder.filter(item => item.setId !== set.id);

      // Update the set within the copied workout object
      updatedWorkout.exercises[exerciseIndex].sets[setIndex] = updatedSet;

       // Update the workout in the store with the modified copied object
      updateWorkout(updatedWorkout);

      console.log('Updating workout after unmarking. New completedSetsOrder:', updatedWorkout.completedSetsOrder);

       // The useEffect for the rest timer will handle stopping based on lastCompletedTimestamp becoming null if this was the last set
    }

    // Note: We are now updating the entire workout object using updateWorkout
  };

  const handleTimerUpdate = (seconds: number) => {
    setWorkoutDuration(seconds);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pt-16">
      {showFloatingHeader && (
        <div className="fixed top-0 left-0 right-0 bg-gray-900 p-2 z-50 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-1 bg-gray-700 rounded-full">
              <X size={16} />
            </button>
            <div className="flex items-center gap-2">
              {/* Display current rest time in floating header when timer is running */}
              {isWorkoutStarted && !workout.endedAt && lastCompletedTimestamp !== null ? (
                 <div className="flex items-center gap-2">
                   <Clock size={16} className="text-blue-500" />
                   <span className="text-sm text-gray-400">Rest:</span>
                   <span className="text-sm font-mono">{formatTime(currentRestTime)}</span>
                 </div>
              ) : (
                 <div className="flex items-center gap-2">
                   <Clock size={16} className="text-blue-500" />
                   <span className="text-sm text-gray-400">Total Rest:</span>
                   {/* Display total rest time in floating header when timer is NOT running */}
                   <span className="text-sm font-mono">{formatTime(totalRestTime)}</span>
                 </div>
              )}
            </div>
          </div>
           <div className="flex items-center gap-2">{/* Add nav icons here */}</div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        {editMode ? (
          <input
            type="text"
            value={workoutName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWorkoutName(e.target.value)}
            className="bg-gray-800 text-white px-2 py-1 rounded text-2xl font-bold"
          />
        ) : (
          <h1 className="text-2xl font-bold">{workout.name}</h1>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (editMode) {
                updateWorkout({ ...workout, name: workoutName });
              }
              setEditMode(!editMode);
            }}
            className="p-2 bg-blue-600 rounded-full"
          >
            <Edit2 size={20} />
          </button>
          <button
            onClick={() => {
              deleteWorkout(workout.id);
              onClose();
            }}
            className="p-2 bg-red-600 rounded-full"
          >
            <Trash size={20} />
          </button>
        </div>
      </div>

      {/* Workout Timer - remains in static area */}
       <div className="flex items-center gap-2 mb-4">
         <Clock size={20} className="text-blue-500" />
         <div>
           <p className="text-sm text-gray-400">Workout Timer</p>
           <WorkoutTimer
             onTimeUpdate={handleTimerUpdate}
             isRunning={isFirstSetCompleted && !workout.endedAt}
           />
         </div>
       </div>

      <div className="mb-6">
        <p className="text-gray-400">
          Date: {format(new Date(workout.date), 'MMMM dd, yyyy')}
        </p>
      </div>

      {workout.exercises.map((exercise: Exercise, exerciseIndex: number) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          workoutId={workout.id}
          onSetComplete={handleSetComplete}
          autoFocus={exercise.id === newExerciseId}
          isFirstExercise={exerciseIndex === 0}
          allWorkouts={workouts}
          // Pass relevant data for rest time display in SetRow
          completedSetsOrder={workout.completedSetsOrder || []}
          currentRestTime={currentRestTime}
          isRestTimerRunning={isWorkoutStarted && !workout.endedAt && lastCompletedTimestamp !== null}
        />
      ))}

      <div className="flex gap-4 mt-4">
        <button
          onClick={handleAddExercise}
          className="flex-1 py-3 bg-blue-600 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Exercise
        </button>
        <button
          onClick={handleEndWorkout}
          className="flex-1 py-3 bg-red-600 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
        >
          <StopCircle size={20} />
          End Workout
        </button>
      </div>
    </div>
  );
};

interface ExerciseCardProps {
  exercise: Exercise;
  workoutId: string;
  onSetComplete: (exercise: Exercise, set: WorkoutSet) => void;
  autoFocus?: boolean;
  isFirstExercise: boolean;
  allWorkouts: Workout[];
  // Add new props for rest time based on completedSetsOrder
  completedSetsOrder: { setId: string; completedAt: number; }[];
  currentRestTime: number;
  isRestTimerRunning: boolean;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  workoutId,
  onSetComplete,
  autoFocus,
  isFirstExercise,
  allWorkouts,
  completedSetsOrder,
  currentRestTime,
  isRestTimerRunning,
}) => {
  const { updateExercise, deleteExercise } = useWorkoutStore();
  const [editMode, setEditMode] = useState(autoFocus);
  const [exerciseName, setExerciseName] = useState(exercise.name);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSelectingSuggestion, setIsSelectingSuggestion] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const handleAddSet = () => {
    const newSet: WorkoutSet = {
      id: crypto.randomUUID(),
      weight: 0,
      reps: 0,
      completed: false,
    };
    updateExercise(workoutId, {
      ...exercise,
      sets: [...exercise.sets, newSet],
    });
  };

  const findLastUsedSets = (exerciseName: string): WorkoutSet[] => {
    const sortedWorkouts = [...allWorkouts].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (const workout of sortedWorkouts) {
      if (workout.id === workoutId) continue;

      const foundExercise = workout.exercises.find(
        (ex: Exercise) => ex.name.toLowerCase() === exerciseName.toLowerCase()
      );

      if (foundExercise && foundExercise.sets.length > 0) {
        return foundExercise.sets.map((set: WorkoutSet) => ({
          id: crypto.randomUUID(),
          weight: set.weight,
          reps: set.reps,
          completed: false
        }));
      }
    }

    return [];
  };

  const handleExerciseNameChange = (value: string) => {
    setExerciseName(value);

    const uniqueExercises = new Set<string>();
    allWorkouts.forEach((workout: Workout) => {
      workout.exercises.forEach((ex: Exercise) => {
        uniqueExercises.add(ex.name.toLowerCase());
      });
    });

    const filtered = Array.from(uniqueExercises)
      .filter(name => name.includes(value.toLowerCase()))
      .slice(0, 5);

    setSuggestions(filtered);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setIsSelectingSuggestion(true);
    setExerciseName(suggestion);

    const lastSets = findLastUsedSets(suggestion);

    updateExercise(workoutId, {
      ...exercise,
      name: suggestion,
      sets: lastSets.length > 0 ? lastSets : exercise.sets
    });

    setEditMode(false);
    setSuggestions([]);
    setIsSelectingSuggestion(false);
  };

  return (
    <div className="mb-6 bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        {editMode ? (
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={exerciseName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleExerciseNameChange(e.target.value)}
              onBlur={() => {
                if (!isSelectingSuggestion) {
                  setTimeout(() => {
                    updateExercise(workoutId, { ...exercise, name: exerciseName });
                    setEditMode(false);
                    setSuggestions([]);
                  }, 200);
                }
              }}
              className="w-full bg-gray-700 text-white px-2 py-1 rounded"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 rounded-lg overflow-hidden z-10">
                {suggestions.map((suggestion: string, index: number) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 hover:bg-gray-600 capitalize"
                    onMouseDown={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <h2 className="text-xl font-semibold">{exercise.name}</h2>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setEditMode(true)}
            className="p-1 bg-blue-600 rounded-full"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => deleteExercise(workoutId, exercise.id)}
            className="p-1 bg-red-600 rounded-full"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {exercise.sets.map((set: WorkoutSet, setIndex: number) => (
          <SetRow
            key={set.id}
            set={set}
            exercise={exercise}
            workoutId={workoutId}
            onComplete={() => onSetComplete(exercise, set)}
            isFirstSet={setIndex === 0}
            isFirstExercise={isFirstExercise}
            completedSetsOrder={completedSetsOrder}
            currentRestTime={currentRestTime}
            isRestTimerRunning={isRestTimerRunning}
          />
        ))}
      </div>

      <button
        onClick={handleAddSet}
        className="mt-4 w-full py-2 bg-blue-600 rounded flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
      >
        <Plus size={16} />
        Add Set
      </button>
    </div>
  );
};