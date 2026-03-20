import { useState, useEffect, useCallback } from 'react';
import socket from '../socket';
import Board from './Board';
import { getPieceName } from '../game/constants';

export default function Game({ roomCode, playerColor, initialState, waiting: initialWaiting, onLeave }) {
  const [state, setState] = useState(initialState || null);
  const [waiting, setWaiting] = useState(initialWaiting || false);
  const [selectedPos, setSelectedPos] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [swapMoves, setSwapMoves] = useState([]);
  const [swapModeActive, setSwapModeActive] = useState(false);
  const [gameOver, setGameOver] = useState(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [tooltip, setTooltip] = useState('');

  useEffect(() => {
    socket.on('game_start', ({ state: s }) => {
      setState(s);
      setWaiting(false);
    });
    socket.on('state_update', ({ state: s }) => {
      setState(s);
      setSelectedPos(null);
      setLegalMoves([]);
      setSwapMoves([]);
      setSwapModeActive(false);
    });
    socket.on('game_over', (data) => {
      setGameOver(data);
      setSelectedPos(null);
      setLegalMoves([]);
    });
    socket.on('legal_moves', ({ row, col, moves }) => {
      setSelectedPos({ row, col });
      setLegalMoves(moves);
    });
    socket.on('king_swap_moves', ({ moves }) => {
      setSwapMoves(moves);
      if (moves.length > 0) setSwapModeActive(true);
    });
    socket.on('player_disconnected', () => setOpponentDisconnected(true));
    socket.on('move_rejected', ({ reason }) => {
      setTooltip(reason);
      setTimeout(() => setTooltip(''), 2000);
    });

    return () => {
      socket.off('game_start');
      socket.off('state_update');
      socket.off('game_over');
      socket.off('legal_moves');
      socket.off('king_swap_moves');
      socket.off('player_disconnected');
      socket.off('move_rejected');
    };
  }, []);

  const handleSquareClick = useCallback((row, col, isCitadel) => {
    if (!state || waiting || gameOver) return;
    if (state.currentTurn !== playerColor) return;

    const piece = isCitadel ? null : state.board[row]?.[col];

    // If in swap mode, clicking a target piece executes the swap
    if (swapModeActive) {
      const swapMove = swapMoves.find(m => m.to.row === row && m.to.col === col);
      if (swapMove) {
        socket.emit('make_move', { ...swapMove, isKingSwap: true });
        setSwapModeActive(false);
        setSwapMoves([]);
        return;
      }
      // Clicking elsewhere cancels swap mode
      if (!swapMove) {
        setSwapModeActive(false);
        setSwapMoves([]);
      }
    }

    // If a piece is selected, try to move to clicked square
    if (selectedPos) {
      const isLegal = legalMoves.some(m => m.row === row && m.col === col);
      if (isLegal) {
        const lm = legalMoves.find(m => m.row === row && m.col === col);
        socket.emit('make_move', {
          from: selectedPos,
          to: { row, col, isCitadelMove: isCitadel },
          promotion: lm?.promotion,
        });
        setSelectedPos(null);
        setLegalMoves([]);
        return;
      }
      // Click own piece: select it instead
      if (piece && piece.color === playerColor) {
        socket.emit('get_legal_moves', { row, col });
        return;
      }
      // Click empty or enemy: deselect
      setSelectedPos(null);
      setLegalMoves([]);
      return;
    }

    // Select a piece
    if (piece && piece.color === playerColor) {
      socket.emit('get_legal_moves', { row, col });
    }
  }, [state, waiting, gameOver, playerColor, selectedPos, legalMoves, swapModeActive, swapMoves]);

  function handleKingSwap() {
    socket.emit('get_king_swap_moves');
  }

  function handleResign() {
    if (window.confirm('Resign this game?')) {
      socket.emit('resign');
    }
  }

  const isMyTurn = state && state.currentTurn === playerColor && !waiting && !gameOver;
  const inCheck = state?.status === 'check' && state.currentTurn === playerColor;
  const canUseSwap = inCheck && !(playerColor === 'w' ? state?.whiteKingSwapUsed : state?.blackKingSwapUsed);

  if (waiting) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <div className="waiting-spinner" />
          <h2>Waiting for opponent…</h2>
          <div className="room-code-display">
            <span>Room Code</span>
            <strong>{roomCode}</strong>
          </div>
          <p>Share this code with your opponent to begin.</p>
          <button className="btn-ghost" onClick={onLeave}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-layout">
      {/* Left sidebar */}
      <div className="sidebar sidebar-left">
        <div className="player-card player-black">
          <div className="player-indicator" />
          <div>
            <div className="player-name">Black</div>
            {state?.currentTurn === 'b' && !gameOver && <div className="turn-badge">thinking…</div>}
          </div>
        </div>
        <div className="rules-quick">
          <h4>Piece Guide</h4>
          <div className="piece-list">
            {['K','F','V','G','P','N','R','E','C','D'].map(t => (
              <div key={t} className="piece-entry">
                <span className="pe-abbr">{t}</span>
                <span className="pe-name">{getPieceName(t)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="board-area">
        {gameOver && (
          <div className="game-over-banner">
            {gameOver.status === 'draw' ? '½–½ Draw by Citadel' :
             gameOver.status === 'resigned' ? `${gameOver.winner === 'w' ? 'White' : 'Black'} wins — opponent resigned` :
             gameOver.status === 'stalemate' ? `${gameOver.winner === 'w' ? 'White' : 'Black'} wins by stalemate!` :
             `${gameOver.winner === 'w' ? 'White' : 'Black'} wins by checkmate!`}
            <button className="btn-ghost-sm" onClick={onLeave}>Return to lobby</button>
          </div>
        )}
        {opponentDisconnected && !gameOver && (
          <div className="game-over-banner banner-warn">
            Opponent disconnected
            <button className="btn-ghost-sm" onClick={onLeave}>Leave</button>
          </div>
        )}
        {inCheck && !gameOver && (
          <div className="check-banner">⚠ Check!</div>
        )}
        {tooltip && <div className="tooltip-flash">{tooltip}</div>}

        <Board
          state={state}
          playerColor={playerColor}
          selectedPos={selectedPos}
          legalMoves={swapModeActive ? swapMoves.map(m => m.to) : legalMoves}
          swapModeActive={swapModeActive}
          onSquareClick={handleSquareClick}
        />
      </div>

      {/* Right sidebar */}
      <div className="sidebar sidebar-right">
        <div className="player-card player-white">
          <div className="player-indicator indicator-white" />
          <div>
            <div className="player-name">White {playerColor === 'w' ? '(You)' : ''}</div>
            {state?.currentTurn === 'w' && !gameOver && <div className="turn-badge">thinking…</div>}
          </div>
        </div>

        <div className="game-actions">
          {isMyTurn && canUseSwap && !swapModeActive && (
            <button className="btn-swap" onClick={handleKingSwap}>
              ↔ King Swap
            </button>
          )}
          {swapModeActive && (
            <div className="swap-hint">Click a friendly piece to swap with your King</div>
          )}
          {!gameOver && (
            <button className="btn-resign" onClick={handleResign}>Resign</button>
          )}
          {gameOver && (
            <button className="btn-primary" onClick={onLeave}>Return to Lobby</button>
          )}
        </div>

        <div className="game-info">
          <div className="info-row">
            <span>Room</span><strong>{roomCode}</strong>
          </div>
          <div className="info-row">
            <span>You are</span>
            <strong style={{color: playerColor === 'w' ? '#e8d5a3' : '#c0392b'}}>
              {playerColor === 'w' ? 'White' : 'Black'}
            </strong>
          </div>
          <div className="info-row">
            <span>Move</span><strong>{state?.moveCount || 0}</strong>
          </div>
          <div className="info-row">
            <span>Status</span>
            <strong>{state?.status || '—'}</strong>
          </div>
        </div>

        <div className="swap-info">
          <h4>King Swap</h4>
          <p>
            {playerColor === 'w'
              ? state?.whiteKingSwapUsed ? '✗ Used' : '✓ Available'
              : state?.blackKingSwapUsed ? '✗ Used' : '✓ Available'}
          </p>
          <p className="swap-desc">When in check, once per game you may switch the king's position with any friendly piece.</p>
        </div>
      </div>
    </div>
  );
}
