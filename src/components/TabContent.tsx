import React from 'react';
import { useTabContext } from '../contexts/TabContext';

export const TabContent: React.FC = () => {
  const { tabs, activeTabId } = useTabContext();

  return (
    <>
      {tabs.map(tab => (
        <div
          key={tab.id}
          style={{ display: tab.id === activeTabId ? 'block' : 'none' }}
          className="h-full"
        >
          {tab.component}
        </div>
      ))}
    </>
  );
};
