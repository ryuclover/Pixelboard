import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { useSocket } from '../../hooks/useSocket';
import axios from 'axios';
import './Xadrez.css';

import moveSoundFile from './assets/move.wav';
import captureSoundFile from './assets/capture.wav';

import bb from './assets/bb.png';
import bk from './assets/bk.png';
import bn from './assets/bn.png';
import bp from './assets/bp.png';
import bq from './assets/bq.png';
import br from './assets/br.png';
import wb from './assets/wb.png';
import wk from './assets/wk.png';
import wn from './assets/wn.png';
import wp from './assets/wp.png';
import wq from './assets/wq.png';
import wr from './assets/wr.png';

const pieceImages = { bb, bk, bn, bp, bq, br, wb, wk, wn, wp, wq, wr };
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Xadrez() {
  const [game, setGame] = useState(new Chess());
  const [gameMode, setGameMode] = useState(null); // null, 'local', 'bot', 'online'
  const [matchStatus, setMatchStatus] = useState(null); // 'searching', 'playing'
  const [playerColor, setPlayerColor] = useState('w'); // For online mode
  const [opponentId, setOpponentId] = useState(null); // Track opponent for result tracking
  const { socket } = useSocket();
  const [moveHistory, setMoveHistory] = useState([]);
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [gameOver, setGameOver] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const gameOverProcessedRef = useRef(false);
  
  const moveSound = useRef(null);
  const captureSound = useRef(null);
  const timerInterval = useRef(null);

  useEffect(() => {
    moveSound.current = new Audio(moveSoundFile);
    captureSound.current = new Audio(captureSoundFile);
  }, []);

  const playSound = useCallback((isCapture) => {
    try {
      const sound = isCapture ? captureSound.current : moveSound.current;
      if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
      }
    } catch (e) {}
  }, []);

  // Save game result when online match ends
  useEffect(() => {
    if (gameMode !== 'online' || !gameOver || !opponentId || gameOverProcessedRef.current) return;
    
    gameOverProcessedRef.current = true;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    const winnerId = gameOver.winner === 'White' ? (playerColor === 'w' ? 'current' : opponentId) 
                   : (playerColor === 'b' ? 'current' : opponentId);
    
    axios.post(`${API_URL}/games/result`, 
      {
        gameType: 'chess',
        opponentId,
        winnerId: winnerId === 'current' ? undefined : winnerId,
        reason: gameOver.reason,
        moves: moveHistory
      },
      { headers: { Authorization: `Bearer ${token}` } }
    ).catch(err => console.error('Failed to save game result:', err));
  }, [gameMode, gameOver, opponentId, playerColor, moveHistory]);

  // Socket listener
  useEffect(() => {
    if (!socket || gameMode !== 'online') return;

    const onMatchFound = (data) => {
      setPlayerColor(data.color);
      setOpponentId(data.opponentId);
      setMatchStatus('playing');
      setGame(new Chess());
      setMoveHistory([]);
      setWhiteTime(600);
      setBlackTime(600);
      setGameOver(null);
      setSelectedSquare(null);
      setLegalMoves([]);
      gameOverProcessedRef.current = false;
    };

    const onOpponentMoved = (data) => {
      setGame((prevGame) => {
        const gameCopy = new Chess(prevGame.fen());
        const result = gameCopy.move(data.move);
        if (result) {
          setMoveHistory(gameCopy.history());
          playSound(result.captured);
          
          if (gameCopy.isGameOver()) {
            let reason = "Checkmate";
            if (gameCopy.isDraw()) reason = "Draw";
            if (gameCopy.isStalemate()) reason = "Stalemate";
            setGameOver({ winner: gameCopy.turn() === 'w' ? 'Black' : 'White', reason });
          }
        }
        return gameCopy;
      });
    };

    const onOpponentDisconnected = () => {
      setGameOver({ winner: playerColor === 'w' ? 'White' : 'Black', reason: 'Opponent Disconnected' });
      setMatchStatus(null);
    };

    socket.on('match_found', onMatchFound);
    socket.on('opponent_moved', onOpponentMoved);
    socket.on('opponent_disconnected', onOpponentDisconnected);

    return () => {
      socket.off('match_found', onMatchFound);
      socket.off('opponent_moved', onOpponentMoved);
      socket.off('opponent_disconnected', onOpponentDisconnected);
    };
  }, [socket, gameMode, playerColor, playSound]);

  // Bot logic
  useEffect(() => {
    if (gameMode === 'bot' && game.turn() === 'b' && !game.isGameOver() && !gameOver) {
      const timeout = setTimeout(() => {
        makeBotMove();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [game, gameMode, gameOver]);

  const makeBotMove = () => {
    const possibleMoves = game.moves();
    if (possibleMoves.length === 0) return;

    // Tenta capturar uma peça se possível
    const captureMoves = game.moves({ verbose: true }).filter(m => m.captured);
    const move = captureMoves.length > 0 
      ? captureMoves[Math.floor(Math.random() * captureMoves.length)]
      : possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

    const gameCopy = new Chess(game.fen());
    const result = gameCopy.move(move);
    if (result) {
      setGame(gameCopy);
      setMoveHistory(gameCopy.history());
      playSound(result.captured);
      checkGameOver(gameCopy);
    }
  };

  const checkGameOver = (gameInstance) => {
    if (gameInstance.isGameOver()) {
      let reason = "Checkmate";
      if (gameInstance.isDraw()) reason = "Draw";
      if (gameInstance.isStalemate()) reason = "Stalemate";
      
      setGameOver({
        winner: gameInstance.turn() === 'w' ? 'Black' : 'White',
        reason: reason
      });
    }
  };

  useEffect(() => {
    if (!gameMode || game.isGameOver() || gameOver) {
      if (timerInterval.current) clearInterval(timerInterval.current);
      return;
    }
    timerInterval.current = setInterval(() => {
      if (game.turn() === 'w') setWhiteTime(t => Math.max(0, t - 1));
      else setBlackTime(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timerInterval.current);
  }, [game.turn(), gameMode, gameOver]);

  useEffect(() => {
    if (whiteTime === 0 && !gameOver) setGameOver({ winner: 'Black', reason: 'Timeout' });
    if (blackTime === 0 && !gameOver) setGameOver({ winner: 'White', reason: 'Timeout' });
  }, [whiteTime, blackTime, gameOver]);

  const handleSquareClick = (square) => {
    if (gameOver || !gameMode) return;
    if (gameMode === 'bot' && game.turn() === 'b') return; // Bloqueia cliques no turno do bot
    if (gameMode === 'online' && matchStatus !== 'playing') return;
    if (gameMode === 'online' && game.turn() !== playerColor) return;

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      const gameCopy = new Chess(game.fen());
      try {
        const move = gameCopy.move({
          from: selectedSquare,
          to: square,
          promotion: 'q'
        });

        if (move) {
          setGame(gameCopy);
          setMoveHistory(gameCopy.history());
          playSound(move.captured);
          setSelectedSquare(null);
          setLegalMoves([]);
          checkGameOver(gameCopy);
          
          if (gameMode === 'online') {
            socket?.emit('make_move', { move: move.san });
          }
          return;
        }
      } catch (e) {}
    }

    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setLegalMoves(moves.map(m => m.to));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const board = [];
  const isFlipped = gameMode === 'online' && playerColor === 'b';
  const rows = isFlipped ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1'];
  const cols = isFlipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const square = cols[j] + rows[i];
      const piece = game.get(square);
      const isDark = (i + j) % 2 === 1;
      const isSelected = selectedSquare === square;
      const isLegal = legalMoves.includes(square);

      board.push(
        <div 
          key={square}
          onClick={() => handleSquareClick(square)}
          style={{
            width: '100%', height: '100%',
            backgroundColor: isSelected ? '#f6f669' : (isDark ? '#4e5290' : '#f5f0d8'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative', userSelect: 'none'
          }}
        >
          {piece && (
            <img 
              src={pieceImages[`${piece.color}${piece.type}`]} 
              alt={`${piece.color}${piece.type}`}
              style={{
                width: '88%', height: '88%', zIndex: 2,
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.9)) drop-shadow(0px 0px 4px rgba(0,0,0,0.6))'
              }}
            />
          )}
          {isLegal && (
            <div style={{
              width: piece ? '80%' : '30%', height: piece ? '80%' : '30%',
              borderRadius: '50%', border: piece ? '4px solid rgba(0,0,0,0.25)' : 'none',
              backgroundColor: piece ? 'transparent' : 'rgba(0,0,0,0.18)',
              position: 'absolute', zIndex: 1
            }} />
          )}
        </div>
      );

    }
  }

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  // TELA DE SELEÇÃO INICIAL
  if (!gameMode) {
    return (
      <div className="chess-page animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="pixel-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '500px' }}>
          <h2 className="result-title" style={{ fontSize: '24px', marginBottom: '30px' }}>CHOOSE GAME MODE</h2>
          <div style={{ display: 'grid', gap: '20px' }}>
            <button className="btn btn-primary" style={{ padding: '20px', fontSize: '14px' }} onClick={() => setGameMode('bot')}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>🤖</span> VS COMPUTER
            </button>
            <button className="btn btn-primary" style={{ padding: '20px', fontSize: '14px' }} onClick={() => setGameMode('local')}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>👥</span> LOCAL MULTIPLAYER
            </button>
            <button className="btn btn-primary" style={{ padding: '20px', fontSize: '14px' }} onClick={() => {
              setGameMode('online');
              setMatchStatus('searching');
              socket?.emit('join_queue', { gameId: 'chess' });
            }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>🌐</span> VS ONLINE
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chess-page animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 600px) 320px', gap: '30px', alignItems: 'start', justifyContent: 'center', width: '100%' }}>
      <div className="pixel-card" style={{ padding: '20px', background: 'var(--bg-secondary)', border: '4px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>{gameMode === 'bot' ? '🤖' : '♟️'}</span>
            <span className="text-pixel" style={{ fontSize: '10px' }}>
              {gameMode === 'online' ? `Opponent (${playerColor === 'w' ? 'Black' : 'White'})` : (gameMode === 'bot' ? 'Computer' : 'Opponent')}
            </span>
          </div>
          <div style={{ background: '#000', padding: '4px 12px', border: '2px solid var(--border-color)', color: 'var(--accent-gold)', fontFamily: 'var(--font-vt)', fontSize: '20px' }}>
            {formatTime(blackTime)}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)', aspectRatio: '1/1', width: '100%', border: '6px solid #2a1e1e', borderRadius: '2px', boxShadow: '0 0 20px rgba(0,0,0,0.4)' }}>
          {board}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🧙‍♂️</span>
            <span className="text-pixel" style={{ fontSize: '10px' }}>
              {gameMode === 'online' ? `You (${playerColor === 'w' ? 'White' : 'Black'})` : 'You'}
            </span>
          </div>
          <div style={{ background: '#000', padding: '4px 12px', border: '2px solid var(--border-color)', color: 'var(--accent-gold)', fontFamily: 'var(--font-vt)', fontSize: '20px' }}>
            {formatTime(whiteTime)}
          </div>
        </div>
      </div>

      <div className="sidebar-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="sidebar-header" style={{ textAlign: 'center' }}>{gameMode.toUpperCase()} MATCH</div>
        <div className="sidebar-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {gameMode === 'online' && matchStatus === 'searching' ? (
            <div className="status-badge waiting" style={{ width: '100%', justifyContent: 'center', marginBottom: '15px' }}>
              SEARCHING FOR OPPONENT...
            </div>
          ) : (
            <div className={`status-badge ${game.turn() === 'w' ? 'waiting' : 'playing'}`} style={{ width: '100%', justifyContent: 'center', marginBottom: '15px' }}>
              {gameMode === 'online' 
                ? (game.turn() === playerColor ? 'YOUR TURN' : "OPPONENT'S TURN") 
                : (game.turn() === 'w' ? 'YOUR TURN' : (gameMode === 'bot' ? 'BOT THINKING...' : "OPPONENT'S TURN"))}
            </div>
          )}

          <div className="moves-table-container" style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '10px', minHeight: '300px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-vt)', fontSize: '18px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: '10px' }}>
                  <th>#</th><th>WHITE</th><th>BLACK</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}.</td>
                    <td>{moveHistory[i * 2]}</td>
                    <td>{moveHistory[i * 2 + 1] || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="btn btn-danger" style={{ width: '100%', marginTop: '15px', justifyContent: 'center' }} onClick={() => {
            if (gameMode === 'online') socket?.emit('leave_match');
            setGameMode(null); 
            setGame(new Chess());
          }}>
            QUIT MATCH
          </button>
        </div>
      </div>

      {gameOver && (
        <div className="result-overlay">
          <div className="result-modal">
            <span style={{ fontSize: '48px' }}>🏆</span>
            <h2 className="result-title">{gameOver.winner.toUpperCase()} WINS!</h2>
            <p className="result-subtitle">By {gameOver.reason}</p>
            <button className="btn btn-primary" onClick={() => { setGame(new Chess()); setMoveHistory([]); setWhiteTime(600); setBlackTime(600); setGameOver(null); }}>REPLAY</button>
            <button className="btn btn-secondary" style={{ marginTop: '10px', background: 'transparent', border: 'none', color: 'var(--text-muted)' }} onClick={() => setGameMode(null)}>MENU</button>
          </div>
        </div>
      )}
    </div>
  );
}
