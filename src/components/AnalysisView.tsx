import React, { useState, useMemo } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { format, differenceInWeeks } from 'date-fns';
import { X, Search } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalysisViewProps {
  onClose: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = () => {
  const { workouts } = useWorkoutStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  // Calculate overall statistics
  const stats = useMemo(() => {
    if (workouts.length === 0) return null;

    const firstWorkoutDate = new Date(workouts[0].date);
    const lastWorkoutDate = new Date(workouts[workouts.length - 1].date);
    const totalWeeks = Math.max(1, differenceInWeeks(lastWorkoutDate, firstWorkoutDate) + 1);

    const totalWorkouts = workouts.length;
    const workoutsPerWeek = totalWorkouts / totalWeeks;

    let totalDuration = 0;
    let totalExercises = 0;
    let totalSets = 0;
    let totalRestTime = 0;
    let restTimeCount = 0;

    workouts.forEach(workout => {
      totalDuration += workout.duration;
      totalExercises += workout.exercises.length;
      
      workout.exercises.forEach(exercise => {
        totalSets += exercise.sets.length;
        exercise.sets.forEach((set, index) => {
          if (index > 0 && set.restTime) {
            totalRestTime += set.restTime;
            restTimeCount++;
          }
        });
      });
    });

    return {
      workoutsPerWeek: workoutsPerWeek.toFixed(1),
      averageDuration: Math.round(totalDuration / totalWorkouts / 60), // in minutes
      averageExercises: (totalExercises / totalWorkouts).toFixed(1),
      averageSets: (totalSets / totalWorkouts).toFixed(1),
      averageRestTime: restTimeCount > 0 ? Math.round(totalRestTime / restTimeCount) : 0,
    };
  }, [workouts]);

  // Get unique exercises for search
  const uniqueExercises = useMemo(() => {
    const exercises = new Set<string>();
    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        exercises.add(exercise.name.toLowerCase());
      });
    });
    return Array.from(exercises);
  }, [workouts]);

  // Filter exercises based on search query
  const filteredExercises = useMemo(() => {
    if (!searchQuery) return [];
    return uniqueExercises
      .filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 3);
  }, [uniqueExercises, searchQuery]);

  // Get exercise data for chart
  const exerciseData = useMemo(() => {
    if (!selectedExercise) return [];

    const data: Array<{
      date: string;
      weight: number;
      reps: number;
      volume: number;
    }> = [];

    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (exercise.name.toLowerCase() === selectedExercise.toLowerCase()) {
          exercise.sets.forEach(set => {
            if (set.completed) {
              data.push({
                date: workout.date,
                weight: set.weight,
                reps: set.reps,
                volume: set.weight * set.reps,
              });
            }
          });
        }
      });
    });

    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [workouts, selectedExercise]);

  // Calculate exercise statistics
  const exerciseStats = useMemo(() => {
    if (!exerciseData.length) return null;

    const maxWeight = Math.max(...exerciseData.map(d => d.weight));
    const maxWeightDate = exerciseData.find(d => d.weight === maxWeight)?.date;
    const totalVolume = exerciseData.reduce((sum, d) => sum + d.volume, 0);
    const averageVolume = totalVolume / exerciseData.length;

    return {
      maxWeight,
      maxWeightDate,
      totalVolume,
      averageVolume: Math.round(averageVolume),
    };
  }, [exerciseData]);

  return (
    <div className="p-4">
      {/* Overall Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-gray-400 text-sm">Workouts per Week</h3>
          <p className="text-2xl font-bold">{stats?.workoutsPerWeek}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-gray-400 text-sm">Avg Duration</h3>
          <p className="text-2xl font-bold">{stats?.averageDuration} min</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-gray-400 text-sm">Avg Exercises</h3>
          <p className="text-2xl font-bold">{stats?.averageExercises}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-gray-400 text-sm">Avg Sets</h3>
          <p className="text-2xl font-bold">{stats?.averageSets}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-gray-400 text-sm">Avg Rest Time</h3>
          <p className="text-2xl font-bold">{stats?.averageRestTime}s</p>
        </div>
      </div>

      {/* Exercise Search */}
      <div className="mb-8">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises..."
            className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
        </div>
        {filteredExercises.length > 0 && (
          <div className="mt-2 bg-gray-800 rounded-lg overflow-hidden">
            {filteredExercises.map((exercise) => (
              <button
                key={exercise}
                onClick={() => {
                  setSelectedExercise(exercise);
                  setSearchQuery('');
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors"
              >
                {exercise}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Exercise Analysis */}
      {selectedExercise && exerciseData.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4 capitalize">{selectedExercise}</h2>
          
          {/* Exercise Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-gray-400 text-sm">Max Weight</h3>
              <p className="text-xl font-bold">
                {exerciseStats?.maxWeight}kg
                <span className="block text-sm text-gray-400">
                  {exerciseStats?.maxWeightDate && format(new Date(exerciseStats.maxWeightDate), 'MMM d, yyyy')}
                </span>
              </p>
            </div>
            <div>
              <h3 className="text-gray-400 text-sm">Avg Volume per Set</h3>
              <p className="text-xl font-bold">{exerciseStats?.averageVolume}kg</p>
            </div>
          </div>

          {/* Progress Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={exerciseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'MMM d')}
                  stroke="#9CA3AF"
                />
                <YAxis yAxisId="weight" stroke="#9CA3AF" />
                <YAxis yAxisId="reps" orientation="right" stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                  labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                />
                <Legend />
                <Line
                  yAxisId="weight"
                  type="monotone"
                  dataKey="weight"
                  stroke="#3B82F6"
                  name="Weight (kg)"
                  dot={false}
                />
                <Line
                  yAxisId="reps"
                  type="monotone"
                  dataKey="reps"
                  stroke="#10B981"
                  name="Reps"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};