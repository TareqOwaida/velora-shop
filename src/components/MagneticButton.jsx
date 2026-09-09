import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

export function MagneticButton({ children, className, ...props }) {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced) return undefined;
      const xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });

      const onPointerMove = (event) => {
        const box = el.getBoundingClientRect();
        xTo((event.clientX - box.left - box.width / 2) * 0.3);
        yTo((event.clientY - box.top - box.height / 2) * 0.3);
      };
      const reset = () => {
        xTo(0);
        yTo(0);
      };

      el.addEventListener("pointermove", onPointerMove);
      el.addEventListener("pointerleave", reset);
      return () => {
        el.removeEventListener("pointermove", onPointerMove);
        el.removeEventListener("pointerleave", reset);
      };
    },
    { dependencies: [reduced] },
  );

  return (
    <button
      ref={ref}
      className={className}
      type={props.type ?? "button"}
      {...props}
    >
      {children}
    </button>
  );
}
