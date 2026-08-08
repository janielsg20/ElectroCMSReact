import { Icon } from '../components/Icon';

interface CapabilityStatusProps {
  label: string;
  detail: string;
}

export function CapabilityStatus({ label, detail }: CapabilityStatusProps) {
  return (
    <span
      className="capability-status inline-flex min-h-8 items-center gap-1.5 rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] px-2.5 text-[10px] font-semibold text-[var(--color-ec-text-muted)]"
      aria-label={`${label}. ${detail}`}
      title={detail}
    >
      <Icon name="shield" size={12} />
      <span>{label}</span>
    </span>
  );
}
