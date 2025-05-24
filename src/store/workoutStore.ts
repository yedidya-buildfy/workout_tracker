import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workout, Exercise, WorkoutSet } from '../types';

interface WorkoutStore {
  workouts: Workout[];
  addWorkout: (workout: Workout) => void;
  updateWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;
  addExercise: (workoutId: string, exercise: Exercise) => void;
  updateExercise: (workoutId: string, exercise: Exercise) => void;
  deleteExercise: (workoutId: string, exerciseId: string) => void;
  updateSet: (workoutId: string, exerciseId: string, setData: WorkoutSet) => void;
  deleteSet: (workoutId: string, exerciseId: string, setId: string) => void;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set) => ({
      workouts: [],
      addWorkout: (workout) =>
        set((state) => ({ workouts: [...state.workouts, workout] })),
      updateWorkout: (workout) =>
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.id === workout.id ? workout : w
          ),
        })),
      deleteWorkout: (id) =>
        set((state) => ({
          workouts: state.workouts.filter((w) => w.id !== id),
        })),
      addExercise: (workoutId, exercise) =>
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.id === workoutId
              ? { ...w, exercises: [...w.exercises, exercise] }
              : w
          ),
        })),
      updateExercise: (workoutId, exercise) =>
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.id === workoutId
              ? {
                  ...w,
                  exercises: w.exercises.map((e) =>
                    e.id === exercise.id ? exercise : e
                  ),
                }
              : w
          ),
        })),
      deleteExercise: (workoutId, exerciseId) =>
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.id === workoutId
              ? {
                  ...w,
                  exercises: w.exercises.filter((e) => e.id !== exerciseId),
                }
              : w
          ),
        })),
      updateSet: (workoutId, exerciseId, setData) =>
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.id === workoutId
              ? {
                  ...w,
                  exercises: w.exercises.map((e) =>
                    e.id === exerciseId
                      ? {
                          ...e,
                          sets: e.sets.map((s) => (s.id === setData.id ? setData : s)),
                        }
                      : e
                  ),
                }
              : w
          ),
        })),
      deleteSet: (workoutId, exerciseId, setId) =>
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.id === workoutId
              ? {
                  ...w,
                  exercises: w.exercises.map((e) =>
                    e.id === exerciseId
                      ? {
                          ...e,
                          sets: e.sets.filter((s) => s.id !== setId),
                        }
                      : e
                  ),
                }
              : w
          ),
        })),
    }),
    {
      name: 'workout-storage',
    }
  )
);