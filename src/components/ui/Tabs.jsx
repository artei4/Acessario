import { cn } from '../../utils/cn.js';
import { CountDot } from './Badge.jsx';

const TONES = {
  brand: 'border-brand text-brand aria-selected:bg-brand aria-selected:text-on-brand',
  danger: 'border-bad text-bad aria-selected:bg-bad aria-selected:text-on-brand',
  success: 'border-ok text-ok aria-selected:bg-ok aria-selected:text-on-brand',
};

/** Abas segmentadas. `tabs`: [{ id, label, tone?, count? }] */
export function Tabs({ tabs, value, onChange, label }) {
  const handleKey = (event, index) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    onChange(tabs[next].id);
    event.currentTarget.parentElement.children[next]?.focus();
  };

  return (
    <div className="grid auto-cols-fr grid-flow-col gap-2" role="tablist" aria-label={label}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          tabIndex={value === tab.id ? 0 : -1}
          className={cn(
            'inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-[1.5px] bg-surface px-2 leading-tight font-bold',
            TONES[tab.tone ?? 'brand'],
          )}
          onClick={() => onChange(tab.id)}
          onKeyDown={(e) => handleKey(e, index)}
        >
          {tab.label}
          {tab.count > 0 && <CountDot count={tab.count} label={`${tab.count} pendentes`} />}
        </button>
      ))}
    </div>
  );
}
