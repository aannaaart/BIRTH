
import React, { useMemo } from 'react';
import { Piece, PuzzleConfig, PIECE_SIZE } from '../types';

interface PuzzlePieceProps {
  piece: Piece;
  config: PuzzleConfig;
  onMouseDown: (e: React.MouseEvent | React.TouchEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  isDragging: boolean;
}

const PuzzlePiece: React.FC<PuzzlePieceProps> = ({ 
  piece, 
  config, 
  onMouseDown, 
  onContextMenu,
  isDragging 
}) => {
  // 建立連貫的紋路系統
  const patternStyle = useMemo(() => {
    const stripeColor = 'rgba(255, 255, 255, 0.2)';
    const gapColor = 'transparent';
    
    // 使用 45 度斜紋。
    // 關鍵在於 backgroundPosition：透過 -pieceIndex * PIECE_SIZE，
    // 我們讓每一塊拼圖像是從一張巨大的紋路畫布中「剪」下來的特定位置。
    // 當它們拼在一起時，纹路就會剛好接上。
    return {
      backgroundImage: `
        linear-gradient(to right, rgba(0,0,0,0.1), rgba(255,255,255,0.1)),
        repeating-linear-gradient(
          45deg,
          ${stripeColor},
          ${stripeColor} 15px,
          ${gapColor} 15px,
          ${gapColor} 30px
        )
      `,
      backgroundPosition: `${-piece.pieceIndex * PIECE_SIZE}px 0px`,
      backgroundSize: `${PIECE_SIZE * 4}px 100%`
    };
  }, [piece.pieceIndex]);

  const pieceStyle: React.CSSProperties = {
    position: 'absolute',
    left: piece.position.x,
    top: piece.position.y,
    width: PIECE_SIZE,
    height: PIECE_SIZE,
    backgroundColor: config.color,
    ...patternStyle,
    transform: `rotate(${piece.rotation}deg)`,
    transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease, left 0.15s ease-out, top 0.15s ease-out',
    zIndex: isDragging ? 100 : (piece.groupId ? 20 : 10),
    cursor: piece.groupId ? 'grab' : 'pointer',
    boxShadow: isDragging 
      ? '0 30px 50px -10px rgb(0 0 0 / 0.9)' 
      : '0 10px 20px -5px rgb(0 0 0 / 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    borderRadius: 
        piece.pieceIndex === 0 ? '20px 0 0 20px' : 
        piece.pieceIndex === 3 ? '0 20px 20px 0' : '0'
  };

  return (
    <div
      style={pieceStyle}
      onMouseDown={onMouseDown}
      onTouchStart={onMouseDown}
      onContextMenu={onContextMenu}
      className={`select-none group ${piece.groupId ? 'ring-2 ring-white/40' : ''}`}
    >
      {/* 強化光影邊界，讓每一塊在拼起來時還是能看到細微接縫感 */}
      <div className="absolute inset-y-0 left-0 w-[1px] bg-white/10" />
      <div className="absolute inset-y-0 right-0 w-[1px] bg-black/20" />

      {/* 內部光澤 */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/20 pointer-events-none" />

      {/* 標誌與資訊 */}
      <div className="relative flex flex-col items-center pointer-events-none select-none">
        <span className="text-white font-black text-6xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] opacity-90">
            {config.name.charAt(0)}
        </span>
        <div className="mt-2 px-3 py-1 bg-black/40 rounded-full text-white/80 text-[11px] font-black font-mono tracking-widest uppercase border border-white/20">
          PT-{piece.pieceIndex + 1}
        </div>
      </div>

      {/* 吸附成功後的微光特效 */}
      {piece.groupId && (
          <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />
      )}
      
      {/* 拖曳時的發光外框 */}
      {isDragging && (
        <div className="absolute inset-[-6px] border-[3px] border-white/50 rounded-2xl pointer-events-none blur-[1px]" />
      )}
    </div>
  );
};

export default PuzzlePiece;
