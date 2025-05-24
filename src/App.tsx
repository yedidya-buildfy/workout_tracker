import React, { useState } from 'react';
import { CalendarView } from './components/Calendar';
import { WorkoutView } from './components/WorkoutView';
import { AnalysisView } from './components/AnalysisView';
import { WorkoutSummaryView } from './components/WorkoutSummaryView';
import { ExcelImport } from './components/ExcelImport';
import { Header } from './components/Header';
import { useWorkoutStore } from './store/workoutStore';
import { format } from 'date-fns';

type View = 'calendar' | 'workout' | 'analysis' | 'summary' | 'import';

function App() {
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('calendar');
  const { workouts, addWorkout } = useWorkoutStore();

  const handleAddWorkout = (date: Date) => {
    const newWorkout = {
      id: crypto.randomUUID(),
      name: 'New Workout',
      date: format(date, 'yyyy-MM-dd'),
      exercises: [],
      duration: 0,
      restTimer: 0,
      startedAt: null,
    };
    addWorkout(newWorkout);
    setSelectedWorkout(newWorkout.id);
    setCurrentView('workout');
  };

  const handleNavigate = (view: View) => {
    if (view === 'calendar') {
      setSelectedWorkout(null);
    }
    setCurrentView(view);
  };

  const currentWorkout = workouts.find((w) => w.id === selectedWorkout);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {currentView !== 'summary' && currentView !== 'import' && (
        <Header
          title={
            currentView === 'calendar'
              ? 'Workout Tracker'
              : currentView === 'analysis'
              ? 'Workout Analysis'
              : currentWorkout?.name || 'Workout'
          }
          showBack={currentView === 'workout'}
          onBack={() => handleNavigate('calendar')}
          currentView={currentView}
          onNavigate={handleNavigate}
          onImport={() => handleNavigate('import')}
        />
      )}
      
      <main className={currentView !== 'summary' && currentView !== 'import' ? "pt-16" : ""}>
        {currentView === 'import' ? (
          <ExcelImport onClose={() => handleNavigate('calendar')} />
        ) : currentView === 'summary' && currentWorkout ? (
          <WorkoutSummaryView
            workout={currentWorkout}
            onFinish={() => handleNavigate('calendar')}
          />
        ) : currentView === 'analysis' ? (
          <AnalysisView onClose={() => handleNavigate('calendar')} />
        ) : currentView === 'workout' && currentWorkout ? (
          <WorkoutView
            workout={currentWorkout}
            onClose={() => handleNavigate('calendar')}
            onFinishWorkout={() => handleNavigate('summary')}
          />
        ) : (
          <CalendarView 
            onAddWorkout={handleAddWorkout}
            onSelectWorkout={(workout) => {
              setSelectedWorkout(workout.id);
              setCurrentView('workout');
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;