"use client";

import { motion, useReducedMotion } from "motion/react";
import { forwardRef, useState } from "react";
import { EASE_OUT, SPRING_LAYOUT, SPRING_PRESS } from "../../lib/ease";
import { useHoverCapable } from "../../lib/hooks/use-hover-capable";
import { cn } from "../../lib/utils";

const ARROW_OPACITY = [1, 0.78, 0.54, 0.32, 0.16];

function DottedChevron({ className }) {
  return (
    <svg viewBox="0 0 20 28" fill="none" aria-hidden="true" className={className}>
      <circle cx="4" cy="4" r="2" fill="currentColor" />
      <circle cx="10" cy="9" r="2" fill="currentColor" />
      <circle cx="16" cy="14" r="2" fill="currentColor" />
      <circle cx="10" cy="19" r="2" fill="currentColor" />
      <circle cx="4" cy="24" r="2" fill="currentColor" />
    </svg>
  );
}

export const ExpandingArrowButton = forwardRef(function ExpandingArrowButton(
  {
    children,
    className,
    accentClassName,
    labelClassName,
    disabled,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    ...rest
  },
  ref
) {
  const reduce = useReducedMotion();
  const canHover = useHoverCapable();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const active = !disabled && ((canHover && hovered) || focused);
  const layoutTransition = reduce ? { duration: 0 } : SPRING_LAYOUT;

  const handleMouseEnter = (event) => {
    setHovered(true);
    if (onMouseEnter) onMouseEnter(event);
  };

  const handleMouseLeave = (event) => {
    setHovered(false);
    if (onMouseLeave) onMouseLeave(event);
  };

  const handleFocus = (event) => {
    setFocused(true);
    if (onFocus) onFocus(event);
  };

  const handleBlur = (event) => {
    setFocused(false);
    if (onBlur) onBlur(event);
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      whileTap={reduce || disabled ? undefined : { scale: 0.97 }}
      transition={SPRING_PRESS}
      className={cn(
        "relative inline-flex h-12 min-w-[200px] items-center overflow-hidden rounded-full bg-neutral-950 p-1.5 text-white select-none",
        "outline-none focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...rest}
    >
      <motion.span
        layout="size"
        aria-hidden="true"
        transition={layoutTransition}
        style={{
          width: active ? "calc(100% - 12px)" : 36,
          borderRadius: 18,
        }}
        className={cn(
          "absolute inset-y-1.5 left-1.5 z-10 overflow-hidden bg-lime-300 text-neutral-950",
          accentClassName
        )}
      >
        <motion.span
          animate={{ opacity: active ? 0 : 1 }}
          transition={{ duration: reduce ? 0 : 0.1, ease: EASE_OUT }}
          className="absolute inset-0 grid place-items-center"
        >
          <DottedChevron className="h-5 w-4" />
        </motion.span>

        <span className="absolute inset-0 flex items-center justify-around px-2">
          {ARROW_OPACITY.map((opacity, index) => (
            <motion.span
              key={opacity}
              animate={{
                opacity: active ? 1 : 0,
                transform: active && !reduce ? "translateX(0px)" : "translateX(-4px)",
              }}
              transition={{
                duration: reduce ? 0 : 0.18,
                delay: active && !reduce ? 0.04 + index * 0.025 : 0,
                ease: EASE_OUT,
              }}
              style={{ color: `rgb(10 10 10 / ${opacity})` }}
              className="inline-grid place-items-center"
            >
              <DottedChevron className="h-5 w-4" />
            </motion.span>
          ))}
        </span>
      </motion.span>

      <motion.span
        animate={{
          opacity: active ? 0 : 1,
          transform: active && !reduce ? "translateX(4px)" : "translateX(0px)",
        }}
        transition={{ duration: reduce ? 0 : 0.12, ease: EASE_OUT }}
        className={cn(
          "relative z-0 ml-[52px] mr-5 whitespace-nowrap text-sm font-semibold tracking-wide",
          labelClassName
        )}
      >
        {children}
      </motion.span>
    </motion.button>
  );
});
