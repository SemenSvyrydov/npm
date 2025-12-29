"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import TabBar from "@/components/TabBar";
import MainArea from "@/components/MainArea";
import type { Module, Tab } from "@/lib/types";
import { useLocale } from "@/lib/i18n";

export default function GlobalLayout() {
  const { t } = useLocale();

  const modules: Record<string, Module> = useMemo(
    () => ({
      kvitivki: {
        id: "kvitivki",
        name: t("module.kvitivki"),
        requestTypes: [t("module.requestType.kvitivki")],
        resultSchema: [
          t("module.resultSchema.status"),
          t("module.resultSchema.contour"),
          t("module.resultSchema.updated"),
        ],
      },
    }),
    [t],
  );

  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: "tab-kvitivki",
      title: t("module.kvitivki"),
      moduleId: "kvitivki",
      isActive: true,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);

  useEffect(() => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) => ({
        ...tab,
        title: t("module.kvitivki"),
      })),
    );
  }, [t]);

  const activeModule = useMemo(() => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
    return modules[activeTab.moduleId];
  }, [activeTabId, modules, tabs]);

  const handleSelect = (tabId: string) => {
    setActiveTabId(tabId);
    setTabs((prevTabs) =>
      prevTabs.map((tab) => ({
        ...tab,
        isActive: tab.id === tabId,
      })),
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
