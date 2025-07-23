import React, { useState, useEffect } from 'react';
import './App.css';

// Color variables for minimalistic light theme
const COLORS = {
  accent: '#FFC107',
  primary: '#1976D2',
  secondary: '#424242',
  boardBg: '#fff',
  cellBorder: '#e0e0e0',
};

// ----- Board Component -----
// PUBLIC_INTERFACE
function Board({ squares, onClick, isGameOver }) {
  /** This is the game board UI (3x3 grid). */
  return (
    <div className="ttt-board">
      {squares.map((value, idx) => (
        <button 
          key={idx}
          className="ttt-cell"
          style={{
            color: value === 'X' ? COLORS.primary : COLORS.secondary,
            borderColor: COLORS.cellBorder,
            background: COLORS.boardBg,
            cursor: value || isGameOver ? 'default' : 'pointer'
          }}
          onClick={() => onClick(idx)}
          disabled={!!value || isGameOver}
          aria-label={`Cell ${idx} ${value || ''}`}
        >
          {value}
        </button>
      ))}
    </div>
  );
}

// ----- Game Controls (mode, score, reset) -----
// PUBLIC_INTERFACE
function Controls({
  mode, setMode,
  score, onReset, isGameOver, winner
}) {
  /** Displays mode selector, score, reset button, and game outcome */
  return (
    <div className="ttt-controls">
      <div style={{ marginBottom: 10, display: "flex", justifyContent: "center", alignItems: "center", flexWrap: 'wrap' }}>
        <button
          className={`ttt-mode ${mode === 'pvp' ? 'active' : ''}`}
          style={{ background: mode === 'pvp' ? COLORS.primary : COLORS.boardBg, color: mode === 'pvp' ? '#fff' : COLORS.primary }}
          onClick={() => setMode('pvp')}
          aria-pressed={mode === 'pvp'}
        >
          2 Players
        </button>
        <button
          className={`ttt-mode ${mode === 'ai' ? 'active' : ''}`}
          style={{ background: mode === 'ai' ? COLORS.primary : COLORS.boardBg, color: mode === 'ai' ? '#fff' : COLORS.primary }}
          onClick={() => setMode('ai')}
          aria-pressed={mode === 'ai'}
        >
          AI Opponent
        </button>
      </div>
      <div className="score-row">
        <span style={{ color: COLORS.primary }}>X: {score.X}</span>
        <span style={{ padding: '0 6px' }}>|</span>
        <span style={{ color: COLORS.secondary }}>O: {score.O}</span>
        <span style={{ padding: '0 6px' }}>Draws: {score.draws}</span>
      </div>
      <button className="ttt-reset" onClick={onReset}>
        Reset Game
      </button>
      <div style={{ marginTop: 10, minHeight: 24 }}>
        {isGameOver && (
          winner === 'draw'
            ? <span style={{ color: COLORS.accent, fontWeight: 600 }}>Draw!</span>
            : <span style={{ color: winner === 'X' ? COLORS.primary : COLORS.secondary, fontWeight: 600 }}>{winner} wins!</span>
        )}
      </div>
    </div>
  );
}

// ----- AI (Simple Random Choice) -----
function getAIMove(squares) {
  /** Returns a random available index for AI-move (easy level). */
  const available = squares
    .map((v, i) => v === null ? i : null)
    .filter(i => i !== null);
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

// ----- Helpers for game logic -----
// PUBLIC_INTERFACE
function calculateWinner(squares) {
  /** Checks for winner or draw. Returns {winner: 'X'|'O'|'draw'|null, line, isDraw} */
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6],            // diags
  ];
  for (let [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c])
      return { winner: squares[a], line: [a, b, c], isDraw: false };
  }
  if (squares.every(v => v !== null))
    return { winner: 'draw', line: null, isDraw: true };
  return { winner: null, line: null, isDraw: false };
}

// ----- Main App -----
/**
 * PUBLIC_INTERFACE
 * Main React App for Tic Tac Toe Game.
 * - Supports 2-player and simple AI opponent.
 * - Detects win/draw.
 * - Responsive and minimal UI.
 * - Score, mode switching, and reset.
 */
function App() {
  const [theme, setTheme] = useState('light');

  // Game state
  const [mode, setMode] = useState('pvp'); // 'pvp' or 'ai'
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null); // 'X' | 'O' | 'draw' | null
  const [score, setScore] = useState({ X: 0, O: 0, draws: 0 });

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Detect win/draw and handle scoring
  useEffect(() => {
    const res = calculateWinner(squares);
    if (res.winner && !gameOver) {
      setGameOver(true);
      setWinner(res.winner);
      setScore(prev => {
        if (res.winner === 'draw')  return { ...prev, draws: prev.draws + 1 };
        return { ...prev, [res.winner]: prev[res.winner] + 1 };
      });
    }
  // eslint-disable-next-line
  }, [squares]);

  // Handle AI move (O as AI)
  useEffect(() => {
    if (
      mode === 'ai' && !gameOver &&
      !xIsNext // O's turn (AI)
    ) {
      // Make AI move after slight delay for natural feel
      const timer = setTimeout(() => {
        const idx = getAIMove(squares);
        if (idx !== null) {
          handleMove(idx);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line
  }, [mode, squares, xIsNext, gameOver]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  function newGame(hardReset = false) {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setGameOver(false);
    setWinner(null);
    if (hardReset) {
      setScore({ X: 0, O: 0, draws: 0 });
    }
  }

  // PUBLIC_INTERFACE
  function handleMove(idx) {
    // Only allow if not game over and cell empty
    if (squares[idx] || gameOver) return;
    const nextSquares = squares.slice();
    nextSquares[idx] = xIsNext ? 'X' : 'O';
    setSquares(nextSquares);
    setXIsNext(!xIsNext);
  }

  // Mode change resets game
  function handleModeChange(m) {
    setMode(m);
    newGame(true); // scores reset too, since mode changes
  }

  // Display for next player
  const status =
    gameOver
      ? (winner === 'draw'
        ? "Draw!"
        : `Winner: ${winner}`)
      : `Next: ${xIsNext ? 'X' : 'O'}`;

  return (
    <div className="App" style={{ minHeight: '100vh', background: COLORS.boardBg }}>
      <header className="App-header" style={{
        minHeight: 'unset',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: '32px 12px 12px 12px'
      }}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <h1 style={{
          color: COLORS.primary, marginBottom: 2, fontSize: 32, letterSpacing: '0.04em'
        }}>Tic Tac Toe</h1>
        <p style={{ color: COLORS.secondary, margin: 0, fontWeight: 300, letterSpacing: '0.02em' }}>
          A minimal tic-tac-toe game. Play with a friend or AI.
        </p>
        <div className="main-container">
          <Controls
            mode={mode}
            setMode={handleModeChange}
            score={score}
            onReset={() => newGame(true)}
            isGameOver={gameOver}
            winner={winner}
          />
          <div className="board-outer">
            <Board
              squares={squares}
              onClick={handleMove}
              isGameOver={gameOver}
            />
            <div className="ttt-status" style={{ marginTop: 16, fontWeight: 600, color: COLORS.accent }}>
              {status}
            </div>
            {!gameOver && (
              <button
                className="ttt-reset"
                onClick={() => newGame(false)}
                style={{ marginTop: 10 }}
              >
                New Round
              </button>
            )}
          </div>
        </div>
      </header>
      <footer style={{
        margin: '32px 0 0', color: '#aaa',
        fontSize: 13, textAlign: 'center'
      }}>
        © {new Date().getFullYear()} Tic Tac Toe. <span style={{ color: COLORS.primary, fontWeight: 500 }}>React</span> Minimal.
      </footer>
    </div>
  );
}

export default App;
