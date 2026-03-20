import { useState, useEffect } from 'react';
import Lobby from './components/Lobby';
import Game from './components/Game';
import socket from './socket';
import './App.css';

export default function App() {
  const [room, setRoom] = useState(null); // null | { code, color, state?, waiting }
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  function handleJoined({ code, color, state, waiting }) {
    setRoom({ code, color, state: state || null, waiting });
  }

  function handleLeave() {
    setRoom(null);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <span className="header-glyph">♛</span>
          <span className="header-title">Tamerlane Chess</span>
        </div>
        <div className={`connection-dot ${connected ? 'connected' : 'disconnected'}`} title={connected ? 'Connected' : 'Disconnected'} />
      </header>

      <main className="app-main">
        {!room ? (
          <Lobby onJoined={handleJoined} />
        ) : (
          <Game
            roomCode={room.code}
            playerColor={room.color}
            initialState={room.state}
            waiting={room.waiting}
            onLeave={handleLeave}
          />
        )}
      </main>

      <footer className="app-footer">
        <span>Shatranj al-Kabir · c. 1350 CE · Board of Timur</span>
      </footer>
    </div>
  );
}
