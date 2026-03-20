// Tamerlane Chess Move Generation
// All piece movement rules as documented in historical sources

const { ROWS, COLS, isPawn, isRoyal, PAWN_PROMOTES_TO, LEFT_CITADEL, RIGHT_CITADEL } = require('./constants');

// ── Helpers ────────────────────────────────────────────────────────────────

function inBounds(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

function isCitadel(pos) {
  return (pos.row === LEFT_CITADEL.row && pos.col === LEFT_CITADEL.col) ||
         (pos.row === RIGHT_CITADEL.row && pos.col === RIGHT_CITADEL.col);
}

function getCell(board, row, col) {
  if (!inBounds(row, col)) return undefined;
  return board[row][col];
}

// ── Piece Move Generators (pseudo-legal, ignore check) ────────────────────

function getKingMoves(board, row, col, color) {
  const moves = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr, c = col + dc;
      if (!inBounds(r, c)) continue;
      const cell = board[r][c];
      if (!cell || cell.color !== color) {
        moves.push({ row: r, col: c });
      }
    }
  }
  // Citadel moves (king can enter opponent's citadel)
  // White king can enter LEFT_CITADEL (row 8, col -1)
  // Black king can enter RIGHT_CITADEL (row 1, col 11)
  if (color === 'w' && row === LEFT_CITADEL.row && col === 0) {
    moves.push({ ...LEFT_CITADEL, isCitadelMove: true });
  }
  if (color === 'b' && row === RIGHT_CITADEL.row && col === COLS - 1) {
    moves.push({ ...RIGHT_CITADEL, isCitadelMove: true });
  }
  return moves;
}

function getFerzMoves(board, row, col, color) {
  // Ferz (General): 1 square diagonally
  const moves = [];
  for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
    const r = row + dr, c = col + dc;
    if (!inBounds(r, c)) continue;
    const cell = board[r][c];
    if (!cell || cell.color !== color) moves.push({ row: r, col: c });
  }
  return moves;
}

function getVizirMoves(board, row, col, color) {
  // Vizir (Governor): 1 square orthogonally
  const moves = [];
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    const r = row + dr, c = col + dc;
    if (!inBounds(r, c)) continue;
    const cell = board[r][c];
    if (!cell || cell.color !== color) moves.push({ row: r, col: c });
  }
  return moves;
}

function getGiraffeMoves(board, row, col, color) {
  // Giraffe: 1 diagonal step (passthrough, must be empty) + 3+ orthogonal steps (no jump)
  const moves = [];
  const diagDirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
  const orthoDirs = [[0,1],[0,-1],[1,0],[-1,0]];

  for (const [dr, dc] of diagDirs) {
    const midR = row + dr, midC = col + dc;
    if (!inBounds(midR, midC)) continue;
    if (board[midR][midC] !== null) continue; // Must pass through empty square

    for (const [or, oc] of orthoDirs) {
      for (let step = 1; ; step++) {
        const r = midR + or * step;
        const c = midC + oc * step;
        if (!inBounds(r, c)) break;
        const cell = board[r][c];
        if (cell !== null) {
          if (step >= 3 && cell.color !== color) moves.push({ row: r, col: c });
          break; // Blocked
        }
        if (step >= 3) moves.push({ row: r, col: c });
      }
    }
  }
  return moves;
}

function getPicketMoves(board, row, col, color) {
  // Picket (Scout): bishop but minimum 2 squares
  const moves = [];
  for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
    for (let step = 1; ; step++) {
      const r = row + dr * step, c = col + dc * step;
      if (!inBounds(r, c)) break;
      const cell = board[r][c];
      if (cell !== null) {
        if (step >= 2 && cell.color !== color) moves.push({ row: r, col: c });
        break;
      }
      if (step >= 2) moves.push({ row: r, col: c });
    }
  }
  return moves;
}

function getKnightMoves(board, row, col, color) {
  // Standard L-shape jump
  const moves = [];
  for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
    const r = row + dr, c = col + dc;
    if (!inBounds(r, c)) continue;
    const cell = board[r][c];
    if (!cell || cell.color !== color) moves.push({ row: r, col: c });
  }
  return moves;
}

function getRookMoves(board, row, col, color) {
  // Sliding orthogonally
  const moves = [];
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    for (let step = 1; ; step++) {
      const r = row + dr * step, c = col + dc * step;
      if (!inBounds(r, c)) break;
      const cell = board[r][c];
      if (cell) {
        if (cell.color !== color) moves.push({ row: r, col: c });
        break;
      }
      moves.push({ row: r, col: c });
    }
  }
  return moves;
}

function getElephantMoves(board, row, col, color) {
  // Jumps exactly 2 squares diagonally (ignores piece in between)
  const moves = [];
  for (const [dr, dc] of [[-2,-2],[-2,2],[2,-2],[2,2]]) {
    const r = row + dr, c = col + dc;
    if (!inBounds(r, c)) continue;
    const cell = board[r][c];
    if (!cell || cell.color !== color) moves.push({ row: r, col: c });
  }
  return moves;
}

function getCamelMoves(board, row, col, color) {
  // Jumps (1 diagonal + 2 orthogonal) = (1,3) leaper
  // From (r,c): can jump to any (r±1, c±3) or (r±3, c±1)
  const moves = [];
  for (const [dr, dc] of [[-1,-3],[-1,3],[1,-3],[1,3],[-3,-1],[-3,1],[3,-1],[3,1]]) {
    const r = row + dr, c = col + dc;
    if (!inBounds(r, c)) continue;
    const cell = board[r][c];
    if (!cell || cell.color !== color) moves.push({ row: r, col: c });
  }
  return moves;
}

function getDabbabasMoves(board, row, col, color) {
  // Dabbaba (War Engine): jumps exactly 2 squares orthogonally
  const moves = [];
  for (const [dr, dc] of [[-2,0],[2,0],[0,-2],[0,2]]) {
    const r = row + dr, c = col + dc;
    if (!inBounds(r, c)) continue;
    const cell = board[r][c];
    if (!cell || cell.color !== color) moves.push({ row: r, col: c });
  }
  return moves;
}

function getPawnMoves(board, row, col, color, pawnType) {
  // Pawns: move 1 forward, capture 1 diagonally forward
  // No double-step, no en passant
  const moves = [];
  const forward = color === 'w' ? 1 : -1;

  // Forward move
  const fr = row + forward;
  if (inBounds(fr, col) && !board[fr][col]) {
    const promotionRank = color === 'w' ? ROWS - 1 : 0;
    if (fr === promotionRank) {
      moves.push({ row: fr, col, promotion: PAWN_PROMOTES_TO[pawnType] || 'Q' });
    } else {
      moves.push({ row: fr, col });
    }
  }

  // Diagonal captures
  for (const dc of [-1, 1]) {
    const cr = row + forward, cc = col + dc;
    if (!inBounds(cr, cc)) continue;
    const cell = board[cr][cc];
    if (cell && cell.color !== color) {
      const promotionRank = color === 'w' ? ROWS - 1 : 0;
      if (cr === promotionRank) {
        moves.push({ row: cr, col: cc, promotion: PAWN_PROMOTES_TO[pawnType] || 'Q' });
      } else {
        moves.push({ row: cr, col: cc });
      }
    }
  }
  return moves;
}

// ── Get pseudo-legal moves for a piece ───────────────────────────────────

function getPseudoLegalMoves(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  const { type, color } = piece;

  switch (type) {
    case 'K': case 'PR': case 'AK': return getKingMoves(board, row, col, color);
    case 'F': return getFerzMoves(board, row, col, color);
    case 'V': return getVizirMoves(board, row, col, color);
    case 'G': return getGiraffeMoves(board, row, col, color);
    case 'P': return getPicketMoves(board, row, col, color);
    case 'N': return getKnightMoves(board, row, col, color);
    case 'R': return getRookMoves(board, row, col, color);
    case 'E': return getElephantMoves(board, row, col, color);
    case 'C': return getCamelMoves(board, row, col, color);
    case 'D': return getDabbabasMoves(board, row, col, color);
    default:
      if (isPawn(type)) return getPawnMoves(board, row, col, color, type);
      return [];
  }
}

// ── Attack & Check Detection ──────────────────────────────────────────────

// Returns true if square (row, col) is attacked by any piece of attackerColor
function isSquareAttacked(board, row, col, attackerColor) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const piece = board[r][c];
      if (!piece || piece.color !== attackerColor) continue;
      const moves = getPseudoLegalMoves(board, r, c);
      if (moves.some(m => m.row === row && m.col === col)) return true;
    }
  }
  return false;
}

// Find all royal pieces of a given color
function findRoyals(board, color) {
  const royals = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color && isRoyal(piece.type)) {
        royals.push({ row: r, col: c });
      }
    }
  }
  return royals;
}

// Is the given color in check? (any royal attacked)
function isInCheck(board, color) {
  const royals = findRoyals(board, color);
  const opponent = color === 'w' ? 'b' : 'w';
  return royals.some(pos => isSquareAttacked(board, pos.row, pos.col, opponent));
}

// ── Legal Move Filtering (removes moves that leave own royals in check) ──

function applyMoveToBoard(board, from, to) {
  // Returns a new board with the move applied (no special rules, just piece movement)
  const newBoard = board.map(row => row.slice());
  const piece = newBoard[from.row][from.col];
  newBoard[to.row][to.col] = to.promotion ? { type: to.promotion, color: piece.color } : piece;
  newBoard[from.row][from.col] = null;
  return newBoard;
}

function getLegalMoves(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  const pseudo = getPseudoLegalMoves(board, row, col);
  const legal = [];

  for (const move of pseudo) {
    if (move.isCitadelMove) {
      legal.push(move); // Citadel moves are always legal (draw condition, not check-related)
      continue;
    }
    const newBoard = applyMoveToBoard(board, { row, col }, move);
    if (!isInCheck(newBoard, piece.color)) {
      legal.push(move);
    }
  }
  return legal;
}

// Get all legal moves for all pieces of a given color
function getAllLegalMoves(board, color) {
  const allMoves = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const moves = getLegalMoves(board, r, c);
        moves.forEach(m => allMoves.push({ from: { row: r, col: c }, to: m }));
      }
    }
  }
  return allMoves;
}

// Get King Swap moves: swap king position with any friendly non-royal piece
function getKingSwapMoves(board, color) {
  const royals = findRoyals(board, color).filter(pos => board[pos.row][pos.col].type === 'K');
  if (royals.length === 0) return [];
  const kingPos = royals[0];
  const swaps = [];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const piece = board[r][c];
      if (!piece || piece.color !== color) continue;
      if (isRoyal(piece.type)) continue;
      // Try swapping
      const newBoard = board.map(row => row.slice());
      newBoard[r][c] = newBoard[kingPos.row][kingPos.col];
      newBoard[kingPos.row][kingPos.col] = piece;
      if (!isInCheck(newBoard, color)) {
        swaps.push({ from: { row: kingPos.row, col: kingPos.col }, to: { row: r, col: c }, isKingSwap: true });
      }
    }
  }
  return swaps;
}

module.exports = {
  getPseudoLegalMoves,
  getLegalMoves,
  getAllLegalMoves,
  isInCheck,
  isSquareAttacked,
  findRoyals,
  applyMoveToBoard,
  getKingSwapMoves,
};
