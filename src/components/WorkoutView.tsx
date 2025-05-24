import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useWorkoutStore } from '../store/workoutStore';
import { Workout, Exercise, WorkoutSet } from '../types';
import { Timer } from './Timer';
import { Plus, X, Check, Edit2, Trash, StopCircle } from 'lucide-react';
import { SetRow } from './SetRow';

interface WorkoutViewProps {
  workout: Workout;
  onClose: () => void;
  onFinishWorkout: () => void;
}

export const WorkoutView: React.FC<WorkoutViewProps> = ({ 
  workout, 
  onClose, 
  onFinishWorkout 
}) => {
  const { updateWorkout, deleteWorkout, addExercise, workouts } = useWorkoutStore();
  const [editMode, setEditMode] = useState(false);
  const [workoutName, setWorkoutName] = useState(workout.name);
  const [restTimer, setRestTimer] = useState(0);
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(!!workout.startedAt);
  const [newExerciseId, setNewExerciseId] = useState<string | null>(null);
  const [lastSetCompletedAt, setLastSetCompletedAt] = useState<number | null>(null);
  const [workoutDuration, setWorkoutDuration] = useState(workout.duration || 0);

  useEffect(() => {
    const hasCompletedSets = workout.exercises.some(exercise => 
      exercise.sets.some(set => set.completed)
    );
    
    if (hasCompletedSets) {
      setIsWorkoutStarted(true);
      if (workout.duration > 0) {
        setWorkoutDuration(workout.duration);
      }
    }
  }, []); 

  useEffect(() => {
    if (isWorkoutStarted) {
      const saveInterval = setInterval(() => {
        updateWorkout({
          ...workout,
          duration: workoutDuration
        });
      }, 30000);
      
      return () => clearInterval(saveInterval);
    }
  }, [isWorkoutStarted, workoutDuration, workout, updateWorkout]);

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
    updateWorkout({
      ...workout,
      endedAt: now,
      duration: workoutDuration,
    });
    onFinishWorkout();
  };

  const handleWorkoutTimeUpdate = (seconds: number) => {
    setWorkoutDuration(seconds);
  };

  const handleSetComplete = (exercise: Exercise, set: WorkoutSet) => {
    const now = Date.now();
    const updatedSet = { ...set };

    if (!set.completed) {
      updatedSet.completed = true;
      updatedSet.completedAt = now;
      updatedSet.restTime = lastSetCompletedAt ? Math.floor((now - lastSetCompletedAt) / 1000) : 0;

      const isFirstSetOfWorkout = !workout.exercises.some(ex => 
        ex.sets.some(s => s.completed && s.id !== set.id)
      );

      if (!workout.startedAt && isFirstSetOfWorkout) {
        updateWorkout({
          ...workout,
          startedAt: now,
        });
        setIsWorkoutStarted(true);
      }

      setLastSetCompletedAt(now);
      setRestTimer(0);
    } else {
      updatedSet.completed = false;
      updatedSet.completedAt = undefined;
      updatedSet.restTime = undefined;
    }

    const updatedExercise = {
      ...exercise,
      sets: exercise.sets.map((s) => (s.id === set.id ? updatedSet : s)),
    };

    const updatedWorkout = {
      ...workout,
      exercises: workout.exercises.map((e) =>
        e.id === exercise.id ? updatedExercise : e
      ),
    };

    updateWorkout(updatedWorkout);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="flex justify-between items-center mb-6">
        {editMode ? (
          <input
            type="text"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            className="bg-gray-800 text-white px-2 py-1 rounded"
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
          <button onClick={onClose} className="p-2 bg-gray-700 rounded-full">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-gray-400">
          Date: {format(new Date(workout.date), 'MMMM dd, yyyy')}
        </p>
        <div className="flex justify-between mt-2">
          <Timer
            label="Workout Duration"
            duration={workoutDuration}
            isRunning={isWorkoutStarted && !workout.endedAt}
            onTimeUpdate={handleWorkoutTimeUpdate}
          />
          <Timer
            label="Rest Timer"
            duration={restTimer}
            isRunning={isWorkoutStarted && lastSetCompletedAt !== null && !workout.endedAt}
            onTick={() => setRestTimer((prev) => prev + 1)}
          />
        </div>
      </div>

      {workout.exercises.map((exercise, exerciseIndex) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          workoutId={workout.id}
          onSetComplete={handleSetComplete}
          autoFocus={exercise.id === newExerciseId}
          currentRestTime={restTimer}
          isFirstExercise={exerciseIndex === 0}
          allWorkouts={workouts}
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
        {isWorkoutStarted && (
          <button
            onClick={handleEndWorkout}
            className="flex-1 py-3 bg-red-600 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
          >
            <StopCircle size={20} />
            End Workout
          </button>
        )}
      </div>
    </div>
  );
};

interface ExerciseCardProps {
  exercise: Exercise;
  workoutId: string;
  onSetComplete: (exercise: Exercise, set: WorkoutSet) => void;
  autoFocus?: boolean;
  currentRestTime: number;
  isFirstExercise: boolean;
  allWorkouts: Workout[];
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  workoutId,
  onSetComplete,
  autoFocus,
  currentRestTime,
  isFirstExercise,
  allWorkouts,
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
        ex => ex.name.toLowerCase() === exerciseName.toLowerCase()
      );
      
      if (foundExercise && foundExercise.sets.length > 0) {
        return foundExercise.sets.map(set => ({
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
    allWorkouts.forEach(workout => {
      workout.exercises.forEach(ex => {
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
              onChange={(e) => handleExerciseNameChange(e.target.value)}
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
                {suggestions.map((suggestion, index) => (
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
        {exercise.sets.map((set, index) => (
          <SetRow
            key={set.id}
            set={set}
            exercise={exercise}
            workoutId={workoutId}
            onComplete={() => onSetComplete(exercise, set)}
            restTime={set.completed ? set.restTime : currentRestTime}
            isFirstSet={index === 0}
            isFirstExercise={isFirstExercise}
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