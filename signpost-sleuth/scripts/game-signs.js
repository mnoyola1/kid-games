// ==================== SIGNPOST SIGNS ====================
// Road-sign SVGs for the six signposts. Icons match Mrs. Burda's slides:
// puzzle (Contrasts), light bulb (Aha), question mark (Tough Questions), lips (Words of the Wiser),
// plus (Again & Again), camera (Memory Moment). Each sign also has its own shape.

const SIGN_SHAPES = {
  cc: { shape: 'diamond', fill: '#fbbf24', edge: '#1f2937', ink: '#1f2937' },
  aha: { shape: 'circle', fill: '#fde047', edge: '#a16207', ink: '#78350f' },
  tq: { shape: 'triangle', fill: '#ffffff', edge: '#dc2626', ink: '#dc2626' },
  ww: { shape: 'square', fill: '#7c3aed', edge: '#ffffff', ink: '#ffffff' },
  aa: { shape: 'shield', fill: '#059669', edge: '#ffffff', ink: '#ffffff' },
  mm: { shape: 'rect', fill: '#0284c7', edge: '#ffffff', ink: '#ffffff' },
};

function SignShape({ shape, fill, edge }) {
  switch (shape) {
    case 'diamond':
      return <><rect x="14" y="14" width="72" height="72" rx="8" transform="rotate(45 50 50)" fill={edge} />
        <rect x="18" y="18" width="64" height="64" rx="6" transform="rotate(45 50 50)" fill={fill} /></>;
    case 'circle':
      return <><circle cx="50" cy="50" r="46" fill={edge} /><circle cx="50" cy="50" r="41" fill={fill} /></>;
    case 'triangle':
      return <><path d="M50 6 L96 88 Q98 93 92 93 L8 93 Q2 93 4 88 Z" fill={edge} />
        <path d="M50 22 L84 84 L16 84 Z" fill={fill} /></>;
    case 'square':
      return <><rect x="6" y="6" width="88" height="88" rx="14" fill={edge} /><rect x="10" y="10" width="80" height="80" rx="11" fill={fill} /></>;
    case 'shield':
      return <><path d="M50 4 L92 16 L88 58 Q84 82 50 96 Q16 82 12 58 L8 16 Z" fill={edge} />
        <path d="M50 10 L86 20 L82 57 Q78 78 50 90 Q22 78 18 57 L14 20 Z" fill={fill} /></>;
    default:
      return <><rect x="2" y="14" width="96" height="72" rx="12" fill={edge} /><rect x="6" y="18" width="88" height="64" rx="9" fill={fill} /></>;
  }
}

function SignIcon({ id, ink }) {
  switch (id) {
    case 'cc':
      return <path d="M34 42 h9 a7 7 0 1 1 14 0 h9 v9 a7 7 0 1 1 0 14 v9 h-32 z" fill={ink} />;
    case 'aha':
      return <g>
        <path d="M50 24 a16 16 0 0 1 10 28.5 q-2 2 -2 6 v3 h-16 v-3 q0 -4 -2 -6 A16 16 0 0 1 50 24 z" fill="#fffbeb" stroke={ink} strokeWidth="3" />
        <rect x="42" y="64" width="16" height="4" rx="2" fill={ink} /><rect x="44" y="70" width="12" height="4" rx="2" fill={ink} />
        <path d="M47 50 l3 -6 l3 6" fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="round" />
        {[[-26, 0], [26, 0], [-19, -19], [19, -19], [0, -27]].map(([dx, dy], i) => (
          <line key={i} x1={50 + dx * 0.78} y1={40 + dy * 0.78} x2={50 + dx} y2={40 + dy} stroke={ink} strokeWidth="3" strokeLinecap="round" />
        ))}
      </g>;
    case 'tq':
      return <text x="50" y="78" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="48" fill={ink}>?</text>;
    case 'ww':
      return <g>
        <path d="M22 50 Q32 34 43 41 Q50 36 57 41 Q68 34 78 50 Q50 55 22 50 Z" fill="#fb7185" stroke="#fff" strokeWidth="2" />
        <path d="M22 50 Q50 76 78 50 Q50 57 22 50 Z" fill="#f43f5e" stroke="#fff" strokeWidth="2" />
      </g>;
    case 'aa':
      return <g>
        <rect x="43" y="28" width="14" height="44" rx="3" fill={ink} /><rect x="28" y="43" width="44" height="14" rx="3" fill={ink} />
      </g>;
    default:
      return <g>
        <rect x="22" y="34" width="56" height="38" rx="7" fill={ink} />
        <rect x="38" y="27" width="18" height="9" rx="3" fill={ink} />
        <circle cx="50" cy="53" r="12" fill="#0284c7" /><circle cx="50" cy="53" r="7" fill={ink} />
        <rect x="65" y="39" width="7" height="5" rx="1.5" fill="#0284c7" />
      </g>;
  }
}

function SignpostSign({ id, size = 64, pole = false, className = '', style }) {
  const s = SIGN_SHAPES[id];
  if (!s) return null;
  return (
    <svg width={size} height={pole ? size * 1.5 : size} viewBox={pole ? '0 0 100 150' : '0 0 100 100'} className={className} style={style} aria-hidden="true">
      {pole && <rect x="46" y="88" width="8" height="62" rx="3" fill="#78716c" />}
      <g style={{ filter: 'drop-shadow(0 3px 2px rgba(0,0,0,0.3))' }}>
        <SignShape {...s} />
        <SignIcon id={id} ink={s.ink} />
      </g>
    </svg>
  );
}
