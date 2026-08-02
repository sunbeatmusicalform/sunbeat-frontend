export function AtabaqueMark({ size = 40 }: { size?: number }) {
  return (
    <span
      role="img"
      aria-label="Atabaque"
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        backgroundImage: "url('/brand/atabaque-badge.png')",
        backgroundPosition: '50% 47%',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '205%',
      }}
    />
  )
}
