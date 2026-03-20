# Tamerlane Chess (Shatranj al-Kabir)

Real-time multiplayer Tamerlane chess (14th-century variant of Timur) built with React + Socket.io, deployable free on Render.

## Rules Implemented

**Board:** 10×11 squares + 2 citadel squares = 112 total

**Pieces (White/Black):**
| Code | Name | Movement |
|------|------|----------|
| K | Shah (King) | 1 any direction |
| F | Ferz (General) | 1 diagonal |
| V | Vizir (Governor) | 1 orthogonal |
| G | Giraffe | 1 diagonal passthrough + 3+ orthogonal (no jump) |
| P | Picket (Scout) | Bishop min 2 squares |
| N | Knight | L-shape jump |
| R | Rook | Slides orthogonally |
| E | Elephant | Jumps 2 diagonal |
| C | Camel | Jumps (1,3) L-shape |
| D | Dabbaba (War Engine) | Jumps 2 orthogonal |

**Special Rules:**
- Stalemate = WIN for the side delivering stalemate
- King entering opponent's citadel = draw
- King Swap: once per game, in check, swap king with any friendly non-royal piece
- 11 pawn types, each promoting to its associated piece
- Pawn of Kings → Prince (royal, must also be mated)
- Pawn of Pawns → Adventitious King (simplified: promotes directly)

**Not yet implemented (future work):**
- Historical pawn-of-pawns intermediate state (immobile then forking)
- Timer / clock
- Move history / PGN export
- Reconnection after disconnect
- Multiple opening arrays (masculine / feminine / third)

## Local Development

```bash
# Terminal 1 — Server
cd server && npm install && npm run dev

# Terminal 2 — Client
cd client && npm install && npm run dev
```

Client runs at http://localhost:5173  
Server runs at http://localhost:3001

## Deploy to Render (Free)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Blueprint
3. Connect your repo and select `render.yaml`
4. Render will create both services automatically

**After first deploy:**
1. Copy the backend URL (e.g. `https://tamerlane-chess-server.onrender.com`)
2. Update the frontend's `VITE_SERVER_URL` environment variable in the Render dashboard
3. Trigger a redeploy of the frontend

**Free tier note:** The backend web service spins down after 15 minutes of inactivity. The first connection after idle will take 30–60 seconds (cold start). This is normal for Render's free tier.

## Project Structure

```
tamerlane-chess/
├── server/
│   ├── game/
│   │   ├── constants.js    ← Piece types, initial board, citadel positions
│   │   ├── moves.js        ← Move generation for all pieces
│   │   └── state.js        ← Game state, move validation, checkmate detection
│   └── index.js            ← Express + Socket.io server
├── client/
│   └── src/
│       ├── game/constants.js   ← Client-side piece display labels
│       ├── components/
│       │   ├── Board.jsx       ← Board rendering with citadels
│       │   ├── Game.jsx        ← Game management, socket events
│       │   └── Lobby.jsx       ← Room creation / joining
│       ├── App.jsx
│       └── App.css
└── render.yaml
```
