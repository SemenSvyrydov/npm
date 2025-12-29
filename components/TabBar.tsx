import type { Tab } from "@/lib/types";

type TabBarProps = {
  tabs: Tab[];
  activeTabId: string;
  onSelect: (tabId: string) => void;
};

export default function TabBar({ tabs, activeTabId, onSelect }: TabBarProps) {
  return (
    <nav className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelect(tab.id)}
          className={`tab-button ${
            activeTabId === tab.id ? "tab-button--active" : ""
          }`}
        >
          {tab.title}
        </button>
      ))}
    </nav>
  );
}
