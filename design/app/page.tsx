"use client"

import Image from "next/image"
import {
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  CircleDollarSign,
  Grid2X2,
  ListFilter,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react"
import { useMemo, useState } from "react"
import {
  AccelerateBadge,
  EnergyPip,
  FuryIcon,
  MightIcon,
  RarityCoin,
  UnitIcon,
} from "@/components/riftbound/card-icons"
import { cn } from "@/lib/utils"

type CardRecord = {
  id: string
  name: string
  number: string
  set: string
  color: string
  type: string
  rarity: string
  tags: string[]
  energy: number
  might: number
  owned: number
  normalPrice: string
  foilPrice: string
  marketTrend: string
  variant: string
  image: string
  alt: string
  note: string
}

const cards: CardRecord[] = [
  {
    id: "blazing-scorcher",
    name: "Blazing Scorcher",
    number: "OGN-001",
    set: "Origins",
    color: "Fury",
    type: "Unit",
    rarity: "Common",
    tags: ["Noxus", "Dragon"],
    energy: 5,
    might: 5,
    owned: 4,
    normalPrice: "€0.07",
    foilPrice: "€0.23",
    marketTrend: "+8%",
    variant: "Standard",
    image: "/cards/blazing-scorcher.png",
    alt: "Blazing Scorcher Riftbound card artwork",
    note: "Accelerate threat that collectors can pick up cheaply across normal and foil printings.",
  },
  {
    id: "scorcher-foil",
    name: "Blazing Scorcher",
    number: "OGN-001F",
    set: "Origins",
    color: "Fury",
    type: "Unit",
    rarity: "Foil",
    tags: ["Noxus", "Dragon"],
    energy: 5,
    might: 5,
    owned: 1,
    normalPrice: "€0.23",
    foilPrice: "€0.23",
    marketTrend: "+12%",
    variant: "Foil",
    image: "/cards/blazing-scorcher.png",
    alt: "Foil Blazing Scorcher Riftbound card artwork",
    note: "The binder copy: same play profile, more interesting for set collectors.",
  },
  {
    id: "scorcher-alt",
    name: "Blazing Scorcher",
    number: "OGN-001A",
    set: "Origins",
    color: "Fury",
    type: "Unit",
    rarity: "Alt Art",
    tags: ["Noxus", "Dragon"],
    energy: 5,
    might: 5,
    owned: 0,
    normalPrice: "€1.40",
    foilPrice: "€3.10",
    marketTrend: "Watch",
    variant: "Collector",
    image: "/cards/blazing-scorcher.png",
    alt: "Alternate Blazing Scorcher Riftbound card artwork placeholder",
    note: "Tracked as a collector target until complete art and market data sync.",
  },
]

const filters = ["All cards", "Owned", "Wishlist", "Fury", "Units"]

export default function Page() {
  const [selectedId, setSelectedId] = useState(cards[0].id)
  const [activeFilter, setActiveFilter] = useState(filters[0])
  const selected = cards.find((card) => card.id === selectedId) ?? cards[0]

  const visibleCards = useMemo(() => {
    if (activeFilter === "Owned") {
      return cards.filter((card) => card.owned > 0)
    }

    if (activeFilter === "Wishlist") {
      return cards.filter((card) => card.owned === 0)
    }

    if (activeFilter === "Fury") {
      return cards.filter((card) => card.color === "Fury")
    }

    if (activeFilter === "Units") {
      return cards.filter((card) => card.type === "Unit")
    }

    return cards
  }, [activeFilter])

  return (
    <main className="min-h-screen bg-archive-bg text-archive-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <AppHeader />

        <section className="grid flex-1 gap-5 pt-5 lg:grid-cols-[minmax(0,1fr)_430px] xl:grid-cols-[minmax(0,1fr)_470px]">
          <div className="min-w-0">
            <SearchPanel
              activeFilter={activeFilter}
              filters={filters}
              onFilterChange={setActiveFilter}
            />

            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
              <section
                aria-labelledby="catalog-title"
                className="min-w-0 rounded-xl border border-archive-line bg-archive-surface"
              >
                <div className="flex flex-col gap-3 border-b border-archive-soft-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 id="catalog-title" className="text-xl font-semibold">
                      Riftbound catalog
                    </h1>
                    <p className="mt-1 text-sm text-archive-muted">
                      2,288 synced variants · prices refreshed daily
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconButton label="Grid view">
                      <Grid2X2 className="size-4" />
                    </IconButton>
                    <button className="archive-focus archive-transition inline-flex h-9 items-center gap-2 rounded-lg border border-archive-line bg-archive-surface px-3 text-sm font-medium text-archive-ink hover:border-archive-accent hover:text-archive-accent">
                      <SlidersHorizontal className="size-4" />
                      Sort
                      <ChevronDown className="size-4 text-archive-subtle" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-0 divide-y divide-archive-soft-line">
                  {visibleCards.map((card) => (
                    <CardResult
                      key={card.id}
                      card={card}
                      selected={card.id === selected.id}
                      onSelect={() => setSelectedId(card.id)}
                    />
                  ))}
                </div>
              </section>

              <CollectionPanel />
            </div>
          </div>

          <CardDetail card={selected} />
        </section>
      </div>
    </main>
  )
}

function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-archive-soft-line bg-archive-bg/95 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <a href="#" className="archive-focus archive-transition flex items-center gap-3 rounded-lg">
          <span className="flex size-10 items-center justify-center rounded-xl bg-archive-ink text-archive-surface">
            <BookOpen className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-semibold leading-5">
              riftrune.com
            </span>
            <span className="block text-xs font-medium text-archive-muted">
              Riftbound cards
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 rounded-xl bg-archive-panel p-1 md:flex">
          {["Cards", "Prices", "Collection", "Decks"].map((item) => (
            <a
              key={item}
              href="#"
              className={cn(
                "archive-focus archive-transition rounded-lg px-3 py-2 text-sm font-medium",
                item === "Cards"
                  ? "bg-archive-surface text-archive-ink"
                  : "text-archive-muted hover:text-archive-ink",
              )}
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <IconButton label="Notifications">
            <Bell className="size-4" />
          </IconButton>
          <button className="archive-focus archive-transition hidden h-10 items-center gap-2 rounded-xl bg-archive-accent px-4 text-sm font-semibold text-archive-accent-ink hover:brightness-95 active:translate-y-px sm:inline-flex">
            <Star className="size-4" />
            Add card
          </button>
        </div>
      </div>
    </header>
  )
}

function SearchPanel({
  activeFilter,
  filters,
  onFilterChange,
}: {
  activeFilter: string
  filters: string[]
  onFilterChange: (filter: string) => void
}) {
  return (
    <section
      aria-label="Catalog search"
      className="rounded-xl border border-archive-line bg-archive-surface p-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="archive-transition flex min-h-12 flex-1 items-center gap-3 rounded-xl border border-archive-line bg-archive-bg px-4 focus-within:border-archive-accent focus-within:ring-3 focus-within:ring-archive-accent/20">
          <Search className="size-5 shrink-0 text-archive-subtle" />
          <span className="sr-only">Search cards</span>
          <input
            placeholder="Search cards, artists, tags, or set numbers"
            className="min-w-0 flex-1 bg-transparent text-[16px] text-archive-ink outline-none placeholder:text-archive-muted"
          />
        </label>

        <button className="archive-focus archive-transition inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-archive-line bg-archive-surface px-4 text-sm font-semibold text-archive-ink hover:border-archive-accent hover:text-archive-accent">
          <ListFilter className="size-4" />
          Advanced filters
        </button>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => onFilterChange(filter)}
            className={cn(
              "archive-focus archive-transition h-9 shrink-0 rounded-full px-4 text-sm font-semibold",
              filter === activeFilter
                ? "bg-archive-ink text-archive-surface"
                : "bg-archive-panel text-archive-muted hover:text-archive-ink",
            )}
          >
            {filter}
          </button>
        ))}
      </div>
    </section>
  )
}

function CardResult({
  card,
  selected,
  onSelect,
}: {
  card: CardRecord
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "archive-focus archive-transition grid w-full grid-cols-[70px_minmax(0,1fr)] gap-3 px-4 py-4 text-left sm:grid-cols-[84px_minmax(0,1fr)_150px]",
        selected
          ? "bg-[oklch(0.96_0.018_29)]"
          : "bg-archive-surface hover:bg-archive-panel",
      )}
    >
      <div className="relative aspect-[5/7] overflow-hidden rounded-lg bg-archive-panel">
        <Image
          src={card.image}
          alt=""
          fill
          sizes="84px"
          className="object-cover object-top"
        />
      </div>

      <div className="min-w-0 self-center">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-base font-semibold text-archive-ink">
            {card.name}
          </span>
          {selected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-archive-surface px-2 py-0.5 text-xs font-semibold text-archive-accent">
              <Check className="size-3" />
              Selected
            </span>
          )}
        </div>
        <p className="mt-1 text-sm font-medium text-archive-muted">
          {card.number} · {card.set} · {card.variant}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-archive-muted">
          <span className="inline-flex items-center gap-1 rounded-full bg-archive-bg px-2 py-1">
            <FuryIcon className="size-3.5" />
            {card.color}
          </span>
          <span className="rounded-full bg-archive-bg px-2 py-1">
            {card.rarity}
          </span>
          <span className="rounded-full bg-archive-bg px-2 py-1">
            Owned {card.owned}
          </span>
        </div>
      </div>

      <div className="col-span-2 flex items-end justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end sm:self-center">
        <span className="text-sm font-semibold tabular-nums text-archive-ink">
          {card.normalPrice}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.94_0.04_150)] px-2 py-1 text-xs font-bold text-[oklch(0.37_0.1_150)]">
          <TrendingUp className="size-3" />
          {card.marketTrend}
        </span>
      </div>
    </button>
  )
}

function CollectionPanel() {
  return (
    <aside className="rounded-xl border border-archive-line bg-archive-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Collection pulse</h2>
          <p className="mt-1 text-sm text-archive-muted">Origins set</p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-xl bg-[oklch(0.93_0.035_246)] text-archive-info">
          <ShieldCheck className="size-5" />
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <ProgressRow label="Main set" value="61%" />
        <ProgressRow label="Foils" value="18%" />
        <ProgressRow label="Wishlist" value="9 cards" />
      </div>

      <div className="mt-5 rounded-xl bg-archive-panel p-4">
        <p className="text-sm font-semibold text-archive-ink">
          Price movement
        </p>
        <p className="mt-1 text-sm leading-6 text-archive-muted">
          Three watched Fury cards moved this week. Review foils before the
          next trade night.
        </p>
      </div>
    </aside>
  )
}

function ProgressRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-archive-soft-line pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm font-medium text-archive-muted">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-archive-ink">
        {value}
      </span>
    </div>
  )
}

function CardDetail({ card }: { card: CardRecord }) {
  return (
    <aside className="lg:sticky lg:top-[86px] lg:h-[calc(100vh-106px)]">
      <section className="flex h-full flex-col overflow-hidden rounded-xl border border-archive-line bg-archive-surface">
        <div className="grid gap-0 border-b border-archive-soft-line md:grid-cols-[190px_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[190px_minmax(0,1fr)]">
          <div className="relative min-h-[280px] bg-archive-panel md:min-h-[260px] lg:min-h-[360px] xl:min-h-[260px]">
            <Image
              key={card.id}
              src={card.image}
              alt={card.alt}
              fill
              priority
              sizes="(min-width: 1280px) 190px, (min-width: 1024px) 430px, 50vw"
              className="archive-transition object-contain p-4"
            />
          </div>

          <div className="flex min-w-0 flex-col justify-between p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-archive-muted">
                <span>{card.set}</span>
                <span aria-hidden="true">·</span>
                <span>{card.number}</span>
              </div>
              <h2 className="mt-2 text-2xl font-semibold leading-tight">
                {card.name}
              </h2>
              <p className="mt-3 max-w-[54ch] text-sm leading-6 text-archive-muted">
                {card.note}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-xl border border-archive-soft-line">
              <Stat label="Cost">
                <EnergyPip value={card.energy} className="size-8 text-sm" />
              </Stat>
              <Stat label="Might">
                <span className="inline-flex items-center gap-1.5">
                  <MightIcon className="size-4 text-archive-muted" />
                  {card.might}
                </span>
              </Stat>
              <Stat label="Owned">{card.owned}</Stat>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            <MetaPill label="Type" value={card.type} icon={<UnitIcon className="size-4" />} />
            <MetaPill label="Color" value={card.color} icon={<FuryIcon className="size-4" />} />
            <MetaPill label="Rarity" value={card.rarity} icon={<RarityCoin className="size-4" />} />
            <MetaPill label="Variant" value={card.variant} icon={<Sparkles className="size-4" />} />
          </div>

          <section className="mt-5 rounded-xl bg-archive-panel p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">Rules text</h3>
              <AccelerateBadge className="text-[11px]" />
            </div>
            <p className="text-sm leading-6 text-archive-muted">
              You may pay <EnergyPip value={1} className="mx-1 size-[18px] text-[11px]" />
              <FuryIcon className="mx-1 size-4" />
              as an additional cost to have this unit enter ready.
            </p>
          </section>

          <section className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">Market</h3>
              <span className="text-xs font-medium text-archive-muted">
                Updated daily
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-archive-soft-line">
              <PriceRow finish="Normal" price={card.normalPrice} />
              <PriceRow finish="Foil" price={card.foilPrice} />
            </div>
          </section>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button className="archive-focus archive-transition inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-archive-accent px-4 text-sm font-semibold text-archive-accent-ink hover:brightness-95 active:translate-y-px">
              <Star className="size-4" />
              Watch
            </button>
            <button className="archive-focus archive-transition inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-archive-line bg-archive-surface px-4 text-sm font-semibold text-archive-ink hover:border-archive-accent hover:text-archive-accent">
              <CircleDollarSign className="size-4" />
              Prices
            </button>
          </div>
        </div>
      </section>
    </aside>
  )
}

function Stat({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-20 flex-col items-center justify-center gap-2 border-r border-archive-soft-line px-3 text-center last:border-r-0">
      <span className="text-xs font-semibold text-archive-muted">{label}</span>
      <span className="text-lg font-semibold tabular-nums text-archive-ink">
        {children}
      </span>
    </div>
  )
}

function MetaPill({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-archive-soft-line bg-archive-surface p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-archive-muted">
        {icon}
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-semibold text-archive-ink">
        {value}
      </p>
    </div>
  )
}

function PriceRow({ finish, price }: { finish: string; price: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-archive-soft-line bg-archive-surface px-4 py-3 last:border-b-0">
      <span className="text-sm font-medium text-archive-muted">{finish}</span>
      <span className="text-base font-semibold tabular-nums text-archive-success">
        {price}
      </span>
    </div>
  )
}

function IconButton({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="archive-focus archive-transition inline-flex size-10 items-center justify-center rounded-xl border border-archive-line bg-archive-surface text-archive-muted hover:border-archive-accent hover:text-archive-accent active:translate-y-px"
    >
      {children}
    </button>
  )
}
