/**
 * Hero artwork for the landing page — a glossy kanban board "illustration"
 * drawn in the app's own palette so it blends with the glass + scenery look.
 */
export function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 520 400"
      role="img"
      aria-label="Illustration of a task board with to-do, doing and done columns"
      className="w-full"
    >
      <defs>
        <linearGradient id="hero-violet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="hero-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="hero-teal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient id="hero-sheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.03" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Soft blob + leaves behind the board */}
      <path
        d="M260 28c86 0 196 34 214 118 17 78-46 172-128 204-86 33-206 20-262-52C29 226 44 130 108 76c48-40 96-48 152-48Z"
        fill="#8b5cf6"
        opacity="0.14"
      />
      <path
        d="M84 330c-26-40-10-86 18-104 6 34-2 76 10 104h-28Z"
        fill="url(#hero-teal)"
        opacity="0.5"
      />
      <path
        d="M448 330c26-40 10-86-18-104-6 34 2 76-10 104h28Z"
        fill="url(#hero-teal)"
        opacity="0.35"
      />

      {/* Browser window */}
      <g>
        <rect
          x="70"
          y="56"
          width="380"
          height="274"
          rx="18"
          fill="#17171c"
          stroke="#ffffff"
          strokeOpacity="0.12"
        />
        <rect x="70" y="56" width="380" height="274" rx="18" fill="url(#hero-sheen)" />
        {/* Top bar */}
        <line
          x1="70"
          y1="92"
          x2="450"
          y2="92"
          stroke="#ffffff"
          strokeOpacity="0.08"
        />
        <circle cx="94" cy="74" r="5" fill="#f87171" />
        <circle cx="112" cy="74" r="5" fill="#fbbf24" />
        <circle cx="130" cy="74" r="5" fill="#34d399" />
        <rect
          x="330"
          y="66"
          width="104"
          height="16"
          rx="8"
          fill="#ffffff"
          opacity="0.06"
        />
      </g>

      {/* Columns */}
      {/* To-do */}
      <g>
        <rect x="88" y="106" width="108" height="208" rx="12" fill="#ffffff" opacity="0.04" />
        <rect x="98" y="116" width="88" height="18" rx="9" fill="url(#hero-violet)" />
        <rect x="98" y="144" width="88" height="40" rx="8" fill="#ffffff" opacity="0.07" />
        <rect x="106" y="154" width="56" height="6" rx="3" fill="#ffffff" opacity="0.35" />
        <rect x="106" y="167" width="40" height="5" rx="2.5" fill="#8b5cf6" opacity="0.8" />
        <rect x="98" y="192" width="88" height="40" rx="8" fill="#ffffff" opacity="0.07" />
        <rect x="106" y="202" width="62" height="6" rx="3" fill="#ffffff" opacity="0.35" />
        <rect x="106" y="215" width="32" height="5" rx="2.5" fill="#ec4899" opacity="0.8" />
        <rect x="98" y="240" width="88" height="40" rx="8" fill="#ffffff" opacity="0.05" />
        <rect x="106" y="250" width="48" height="6" rx="3" fill="#ffffff" opacity="0.25" />
      </g>

      {/* Doing */}
      <g>
        <rect x="206" y="106" width="108" height="208" rx="12" fill="#ffffff" opacity="0.04" />
        <rect x="216" y="116" width="88" height="18" rx="9" fill="url(#hero-blue)" />
        <rect x="216" y="144" width="88" height="52" rx="8" fill="#ffffff" opacity="0.09" />
        <rect x="224" y="154" width="60" height="6" rx="3" fill="#ffffff" opacity="0.4" />
        <rect x="224" y="167" width="72" height="5" rx="2.5" fill="#ffffff" opacity="0.2" />
        <rect x="224" y="180" width="44" height="8" rx="4" fill="#3b82f6" opacity="0.7" />
        <rect x="216" y="204" width="88" height="40" rx="8" fill="#ffffff" opacity="0.07" />
        <rect x="224" y="214" width="52" height="6" rx="3" fill="#ffffff" opacity="0.35" />
        <rect x="224" y="227" width="36" height="5" rx="2.5" fill="#f59e0b" opacity="0.8" />
      </g>

      {/* Done */}
      <g>
        <rect x="324" y="106" width="108" height="208" rx="12" fill="#ffffff" opacity="0.04" />
        <rect x="334" y="116" width="88" height="18" rx="9" fill="url(#hero-teal)" />
        <g opacity="0.9">
          <rect x="334" y="144" width="88" height="36" rx="8" fill="#ffffff" opacity="0.07" />
          <circle cx="348" cy="162" r="7" fill="url(#hero-teal)" />
          <path
            d="m345 162 2.5 2.5 5-5"
            stroke="#0b0b0f"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <rect x="362" y="153" width="46" height="6" rx="3" fill="#ffffff" opacity="0.35" />
          <rect x="362" y="165" width="30" height="5" rx="2.5" fill="#ffffff" opacity="0.18" />
        </g>
        <g opacity="0.7">
          <rect x="334" y="188" width="88" height="36" rx="8" fill="#ffffff" opacity="0.06" />
          <circle cx="348" cy="206" r="7" fill="url(#hero-teal)" />
          <path
            d="m345 206 2.5 2.5 5-5"
            stroke="#0b0b0f"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <rect x="362" y="197" width="40" height="6" rx="3" fill="#ffffff" opacity="0.3" />
        </g>
      </g>

      {/* Floating card being moved to Done */}
      <g transform="rotate(-6 388 96)">
        <rect
          x="352"
          y="78"
          width="96"
          height="42"
          rx="10"
          fill="#221d33"
          stroke="#a78bfa"
          strokeOpacity="0.5"
        />
        <rect x="362" y="88" width="56" height="6" rx="3" fill="#ffffff" opacity="0.5" />
        <rect x="362" y="101" width="40" height="5" rx="2.5" fill="#a78bfa" />
        <circle cx="436" cy="88" r="6" fill="url(#hero-violet)" />
      </g>

      {/* Progress ring, floating left */}
      <g>
        <circle cx="72" cy="150" r="26" fill="#17171c" stroke="#ffffff" strokeOpacity="0.1" />
        <circle
          cx="72"
          cy="150"
          r="18"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.1"
          strokeWidth="5"
        />
        <circle
          cx="72"
          cy="150"
          r="18"
          fill="none"
          stroke="url(#hero-violet)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="85 113"
          transform="rotate(-90 72 150)"
        />
        <text
          x="72"
          y="154"
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="#ffffff"
          opacity="0.85"
        >
          75%
        </text>
      </g>

      {/* Sparkles */}
      <path d="m472 140 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" fill="#a78bfa" opacity="0.7" />
      <path d="m56 262 2.4 6.4 6.4 2.4-6.4 2.4-2.4 6.4-2.4-6.4-6.4-2.4 6.4-2.4 2.4-6.4Z" fill="#60a5fa" opacity="0.6" />
      <circle cx="480" cy="240" r="4" fill="#2dd4bf" opacity="0.6" />
    </svg>
  );
}
