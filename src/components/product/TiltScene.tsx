"use client";

import { useEffect, useRef } from "react";

/** Wraps a visual so it tilts gently toward the cursor on desktop - gives the
 *  jar weight and life. Touch devices and reduced-motion get the plain child. */
export default function TiltScene({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canTilt = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)"
    ).matches;
    const el = outer.current;
    const target = inner.current;
    if (!canTilt || !el || !target) return;

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        target.style.transform = `rotateY(${px * 12}deg) rotateX(${-py * 10}deg) translateZ(0)`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      target.style.transform = "rotateY(0deg) rotateX(0deg)";
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={outer} style={{ perspective: "900px" }}>
      <div
        ref={inner}
        className="transition-transform duration-500 ease-out will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
      </div>
    </div>
  );
}
