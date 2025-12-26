import React, { useMemo } from 'react';
import { Cell, CellStatus, Direction } from '../types';

interface BlockProps {
  cell: Cell;
  onClick: (x: number, y: number) => void;
  onHover: (x: number, y: number) => void;
  onLeave: () => void;
  cellSize: number;
  isAdjacent?: boolean;
  isWarning?: boolean; 
  isHit?: boolean;     
  isSelected?: boolean; 
}

const Block: React.FC<BlockProps> = ({ cell, onClick, onHover, onLeave, cellSize, isAdjacent, isWarning, isHit, isSelected }) => {
  const { direction, status, x, y } = cell;

  const swayDelay = useMemo(() => Math.random() * -5, [cell.id]);
  const entryDelay = useMemo(() => (x + y) * 0.045, [x, y]); 
  
  const borderWidth = Math.max(4, Math.round(cellSize * 0.16));

  const getRotation = (dir: Direction) => {
    switch (dir) {
      case Direction.UP: return 0;
      case Direction.DOWN: return 180;
      case Direction.LEFT: return -90;
      case Direction.RIGHT: return 90;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (status === CellStatus.IDLE) {
      onClick(x, y);
    }
  };

  const getColorClasses = (dir: Direction) => {
    switch (dir) {
      case Direction.UP: return 'from-amber-400 via-amber-500 to-amber-600 border-stone-800/10 shadow-[0_8px_16px_-4px_rgba(245,158,11,0.5)]'; 
      case Direction.DOWN: return 'from-emerald-400 via-emerald-500 to-emerald-600 border-stone-800/10 shadow-[0_8px_16px_-4px_rgba(16,185,129,0.5)]';
      case Direction.LEFT: return 'from-sky-400 via-sky-500 to-sky-600 border-stone-800/10 shadow-[0_8px_16px_-4px_rgba(14,165,233,0.5)]';
      case Direction.RIGHT: return 'from-rose-400 via-rose-500 to-rose-600 border-stone-800/10 shadow-[0_8px_16px_-4px_rgba(244,63,94,0.5)]';
    }
  };

  const baseClasses = `absolute flex items-center justify-center rounded-[30%] cursor-pointer transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) select-none text-white z-20 backdrop-blur-md bg-gradient-to-br preserve-3d`;
  const colorClass = getColorClasses(direction);
  
  let animStyle: React.CSSProperties = {
    width: `${cellSize - 8}px`,  
    height: `${cellSize - 8}px`,
    left: `${x * cellSize + 4}px`,
    top: `${y * cellSize + 4}px`,
    borderBottomWidth: `${borderWidth}px`,
  };

  let animClass = '';

  if (status === CellStatus.IDLE) {
    animStyle.animationDelay = `${swayDelay}s`;
    
    // DISTINCT BLOCKER HIGHLIGHT: Pulsating red outline for obstacles in path
    if (isWarning && !isSelected) {
       animClass = 'z-[35] scale-[1.1] ring-[10px] ring-rose-500 ring-offset-6 ring-offset-stone-900 animate-blocker-pulse brightness-125';
    }
    
    // Path Tactical Context: Adjacent blocks to the potential path
    if (isAdjacent && !isWarning && !isSelected) {
       animClass = 'ring-[4px] ring-white/50 brightness-110 scale-[1.06] shadow-[0_0_30px_rgba(255,255,255,0.3)]';
    }

    // CONFIRMED SELECTION GLOW: When hovering or active focus
    if (isSelected) {
       animClass = 'animate-selection-pulse ring-[12px] ring-white z-50 brightness-150 shadow-[0_0_60px_rgba(255,255,255,0.8)]';
       animStyle.borderBottomWidth = '0px';
       animStyle.transform = `translateY(${borderWidth / 2}px)`;
    }
    
    // Initial Entrance
    if (!isHit && !isWarning && !isSelected && !isAdjacent) {
       animStyle.animation = `blockEnter 0.65s cubic-bezier(0.22, 1, 0.36, 1) backwards`;
       animStyle.animationDelay = `${entryDelay}s`;
    }
  }

  // MOVING STATE: Ultra-premium fly-out with squash & stretch and a snap effect
  if (status === CellStatus.MOVING) {
    animStyle.borderBottomWidth = '0px';
    // Bright flash at start of move to confirm selection
    animClass = 'z-40 brightness-[2.5] ring-[22px] ring-white/90 shadow-[0_0_120px_rgba(255,255,255,1)] ';
    switch (direction) {
      case Direction.UP: animClass += 'animate-fly-out-up'; break;
      case Direction.DOWN: animClass += 'animate-fly-out-down'; break;
      case Direction.LEFT: animClass += 'animate-fly-out-left'; break;
      case Direction.RIGHT: animClass += 'animate-fly-out-right'; break;
    }
    animClass += ' opacity-100';
  } 
  
  // COLLISION STATE: Impact Highlight with sharp Snap Back feel
  else if (status === CellStatus.COLLIDED) {
    animClass = 'animate-collision-impact z-30 ring-[15px] ring-rose-600 border-rose-950 bg-rose-700 shadow-[0_0_120px_rgba(244,63,94,1)] brightness-[1.8]';
    animStyle.borderBottomWidth = '0px';
  }

  return (
    <div
      className={`${baseClasses} ${colorClass} ${animClass}`}
      style={animStyle}
      onClick={handleClick}
      onMouseEnter={() => status === CellStatus.IDLE && onHover(x, y)}
      onMouseLeave={onLeave}
    >
       {/* Premium gloss layer */}
       <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-transparent opacity-60 rounded-[inherit] pointer-events-none shadow-[inset_0_4px_10px_rgba(255,255,255,0.6)]"></div>
       
       {/* Danger Icon for Blocker Blocks */}
       {isWarning && status === CellStatus.IDLE && !isSelected && (
         <div className="absolute inset-0 bg-rose-600/50 backdrop-blur-[4px] rounded-[inherit] pointer-events-none flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[70%] h-[70%] text-white drop-shadow-[0_0_25px_rgba(255,0,0,1)] opacity-100 animate-pulse">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
            </svg>
         </div>
       )}
       
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ transform: `rotate(${getRotation(direction)}deg)` }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[62%] h-[62%] drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] transition-transform duration-200">
          <path d="M12 2L22 12H16V22H8V12H2L12 2Z" />
        </svg>
      </div>
    </div>
  );
};

export default Block;