"use client"

import Image from "next/image"
import { ContextMenu } from "@base-ui/react/context-menu"
import { Menu } from "@base-ui/react/menu"
import {
  Archive,
  Bell,
  Check,
  ChevronDown,
  LayoutGrid,
  Layers,
  Minus,
  MoreHorizontal,
  Plus,
  Rows3,
  Search,
  SlidersHorizontal,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import {
  EnergyPip,
  FuryIcon,
  MightIcon,
  UnitIcon,
} from "@/components/riftbound/card-icons"
import { cn } from "@/lib/utils"
import { useCollectionData } from "@/lib/use-collection-data"

type Printing = {
  variantNumber: string
  variantLabel: string
  isFoil: boolean
  price: string
  marketTrend: string
  owned: number
  image: string
}

type CardRecord = {
  id: string
  name: string
  set: string
  color: string
  type: string
  rarity: string
  tags: string[]
  energy: number
  might: number
  alt: string
  note: string
  rulesText: string
  printings: Printing[]
}

function totalOwned(card: CardRecord): number {
  return card.printings.reduce((sum, p) => sum + p.owned, 0)
}

function primaryPrinting(card: CardRecord): Printing {
  return card.printings[0]
}

function priceRange(card: CardRecord): string {
  const prices = card.printings
    .map((p) => p.price)
    .filter((p) => p !== "—")
  if (prices.length === 0) return "—"
  if (prices.length === 1) return prices[0]
  const sorted = prices.sort()
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  if (min === max) return min
  return `${min}–${max}`
}

function printingSummary(card: CardRecord): string | null {
  if (card.printings.length <= 1) return null
  const hasStd = card.printings.some((p) => !p.isFoil)
  const hasFoil = card.printings.some((p) => p.isFoil)
  const parts: string[] = []
  if (hasStd) parts.push("Std")
  if (hasFoil) parts.push("Foil")
  return parts.length > 1 ? parts.join(" · ") : null
}

function bestTrend(card: CardRecord): string {
  const trends = card.printings.map((p) => p.marketTrend)
  const up = trends.filter((t) => t.startsWith("+"))
  const down = trends.filter((t) => t.startsWith("-"))
  if (up.length > 0) return up[0]
  if (down.length > 0) return down[0]
  return trends[0] ?? "Flat"
}

type PageView = "cards" | "collection" | "decks"

type SetStat = {
  code: string
  name: string
  total: number
  owned: number
  foilOwned: number
  art?: string
  logo?: string
  released: string
}

type TypeStat = { name: string; owned: number; total: number }
type RarityStat = { name: string; owned: number; total: number }

const cards: CardRecord[] = [
  {
    id: "adaptatron",
    name: "Adaptatron",
    set: "Origins",
    color: "Calm",
    type: "Unit",
    rarity: "Uncommon",
    tags: ["Piltover", "Mech"],
    energy: 4,
    might: 3,
    alt: "Adaptatron Riftbound unit card artwork",
    note: "Solid uncommon play target in Calm, affordable across both printings.",
    rulesText:
      "When I conquer, you may kill a gear. If you do, buff me. (If I don't have a buff, I get a +1 Might buff.)",
    printings: [
      { variantNumber: "OGN-056", variantLabel: "Standard", isFoil: false, price: "€0.23", marketTrend: "Flat", owned: 2, image: "/cards/ogn_056.webp" },
      { variantNumber: "OGN-056-Foil", variantLabel: "Foil", isFoil: true, price: "€1.02", marketTrend: "Flat", owned: 0, image: "/cards/ogn_056_foil.webp" },
    ],
  },
  {
    id: "ahri-alluring",
    name: "Ahri, Alluring",
    set: "Origins",
    color: "Calm",
    type: "Unit",
    rarity: "Rare",
    tags: ["Ahri", "Ionia"],
    energy: 5,
    might: 4,
    alt: "Ahri, Alluring Riftbound unit card artwork",
    note: "Chase launch promo for Calm lists, with a significant foil spread for binder value.",
    rulesText: "When I hold, you score 1 point.",
    printings: [
      { variantNumber: "OGN-066-Launch", variantLabel: "Launch Event Promo", isFoil: false, price: "€32.80", marketTrend: "-75%", owned: 0, image: "/cards/ogn_066_launch.webp" },
      { variantNumber: "OGN-066-Launch-Foil", variantLabel: "Launch Event Promo Foil", isFoil: true, price: "€27.31", marketTrend: "-75%", owned: 0, image: "/cards/ogn_066_launch.webp" },
    ],
  },
  {
    id: "ahri-inquisitive",
    name: "Ahri, Inquisitive",
    set: "Spiritforged",
    color: "Mind",
    type: "Unit",
    rarity: "Showcase",
    tags: ["Ahri", "Ionia"],
    energy: 3,
    might: 3,
    alt: "Ahri, Inquisitive Riftbound unit card artwork",
    note: "Premium showcase unit tracked by collectors for its foil multiplier and Mind deck demand.",
    rulesText:
      "When I attack or defend, give an enemy unit here -2 Might this turn, to a minimum of 1 Might.",
    printings: [
      { variantNumber: "SFD-227", variantLabel: "Overnumbered Foil", isFoil: true, price: "€206.82", marketTrend: "Flat", owned: 1, image: "/cards/sfd_227.webp" },
    ],
  },
  {
    id: "arena-bar",
    name: "Arena Bar",
    set: "Origins",
    color: "Body",
    type: "Gear",
    rarity: "Common",
    tags: ["Equipment"],
    energy: 3,
    might: 0,
    alt: "Arena Bar Riftbound gear card artwork",
    note: "Bulk-friendly common gear with foil upside for set completion.",
    rulesText:
      "Exhaust: Buff an exhausted friendly unit. (If it doesn't have a buff, it gets a +1 Might buff.)",
    printings: [
      { variantNumber: "OGN-124", variantLabel: "Standard", isFoil: false, price: "€0.09", marketTrend: "+12%", owned: 4, image: "/cards/ogn_124.webp" },
      { variantNumber: "OGN-124-Foil", variantLabel: "Foil", isFoil: true, price: "€0.24", marketTrend: "+12%", owned: 0, image: "/cards/ogn_124_foil.webp" },
    ],
  },
  {
    id: "blade-ruined-king",
    name: "Blade of the Ruined King",
    set: "Spiritforged",
    color: "Order",
    type: "Gear",
    rarity: "Epic",
    tags: ["Equipment"],
    energy: 3,
    might: 0,
    alt: "Blade of the Ruined King Riftbound gear card artwork",
    note: "Premium epic gear tracked by collectors for its foil multiplier and Order deck demand.",
    rulesText:
      "Equip — Recycle 1 Order rune: Attach this to a unit you control.",
    printings: [
      { variantNumber: "SFD-178", variantLabel: "Standard", isFoil: false, price: "€4.85", marketTrend: "+21%", owned: 0, image: "/cards/sfd_178.webp" },
      { variantNumber: "SFD-178-Foil", variantLabel: "Foil", isFoil: true, price: "€3.19", marketTrend: "+21%", owned: 0, image: "/cards/sfd_178.webp" },
    ],
  },
  {
    id: "blind-fury",
    name: "Blind Fury",
    set: "Origins",
    color: "Fury",
    type: "Spell",
    rarity: "Rare",
    tags: ["Action"],
    energy: 4,
    might: 0,
    alt: "Blind Fury Riftbound spell card artwork",
    note: "Chase rare spell for Fury lists, with meaningful foil spread for binder value.",
    rulesText:
      "Action (Play on your turn or in showdowns.) Each opponent reveals the top card of their Main Deck. Choose one and banish it, then play it, ignoring its cost. Then recycle the rest.",
    printings: [
      { variantNumber: "OGN-025", variantLabel: "Standard", isFoil: false, price: "€0.49", marketTrend: "+63%", owned: 3, image: "/cards/ogn_025.webp" },
      { variantNumber: "OGN-025-Foil", variantLabel: "Foil", isFoil: true, price: "€0.16", marketTrend: "+63%", owned: 0, image: "/cards/ogn_025.webp" },
    ],
  },
  {
    id: "body-rune",
    name: "Body Rune",
    set: "Origins",
    color: "Body",
    type: "Rune",
    rarity: "Common",
    tags: ["Resource"],
    energy: 0,
    might: 0,
    alt: "Body Rune Riftbound rune card artwork",
    note: "Bulk-friendly common rune, no foil printing available.",
    rulesText: "Body domain rune. Exhaust to pay Body power costs.",
    printings: [
      { variantNumber: "OGN-126", variantLabel: "Standard", isFoil: false, price: "€0.09", marketTrend: "+12%", owned: 6, image: "/cards/ogn_126.webp" },
    ],
  },
  {
    id: "caitlyn-patrolling",
    name: "Caitlyn, Patrolling",
    set: "Arcane Box Set",
    color: "Calm",
    type: "Unit",
    rarity: "Showcase",
    tags: ["Piltover", "Caitlyn"],
    energy: 3,
    might: 3,
    alt: "Caitlyn, Patrolling Riftbound unit card artwork",
    note: "Premium showcase unit from the Arcane Box Set, foil-only printing.",
    rulesText:
      "I must be assigned combat damage last. Exhaust: Deal damage equal to my Might to a unit at a battlefield. Use this ability only while I'm at a battlefield.",
    printings: [
      { variantNumber: "ARC-002", variantLabel: "Arcane Box Promo Foil", isFoil: true, price: "€45.43", marketTrend: "Flat", owned: 1, image: "/cards/arc_002.webp" },
    ],
  },
  {
    id: "challenge",
    name: "Challenge",
    set: "Origins | Nexus Night",
    color: "Body",
    type: "Spell",
    rarity: "Common",
    tags: ["Action"],
    energy: 2,
    might: 0,
    alt: "Challenge Riftbound spell card artwork",
    note: "Nexus Night promo spell with foil upside for Origins set completion.",
    rulesText:
      "Action (Play on your turn or in showdowns.) Choose a friendly unit and an enemy unit. They deal damage equal to their Mights to each other.",
    printings: [
      { variantNumber: "OGN-128-Nexus", variantLabel: "Nexus Night Promo", isFoil: false, price: "€0.24", marketTrend: "Flat", owned: 2, image: "/cards/ogn_128_nexus.webp" },
      { variantNumber: "OGN-128-Nexus-Foil", variantLabel: "Nexus Night Promo Foil", isFoil: true, price: "€0.67", marketTrend: "Flat", owned: 0, image: "/cards/ogn_128_nexus.webp" },
    ],
  },
  {
    id: "draven",
    name: "Draven, Glorious Executioner",
    set: "Spiritforged",
    color: "Fury / Chaos",
    type: "Legend",
    rarity: "Rare",
    tags: ["Draven"],
    energy: 0,
    might: 0,
    alt: "Draven, Glorious Executioner Riftbound legend card artwork",
    note: "Chase rare legend for Fury / Chaos lists, with meaningful foil spread for binder value.",
    rulesText:
      "When you win a combat, draw 1. (You win if only your units remain after combat.)",
    printings: [
      { variantNumber: "SFD-185", variantLabel: "Standard", isFoil: false, price: "€0.02", marketTrend: "-90%", owned: 1, image: "/cards/sfd_185.webp" },
      { variantNumber: "SFD-185-Foil", variantLabel: "Foil", isFoil: true, price: "€0.20", marketTrend: "-90%", owned: 0, image: "/cards/sfd_185.webp" },
    ],
  },
  {
    id: "hallowed-tomb",
    name: "Hallowed Tomb",
    set: "Origins",
    color: "Colorless",
    type: "Battlefield",
    rarity: "Uncommon",
    tags: ["Shadow Isles"],
    energy: 0,
    might: 0,
    alt: "Hallowed Tomb Riftbound battlefield card artwork",
    note: "Solid uncommon battlefield for control lists, affordable across both printings.",
    rulesText:
      "When you hold here, you may return your Chosen Champion from your trash to your Champion Zone if it is empty.",
    printings: [
      { variantNumber: "OGN-281", variantLabel: "Standard", isFoil: false, price: "€0.09", marketTrend: "-10%", owned: 3, image: "/cards/ogn_281.webp" },
      { variantNumber: "OGN-281-Foil", variantLabel: "Foil", isFoil: true, price: "€0.45", marketTrend: "-10%", owned: 0, image: "/cards/ogn_281.webp" },
    ],
  },
  {
    id: "ruined-rex",
    name: "Ruined Rex",
    set: "Unleashed",
    color: "Mind",
    type: "Unit",
    rarity: "Common",
    tags: ["Bilgewater"],
    energy: 6,
    might: 6,
    alt: "Ruined Rex Riftbound unit card artwork",
    note: "Bulk-friendly common unit with foil upside for Unleashed set completion.",
    rulesText: "Deathknell: Deal 4 to an enemy unit. (When I die, get the effect.)",
    printings: [
      { variantNumber: "UNL-067", variantLabel: "Standard", isFoil: false, price: "€0.09", marketTrend: "-18%", owned: 2, image: "/cards/unl_067.webp" },
      { variantNumber: "UNL-067-Foil", variantLabel: "Foil", isFoil: true, price: "€0.21", marketTrend: "-18%", owned: 0, image: "/cards/unl_067.webp" },
    ],
  },
]

const setCatalog: SetStat[] = [
  {
    code: "OGN",
    name: "Origins",
    total: 544,
    owned: 222,
    foilOwned: 42,
    art: "/sets/origins.png",
    logo: "/set-logos/OGN.webp",
    released: "Oct 2025",
  },
  {
    code: "SFD",
    name: "Spiritforged",
    total: 434,
    owned: 180,
    foilOwned: 15,
    art: "/sets/spiritforged.avif",
    logo: "/set-logos/SFD.webp",
    released: "Feb 2026",
  },
  {
    code: "UNL",
    name: "Unleashed",
    total: 306,
    owned: 195,
    foilOwned: 3,
    art: "/sets/unleashed.jpg",
    logo: "/set-logos/UNL.webp",
    released: "May 2026",
  },
  {
    code: "OGS",
    name: "Proving Grounds",
    total: 25,
    owned: 0,
    foilOwned: 0,
    logo: "/set-logos/OGS.webp",
    released: "Oct 2025",
  },
  {
    code: "OGN-NN",
    name: "Origins | Nexus Night",
    total: 25,
    owned: 1,
    foilOwned: 0,
    logo: "/set-logos/OGN-NN.webp",
    released: "Oct 2025",
  },
  {
    code: "SFD-NN",
    name: "Spiritforged | Nexus Night",
    total: 33,
    owned: 0,
    foilOwned: 0,
    logo: "/set-logos/SFD-NN.webp",
    released: "Feb 2026",
  },
  {
    code: "UNL-NN",
    name: "Unleashed | Nexus Night",
    total: 19,
    owned: 0,
    foilOwned: 0,
    logo: "/set-logos/UNL.webp",
    released: "May 2026",
  },
  {
    code: "ARC",
    name: "Arcane Box Set",
    total: 6,
    owned: 0,
    foilOwned: 0,
    logo: "/set-logos/ARC.webp",
    released: "Dec 2025",
  },
  {
    code: "WRLD25",
    name: "Worlds Bundle 2025",
    total: 4,
    owned: 0,
    foilOwned: 0,
    logo: "/set-logos/WRLD25.webp",
    released: "Oct 2025",
  },
]

const collectionStats = {
  collected: 589,
  available: 1396,
  totalCards: 1593,
  completion: 42.84,
  estimatedValue: "€683.37",
}

const typeStats: TypeStat[] = [
  { name: "Legends", owned: 27, total: 117 },
  { name: "Units", owned: 290, total: 697 },
  { name: "Spells", owned: 145, total: 288 },
  { name: "Gear", owned: 72, total: 150 },
  { name: "Battlefields", owned: 50, total: 98 },
  { name: "Runes", owned: 12, total: 42 },
]

const rarityStats: RarityStat[] = [
  { name: "Common", owned: 210, total: 418 },
  { name: "Uncommon", owned: 195, total: 377 },
  { name: "Rare", owned: 148, total: 248 },
  { name: "Epic", owned: 30, total: 137 },
  { name: "Showcase", owned: 15, total: 216 },
]

const filterGroups = [
  { label: "Collection", options: ["Owned", "Wishlist"] },
  { label: "Domain", options: ["Fury", "Calm", "Mind", "Body", "Chaos", "Order"] },
  { label: "Type", options: ["Unit", "Spell", "Gear", "Legend", "Battlefield", "Rune"] },
  { label: "Rarity", options: ["Common", "Uncommon", "Rare", "Epic", "Showcase"] },
]

const premiumRarities = ["Rare", "Epic", "Showcase"]

type ViewMode = "list" | "grid"

type CardHandlers = {
  onSelect: (id: string) => void
  onAdd: (variantNumber: string) => void
  onRemove: (variantNumber: string) => void
  onCopy: (text: string) => void
}

export default function Page() {
  const [selectedId, setSelectedId] = useState(cards[0].id)
  const [activeFilter, setActiveFilter] = useState("All cards")
  const [view, setView] = useState<ViewMode>("list")
  const [pageView, setPageView] = useState<PageView>("cards")
  const [collection, setCollection] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    for (const card of cards) {
      for (const p of card.printings) {
        initial[p.variantNumber] = p.owned
      }
    }
    return initial
  })

  const apiData = useCollectionData()

  const handlers = useMemo<CardHandlers>(
    () => ({
      onSelect: setSelectedId,
      onAdd: (variantNumber) =>
        setCollection((prev) => ({ ...prev, [variantNumber]: (prev[variantNumber] ?? 0) + 1 })),
      onRemove: (variantNumber) =>
        setCollection((prev) => ({
          ...prev,
          [variantNumber]: Math.max(0, (prev[variantNumber] ?? 0) - 1),
        })),
      onCopy: (text) => {
        void navigator.clipboard?.writeText(text)
      },
    }),
    [],
  )

  const liveCards = useMemo(
    () =>
      cards.map((card) => ({
        ...card,
        printings: card.printings.map((p) => ({
          ...p,
          owned: collection[p.variantNumber] ?? 0,
        })),
      })),
    [collection],
  )

  const selected = liveCards.find((card) => card.id === selectedId) ?? liveCards[0]

  const visibleCards = useMemo(() => {
    if (activeFilter === "Owned") return liveCards.filter((c) => totalOwned(c) > 0)
    if (activeFilter === "Wishlist") return liveCards.filter((c) => totalOwned(c) === 0)
    if (["Fury", "Calm", "Mind", "Body", "Chaos", "Order"].includes(activeFilter))
      return liveCards.filter((c) => c.color.includes(activeFilter))
    if (["Unit", "Spell", "Gear", "Legend", "Battlefield", "Rune"].includes(activeFilter))
      return liveCards.filter((c) => c.type === activeFilter)
    if (["Common", "Uncommon", "Rare", "Epic", "Showcase"].includes(activeFilter))
      return liveCards.filter((c) => c.rarity === activeFilter)
    return liveCards
  }, [activeFilter, liveCards])

  const handleSelectFromCollection = (id: string) => {
    setSelectedId(id)
    setPageView("cards")
  }

  return (
    <div className="flex min-h-screen bg-archive-bg text-archive-ink">
      <SideRail pageView={pageView} onPageChange={setPageView} />
      <main className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden">
        <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col pr-4 sm:pr-6 lg:pr-8">

        {pageView === "cards" && (
          <section className="grid flex-1 gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_430px] xl:grid-cols-[minmax(0,1fr)_470px]">
            <div className="min-w-0">
              <SearchPanel activeFilter={activeFilter} onFilterChange={setActiveFilter} />

              <section aria-labelledby="catalog-title" className="mt-6 min-w-0">
                <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h1 id="catalog-title" className="text-xl font-semibold tracking-tight">
                      Riftbound catalog
                    </h1>
                    <p className="mt-1 font-mono text-[13px] text-archive-muted">
                      {visibleCards.length} of {collectionStats.available.toLocaleString()} cards · synced from Piltover Archive
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ViewToggle view={view} onViewChange={setView} />
                    <button className="archive-focus archive-transition h-9 rounded-lg border border-archive-line px-3 text-sm font-medium text-archive-ink hover:border-archive-muted">
                      Sort
                    </button>
                  </div>
                </div>

                {view === "list" ? (
                  <div className="overflow-hidden rounded-xl border border-archive-line bg-archive-surface">
                    <div className="grid divide-y divide-archive-soft-line">
                      {visibleCards.map((card) => (
                        <CardRow
                          key={card.id}
                          card={card}
                          selected={card.id === selected.id}
                          handlers={handlers}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {visibleCards.map((card) => (
                      <CardTile
                        key={card.id}
                        card={card}
                        selected={card.id === selected.id}
                        handlers={handlers}
                      />
                    ))}
                  </div>
                )}

                {visibleCards.length === 0 && (
                  <p className="rounded-xl border border-dashed border-archive-line px-4 py-10 text-center text-sm text-archive-muted">
                    No cards match this filter.
                  </p>
                )}
              </section>
            </div>

            <CardDetail card={selected} handlers={handlers} />
          </section>
        )}

        {pageView === "collection" && (
          <CollectionView
            onSelect={handleSelectFromCollection}
            liveCards={liveCards}
            apiData={apiData}
          />
        )}

        {pageView === "decks" && (
          <section className="flex-1 pt-6">
            <div className="rounded-xl border border-dashed border-archive-line px-4 py-20 text-center">
              <p className="text-sm text-archive-muted">Deck building is coming soon.</p>
            </div>
          </section>
        )}
        </div>
      </main>
    </div>
  )
}

function SideRail({
  pageView,
  onPageChange,
}: {
  pageView: PageView
  onPageChange: (view: PageView) => void
}) {
  const navItems: { id: PageView; label: string; Icon: React.ElementType }[] = [
    { id: "cards", label: "Cards", Icon: LayoutGrid },
    { id: "collection", label: "Collection", Icon: Archive },
    { id: "decks", label: "Decks", Icon: Layers },
  ]

  return (
    <aside className="sticky top-0 z-30 flex h-screen w-20 shrink-0 flex-col items-center py-3">
      <div className="flex h-full w-12 flex-col items-center gap-1 overflow-hidden rounded-xl border border-archive-line bg-archive-surface py-3 shadow-xl shadow-black/50">
        <a
          href="#"
          className="archive-focus archive-transition mb-2 grid size-8 place-items-center rounded-lg bg-archive-accent"
          aria-label="riftrune home"
        >
          <span aria-hidden="true" className="font-mono text-sm font-bold text-archive-accent-ink">
            r
          </span>
        </a>

        <span aria-hidden="true" className="h-px w-6 shrink-0 bg-archive-soft-line" />

        <nav className="mt-1 flex flex-col items-center gap-1" aria-label="Primary">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onPageChange(id)}
              aria-current={pageView === id ? "page" : undefined}
              aria-label={label}
              className={cn(
                "archive-focus archive-transition grid size-9 place-items-center rounded-lg",
                pageView === id
                  ? "bg-archive-panel text-archive-ink"
                  : "text-archive-muted hover:bg-archive-panel/60 hover:text-archive-ink",
              )}
            >
              <Icon className="size-[18px]" aria-hidden="true" />
            </button>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="flex flex-col items-center gap-1">
          <button
            aria-label="Alerts"
            className="archive-focus archive-transition grid size-9 place-items-center rounded-lg text-archive-muted hover:bg-archive-panel hover:text-archive-ink"
          >
            <Bell className="size-[18px]" aria-hidden="true" />
          </button>
          <button
            aria-label="Add card"
            className="archive-focus archive-transition grid size-9 place-items-center rounded-lg bg-archive-accent text-archive-accent-ink hover:brightness-110 active:translate-y-px"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  )
}

function ViewToggle({
  view,
  onViewChange,
}: {
  view: ViewMode
  onViewChange: (view: ViewMode) => void
}) {
  return (
    <div
      role="group"
      aria-label="View mode"
      className="flex items-center rounded-lg border border-archive-line p-0.5"
    >
      {(
        [
          { id: "list" as const, label: "List", Icon: Rows3 },
          { id: "grid" as const, label: "Grid", Icon: LayoutGrid },
        ]
      ).map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          aria-pressed={view === id}
          aria-label={`${label} view`}
          onClick={() => onViewChange(id)}
          className={cn(
            "archive-focus archive-transition grid size-8 place-items-center rounded-md",
            view === id
              ? "bg-archive-panel text-archive-ink"
              : "text-archive-muted hover:text-archive-ink",
          )}
        >
          <Icon className="size-[18px]" aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}

const menuPopupClass =
  "min-w-56 origin-[var(--transform-origin)] rounded-xl border border-archive-line bg-archive-raised p-1.5 shadow-lg shadow-black/50 outline-none"

const menuPositionerClass = "z-50 outline-none"

const menuItemClass =
  "archive-transition flex w-full cursor-default items-center justify-between gap-6 rounded-lg px-2.5 py-2 text-sm font-medium text-archive-ink outline-none data-[highlighted]:bg-archive-panel data-[disabled]:pointer-events-none data-[disabled]:text-archive-subtle/60"

const menuSeparatorClass = "my-1.5 h-px bg-archive-soft-line"

function FilterRadioItem({ value }: { value: string }) {
  return (
    <Menu.RadioItem value={value} closeOnClick className={menuItemClass}>
      {value}
      <Menu.RadioItemIndicator>
        <Check className="size-4 text-archive-accent-text" aria-hidden="true" />
      </Menu.RadioItemIndicator>
    </Menu.RadioItem>
  )
}

function SearchPanel({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: string
  onFilterChange: (filter: string) => void
}) {
  const filterActive = activeFilter !== "All cards"

  return (
    <section aria-label="Catalog search" className="pt-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="archive-transition flex min-h-12 flex-1 items-center gap-3 rounded-xl border border-archive-line bg-archive-surface px-4 focus-within:border-archive-accent focus-within:ring-2 focus-within:ring-archive-accent/30">
          <Search className="size-5 shrink-0 text-archive-subtle" aria-hidden="true" />
          <span className="sr-only">Search cards</span>
          <input
            placeholder="Search cards, artists, tags, or set numbers"
            className="min-w-0 flex-1 bg-transparent text-[16px] text-archive-ink outline-none placeholder:text-archive-muted"
          />
          <kbd
            aria-hidden="true"
            className="hidden rounded-md border border-archive-line px-1.5 py-0.5 font-mono text-xs text-archive-subtle sm:block"
          >
            /
          </kbd>
        </label>

        <div className="flex items-center gap-2">
          <Menu.Root>
            <Menu.Trigger className="archive-focus archive-transition inline-flex h-12 items-center gap-2 rounded-xl border border-archive-line bg-archive-surface px-4 text-sm font-semibold text-archive-ink hover:border-archive-muted">
              <SlidersHorizontal className="size-4 text-archive-muted" aria-hidden="true" />
              Filters
              {filterActive && (
                <span className="grid size-5 place-items-center rounded-full bg-archive-accent font-mono text-[11px] font-semibold text-archive-accent-ink">
                  1
                </span>
              )}
              <ChevronDown className="size-4 text-archive-subtle" aria-hidden="true" />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner align="end" sideOffset={6} className={menuPositionerClass}>
                <Menu.Popup className={menuPopupClass}>
                  <Menu.RadioGroup value={activeFilter} onValueChange={onFilterChange}>
                    <FilterRadioItem value="All cards" />
                    {filterGroups.map((group) => (
                      <Menu.Group key={group.label}>
                        <Menu.GroupLabel className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold text-archive-subtle">
                          {group.label}
                        </Menu.GroupLabel>
                        {group.options.map((option) => (
                          <FilterRadioItem key={option} value={option} />
                        ))}
                      </Menu.Group>
                    ))}
                  </Menu.RadioGroup>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>

          {filterActive && (
            <button
              type="button"
              onClick={() => onFilterChange("All cards")}
              className="archive-focus archive-transition inline-flex h-12 items-center gap-1.5 rounded-xl bg-archive-panel px-3.5 text-sm font-semibold text-archive-ink hover:bg-archive-raised"
            >
              {activeFilter}
              <span aria-hidden="true" className="text-archive-subtle">
                ×
              </span>
              <span className="sr-only">Clear filter</span>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

function TrendTag({ trend }: { trend: string }) {
  const isUp = trend.startsWith("+")
  const isDown = trend.startsWith("-")

  return (
    <span
      className={cn(
        "font-mono text-xs font-semibold tabular-nums",
        isUp && "text-archive-success",
        isDown && "text-archive-warning",
        !isUp && !isDown && "text-archive-subtle",
      )}
    >
      {isUp && <span aria-hidden="true">▲ </span>}
      {isDown && <span aria-hidden="true">▼ </span>}
      {trend}
    </span>
  )
}

function CardMenuItems({
  card,
  handlers,
  Item,
  Separator,
  showViewDetails = true,
}: {
  card: CardRecord
  handlers: CardHandlers
  Item: typeof Menu.Item
  Separator: typeof Menu.Separator
  showViewDetails?: boolean
}) {
  const primary = primaryPrinting(card)
  return (
    <>
      {showViewDetails && (
        <Item className={menuItemClass} onClick={() => handlers.onSelect(card.id)}>
          View details
        </Item>
      )}
      <Item className={menuItemClass} onClick={() => handlers.onAdd(primary.variantNumber)}>
        Add to collection
        <Plus className="size-4 text-archive-muted" aria-hidden="true" />
      </Item>
      <Item
        className={menuItemClass}
        disabled={totalOwned(card) === 0}
        onClick={() => handlers.onRemove(primary.variantNumber)}
      >
        Remove one
      </Item>
      <Separator className={menuSeparatorClass} />
      <Item className={menuItemClass}>Add to wishlist</Item>
      <Item className={menuItemClass}>Compare printings</Item>
      <Item className={menuItemClass} onClick={() => handlers.onCopy(primary.variantNumber)}>
        Copy card number
        <span className="font-mono text-xs text-archive-subtle">{primary.variantNumber}</span>
      </Item>
      <Separator className={menuSeparatorClass} />
      <Item className={menuItemClass}>Share card</Item>
    </>
  )
}

function CardContextMenu({
  card,
  handlers,
  children,
  className,
}: {
  card: CardRecord
  handlers: CardHandlers
  children: React.ReactNode
  className?: string
}) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className={className}>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className={menuPositionerClass}>
          <ContextMenu.Popup className={menuPopupClass}>
            <CardMenuItems
              card={card}
              handlers={handlers}
              Item={ContextMenu.Item}
              Separator={ContextMenu.Separator}
            />
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

function OwnershipStepper({
  owned,
  onAdd,
  onRemove,
  name,
  compact = false,
  printings,
  onAddVariant,
  onRemoveVariant,
}: {
  owned: number
  onAdd: () => void
  onRemove: () => void
  name: string
  compact?: boolean
  printings?: Printing[]
  onAddVariant?: (variantNumber: string) => void
  onRemoveVariant?: (variantNumber: string) => void
  onRemoveVariant?: (variantNumber: string) => void
}) {
  if (owned > 0) {
    const plusButton = printings && printings.length > 1 ? (
      <Menu.Root>
        <Menu.Trigger
          aria-label={`Add one ${name}`}
          className={cn(
            "archive-focus archive-transition grid place-items-center text-archive-muted hover:bg-archive-panel hover:text-archive-ink",
            compact ? "size-6 rounded-r-md" : "size-8 rounded-r-lg",
          )}
        >
          <Plus className={compact ? "size-3" : "size-3.5"} aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="end" sideOffset={6} className={menuPositionerClass}>
            <Menu.Popup className={menuPopupClass}>
              <Menu.Group>
                <Menu.GroupLabel className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold text-archive-subtle">
                  Add printing
                </Menu.GroupLabel>
                {printings.map((p) => (
                  <Menu.Item
                    key={p.variantNumber}
                    className={menuItemClass}
                    onClick={() => onAddVariant?.(p.variantNumber)}
                  >
                    <span className="flex items-center gap-2">
                      {p.variantLabel}
                      {p.isFoil && !p.variantLabel.toLowerCase().includes("foil") && (
                        <span className="rounded bg-archive-accent/15 px-1 py-0.5 text-[10px] font-semibold text-archive-accent-text">
                          Foil
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-xs text-archive-subtle">{p.price}</span>
                  </Menu.Item>
                ))}
              </Menu.Group>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    ) : (
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Add one ${name}`}
        className={cn(
          "archive-focus archive-transition grid place-items-center text-archive-muted hover:bg-archive-panel hover:text-archive-ink",
          compact ? "size-6 rounded-r-md" : "size-8 rounded-r-lg",
        )}
      >
        <Plus className={compact ? "size-3" : "size-3.5"} aria-hidden="true" />
      </button>
    )

    const ownedPrintings = printings?.filter((p) => p.owned > 0) ?? []
    const minusButton = printings && printings.length > 1 && ownedPrintings.length > 1 ? (
      <Menu.Root>
        <Menu.Trigger
          aria-label={`Remove one ${name}`}
          className={cn(
            "archive-focus archive-transition grid place-items-center text-archive-muted hover:bg-archive-panel hover:text-archive-ink",
            compact ? "size-6 rounded-l-md" : "size-8 rounded-l-lg",
          )}
        >
          <Minus className={compact ? "size-3" : "size-3.5"} aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="start" sideOffset={6} className={menuPositionerClass}>
            <Menu.Popup className={menuPopupClass}>
              <Menu.Group>
                <Menu.GroupLabel className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold text-archive-subtle">
                  Remove printing
                </Menu.GroupLabel>
                {ownedPrintings.map((p) => (
                  <Menu.Item
                    key={p.variantNumber}
                    className={menuItemClass}
                    onClick={() => onRemoveVariant?.(p.variantNumber)}
                  >
                    <span className="flex items-center gap-2">
                      {p.variantLabel}
                      {p.isFoil && !p.variantLabel.toLowerCase().includes("foil") && (
                        <span className="rounded bg-archive-accent/15 px-1 py-0.5 text-[10px] font-semibold text-archive-accent-text">
                          Foil
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-xs text-archive-subtle">×{p.owned}</span>
                  </Menu.Item>
                ))}
              </Menu.Group>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    ) : (
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove one ${name}`}
        className={cn(
          "archive-focus archive-transition grid place-items-center text-archive-muted hover:bg-archive-panel hover:text-archive-ink",
          compact ? "size-6 rounded-l-md" : "size-8 rounded-l-lg",
        )}
      >
        <Minus className={compact ? "size-3" : "size-3.5"} aria-hidden="true" />
      </button>
    )

    return (
      <div
        className={cn(
          "flex items-center border border-archive-line bg-archive-surface",
          compact ? "rounded-md" : "rounded-lg",
        )}
      >
        {minusButton}
        <span
          aria-live="polite"
          className={cn(
            "text-center font-mono font-semibold tabular-nums text-archive-success",
            compact ? "min-w-5 text-[11px]" : "min-w-7 text-[13px]",
          )}
        >
          {owned}
        </span>
        {plusButton}
      </div>
    )
  }

  // If card has multiple printings, show a picker menu on Add
  if (printings && printings.length > 1) {
    return (
      <Menu.Root>
        <Menu.Trigger
          aria-label={`Add ${name} to collection`}
          className={cn(
            "archive-focus archive-transition inline-flex items-center gap-1 rounded-lg border border-archive-line font-semibold text-archive-ink hover:border-archive-accent hover:text-archive-accent-text",
            compact ? "h-6 px-1.5 text-[11px]" : "h-8 px-2.5 text-[13px]",
          )}
        >
          <Plus className={compact ? "size-3" : "size-3.5"} aria-hidden="true" />
          Add
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="end" sideOffset={6} className={menuPositionerClass}>
            <Menu.Popup className={menuPopupClass}>
              <Menu.Group>
                <Menu.GroupLabel className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold text-archive-subtle">
                  Select printing
                </Menu.GroupLabel>
                {printings.map((p) => (
                  <Menu.Item
                    key={p.variantNumber}
                    className={menuItemClass}
                    onClick={() => onAddVariant?.(p.variantNumber)}
                  >
                    <span className="flex items-center gap-2">
                      {p.variantLabel}
                      {p.isFoil && !p.variantLabel.toLowerCase().includes("foil") && (
                        <span className="rounded bg-archive-accent/15 px-1 py-0.5 text-[10px] font-semibold text-archive-accent-text">
                          Foil
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-xs text-archive-subtle">{p.price}</span>
                  </Menu.Item>
                ))}
              </Menu.Group>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    )
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={`Add ${name} to collection`}
      className={cn(
        "archive-focus archive-transition inline-flex items-center gap-1 rounded-lg border border-archive-line font-semibold text-archive-ink hover:border-archive-accent hover:text-archive-accent-text",
        compact ? "h-6 px-1.5 text-[11px]" : "h-8 px-2.5 text-[13px]",
      )}
    >
      <Plus className={compact ? "size-3" : "size-3.5"} aria-hidden="true" />
      Add
    </button>
  )
}

function CardRow({
  card,
  selected,
  handlers,
}: {
  card: CardRecord
  selected: boolean
  handlers: CardHandlers
}) {
  const owned = totalOwned(card)
  const primary = primaryPrinting(card)
  const summary = printingSummary(card)
  return (
    <CardContextMenu
      card={card}
      handlers={handlers}
      className={cn(
        "archive-transition relative grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5",
        selected ? "bg-archive-panel" : "hover:bg-archive-panel/50",
      )}
    >
      <button
        type="button"
        onClick={() => handlers.onSelect(card.id)}
        aria-pressed={selected}
        aria-label={`Select ${card.name} ${primary.variantNumber}`}
        className="archive-focus absolute inset-0 z-[1]"
      />

      <div
        className={cn(
          "archive-transition pointer-events-none relative aspect-[5/7] overflow-hidden rounded-md bg-archive-bg ring-1",
          selected ? "ring-2 ring-archive-accent" : "ring-white/10",
        )}
      >
        <Image src={primary.image} alt="" fill sizes="56px" className="object-cover object-top" />
      </div>

      <div className="pointer-events-none min-w-0">
        <div className="flex items-baseline gap-2.5">
          <span className="truncate text-[15px] font-semibold text-archive-ink">{card.name}</span>
          <span className="hidden shrink-0 font-mono text-xs text-archive-subtle sm:inline">
            {primary.variantNumber}
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1.5 truncate text-[13px] text-archive-muted">
          <Image
            src={`/rarities/${card.rarity}.webp`}
            alt=""
            width={14}
            height={14}
            className="size-3.5 shrink-0 object-contain"
          />
          {premiumRarities.includes(card.rarity) ? (
            <span className="font-semibold text-archive-ink">{card.rarity}</span>
          ) : (
            card.rarity
          )}
          <span aria-hidden="true">·</span> {card.color} <span aria-hidden="true">·</span>{" "}
          {card.set}
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium">
          {owned > 0 ? (
            <>
              <span aria-hidden="true" className="size-1.5 rounded-full bg-archive-success" />
              <span className="text-archive-success">Owned ×{owned}</span>
              {summary && <span className="text-archive-subtle">· {summary}</span>}
            </>
          ) : (
            <>
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full border border-archive-subtle"
              />
              <span className="text-archive-subtle">Wishlist</span>
              {summary && <span className="text-archive-subtle">· {summary}</span>}
            </>
          )}
        </p>
      </div>

      <div className="relative z-[2] flex items-center gap-3">
        <div className="flex flex-col items-end gap-0.5">
          {card.printings.map((p) => (
            <div key={p.variantNumber} className="flex items-center gap-1.5">
              {card.printings.length > 1 && (
                <span className="font-mono text-[10px] text-archive-subtle">
                  {p.isFoil ? "Foil" : "Std"}
                </span>
              )}
              <span className="font-mono text-sm font-semibold tabular-nums text-archive-ink">
                {p.price}
              </span>
              <TrendTag trend={p.marketTrend} />
            </div>
          ))}
        </div>
        <OwnershipStepper
          owned={owned}
          onAdd={() => handlers.onAdd(primary.variantNumber)}
          onRemove={() => handlers.onRemove(primary.variantNumber)}
          name={card.name}
          printings={card.printings}
          onAddVariant={(vn) => handlers.onAdd(vn)}
          onRemoveVariant={(vn) => handlers.onRemove(vn)}
        />
      </div>
    </CardContextMenu>
  )
}

function CardTile({
  card,
  selected,
  handlers,
}: {
  card: CardRecord
  selected: boolean
  handlers: CardHandlers
}) {
  const owned = totalOwned(card)
  const primary = primaryPrinting(card)
  return (
    <CardContextMenu
      card={card}
      handlers={handlers}
      className={cn(
        "archive-transition group relative flex flex-col rounded-xl border p-2",
        selected
          ? "border-archive-accent bg-archive-panel"
          : "border-archive-line bg-archive-surface hover:border-archive-muted",
      )}
    >
      <button
        type="button"
        onClick={() => handlers.onSelect(card.id)}
        aria-pressed={selected}
        aria-label={`Select ${card.name} ${primary.variantNumber}`}
        className="archive-focus absolute inset-0 z-[1] rounded-xl"
      />

      <div className="relative aspect-[5/7] overflow-hidden rounded-lg bg-archive-bg ring-1 ring-white/10">
        <Image
          src={primary.image}
          alt=""
          fill
          sizes="(min-width: 1280px) 160px, (min-width: 640px) 22vw, 44vw"
          className="object-cover object-top"
        />
        {owned > 0 ? (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-archive-bg/85 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-archive-success backdrop-blur-sm">
            ×{owned}
          </span>
        ) : (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-archive-bg/85 px-1.5 py-0.5 text-[11px] font-semibold text-archive-subtle backdrop-blur-sm">
            Wishlist
          </span>
        )}
        {premiumRarities.includes(card.rarity) && (
          <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-md bg-archive-bg/85 px-1.5 py-0.5 backdrop-blur-sm">
            <Image
              src={`/rarities/${card.rarity}.webp`}
              alt=""
              width={12}
              height={12}
              className="size-3 object-contain"
            />
            <span className="text-[11px] font-semibold text-archive-ink">{card.rarity}</span>
          </span>
        )}
      </div>

      <div className="mt-2 min-w-0 px-0.5">
        <p className="truncate text-[13px] font-semibold text-archive-ink">{card.name}</p>
        <p className="font-mono text-[11px] text-archive-subtle">{primary.variantNumber}</p>
      </div>

      <div className="relative z-[2] mt-2 flex items-center justify-between gap-1.5 px-0.5">
        <span className="font-mono text-[13px] font-semibold tabular-nums text-archive-ink">
          {priceRange(card)}
        </span>
        <OwnershipStepper
          owned={owned}
          onAdd={() => handlers.onAdd(primary.variantNumber)}
          onRemove={() => handlers.onRemove(primary.variantNumber)}
          name={card.name}
          compact
          printings={card.printings}
          onAddVariant={(vn) => handlers.onAdd(vn)}
          onRemoveVariant={(vn) => handlers.onRemove(vn)}
        />
      </div>
    </CardContextMenu>
  )
}

function CollectionView({
  onSelect,
  liveCards,
  apiData,
}: {
  onSelect: (id: string) => void
  liveCards: CardRecord[]
  apiData: ReturnType<typeof useCollectionData>
}) {
  const totalSetOwned = setCatalog.reduce((sum, s) => sum + s.owned, 0)
  const totalFoilOwned = setCatalog.reduce((sum, s) => sum + s.foilOwned, 0)

  const mergedSets = useMemo(() => {
    if (!apiData.data) return setCatalog
    const apiSetMap = new Map(apiData.data.sets.map((s) => [s.code, s]))
    return setCatalog.map((set) => {
      const apiSet = apiSetMap.get(set.code)
      if (apiSet) {
        return { ...set, name: apiSet.name, total: Math.max(set.total, apiSet.count) }
      }
      return set
    })
  }, [apiData.data])

  const mergedTypeStats = useMemo<TypeStat[]>(() => {
    if (!apiData.data) return typeStats
    const apiTypeMap = new Map(apiData.data.types.map((t) => [t.name, t]))
    return typeStats.map((stat) => {
      const apiStat = apiTypeMap.get(stat.name)
      if (apiStat) {
        return { ...stat, total: Math.max(stat.total, apiStat.count) }
      }
      return stat
    })
  }, [apiData.data])

  const mergedRarityStats = useMemo<RarityStat[]>(() => {
    if (!apiData.data) return rarityStats
    const apiRarityMap = new Map(apiData.data.rarities.map((r) => [r.name, r]))
    return rarityStats.map((stat) => {
      const apiStat = apiRarityMap.get(stat.name)
      if (apiStat) {
        return { ...stat, total: Math.max(stat.total, apiStat.count) }
      }
      return stat
    })
  }, [apiData.data])

  const wishlistCards = liveCards.filter((c) => totalOwned(c) === 0)
  const collectionMovers = liveCards
    .filter((c) => totalOwned(c) > 0)
    .map((c) => ({ card: c, trend: bestTrend(c) }))
    .filter((item) => item.trend.startsWith("+") || item.trend.startsWith("-"))
    .sort(
      (a, b) =>
        Math.abs(parseFloat(b.trend)) - Math.abs(parseFloat(a.trend)),
    )
    .slice(0, 5)

  return (
    <section className="flex-1 pt-6">
      <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Collection Dashboard</h1>
          <p className="mt-1 font-mono text-[13px] text-archive-muted">
            {totalSetOwned} unique cards · {totalFoilOwned} foils · {collectionStats.estimatedValue} estimated value
          </p>
        </div>
      </div>

      {/* Sets */}
      <div className="mb-8">
        <h2 className="mb-4 text-sm font-semibold text-archive-muted">Sets</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mergedSets.map((set) => (
            <SetCard key={set.code} set={set} />
          ))}
        </div>
      </div>

      {/* Dashboard stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStat
          label="Cards Collected"
          value={collectionStats.collected.toLocaleString()}
          sub={`of ${collectionStats.available.toLocaleString()} available`}
        />
        <DashboardStat
          label="Total Cards"
          value={collectionStats.totalCards.toLocaleString()}
          sub="including duplicates"
        />
        <DashboardStat
          label="Completion"
          value={`${collectionStats.completion}%`}
          sub="overall progress"
          progress={collectionStats.completion / 100}
        />
        <DashboardStat
          label="Estimated Value"
          value={collectionStats.estimatedValue}
          sub="based on Cardmarket"
        />
      </div>

      {/* Cards by Type and Rarity */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <BreakdownSection
          title="Cards by Type"
          stats={mergedTypeStats}
          iconPath={(name) => `/types/${name.toLowerCase().replace(/s$/, "")}.webp`}
        />
        <BreakdownSection
          title="Cards by Rarity"
          stats={mergedRarityStats}
          iconPath={(name) => `/rarities/${name}.webp`}
        />
      </div>

      {/* Wishlist and Week movers */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="wishlist-title"
          className="rounded-xl border border-archive-line bg-archive-surface"
        >
          <div className="flex items-baseline justify-between gap-3 px-4 pt-4">
            <h2 id="wishlist-title" className="text-sm font-semibold">
              Wishlist
            </h2>
            <span className="font-mono text-xs text-archive-subtle">
              {wishlistCards.length} cards
            </span>
          </div>
          <ul className="divide-y divide-archive-soft-line px-4 pb-2 pt-2">
            {wishlistCards.map((card) => (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() => onSelect(card.id)}
                  className="archive-focus archive-transition flex w-full items-center justify-between gap-3 rounded-lg py-2.5 text-left hover:text-archive-ink"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-archive-ink">
                      {card.name}
                    </span>
                    <span className="font-mono text-[11px] text-archive-subtle">
                      {primaryPrinting(card).variantNumber}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-[13px] font-semibold tabular-nums text-archive-ink">
                      {priceRange(card)}
                    </span>
                    <TrendTag trend={bestTrend(card)} />
                  </span>
                </button>
              </li>
            ))}
            {wishlistCards.length === 0 && (
              <li className="py-6 text-center text-sm text-archive-muted">
                No wishlist cards. Everything is in your collection.
              </li>
            )}
          </ul>
        </section>

        <section
          aria-labelledby="movers-title"
          className="rounded-xl border border-archive-line bg-archive-surface"
        >
          <div className="flex items-baseline justify-between gap-3 px-4 pt-4">
            <h2 id="movers-title" className="text-sm font-semibold">
              Week movers
            </h2>
            <span className="font-mono text-xs text-archive-subtle">7d</span>
          </div>
          <ul className="divide-y divide-archive-soft-line px-4 pb-2 pt-2">
            {collectionMovers.map(({ card, trend }) => (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() => onSelect(card.id)}
                  className="archive-focus archive-transition flex w-full items-center justify-between gap-3 rounded-lg py-2.5 text-left hover:text-archive-ink"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-archive-ink">
                      {card.name}
                    </span>
                    <span className="font-mono text-[11px] text-archive-subtle">
                      {primaryPrinting(card).variantNumber}
                    </span>
                  </span>
                  <TrendTag trend={trend} />
                </button>
              </li>
            ))}
            {collectionMovers.length === 0 && (
              <li className="py-6 text-center text-sm text-archive-muted">
                No market movement in your collection this week.
              </li>
            )}
          </ul>
        </section>
      </div>
    </section>
  )
}

function DashboardStat({
  label,
  value,
  sub,
  progress,
}: {
  label: string
  value: string
  sub: string
  progress?: number
}) {
  return (
    <div className="rounded-xl border border-archive-line bg-archive-surface p-4">
      <p className="text-xs font-medium text-archive-muted">{label}</p>
      <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-archive-ink">{value}</p>
      <p className="mt-1 text-xs text-archive-subtle">{sub}</p>
      {progress !== undefined && (
        <div
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-archive-panel"
        >
          <div
            className="h-full rounded-full bg-archive-accent"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}

function BreakdownSection({
  title,
  stats,
  iconPath,
}: {
  title: string
  stats: { name: string; owned: number; total: number }[]
  iconPath?: (name: string) => string | undefined
}) {
  return (
    <section
      aria-labelledby={`breakdown-${title}`}
      className="rounded-xl border border-archive-line bg-archive-surface p-4"
    >
      <h2 id={`breakdown-${title}`} className="mb-3 text-sm font-semibold">
        {title}
      </h2>
      <div className="space-y-3">
        {stats.map((stat) => {
          const pct = stat.total > 0 ? (stat.owned / stat.total) * 100 : 0
          const icon = iconPath?.(stat.name)
          return (
            <div key={stat.name}>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-[13px] font-medium text-archive-ink">
                  {icon && (
                    <Image
                      src={icon}
                      alt=""
                      width={20}
                      height={20}
                      className="size-5 shrink-0 object-contain"
                    />
                  )}
                  {stat.name}
                </span>
                <span className="font-mono text-[13px] font-semibold tabular-nums text-archive-ink">
                  {stat.owned} / {stat.total}
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={Math.round(pct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={stat.name}
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-archive-panel"
              >
                <div
                  className="h-full rounded-full bg-archive-accent"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function SetCard({ set }: { set: SetStat }) {
  const completion = set.total > 0 ? (set.owned / set.total) * 100 : 0
  const foilCompletion = set.total > 0 ? (set.foilOwned / set.total) * 100 : 0

  return (
    <div className="overflow-hidden rounded-xl border border-archive-line bg-archive-surface">
      {set.art ? (
        <div className="relative aspect-[16/5] overflow-hidden bg-archive-panel">
          <Image
            src={set.art}
            alt={`${set.name} key art`}
            fill
            sizes="(min-width: 1280px) 280px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-archive-surface via-archive-surface/40 to-transparent" />
          {set.logo ? (
            <div className="absolute bottom-2 left-3 flex items-center gap-2">
              <Image
                src={set.logo}
                alt={`${set.name} logo`}
                height={20}
                width={80}
                className="h-5 max-w-[100px] object-contain"
              />
              <span className="font-mono text-xs font-semibold text-archive-ink">
                {set.code}
              </span>
            </div>
          ) : (
            <span className="absolute bottom-2 left-3 font-mono text-xs font-semibold text-archive-ink">
              {set.code}
            </span>
          )}
        </div>
      ) : set.logo ? (
        <div className="flex items-center justify-between bg-archive-panel px-4 py-3">
          <div className="flex items-center gap-2">
            <Image
              src={set.logo}
              alt={`${set.name} logo`}
              height={20}
              width={80}
              className="h-5 max-w-[100px] object-contain"
            />
            <span className="font-mono text-xs font-semibold text-archive-ink">{set.code}</span>
          </div>
          <span className="font-mono text-xs text-archive-subtle">{set.total} cards</span>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-archive-panel px-4 py-3">
          <span className="font-mono text-xs font-semibold text-archive-ink">{set.code}</span>
          <span className="font-mono text-xs text-archive-subtle">{set.total} cards</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold text-archive-ink">{set.name}</h3>
          <span className="font-mono text-xs text-archive-subtle">{set.released}</span>
        </div>
        {set.art && (
          <p className="mt-1 font-mono text-xs text-archive-subtle">{set.total} cards</p>
        )}
        <div className="mt-3 space-y-3">
          <ProgressRow
            label="Main set"
            value={`${set.owned}/${set.total}`}
            progress={completion / 100}
          />
          <ProgressRow
            label="Foils"
            value={`${set.foilOwned}/${set.total}`}
            progress={foilCompletion / 100}
          />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-archive-soft-line pt-3">
          <span className="text-[13px] text-archive-muted">Completion</span>
          <span className="font-mono text-[13px] font-semibold tabular-nums text-archive-ink">
            {completion.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  )
}

function ProgressRow({
  label,
  value,
  progress,
}: {
  label: string
  value: string
  progress?: number
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-[13px] font-medium text-archive-muted">{label}</span>
        <span className="font-mono text-[13px] font-semibold tabular-nums text-archive-ink">
          {value}
        </span>
      </div>
      {progress !== undefined && (
        <div
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
          className="mt-2 h-1 overflow-hidden rounded-full bg-archive-panel"
        >
          <div
            className="h-full rounded-full bg-archive-accent"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}

function CardDetail({ card, handlers }: { card: CardRecord; handlers: CardHandlers }) {
  const primary = primaryPrinting(card)
  const owned = totalOwned(card)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => { setFullscreen(false) }, [card.id])
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [fullscreen])

  return (
    <>
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <section className="flex flex-col rounded-xl border border-archive-line bg-archive-surface">
        <button
          type="button"
          aria-label={`View ${card.name} full size`}
          onClick={() => setFullscreen(true)}
          className="archive-focus archive-transition relative grid min-h-[188px] w-full shrink-0 cursor-pointer place-items-center rounded-t-xl p-3.5 hover:brightness-110"
          style={{
            background:
              "radial-gradient(110% 85% at 50% 12%, oklch(0.225 0 0), oklch(0.152 0 0) 78%)",
          }}
        >
          <div key={card.id} className="archive-detail-enter relative aspect-[5/7] h-full max-h-[165px]">
            <Image
              src={primary.image}
              alt={card.alt}
              fill
              priority
              sizes="(min-width: 1024px) 160px, 45vw"
              className="rounded-lg object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)]"
            />
          </div>
          <span className="absolute right-4 top-3 font-mono text-xs text-archive-subtle">
            {primary.variantNumber}
          </span>
        </button>

        <div key={`${card.id}-body`} className="archive-detail-enter p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold leading-tight tracking-tight">{card.name}</h2>
              <p className="mt-0.5 font-mono text-[13px] text-archive-muted">
                {card.set} · {card.rarity}
              </p>
            </div>

            <Menu.Root>
              <Menu.Trigger
                aria-label="More card actions"
                className="archive-focus archive-transition grid size-8 shrink-0 place-items-center rounded-lg text-archive-muted hover:bg-archive-panel hover:text-archive-ink"
              >
                <MoreHorizontal className="size-[18px]" aria-hidden="true" />
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner align="end" sideOffset={6} className={menuPositionerClass}>
                  <Menu.Popup className={menuPopupClass}>
                    <CardMenuItems
                      card={card}
                      handlers={handlers}
                      Item={Menu.Item}
                      Separator={Menu.Separator}
                      showViewDetails={false}
                    />
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </div>

          <p className="mt-2 line-clamp-2 max-w-[54ch] text-sm leading-6 text-archive-muted">
            {card.note}
          </p>

          <div className="mt-3 grid grid-cols-3 divide-x divide-archive-soft-line rounded-xl bg-archive-panel">
            <Stat label="Cost">
              <EnergyPip value={card.energy} className="size-7 text-[13px]" />
            </Stat>
            <Stat label="Might">
              <span className="inline-flex items-center gap-1.5 font-mono">
                <MightIcon className="size-4 text-archive-muted" />
                {card.might}
              </span>
            </Stat>
            <Stat label="Owned">
              <span className="font-mono text-base font-semibold tabular-nums text-archive-ink">
                {owned}
              </span>
            </Stat>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5 rounded-xl border border-archive-soft-line p-3">
            <MetaPill label="Type" value={card.type} icon={<UnitIcon className="size-4" />} />
            <MetaPill label="Domain" value={card.color} icon={<FuryIcon className="size-4" />} />
            <MetaPill
              label="Rarity"
              value={card.rarity}
              icon={
                <Image
                  src={`/rarities/${card.rarity}.webp`}
                  alt=""
                  width={16}
                  height={16}
                  className="size-4 object-contain"
                />
              }
            />
            <MetaPill label="Tags" value={card.tags.join(" · ")} />
          </div>

          <section className="mt-3 rounded-xl bg-archive-panel p-3">
            <h3 className="mb-2 text-sm font-semibold">Rules text</h3>
            <p className="text-sm leading-6 text-archive-ink/90">{card.rulesText}</p>
          </section>

          {card.printings.length > 1 ? (
            <section className="mt-3">
              <h3 className="mb-2 text-sm font-semibold">Printings</h3>
              <div className="space-y-2">
                {card.printings.map((printing) => (
                  <div
                    key={printing.variantNumber}
                    className="flex items-center justify-between gap-3 rounded-xl border border-archive-soft-line bg-archive-surface p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-archive-ink">
                          {printing.variantLabel}
                        </span>
                        {printing.isFoil && !printing.variantLabel.toLowerCase().includes("foil") && (
                          <span className="rounded bg-archive-accent/15 px-1.5 py-0.5 text-[11px] font-semibold text-archive-accent-text">
                            Foil
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-archive-subtle">
                        {printing.variantNumber}
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-mono text-[13px] font-semibold tabular-nums text-archive-ink">
                          {printing.price}
                        </span>
                        <TrendTag trend={printing.marketTrend} />
                      </div>
                    </div>
                    <OwnershipStepper
                      owned={printing.owned}
                      onAdd={() => handlers.onAdd(printing.variantNumber)}
                      onRemove={() => handlers.onRemove(printing.variantNumber)}
                      name={`${card.name} ${printing.variantLabel}`}
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <button className="archive-focus archive-transition mt-3 h-10 w-full rounded-lg bg-archive-accent px-4 text-sm font-semibold text-archive-accent-ink hover:brightness-110 active:translate-y-px">
            Watch this card
          </button>
        </div>
      </section>
    </aside>

    {fullscreen && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${card.name} full size`}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
        onClick={() => setFullscreen(false)}
      >
        <div
          className="relative"
          style={{ aspectRatio: "5/7", height: "min(88vh, 560px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={primary.image}
            alt={card.alt}
            fill
            sizes="40vw"
            className="rounded-xl object-contain drop-shadow-[0_32px_64px_rgba(0,0,0,0.9)]"
          />
        </div>
      </div>
    )}
    </>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[60px] flex-col items-center justify-center gap-1 px-3 text-center">
      <span className="text-xs font-medium text-archive-muted">{label}</span>
      <div className="text-base font-semibold tabular-nums text-archive-ink">{children}</div>
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
  icon?: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-xs font-medium text-archive-muted">
        {icon}
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-semibold text-archive-ink">{value}</p>
    </div>
  )
}
