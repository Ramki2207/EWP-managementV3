import React, { createContext, useContext, useState, useCallback } from 'react';

interface Tab {
  id: string;
  title: string;
  path: string;
  icon?: React.ReactNode;
  component: React.ReactNode;
}

interface TabContextType {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (tab: Omit<Tab, 'id'>) => void;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  updateTabTitle: (tabId: string, title: string) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export const useTabContext = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabContext must be used within TabProvider');
  }
  return context;
};

export const TabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const openTab = useCallback((newTab: Omit<Tab, 'id'>) => {
    const existingTab = tabs.find(t => t.path === newTab.path);

    if (existingTab) {
      setActiveTabId(existingTab.id);
    } else {
      const tabId = `tab-${Date.now()}-${Math.random()}`;
      const tab: Tab = { ...newTab, id: tabId };
      setTabs(prev => [...prev, tab]);
      setActiveTabId(tabId);
    }
  }, [tabs]);

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);

      if (activeTabId === tabId) {
        if (newTabs.length > 0) {
          const closedIndex = prev.findIndex(t => t.id === tabId);
          const nextTab = newTabs[Math.max(0, closedIndex - 1)];
          setActiveTabId(nextTab.id);
        } else {
          setActiveTabId(null);
        }
      }

      return newTabs;
    });
  }, [activeTabId]);

  const switchTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setActiveTabId(tabId);
    }
  }, [tabs]);

  const updateTabTitle = useCallback((tabId: string, title: string) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, title } : tab
    ));
  }, []);

  return (
    <TabContext.Provider value={{
      tabs,
      activeTabId,
      openTab,
      closeTab,
      switchTab,
      updateTabTitle
    }}>
      {children}
    </TabContext.Provider>
  );
};
