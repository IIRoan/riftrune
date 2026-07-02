import Image from "next/image"

/**
 * The official card image fills the entire left column of the modal.
 * No wrapper border or frame — the card already carries its own border.
 * A right-side shadow bleeds into the panel divider for depth.
 */
export function CardPreview() {
  return (
    <div className="relative h-full min-h-[520px] w-full">
      <Image
        src="/cards/blazing-scorcher.png"
        alt="Blazing Scorcher — OGN 001/298, a fire-breathing dragon descending on a burning battlefield"
        fill
        priority
        sizes="300px"
        className="object-contain object-center"
      />
      {/* Right edge fade to blend into the panel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-8"
        style={{
          background: "linear-gradient(to right, transparent, var(--rift-bg))",
        }}
      />
    </div>
  )
}
