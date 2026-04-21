// src/engine/mcts.js
class MCTSNode {
  constructor(board, parent = null, move = null) {
    this.board = board;           // deep copy of Wukong board
    this.parent = parent;
    this.move = move;
    this.children = [];
    this.visits = 0;
    this.value = 0;
    this.prior = 1.0;
  }
}

class MCTS {
  constructor(engine, timeLimit = 3000) {   // 3 seconds thinking time
    this.engine = engine;
    this.timeLimit = timeLimit;
  }

  async getBestMove(currentBoard) {
    const root = new MCTSNode(JSON.parse(JSON.stringify(currentBoard)));
    const startTime = Date.now();

    while (Date.now() - startTime < this.timeLimit) {
      let node = this._select(root);
      if (!this.engine.isGameOver(node.board)) {
        this._expand(node);
      }
      const value = this._simulate(node);
      this._backpropagate(node, value);
    }

    // Pick the move with the most visits
    let bestChild = root.children[0];
    for (let child of root.children) {
      if (child.visits > bestChild.visits) bestChild = child;
    }
    return bestChild.move;
  }

  _select(node) {
    while (node.children.length > 0) {
      node = this._getBestChild(node);
    }
    return node;
  }

  _getBestChild(node) {
    return node.children.reduce((best, child) => {
      const score = (child.value / child.visits) +
                    1.4 * Math.sqrt(Math.log(node.visits + 1) / (child.visits + 1));
      return score > best.score ? {child, score} : best;
    }, {child: node.children[0], score: -Infinity}).child;
  }

  _expand(node) {
    const moves = this.engine.generateLegalMoves(node.board);
    for (let move of moves) {
      const newBoard = this.engine.makeMove(JSON.parse(JSON.stringify(node.board)), move);
      const child = new MCTSNode(newBoard, node, move);
      node.children.push(child);
    }
  }

  _simulate(node) {
    return this.engine.evaluate(node.board);   // reuse Wukong's evaluation
  }

  _backpropagate(node, value) {
    while (node) {
      node.visits++;
      node.value += value;
      node = node.parent;
      value = -value;
    }
  }
}

// Make it available to the rest of the code
window.MCTS = MCTS;
