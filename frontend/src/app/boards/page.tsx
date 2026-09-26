'use client';

import React, { useState } from 'react';

export default function BoardsPage() {
  const [selectedBoardLevel, setSelectedBoardLevel] = useState<number>(1);

  // Mock 7-position board unit data
  const boardUnit = {
    boardId: 101,
    boardLevel: selectedBoardLevel,
    completed: false,
    filledCount: 5,
    positions: [
      { pos: 1, label: 'TOP (Root)', id: 'GR00001', wallet: '0x71C7...976F', status: 'Occupied' },
      { pos: 2, label: 'Middle Left', id: 'GR00002', wallet: '0x3A21...F81A', status: 'Occupied' },
      { pos: 3, label: 'Middle Right', id: 'GR00003', wallet: '0x99C2...014E', status: 'Occupied' },
      { pos: 4, label: 'Bottom Left 1', id: 'GR00004', wallet: '0x12F8...D091', status: 'Occupied' },
      { pos: 5, label: 'Bottom Left 2', id: 'GR00005', wallet: '0x8801...A110', status: 'Occupied' },
      { pos: 6, label: 'Bottom Right 1', id: null, wallet: null, status: 'Available' },
      { pos: 7, label: 'Bottom Right 2', id: null, wallet: null, status: 'Available' },
    ],
  };

  return (
    <div className="space-y-8">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl">
        <div>
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Placement Tree</span>
          <h1 className="text-3xl font-black text-slate-100 mt-1">7-Position Board Visualizer</h1>
          <p className="text-xs text-slate-400 mt-1">
            Filling order: <strong className="text-slate-200 font-mono">TOP → BOTTOM, RIGHT → LEFT</strong>
          </p>
        </div>

        {/* Board Level Selector */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 gap-1">
          {[1, 2, 3, 4, 5].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedBoardLevel(lvl)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                selectedBoardLevel === lvl
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Board {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Graphical Board Unit Tree */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col items-center justify-center min-h-[480px]">
        <div className="text-center mb-6">
          <span className="text-xs font-bold text-slate-400 uppercase">Board Unit #{boardUnit.boardId}</span>
          <p className="text-lg font-bold text-cyan-400">Board Level {selectedBoardLevel} ({boardUnit.filledCount} / 7 Positions Filled)</p>
        </div>

        {/* Pyramidal Node Hierarchy */}
        <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
          {/* Level 1: Position 1 (Top) */}
          <div className="flex justify-center">
            <PositionNode item={boardUnit.positions[0]} isTop />
          </div>

          {/* Level 2: Position 2 & 3 (Middle) */}
          <div className="grid grid-cols-2 gap-16 md:gap-32 w-full max-w-2xl">
            <PositionNode item={boardUnit.positions[1]} />
            <PositionNode item={boardUnit.positions[2]} />
          </div>

          {/* Level 3: Positions 4, 5, 6, 7 (Bottom) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <PositionNode item={boardUnit.positions[3]} />
            <PositionNode item={boardUnit.positions[4]} />
            <PositionNode item={boardUnit.positions[5]} />
            <PositionNode item={boardUnit.positions[6]} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PositionNode({ item, isTop = false }: { item: any; isTop?: boolean }) {
  const isOccupied = item.status === 'Occupied';

  return (
    <div
      className={`glass-card p-4 rounded-2xl border text-center transition-all duration-300 w-full ${
        isTop
          ? 'border-cyan-500/60 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
          : isOccupied
          ? 'border-emerald-500/40 bg-emerald-950/10'
          : 'border-slate-800 bg-slate-900/40 opacity-70'
      }`}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
        {item.label}
      </span>
      {isOccupied ? (
        <>
          <p className="text-base font-extrabold text-slate-100">{item.id}</p>
          <p className="text-[11px] font-mono text-cyan-400 mt-0.5">{item.wallet}</p>
          <span className="inline-block px-2 py-0.5 mt-2 text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/40 rounded-full">
            Occupied
          </span>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-slate-500 italic mt-1">Empty Slot</p>
          <span className="inline-block px-2 py-0.5 mt-3 text-[10px] font-semibold bg-slate-800 text-slate-400 rounded-full">
            Available
          </span>
        </>
      )}
    </div>
  );
}
