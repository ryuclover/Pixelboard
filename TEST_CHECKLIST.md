# 🧪 TEST CHECKLIST - PIXEL-BOARD

Use este checklist para verificar se tudo está funcionando corretamente.

## 🚀 PRÉ-REQUISITOS

- [ ] Node.js 16+ instalado
- [ ] Git configurado
- [ ] Backend rodando em http://localhost:3001
- [ ] Frontend rodando em http://localhost:5173

## 🔑 FASE 1: AUTENTICAÇÃO

### Registro
- [ ] Clique em "REGISTER"
- [ ] Preencha: username, email (opcional), senha
- [ ] Click "CREATE ACCOUNT"
- [ ] Deve redirecionar para login

### Login
- [ ] Preencha as credenciais criadas
- [ ] Clique "LOGIN"
- [ ] Deve abrir menu de games
- [ ] Seu username aparece no canto superior

### Persistência
- [ ] Recarregue a página (F5)
- [ ] Deve estar logado ainda (token no localStorage)
- [ ] Logout deve limpar token

## 🎮 FASE 2: GAMES LOCAIS

### Chess Local
- [ ] Clique em "CHESS"
- [ ] Selecione "LOCAL PLAYER"
- [ ] Jogue alguns movimentos
- [ ] Verifique:
  - [ ] Peças se movem corretamente
  - [ ] Check é detectado
  - [ ] Checkmate termina o jogo

### Checkers Local
- [ ] Clique em "CHECKERS"
- [ ] Selecione "LOCAL PLAYER"
- [ ] Jogue alguns movimentos
- [ ] Verifique:
  - [ ] Peças se movem corretamente
  - [ ] Jumps funcionam (captura)
  - [ ] Promoção quando atinge a linha final

## 👤 FASE 3: PERFIL

- [ ] Clique no ícone de PERFIL (seu username)
- [ ] Verifique dados exibidos:
  - [ ] Username correto
  - [ ] Avatar exibido
  - [ ] Coins exibidos (deve ter valor inicial)
  - [ ] Games Played: 0 (novo usuário)
  - [ ] Games Won: 0 (novo usuário)
  - [ ] Win Rate: --

### Achievements
- [ ] Seção de achievements deve existir
- [ ] Deve estar vazia para novo usuário

## 🏆 FASE 4: LEADERBOARD

- [ ] Clique em "LEADERBOARD"
- [ ] Verifique:
  - [ ] Lista de players exibida
  - [ ] Cada player tem: nome, wins, winRate, coins
  - [ ] Classificação com 👑 (1º), ⭐ (2-3), 🔸 (outros)
  - [ ] Seu rank aparece destacado se você está no ranking

## 💬 FASE 5: CHAT

### Global Chat Panel
- [ ] No topo direito, verifique o painel de chat
- [ ] Deve estar vazio ou com mensagens anteriores

### Enviar Mensagem
- [ ] Clique no input de chat
- [ ] Digiteme: "teste de chat"
- [ ] Pressione Enter
- [ ] Verifique:
  - [ ] Sua mensagem aparece no chat
  - [ ] Mostra seu username e avatar
  - [ ] Timestamp é exibido
  - [ ] Input foi limpo

### Persistência
- [ ] Recarregue a página
- [ ] Suas mensagens anteriores devem estar lá

## 🛍️ FASE 6: SHOP

- [ ] Clique em "SHOP"
- [ ] Verifique:
  - [ ] Seu saldo de coins aparece no título
  - [ ] Todos os 8 itens aparecem com ícones

### Comprar Item
- [ ] Selecione um item (ex: Dragon Avatar - 150 coins)
- [ ] Clique "BUY"
- [ ] Verifique:
  - [ ] Coins diminuem (ex: 500 -> 350)
  - [ ] Botão muda para "OWNED"
  - [ ] Botão fica desabilitado (opacity 0.5)
  - [ ] Sem moedas suficientes: botão RED + disabled

### Sem Fundos
- [ ] Tente comprar item mais caro que seu saldo
- [ ] Botão deve estar RED e disabled
- [ ] Não deve permitir compra

## 👥 FASE 7: FRIENDS (UI Check)

- [ ] Clique em "FRIENDS" se existir botão
- [ ] Verifique:
  - [ ] Existe input para adicionar amigo
  - [ ] Lista de amigos (vazia para novo usuário)

## 🔄 FASE 8: ONLINE MULTIPLAYER (Requer 2 abas)

### Preparação
- [ ] Abra 2 abas do navegador com http://localhost:5173
- [ ] Faça login com 2 usuários diferentes
  - Usuário 1: user1/pass1
  - Usuário 2: user2/pass2

### Chess Online
- [ ] User1: Clique CHESS > ONLINE
- [ ] User1: Click "FIND MATCH"
- [ ] User2: Clique CHESS > ONLINE
- [ ] User2: Click "FIND MATCH"
- [ ] Verifique:
  - [ ] Ambos encontram match
  - [ ] Tabuleiro carrega para ambos
  - [ ] User1 é branco, User2 é preto (ou vice-versa)

### Fazer Movimento
- [ ] User1: Faça um movimento válido
- [ ] User2: Deve ver o movimento aparecer em tempo real
- [ ] User2: Faça um movimento
- [ ] User1: Deve ver aparecer

### Terminar Partida
- [ ] Continuem jogando até alguém vencer
- [ ] Verifique:
  - [ ] Game Over modal aparece
  - [ ] Mostra "You Won" ou "You Lost"
  - [ ] Ambos os players veem resultado

### Verificar Persistência
- [ ] Recarregue a página do vencedor
- [ ] Vá para PERFIL
- [ ] Verifique:
  - [ ] Games Played aumentou (ex: 1)
  - [ ] Games Won aumentou se ganhou
  - [ ] Coins aumentaram? (se houver reward)

### Verificar Leaderboard
- [ ] Ambos vão para LEADERBOARD
- [ ] Verifique:
  - [ ] Rankings atualizaram
  - [ ] Win rates foram calculados
  - [ ] Order está coreto

## 🔐 FASE 9: SEGURANÇA

### Token Expiration
- [ ] Faça login
- [ ] Guarde o token que aparece nos browser dev tools
- [ ] Logout
- [ ] Console: `localStorage.clear()`
- [ ] Tente acessar página sem estar logado
- [ ] Deve redirecionar para login

### Input Validation
- [ ] Tente registrar com username vazio
- [ ] Deve mostrar erro
- [ ] Tente registrar com senha curta
- [ ] Deve mostrar erro

## 🔌 FASE 10: SOCKET.IO & RECONEXÃO

### Normal Connection
- [ ] Abra 2 abas
- [ ] Ambas fazendo login
- [ ] Socket deve conectar para cada um
- [ ] Check browser console: nenhum erro de CORS

### Simular Desconexão
- [ ] Pause internet (Dev Tools > Network > Offline)
- [ ] Espere 3 segundos
- [ ] Retome internet
- [ ] App deve reconectar automaticamente
- [ ] Socket deve estar "connected" novamente

## 📱 FASE 11: RESPONSIVENESS (Opcional)

- [ ] Redimensione o navegador para mobile (375px)
- [ ] Verifique:
  - [ ] Botões ainda são clicáveis
  - [ ] Texto não fica cutoff
  - [ ] Tabuleiro ainda é jogável

## ⚠️ FASE 12: ERROR HANDLING

### Servidor Offline
- [ ] Pause o backend (`Ctrl+C`)
- [ ] Tente fazer uma ação (comprar item, etc)
- [ ] Deve aparecer erro apropriado, não crash

### Banco de Dados Offline
- [ ] Pause Prisma
- [ ] Tente comprar item
- [ ] Deve aparecer erro de banco

## 📊 FINAL VERIFICATION

| Feature | Status | Notes |
|---------|--------|-------|
| Auth (Reg/Login) | ✅/❌ | |
| Chess Local | ✅/❌ | |
| Chess Online | ✅/❌ | |
| Checkers Local | ✅/❌ | |
| Checkers Online | ✅/❌ | |
| Profile | ✅/❌ | |
| Leaderboard | ✅/❌ | |
| Chat | ✅/❌ | |
| Shop | ✅/❌ | |
| Friends | ✅/❌ | |
| Persistence | ✅/❌ | |
| Socket.io | ✅/❌ | |
| Error Handling | ✅/❌ | |

## 🎉 RESULTADO FINAL

Se todos os itens acima estão ✅, então:

```
✨ PIXEL-BOARD ESTÁ 100% FUNCIONAL ✨
```

Pronto para:
- [ ] Deploy em produção
- [ ] Convidar usuários
- [ ] Escala de usuários
- [ ] Adicionar mais features

## 📝 NOTAS

- Qualquer ❌ significa bug a corrigir
- Verifique console (F12) para erros
- Check Network tab para CORS issues
- Verifique backend logs para 500 errors

---

**Test Date**: ___________  
**Tester**: ___________  
**Result**: ✅ PASS / ❌ FAIL
