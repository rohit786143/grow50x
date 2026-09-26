'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, GROW50X_CORE_ABI } from '../../config/contracts';

export default function BoardsPage() {
  const [selectedBoardLevel, setSelectedBoardLevel] = useState<number>(1);
  const [targetBoardId, setTargetBoardId] = useState<string>('1');
  const [boardUnit, setBoardUnit] = useState<any>({
    boardId: 1,
    boardLevel: 1,
    filledCount: 0,
    positions: Array(7).fill({ pos: 0, label: '', id: null, wallet: null, status: 'Available' }),
  });

  useEffect(() => {
    loadBoardData();
  }, [selectedBoardLevel, targetBoardId]);

  const loadBoardData = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, provider);

      const bId = parseInt(targetBoardId) || 1;
      const positionsRaw = await coreContract.getBoardUnitPositions(bId);

      const labels = [
        'TOP (Root)',
        'Middle Left',
        'Middle Right',
        'Bottom Left 1',
        'Bottom Left 2',
        'Bottom Right 1',
        'Bottom Right 2',
      ];

      let filled = 0;
      const parsedPositions = await Promise.all(
        positionsRaw.map(async (posIdBig: any, idx: number) => {
          const pId = Number(posIdBig);
          if (pId > 0) {
            filled++;
            const uData = await coreContract.users(pId);
            return {
              pos: idx + 1,
              label: labels[idx],
              id: `GR${pId.toString().padStart(5, '0')}`,
              wallet: `${uData.wallet.substring(0, 6)}...${uData.wallet.substring(uData.wallet.length - 4)}`,
              status: 'Occupied',
            };
          }
          return {
            pos: idx + 1,
            label: labels[idx],
            id: null,
            wallet: null,
            status: 'Available',
          };
        })
      );

      setBoardUnit({
        boardId: bId,
        boardLevel: selectedBoardLevel,
        filledCount: filled,
        positions: parsedPositions,
      });
    } catch (err) {
      console.error('Error loading board data:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl">
        <div>
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Live Placement Tree</span>
          <h1 className="text-3xl font-black text-slate-100 mt-1">7-Position Board Visualizer</h1>
          <p className="text-xs text-slate-400 mt-1">
            Filling order: <strong className="text-slate-200 font-mono">TOP → BOTTOM, RIGHT → LEFT</strong>
          </p>
        </div>

        {/* Board Level & ID Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400">Board ID:</span>
            <input
              type="number"
              min={1}
              value={targetBoardId}
              onChange={(e) => setTargetBoardId(e.target.value)}
              className="w-16 bg-slate-950 text-slate-100 font-mono text-xs font-bold px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 gap-1">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedBoardLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
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
      </div>

      {/* Graphical Board Unit Tree */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col items-center justify-center min-h-[480px]">
        <div className="text-center mb-6">
          <span className="text-xs font-bold text-slate-400 uppercase">Board Unit #{boardUnit.boardId}</span>
          <p className="text-lg font-bold text-cyan-400">
            Board Level {selectedBoardLevel} ({boardUnit.filledCount} / 7 Positions Filled)
          </p>
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
  if (!item) return null;
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
