// Tamerlane Chess (Shatranj al-kabir) Constants
// Board: 10 ranks × 11 files + 2 citadel squares = 112 total

const ROWS = 10;
const COLS = 11;

// Piece type codes
const PT = {
  KING:        'K',   // Shah — moves like modern king
  FERZ:        'F',   // General/Counsellor — 1 square diagonal
  VIZIR:       'V',   // Governor — 1 square orthogonal
  GIRAFFE:     'G',   // 1 diagonal + 3+ orthogonal (no jump)
  PICKET:      'P',   // Scout — bishop but min 2 squares
  KNIGHT:      'N',   // Standard horse L-shape
  ROOK:        'R',   // Standard rook
  ELEPHANT:    'E',   // Jumps exactly 2 diagonal
  CAMEL:       'C',   // Jumps (1,3) L-shape
  DABBABA:     'D',   // War engine — jumps exactly 2 orthogonal
  // Pawns (promote to associated piece)
  PAWN_ROOK:    'pr',
  PAWN_KNIGHT:  'pn',
  PAWN_PICKET:  'pp',
  PAWN_GIRAFFE: 'pg',
  PAWN_FERZ:    'pf',
  PAWN_KING:    'pk',
  PAWN_VIZIR:   'pv',
  PAWN_GIRAFFE2:'pg2', // second giraffe pawn
  PAWN_PICKET2: 'pp2', // second picket pawn
  PAWN_KNIGHT2: 'pn2', // second knight pawn
  PAWN_ROOK2:   'pr2', // not used — 11 unique pawns
  PAWN_ELEPHANT:'pe',
  PAWN_CAMEL:   'pc',
  PAWN_DABBABA: 'pd',
  PAWN_OF_PAWNS:'pz',
  // Promoted specials
  PRINCE:      'PR',  // From pawn of kings — moves like king, also royal
  ADV_KING:    'AK',  // Adventitious king — from pawn of pawns
};

// Royal piece types (must all be captured/mated to win)
const ROYAL_TYPES = new Set(['K', 'PR', 'AK']);

// Pawn promotion targets
const PAWN_PROMOTES_TO = {
  pz:  'AK', // Adventitious king (simplified: direct promotion)
  pd:  'D',
  pc:  'C',
  pe:  'E',
  pf:  'F',
  pk:  'PR', // Prince
  pv:  'V',
  pg:  'G',
  pp:  'P',
  pn:  'N',
  pr:  'R',
};

// Starting row arrays (white perspective, row 0 = white back rank)
const W_BACK  = ['E', null, 'C', null, 'D', null, 'D', null, 'C', null, 'E'];
const W_MAIN  = ['R', 'N',  'P', 'G',  'F', 'K',  'V', 'G',  'P', 'N',  'R'];
const W_PAWNS = ['pz','pd', 'pc','pe', 'pf','pk', 'pv','pg', 'pp','pn', 'pr'];

// Citadel positions
// Left citadel  (row 8, col -1):  white king's target for draw
// Right citadel (row 1, col  11): black king's target for draw
const LEFT_CITADEL  = { row: 8, col: -1 };
const RIGHT_CITADEL = { row: 1, col: 11 };

function isPawn(type) {
  return type && type.startsWith('p') && type !== 'PR';
}

function isRoyal(type) {
  return ROYAL_TYPES.has(type);
}

function createInitialBoard() {
  const board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
  for (let col = 0; col < COLS; col++) {
    if (W_BACK[col])  board[0][col] = { type: W_BACK[col],  color: 'w' };
    board[1][col] = { type: W_MAIN[col],  color: 'w' };
    board[2][col] = { type: W_PAWNS[col], color: 'w' };
    if (W_BACK[col])  board[9][col] = { type: W_BACK[col],  color: 'b' };
    board[8][col] = { type: W_MAIN[col],  color: 'b' };
    board[7][col] = { type: W_PAWNS[col], color: 'b' };
  }
  return board;
}

function createInitialState() {
  return {
    board: createInitialBoard(),
    currentTurn: 'w',
    whiteKingSwapUsed: false,
    blackKingSwapUsed: false,
    // null | { type, color }
    leftCitadel: null,
    rightCitadel: null,
    status: 'playing', // 'playing' | 'check' | 'checkmate' | 'stalemate' | 'white_wins' | 'black_wins' | 'draw'
    winner: null,
    lastMove: null,
    moveCount: 0,
  };
}

module.exports = {
  ROWS, COLS, PT, ROYAL_TYPES, PAWN_PROMOTES_TO,
  W_BACK, W_MAIN, W_PAWNS,
  LEFT_CITADEL, RIGHT_CITADEL,
  isPawn, isRoyal,
  createInitialBoard, createInitialState,
};
