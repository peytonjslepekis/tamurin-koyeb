// Client-side piece display data

export const ROWS = 10;
export const COLS = 11;

export const PIECE_INFO = {
  K:   { label: '♔', labelB: '♚', name: 'Shah (King)', abbr: 'K' },
  F:   { label: '⬦', labelB: '⬦', name: 'Ferz (General)', abbr: 'F' },
  V:   { label: '◈', labelB: '◈', name: 'Vizir (Governor)', abbr: 'V' },
  G:   { label: '⟡', labelB: '⟡', name: 'Giraffe', abbr: 'G' },
  P:   { label: '⬗', labelB: '⬗', name: 'Picket (Scout)', abbr: 'Sc' },
  N:   { label: '♘', labelB: '♞', name: 'Knight', abbr: 'N' },
  R:   { label: '♖', labelB: '♜', name: 'Rook', abbr: 'R' },
  E:   { label: '◈', labelB: '◈', name: 'Elephant', abbr: 'El' },
  C:   { label: '◇', labelB: '◇', name: 'Camel', abbr: 'Ca' },
  D:   { label: '□', labelB: '□', name: 'Dabbaba (War Engine)', abbr: 'Da' },
  PR:  { label: 'Ⓟ', labelB: 'Ⓟ', name: 'Prince', abbr: 'Pr' },
  AK:  { label: '✦', labelB: '✦', name: 'Adventitious King', abbr: 'AK' },
  // Pawns
  pz:  { label: '★', labelB: '★', name: 'Pawn of Pawns', abbr: '★' },
  pd:  { label: '♟', labelB: '♟', name: 'Pawn/Dabbaba', abbr: 'pd' },
  pc:  { label: '♟', labelB: '♟', name: 'Pawn/Camel', abbr: 'pc' },
  pe:  { label: '♟', labelB: '♟', name: 'Pawn/Elephant', abbr: 'pe' },
  pf:  { label: '♙', labelB: '♟', name: 'Pawn/Ferz', abbr: 'pf' },
  pk:  { label: '♙', labelB: '♟', name: 'Pawn/King', abbr: 'pk' },
  pv:  { label: '♙', labelB: '♟', name: 'Pawn/Vizir', abbr: 'pv' },
  pg:  { label: '♙', labelB: '♟', name: 'Pawn/Giraffe', abbr: 'pg' },
  pp:  { label: '♙', labelB: '♟', name: 'Pawn/Picket', abbr: 'pp' },
  pn:  { label: '♙', labelB: '♟', name: 'Pawn/Knight', abbr: 'pn' },
  pr:  { label: '♙', labelB: '♟', name: 'Pawn/Rook', abbr: 'pr' },
};

export function getPieceLabel(type, color) {
  const info = PIECE_INFO[type];
  if (!info) return type;
  return color === 'w' ? info.label : info.labelB;
}

export function getPieceName(type) {
  return PIECE_INFO[type]?.name || type;
}

export function getPieceAbbr(type) {
  return PIECE_INFO[type]?.abbr || type;
}

// File labels a-k
export const FILE_LABELS = ['a','b','c','d','e','f','g','h','i','j','k'];
export const RANK_LABELS = ['1','2','3','4','5','6','7','8','9','10'];
