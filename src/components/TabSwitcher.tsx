
export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
  hidden?: boolean;
}

interface TabSwitcherProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
}

export default function TabSwitcher<T extends string>({
  tabs,
  activeTab,
  onChange,
  className = "",
}: TabSwitcherProps<T>) {
  const visibleTabs = tabs.filter((tab) => !tab.hidden);

  return (
    <div
      role="tablist"
      className={`tabs tabs-bordered border-b border-base-200 px-2 pt-2 ${className}`}
    >
      {visibleTabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            className={`tab gap-2 transition-all duration-200 pb-3 ${
              isActive
                ? "tab-active font-semibold text-primary border-primary border-b-2"
                : "text-base-content/60 hover:text-base-content"
            }`}
            onClick={() => onChange(tab.id)}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`badge badge-sm rounded-full ${
                  isActive ? "badge-primary text-primary-content" : "badge-neutral"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
