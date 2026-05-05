import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Pixel dimensions and base stroke widths for each size variant.
 * Values are chosen so the track and indicator remain visually proportionate.
 */
const SIZE_MAP = {
  xs: { px: 20, stroke: 2 },
  sm: { px: 28, stroke: 2.5 },
  md: { px: 40, stroke: 3.5 },
  lg: { px: 56, stroke: 4.5 },
  xl: { px: 80, stroke: 6 },
} as const

/**
 * Multipliers applied to the size-derived base stroke to produce named thickness variants.
 * A `strokeWidth` prop always takes precedence over these multipliers.
 */
const STROKE_MULTIPLIER_MAP = {
  thin: 0.5,
  normal: 1,
  thick: 1.75,
} as const

/** Tailwind text-size class for the optional percentage label per size variant. */
const LABEL_SIZE_MAP: Record<keyof typeof SIZE_MAP, string> = {
  xs: "text-[6px]",
  sm: "text-[8px]",
  md: "text-[10px]",
  lg: "text-xs",
  xl: "text-sm",
}

/**
 * Semantic color variants applied to the progress indicator circle.
 * These map to Tailwind `text-*` classes so `stroke="currentColor"` picks them up.
 */
const INDICATOR_COLOR_MAP: Record<string, string> = {
  default: "text-primary",
  success: "text-green-500",
  warning: "text-amber-500",
  destructive: "text-destructive",
  secondary: "text-secondary-foreground",
}

const circularProgressVariants = cva("", {
  variants: {
    size: {
      xs: "",
      sm: "",
      md: "",
      lg: "",
      xl: "",
    },
    color: {
      default: "",
      success: "",
      warning: "",
      destructive: "",
      secondary: "",
    },
    stroke: {
      thin: "",
      normal: "",
      thick: "",
    },
  },
  defaultVariants: {
    size: "md",
    color: "default",
    stroke: "normal",
  },
})

export interface CircularProgressProps
  extends VariantProps<typeof circularProgressVariants> {
  /**
   * Progress value between 0 and 100.
   * Values outside this range are clamped automatically.
   */
  value: number
  /**
   * Show the rounded percentage as a label in the center of the circle.
   * Not recommended for `xs` or `sm` sizes due to limited space.
   * @default false
   */
  showLabel?: boolean
  /**
   * Additional classes applied to the root element
   * (the `<svg>` or the wrapper `<div>` when `showLabel` is true).
   */
  className?: string
  /**
   * Additional classes applied to the track (background) circle.
   * Overrides the default `text-muted-foreground/25`.
   */
  trackClassName?: string
  /**
   * Additional classes applied to the indicator (progress) circle.
   * Overrides the color variant color.
   */
  indicatorClassName?: string
  /**
   * Named stroke thickness variant.
   * Applied as a multiplier on top of the size-derived base stroke width.
   * Ignored when `strokeWidth` is provided.
   * @default "normal"
   */
  stroke?: "thin" | "normal" | "thick"
  /**
   * Explicit stroke width in SVG user units.
   * When set, takes full precedence over both the size default and the `stroke` variant.
   */
  strokeWidth?: number
}

/**
 * `CircularProgress` renders an SVG-based circular progress indicator.
 *
 * ## Features
 * - Five size variants: `xs` | `sm` | `md` | `lg` | `xl`
 * - Five semantic color variants: `default` | `success` | `warning` | `destructive` | `secondary`
 * - Three named stroke variants: `thin` | `normal` | `thick`
 * - Explicit `strokeWidth` prop for pixel-perfect control
 * - Optional percentage label centered inside the ring
 * - Smooth CSS transition on the indicator arc
 * - Accessible: exposes `role="progressbar"` with `aria-valuenow / min / max`
 *
 * ## Usage
 *
 * ```tsx
 * // Basic usage — 65% complete, default size and color
 * <CircularProgress value={65} />
 *
 * // Large success ring with centered label
 * <CircularProgress value={92} size="lg" color="success" showLabel />
 *
 * // Thin ring
 * <CircularProgress value={45} stroke="thin" />
 *
 * // Thick ring
 * <CircularProgress value={75} stroke="thick" />
 *
 * // Explicit stroke width override
 * <CircularProgress value={60} strokeWidth={8} />
 *
 * // Custom track / indicator colours via className overrides
 * <CircularProgress
 *   value={50}
 *   trackClassName="text-blue-100"
 *   indicatorClassName="text-blue-600"
 * />
 * ```
 *
 * ## Props
 * | Prop                | Type                                               | Default     | Description                                      |
 * |---------------------|----------------------------------------------------|-------------|--------------------------------------------------|
 * | `value`             | `number`                                           | —           | Progress 0–100 (clamped)                         |
 * | `size`              | `"xs" \| "sm" \| "md" \| "lg" \| "xl"`           | `"md"`      | Controls the diameter and base stroke width      |
 * | `color`             | `"default" \| "success" \| "warning" \| "destructive" \| "secondary"` | `"default"` | Colour of the progress arc |
 * | `stroke`            | `"thin" \| "normal" \| "thick"`                   | `"normal"`  | Named thickness variant (multiplier on base)     |
 * | `strokeWidth`       | `number`                                           | —           | Explicit SVG stroke width; overrides `stroke`    |
 * | `showLabel`         | `boolean`                                          | `false`     | Show percentage text in the centre               |
 * | `className`         | `string`                                           | —           | Extra classes on the root element                |
 * | `trackClassName`    | `string`                                           | —           | Override classes for the background ring         |
 * | `indicatorClassName`| `string`                                           | —           | Override classes for the progress arc            |
 */
function CircularProgress({
  value,
  size = "md",
  color = "default",
  stroke = "normal",
  strokeWidth,
  showLabel = false,
  className,
  trackClassName,
  indicatorClassName,
}: CircularProgressProps) {
  const { px, stroke: baseStroke } = SIZE_MAP[size as keyof typeof SIZE_MAP]
  const resolvedStroke =
    strokeWidth ??
    baseStroke * STROKE_MULTIPLIER_MAP[stroke as keyof typeof STROKE_MULTIPLIER_MAP]
  const r = (px - resolvedStroke) / 2
  const circumference = 2 * Math.PI * r
  const clamped = Math.min(100, Math.max(0, value))
  const offset = circumference * (1 - clamped / 100)
  const percentage = Math.round(clamped)

  const indicatorColor =
    INDICATOR_COLOR_MAP[color as string] ?? INDICATOR_COLOR_MAP.default

  const svg = (
    <svg
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      className={cn("shrink-0 -rotate-90", !showLabel && className)}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${percentage}%`}
    >
      {/* Background track */}
      <circle
        cx={px / 2}
        cy={px / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={resolvedStroke}
        className={cn("text-muted-foreground/25", trackClassName)}
      />
      {/* Progress indicator */}
      <circle
        cx={px / 2}
        cy={px / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={resolvedStroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={cn(indicatorColor, indicatorClassName)}
        style={{ transition: "stroke-dashoffset 0.35s ease" }}
      />
    </svg>
  )

  if (!showLabel) return svg

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        className
      )}
    >
      {svg}
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center tabular-nums font-semibold leading-none",
          LABEL_SIZE_MAP[size as keyof typeof SIZE_MAP]
        )}
        aria-hidden
      >
        {percentage}%
      </span>
    </div>
  )
}

export { CircularProgress, circularProgressVariants }
