// ==================== REACT COMPONENTS ====================

// Pixel Sprite Component
const PixelSprite = ({ type, scale = 3, isHit, isAttacking, flip }) => {
  const pixels = sprites[type] || sprites.slime;
  
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

// SVG Canada Map Component
const CanadaMap = ({ unlockedRegions, onSelectRegion, currentRegion }) => {
  const provinces = [
    { id: 'atlantic', path: 'M380,180 L400,160 L420,170 L410,190 L390,200 Z', cx: 395, cy: 180 },
    { id: 'quebec', path: 'M320,140 L360,120 L380,140 L370,180 L340,190 L310,170 Z', cx: 345, cy: 155 },
    { id: 'ontario', path: 'M260,160 L300,150 L320,170 L310,200 L270,210 L250,190 Z', cx: 285, cy: 180 },
    { id: 'shield', path: 'M200,100 L280,80 L320,120 L300,160 L240,170 L180,140 Z', cx: 250, cy: 125 },
    { id: 'plains', path: 'M120,140 L180,130 L200,180 L180,220 L120,210 L100,170 Z', cx: 150, cy: 175 },
    { id: 'rockies', path: 'M60,120 L100,110 L120,160 L100,200 L60,190 L40,150 Z', cx: 80, cy: 155 },
    { id: 'arctic', path: 'M100,20 L200,10 L300,30 L320,80 L280,100 L180,110 L100,90 L80,50 Z', cx: 200, cy: 60 },
  ];

  return (
    <svg viewBox="0 0 440 240" className="w-full h-full">
      <rect x="0" y="0" width="440" height="240" fill="#0ea5e9" />
      <ellipse cx="220" cy="140" rx="200" ry="110" fill="#4ade80" />
      
      {provinces.map((prov, idx) => {
        const region = regions.find(r => r.id === prov.id);
        const regionIdx = regions.findIndex(r => r.id === prov.id);
        const unlocked = unlockedRegions.includes(regionIdx);
        const isSelected = currentRegion === regionIdx;
        
        return (
          <g key={prov.id}>
            <path
              d={prov.path}
              fill={unlocked ? region.color : '#6b7280'}
              stroke={isSelected ? '#fff' : '#1f2937'}
              strokeWidth={isSelected ? 4 : 2}
              opacity={unlocked ? 1 : 0.5}
              onClick={() => unlocked && onSelectRegion(regionIdx)}
              style={{ cursor: unlocked ? 'pointer' : 'not-allowed' }}
              className={unlocked ? 'hover:brightness-110 transition-all' : ''}
            />
            <text
              x={prov.cx}
              y={prov.cy}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill="#fff"
              style={{ pointerEvents: 'none', textShadow: '1px 1px 2px #000' }}
            >
              {unlocked ? region.name : '🔒'}
            </text>
            {unlocked && (
              <circle
                cx={prov.cx}
                cy={prov.cy + 15}
                r="8"
                fill="#fff"
                stroke={region.color}
                strokeWidth="2"
                onClick={() => onSelectRegion(regionIdx)}
                style={{ cursor: 'pointer' }}
                className="animate-pulse"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
};
