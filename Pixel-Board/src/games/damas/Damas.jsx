import { useState, useEffect, useCallback, useRef } from 'react';
import { Checkers } from './checkersLogic';
import { useSocket } from '../../hooks/useSocket';
import './Damas.css';

import whiteManImg from './assets/w_man.svg';
import whiteKingImg from './assets/w_king.svg';
import blackManImg from './assets/b_man.svg';
import blackKingImg from './assets/b_king.svg';

export default function Damas() {
  const [game, setGame] = useState(new Checkers());
  const [gameMode, setGameMode] = useState(null); // null, 'local', 'bot', 'online'
  const [matchStatus, setMatchStatus] = useState(null);
  const [playerColor, setPlayerColor] = useState('w');
  const { socket } = useSocket();
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  
  const moveSound = useRef(null);
  const captureSound = useRef(null);
  const timerInterval = useRef(null);

  useEffect(() => {
    // Reusing the same sounds from chess
    moveSound.current = new Audio('/xadrez/assets/move.wav'); // Fallback if sounds aren't moved globally
    captureSound.current = new Audio('/xadrez/assets/capture.wav');
    
    // We try generic paths first, if not available, it won't crash
    try {
      moveSound.current = new Audio('/move.wav');
      captureSound.current = new Audio('/capture.wav');
    } catch(e) {}
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

  // Socket listener
  useEffect(() => {
    if (!socket || gameMode !== 'online') return;

    const onMatchFound = (data) => {
      setPlayerColor(data.color);
      setMatchStatus('playing');
      setGame(new Checkers());
      setWhiteTime(600);
      setBlackTime(600);
      setSelectedSquare(null);
      setLegalMoves([]);
    };

    const onOpponentMoved = (data) => {
      setGame((prevGame) => {
        const gameCopy = prevGame.clone();
        const result = gameCopy.move(data.moveReq);
        if (result) {
          playSound(result.captured);
        }
        return gameCopy;
      });
    };

    const onOpponentDisconnected = () => {
      setGame((prevGame) => {
        const g = prevGame.clone();
        g.gameOverReason = 'Opponent Disconnected';
        g.winner = playerColor === 'w' ? 'White' : 'Black';
        return g;
      });
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
    if (gameMode === 'bot' && game.turn() === 'b' && !game.isGameOver()) {
      const timeout = setTimeout(() => {
        makeBotMove();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [game, gameMode]);

  const makeBotMove = () => {
    const all = game.getAllMoves('b');
    if (all.moves.length === 0) return;

    // Prefer jumps if available
    let moveObj;
    if (all.hasJump) {
      const jumps = all.moves.filter(m => m.isJump);
      moveObj = jumps[Math.floor(Math.random() * jumps.length)];
    } else {
      moveObj = all.moves[Math.floor(Math.random() * all.moves.length)];
    }

    const moveReq = {
      from: game.coordsToNotation(moveObj.from),
      to: game.coordsToNotation(moveObj.to)
    };

    const gameCopy = game.clone();
    const result = gameCopy.move(moveReq);
    if (result) {
      setGame(gameCopy);
      playSound(result.captured);
    }
  };

  useEffect(() => {
    if (!gameMode || game.isGameOver()) {
      if (timerInterval.current) clearInterval(timerInterval.current);
      return;
    }
    timerInterval.current = setInterval(() => {
      if (game.turn() === 'w') setWhiteTime(t => Math.max(0, t - 1));
      else setBlackTime(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timerInterval.current);
  }, [game.turn(), gameMode, game.isGameOver()]);

  const handleSquareClick = (squareNotation) => {
    if (game.isGameOver() || !gameMode) return;
    if (gameMode === 'bot' && game.turn() === 'b') return; // Bloqueia cliques no turno do bot
    if (gameMode === 'online' && matchStatus !== 'playing') return;
    if (gameMode === 'online' && game.turn() !== playerColor) return;

    const coord = game.notationToCoords(squareNotation);

    if (selectedSquare) {
      if (selectedSquare === squareNotation) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      const gameCopy = game.clone();
      const moveReq = {
        from: selectedSquare,
        to: squareNotation
      };

      const result = gameCopy.move(moveReq);

      if (result) {
        setGame(gameCopy);
        playSound(result.captured);
        
        if (gameMode === 'online') {
          socket?.emit('make_move', { moveReq });
        }
        
        // If it was a multi-jump and we must jump again with the same piece, keep it selected
        if (gameCopy.mandatoryJumpPiece) {
          const nextSquare = gameCopy.coordsToNotation(gameCopy.mandatoryJumpPiece);
          setSelectedSquare(nextSquare);
          const nextMoves = gameCopy.getAllMoves(gameCopy.turn()).moves;
          setLegalMoves(nextMoves.map(m => gameCopy.coordsToNotation(m.to)));
        } else {
          setSelectedSquare(null);
          setLegalMoves([]);
        }
        return;
      }
    }

    // Only allow selecting a piece if there isn't a mandatory jump for another piece
    if (game.mandatoryJumpPiece) {
      const mandSquare = game.coordsToNotation(game.mandatoryJumpPiece);
      if (squareNotation !== mandSquare) return;
    }

    const piece = game.get(squareNotation);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(squareNotation);
      const all = game.getAllMoves(game.turn());
      
      // Filter moves for this specific piece
      const movesForPiece = all.moves.filter(m => {
         const fromNot = game.coordsToNotation(m.from);
         return fromNot === squareNotation;
      });
      setLegalMoves(movesForPiece.map(m => game.coordsToNotation(m.to)));
    } else if (!game.mandatoryJumpPiece) {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const boardNodes = [];
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

      boardNodes.push(
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
              src={piece.color === 'w' ? (piece.type === 'k' ? whiteKingImg : whiteManImg) : (piece.type === 'k' ? blackKingImg : blackManImg)}
              alt={`${piece.color} ${piece.type}`}
              style={{
                width: '85%', height: '85%', zIndex: 2,
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.9)) drop-shadow(0px 4px 4px rgba(0,0,0,0.6))'
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

  if (!gameMode) {
    return (
      <div className="damas-page animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="pixel-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '500px' }}>
          <h2 className="result-title" style={{ fontSize: '24px', marginBottom: '30px' }}>CHECKERS MODE</h2>
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
              socket?.emit('join_queue', { gameId: 'damas' });
            }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>🌐</span> VS ONLINE
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="damas-page animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 600px) 320px', gap: '30px', alignItems: 'start', justifyContent: 'center', width: '100%' }}>
      <div className="pixel-card" style={{ padding: '20px', background: 'var(--bg-secondary)', border: '4px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>{gameMode === 'bot' ? '🤖' : '🔴'}</span>
            <span className="text-pixel" style={{ fontSize: '10px' }}>
              {gameMode === 'online' ? `Opponent (${playerColor === 'w' ? 'Black' : 'White'})` : (gameMode === 'bot' ? 'Computer' : 'Opponent (Black)')}
            </span>
          </div>
          <div style={{ background: '#000', padding: '4px 12px', border: '2px solid var(--border-color)', color: 'var(--accent-gold)', fontFamily: 'var(--font-vt)', fontSize: '20px' }}>
            {formatTime(blackTime)}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)', aspectRatio: '1/1', width: '100%', border: '6px solid #2a1e1e', borderRadius: '2px', boxShadow: '0 0 20px rgba(0,0,0,0.4)' }}>
          {boardNodes}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚪</span>
            <span className="text-pixel" style={{ fontSize: '10px' }}>
              {gameMode === 'online' ? `You (${playerColor === 'w' ? 'White' : 'Black'})` : 'You (White)'}
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
                {Array.from({ length: Math.ceil(game.history.length / 2) }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}.</td>
                    <td>{game.history[i * 2]}</td>
                    <td>{game.history[i * 2 + 1] || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="btn btn-danger" style={{ width: '100%', marginTop: '15px', justifyContent: 'center' }} onClick={() => {
            if (gameMode === 'online') socket?.emit('leave_match');
            setGameMode(null); 
            setGame(new Checkers());
          }}>
            QUIT MATCH
          </button>
        </div>
      </div>

      {game.isGameOver() && (
        <div className="result-overlay">
          <div className="result-modal">
            <span style={{ fontSize: '48px' }}>🏆</span>
            <h2 className="result-title">{game.winner?.toUpperCase() || 'NOBODY'} WINS!</h2>
            <p className="result-subtitle">By {game.gameOverReason}</p>
            <button className="btn btn-primary" onClick={() => { setGame(new Checkers()); setWhiteTime(600); setBlackTime(600); }}>REPLAY</button>
            <button className="btn btn-secondary" style={{ marginTop: '10px', background: 'transparent', border: 'none', color: 'var(--text-muted)' }} onClick={() => setGameMode(null)}>MENU</button>
          </div>
        </div>
      )}
      
      {/* Timer timeout detection handled here directly since effect dependencies are complex */}
      {(whiteTime === 0 || blackTime === 0) && !game.isGameOver() && (
        <div className="result-overlay">
          <div className="result-modal">
            <span style={{ fontSize: '48px' }}>⏱️</span>
            <h2 className="result-title">TIMEOUT!</h2>
            <p className="result-subtitle">{whiteTime === 0 ? 'Black' : 'White'} wins on time.</p>
            <button className="btn btn-primary" onClick={() => { setGame(new Checkers()); setWhiteTime(600); setBlackTime(600); }}>REPLAY</button>
          </div>
        </div>
      )}
    </div>
  );
}
