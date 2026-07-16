type SpiceMeterProps = {
  level: 1 | 2 | 3;
  label: string;
  className?: string;
};

export default function SpiceMeter({ level, label, className }: SpiceMeterProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className ?? ""}`}
      title={`Spice: ${label}`}
    >
      <span aria-hidden className="inline-flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`text-sm leading-none ${i <= level ? "" : "opacity-25 grayscale"}`}
          >
            🌶️
          </span>
        ))}
      </span>
      <span className="text-xs font-bold">{label}</span>
    </span>
  );
}
