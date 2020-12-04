var board = setupBoard();
var playerNum = 0; // 0 = white, 1 = black
//0 tries to maximize, 1 tries to minimize
var currentTurn = 0;

var pieceValues = {
    '': 0,
    'P': 1,
    'N': 3,
    'B': 3,
    'R': 5,
    'Q': 9,
    'K': 0,
    'p': -1,
    'n': -3,
    'b': -3,
    'r': -5,
    'q': -9,
    'k': 0
}

var colorPieces = {
    0: ['R', 'N', 'B', 'K', 'Q', 'P'],
    1: ['r', 'n', 'b', 'k', 'q', 'p'],
}

var pieceThreats = {
    'P': [[-1, -1], [-1, 1]],
    'p': [[1, -1], [1, 1]],
    'R': [],
    'r': [],
    'N': [[-2, 1], [-1, 2], [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1]],
    'n': [[-2, 1], [-1, 2], [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1]],
    'B': [],
    'b': [],
    'K': [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],
    'k': [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],
    'Q': [],
    'q': []
}

var pieceThreatsLos = {
    'P': [],
    'p': [],
    'R': [[-1, 0], [1, 0], [0, -1], [0, 1]],
    'r': [[-1, 0], [1, 0], [0, -1], [0, 1]],
    'N': [],
    'n': [],
    'B': [[-1, -1], [1, 1], [1, -1], [-1, 1]],
    'b': [[-1, -1], [1, 1], [1, -1], [-1, 1]],
    'K': [],
    'k': [],
    'Q': [[-1, -1], [1, 1], [1, -1], [-1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
    'q': [[-1, -1], [1, 1], [1, -1], [-1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
}

var prettyPrintSymbols = {
    'p': '♟',
    'P': '♙',
    '': '  ',
    'N': '♘',
    'B': '♗',
    'R': '♖',
    'Q': '♕',
    'K': '♔',
    'n': '♞',
    'b': '♝',
    'r': '♜',
    'q': '♛',
    'k': '♚'
}

function setupBoard() {
    return [
        ['R', 'N', 'B', 'K', 'Q', 'B', 'N', 'R'],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['', '', '', '', '', '', '', '',],
        ['', '', '', '', '', '', '', '',],
        ['', '', '', '', '', '', '', '',],
        ['', '', '', '', '', '', '', '',],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        ['r', 'n', 'b', 'k', 'q', 'b', 'n', 'r'],
    ];
}


//#region AVAILABLE MOVES
function getAvailableMoves(currentBoard, row, column) {
    var pieceType = currentBoard[row][column];
    switch (pieceType.toUpperCase()) {
        case 'P':
            return getAvailableMovesPawn(currentBoard, row, column, isPieceWhite(pieceType));
        case 'N':
            return getAvailableMovesKnight(currentBoard, row, column, isPieceWhite(pieceType));
        case 'B':
            return getAvailableMovesBishop(currentBoard, row, column, isPieceWhite(pieceType));
        case 'R':
            return getAvailableMovesRook(currentBoard, row, column, isPieceWhite(pieceType));
        case 'Q':
            return getAvailableMovesRook(currentBoard, row, column, isPieceWhite(pieceType)).concat(getAvailableMovesBishop(currentBoard, row, column, isPieceWhite(pieceType)));
        case 'K':
            return getAvailableMovesKing(currentBoard, row, column, isPieceWhite(pieceType));
        default:
            break;
    }
}

function getAvailableMovesPawn(currentBoard, row, col, pieceIsWhite) {
    //TODO: EN PASSANT
    var currentPiece = currentBoard[row][col];
    var res = [];
    var direction = pieceIsWhite ? 1 : -1;
    var canSingle = currentBoard[row + direction][col] == ''
    var canDouble = ((pieceIsWhite && row == 1) || (!pieceIsWhite && row == 6)) &&
        canSingle && currentBoard[row + 2 * direction][col] == '';
    var canLeftHit = isInBounds(row + direction, col - 1) && currentBoard[row + direction][col - 1] != '' && (isPieceWhite(currentBoard[row + direction][col - 1]) ^ pieceIsWhite);
    var canRightHit = isInBounds(row + direction, col + 1) && currentBoard[row + direction][col + 1] != '' && (isPieceWhite(currentBoard[row + direction][col + 1]) ^ pieceIsWhite);
    if (canLeftHit) {
        res.push(createNewBoard(currentBoard, row, col, row + direction, col - 1));
    }
    if (canRightHit) {
        res.push(createNewBoard(currentBoard, row, col, row + direction, col + 1));
    }
    if (canSingle) {
        res.push(createNewBoard(currentBoard, row, col, row + direction, col));
    }
    if (canDouble) {
        res.push(createNewBoard(currentBoard, row, col, row + 2 * direction, col));
    }
    return res;
}

function getAvailableMovesBishop(currentBoard, row, col, pieceIsWhite) {
    var currentPiece = currentBoard[row][col];
    var res = [];
    var directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (var i = 0; i < directions.length; i++) {
        var direction = directions[i];
        var newPosition = [row + direction[0], col + direction[1]];
        var unObstructed = true;
        while (unObstructed && isInBounds(newPosition[0], newPosition[1])) {
            if (currentBoard[newPosition[0]][newPosition[1]] == '') {
                res.push(createNewBoard(currentBoard, row, col, newPosition[0], newPosition[1]));
                newPosition = [newPosition[0] + direction[0], newPosition[1] + direction[1]];
            } else {
                unObstructed = false;
                if (isPieceWhite(currentBoard[newPosition[0]][newPosition[1]]) ^ pieceIsWhite) {
                    res.push(createNewBoard(currentBoard, row, col, newPosition[0], newPosition[1]));
                }
            }
        }
    }
    return res;
}

function getAvailableMovesRook(currentBoard, row, col, pieceIsWhite) {
    var currentPiece = currentBoard[row][col];
    var res = [];
    var directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (var i = 0; i < directions.length; i++) {
        var direction = directions[i];
        var newPosition = [row + direction[0], col + direction[1]];
        var unObstructed = true;
        while (unObstructed && isInBounds(newPosition[0], newPosition[1])) {
            if (currentBoard[newPosition[0]][newPosition[1]] == '') {
                res.push(createNewBoard(currentBoard, row, col, newPosition[0], newPosition[1]));
                newPosition = [newPosition[0] + direction[0], newPosition[1] + direction[1]];
            } else {
                unObstructed = false;
                if (isPieceWhite(currentBoard[newPosition[0]][newPosition[1]]) ^ pieceIsWhite) {
                    res.push(createNewBoard(currentBoard, row, col, newPosition[0], newPosition[1]));
                }
            }
        }
    }
    return res;
}

function getAvailableMovesKing(currentBoard, row, col, pieceIsWhite) {
    //TODO: CASTLING
    var res = [];
    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            if (i != 0 || j != 0) {
                if (isInBounds(row + i, col + j) && (currentBoard[row + i][col + j] == '' || (isPieceWhite(currentBoard[row + i][col + j]) ^ pieceIsWhite))) {
                    res.push(createNewBoard(currentBoard, row, col, row + i, col + j));
                }
            }
        }
    }
    return res;
}

function getAvailableMovesKnight(currentBoard, row, col, pieceIsWhite) {
    var res = [];
    var options = [[-2, 1], [-1, 2], [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1]];
    options.forEach(option => {
        if (isInBounds(row + option[0], col + option[1]) &&
            (currentBoard[row + option[0]][col + option[1]] == '' || (isPieceWhite(currentBoard[row + option[0]][col + option[1]]) ^ pieceIsWhite))) {
            res.push(createNewBoard(currentBoard, row, col, row + option[0], col + option[1]));
        }
    });
    return res;
}
//#endregion


function getAllMoves(currentBoard, player) {
    var res = [];
    for (var row = 0; row < currentBoard.length; row++) {
        for (var col = 0; col < currentBoard[row].length; col++) {
            if (currentBoard[row][col] != '' && (isPieceWhite(currentBoard[row][col]) != player)) {
                var movesForPiece = getAvailableMoves(currentBoard, row, col);
                res = res.concat(movesForPiece);
            }
        }
    }
    return res;
}

function evaluateTile(row, col) {
    return (2 - Math.sqrt((row - 3.5) ** 2 + (col - 3.5) ** 2) / 20);
}

function evaluateBoard(currentBoard) {
    var res = 0;
    var checkmate = checkForCheckmate(currentBoard);
    if (checkmate != 0) {
        return checkmate < 0 ? -Infinity : Infinity;
    }
    for (var row = 0; row < currentBoard.length; row++) {
        for (var col = 0; col < currentBoard[row].length; col++) {
            var piece = currentBoard[row][col];
            res += pieceValues[piece];
            if (piece != '') {
                var constantThreats = pieceThreats[piece];
                var losThreats = pieceThreatsLos[piece];
                var threatValue = 0;
                constantThreats.forEach(threat => {
                    if (isInBounds(row + threat[0], col + threat[1])) {
                        threatValue += evaluateTile(row + threat[0], col + threat[1]);
                    }
                });
                losThreats.forEach(threat => {
                    var threatened = [row + threat[0], col + threat[1]];
                    var unObstructed = true;
                    while (isInBounds(threatened[0], threatened[1]) && unObstructed) {
                        if (currentBoard[threatened[0]][threatened[1]] != '') {
                            unObstructed = false;
                        }
                        threatValue += evaluateTile(row + threatened[0], col + threatened[1]);
                        threatened[0] += threat[0];
                        threatened[1] += threat[1];
                    }
                });
                res += isPieceWhite(piece) ? threatValue : -threatValue;
            }
        }
    }

    return res;
}

function checkForCheckmate(currentBoard) {
    var kingsSum = 0;
    for (var row = 0; row < currentBoard.length; row++) {
        for (var col = 0; col < currentBoard[row].length; col++) {
            if (currentBoard[row][col] == 'K') {
                kingsSum++;
            } else if (currentBoard[row][col] == 'k') {
                kingsSum--;
            }
        }
    }
    return Math.sign(kingsSum);
}

function minimax(currentBoard, depth, alpha, beta, currentTurn) {
    if (depth == 0 || checkForCheckmate(currentBoard) != 0) {
        return { eval: evaluateBoard(currentBoard), board: currentBoard };
    }
    var allMoves = getAllMoves(currentBoard, currentTurn);
    if (currentTurn == 0) {
        var maxEval = -Infinity;
        var maxBoard = null;
        for (var i = 0; i < allMoves.length; i++) {
            var eval = minimax(allMoves[i], depth - 1, alpha, beta, 1 - currentTurn);
            if (eval.eval > maxEval) {
                maxEval = eval.eval;
                maxBoard = allMoves[i];
            }
            alpha = Math.max(alpha, eval.eval);
            if (beta <= alpha) {
                break;
            }
        }
        return { eval: maxEval, board: maxBoard };
    } else {
        var minEval = Infinity;
        var minBoard = null;
        for (var i = 0; i < allMoves.length; i++) {
            var eval = minimax(allMoves[i], depth - 1, alpha, beta, 1 - currentTurn);
            if (eval.eval < minEval) {
                minEval = eval.eval;
                minBoard = allMoves[i];
            }
            beta = Math.min(beta, eval.eval);
            if (beta <= alpha) {
                break;
            }
        }
        return { eval: minEval, board: minBoard };
    }
}

function playNextMove() {
    board = minimax(board, 4, -Infinity, Infinity, currentTurn).board;
    prettyPrintBoard(board)
    currentTurn = 1 - currentTurn;
    // var allMoves = getAllMoves(board, currentTurn);
    // var allMovesEvaluated = allMoves.map(move => evaluateBoard(move));
    // var bestMove;
    // if (currentTurn == 0) {
    //     bestMove = findMaxIndex(allMovesEvaluated);
    // } else {
    //     bestMove = findMinIndex(allMovesEvaluated);
    // }
    // board = allMoves[bestMove];
    // console.table(board);
    // currentTurn = 1 - currentTurn;
}

//#region AUX FUNCS
function isPieceWhite(piece) {
    return piece != '' && piece == piece.toUpperCase();
}

function isInBounds(row, col) {
    return (row >= 0) && (row < 8) && (col >= 0) && (col < 8);
}

function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function createNewBoard(currentBoard, startRow, startCol, endRow, endCol) {
    let newBoard = deepCopy(currentBoard);
    newBoard[endRow][endCol] = currentBoard[startRow][startCol];
    newBoard[startRow][startCol] = '';
    return newBoard;
}

function findMaxIndex(arr) {
    if (arr.length === 0) {
        return -1;
    }

    var max = arr[0];
    var maxIndex = 0;

    for (var i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            maxIndex = i;
            max = arr[i];
        }
    }

    return maxIndex;
}

function findMinIndex(arr) {
    if (arr.length === 0) {
        return -1;
    }

    var min = arr[0];
    var minIndex = 0;

    for (var i = 1; i < arr.length; i++) {
        if (arr[i] < min) {
            minIndex = i;
            min = arr[i];
        }
    }

    return minIndex;
}

function prettyPrintBoard(currentBoard) {
    var res = "";
    for (var row = 0; row < currentBoard.length; row++) {
        for (var col = 0; col < currentBoard[row].length; col++) {
            res += prettyPrintSymbols[currentBoard[row][col]];
        }
        res += "\n";
    }
    console.log(res);
}
//#endregion

//#region p5
var cnv;
var w, h;
var x0 = 10;
var y0 = 10;
var tileSize = 50;
var pieceImages = {};
function setup() {
    setupCoolors();
    w = window.innerWidth;
    h = window.innerHeight;
    cnv = createCanvas(w, h);
    background(coolors.ghostwhite);
    pieceImages['p'] = "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg";
    pieceImages['P'] = "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg";
    pieceImages['n'] = "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg";
    pieceImages['N'] = "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg";
    pieceImages['b'] = "https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg";
    pieceImages['B'] = "https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg";
    pieceImages['r'] = "https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg";
    pieceImages['R'] = "https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg";
    pieceImages['q'] = "https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg";
    pieceImages['Q'] = "https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg";
    pieceImages['k'] = "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg";
    pieceImages['K'] = "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg";
    for (var p in pieceImages) {
        pieceImages[p] = loadImage(pieceImages[p]);
    }
    coolors.richblack.setAlpha(125);
    noStroke();
    drawBoard();
}

function drawBoard() {
    background(coolors.ghostwhite);
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            if ((i + j) % 2 == 1) {
                fill(coolors.richblack);
            } else {
                fill(coolors.ghostwhite);
            }
            rect(x0 + i * tileSize, y0 + j * tileSize, tileSize, tileSize);
            if (board[j][i] != '') {
                image(pieceImages[board[j][i]], x0 + i * tileSize, y0 + j * tileSize, tileSize, tileSize);
            }
        }
    }

}

function mouseClicked() {
    playNextMove();
    drawBoard();
}
//#endregion