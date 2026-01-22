// ==================== EMBER PARTICLES ====================
const EmberParticles = () => {
  const [embers, setEmbers] = useState([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setEmbers(prev => {
        const now = Date.now();
        const filtered = prev.filter(e => now - e.created < 3000);
        if (filtered.length < 15) {
          filtered.push({
            id: now,
            created: now,
            left: 20 + Math.random() * 60,
            drift: (Math.random() - 0.5) * 100,
            delay: Math.random() * 0.5,
            size: 2 + Math.random() * 4
          });
        }
        return filtered;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-64 pointer-events-none overflow-hidden">
      {embers.map(ember => (
        <div
          key={ember.id}
          className="ember"
          style={{
            left: `${ember.left}%`,
            bottom: '20px',
            '--drift': `${ember.drift}px`,
            animationDelay: `${ember.delay}s`,
            width: `${ember.size}px`,
            height: `${ember.size}px`
          }}
        />
      ))}
    </div>
  );
};
