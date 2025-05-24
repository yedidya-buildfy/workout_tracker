import React from 'react';
import { BarChart2, Calendar, ArrowLeft, Upload } from 'lucide-react';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  currentView: 'calendar' | 'workout' | 'analysis';
  onNavigate: (view: 'calendar' | 'workout' | 'analysis' | 'import') => void;
  onImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack,
  onBack,
  currentView,
  onNavigate,
  onImport,
}) => {
  return (
    <header className="bg-gray-800 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            {showBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="text-xl font-bold">{title}</h1>
          </div>
          
          <nav className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('calendar')}
              className={`p-2 rounded-lg flex items-center gap-2 transition-colors ${
                currentView === 'calendar' ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              <Calendar size={20} />
              <span className="hidden sm:inline">Calendar</span>
            </button>
            <button
              onClick={() => onNavigate('analysis')}
              className={`p-2 rounded-lg flex items-center gap-2 transition-colors ${
                currentView === 'analysis' ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              <BarChart2 size={20} />
              <span className="hidden sm:inline">Analysis</span>
            </button>
            <button
              onClick={onImport}
              className="p-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition-colors"
            >
              <Upload size={20} />
              <span className="hidden sm:inline">Import</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};