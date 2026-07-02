"use client"

import { X, Zap } from "lucide-react"
import { CardPreview } from "./card-preview"
import {
  AccelerateBadge,
  EnergyPip,
  FuryIcon,
  MightIcon,
  RarityCoin,
  UnitIcon,
} from "./card-icons"

export function CardModal({ onClose }: { onClose?: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/85 backdrop-blur-sm"
      />

      {/* Shell */}
      <div
        className="relative flex w-full max-w-[860px] overflow-hidden rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
        style={{ background: "#141413", color: "#ddd9d3" }}
      >
        {/* ── LEFT: card image ── */}
        <div
          className="hidden w-[300px] shrink-0 md:block"
          style={{ background: "#0d0d0c" }}
        >
          <CardPreview />
        </div>

        {/* ── RIGHT: info sheet ── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">

          {/* Name + close */}
          <div className="relative px-8 pb-5 pt-7">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-5 top-5 flex size-7 items-center justify-center rounded-full text-[#555350] transition hover:bg-white/10 hover:text-[#ddd9d3]"
            >
              <X className="size-4" />
            </button>

            {/* Eyebrow */}
            <p className="mb-2 text-[11px] font-semibold" style={{ color: "#c42b2b" }}>
              Origins &nbsp;·&nbsp; OGN-001
            </p>

            {/* Title */}
            <h2
              id="card-title"
              className="text-pretty text-[30px] font-black leading-[1.05] tracking-tight"
              style={{ color: "#f5f2ed" }}
            >
              Blazing Scorcher
            </h2>
          </div>

          {/* ── STATS STRIP ── */}
          <div
            className="mx-8 mb-6 flex items-stretch divide-x rounded-xl"
            style={{ background: "#1c1b1a", divideColor: "#2a2927" }}
          >
            <Stat label="Cost">
              <EnergyPip value={5} className="size-8 text-base" />
            </Stat>
            <Stat label="Might">
              <span className="flex items-center gap-1.5">
                <MightIcon className="size-5" style={{ color: "#888480" }} />
                <span className="text-xl font-black leading-none" style={{ color: "#f5f2ed" }}>5</span>
              </span>
            </Stat>
            <Stat label="Power">
              <span className="text-xl font-black leading-none" style={{ color: "#2e2d2b" }}>—</span>
            </Stat>
          </div>

          {/* ── ATTRIBUTES ── */}
          <div className="px-8">
            <Row label="Type">
              <UnitIcon className="size-[15px]" />
              <span>Unit</span>
            </Row>
            <Row label="Color">
              <FuryIcon className="size-[15px]" />
              <span>Fury</span>
            </Row>
            <Row label="Tags">
              {["Noxus", "Dragon"].map((tag) => (
                <span
                  key={tag}
                  className="rounded px-2 py-0.5 text-[12px] font-semibold"
                  style={{ background: "#252422", color: "#aaa7a0" }}
                >
                  {tag}
                </span>
              ))}
            </Row>
            {/* Set + Rarity on same line */}
            <div
              className="flex items-center gap-8 border-t py-3"
              style={{ borderColor: "#222120" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold" style={{ color: "#4d4b48" }}>
                  Set
                </span>
                <span className="text-[13px] font-medium" style={{ color: "#aaa7a0" }}>Origins</span>
              </div>
              <div className="h-3 w-px" style={{ background: "#222120" }} />
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold" style={{ color: "#4d4b48" }}>
                  Rarity
                </span>
                <span className="flex items-center gap-2 text-[13px] font-medium" style={{ color: "#aaa7a0" }}>
                  <RarityCoin className="size-[15px]" />
                  Common
                </span>
              </div>
            </div>
          </div>

          {/* ── ABILITY ── */}
          <div
            className="mx-8 my-2 rounded-xl px-5 py-4"
            style={{ background: "#1a1918", border: "1px solid #252422" }}
          >
            <p
              className="mb-3 text-[10px] font-semibold"
              style={{ color: "#4d4b48" }}
            >
              Ability
            </p>
            <p
              className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-[13.5px] leading-relaxed"
              style={{ color: "#b5b2ac" }}
            >
              <AccelerateBadge />
              <span>(You may pay</span>
              <EnergyPip value={1} className="size-[18px] text-[11px]" />
              <FuryIcon className="size-[15px]" />
              <span>as an additional cost to have me enter ready.)</span>
            </p>
          </div>

          {/* ── PRICES ── */}
          <div className="px-8 pb-7 pt-5">
            {/* Section label */}
            <p
              className="mb-4 text-[10px] font-semibold"
              style={{ color: "#4d4b48" }}
            >
              Market prices
            </p>

            {/* Price rows */}
            <div className="flex flex-col">
              <PriceRow finish="Normal" price="$0.07" />
              <PriceRow finish="Foil" price="$0.23" />
            </div>

            {/* TCGPlayer credit */}
            <div
              className="mt-5 flex items-center gap-2.5 border-t pt-4"
              style={{ borderColor: "#222120" }}
            >
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded"
                style={{ background: "#f6c945" }}
              >
                <Zap className="size-3.5 fill-black text-black" />
              </span>
              <span className="text-[11px] font-extrabold" style={{ color: "#555350" }}>
                TCGPLAYER
              </span>
              <span className="text-[11px]" style={{ color: "#333230" }}>· Updated daily</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

/* ── helpers ── */

function Stat({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 px-5 py-4">
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "#4d4b48" }}
      >
        {label}
      </span>
      {children}
    </div>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      className="flex items-center gap-4 border-t py-3"
      style={{ borderColor: "#222120" }}
    >
      <span
        className="w-12 shrink-0 text-[11px] font-semibold"
        style={{ color: "#4d4b48" }}
      >
        {label}
      </span>
      <span
        className="flex items-center gap-2 text-[13px] font-medium"
        style={{ color: "#aaa7a0" }}
      >
        {children}
      </span>
    </div>
  )
}

function PriceRow({ finish, price }: { finish: string; price: string }) {
  return (
    <div
      className="flex items-baseline justify-between border-t py-3 first:border-t-0"
      style={{ borderColor: "#222120" }}
    >
      <span className="text-[13px] font-medium" style={{ color: "#6b6866" }}>
        {finish}
      </span>
      <span className="text-[20px] font-black tabular-nums" style={{ color: "#4ade80" }}>
        {price}
      </span>
    </div>
  )
}
