import { useState } from 'react';
import socket from '../socket';

export default function Lobby({ onJoined }) {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleCreate() {
    setLoading(true);
    setError('');
    socket.emit('create_room');
    socket.once('room_created', ({ code, color }) => {
      setLoading(false);
      onJoined({ code, color, waiting: true });
    });
  }

  function handleJoin(e) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) { setError('Enter a 4-character room code'); return; }
    setLoading(true);
    setError('');
    socket.emit('join_room', { code });
    socket.once('game_joined', ({ code: c, color, state }) => {
      setLoading(false);
      onJoined({ code: c, color, state, waiting: false });
    });
    socket.once('error', ({ message }) => {
      setLoading(false);
      setError(message);
    });
  }

  return (
    <div className="lobby">
      <div className="lobby-logo">
        <div className="logo-glyph">♛</div>
        <h1>Tamerlane Chess</h1>
        <p className="subtitle">Shatranj al-Kabir — The Great Chess of Timur</p>
      </div>

      <div className="lobby-cards">
        <div className="lobby-card">
          <h2>New Game</h2>
          <p>Create a room and share the code with your opponent.</p>
          <button className="btn-primary" onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating…' : 'Create Room'}
          </button>
        </div>

        <div className="lobby-divider">or</div>

        <div className="lobby-card">
          <h2>Join Game</h2>
          <form onSubmit={handleJoin}>
            <input
              className="room-input"
              type="text"
              placeholder="Room Code"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={4}
              autoComplete="off"
              spellCheck={false}
            />
            {error && <p className="error-msg">{error}</p>}
            <button className="btn-secondary" type="submit" disabled={loading}>
              {loading ? 'Joining…' : 'Join Room'}
            </button>
          </form>
        </div>
      </div>

      <div className="lobby-rules">
        <h3>Quick Rules</h3>
        <div className="rules-grid">
          <div><strong>Board:</strong> 10×11 + 2 citadels (112 squares)</div>
          <div><strong>Goal:</strong> Checkmate all royal pieces</div>
          <div><strong>Stalemate:</strong> Counts as a WIN for the stalemating side</div>
          <div><strong>Citadel:</strong> King reaching opponent's citadel can claim a draw</div>
          <div><strong>King Swap:</strong> Once per game, swap checked king with friendly piece</div>
          <div><strong>Pawns:</strong> 11 types, each promotes to its corresponding piece</div>
        </div>
      </div>
    </div>
  );
}
