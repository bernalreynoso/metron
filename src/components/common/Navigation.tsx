import React from 'react';
import { ActiveTab } from '../../types';
import { Calendar, BarChart2, History, Sliders } from 'lucide-react';

interface NavigationProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  const tabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'hoy', label: 'HOY', icon: Calendar },
    { id: 'progreso', label: 'PROGRESO', icon: BarChart2 },
    { id: 'historial', label: 'HISTORIAL', icon: History },
    { id: 'actividades', label: 'ACTIVIDADES', icon: Sliders },
  ];

  return (
    <>
      {/* Mobile Bottom Fixed Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#080809]/95 border-t border-[#1e1e20] backdrop-blur-md md:hidden">
        <div className="grid grid-cols-4 h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`mobile-tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  isActive
                    ? 'text-[#c5a059] font-semibold'
                    : 'text-[#666666] hover:text-[#e2e2e2]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-[#c5a059]' : ''}`} />
                <span className="text-[10px] tracking-wider font-sans">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sub-Header Navigation */}
      <div className="hidden md:block bg-[#080809]/60 border-b border-[#1e1e20]">
        <div className="max-w-5xl mx-auto px-4 flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`desktop-tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center space-x-2 px-5 py-3 text-xs font-semibold tracking-wider transition-all border-b-2 ${
                  isActive
                    ? 'border-[#c5a059] text-[#c5a059] bg-[#c5a059]/5'
                    : 'border-transparent text-[#888888] hover:text-[#e2e2e2] hover:bg-[#131315]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
