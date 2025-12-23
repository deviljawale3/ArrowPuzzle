import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { generateLevel } from './services/geminiService';
import { audioService } from './services/audioService';
import { Grid, CellStatus, Direction, GameStatus, Cell } from './types';
import Block from './components/Block';

// --- CONSTANTS ---
const FIXED_GRID_SIZE = 6; 
const MAX_LIVES = 5;
const LIFE_REGEN_MS = 10 * 60 * 1000; 
const LEVEL_COMPLETE_REWARD = 10;
const CONTINUE_COST = 50; 
const WHEEL_SPIN_COST = 30;

// --- PREMIUM UI COMPONENTS ---

const BrandingLogo = () => (
  <div className="flex flex-row items-center justify-center gap-2 opacity-100 cursor-default select-none group preserve-3d py-1 px-4 bg-white/5 rounded-full border border-white/5 backdrop-blur-sm">
    <div className="relative w-5 h-5 transition-all duration-1000 preserve-3d group-hover:rotate-y-[180deg] shrink-0">
       <div className="absolute inset-[-2px] bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 rounded-sm rotate-45 blur-sm opacity-70 group-hover:opacity-100 animate-pulse transition-opacity"></div>
       <div className="absolute inset-0 bg-stone-900 rounded-sm rotate-45 border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/30 to-transparent"></div>
       </div>
       <div className="absolute inset-[4px] bg-white rounded-full animate-pulse shadow-[0_0_8px_white]"></div>
    </div>
    <div className="flex flex-row items-center gap-1 leading-none">
       <h2 className="text-[11px] font-[900] uppercase tracking-[0.1em] text-white italic drop-shadow-md">
         DeeJay <span className="text-indigo-400">Labs</span>
       </h2>
       <div className="h-[1px] w-4 bg-indigo-500/40 rounded-full mx-1"></div>
    </div>
  </div>
);

const PremiumHomeLogo = () => (
  <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center animate-float group">
     <div className="relative w-full h-full bg-stone-900 rounded-[3rem] sm:rounded-[3.5rem] shadow-[0_35px_70px_-15px_rgba(0,0,0,0.9),inset_0_2px_6px_rgba(255,255,255,0.15)] flex items-center justify-center transition-all duration-700 overflow-hidden border border-white/10">
        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-stone-950 rounded-full flex items-center justify-center shadow-2xl border border-stone-800/50 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
           <div className="flex items-center justify-center animate-bounce-horizontal">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="white" 
                strokeWidth="4" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-10 h-10 sm:w-14 sm:h-14 drop-shadow-lg"
              >
                <path d="M5 12h14M13 5l7 7-7 7"/>
              </svg>
           </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none rounded-[inherit]"></div>
     </div>
  </div>
);

const ConfettiParticle: React.FC<{ delay: number; color: string }> = ({ delay, color }) => (
  <div 
    className="absolute w-2 h-2 rounded-sm animate-confetti-fall pointer-events-none"
    style={{
      backgroundColor: color,
      left: `${Math.random() * 100}%`,
      top: `-10%`,
      animationDelay: `${delay}ms`,
      animationDuration: `${2.5 + Math.random() * 1}s`,
      zIndex: 100
    }}
  />
);

const WinEffect = () => (
  <div className="absolute inset-0 z-[55] pointer-events-none overflow-hidden flex items-center justify-center">
    <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-md animate-fade-in"></div>
    {/* Premium Flares and Dust */}
    <div className="absolute top-1/2 left-1/2 w-[1100px] h-[1100px] bg-gradient-radial from-white/30 via-emerald-400/20 to-transparent opacity-80 animate-flare-spin"></div>
    <div className="absolute top-1/2 left-1/2 w-[1500px] h-[1500px] bg-gradient-radial from-emerald-600/20 via-transparent to-transparent opacity-60 animate-flare-spin" style={{ animationDirection: 'reverse', animationDuration: '40s' }}></div>
    {Array.from({ length: 100 }).map((_, i) => (
      <div 
        key={i}
        className="absolute w-1.5 h-1.5 bg-white rounded-full animate-spark-drift"
        style={{
          left: `${Math.random() * 100}%`,
          bottom: '0%',
          animationDelay: `${Math.random() * 6}s`,
          animationDuration: `${4 + Math.random() * 3}s`,
          boxShadow: '0 0 18px rgba(255,255,255,1)',
          opacity: 0.7 + Math.random() * 0.3
        }}
      />
    ))}
  </div>
);

const LuckyWheel: React.FC<{ onResult: (coins: number) => void; onCancel: () => void; userCoins: number }> = ({ onResult, onCancel, userCoins }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const rewards = [50, 0, 100, 10, 200, 25, 500, 0];
  const sliceCount = rewards.length;

  const spin = () => {
    if (spinning || userCoins < WHEEL_SPIN_COST) return;
    setSpinning(true);
    audioService.playSpin();
    
    const extraDegrees = 1440 + Math.floor(Math.random() * 360); 
    const targetRotation = rotation + extraDegrees;
    setRotation(targetRotation);

    setTimeout(() => {
      setSpinning(false);
      const normalizedRotation = targetRotation % 360;
      const sliceSize = 360 / sliceCount;
      const index = Math.floor(((360 - normalizedRotation) % 360) / sliceSize);
      const winAmount = rewards[index];
      onResult(winAmount);
      if (winAmount > 0) audioService.playWin();
    }, 3000);
  };

  return (
    <div className="absolute inset-0 z-[250] flex items-center justify-center bg-stone-950/98 backdrop-blur-3xl p-6 animate-fade-in sm:rounded-[3.5rem] overflow-hidden">
      <div className="flex flex-col items-center gap-10 w-full max-w-sm relative z-10">
        <h2 className="text-4xl font-[900] italic tracking-tighter text-white uppercase drop-shadow-[0_10px_20px_rgba(0,0,0,1)]">Lucky Wheel</h2>
        
        <div className="relative preserve-3d w-64 h-64 sm:w-72 sm:h-72 transition-transform duration-500">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-30 w-10 h-12 flex items-center justify-center">
            <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[30px] border-t-rose-500 drop-shadow-[0_5px_15px_rgba(244,63,94,0.6)]"></div>
          </div>
          
          <div 
            className="w-full h-full rounded-full border-[12px] border-stone-800 shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] overflow-hidden relative transition-transform duration-[3000ms] cubic-bezier(0.15, 0, 0.15, 1) preserve-3d"
            style={{ 
              transform: `perspective(1200px) rotateX(35deg) rotateZ(${rotation}deg)`,
              backgroundImage: `conic-gradient(from 0deg, 
                #1c1917 0deg 45deg, 
                #4338ca 45deg 90deg, 
                #1c1917 90deg 135deg, 
                #10b981 135deg 180deg, 
                #1c1917 180deg 225deg, 
                #fbbf24 225deg 270deg, 
                #1c1917 270deg 315deg, 
                #f43f5e 315deg 360deg)` 
            }}
          >
            {rewards.map((r, i) => (
              <div 
                key={i} 
                className="absolute w-full h-full flex items-start justify-center pt-8"
                style={{ transform: `rotate(${i * 45 + 22.5}deg)` }}
              >
                <span className="text-white font-black text-sm tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {r > 0 ? `${r}C` : '0'}
                </span>
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none rounded-full"></div>
            <div className="absolute inset-0 m-auto w-12 h-12 bg-stone-900 rounded-full border-4 border-stone-700 flex items-center justify-center shadow-2xl z-40">
               <div className="w-3 h-3 bg-white rounded-full animate-pulse shadow-[0_0_15px_white]"></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-[180px]">
          <button 
            onClick={spin}
            disabled={spinning || userCoins < WHEEL_SPIN_COST}
            className="btn-premium w-full py-4 rounded-xl text-white font-[900] uppercase tracking-[0.2em] text-xs"
          >
            {spinning ? 'SPINNING...' : `SPIN (${WHEEL_SPIN_COST}C)`}
          </button>
          <button 
            onClick={onCancel}
            disabled={spinning}
            className="text-stone-500 font-bold uppercase text-[9px] tracking-[0.3em] hover:text-white transition-colors"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.HOME);
  const [grid, setGrid] = useState<Grid>([]);
  const [cellSize, setCellSize] = useState(50);
  const [muted, setMuted] = useState(audioService.isMuted());
  const [isCollisionShake, setIsCollisionShake] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [showCollisionToast, setShowCollisionToast] = useState(false);
  const [isDiffMenuOpen, setIsDiffMenuOpen] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

  const [level, setLevel] = useState(() => parseInt(localStorage.getItem('ap_level') || '1', 10));
  const [coins, setCoins] = useState(() => parseInt(localStorage.getItem('ap_coins') || '100', 10));
  const [lives, setLives] = useState(() => parseInt(localStorage.getItem('ap_lives') || '5', 10));
  const [lastRegen, setLastRegen] = useState(() => parseInt(localStorage.getItem('ap_last_regen') || Date.now().toString(), 10));

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('ap_level', level.toString());
    localStorage.setItem('ap_coins', coins.toString());
    localStorage.setItem('ap_lives', lives.toString());
    localStorage.setItem('ap_last_regen', lastRegen.toString());
  }, [level, coins, lives, lastRegen]);

  const handleResize = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    
    // Balanced padding
    const padX = Math.min(clientWidth * 0.15, 60);
    const padY = Math.min(clientHeight * 0.40, 320);
    const size = Math.min(clientWidth - padX, clientHeight - padY);
    const calculatedCell = Math.floor(size / FIXED_GRID_SIZE);
    
    setCellSize(Math.max(34, Math.min(calculatedCell, 65))); 
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastRegen >= LIFE_REGEN_MS) {
        setLives(prev => {
           if (prev < 3) return 3;
           return Math.min(MAX_LIVES, prev + 1);
        });
        setLastRegen(now);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [lastRegen]);

  const difficultyText = useMemo(() => {
    if (level < 10) return { label: 'EASY', color: 'text-indigo-400', tier: 'easy' };
    if (level < 30) return { label: 'MEDIUM', color: 'text-emerald-400', tier: 'medium' };
    return { label: 'HARD', color: 'text-rose-400', tier: 'hard' };
  }, [level]);

  // Tactical highlighting
  const pathInfo = useMemo(() => {
    if (!hoveredCell || status !== GameStatus.PLAYING) return { path: [], collisionTarget: null, adjacent: [] };
    const { x, y } = hoveredCell;
    const cell = grid[y][x];
    if (!cell || cell.status !== CellStatus.IDLE) return { path: [], collisionTarget: null, adjacent: [] };

    const path: { x: number; y: number }[] = [];
    const adjacent: { x: number; y: number }[] = [];
    let dx = 0, dy = 0;
    if (cell.direction === Direction.UP) dy = -1;
    else if (cell.direction === Direction.DOWN) dy = 1;
    else if (cell.direction === Direction.LEFT) dx = -1;
    else if (cell.direction === Direction.RIGHT) dx = 1;

    let cx = x + dx;
    let cy = y + dy;
    let collisionTarget: {x: number, y: number} | null = null;

    while (cx >= 0 && cx < FIXED_GRID_SIZE && cy >= 0 && cy < FIXED_GRID_SIZE) {
      if (grid[cy][cx] !== null) {
        collisionTarget = { x: cx, y: cy };
        break;
      }
      path.push({ x: cx, y: cy });
      
      const perp = (cell.direction === Direction.UP || cell.direction === Direction.DOWN) 
        ? [{px: cx-1, py: cy}, {px: cx+1, py: cy}] 
        : [{px: cx, py: cy-1}, {px: cx, py: cy+1}];
      
      perp.forEach(({px, py}) => {
        if (px >= 0 && px < FIXED_GRID_SIZE && py >= 0 && py < FIXED_GRID_SIZE) {
          if (grid[py][px] && !adjacent.some(a => a.x === px && a.y === py)) {
            adjacent.push({x: px, y: py});
          }
        }
      });

      cx += dx;
      cy += dy;
    }

    return { path, collisionTarget, adjacent };
  }, [hoveredCell, grid, status]);

  const loadLevel = useCallback(async (l: number) => {
    setStatus(GameStatus.LOADING);
    setIsCelebrating(false);
    try {
      const difficulty = l < 10 ? 'easy' : l < 30 ? 'medium' : 'hard';
      const config = await generateLevel(difficulty, l);
      const newGrid: Grid = config.grid.map((row, y) => 
        row.map((dir, x) => dir ? {
          id: `${l}-${x}-${y}-${Math.random()}`,
          direction: dir,
          status: CellStatus.IDLE,
          x,
          y
        } : null)
      );
      setGrid(newGrid);
      setStatus(GameStatus.PLAYING);
    } catch (error) {
      console.error("Failed to load level", error);
      setStatus(GameStatus.HOME);
    }
  }, []);

  const handleBlockClick = useCallback(async (x: number, y: number) => {
    if (status !== GameStatus.PLAYING || lives <= 0 || isCelebrating) return;
    const cell = grid[y][x];
    if (!cell || cell.status !== CellStatus.IDLE) return;
    
    audioService.playClick();
    let dx = 0, dy = 0;
    if (cell.direction === Direction.UP) dy = -1;
    else if (cell.direction === Direction.DOWN) dy = 1;
    else if (cell.direction === Direction.LEFT) dx = -1;
    else if (cell.direction === Direction.RIGHT) dx = 1;

    let cx = x + dx, cy = y + dy, collision = false;
    while (cx >= 0 && cx < FIXED_GRID_SIZE && cy >= 0 && cy < FIXED_GRID_SIZE) {
      if (grid[cy][cx] !== null) { collision = true; break; }
      cx += dx; cy += dy;
    }

    if (collision) {
      audioService.playCollision();
      const newGrid = grid.map(row => row.map(c => c ? { ...c } : null));
      newGrid[y][x] = { ...cell, status: CellStatus.COLLIDED };
      setGrid(newGrid);
      setIsCollisionShake(true);
      setShowCollisionToast(true);

      setTimeout(() => {
        setIsCollisionShake(false);
        setShowCollisionToast(false);
        setLives(prev => {
          const nextLives = Math.max(0, prev - 1);
          if (nextLives === 0) setStatus(GameStatus.GAME_OVER);
          else setStatus(GameStatus.LOST);
          return nextLives;
        });
      }, 700);
    } else {
      audioService.playMove();
      const newGrid = grid.map(row => row.map(c => c ? { ...c } : null));
      newGrid[y][x] = { ...cell, status: CellStatus.MOVING };
      setGrid(newGrid);
      
      setTimeout(() => {
        setGrid(prev => {
          const updated = prev.map(row => row.map(c => (c?.status === CellStatus.MOVING ? null : c)));
          const remaining = updated.flat().filter(c => c !== null).length;
          if (remaining === 0) {
            setIsCelebrating(true);
            audioService.playWin();
            setCoins(c => c + LEVEL_COMPLETE_REWARD);
            setTimeout(() => {
              setStatus(GameStatus.WON);
            }, 1200);
          }
          return updated;
        });
      }, 750);
    }
  }, [grid, status, lives, isCelebrating]);

  const handleContinue = () => {
    if (coins >= CONTINUE_COST) {
      setCoins(c => c - CONTINUE_COST);
      setLives(MAX_LIVES);
      loadLevel(level);
      audioService.playClick();
    }
  };

  const nextLevel = () => {
    const next = level + 1;
    setLevel(next);
    loadLevel(next);
  };

  const selectDifficulty = (diff: 'easy' | 'medium' | 'hard') => {
    setIsDiffMenuOpen(false);
    audioService.playClick();
    let newLevel = diff === 'easy' ? 1 : diff === 'medium' ? 10 : 30;
    setLevel(newLevel);
    loadLevel(newLevel);
  };

  const handleWheelResult = (wonAmount: number) => {
    setCoins(prev => prev + wonAmount - WHEEL_SPIN_COST);
    setTimeout(() => setShowWheel(false), 2000);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-stone-950 flex flex-col overflow-hidden font-sans select-none sm:max-w-md sm:mx-auto sm:rounded-[3rem] sm:border-[10px] sm:border-stone-900 sm:shadow-[0_0_150px_rgba(0,0,0,1)]">
      
      {/* Background Decor */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-950/40 via-stone-950 to-rose-950/40"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:32px_32px]"></div>
      </div>

      {/* Header HUD */}
      <header className="px-6 pt-10 pb-4 flex justify-between items-center z-20 shrink-0">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em] leading-none">Mission Grid</span>
          <span key={level} className={`text-4xl font-[900] text-white italic tracking-tighter leading-none drop-shadow-lg transition-all duration-500 animate-diff-change ${difficultyText.color}`}>LVL {level}</span>
        </div>
        <div className="flex flex-col items-end gap-3">
           <div className="flex items-center gap-2 bg-stone-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
             <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white/20 shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse"></div>
             <span className="text-sm font-black text-white tabular-nums">{coins}</span>
           </div>
           <div className="flex gap-2">
              {Array.from({ length: MAX_LIVES }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${i < lives ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]' : 'bg-stone-800'}`} />
              ))}
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 overflow-hidden relative">
        
        {/* Home View */}
        {status === GameStatus.HOME && (
          <div className="flex flex-col items-center justify-center text-center animate-pop-in w-full max-w-xs h-full py-10 gap-10">
             <PremiumHomeLogo />
             <div className="space-y-2">
               <h1 className="text-6xl font-[900] text-white uppercase tracking-tighter italic leading-none drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]">ARROW</h1>
               <h1 className="text-6xl font-[900] text-stone-700 uppercase tracking-tighter italic leading-none">PUZZLE</h1>
             </div>
             
             <div className="flex flex-col gap-5 w-full max-w-[220px]">
                <button 
                  onClick={() => loadLevel(level)}
                  className="btn-premium w-full py-5 rounded-2xl text-white font-[900] uppercase tracking-[0.3em] text-xs"
                >
                  START MISSION
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowWheel(true)}
                    className="btn-premium flex-1 py-3 rounded-xl text-indigo-400 font-black uppercase tracking-[0.2em] text-[10px]"
                  >
                    WHEEL
                  </button>
                  <button 
                    onClick={() => setShowHelp(true)}
                    className="btn-premium flex-1 py-3 rounded-xl text-stone-400 font-black uppercase tracking-[0.2em] text-[10px]"
                  >
                    GUIDE
                  </button>
                </div>
             </div>
          </div>
        )}

        {/* Game Area */}
        {(status === GameStatus.PLAYING || status === GameStatus.LOADING || status === GameStatus.LOST || status === GameStatus.WON) && (
          <div className="flex flex-col items-center gap-6 animate-fade-in w-full">
            {/* Difficulty HUD */}
            <div className="relative z-[100]">
              <button 
                key={difficultyText.tier}
                onClick={() => { setIsDiffMenuOpen(!isDiffMenuOpen); audioService.playClick(); }}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] ${difficultyText.color} bg-stone-900/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/5 shadow-xl transition-all active:scale-95 animate-diff-change`}
              >
                {difficultyText.label}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 transition-transform duration-300 ${isDiffMenuOpen ? 'rotate-180' : ''}`}>
                  <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
              {isDiffMenuOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-36 bg-stone-900 rounded-[1.5rem] shadow-2xl overflow-hidden z-[110] border border-white/10 animate-menu-3d">
                  <button onClick={() => selectDifficulty('easy')} className="w-full py-4 text-[10px] font-black text-indigo-400 hover:bg-white/5 border-b border-white/5 uppercase tracking-widest">Easy</button>
                  <button onClick={() => selectDifficulty('medium')} className="w-full py-4 text-[10px] font-black text-emerald-400 hover:bg-white/5 border-b border-white/5 uppercase tracking-widest">Medium</button>
                  <button onClick={() => selectDifficulty('hard')} className="w-full py-4 text-[10px] font-black text-rose-400 hover:bg-white/5 uppercase tracking-widest">Hard</button>
                </div>
              )}
            </div>

            <div 
              className={`relative p-2 rounded-[2.5rem] bg-stone-900/40 backdrop-blur-3xl border border-white/5 shadow-[0_40px_80px_-20px_rgba(0,0,0,1)] perspective-1000 ${isCollisionShake ? 'animate-collision-impact' : ''}`}
              style={{ width: FIXED_GRID_SIZE * cellSize + 16, height: FIXED_GRID_SIZE * cellSize + 16 }}
            >
              {showCollisionToast && (
                <div className="absolute inset-0 z-[110] flex items-center justify-center pointer-events-none">
                  <div className="bg-rose-600 text-white font-[1000] px-14 py-6 rounded-full shadow-[0_30px_70px_-5px_rgba(225,29,72,1)] text-4xl italic tracking-tighter animate-collision-pop border-4 border-white/40 uppercase">
                    COLLISION!
                  </div>
                </div>
              )}
              {isCelebrating && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[105]">
                    <div className="w-full h-full bg-emerald-500/10 rounded-[2.5rem] animate-win-ripple"></div>
                 </div>
              )}
              <div className="relative w-full h-full preserve-3d">
                {/* Prediction Paths */}
                {pathInfo.path.map((p, i) => (
                  <div 
                    key={`path-${i}`}
                    className="absolute rounded-full z-10 animate-pulse pointer-events-none bg-white/20"
                    style={{
                      width: cellSize / 6,
                      height: cellSize / 6,
                      left: p.x * cellSize + (cellSize / 2) - (cellSize / 12),
                      top: p.y * cellSize + (cellSize / 2) - (cellSize / 12),
                      opacity: Math.max(0.1, 1 - (i * 0.2)), 
                    }}
                  />
                ))}
                {/* Game Blocks */}
                {grid.flat().map((cell) => cell && (
                  <Block 
                    key={cell.id} 
                    cell={cell} 
                    onClick={handleBlockClick}
                    onHover={(x, y) => setHoveredCell({ x, y })}
                    onLeave={() => setHoveredCell(null)} 
                    cellSize={cellSize}
                    isSelected={hoveredCell?.x === cell.x && hoveredCell?.y === cell.y}
                    isWarning={pathInfo.collisionTarget?.x === cell.x && pathInfo.collisionTarget?.y === cell.y}
                    isAdjacent={pathInfo.adjacent.some(a => a.x === cell.x && a.y === cell.y)}
                  />
                ))}
                {status === GameStatus.LOADING && (
                  <div className="absolute inset-0 flex items-center justify-center z-50 bg-stone-950/70 backdrop-blur-md rounded-[1.8rem]">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(99,102,241,0.4)]"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Overlays */}
        {showWheel && (
          <LuckyWheel userCoins={coins} onCancel={() => setShowWheel(false)} onResult={handleWheelResult} />
        )}

        {status === GameStatus.WON && (
          <div className="absolute inset-0 z-[150] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-8 text-center sm:rounded-[3rem] overflow-hidden">
             <WinEffect />
             <div className="flex flex-col items-center max-w-xs w-full relative z-[70] animate-victory-blast">
                {Array.from({ length: 50 }).map((_, i) => <ConfettiParticle key={i} delay={i * 35} color={['#6366f1', '#f43f5e', '#fbbf24', '#10b981'][i % 4]} />)}
                <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] shadow-[0_20px_50px_rgba(79,70,229,0.7)] mb-10 flex items-center justify-center border-4 border-white/30">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={5} stroke="white" className="w-12 h-12 drop-shadow-lg"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                </div>
                <h2 className="text-5xl font-[900] text-white mb-3 italic tracking-tighter uppercase drop-shadow-2xl">SOLVED</h2>
                <p className="text-indigo-400 font-black uppercase tracking-[0.5em] text-[10px] mb-14">CLEARANCE CONFIRMED</p>
                <button onClick={nextLevel} className="btn-premium w-full py-6 rounded-[2rem] text-white font-[900] uppercase tracking-[0.2em] text-xs">NEXT LEVEL</button>
             </div>
          </div>
        )}

        {showHelp && (
          <div className="absolute inset-0 z-[180] flex items-center justify-center bg-stone-950/98 backdrop-blur-3xl p-10 text-center animate-fade-in sm:rounded-[3rem]">
            <div className="flex flex-col items-center max-w-xs w-full">
              <div className="w-16 h-16 bg-stone-900 rounded-[1.5rem] mb-10 flex items-center justify-center border border-white/10 shadow-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
              </div>
              <h2 className="text-3xl font-[900] text-white mb-8 uppercase italic tracking-tight">Manual</h2>
              <div className="space-y-6 text-stone-400 text-sm font-bold uppercase tracking-[0.2em] text-center leading-relaxed">
                <p><span className="text-white">Tap blocks</span> to launch them in arrow direction.</p>
                <p>Blocks MUST reach the <span className="text-white">edge</span> to be cleared.</p>
                <p><span className="text-rose-500">Collision</span> with other blocks triggers failure.</p>
                <p className="text-indigo-400 text-[11px] mt-6 font-black ring-1 ring-indigo-500/30 p-3 rounded-xl bg-indigo-500/5">
                  RECOVERY: EVERY 10 MINS LIFE WILL RESTORE TO 3
                </p>
              </div>
              <button onClick={() => setShowHelp(false)} className="btn-premium mt-14 w-full py-5 rounded-2xl text-white font-black uppercase tracking-[0.2em] text-xs">READY</button>
            </div>
          </div>
        )}

        {(status === GameStatus.LOST || status === GameStatus.GAME_OVER) && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-8 text-center animate-fade-in sm:rounded-[3rem]">
             <div className="flex flex-col items-center max-w-xs w-full">
                <div className="w-20 h-20 bg-rose-600 rounded-[2rem] shadow-[0_20px_40px_rgba(225,29,72,0.5)] mb-10 flex items-center justify-center border-4 border-white/20">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="white" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <h2 className="text-4xl font-[900] text-white mb-5 italic uppercase tracking-tighter">IMPACT</h2>
                <div className="w-full flex flex-col gap-5 max-w-[220px]">
                  <button onClick={handleContinue} disabled={coins < CONTINUE_COST} className="btn-premium w-full py-5 rounded-2xl text-white font-[900] uppercase tracking-[0.2em] text-xs">
                    RETRY <span className="opacity-40 ml-2">({CONTINUE_COST}C)</span>
                  </button>
                  <button onClick={() => lives > 0 ? loadLevel(level) : setStatus(GameStatus.HOME)} className="text-stone-500 font-black uppercase tracking-[0.4em] text-[10px] py-2 transition-colors hover:text-white">
                    {lives > 0 ? 'START OVER' : 'QUIT'}
                  </button>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Footer Nav & Centered Branding */}
      <footer className="px-10 pb-12 pt-6 flex flex-col items-center gap-10 z-20 shrink-0 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent">
          <div className="flex justify-center gap-16">
            <button onClick={() => setStatus(GameStatus.HOME)} className="text-stone-500 hover:text-white transition-all active:scale-75"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg></button>
            <button onClick={() => setMuted(audioService.toggleMute())} className="text-stone-500 hover:text-white transition-all active:scale-75"><span className="text-2xl">{muted ? '🔇' : '🔊'}</span></button>
            <button onClick={() => loadLevel(level)} className="text-stone-500 hover:text-white transition-all active:scale-75"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg></button>
          </div>
          <div className="flex justify-center w-full">
             <BrandingLogo />
          </div>
      </footer>
    </div>
  );
};

export default App;