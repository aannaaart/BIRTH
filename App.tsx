
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Piece, PIECE_SIZE, SNAP_THRESHOLD, Vector2 } from './types';
import { PUZZLES, PIECE_OFFSETS } from './constants';
import PuzzlePiece from './components/PuzzlePiece';

const App: React.FC = () => {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef<Vector2>({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);

  // 計算目前還剩下哪些拼圖碎片可以產生
  const availablePool = useMemo(() => {
    const allPossible: { puzzleId: number; pieceIndex: number }[] = [];
    for (let pId = 0; pId < 10; pId++) {
      for (let idx = 0; idx < 4; idx++) {
        allPossible.push({ puzzleId: pId, pieceIndex: idx });
      }
    }

    // 過濾掉已經在 pieces 裡的
    return allPossible.filter(pos => 
      !pieces.some(p => p.puzzleId === pos.puzzleId && p.pieceIndex === pos.pieceIndex)
    );
  }, [pieces]);

  const spawnPiece = useCallback(() => {
    if (availablePool.length === 0) return;

    // 從剩餘的池子裡隨機挑一個
    const randomIndex = Math.floor(Math.random() * availablePool.length);
    const { puzzleId, pieceIndex } = availablePool[randomIndex];

    const newPiece: Piece = {
      id: uuidv4(),
      puzzleId,
      pieceIndex,
      position: { 
        x: 50 + Math.random() * (window.innerWidth - 200), 
        y: 150 + Math.random() * (window.innerHeight - 350) 
      },
      rotation: [0, 90, 180, 270][Math.floor(Math.random() * 4)],
      groupId: null
    };

    setPieces(prev => [...prev, newPiece]);
  }, [availablePool]);

  const handleDragStart = (id: string, e: React.MouseEvent | React.TouchEvent) => {
    if ('button' in e && e.button !== 0) return;

    const piece = pieces.find(p => p.id === id);
    if (!piece) return;

    setPieces(prev => {
      const active = prev.find(p => p.id === id);
      if (!active) return prev;
      
      const relatedIds = active.groupId 
        ? prev.filter(p => p.groupId === active.groupId).map(p => p.id)
        : [id];
      
      const related = prev.filter(p => relatedIds.includes(p.id));
      const others = prev.filter(p => !relatedIds.includes(p.id));
      return [...others, ...related];
    });

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragOffset.current = {
      x: clientX - piece.position.x,
      y: clientY - piece.position.y
    };
    setDraggingId(id);
  };

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!draggingId) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const newX = clientX - dragOffset.current.x;
    const newY = clientY - dragOffset.current.y;

    setPieces(prev => {
      const activePiece = prev.find(p => p.id === draggingId);
      if (!activePiece) return prev;

      const dx = newX - activePiece.position.x;
      const dy = newY - activePiece.position.y;

      if (activePiece.groupId) {
        return prev.map(p => 
          p.groupId === activePiece.groupId 
            ? { ...p, position: { x: p.position.x + dx, y: p.position.y + dy } }
            : p
        );
      }

      return prev.map(p => 
        p.id === draggingId ? { ...p, position: { x: newX, y: newY } } : p
      );
    });
  }, [draggingId]);

  const handleDragEnd = useCallback(() => {
    if (!draggingId) return;

    setPieces(prev => {
      const active = prev.find(p => p.id === draggingId);
      if (!active) return prev;

      const draggingGroup = active.groupId 
        ? prev.filter(p => p.groupId === active.groupId)
        : [active];

      let bestSnap = null;
      let minDistance = SNAP_THRESHOLD;

      const candidates = prev.filter(p => 
        p.puzzleId === active.puzzleId && 
        p.rotation === active.rotation &&
        (!active.groupId || p.groupId !== active.groupId)
      );

      for (const dPiece of draggingGroup) {
        for (const target of candidates) {
          const offD = PIECE_OFFSETS[dPiece.pieceIndex];
          const offT = PIECE_OFFSETS[target.pieceIndex];

          const rad = (active.rotation * Math.PI) / 180;
          const cos = Math.round(Math.cos(rad));
          const sin = Math.round(Math.sin(rad));

          const gridDx = offD.x - offT.x;
          const gridDy = offD.y - offT.y;

          const rotatedDx = (gridDx * cos - gridDy * sin) * PIECE_SIZE;
          const rotatedDy = (gridDx * sin + gridDy * cos) * PIECE_SIZE;

          const idealX = target.position.x + rotatedDx;
          const idealY = target.position.y + rotatedDy;

          const dist = Math.hypot(dPiece.position.x - idealX, dPiece.position.y - idealY);

          if (dist < minDistance) {
            minDistance = dist;
            bestSnap = {
              dx: idealX - dPiece.position.x,
              dy: idealY - dPiece.position.y,
              targetGroupId: target.groupId || target.id
            };
          }
        }
      }

      if (bestSnap) {
        const newGroupId = bestSnap.targetGroupId;
        const movingIds = draggingGroup.map(p => p.id);

        return prev.map(p => {
          if (movingIds.includes(p.id)) {
            return {
              ...p,
              position: { x: p.position.x + bestSnap.dx, y: p.position.y + bestSnap.dy },
              groupId: newGroupId
            };
          }
          if (p.id === bestSnap.targetGroupId || (p.groupId && p.groupId === bestSnap.targetGroupId)) {
            return { ...p, groupId: newGroupId };
          }
          return p;
        });
      }

      return prev;
    });

    setDraggingId(null);
  }, [draggingId]);

  const rotatePiece = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setPieces(prev => {
      const target = prev.find(p => p.id === id);
      if (!target) return prev;

      if (target.groupId) {
        const pivot = target.position;
        return prev.map(p => {
          if (p.groupId === target.groupId) {
            const relX = p.position.x - pivot.x;
            const relY = p.position.y - pivot.y;
            return {
              ...p,
              position: {
                x: pivot.x - relY,
                y: pivot.y + relX
              },
              rotation: (p.rotation + 90) % 360
            };
          }
          return p;
        });
      }

      return prev.map(p => 
        p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      );
    });
  }, []);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [draggingId, handleDragMove, handleDragEnd]);

  const isFinished = availablePool.length === 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-black select-none">
      <header className="p-6 flex flex-col items-center justify-center z-50 pointer-events-none">
        <button 
          onClick={spawnPiece}
          disabled={isFinished}
          className={`px-10 py-4 transition-all rounded-xl font-black shadow-2xl text-white ring-4 pointer-events-auto text-xl tracking-widest ${
            isFinished 
            ? 'bg-gray-700 cursor-not-allowed opacity-50 ring-gray-600' 
            : 'bg-red-600 hover:bg-red-500 active:scale-95 ring-white/10 hover:ring-white/30'
          }`}
        >
          {isFinished ? `已領取完畢 (40/40)` : `獲取碎片 (${pieces.length}/40)`}
        </button>
        {!isFinished && (
           <p className="text-white/40 text-xs mt-2 font-mono tracking-tighter uppercase">
             Click to spawn unique parts
           </p>
        )}
      </header>
      <div ref={boardRef} className="relative flex-1 w-full h-full overflow-hidden">
        {pieces.map(piece => {
          const activePiece = pieces.find(p => p.id === draggingId);
          const isDragging = draggingId === piece.id || (activePiece?.groupId && piece.groupId === activePiece.groupId);
          return (
            <PuzzlePiece
              key={piece.id}
              piece={piece}
              config={PUZZLES[piece.puzzleId]}
              onMouseDown={(e) => handleDragStart(piece.id, e)}
              onContextMenu={(e) => rotatePiece(piece.id, e)}
              isDragging={!!isDragging}
            />
          );
        })}
      </div>
    </div>
  );
};

export default App;
