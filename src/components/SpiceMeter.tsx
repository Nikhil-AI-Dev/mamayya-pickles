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
      <span aria-hidden className="inline-flex items-end gap-0.5">
        {[1, 2, 3].map((i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src="/chilli-meter.webp"
            alt=""
            width={160}
            height={160}
            className={`h-6 w-auto drop-shadow-sm ${i <= level ? "" : "opacity-30 grayscale"}`}
          />
        ))}
      </span>
      <span className="text-xs font-bold">{label}</span>
    </span>
  );
}
