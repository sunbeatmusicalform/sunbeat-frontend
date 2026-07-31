export function AtabaqueMark({ size = 40 }: { size?: number }) {
  // Simplified brand mark inspired by the Atabaque symbol: drum body + lightning bolts
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="Atabaque">
      <path d="M20 14c-3 3-5 7-5 11 0 5 2 9 5 12l-2 14h6l2-10h4l2 10h6l3-10h4l2 10h6l-2-14c3-3 5-7 5-12 0-4-2-8-5-11" fill="#512314" />
      <ellipse cx="35" cy="15" rx="14" ry="6" fill="#512314" />
      <ellipse cx="35" cy="15" rx="9" ry="3.5" fill="#ebdbba" />
      <path d="M12 2l5 2-3 4 5 1-8 8 2-6-4-1 3-4-4-2 4-2z" fill="#ffb53e" />
      <path d="M48 0l5 2-3 4 5 1-8 8 2-6-4-1 3-4-4-2 4-2z" fill="#ffb53e" />
    </svg>
  )
}
