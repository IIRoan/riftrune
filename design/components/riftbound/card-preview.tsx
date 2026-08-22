import Image from "next/image"

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
