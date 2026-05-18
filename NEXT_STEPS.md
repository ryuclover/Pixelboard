# 📋 PRÓXIMOS PASSOS - GUIA RÁPIDO

## ⚡ COMECE AGORA (5 min)

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed  # Popula com dados de teste
npm start     # Inicia em http://localhost:3001

# Novo terminal - Frontend
cd Pixel-Board
npm install
npm run dev   # Inicia em http://localhost:5173
```

## ✅ TESTE LOCALMENTE (10 min)

1. Abra http://localhost:5173
2. **Registre um novo user** (ex: testuser/password123)
3. **Jogue uma partida** (chess ou damas local para testar UI)
4. **Verifique seu perfil** - deve mostrar stats atualizadas
5. **Vá para leaderboard** - deve ver os test users do seed
6. **Envie uma mensagem no chat** - deve aparecer em tempo real
7. **Compre um item na shop** - deve gastar coins e marcar como OWNED

## 🔧 CONFIGURE VARIÁVEIS (.env)

Backend já está configurado com SQLite (dev.db). Para produção:

```bash
# backend/.env
DATABASE_URL="postgresql://user:pass@localhost:5432/pixelboard"
JWT_SECRET="seu-secret-bem-longo-aqui"
ALLOWED_ORIGINS="https://seu-frontend.com"
```

## 🌐 FAÇA O DEPLOY (30 min)

### 1️⃣ Deploy Backend (escolha uma opção)

**Railway.app (recomendado)**
```bash
npm install -g railway
railway login
railway link                    # conecta ao projeto
railway service add postgres    # adiciona banco
git push                        # deploy automático
```

**Render.com**
- Novo Web Service from GitHub
- Conecta repositório
- Cria PostgreSQL database
- Seta env vars
- Deploy automático

### 2️⃣ Configure Vercel (Frontend já está lá)

No dashboard Vercel:
1. Project Settings > Environment Variables
2. Adicione: `VITE_API_URL=https://seu-backend-url.railway.app`
3. Redeploy automático

### 3️⃣ Migre o Banco em Produção

```bash
# No seu provider (Railway/Render/etc)
npx prisma migrate deploy
npm run seed  # Opcional, popula inicial
```

## 🚀 TESTE EM PRODUÇÃO (5 min)

1. Acesse https://pixel-board-platform.vercel.app
2. Registre novo user
3. Teste online multiplayer (abra em 2 abas diferentes)
4. Verifique leaderboard
5. Teste compra na shop

## 🐛 TROUBLESHOOTING RÁPIDO

**"Connection refused"**
- Backend não está rodando
- Cheque porta 3001

**"CORS origin denied"**
- ALLOWED_ORIGINS no .env não inclui seu frontend
- Adicione seu domínio Vercel

**"Chat não funciona"**
- WebSocket pode estar bloqueado por firewall
- Verifique Socket.io CORS

**"Shop não aparece"**
- Rode `npm run seed` no backend
- POST /shop/seed se seed não executou

## 📊 MONITORAR EM PRODUÇÃO

```bash
# Railway
railway logs

# Render
# Dashboard > Logs tab

# Erros
# Check browser console (Dev Tools)
# Check backend logs
```

## 🎯 ARQUIVOS IMPORTANTES

| Arquivo | Propósito |
|---------|-----------|
| `backend/index.js` | Servidor Express + Socket.io + APIs |
| `backend/checkersLogic.cjs` | Validação de Damas |
| `backend/prisma/schema.prisma` | Definição do banco |
| `Pixel-Board/src/App.jsx` | App principal com todas as views |
| `Pixel-Board/src/games/xadrez/Xadrez.jsx` | Componente Chess |
| `Pixel-Board/src/games/damas/Damas.jsx` | Componente Checkers |
| `SETUP.md` | Guia completo de setup |
| `FEATURES.md` | Lista de features implementadas |

## 🎮 MULTIPLICADOR ONLINE ESTÁ FUNCIONANDO QUANDO:

✅ Dois players conseguem se conectar simultaneamente  
✅ Movimentos de um aparecem para o outro em tempo real  
✅ Resultado da partida salva no banco (POST /games/result)  
✅ Leaderboard atualiza com nova vitória  

## 🔐 SEGURANÇA CHECKLIST PRÉ-PRODUÇÃO

- [ ] JWT_SECRET é um string longo (>32 caracteres)
- [ ] DATABASE_URL usa credenciais seguras
- [ ] ALLOWED_ORIGINS restrito ao seu domínio
- [ ] Senhas hashadas com bcrypt (já implementado)
- [ ] Rate limiting ativo (já configurado)
- [ ] CORS restritivo (não aceita *)

## 📱 PRÓXIMAS FEATURES (Opcional)

- Avatar customization (shop items já existem)
- Socket reconnection com game state recovery
- ELO rating para matchmaking
- Replay system para past games
- Mobile app com React Native

## 💾 BACKUP DO BANCO

```bash
# Local
cp backend/dev.db backend/dev.db.backup

# Produção (Railway/Render fazem backup automático)
```

## 📞 SUPPORT

Leia os arquivos:
- `README.md` - Overview geral
- `SETUP.md` - Deployment detalhado
- `FEATURES.md` - Todas as features
- Logs de erro em `backend/logs/` (será criado)

---

**🚀 Status:** MVP Completo - Pronto para deploy!
