import { useMemo } from 'react';
import { PIECE_INFO, FILE_LABELS, RANK_LABELS, ROWS, COLS } from '../game/constants';

// Citadel positions (game coordinates)
const LEFT_CITADEL = { row: 8, col: -1 };   // white king enters for draw
const RIGHT_CITADEL = { row: 1, col: 11 };  // black king enters for draw

function PieceToken({ piece, isSelected, inCheck }) {
  if (!piece) return null;
  const info = PIECE_INFO[piece.type];
  const label = info ? (piece.color === 'w' ? info.label : info.labelB) : piece.type;
  const abbr = info?.abbr || piece.type;

  // For standard chess symbols use larger display; for custom use abbr
  const useSymbol = ['K','N','R'].includes(piece.type) || piece.type === 'F' && false;
  const isPawnType = piece.type.startsWith('p') && piece.type !== 'PR';

  return (
    <div className={`piece ${piece.color === 'w' ? 'piece-white' : 'piece-black'} ${isSelected ? 'piece-selected' : ''} ${inCheck ? 'piece-in-check' : ''}`}>
      {isPawnType ? (
        <div className="piece-pawn">
          <span className="pawn-symbol">{piece.color === 'w' ? '♙' : '♟'}</span>
          <span className="pawn-type">{abbr}</span>
        </div>
      ) : (
        <div className="piece-major">
          <span className="piece-symbol">{label}</span>
          <span className="piece-abbr">{abbr}</span>
        </div>
      )}
    </div>
  );
}

function Square({ row, col, piece, isSelected, isLegalMove, isLastMove, inCheck, isCitadel, citadelOccupant, citadelType, onSquareClick }) {
  const isLight = (row + col) % 2 === 0;

  let cls = `square ${isLight ? 'square-light' : 'square-dark'}`;
  if (isSelected) cls += ' square-selected';
  if (isLegalMove) cls += ' square-legal';
  if (isLastMove) cls += ' square-last-move';
  if (isCitadel) cls += ` square-citadel square-citadel-${citadelType}`;

  const displayPiece = isCitadel ? citadelOccupant : piece;

  return (
    <div className={cls} onClick={() => onSquareClick(row, col, isCitadel)}>
      {displayPiece && (
        <PieceToken piece={displayPiece} isSelected={isSelected} inCheck={inCheck} />
      )}
      {isLegalMove && !displayPiece && <div className="move-dot" />}
      {isLegalMove && displayPiece && <div className="capture-ring" />}
    </div>
  );
}

export default function Board({ state, playerColor, selectedPos, legalMoves, swapModeActive, onSquareClick }) {
  if (!state) return null;
  const { board, lastMove, status, leftCitadel, rightCitadel } = state;

  // Find all royal pieces in check
  const royalsInCheck = useMemo(() => {
    if (status !== 'check') return new Set();
    const s = new Set();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const piece = board[r][c];
        if (piece && ['K', 'PR', 'AK'].includes(piece.type)) {
          // We'll just highlight the current player's king when in check
          if (piece.color === state.currentTurn) {
            s.add(`${r},${c}`);
          }
        }
      }
    }
    return s;
  }, [board, status, state.currentTurn]);

  function isLegalDest(row, col) {
    return legalMoves.some(m => m.row === row && m.col === col);
  }

  function isLastMoveSq(row, col) {
    if (!lastMove) return false;
    return (lastMove.from.row === row && lastMove.from.col === col) ||
           (lastMove.to.row === row && lastMove.to.col === col);
  }

  // Render rows from top (row 9) to bottom (row 0)
  const rows = [];
  for (let displayRow = 0; displayRow < ROWS; displayRow++) {
    const gameRow = ROWS - 1 - displayRow; // row 9 displayed first

    const cells = [];

    // LEFT CITADEL COLUMN (only at displayRow 1 = gameRow 8)
    if (gameRow === LEFT_CITADEL.row) {
      cells.push(
        <Square
          key="citadel-left"
          row={LEFT_CITADEL.row} col={LEFT_CITADEL.col}
          piece={null}
          isCitadel={true} citadelType="left" citadelOccupant={leftCitadel}
          isLegalMove={isLegalDest(LEFT_CITADEL.row, LEFT_CITADEL.col)}
          isSelected={false} isLastMove={false} inCheck={false}
          onSquareClick={onSquareClick}
        />
      );
    } else {
      cells.push(<div key="citadel-left-spacer" className="citadel-spacer" />);
    }

    // MAIN BOARD COLUMNS (0–10)
    for (let col = 0; col < COLS; col++) {
      const piece = board[gameRow][col];
      const posKey = `${gameRow},${col}`;
      cells.push(
        <Square
          key={`${gameRow}-${col}`}
          row={gameRow} col={col}
          piece={piece}
          isSelected={selectedPos?.row === gameRow && selectedPos?.col === col}
          isLegalMove={isLegalDest(gameRow, col)}
          isLastMove={isLastMoveSq(gameRow, col)}
          inCheck={royalsInCheck.has(posKey)}
          isCitadel={false}
          onSquareClick={onSquareClick}
        />
      );
    }

    // RIGHT CITADEL COLUMN (only at displayRow 8 = gameRow 1)
    if (gameRow === RIGHT_CITADEL.row) {
      cells.push(
        <Square
          key="citadel-right"
          row={RIGHT_CITADEL.row} col={RIGHT_CITADEL.col}
          piece={null}
          isCitadel={true} citadelType="right" citadelOccupant={rightCitadel}
          isLegalMove={isLegalDest(RIGHT_CITADEL.row, RIGHT_CITADEL.col)}
          isSelected={false} isLastMove={false} inCheck={false}
          onSquareClick={onSquareClick}
        />
      );
    } else {
      cells.push(<div key="citadel-right-spacer" className="citadel-spacer" />);
    }

    rows.push(
      <div key={gameRow} className="board-row">
        {/* Rank label */}
        <div className="rank-label">{RANK_LABELS[gameRow]}</div>
        {cells}
        <div className="rank-label">{RANK_LABELS[gameRow]}</div>
      </div>
    );
  }

  // File labels
  const fileLabels = (
    <div className="file-labels">
      <div className="rank-label-spacer" />
      <div className="citadel-spacer" />
      {FILE_LABELS.map(f => <div key={f} className="file-label">{f}</div>)}
      <div className="citadel-spacer" />
      <div className="rank-label-spacer" />
    </div>
  );

  return (
    <div className={`board-wrapper ${playerColor === 'b' ? 'board-flipped' : ''}`}>
      {fileLabels}
      <div className="board">{rows}</div>
      {fileLabels}
    </div>
  );
}
