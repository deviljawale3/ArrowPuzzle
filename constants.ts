import { RodId, TierInfo } from './types';

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 1200;

export const ROD_IDS: RodId[] = ['A', 'B', 'C'];

export const DISK_COLORS = [
  'bg-sky-400',     // 1
  'bg-emerald-400', // 2
  'bg-amber-400',   // 3
  'bg-orange-500',  // 4
  'bg-rose-500',    // 5
  'bg-indigo-500',  // 6
  'bg-violet-500',  // 7
  'bg-fuchsia-500', // 8
  'bg-pink-500',    // 9
  'bg-teal-500',    // 10
];

export const SOLVE_SPEED_MS = 350;

export interface EnhancedTierInfo extends TierInfo {
  theme: string;
  glow: string;
  phaseName: string;
}

const PHASES = [
  "GENESIS", "NEURAL", "SYNAPSE", "QUANTUM", "KINETIC", 
  "OSMOSIS", "VECTOR", "MANTRA", "AETHER", "OMEGA"
];

const CONFIGS: {start: RodId, target: RodId}[] = [
  { start: 'A', target: 'C' },
  { start: 'A', target: 'B' },
  { start: 'B', target: 'C' },
  { start: 'B', target: 'A' },
  { start: 'C', target: 'B' },
  { start: 'C', target: 'A' },
];

export const getTierForLevel = (lvl: number): EnhancedTierInfo => {
  // Logic shifts configuration every 20 levels
  const logicIndex = Math.floor((lvl - 1) / 20) % CONFIGS.length;
  const { start: startRod, target: targetRod } = CONFIGS[logicIndex];
  
  // Phase name advances every 120 levels
  const phaseIndex = Math.min(Math.floor((lvl - 1) / 120), PHASES.length - 1);
  const phaseName = PHASES[phaseIndex];

  // Smoother Disk count progression for 1200 levels
  let disks = 3;
  if (lvl >= 1100) disks = 10;
  else if (lvl >= 950) disks = 9;
  else if (lvl >= 750) disks = 8;
  else if (lvl >= 500) disks = 7;
  else if (lvl >= 300) disks = 6;
  else if (lvl >= 150) disks = 5;
  else if (lvl >= 80) disks = 4;
  else if (lvl >= 30) disks = 4; // Intro levels stay easier
  else disks = 3;

  const commonProps = { disks, startRod, targetRod, phaseName };

  // Theme progression
  if (lvl <= 120) return { ...commonProps, name: 'NOVICE', color: 'text-emerald-400', theme: 'emerald', glow: 'shadow-emerald-500/20' };
  if (lvl <= 360) return { ...commonProps, name: 'APPRENTICE', color: 'text-teal-400', theme: 'teal', glow: 'shadow-teal-500/20' };
  if (lvl <= 600) return { ...commonProps, name: 'ADEPT', color: 'text-sky-400', theme: 'sky', glow: 'shadow-sky-500/20' };
  if (lvl <= 840) return { ...commonProps, name: 'EXPERT', color: 'text-blue-400', theme: 'blue', glow: 'shadow-blue-500/20' };
  if (lvl <= 1080) return { ...commonProps, name: 'MASTER', color: 'text-indigo-400', theme: 'indigo', glow: 'shadow-indigo-500/20' };
  
  return { 
    ...commonProps,
    name: 'SINGULARITY', 
    color: 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]', 
    theme: 'slate', 
    glow: 'shadow-white/40' 
  };
};