// Tamerlane Chess Game State
// Applies moves, updates status, handles special rules

const {
  ROWS, COLS, isPawn, isRoyal, PAWN_PROMOTES_TO,
  LEFT_CITADEL, RIGHT_CITADEL, createInitialState,
} = require('./constants');

const {
  getLegalMoves, getAllLegalMoves, isInCheck,
  applyMoveToBoard, getKingSwapMoves,
} = require('./moves');

function deepClone(state) {
  return {
    ...state,
    board: state.board.map(row => row.map(cell => cell ? { ...cell } : null)),
    lastMove: state.lastMove ? { ...state.lastMove } : null,
  };
}

// Apply a validated move to the game state and return new state
function applyMove(state, move) {
  const { from, to, isKingSwap } = move;
  const newState = deepClone(state);
  const { board } = newState;
  const movingPiece = board[from.row][from.col];
  if (!movingPiece) return state; // Invalid

  const opponent = movingPiece.color === 'w' ? 'b' : 'w';

  if (isKingSwap) {
    // Swap king with target piece
    const targetPiece = board[to.row][to.col];
    board[to.row][to.col] = movingPiece;
    board[from.row][from.col] = targetPiece;
    if (movingPiece.color === 'w') newState.whiteKingSwapUsed = true;
    else newState.blackKingSwapUsed = true;
  } else if (to.isCitadelMove) {
    // King entering citadel
    board[from.row][from.col] = null;
    if (movingPiece.color === 'w') {
      newState.leftCitadel = movingPiece;
    } else {
      newState.rightCitadel = movingPiece;
    }
    newState.status = 'draw';
    newState.currentTurn = opponent;
    newState.lastMove = { from, to };
    newState.moveCount++;
    return newState;
  } else {
    // Regular move
    const promotedType = to.promotion;
    board[to.row][to.col] = promotedType
      ? { type: promotedType, color: movingPiece.color }
      : movingPiece;
    board[from.row][from.col] = null;
  }

  newState.lastMove = { from, to };
  newState.currentTurn = opponent;
  newState.moveCount++;

  // Update game status
  updateStatus(newState, opponent);
  return newState;
}

function updateStatus(state, colorToMove) {
  const { board } = state;
  const inCheck = isInCheck(board, colorToMove);
  const legalMoves = getAllLegalMoves(board, colorToMove);
  const hasSwap = colorToMove === 'w'
    ? !state.whiteKingSwapUsed
    : !state.blackKingSwapUsed;
  const swapMoves = hasSwap && inCheck ? getKingSwapMoves(board, colorToMove) : [];
  const hasMoves = legalMoves.length > 0 || swapMoves.length > 0;

  if (!hasMoves) {
    if (inCheck) {
      // Checkmate — opponent wins
      const winner = colorToMove === 'w' ? 'b' : 'w';
      state.status = 'checkmate';
      state.winner = winner;
    } else {
      // Stalemate — in Tamerlane chess, stalemate is a WIN for the attacking side
      const winner = colorToMove === 'w' ? 'b' : 'w';
      state.status = 'stalemate';
      state.winner = winner;
    }
  } else if (inCheck) {
    state.status = 'check';
  } else {
    state.status = 'playing';
  }
}

// Validate and apply a move from a player
function processMove(state, move, playerColor) {
  if (state.currentTurn !== playerColor) {
    return { valid: false, reason: 'Not your turn', state };
  }
  if (state.winner || state.status === 'draw') {
    return { valid: false, reason: 'Game is over', state };
  }

  const { from, to, isKingSwap } = move;

  if (isKingSwap) {
    // Validate king swap
    if (state.status !== 'check') {
      return { valid: false, reason: 'King swap only available in check', state };
    }
    const swapUsed = playerColor === 'w' ? state.whiteKingSwapUsed : state.blackKingSwapUsed;
    if (swapUsed) {
      return { valid: false, reason: 'King swap already used', state };
    }
    const validSwaps = getKingSwapMoves(state.board, playerColor);
    const isValidSwap = validSwaps.some(s => s.from.row === from.row && s.from.col === from.col && s.to.row === to.row && s.to.col === to.col);
    if (!isValidSwap) {
      return { valid: false, reason: 'Invalid king swap', state };
    }
  } else {
    // Validate normal move
    if (!from || !to) return { valid: false, reason: 'Invalid move format', state };
    const piece = state.board[from.row]?.[from.col];
    if (!piece || piece.color !== playerColor) {
      return { valid: false, reason: 'No valid piece at from position', state };
    }
    const legalMoves = getLegalMoves(state.board, from.row, from.col);
    const isLegal = legalMoves.some(m => m.row === to.row && m.col === to.col);
    if (!isLegal) {
      return { valid: false, reason: 'Illegal move', state };
    }
  }

  const newState = applyMove(state, move);
  return { valid: true, state: newState };
}

module.exports = { applyMove, processMove, updateStatus, deepClone };
