// ==================== UI COMPONENTS ====================

// HUD Component
const GameHUD = ({ battery, hp, inventory, roomsExplored, puzzlesSolved }) => {
  const batteryColor = battery > LOW_BATTERY_THRESHOLD ? 'bg-shadows-flashlight' : 'bg-shadows-danger';
  const batteryPulse = battery <= LOW_BATTERY_THRESHOLD ? 'animate-pulse' : '';
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/80 to-transparent">
      <div className="max-w-screen-lg mx-auto flex justify-between items-start">
        {/* Battery Meter */}
        <div className="bg-shadows-gray/90 px-4 py-2 rounded-lg border-2 border-shadows-cyan">
          <div className="text-shadows-cyan text-sm font-bold mb-1">BATTERY</div>
          <div className="w-48 h-6 bg-black/50 rounded border border-shadows-cyan overflow-hidden">
            <div 
              className={`h-full ${batteryColor} ${batteryPulse} transition-all`}
              style={{ width: `${battery}%` }}
            ></div>
          </div>
          <div className="text-white text-center text-sm mt-1">{Math.floor(battery)}%</div>
        </div>

        {/* Stats */}
        <div className="bg-shadows-gray/90 px-4 py-2 rounded-lg border-2 border-shadows-cyan">
          <div className="text-shadows-cyan text-sm">
            🚪 Rooms: {roomsExplored} | 🧩 Puzzles: {puzzlesSolved}
          </div>
        </div>

        {/* HP Hearts */}
        <div className="bg-shadows-gray/90 px-4 py-2 rounded-lg border-2 border-shadows-cyan">
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <span key={i} className="text-2xl">
                {i < hp ? '❤️' : '🖤'}
              </span>
            ))}
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-shadows-gray/90 px-4 py-2 rounded-lg border-2 border-shadows-cyan">
          <div className="text-shadows-cyan text-sm font-bold mb-1">INVENTORY</div>
          <div className="flex gap-2">
            {inventory.map((item, i) => (
              <div key={i} className="w-10 h-10 bg-black/50 rounded border border-shadows-cyan flex items-center justify-center text-xl">
                {item ? item.icon : ''}
              </div>
            ))}
            {[...Array(Math.max(0, 4 - inventory.length))].map((_, i) => (
              <div key={`empty-${i}`} className="w-10 h-10 bg-black/50 rounded border border-shadows-gray"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Puzzle Modal Component
const PuzzleModal = ({ puzzle, onSubmit, onClose }) => {
  const [answer, setAnswer] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (answer.toUpperCase().trim() === puzzle.answer.toUpperCase().trim()) {
      onSubmit(true);
    } else {
      setError('❌ Incorrect! Try again...');
      setTimeout(() => setError(''), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="bg-shadows-gray max-w-lg w-full mx-4 p-8 rounded-lg border-4 border-shadows-cyan shadow-2xl">
        <h2 className="text-3xl font-horror text-shadows-cyan mb-4 text-center">
          🔐 LOCKED DOOR
        </h2>
        
        <div className="bg-black/50 p-6 rounded-lg border-2 border-shadows-moonlight mb-4">
          <p className="text-white text-xl text-center mb-2">
            {puzzle.question || puzzle.scrambled}
          </p>
          {puzzle.hint && (
            <p className="text-shadows-moonlight text-sm text-center italic">
              Hint: {puzzle.hint}
            </p>
          )}
          {puzzle.sequence && (
            <p className="text-white text-center">
              Pattern: {puzzle.sequence.join(', ')}, ?
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter answer..."
            className="w-full px-4 py-3 bg-black/70 text-white text-xl text-center rounded border-2 border-shadows-cyan focus:border-shadows-flashlight focus:outline-none mb-4"
            autoFocus
          />
          
          {error && (
            <div className="text-shadows-danger text-center mb-4 animate-pulse">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-shadows-cyan hover:bg-shadows-moonlight text-black font-bold py-3 rounded-lg transition-all"
            >
              ✓ Submit
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-shadows-danger hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all"
            >
              ✗ Run Away
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Game Over Screen
const GameOverScreen = ({ stats, onRestart, onExit, playerName }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      <div className="text-center max-w-2xl mx-4">
        <h1 className="text-6xl font-horror text-shadows-danger mb-8 animate-pulse">
          CAUGHT BY SHADOWS
        </h1>
        
        <div className="bg-shadows-gray p-8 rounded-lg border-2 border-shadows-danger mb-8">
          <h2 className="text-2xl text-white mb-6">Run Statistics</h2>
          <div className="grid grid-cols-2 gap-4 text-white">
            <div className="bg-black/50 p-4 rounded">
              <div className="text-shadows-cyan text-3xl font-bold">{stats.roomsExplored}</div>
              <div className="text-sm">Rooms Explored</div>
            </div>
            <div className="bg-black/50 p-4 rounded">
              <div className="text-shadows-cyan text-3xl font-bold">{stats.puzzlesSolved}</div>
              <div className="text-sm">Puzzles Solved</div>
            </div>
            <div className="bg-black/50 p-4 rounded">
              <div className="text-shadows-flashlight text-3xl font-bold">{stats.batteriesCollected}</div>
              <div className="text-sm">Batteries Found</div>
            </div>
            <div className="bg-black/50 p-4 rounded">
              <div className="text-shadows-moonlight text-3xl font-bold">{calculateMemoryFragments(stats)}</div>
              <div className="text-sm">Memory Fragments</div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onRestart}
            className="bg-shadows-cyan hover:bg-shadows-moonlight text-black font-bold text-xl px-8 py-4 rounded-lg transition-all"
          >
            🔄 Try Again
          </button>
          {playerName && (
            <a
              href="../index.html"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xl px-8 py-4 rounded-lg transition-all inline-block"
            >
              🏠 Return to Noyola Hub
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// Victory Screen
const VictoryScreen = ({ stats, onRestart, onExit, playerName }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      <div className="text-center max-w-2xl mx-4">
        <h1 className="text-6xl font-horror text-green-400 mb-8 animate-pulse">
          ✨ ESCAPED! ✨
        </h1>
        
        <div className="bg-shadows-gray p-8 rounded-lg border-2 border-green-400 mb-8">
          <h2 className="text-2xl text-white mb-6">Victory Statistics</h2>
          <div className="grid grid-cols-2 gap-4 text-white">
            <div className="bg-black/50 p-4 rounded">
              <div className="text-green-400 text-3xl font-bold">{stats.roomsExplored}</div>
              <div className="text-sm">Rooms Explored</div>
            </div>
            <div className="bg-black/50 p-4 rounded">
              <div className="text-green-400 text-3xl font-bold">{stats.puzzlesSolved}</div>
              <div className="text-sm">Puzzles Solved</div>
            </div>
            <div className="bg-black/50 p-4 rounded">
              <div className="text-shadows-flashlight text-3xl font-bold">{stats.batteriesCollected}</div>
              <div className="text-sm">Batteries Found</div>
            </div>
            <div className="bg-black/50 p-4 rounded">
              <div className="text-shadows-moonlight text-3xl font-bold">{calculateMemoryFragments({...stats, escaped: true})}</div>
              <div className="text-sm">Memory Fragments</div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-green-900/30 rounded border border-green-400">
            <div className="text-green-400 text-lg font-bold">Rewards Earned!</div>
            <div className="text-white">
              +{100 + (stats.puzzlesSolved * 10)} XP | +20 Coins | +10 Reward Points
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onRestart}
            className="bg-shadows-cyan hover:bg-shadows-moonlight text-black font-bold text-xl px-8 py-4 rounded-lg transition-all"
          >
            🔄 Play Again
          </button>
          {playerName && (
            <a
              href="../index.html"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xl px-8 py-4 rounded-lg transition-all inline-block"
            >
              🏠 Return to Noyola Hub
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// Title Screen
const TitleScreen = ({ onStart, playerName }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-shadows-dark via-shadows-purple to-shadows-dark">
      <div className="text-center max-w-3xl mx-4">
        <h1 className="text-7xl font-horror text-shadows-cyan mb-4 animate-pulse drop-shadow-[0_0_20px_rgba(0,188,212,0.8)]">
          🏫 SHADOWS IN THE HALLS 👻
        </h1>
        
        <p className="text-shadows-moonlight text-xl mb-8 italic">
          "Escape the infinite school... if you can."
        </p>

        {playerName && (
          <div className="bg-shadows-gray/80 px-6 py-3 rounded-lg border-2 border-shadows-cyan mb-8 inline-block">
            <span className="text-shadows-cyan">Playing as: </span>
            <span className="text-white font-bold">{playerName}</span>
          </div>
        )}

        <div className="bg-shadows-gray/80 p-8 rounded-lg border-2 border-shadows-moonlight mb-8">
          <h2 className="text-2xl text-shadows-cyan mb-4">How to Play</h2>
          <div className="text-white text-left space-y-2">
            <p>🎮 <strong>WASD</strong> - Move (Hold Shift to run)</p>
            <p>🔦 <strong>Battery</strong> - Keep your flashlight powered</p>
            <p>🧩 <strong>Puzzles</strong> - Solve to unlock doors</p>
            <p>👻 <strong>Shadows</strong> - Avoid them at all costs!</p>
            <p>🚪 <strong>Exit</strong> - Find it and escape before battery dies</p>
          </div>
        </div>

        <button
          onClick={onStart}
          className="bg-shadows-cyan hover:bg-shadows-flashlight text-black font-bold text-2xl px-12 py-6 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-shadows-cyan/50"
        >
          ▶ Start Run
        </button>

        {playerName && (
          <div className="mt-6">
            <a
              href="../index.html"
              className="text-shadows-cyan hover:text-shadows-moonlight transition-all"
            >
              🏠 Return to Noyola Hub
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
