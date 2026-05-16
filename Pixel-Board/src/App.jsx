import { useState, useEffect } from 'react'
import axios from 'axios'
import Xadrez from './games/xadrez/Xadrez'
import Damas from './games/damas/Damas'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState('login'); // 'login' or 'register'
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setUser(res.data))
      .catch(() => localStorage.removeItem('token'));
    }
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = authType === 'login' ? '/auth/login' : '/auth/register';
      const res = await axios.post(`${API_URL}${endpoint}`, formData);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setShowAuthModal(false);
      setFormData({ username: '', password: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    try {
      const res = await axios.post(`${API_URL}/auth/guest`);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setShowAuthModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Guest login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentView('games');
  };

  return (
    <>
      {/* Folhas decorativas (como na imagem nas bordas) */}
      <div className="leaf-decoration leaf-tl">🍂</div>
      <div className="leaf-decoration leaf-tr">🍁</div>
      <div className="leaf-decoration leaf-bl">🍂</div>
      <div className="leaf-decoration leaf-br">🍁</div>

      <nav className="navbar">
        <div className="navbar-left">
          <div className="navbar-brand">
            <span className="navbar-logo-text" style={{ fontSize: '20px', color: 'var(--accent-gold)', textShadow: '2px 2px 0px #000' }}>PIXEL BOARD</span>
          </div>
        </div>
        
        <div className="navbar-center" style={{ gap: '8px' }}>
          <button className={`nav-btn ${currentView === 'home' ? 'active' : ''}`} onClick={() => setCurrentView('home')}>HOME</button>
          <button className={`nav-btn ${currentView === 'games' || currentView === 'chess' ? 'active' : ''}`} onClick={() => setCurrentView('games')}>GAMES</button>
          <button className={`nav-btn ${currentView === 'community' ? 'active' : ''}`} onClick={() => setCurrentView('community')}>COMMUNITY</button>
          <button className={`nav-btn ${currentView === 'profile' ? 'active' : ''}`} onClick={() => setCurrentView('profile')}>PROFILE</button>
          <button className={`nav-btn ${currentView === 'shop' ? 'active' : ''}`} onClick={() => setCurrentView('shop')}>SHOP</button>
        </div>

        <div className="navbar-right" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '10px', color: 'var(--accent-gold)' }}>{user.username}</span>
                <span style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>🪙 {user.coins}</span>
              </div>
              <button className="login-btn" onClick={handleLogout}>LOGOUT</button>
            </div>
          ) : (
            <>
              <button className="login-btn" onClick={() => { setAuthType('login'); setShowAuthModal(true); }}>LOGIN</button>
              <button className="register-btn" onClick={() => { setAuthType('register'); setShowAuthModal(true); }}>REGISTER</button>
            </>
          )}
        </div>
      </nav>
      
      <main className="main-content">
        {currentView === 'home' && (
          <div className="animate-fade-in home-dashboard" style={{ display: 'grid', gridTemplateColumns: '260px 1fr 300px', gap: '32px' }}>
            {/* LEFT COLUMN: FRIENDS */}
            <div className="friends-panel">
              <div className="friends-header">FRIENDS LIST</div>
              <div className="friends-list">
                <div className="friend-item">
                  <div className="friend-avatar"><span className="status-dot status-online"></span>🧙‍♂️</div>
                  <div className="friend-info">
                    <span className="friend-name">WizardTom</span>
                    <span className="friend-activity">Online</span>
                  </div>
                </div>
                <div className="friend-item">
                  <div className="friend-avatar"><span className="status-dot status-ingame"></span>🧝‍♀️</div>
                  <div className="friend-info">
                    <span className="friend-name">ElfRanger</span>
                    <span className="friend-activity">Playing Chess</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER COLUMN: FEATURED & NEWS */}
            <div className="home-center-column">
              <div className="featured-carousel">
                <div className="carousel-track">
                  <div className="carousel-slide featured-card" style={{ backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.8), transparent), url("/images/chess_classic.png")' }}>
                    <div className="slide-content">
                      <span className="badge badge-hot">HOT NOW</span>
                      <h2 className="slide-title">CHESS CHAMPIONSHIP</h2>
                      <p className="slide-desc">Join the monthly tournament and win 5000 coins!</p>
                      <button className="btn btn-primary" onClick={() => setCurrentView('chess')}>PLAY NOW</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="news-section" style={{ marginTop: '30px' }}>
                <h2 className="section-title">LATEST UPDATES</h2>
                <div className="news-grid">
                  <div className="news-card">
                    <div className="news-thumb" style={{ background: '#3a2e2e', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📰</div>
                    <div className="news-info">
                      <span className="news-date">MAY 15, 2026</span>
                      <h3 className="news-headline">Backend Integration Live!</h3>
                      <p className="news-excerpt">You can now register and save your progress across devices.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rankings-snippet" style={{ marginTop: '30px', padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                <h2 className="section-title">GLOBAL TOP 3</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                  <div className="rank-item first" style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '10px', borderRadius: '4px', border: '1px solid var(--accent-gold)' }}>
                    <span className="rank-num">#1</span>
                    <span className="rank-name">GrandmasterX</span>
                  </div>
                  <div className="rank-item" style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px' }}>
                    <span className="rank-num">#2</span>
                    <span className="rank-name">PixelQueen</span>
                  </div>
                  <div className="rank-item" style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px' }}>
                    <span className="rank-num">#3</span>
                    <span className="rank-name">ChessBot9000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: GLOBAL CHAT */}
            <div className="chat-panel">
              <div className="friends-header">GLOBAL CHAT</div>
              <div className="chat-messages">
                <div className="chat-message chat-system">
                  <span className="chat-text">Welcome to Pixel Board Global Chat!</span>
                </div>
              </div>
              <div className="chat-input-area">
                <input type="text" className="chat-input" placeholder="Type..." />
                <button className="chat-send-btn">▶</button>
              </div>
            </div>
          </div>
        )}

        {currentView === 'games' && (
          <div className="animate-fade-in games-dashboard">
            {/* LEFT COLUMN: FRIENDS */}
            <div className="friends-panel">
              <div className="friends-header">FRIENDS LIST</div>
              <div className="friends-list">
                <div className="friend-item">
                  <div className="friend-avatar"><span className="status-dot status-online"></span>🧙‍♂️</div>
                  <div className="friend-info">
                    <span className="friend-name">WizardTom</span>
                    <span className="friend-activity">Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER COLUMN: GAMES */}
            <div className="games-center-column">
              <h1 className="page-title" style={{ color: '#fff', textShadow: '2px 2px 0 #111', textAlign: 'center' }}>GAME SELECT</h1>
              <div className="games-grid" style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div className="game-card" onClick={() => setCurrentView('chess')} style={{ borderColor: 'var(--accent-gold)' }}>
                    <div style={{ height: '160px', overflow: 'hidden' }}>
                      <img src="/images/chess_classic.png" alt="Chess Classic" style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }} />
                    </div>
                    <div className="game-card-divider"></div>
                    <div className="game-card-body" style={{ flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>Board Game</span>
                      <span className="game-card-name text-gold" style={{ fontSize: '11px' }}>CHESS CLASSIC</span>
                      <span style={{ fontSize: '10px', color: 'var(--accent-gold)' }}>★★★★★</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div className="game-card" onClick={() => setCurrentView('damas')} style={{ borderColor: 'var(--accent-red)' }}>
                    <div style={{ height: '160px', overflow: 'hidden' }}>
                      <img src="/images/checkers_cover.png" alt="Checkers Classic" style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }} />
                    </div>
                    <div className="game-card-divider"></div>
                    <div className="game-card-body" style={{ flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>Board Game</span>
                      <span className="game-card-name text-red" style={{ fontSize: '11px', color: 'var(--accent-red)' }}>CHECKERS</span>
                      <span style={{ fontSize: '10px', color: 'var(--accent-red)' }}>★★★★☆</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: CHAT */}
            <div className="chat-panel">
              <div className="friends-header">GLOBAL CHAT</div>
              <div className="chat-messages">
                <div className="chat-message chat-system">
                  <span className="chat-text">Welcome! Find a match here.</span>
                </div>
              </div>
              <div className="chat-input-area">
                <input type="text" className="chat-input" placeholder="Type..." />
                <button className="chat-send-btn">▶</button>
              </div>
            </div>
          </div>
        )}

        {currentView === 'chess' && (
           <div className="animate-fade-in">
             <button className="back-btn" onClick={() => setCurrentView('games')} style={{ fontSize: '12px', marginBottom: '20px' }}>
               ◀ BACK TO GAMES
             </button>
             <Xadrez />
           </div>
        )}

        {currentView === 'damas' && (
           <div className="animate-fade-in">
             <button className="back-btn" onClick={() => setCurrentView('games')} style={{ fontSize: '12px', marginBottom: '20px' }}>
               ◀ BACK TO GAMES
             </button>
             <Damas />
           </div>
        )}

        {currentView === 'shop' && (
          <div className="animate-fade-in panel-window">
            <div className="panel-header">
              <span>ARCADE SHOP</span>
              <div className="panel-close-btn" onClick={() => setCurrentView('games')}>X</div>
            </div>
            <div className="panel-content">
              <div className="shop-grid">
                <div className="shop-item">
                  <div className="shop-item-icon">🐉</div>
                  <span className="shop-item-title">Dragon's Hoard</span>
                  <div className="shop-item-price">🪙 300</div>
                </div>
                <div className="shop-item">
                  <div className="shop-item-icon">🏴‍☠️</div>
                  <span className="shop-item-title">Shipwreck Isle</span>
                  <div className="shop-item-price">🪙 100</div>
                </div>
                <div className="shop-item">
                  <div className="shop-item-icon">🃏</div>
                  <span className="shop-item-title">Poker Royale</span>
                  <div className="shop-item-price">🪙 200</div>
                </div>
                <div className="shop-item">
                  <div className="shop-item-icon">🖼️</div>
                  <span className="shop-item-title">Custom Borders</span>
                  <div className="shop-item-price">🪙 100</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'profile' && (
          <div className="animate-fade-in panel-window">
            <div className="panel-header">
              <span>USER PROFILE: PixelPaladin</span>
              <div className="panel-close-btn" onClick={() => setCurrentView('games')}>X</div>
            </div>
            <div className="panel-content profile-layout">
              <div className="profile-sidebar">
                <div className="profile-box" style={{ textAlign: 'center' }}>
                  <div className="profile-avatar-container">🛡️</div>
                  <h3 className="text-pixel" style={{ fontSize: '10px', color: 'var(--accent-gold)' }}>Paladin</h3>
                </div>
                <div className="profile-box">
                  <h3 className="text-pixel" style={{ fontSize: '8px', marginBottom: '12px', textAlign: 'center' }}>STATS</h3>
                  <div className="profile-stats-row"><span>Games Played:</span> <span style={{color: 'var(--text-primary)'}}>229</span></div>
                  <div className="profile-stats-row"><span>Win Rate:</span> <span style={{color: 'var(--text-primary)'}}>42.3%</span></div>
                  <div className="profile-stats-row" style={{flexDirection: 'column', marginTop: '8px'}}>
                    <span style={{fontSize: '12px'}}>Most Played Game:</span>
                    <span style={{color: 'var(--accent-gold)', marginTop: '4px'}}>Chess Classic</span>
                  </div>
                </div>
              </div>
              <div className="profile-main">
                <div className="profile-box" style={{ height: '100%' }}>
                  <h3 className="text-pixel" style={{ fontSize: '10px', marginBottom: '16px', textAlign: 'center' }}>ACHIEVEMENTS</h3>
                  <div className="achievements-grid">
                    <div className="achievement-badge unlocked">
                      <div className="achievement-icon">🐉</div>
                      <span className="achievement-title">Dragon Slayer</span>
                    </div>
                    <div className="achievement-badge unlocked">
                      <div className="achievement-icon">🌲</div>
                      <span className="achievement-title">Forest Explorer</span>
                    </div>
                    <div className="achievement-badge">
                      <div className="achievement-icon">🔒</div>
                      <span className="achievement-title">Space Ace</span>
                    </div>
                    <div className="achievement-badge">
                      <div className="achievement-icon">🔒</div>
                      <span className="achievement-title">High Roller</span>
                    </div>
                    <div className="achievement-badge">
                      <div className="achievement-icon">🔒</div>
                      <span className="achievement-title">Grandmaster</span>
                    </div>
                    <div className="achievement-badge unlocked">
                      <div className="achievement-icon">🛡️</div>
                      <span className="achievement-title">First Win</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'community' && (
          <div className="animate-fade-in panel-window">
            <div className="panel-header">
              <span>RANKINGS: SEASON 3</span>
              <div className="panel-close-btn" onClick={() => setCurrentView('games')}>X</div>
            </div>
            <div className="panel-content">
              <div className="rankings-tabs">
                <div className="ranking-tab active">Overall</div>
                <div className="ranking-tab">Chess Classic</div>
                <div className="ranking-tab">Space Frontiers</div>
                <div className="ranking-tab">Poker Royale</div>
              </div>
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>RANK</th>
                    <th>PLAYER</th>
                    <th style={{textAlign: 'right'}}>TOTAL SCORE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="rank-1">
                    <td><span className="rank-icon">👑</span>1</td>
                    <td>KingPawn</td>
                    <td style={{textAlign: 'right'}}>34,328</td>
                  </tr>
                  <tr className="rank-2">
                    <td><span className="rank-icon">⭐</span>2</td>
                    <td>PixelQueen</td>
                    <td style={{textAlign: 'right'}}>32,150</td>
                  </tr>
                  <tr className="rank-3">
                    <td><span className="rank-icon">⭐</span>3</td>
                    <td>StarSailor</td>
                    <td style={{textAlign: 'right'}}>31,900</td>
                  </tr>
                  <tr>
                    <td>4</td>
                    <td>RogueKnight</td>
                    <td style={{textAlign: 'right'}}>28,450</td>
                  </tr>
                  <tr>
                    <td>5</td>
                    <td>MageTower</td>
                    <td style={{textAlign: 'right'}}>27,100</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ textAlign: 'center', marginTop: '16px', fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--accent-gold)' }}>
                MY RANK: 1,234
              </div>
            </div>
          </div>
        )}
      </main>

      {showAuthModal && (
        <div className="result-overlay" style={{ zIndex: 1000 }}>
          <div className="result-modal" style={{ padding: '30px' }}>
            <h2 className="result-title">{authType.toUpperCase()}</h2>
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              {error && <span style={{ color: 'var(--accent-red)', fontSize: '10px' }}>{error}</span>}
              <input
                type="text"
                className="chat-input"
                placeholder="USERNAME"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
              <input
                type="password"
                className="chat-input"
                placeholder="PASSWORD"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>
                {authType === 'login' ? 'START PLAYING' : 'CREATE ACCOUNT'}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: 'var(--text-muted)' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleGuestLogin} 
                style={{ width: '100%', justifyContent: 'center', background: 'var(--bg-primary)' }}
              >
                PLAY AS GUEST 👻
              </button>
              <button
                type="button"
                className="back-btn"
                onClick={() => setShowAuthModal(false)}
                style={{ margin: '0 auto', fontSize: '10px' }}
              >
                CANCEL
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default App
