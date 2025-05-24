import React, { useState } from 'react';
import { read, utils } from 'xlsx';
import { useWorkoutStore } from '../store/workoutStore';
import { Workout, Exercise, Set } from '../types';
import { format, parse } from 'date-fns';
import { Upload, X, AlertCircle, CheckCircle2, Download } from 'lucide-react';

interface ExcelImportProps {
  onClose: () => void;
}

interface WorkoutRow {
  Date: string;
  'Workout Name': string;
  'Exercise Name': string;
  Weight: number;
  Reps: number;
  Completed: string | boolean;
}

export const ExcelImport: React.FC<ExcelImportProps> = ({ onClose }) => {
  const { addWorkout } = useWorkoutStore();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      setSuccess(false);

      const file = e.target.files?.[0];
      if (!file) return;

      // Read the Excel file
      const data = await file.arrayBuffer();
      const workbook = read(data);
      
      // Get the first sheet
      if (workbook.SheetNames.length === 0) {
        throw new Error("Excel file doesn't contain any sheets");
      }
      
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = utils.sheet_to_json<WorkoutRow>(firstSheet);
      
      if (rows.length === 0) {
        throw new Error("No data found in the sheet");
      }
      
      // Validate required columns
      const requiredColumns = ['Date', 'Workout Name', 'Exercise Name', 'Weight', 'Reps', 'Completed'];
      const firstRow = rows[0];
      const missingColumns = requiredColumns.filter(
        column => !(column in firstRow)
      );
      
      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
      }

      // Group by date and workout name to create workouts
      const workoutMap = new Map<string, Workout>();
      
      for (const row of rows) {
        try {
          const date = parse(row.Date, 'yyyy-MM-dd', new Date());
          const formattedDate = format(date, 'yyyy-MM-dd');
          const workoutKey = `${formattedDate}_${row['Workout Name']}`;
          
          // Create workout if it doesn't exist
          if (!workoutMap.has(workoutKey)) {
            workoutMap.set(workoutKey, {
              id: crypto.randomUUID(),
              name: row['Workout Name'],
              date: formattedDate,
              exercises: [],
              duration: 0,
              restTimer: 0,
            });
          }
          
          const workout = workoutMap.get(workoutKey)!;
          
          // Find or create exercise
          let exercise = workout.exercises.find(e => e.name === row['Exercise Name']);
          if (!exercise) {
            exercise = {
              id: crypto.randomUUID(),
              name: row['Exercise Name'],
              sets: [],
            };
            workout.exercises.push(exercise);
          }
          
          // Add set to exercise
          const isCompleted = 
            typeof row.Completed === 'boolean' ? row.Completed : 
            typeof row.Completed === 'string' ? row.Completed.toLowerCase() === 'true' : 
            false;
            
          const set: Set = {
            id: crypto.randomUUID(),
            weight: row.Weight || 0,
            reps: row.Reps || 0,
            completed: isCompleted,
          };
          
          exercise.sets.push(set);
        } catch (err) {
          throw new Error(`Invalid data format in row: ${JSON.stringify(row)}`);
        }
      }
      
      // Add workouts to store
      for (const workout of workoutMap.values()) {
        addWorkout(workout);
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import workouts');
    }
  };

  const renderTemplateDescription = () => (
    <div className="bg-gray-700 p-4 rounded-lg">
      <h3 className="font-medium mb-2">Required Format</h3>
      <p className="text-sm text-gray-300 mb-2">
        Excel file must contain a single sheet with these columns:
      </p>
      <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
        <li>Date (YYYY-MM-DD format)</li>
        <li>Workout Name</li>
        <li>Exercise Name</li>
        <li>Weight (numeric)</li>
        <li>Reps (numeric)</li>
        <li>Completed (true/false)</li>
      </ul>
      <p className="text-sm text-gray-300 mt-2">
        Example: <code>2024-05-20, Leg Day, Squats, 185, 8, true</code>
      </p>
      <a
        href="/workout-template.xlsx"
        download
        className="mt-3 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
      >
        <Download size={16} />
        Download Template
      </a>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Import Workouts</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {renderTemplateDescription()}

          <label className="block w-full">
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg p-4 text-center cursor-pointer">
              <Upload className="mx-auto mb-2" size={24} />
              <span className="text-sm font-medium">Choose Excel File</span>
            </div>
          </label>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-950/50 p-3 rounded-lg">
              <AlertCircle size={20} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-green-400 bg-green-950/50 p-3 rounded-lg">
              <CheckCircle2 size={20} />
              <p className="text-sm">Workouts imported successfully!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};