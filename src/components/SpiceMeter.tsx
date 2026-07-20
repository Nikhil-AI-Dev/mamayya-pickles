import { Pepper } from "@phosphor-icons/react/dist/ssr";

type SpiceMeterProps = {
  level: 1 | 2 | 3;
  label: string;
  /** "light" = red peppers for cream cards, "dark" = cream peppers for tinted heroes. */
  tone?: "light" | "dark";
  className?: string;
};

export default function SpiceMeter({ level, label, tone = "light", className }: SpiceMeterProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className ?? ""}`}
      title={`Spice: ${label}`}
    >
      <span aria-hidden className="inline-flex items-center gap-0.5">
        {[1, 2, 3].map((i) => (
          <Pepper
            key={i}
            size={24}
            weight={i <= level ? "fill" : "regular"}
            className={
              i <= level
                ? tone === "dark"
                  ? "text-cream drop-shadow"
                  : "text-red drop-shadow-sm"
                : "opacity-40"
            }
          />
        ))}
      </span>
      <span className="text-xs font-bold">{label}</span>
    </span>
  );
}
