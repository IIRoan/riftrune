import type { SVGProps } from "react"
import { cn } from "@/lib/utils"

/** Energy cost pip — white disc with a black numeral, exactly as printed on the card. */
export function EnergyPip({
  value,
  className,
}: {
  value: number | string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-white font-bold text-black shadow-sm ring-1 ring-black/20",
        className,
      )}
      aria-label={`${value} energy`}
    >
      {value}
    </span>
  )
}

/** The green ACCELERATE keyword tag, kept in its signature treatment. */
export function AccelerateBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex select-none items-center rounded-md bg-accelerate px-2.5 py-1 text-xs font-extrabold italic tracking-wide text-white shadow-sm",
        className,
      )}
    >
      ACCELERATE
    </span>
  )
}

/**
 * Official "Fury" domain symbol (red three-bladed swirl).
 * Rendered from the real card asset so it always matches the printed mark.
 */
export function FuryIcon({ className }: { className?: string }) {
  return (
    <img
      src="/icons/fury.png"
      alt=""
      aria-hidden="true"
      className={cn("inline-block object-contain", className)}
    />
  )
}

/**
 * Official "Unit" type glyph (brown hooded emblem) from the card.
 */
export function UnitIcon({ className }: { className?: string }) {
  return (
    <img
      src="/icons/unit.png"
      alt=""
      aria-hidden="true"
      className={cn("inline-block object-contain", className)}
    />
  )
}

/**
 * Official "Common" rarity medallion (translucent orb) from the card.
 */
export function RarityCoin({ className }: { className?: string }) {
  return (
    <img
      src="/icons/rarity-common.png"
      alt=""
      aria-hidden="true"
      className={cn("inline-block rounded-full object-contain", className)}
    />
  )
}

/**
 * The "Might" symbol — a trident/spear mark used for a unit's combat value.
 */
export function MightIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M12 3.5v17" />
      <path d="M6.5 8.5c0 3 2.4 5 5.5 5s5.5-2 5.5-5" />
      <path d="M6.5 8.5V6M17.5 8.5V6M12 3.5l-1.6 1.8M12 3.5l1.6 1.8" />
    </svg>
  )
}
