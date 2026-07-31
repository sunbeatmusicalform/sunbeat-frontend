// Cena de praia ao pôr-do-sol em SVG animado — placeholder elegante
// até que a imagem gerada ou o vídeo 3D esteja disponível.
export function BeachScene() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 810" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#02141d" />
          <stop offset="45%" stopColor="#6b3d0f" />
          <stop offset="72%" stopColor="#c47f22" />
          <stop offset="100%" stopColor="#e8a83a" />
        </linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b06f1e" />
          <stop offset="30%" stopColor="#0a2a3a" />
          <stop offset="100%" stopColor="#000e14" />
        </linearGradient>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="55%" stopColor="#ffdf4c" />
          <stop offset="100%" stopColor="#ffb53e" />
        </radialGradient>
        <linearGradient id="path" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffdf4c" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffb53e" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* céu */}
      <rect width="1440" height="560" fill="url(#sky)" />

      {/* sol */}
      <circle cx="720" cy="520" r="150" fill="#ffdf4c" opacity="0.18">
        <animate attributeName="r" values="150;165;150" dur="8s" repeatCount="indefinite" />
      </circle>
      <circle cx="720" cy="520" r="105" fill="url(#sun)" />

      {/* pássaros */}
      <g stroke="#02141d" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7">
        <path d="M420 180 q12 -12 24 0 q12 -12 24 0">
          <animateTransform attributeName="transform" type="translate" values="0 0; 60 -14; 0 0" dur="14s" repeatCount="indefinite" />
        </path>
        <path d="M520 140 q9 -9 18 0 q9 -9 18 0">
          <animateTransform attributeName="transform" type="translate" values="0 0; 46 -10; 0 0" dur="17s" repeatCount="indefinite" />
        </path>
      </g>

      {/* mar */}
      <rect y="560" width="1440" height="250" fill="url(#sea)" />

      {/* caminho de luz do sol na água */}
      <polygon points="660,560 780,560 860,810 580,810" fill="url(#path)" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.65;0.5" dur="6s" repeatCount="indefinite" />
      </polygon>

      {/* ondas */}
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M0 ${585 + i * 38} q 90 ${i % 2 ? 7 : -7} 180 0 t 180 0 t 180 0 t 180 0 t 180 0 t 180 0 t 180 0 t 180 0`}
          stroke="#ffdf4c" strokeOpacity={0.28 - i * 0.07} strokeWidth="2.5" fill="none"
        >
          <animateTransform attributeName="transform" type="translate" values="0 0; -90 0; 0 0" dur={`${9 + i * 3}s`} repeatCount="indefinite" />
        </path>
      ))}

      {/* palmeiras (silhuetas nos cantos) */}
      <g fill="#000a0f">
        <path d="M60 -10 q 30 120 -8 210 l 22 4 q 48 -96 14 -214 z" />
        <path d="M40 40 q 130 -60 210 -18 q -100 10 -180 48 z" />
        <path d="M30 90 q 100 -10 160 40 q -84 -18 -168 8 z" />
        <path d="M1380 -10 q -30 120 8 210 l -22 4 q -48 -96 -14 -214 z" />
        <path d="M1400 40 q -130 -60 -210 -18 q 100 10 180 48 z" />
        <path d="M1410 90 q -100 -10 -160 40 q 84 -18 168 8 z" />
      </g>
    </svg>
  )
}
