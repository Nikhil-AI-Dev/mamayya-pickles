type JarIllustrationProps = {
  color: string;
  /** 0-1, how full the jar looks */
  fill?: number;
  className?: string;
  lidLifted?: boolean;
  label?: string;
};

/**
 * Stylised pickle jar. Chunk + oil colors derive from the product color so
 * every flavour keeps its own identity without needing photography.
 */
export default function JarIllustration({
  color,
  fill = 0.82,
  className,
  lidLifted = false,
  label,
}: JarIllustrationProps) {
  const fillHeight = 118 * Math.min(1, Math.max(0.15, fill));
  const fillY = 168 - fillHeight;

  return (
    <svg
      viewBox="0 0 160 200"
      className={className}
      role="img"
      aria-label={label ?? "Pickle jar"}
    >
      <defs>
        <linearGradient id={`oil-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.55" />
          <stop offset="45%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        <clipPath id={`jarclip-${color.slice(1)}`}>
          <path d="M38 56 Q30 60 30 74 L30 156 Q30 176 52 176 L108 176 Q130 176 130 156 L130 74 Q130 60 122 56 Z" />
        </clipPath>
      </defs>

      {/* Lid */}
      <g
        style={{
          transform: lidLifted ? "translateY(-18px) rotate(-8deg)" : undefined,
          transformOrigin: "80px 40px",
          transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <rect x="42" y="30" width="76" height="18" rx="6" fill="#241713" />
        <rect x="42" y="42" width="76" height="6" rx="3" fill="#3a2a24" />
        <rect x="52" y="24" width="56" height="10" rx="5" fill="#3a2a24" />
      </g>

      {/* Glass body */}
      <path
        d="M38 56 Q30 60 30 74 L30 156 Q30 176 52 176 L108 176 Q130 176 130 156 L130 74 Q130 60 122 56 Z"
        fill="#fffdf8"
        stroke="#241713"
        strokeWidth="3"
      />

      {/* Contents */}
      <g clipPath={`url(#jarclip-${color.slice(1)})`}>
        <rect
          x="28"
          y={fillY}
          width="104"
          height={fillHeight + 12}
          fill={`url(#oil-${color.slice(1)})`}
        />
        {/* Oil surface line */}
        <ellipse cx="80" cy={fillY + 2} rx="50" ry="5" fill={color} opacity="0.5" />
        {/* Chunks */}
        <circle cx="58" cy={fillY + 30} r="11" fill="#241713" opacity="0.32" />
        <circle cx="92" cy={fillY + 48} r="13" fill="#241713" opacity="0.28" />
        <circle cx="70" cy={fillY + 72} r="10" fill="#241713" opacity="0.3" />
        <circle cx="104" cy={fillY + 82} r="9" fill="#241713" opacity="0.26" />
        {/* Curry leaf slivers */}
        <ellipse cx="80" cy={fillY + 20} rx="8" ry="3" fill="#31533b" opacity="0.55" transform={`rotate(-20 80 ${fillY + 20})`} />
        <ellipse cx="50" cy={fillY + 58} rx="7" ry="2.5" fill="#31533b" opacity="0.5" transform={`rotate(30 50 ${fillY + 58})`} />
        {/* Glass shine */}
        <rect x="40" y="62" width="8" height="104" rx="4" fill="#ffffff" opacity="0.35" />
      </g>

      {/* Neck ring */}
      <rect x="36" y="52" width="88" height="8" rx="4" fill="#241713" opacity="0.15" />
    </svg>
  );
}
