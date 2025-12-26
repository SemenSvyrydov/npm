"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import TabBar from "@/components/TabBar";
import MainArea from "@/components/MainArea";
import type { Module, Tab } from "@/lib/types";

const modules: Record<string, Module> = {
  analytics: {
    id: "analytics",
    name: "Аналитика",
    requestTypes: ["analytics", "reports"],
    resultSchema: ["Статус", "Контур", "Обновлено"]
  }
};

const initialTabs: Tab[] = [
  {
    id: "tab-analytics",
    title: "Аналитика",
    moduleId: "analytics",
    isActive: true
  }
];

export default function GlobalLayout() {
  const [tabs, setTabs] = useState<Tab[]>(initialTabs);
  const [activeTabId, setActiveTabId] = useState<string>(initialTabs[0].id);

  const activeModule = useMemo(() => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
    return modules[activeTab.moduleId];
  }, [activeTabId, tabs]);

  const handleSelect = (tabId: string) => {
    setActiveTabId(tabId);
    setTabs((prevTabs) =>
      prevTabs.map((tab) => ({
        ...tab,
        isActive: tab.id === tabId
      }))
    );
  };

  return (
    <>
      <Header />
      <TabBar tabs={tabs} activeTabId={activeTabId} onSelect={handleSelect} />
      <MainArea module={activeModule} />
    </>
  );
}
