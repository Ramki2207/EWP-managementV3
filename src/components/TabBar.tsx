import React from 'react';
import { X } from 'lucide-react';
import { useTabContext } from '../contexts/TabContext';

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, switchTab, closeTab } = useTabContext();

  if (tabs.length === 0) return null;

  return (
    <div className="bg-[#1a1f2e] border-b border-gray-700 px-4 flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`group flex items-center gap-2 px-4 py-3 border-b-2 transition-all cursor-pointer min-w-fit ${
            activeTabId === tab.id
              ? 'border-blue-500 bg-[#2A303C] text-white'
              : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2A303C]/50'
          }`}
          onClick={() => switchTab(tab.id)}
        >
          {tab.icon && (
            <span className="flex-shrink-0">
              {tab.icon}
            </span>
          )}
          <span className="text-sm font-medium whitespace-nowrap">
            {tab.title}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
            className="flex-shrink-0 ml-2 p-1 rounded hover:bg-gray-600/50 transition-colors opacity-0 group-hover:opacity-100"
            title="Sluit tab"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
