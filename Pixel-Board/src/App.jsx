import { useState, useEffect } from 'react'
import axios from 'axios'
import Xadrez from './games/xadrez/Xadrez'
import Damas from './games/damas/Damas'
import { io } from 'socket.io-client'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState('login'); // 'login' or 'register'
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [socket, setSocket] = useState(null);
  const [shopItems, setShopItems] = useState([]);
  const [userInventory, setUserInventory] = useState([]);

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

  // Load leaderboard
  useEffect(() => {
    axios.get(`${API_URL}/leaderboard`)
      .then(res => {
        setLeaderboard(res.data);
        if (user) {
          const rank = res.data.findIndex(p => p.id === user.id) + 1;
          setUserRank(rank || null);
        }
      })
      .catch(err => console.error('Failed to load leaderboard:', err));
  }, [user, currentView]);

  // Load shop items
  useEffect(() => {
    axios.get(`${API_URL}/shop`)
      .then(res => setShopItems(res.data))
      .catch(err => console.error('Failed to load shop:', err));
  }, []);

  // Load user inventory
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    axios.get(`${API_URL}/inventory`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUserInventory(res.data.map(ui => ui.id)))
      .catch(err => console.error('Failed to load inventory:', err));
  }, [user]);

  // Initialize socket and load chat
  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => console.log('Socket connected'));
    
    // Load chat history
    axios.get(`${API_URL}/chat`)
      .then(res => setChatMessages(res.data))
      .catch(err => console.error('Failed to load chat:', err));

    // Listen for new chat messages
    newSocket.on('chat_message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    return () => newSocket.close();
  }, []);

  const handleChatSend = () => {
    if (!chatInput.trim() || !user || !socket) return;
    
    socket.emit('chat_message', {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      message: chatInput
    });
    setChatInput('');
  };

  const handleBuyItem = async (itemId) => {
    if (!user) return;
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/shop/buy/${itemId}`, {}, 
        { headers: { Authorization: `Bearer ${token}` } });
      setUserInventory([...userInventory, itemId]);
      setUser({ ...user, coins: user.coins - shopItems.find(i => i.id === itemId).price });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to buy item');
    }
  };

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
              <div className="chat-messages" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className="chat-message" style={{ marginBottom: '8px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                      {msg.avatar} <span style={{ color: 'var(--accent-gold)' }}>{msg.username}</span>
                    </div>
                    <span className="chat-text" style={{ fontSize: '9px', marginTop: '4px', display: 'block' }}>{msg.message}</span>
                  </div>
                ))}
              </div>
              <div className="chat-input-area">
                <input 
                  type="text" 
                  className="chat-input" 
                  placeholder={user ? "Type message..." : "Login to chat"}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                  disabled={!user}
                />
                <button className="chat-send-btn" onClick={handleChatSend} disabled={!user}>▶</button>
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
            {/* RIGHT COLUMN: CHAT */}
            <div className="chat-panel">
              <div className="friends-header">GLOBAL CHAT</div>
              <div className="chat-messages" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className="chat-message" style={{ marginBottom: '8px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                      {msg.avatar} <span style={{ color: 'var(--accent-gold)' }}>{msg.username}</span>
                    </div>
                    <span className="chat-text" style={{ fontSize: '9px', marginTop: '4px', display: 'block' }}>{msg.message}</span>
                  </div>
                ))}
              </div>
              <div className="chat-input-area">
                <input 
                  type="text" 
                  className="chat-input" 
                  placeholder={user ? "Type message..." : "Login to chat"}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                  disabled={!user}
                />
                <button className="chat-send-btn" onClick={handleChatSend} disabled={!user}>▶</button>
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
              <span>ARCADE SHOP - 🪙 {user?.coins || 0}</span>
              <div className="panel-close-btn" onClick={() => setCurrentView('games')}>X</div>
            </div>
            <div className="panel-content">
              <div className="shop-grid">
                {shopItems.map(item => (
                  <div key={item.id} className="shop-item" style={{ cursor: 'pointer', opacity: userInventory.includes(item.id) ? 0.5 : 1 }}>
                    <div className="shop-item-icon">{item.icon}</div>
                    <span className="shop-item-title">{item.name}</span>
                    <div className="shop-item-price" style={{ color: user?.coins >= item.price ? 'var(--accent-gold)' : 'var(--accent-red)' }}>🪙 {item.price}</div>
                    <button 
                      className="btn btn-primary" 
                      style={{ fontSize: '8px', padding: '6px 12px', marginTop: '8px', width: '100%' }}
                      onClick={() => handleBuyItem(item.id)}
                      disabled={userInventory.includes(item.id) || !user || user.coins < item.price}
                    >
                      {userInventory.includes(item.id) ? 'OWNED' : 'BUY'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentView === 'profile' && (
          <div className="animate-fade-in panel-window">
            <div className="panel-header">
              <span>USER PROFILE: {user ? user.username.toUpperCase() : 'GUEST'}</span>
              <div className="panel-close-btn" onClick={() => setCurrentView('games')}>X</div>
            </div>
            <div className="panel-content profile-layout">
              <div className="profile-sidebar">
                <div className="profile-box" style={{ textAlign: 'center' }}>
                  <div className="profile-avatar-container" style={{ fontSize: '48px' }}>{user?.avatar || '👻'}</div>
                  <h3 className="text-pixel" style={{ fontSize: '10px', color: 'var(--accent-gold)' }}>{user?.username || 'GUEST'}</h3>
                  <div style={{ fontSize: '8px', color: 'var(--text-secondary)', marginTop: '4px' }}>🪙 {user?.coins || 0}</div>
                </div>
                <div className="profile-box">
                  <h3 className="text-pixel" style={{ fontSize: '8px', marginBottom: '12px', textAlign: 'center' }}>STATS</h3>
                  <div className="profile-stats-row"><span>Games Played:</span> <span style={{color: 'var(--text-primary)'}}>{user?.gamesPlayed || 0}</span></div>
                  <div className="profile-stats-row"><span>Games Won:</span> <span style={{color: 'var(--accent-gold)'}}>{user?.gamesWon || 0}</span></div>
                  <div className="profile-stats-row"><span>Win Rate:</span> <span style={{color: 'var(--text-primary)'}}>{user?.gamesPlayed > 0 ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(1) : 0}%</span></div>
                </div>
              </div>
              <div className="profile-main">
                <div className="profile-box" style={{ height: '100%' }}>
                  <h3 className="text-pixel" style={{ fontSize: '10px', marginBottom: '16px', textAlign: 'center' }}>ACHIEVEMENTS</h3>
                  <div className="achievements-grid">
                    {user?.gamesWon >= 1 && (
                      <div className="achievement-badge unlocked">
                        <div className="achievement-icon">🏆</div>
                        <span className="achievement-title">First Win</span>
                      </div>
                    )}
                    {user?.gamesPlayed >= 10 && (
                      <div className="achievement-badge unlocked">
                        <div className="achievement-icon">⚡</div>
                        <span className="achievement-title">10 Matches</span>
                      </div>
                    )}
                    {user?.gamesPlayed >= 50 && (
                      <div className="achievement-badge unlocked">
                        <div className="achievement-icon">🔥</div>
                        <span className="achievement-title">50 Matches</span>
                      </div>
                    )}
                    {user && user.gamesWon / (user.gamesPlayed || 1) >= 0.6 && (
                      <div className="achievement-badge unlocked">
                        <div className="achievement-icon">👑</div>
                        <span className="achievement-title">60% Win Rate</span>
                      </div>
                    )}
                    {!user?.gamesWon && (
                      <div className="achievement-badge">
                        <div className="achievement-icon">🔒</div>
                        <span className="achievement-title">First Win</span>
                      </div>
                    )}
                    {user?.gamesPlayed < 10 && (
                      <div className="achievement-badge">
                        <div className="achievement-icon">🔒</div>
                        <span className="achievement-title">10 Matches</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'community' && (
          <div className="animate-fade-in panel-window">
            <div className="panel-header">
              <span>LEADERBOARD</span>
              <div className="panel-close-btn" onClick={() => setCurrentView('games')}>X</div>
            </div>
            <div className="panel-content">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>RANK</th>
                    <th>PLAYER</th>
                    <th style={{textAlign: 'right'}}>WINS</th>
                    <th style={{textAlign: 'right'}}>PLAYED</th>
                    <th style={{textAlign: 'right'}}>WIN RATE</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.slice(0, 50).map((player, idx) => (
                    <tr key={player.id} className={idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : ''}>
                      <td>
                        <span className="rank-icon">
                          {idx === 0 ? '👑' : idx === 1 ? '⭐' : idx === 2 ? '⭐' : idx < 10 ? '🔸' : ''}
                        </span>
                        {player.rank}
                      </td>
                      <td>{player.username} {player.avatar}</td>
                      <td style={{textAlign: 'right'}}>{player.gamesWon}</td>
                      <td style={{textAlign: 'right'}}>{player.gamesPlayed}</td>
                      <td style={{textAlign: 'right', color: 'var(--accent-gold)'}}>{player.winRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {userRank && user && (
                <div style={{ textAlign: 'center', marginTop: '16px', fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--accent-gold)', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
                  YOUR RANK: #{userRank}
                </div>
              )}
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
