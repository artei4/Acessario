/** Abas segmentadas. `tabs`: [{ id, label, tone?, count? }] */
export function Tabs({ tabs, value, onChange, label }) {
  const handleKey = (event, index) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    onChange(tabs[next].id);
    event.currentTarget.parentElement.children[next]?.focus();
  };

  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          tabIndex={value === tab.id ? 0 : -1}
          className={`tab ${tab.tone ? `tab--${tab.tone}` : ''}`}
          onClick={() => onChange(tab.id)}
          onKeyDown={(e) => handleKey(e, index)}
        >
          {tab.label}
          {tab.count > 0 && <span className="count-dot" aria-label={`${tab.count} pendentes`}>{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}
