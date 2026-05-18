# 👾 Pixel Board

**Pixel Board** é uma plataforma arcade web-based para jogar jogos de tabuleiro clássicos com estética retro pixel-art e multiplayer em tempo real.

![Pixel Board Aesthetic](Pixel-Board/public/favicon.svg)

**Live:** https://pixel-board-platform.vercel.app

## ✨ FEATURES

### 🎮 Game Engines
- **Chess** - Regras completas com validação server-side
- **Checkers (Damas)** - Captura múltipla, promoção, salto obrigatório
- **Local Player** - Jogue contra outro jogador na mesma tela
- **AI Bot** - Prática contra computador
- **Online Multiplayer** - Socket.io em tempo real com matchmaking automático

### 👤 User System
- **Autenticação** - Registro/Login com JWT tokens
- **Perfil** - Avatar customizável, histórico de partidas
- **Estatísticas** - Games played, games won, win rate em tempo real
- **Achievements** - First Win, 10 Matches, 50 Matches, 60% Win Rate

### 🏆 Competitivo
- **Leaderboard Global** - Top 100 players com rankings e badges
- **Game History** - Ver detalhes de todas as partidas jogadas
- **Win Rate** - Cálculo automático de taxa de vitória

### 👥 Social
- **Friends** - Sistema de amigos com add/remove
- **Global Chat** - Chat em tempo real com Socket.io
- **Player Profiles** - Ver perfil de qualquer jogador

### 🛍️ Economia
- **Coins System** - Moeda virtual para compras
- **Shop** - 8 itens cosméticos (avatares, temas, bordas)
- **Inventory** - Rastreamento de itens comprados
- **Economy Balance** - Sistema de preços e recompensas

### 🔌 Técnico
- **WebSocket Real-time** - Socket.io para tudo que é multiplayer
- **Reconexão Automática** - Reconnect com exponential backoff até 10 tentativas
- **Game Validation** - Validação server-side previne cheating
- **Database Persistence** - Prisma ORM com relações
- **Protected Endpoints** - JWT authentication em endpoints sensíveis
- **Rate Limiting** - Proteção contra brute force

## 🛠️ Tech Stack

### Frontend (`/Pixel-Board`)
- **React 19.2** + **Vite 8.0** - Framework moderno e rápido
- **CSS Vanilla** - Design system retro customizado com animações
- **Socket.io-client 4.8** - Comunicação real-time bidireção
- **chess.js 1.4** - Validação de movimentos de xadrez
- **Axios** - HTTP client para API calls

### Backend (`/backend`)
- **Express 5.2** - Servidor web robusto
- **Socket.io 4.8** - Matchmaking e broadcasting de movimentos
- **Prisma 5.11** - ORM type-safe com SQLite/PostgreSQL
- **JWT + bcrypt** - Autenticação segura
- **CORS** - Configurado para produção

## 📊 Database Schema

7 modelos principais:
- **User** - Contas com autenticação JWT
- **Game** - Histórico de partidas com resultados e movimentos
- **Friend** - Relacionamento entre amigos (bidirecional)
- **ShopItem** - Items disponíveis na loja
- **UserItem** - Inventário (items do usuário)
- **ChatMessage** - Mensagens do chat global
- **Achievement** - Badges e conquistas (framework pronto)

## 🚀 Running Locally

Requer [Node.js 16+](https://nodejs.org/).

### Setup Rápido (5 min)

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed  # Popula com dados de teste
npm start
```

Backend roda em `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd Pixel-Board
npm install
npm run dev
```

Frontend roda em `http://localhost:5173`

## 🔧 Environment Variables

**Backend (.env)**
```
PORT=3001
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET=seu-secret-bem-longo-aqui
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:5173,https://seu-dominio.com
```

**Frontend (Vercel)**
```
VITE_API_URL=https://seu-backend-url.com
```

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Deployment guide para Railway/Render/Heroku
- **[FEATURES.md](FEATURES.md)** - Lista completa de features implementadas
- **[STATUS.md](STATUS.md)** - Status do projeto
- **[NEXT_STEPS.md](NEXT_STEPS.md)** - Quick start com 5 passos
- **[TEST_CHECKLIST.md](TEST_CHECKLIST.md)** - Checklist de testes
- **[GIT_COMMITS.md](GIT_COMMITS.md)** - Template de commits

## 🌐 Deployment

### Frontend (✅ LIVE)
Frontend está deployed em Vercel:  
https://pixel-board-platform.vercel.app

### Backend (⏳ TODO)
Escolha uma opção:

**Railway (recomendado)**
```bash
npm install -g railway
railway login
railway link
git push
```

**Render.com**
- New Web Service from GitHub
- Add PostgreSQL database
- Deploy

**Heroku**
```bash
heroku create seu-app-name
heroku addons:create heroku-postgresql
git push heroku main
```

Ver [SETUP.md](SETUP.md) para instruções completas.

## 🧪 Testing

```bash
# Ver TEST_CHECKLIST.md para guia passo-a-passo
npm run dev  # Inicia frontend
npm start    # Inicia backend (outro terminal)
```

Abra http://localhost:5173 e comece a testar!

## 📊 Project Stats

| Métrica | Value |
|---------|-------|
| Game Engines | 2 (Chess + Checkers) |
| Multiplayer | ✅ Sim |
| Database Models | 7 |
| API Endpoints | 12+ |
| Frontend Views | 5 |
| Socket.io Events | 6+ |
| Features | 50+ |
| Lines of Code | 3000+ |

## 🔐 Security

- ✅ Passwords hashed com bcrypt
- ✅ JWT tokens com 7 dias de expiração
- ✅ Validação server-side de movimentos (anti-cheat)
- ✅ CORS configurado para produção
- ✅ Rate limiting em auth endpoints
- ✅ Protected endpoints com JWT middleware

## 🎯 Próximas Features (opcional)

- [ ] Avatar customization integration
- [ ] Sistema de ELO para ranking
- [ ] Replay system para past games
- [ ] Daily/weekly challenges
- [ ] Modo espectador
- [ ] Mobile app (React Native)

## 📞 Support

Para dúvidas ou problemas:
1. Leia os docs em `SETUP.md` ou `NEXT_STEPS.md`
2. Verifique `TEST_CHECKLIST.md` se algo não funciona
3. Veja `STATUS.md` para entender status atual

## 📄 License

MIT - Veja LICENSE.md

---

**Status:** ✅ MVP Completo - Pronto para Produção

Desenvolvido com ❤️ em React + Express
