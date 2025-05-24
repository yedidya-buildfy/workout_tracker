export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
  completedAt?: number;
  restTime?: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  exercises: Exercise[];
  duration: number;
  restTimer: number;
  startedAt?: number;
  endedAt?: number;
}