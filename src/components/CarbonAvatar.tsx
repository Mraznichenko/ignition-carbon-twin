type CarbonAvatarProps = {
  score: "A" | "B" | "C" | "D" | "E";
  recentActions?: Array<"train" | "seasonal_food" | "second_hand" | "repair" | "high_emission">;
  size?: "sm" | "md" | "lg";
};

const sizeClass = {
  sm: "h-20 w-20",
  md: "h-28 w-28",
  lg: "h-36 w-36",
};

const crownByScore = {
  A: {
    foliage: ["#22c55e", "#16a34a", "#84cc16"],
    opacity: 1,
    leafScale: 1,
    flowers: true,
    bare: false,
    withered: false,
  },
  B: {
    foliage: ["#22c55e", "#16a34a", "#65a30d"],
    opacity: 0.96,
    leafScale: 0.95,
    flowers: false,
    bare: false,
    withered: false,
  },
  C: {
    foliage: ["#65a30d", "#84cc16", "#a3e635"],
    opacity: 0.82,
    leafScale: 0.68,
    flowers: false,
    bare: false,
    withered: false,
  },
  D: {
    foliage: ["#a3a36b", "#8b7d4f", "#b5a56a"],
    opacity: 0.25,
    leafScale: 0.28,
    flowers: false,
    bare: true,
    withered: false,
  },
  E: {
    foliage: ["#9a7a45", "#7c5f37", "#b68a46"],
    opacity: 0.28,
    leafScale: 0.22,
    flowers: false,
    bare: false,
    withered: true,
  },
};

export default function CarbonAvatar({
  score,
  recentActions: _recentActions = [],
  size = "md",
}: CarbonAvatarProps) {
  const state = crownByScore[score];

  return (
    <div
      className={`relative ${sizeClass[size]} shrink-0 transition-transform duration-500 hover:scale-[1.03]`}
      aria-label={`Carbon avatar score ${score}`}
      role="img"
    >
      <svg viewBox="0 0 160 160" className="h-full w-full overflow-visible">
        <defs>
          <radialGradient id={`avatarGlow-${score}`} cx="50%" cy="40%" r="62%">
            <stop offset="0%" stopColor="#ecfccb" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#dcfce7" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`trunk-${score}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#9a6b3a" />
            <stop offset="100%" stopColor="#6f4828" />
          </linearGradient>
        </defs>

        <circle cx="80" cy="82" r="70" fill={`url(#avatarGlow-${score})`} />
        <ellipse cx="80" cy="142" rx="46" ry="9" fill="#86efac" opacity="0.22" />

        <g className="transition-all duration-700 ease-out">
          <path
            d="M78 128 C77 106 78 88 80 66"
            fill="none"
            stroke={`url(#trunk-${score})`}
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M80 82 C66 70 57 61 48 48"
            fill="none"
            stroke={`url(#trunk-${score})`}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M81 78 C96 68 106 56 116 43"
            fill="none"
            stroke={`url(#trunk-${score})`}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M78 98 C62 92 51 85 39 75"
            fill="none"
            stroke={`url(#trunk-${score})`}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M82 96 C99 91 113 84 126 73"
            fill="none"
            stroke={`url(#trunk-${score})`}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>

        <g
          className="origin-center transition-all duration-700 ease-out"
          style={{ transform: `scale(${state.leafScale})`, opacity: state.opacity }}
        >
          {!state.bare && (
            <>
              <Leaf cx={51} cy={46} rx={28} ry={22} fill={state.foliage[0]} />
              <Leaf cx={80} cy={34} rx={34} ry={27} fill={state.foliage[1]} />
              <Leaf cx={111} cy={47} rx={30} ry={23} fill={state.foliage[0]} />
              <Leaf cx={62} cy={73} rx={34} ry={26} fill={state.foliage[2]} />
              <Leaf cx={99} cy={73} rx={36} ry={27} fill={state.foliage[1]} />
              <Leaf cx={80} cy={59} rx={39} ry={29} fill={state.foliage[0]} />
            </>
          )}
        </g>

        {state.bare && (
          <g stroke="#8b7d4f" strokeLinecap="round" opacity="0.75">
            <path d="M49 48 L39 39" strokeWidth="3" />
            <path d="M113 45 L125 35" strokeWidth="3" />
            <path d="M39 75 L27 70" strokeWidth="2.5" />
            <path d="M126 73 L138 66" strokeWidth="2.5" />
          </g>
        )}

        {state.withered && (
          <g className="transition-opacity duration-700" opacity="0.75">
            <path d="M102 32 C116 36 119 51 106 59 C92 53 91 39 102 32Z" fill="#b68a46" />
            <path d="M47 74 C59 78 62 91 52 98 C40 93 38 81 47 74Z" fill="#9a7a45" />
          </g>
        )}

        {state.flowers && (
          <g className="animate-pulse">
            <Flower x={49} y={36} />
            <Flower x={82} y={24} />
            <Flower x={113} y={45} />
            <Flower x={70} y={72} />
            <Flower x={101} y={70} />
          </g>
        )}
      </svg>
    </div>
  );
}

function Leaf({
  cx,
  cy,
  rx,
  ry,
  fill,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  fill: string;
}) {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={fill}
      className="transition-all duration-700 ease-out"
    />
  );
}

function Flower({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx="0" cy="-4" r="4" fill="#f9a8d4" />
      <circle cx="4" cy="0" r="4" fill="#fbcfe8" />
      <circle cx="0" cy="4" r="4" fill="#f9a8d4" />
      <circle cx="-4" cy="0" r="4" fill="#fbcfe8" />
      <circle cx="0" cy="0" r="2.4" fill="#fde68a" />
    </g>
  );
}

// Example usage:
// <CarbonAvatar score="A" recentActions={["train", "seasonal_food"]} size="lg" />
// <CarbonAvatar score="D" recentActions={["repair", "high_emission"]} />
