// ==================== REACT COMPONENTS ====================

// Pixel Sprite Component - renders box-shadow pixel art or a PNG override.
const PixelSprite = ({ type, scale = 3, isHit, isAttacking, flip }) => {
  const imgOverride = spriteImages[type];

  if (imgOverride) {
    return (
      <img
        src={imgOverride}
        alt={type}
        style={{
          width: 24 * scale,
          height: 24 * scale,
          objectFit: 'contain',
          transform: `${flip ? 'scaleX(-1)' : ''} ${isAttacking ? 'translateX(20px)' : ''}`,
          transition: 'transform 0.2s ease',
          filter: isHit ? 'brightness(0.3) sepia(1) hue-rotate(-50deg) saturate(5)' : 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))',
          animation: isHit ? 'shake 0.1s infinite' : 'float 2.5s ease-in-out infinite',
        }}
      />
    );
  }

  const pixels = sprites[type] || sprites.riceSprite;

  const shadow = pixels.map(([x, y, color]) =>
    `${x * scale}px ${y * scale}px 0 ${color}`
  ).join(', ');

  const containerStyle = {
    width: 12 * scale,
    height: 12 * scale,
    position: 'relative',
    transform: `${flip ? 'scaleX(-1)' : ''} ${isAttacking ? 'translateX(20px)' : ''}`,
    transition: 'transform 0.2s ease',
    filter: isHit ? 'brightness(0.3) sepia(1) hue-rotate(-50deg) saturate(5)' : 'none',
  };

  const pixelStyle = {
    width: scale,
    height: scale,
    position: 'absolute',
    top: 0,
    left: 0,
    boxShadow: shadow,
    animation: isHit ? 'shake 0.1s infinite' : 'float 1s ease-in-out infinite',
  };

  return (
    <div style={containerStyle}>
      <div style={pixelStyle} />
    </div>
  );
};

// HP Bar Component
const HPBar = ({ current, max, color = 'red', label }) => {
  const pct = Math.max(0, (current / max) * 100);
  const bg = color === 'red' ? 'bg-red-500' : color === 'blue' ? 'bg-blue-500' : 'bg-green-500';

  return (
    <div className="w-full">
      {label && <div className="text-xs font-bold text-white mb-1 drop-shadow">{label}</div>}
      <div className="h-4 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-600 relative">
        <div className={`h-full ${bg} transition-all duration-300`} style={{ width: `${pct}%` }} />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
          {current}/{max}
        </div>
      </div>
    </div>
  );
};

// Gold+red particle burst on successful hits.
const ParticleBurst = ({ bursts }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {bursts.map(b => (
      <div key={b.id} style={{ position: 'absolute', left: b.x, top: b.y }}>
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const dist = 30 + Math.random() * 20;
          const dx = Math.cos(angle) * dist;
          const dy = Math.sin(angle) * dist;
          return (
            <span
              key={i}
              className="cn-particle"
              style={{
                background: i % 2 === 0 ? '#FBBF24' : '#DC2626',
                '--dx': `${dx}px`,
                '--dy': `${dy}px`,
              }}
            />
          );
        })}
      </div>
    ))}
  </div>
);

// Stylized SVG map of China's 7 regions.
const ChinaMap = ({ unlockedRegions, onSelectRegion, currentRegion, className = '' }) => {
  // Simplified polygon paths. Arranged so the layout roughly matches real China:
  //  - Tibet in the west/southwest
  //  - Silk Road in the northwest corridor
  //  - Sichuan in the south-center
  //  - Great Wall arcing across the north
  //  - Beijing (capital) marked near the northeast
  //  - Forbidden City near Beijing
  //  - Modern China on the southeast coast
  const provinces = [
    { id: 'tibet',         path: 'M60,140 L150,120 L190,160 L170,210 L90,220 L50,180 Z', cx: 110, cy: 175 },
    { id: 'silkroad',      path: 'M70,60 L180,40 L220,90 L200,130 L140,125 L80,110 Z',   cx: 135, cy: 85  },
    { id: 'sichuan',       path: 'M180,170 L260,155 L280,195 L250,225 L190,215 L170,195 Z', cx: 225, cy: 190 },
    { id: 'greatwall',     path: 'M200,30 L340,20 L380,60 L360,85 L260,95 L220,80 Z',     cx: 290, cy: 55  },
    { id: 'beijing',       path: 'M330,95 L380,90 L395,115 L370,135 L325,125 Z',         cx: 360, cy: 110 },
    { id: 'forbiddencity', path: 'M285,125 L325,120 L340,145 L315,165 L275,150 Z',       cx: 305, cy: 140 },
    { id: 'moderncity',    path: 'M295,175 L370,165 L395,205 L360,235 L290,225 L270,195 Z', cx: 330, cy: 200 },
  ];

  return (
    <svg viewBox="0 0 440 260" className={`w-full h-full ${className}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="cn-sea" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0c4a6e" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id="cn-land" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="440" height="260" fill="url(#cn-sea)" />
      <ellipse cx="220" cy="135" rx="210" ry="115" fill="url(#cn-land)" opacity="0.9" />

      {provinces.map((prov) => {
        const regionIdx = regions.findIndex(r => r.id === prov.id);
        const region = regions[regionIdx];
        const unlocked = unlockedRegions.includes(regionIdx);
        const isSelected = currentRegion === regionIdx;

        return (
          <g key={prov.id}>
            <path
              d={prov.path}
              fill={unlocked ? region.color : '#6b7280'}
              stroke={isSelected ? '#FBBF24' : '#1F2937'}
              strokeWidth={isSelected ? 4 : 2}
              opacity={unlocked ? 1 : 0.45}
              onClick={() => unlocked && onSelectRegion(regionIdx)}
              style={{ cursor: unlocked ? 'pointer' : 'not-allowed' }}
              className={unlocked ? 'hover:brightness-110 transition-all cn-brush-path' : ''}
            />
            <text
              x={prov.cx}
              y={prov.cy}
              textAnchor="middle"
              fontSize="11"
              fontWeight="bold"
              fill="#fff"
              style={{ pointerEvents: 'none', textShadow: '1px 1px 2px #000' }}
            >
              {unlocked ? region.name : '🔒'}
            </text>
            {unlocked && (
              <text
                x={prov.cx}
                y={prov.cy + 14}
                textAnchor="middle"
                fontSize="12"
                style={{ pointerEvents: 'none', textShadow: '0 0 4px #000' }}
              >
                {region.emoji}
              </text>
            )}
          </g>
        );
      })}

      {/* Decorative "Middle Kingdom" dragon border accent */}
      <text x="220" y="18" textAnchor="middle" fontSize="14" fill="#B91C1C" fontWeight="900" style={{ textShadow: '0 0 2px #000' }}>
        中国 · The Middle Kingdom
      </text>
    </svg>
  );
};
