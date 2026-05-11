import React from 'react';
import { Shield, Settings, HelpCircle, Activity } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md" id="app-header">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Shield className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900 leading-tight">SentryQA</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-blue-600">Strategic Test Architect</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#analysis" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Analysis</a>
          <a href="#adversarial" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Adversarial</a>
          <a href="#test-cases" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Test Cases</a>
        </nav>

        <div className="flex items-center gap-4">
          <button className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <Activity className="h-5 w-5" />
          </button>
          <button 
            onClick={onOpenSettings}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
