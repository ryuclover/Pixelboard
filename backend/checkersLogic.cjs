class Checkers {
  constructor() {
    this.board = this.createBoard();
    this.currentTurn = 'w';
    this.history = [];
    this.gameOverReason = null;
    this.winner = null;
    this.mandatoryJumpPiece = null;
  }

  createBoard() {
    const b = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          if (r < 3) b[r][c] = { color: 'b', type: 'm' };
          else if (r > 4) b[r][c] = { color: 'w', type: 'm' };
        }
      }
    }
    return b;
  }

  turn() {
    return this.currentTurn;
  }

  isGameOver() {
    return this.gameOverReason !== null;
  }

  get(square) {
    const c = square.charCodeAt(0) - 97;
    const r = 8 - parseInt(square[1]);
    if (this.isOnBoard(r, c)) {
      return this.board[r][c];
    }
    return null;
  }

  getAllMoves(playerColor) {
    let moves = [];
    let hasJump = false;

    if (this.mandatoryJumpPiece) {
      const r = this.mandatoryJumpPiece.r;
      const c = this.mandatoryJumpPiece.c;
      const pieceMoves = this.getMovesForPiece(r, c);
      moves = pieceMoves.filter(m => m.isJump);
      return { moves, hasJump: true };
    }

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece && piece.color === playerColor) {
          const pieceMoves = this.getMovesForPiece(r, c);
          for (let m of pieceMoves) {
            if (m.isJump) {
              if (!hasJump) {
                moves = [];
                hasJump = true;
              }
              moves.push(m);
            } else if (!hasJump) {
              moves.push(m);
            }
          }
        }
      }
    }
    return { moves, hasJump };
  }

  getMovesForPiece(r, c) {
    const piece = this.board[r][c];
    if (!piece) return [];
    
    let directions = [];
    if (piece.type === 'k') {
      directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    } else if (piece.color === 'w') {
      directions = [[-1, -1], [-1, 1]];
    } else {
      directions = [[1, -1], [1, 1]];
    }

    const moves = [];
    
    for (let [dr, dc] of directions) {
      const nr = r + dr * 2;
      const nc = c + dc * 2;
      const mr = r + dr;
      const mc = c + dc;
      
      if (this.isOnBoard(nr, nc)) {
        const midPiece = this.board[mr][mc];
        if (midPiece && midPiece.color !== piece.color && !this.board[nr][nc]) {
          moves.push({ from: {r, c}, to: {r: nr, c: nc}, isJump: true, jumpOver: {r: mr, c: mc} });
        }
      }
    }

    for (let [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      if (this.isOnBoard(nr, nc) && !this.board[nr][nc]) {
        moves.push({ from: {r, c}, to: {r: nr, c: nc}, isJump: false });
      }
    }

    return moves;
  }

  isOnBoard(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  notationToCoords(square) {
    const c = square.charCodeAt(0) - 97;
    const r = 8 - parseInt(square[1]);
    return {r, c};
  }

  coordsToNotation({r, c}) {
    const cols = ['a','b','c','d','e','f','g','h'];
    const row = 8 - r;
    return cols[c] + row;
  }

  move(moveReq) {
    const fromCoord = this.notationToCoords(moveReq.from);
    const toCoord = this.notationToCoords(moveReq.to);

    const all = this.getAllMoves(this.currentTurn);
    const validMove = all.moves.find(m => 
      m.from.r === fromCoord.r && m.from.c === fromCoord.c &&
      m.to.r === toCoord.r && m.to.c === toCoord.c
    );

    if (!validMove) return null;

    const piece = this.board[validMove.from.r][validMove.from.c];
    let captured = false;
    
    this.board[validMove.from.r][validMove.from.c] = null;
    this.board[validMove.to.r][validMove.to.c] = piece;

    if (validMove.isJump) {
      this.board[validMove.jumpOver.r][validMove.jumpOver.c] = null;
      captured = true;
    }

    let promoted = false;
    if (piece.type === 'm') {
      if (piece.color === 'w' && validMove.to.r === 0) {
        piece.type = 'k';
        promoted = true;
      } else if (piece.color === 'b' && validMove.to.r === 7) {
        piece.type = 'k';
        promoted = true;
      }
    }

    let canJumpAgain = false;
    if (validMove.isJump && !promoted) {
      const furtherMoves = this.getMovesForPiece(validMove.to.r, validMove.to.c);
      canJumpAgain = furtherMoves.some(m => m.isJump);
    }

    const moveStr = `${moveReq.from}${validMove.isJump ? 'x' : '-'}${moveReq.to}`;
    
    if (canJumpAgain) {
      this.mandatoryJumpPiece = validMove.to;
      if (this.history.length > 0 && this.history[this.history.length - 1].includes(moveReq.from) && captured) {
        this.history[this.history.length - 1] += `x${moveReq.to}`;
      } else {
        this.history.push(moveStr);
      }
    } else {
      this.mandatoryJumpPiece = null;
      if (this.history.length > 0 && this.history[this.history.length - 1].includes(moveReq.from) && captured && this.history[this.history.length-1].endsWith(moveReq.from)) {
          this.history[this.history.length - 1] += `x${moveReq.to}`;
      } else {
          this.history.push(moveStr);
      }
      this.currentTurn = this.currentTurn === 'w' ? 'b' : 'w';
    }

    this.checkWinCondition();

    return { moveStr, captured, promoted };
  }

  checkWinCondition() {
    const allNextMoves = this.getAllMoves(this.currentTurn).moves;
    if (allNextMoves.length === 0) {
      this.winner = this.currentTurn === 'w' ? 'Black' : 'White';
      this.gameOverReason = 'No valid moves remaining';
    }
  }

  clone() {
    const copy = new Checkers();
    copy.board = this.board.map(row => row.map(p => p ? { ...p } : null));
    copy.currentTurn = this.currentTurn;
    copy.history = [...this.history];
    copy.gameOverReason = this.gameOverReason;
    copy.winner = this.winner;
    copy.mandatoryJumpPiece = this.mandatoryJumpPiece ? { ...this.mandatoryJumpPiece } : null;
    return copy;
  }
}

module.exports = { Checkers };
