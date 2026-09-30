/* =========================================
   OFFLINE CHESS - STRONG CHESS ENGINE BOT
   Iterative Deepening + Alpha Beta
   Transposition Table + Killer Moves
   History Heuristic + Quiescence
========================================= */

const BOT_LEVELS = {
    easy: {
        name: "Easy",
        depth: 3,
        think: 350,
        randomness: 0.18,
        qDepth: 1
    },

    medium: {
        name: "Medium",
        depth: 4,
        think: 700,
        randomness: 0.04,
        qDepth: 2
    },

    hard: {
        name: "Hard",
        depth: 5,
        think: 1300,
        randomness: 0.01,
        qDepth: 3
    },

    expert: {
        name: "Expert",
        depth: 6,
        think: 2200,
        randomness: 0,
        qDepth: 4
    },

    master: {
        name: "Master",
        depth: 7,
        think: 3500,
        randomness: 0,
        qDepth: 5
    },

    champion: {
        name: "Champion",
        depth: 8,
        think: 5000,
        randomness: 0,
        qDepth: 6
    }
};


/* =========================================
   PIECE VALUES
========================================= */

const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
};


/* =========================================
   PIECE SQUARE TABLES
========================================= */

const PST = {

    p: [
         0,  0,  0,  0,  0,  0,  0,  0,
        50, 50, 50, 50, 50, 50, 50, 50,
        10, 10, 20, 30, 30, 20, 10, 10,
         5,  5, 10, 25, 25, 10,  5,  5,
         0,  0,  0, 20, 20,  0,  0,  0,
         5, -5,-10,  0,  0,-10, -5,  5,
         5, 10, 10,-20,-20, 10, 10,  5,
         0,  0,  0,  0,  0,  0,  0,  0
    ],

    n: [
        -50,-40,-30,-30,-30,-30,-40,-50,
        -40,-20,  0,  5,  5,  0,-20,-40,
        -30,  5, 10, 15, 15, 10,  5,-30,
        -30,  0, 15, 20, 20, 15,  0,-30,
        -30,  5, 15, 20, 20, 15,  5,-30,
        -30,  0, 10, 15, 15, 10,  0,-30,
        -40,-20,  0,  0,  0,  0,-20,-40,
        -50,-40,-30,-30,-30,-30,-40,-50
    ],

    b: [
        -20,-10,-10,-10,-10,-10,-10,-20,
        -10,  0,  0,  0,  0,  0,  0, -10,
        -10,  0,  5, 10, 10,  5,  0, -10,
        -10,  5,  5, 10, 10,  5,  5, -10,
        -10,  0, 10, 10, 10, 10,  0, -10,
        -10, 10, 10, 10, 10, 10, 10, -10,
        -10,  5,  0,  0,  0,  0,  5, -10,
        -20,-10,-10,-10,-10,-10,-10,-20
    ],

    r: [
         0,  0,  0,  5,  5,  0,  0,  0,
        -5,  0,  0,  0,  0,  0,  0, -5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        -5,  0,  0,  0,  0,  0,  0, -5,
        -5,  0,  0,  0,  0,  0,  0, -5,
         5, 10, 10, 10, 10, 10, 10,  5,
         0,  0,  0,  0,  0,  0,  0,  0
    ],

    q: [
        -20,-10,-10, -5, -5,-10,-10,-20,
        -10,  0,  0,  0,  0,  0,  0,-10,
        -10,  0,  5,  5,  5,  5,  0,-10,
         -5,  0,  5,  5,  5,  5,  0, -5,
          0,  0,  5,  5,  5,  5,  0, -5,
        -10,  5,  5,  5,  5,  5,  0,-10,
        -10,  0,  5,  0,  0,  0,  0,-10,
        -20,-10,-10, -5, -5,-10,-10,-20
    ],

    k: [
        -30,-40,-40,-50,-50,-40,-40,-30,
        -30,-40,-40,-50,-50,-40,-40,-30,
        -30,-40,-40,-50,-50,-40,-40,-30,
        -30,-40,-40,-50,-50,-40,-40,-30,
        -20,-30,-30,-40,-40,-30,-30,-20,
        -10,-20,-20,-20,-20,-20,-20,-10,
         20, 20,  0,  0,  0,  0, 20, 20,
         20, 30, 10,  0,  0, 10, 30, 20
    ]
};


/* =========================================
   ENDGAME KING TABLE
========================================= */

const KING_ENDGAME = [
    -50,-30,-30,-30,-30,-30,-30,-50,
    -30,-10,  0,  0,  0,  0,-10,-30,
    -30,  0, 20, 30, 30, 20,  0,-30,
    -30, 10, 30, 40, 40, 30, 10,-30,
    -30, 10, 30, 40, 40, 30, 10,-30,
    -30,  0, 20, 30, 30, 20,  0,-30,
    -30,-10,  0,  0,  0,  0,-10,-30,
    -50,-30,-30,-30,-30,-30,-30,-50
];


/* =========================================
   CHESS BOT
========================================= */

class ChessBot {

    constructor(game, level = "medium") {

        this.game = game;

        this.level = level;

        this.nodes = 0;

        this.table = new Map();

        this.deadline = 0;

        this.stopSearch = false;

        this.killers = [];

        this.historyMoves = new Map();

        this.rootBestMove = null;

        this.rootBestScore = -Infinity;
    }


    /* =========================================
       LEVEL
    ========================================= */

    setLevel(level) {

        this.level =
            BOT_LEVELS[level]
                ? level
                : "medium";
    }


    /* =========================================
       CHOOSE MOVE
    ========================================= */

    chooseMove() {

        const cfg =
            BOT_LEVELS[this.level] ||
            BOT_LEVELS.medium;

        const legal =
            this.game.allLegalMoves("b");

        if (!legal.length) {
            return null;
        }

        this.nodes = 0;

        this.table.clear();

        this.killers = [];

        this.historyMoves.clear();

        this.stopSearch = false;

        this.rootBestMove = legal[0];

        this.rootBestScore = -Infinity;

        this.deadline =
            performance.now() + cfg.think;


        /*
         * Easy bot occasionally makes
         * a weaker move.
         */
        if (
            cfg.randomness > 0 &&
            Math.random() < cfg.randomness
        ) {

            const ordered =
                this.orderMoves(legal);

            const count =
                Math.max(
                    1,
                    Math.ceil(
                        ordered.length *
                        (cfg.randomness * 3)
                    )
                );

            return ordered[
                Math.floor(
                    Math.random() * count
                )
            ];
        }


        /*
         * IMPORTANT:
         * Bot is BLACK.
         */
        this.game.turn = "b";


        /*
         * Iterative deepening.
         *
         * Instead of immediately searching
         * depth 8, we search:
         *
         * 1 -> 2 -> 3 -> 4 -> ...
         *
         * and always keep the best completed
         * result.
         */
        for (
            let depth = 1;
            depth <= cfg.depth;
            depth++
        ) {

            if (this.timeUp()) {
                break;
            }

            const result =
                this.searchRoot(
                    depth,
                    cfg.qDepth
                );

            if (this.stopSearch) {
                break;
            }

            if (result.move) {

                this.rootBestMove =
                    result.move;

                this.rootBestScore =
                    result.score;
            }
        }


        return this.rootBestMove;
    }


    /* =========================================
       ROOT SEARCH
    ========================================= */

    searchRoot(depth, qDepth) {

        const legal =
            this.game.allLegalMoves("b");

        if (!legal.length) {

            return {
                move: null,
                score: -Infinity
            };
        }


        const ordered =
            this.orderMoves(legal);


        let bestMove = ordered[0];

        let bestScore = -Infinity;

        let alpha = -Infinity;

        const beta = Infinity;


        for (const move of ordered) {

            if (this.timeUp()) {

                this.stopSearch = true;

                break;
            }


            const snapshot =
                this.saveState();


            /*
             * Make sure BLACK is moving.
             */
            this.game.turn = "b";

            this.game.applyMove(
                move,
                false
            );


            const nextColor = "w";


            const score =
                -this.search(
                    depth - 1,
                    -beta,
                    -alpha,
                    nextColor,
                    qDepth
                );


            this.restoreState(snapshot);


            if (this.stopSearch) {
                break;
            }


            if (score > bestScore) {

                bestScore = score;

                bestMove = move;
            }


            if (score > alpha) {

                alpha = score;
            }
        }


        if (this.stopSearch) {

            return {
                move: null,
                score: -Infinity
            };
        }


        return {
            move: bestMove,
            score: bestScore
        };
    }


    /* =========================================
       NEGAMAX ALPHA-BETA
    ========================================= */

    search(
        depth,
        alpha,
        beta,
        color,
        qDepth
    ) {

        if (this.timeUp()) {

            this.stopSearch = true;

            return 0;
        }


        this.nodes++;


        /*
         * Checkmate / draw.
         */
        const legal =
            this.game.allLegalMoves(color);


        if (!legal.length) {

            if (
                this.game.isInCheck(color)
            ) {

                /*
                 * Mate is much more valuable
                 * than material.
                 */
                return -1000000 - depth;
            }

            return 0;
        }


        /*
         * Transposition table.
         */
        const key =
            this.positionKey(
                color,
                depth
            );

        const cached =
            this.table.get(key);

        if (
            cached &&
            cached.depth >= depth
        ) {

            if (
                cached.flag === "EXACT"
            ) {
                return cached.score;
            }

            if (
                cached.flag === "LOWER" &&
                cached.score > alpha
            ) {
                alpha = cached.score;
            }

            if (
                cached.flag === "UPPER" &&
                cached.score < beta
            ) {
                beta = cached.score;
            }

            if (alpha >= beta) {
                return cached.score;
            }
        }


        /*
         * Quiescence at horizon.
         */
        if (depth <= 0) {

            return this.quiescence(
                alpha,
                beta,
                color,
                qDepth
            );
        }


        const originalAlpha = alpha;


        /*
         * Use the best known move first.
         */
        let moves =
            this.orderMoves(
                legal,
                cached?.bestMove
            );


        let best = -Infinity;

        let bestMove = null;


        for (const move of moves) {

            if (this.timeUp()) {

                this.stopSearch = true;

                break;
            }


            const snapshot =
                this.saveState();


            /*
             * VERY IMPORTANT:
             * explicitly set whose move
             * is being simulated.
             */
            this.game.turn = color;


            this.game.applyMove(
                move,
                false
            );


            const nextColor =
                color === "w"
                    ? "b"
                    : "w";


            const score =
                -this.search(
                    depth - 1,
                    -beta,
                    -alpha,
                    nextColor,
                    qDepth
                );


            this.restoreState(snapshot);


            if (this.stopSearch) {
                break;
            }


            if (score > best) {

                best = score;

                bestMove = move;
            }


            if (score > alpha) {

                alpha = score;
            }


            /*
             * Beta cutoff.
             */
            if (alpha >= beta) {

                this.storeKiller(
                    move,
                    depth
                );

                this.addHistory(
                    move,
                    color,
                    depth
                );

                break;
            }
        }


        if (this.stopSearch) {
            return 0;
        }


        if (best === -Infinity) {
            return 0;
        }


        let flag = "EXACT";


        if (best <= originalAlpha) {

            flag = "UPPER";

        } else if (best >= beta) {

            flag = "LOWER";
        }


        this.table.set(
            key,
            {
                depth,
                score: best,
                flag,
                bestMove
            }
        );


        return best;
    }


    /* =========================================
       QUIESCENCE SEARCH
    ========================================= */

    quiescence(
        alpha,
        beta,
        color,
        depth
    ) {

        if (this.timeUp()) {

            this.stopSearch = true;

            return 0;
        }


        this.nodes++;


        /*
         * If current side is in check,
         * we MUST examine all legal moves.
         */
        const inCheck =
            this.game.isInCheck(color);


        const stand =
            this.evaluateFor(color);


        if (!inCheck) {

            if (stand >= beta) {
                return stand;
            }

            if (stand > alpha) {
                alpha = stand;
            }

            if (depth <= 0) {
                return stand;
            }
        }


        let legal =
            this.game.allLegalMoves(color);


        /*
         * Only tactical moves when not
         * in check.
         */
        if (!inCheck) {

            legal =
                legal.filter(move => {

                    const target =
                        this.game.board[
                            move.to.row
                        ][
                            move.to.col
                        ];

                    return (
                        target ||
                        move.enPassant ||
                        move.promotion
                    );
                });
        }


        const ordered =
            this.orderMoves(legal);


        for (const move of ordered) {

            if (this.timeUp()) {

                this.stopSearch = true;

                break;
            }


            const snapshot =
                this.saveState();


            this.game.turn = color;

            this.game.applyMove(
                move,
                false
            );


            const nextColor =
                color === "w"
                    ? "b"
                    : "w";


            const score =
                -this.quiescence(
                    -beta,
                    -alpha,
                    nextColor,
                    depth - 1
                );


            this.restoreState(snapshot);


            if (this.stopSearch) {
                break;
            }


            if (score >= beta) {
                return beta;
            }


            if (score > alpha) {
                alpha = score;
            }
        }


        return alpha;
    }


    /* =========================================
       POSITION EVALUATION
    ========================================= */

    evaluateFor(color) {

        const whiteScore =
            this.evaluate();


        return color === "b"
            ? -whiteScore
            : whiteScore;
    }


    evaluate() {

        let score = 0;

        let whiteBishops = 0;

        let blackBishops = 0;

        let whiteRooks = 0;

        let blackRooks = 0;

        let whiteQueens = 0;

        let blackQueens = 0;

        let whitePawns = 0;

        let blackPawns = 0;


        /*
         * Material + positional score.
         */
        for (
            let r = 0;
            r < 8;
            r++
        ) {

            for (
                let c = 0;
                c < 8;
                c++
            ) {

                const piece =
                    this.game.board[r][c];


                if (!piece) {
                    continue;
                }


                const color =
                    piece[0];

                const type =
                    piece[1];


                let value =
                    PIECE_VALUES[type] || 0;


                /*
                 * Endgame king becomes active.
                 */
                let table =
                    PST[type];


                if (
                    type === "k" &&
                    this.isEndgame()
                ) {
                    table = KING_ENDGAME;
                }


                const tableRow =
                    color === "w"
                        ? r
                        : 7 - r;


                if (table) {

                    value +=
                        table[
                            tableRow * 8 + c
                        ] || 0;
                }


                /*
                 * Count pieces.
                 */
                if (type === "b") {

                    if (color === "w")
                        whiteBishops++;
                    else
                        blackBishops++;
                }


                if (type === "r") {

                    if (color === "w")
                        whiteRooks++;
                    else
                        blackRooks++;
                }


                if (type === "q") {

                    if (color === "w")
                        whiteQueens++;
                    else
                        blackQueens++;
                }


                if (type === "p") {

                    if (color === "w")
                        whitePawns++;
                    else
                        blackPawns++;
                }


                score +=
                    color === "w"
                        ? value
                        : -value;
            }
        }


        /*
         * Bishop pair.
         */
        if (whiteBishops >= 2)
            score += 30;

        if (blackBishops >= 2)
            score -= 30;


        /*
         * Rook pair.
         */
        if (whiteRooks >= 2)
            score += 15;

        if (blackRooks >= 2)
            score -= 15;


        /*
         * Pawn structure.
         */
        score +=
            this.pawnStructure(
                "w"
            );

        score -=
            this.pawnStructure(
                "b"
            );


        /*
         * Mobility.
         *
         * This is intentionally calculated
         * only in deeper positions because
         * move generation is expensive.
         */
        if (this.nodes % 8 === 0) {

            const oldTurn =
                this.game.turn;


            this.game.turn = "w";

            const whiteMobility =
                this.game
                    .allLegalMoves("w")
                    .length;


            this.game.turn = "b";

            const blackMobility =
                this.game
                    .allLegalMoves("b")
                    .length;


            this.game.turn = oldTurn;


            score +=
                (whiteMobility -
                 blackMobility) * 3;
        }


        /*
         * King safety.
         */
        if (this.game.isInCheck("w"))
            score -= 45;

        if (this.game.isInCheck("b"))
            score += 45;


        /*
         * Queen development penalty
         * in the opening.
         */
        if (this.game.history.length < 12) {

            score +=
                this.developmentScore(
                    "w"
                );

            score -=
                this.developmentScore(
                    "b"
                );
        }


        return score;
    }


    /* =========================================
       PAWN STRUCTURE
    ========================================= */

    pawnStructure(color) {

        let result = 0;

        const enemy =
            color === "w"
                ? "b"
                : "w";


        const files =
            Array(8).fill(0);


        const pawnSquares = [];


        for (let r = 0; r < 8; r++) {

            for (let c = 0; c < 8; c++) {

                const piece =
                    this.game.board[r][c];


                if (
                    piece ===
                    color + "p"
                ) {

                    files[c]++;

                    pawnSquares.push({
                        r,
                        c
                    });
                }
            }
        }


        /*
         * Doubled pawns.
         */
        for (let c = 0; c < 8; c++) {

            if (files[c] > 1) {

                result -=
                    (files[c] - 1) * 12;
            }
        }


        /*
         * Isolated pawns.
         */
        for (const p of pawnSquares) {

            const left =
                p.c > 0
                    ? files[p.c - 1]
                    : 0;

            const right =
                p.c < 7
                    ? files[p.c + 1]
                    : 0;


            if (
                left === 0 &&
                right === 0
            ) {
                result -= 10;
            }
        }


        /*
         * Passed pawn.
         */
        for (const p of pawnSquares) {

            let passed = true;


            for (
                let c =
                    Math.max(
                        0,
                        p.c - 1
                    );

                c <=
                    Math.min(
                        7,
                        p.c + 1
                    );

                c++
            ) {

                for (
                    let r = 0;
                    r < 8;
                    r++
                ) {

                    const piece =
                        this.game.board[
                            r
                        ][c];


                    if (
                        piece ===
                        enemy + "p"
                    ) {

                        if (
                            color === "w"
                        ) {

                            if (r < p.r) {
                                passed = false;
                            }

                        } else {

                            if (r > p.r) {
                                passed = false;
                            }
                        }
                    }
                }
            }


            if (passed) {

                const rank =
                    color === "w"
                        ? 7 - p.r
                        : p.r;


                result +=
                    10 + rank * 8;
            }
        }


        return result;
    }


    /* =========================================
       DEVELOPMENT
    ========================================= */

    developmentScore(color) {

        let score = 0;


        /*
         * Penalize queen moving early.
         */
        for (let r = 0; r < 8; r++) {

            for (let c = 0; c < 8; c++) {

                const piece =
                    this.game.board[r][c];


                if (
                    piece !== color + "q"
                ) {
                    continue;
                }


                const homeRow =
                    color === "w"
                        ? 7
                        : 0;


                if (r !== homeRow) {

                    score -= 8;
                }
            }
        }


        /*
         * Reward developed knights
         * and bishops.
         */
        const backRank =
            color === "w"
                ? 7
                : 0;


        for (let c = 0; c < 8; c++) {

            const piece =
                this.game.board[
                    backRank
                ][c];


            if (
                piece === color + "n" ||
                piece === color + "b"
            ) {

                score -= 3;
            }
        }


        return score;
    }


    /* =========================================
       ENDGAME DETECTION
    ========================================= */

    isEndgame() {

        let nonPawnMaterial = 0;

        let queens = 0;

        let rooks = 0;


        for (let r = 0; r < 8; r++) {

            for (let c = 0; c < 8; c++) {

                const piece =
                    this.game.board[r][c];


                if (!piece) continue;


                const type =
                    piece[1];


                if (type === "q")
                    queens++;

                if (type === "r")
                    rooks++;


                if (
                    type === "q" ||
                    type === "r" ||
                    type === "b" ||
                    type === "n"
                ) {

                    nonPawnMaterial +=
                        PIECE_VALUES[type];
                }
            }
        }


        return (
            queens === 0 &&
            (
                nonPawnMaterial <= 2600 ||
                rooks <= 2
            )
        );
    }


    /* =========================================
       MOVE ORDERING
    ========================================= */

    orderMoves(
        moves,
        ttMove = null
    ) {

        return [...moves].sort(
            (a, b) => {

                return (
                    this.moveScore(
                        b,
                        ttMove
                    ) -
                    this.moveScore(
                        a,
                        ttMove
                    )
                );
            }
        );
    }


    /* =========================================
       MOVE SCORE
    ========================================= */

    moveScore(
        move,
        ttMove = null
    ) {

        let score = 0;


        /*
         * Transposition-table move.
         */
        if (
            ttMove &&
            this.sameMove(
                move,
                ttMove
            )
        ) {

            score += 1000000;
        }


        const piece =
            this.game.board[
                move.from.row
            ][
                move.from.col
            ];


        const target =
            this.game.board[
                move.to.row
            ][
                move.to.col
            ];


        const movingValue =
            piece
                ? (
                    PIECE_VALUES[
                        piece[1]
                    ] || 0
                )
                : 0;


        const targetValue =
            target
                ? (
                    PIECE_VALUES[
                        target[1]
                    ] || 0
                )
                : 0;


        /*
         * Captures.
         *
         * MVV-LVA:
         * Most Valuable Victim /
         * Least Valuable Attacker.
         */
        if (target) {

            score +=
                500000 +
                targetValue * 10 -
                movingValue;
        }


        /*
         * En passant.
         */
        if (move.enPassant) {

            score += 500000;
        }


        /*
         * Promotion.
         */
        if (move.promotion) {

            score += 450000;

            if (
                move.promoteTo === "q"
            ) {
                score += 10000;
            }
        }


        /*
         * Castling.
         */
        if (move.castle) {

            score += 8000;
        }


        /*
         * Killer move.
         */
        const depth =
            this.currentDepth || 0;


        const killers =
            this.killers[depth];


        if (killers) {

            if (
                killers[0] &&
                this.sameMove(
                    move,
                    killers[0]
                )
            ) {

                score += 7000;
            }


            if (
                killers[1] &&
                this.sameMove(
                    move,
                    killers[1]
                )
            ) {

                score += 6000;
            }
        }


        /*
         * History heuristic.
         */
        const key =
            this.moveKey(move);


        score +=
            this.historyMoves.get(key) ||
            0;


        /*
         * Center control.
         */
        if (
            (move.to.row === 3 ||
             move.to.row === 4) &&
            (move.to.col === 3 ||
             move.to.col === 4)
        ) {

            score += 80;
        }


        return score;
    }


    /* =========================================
       KILLER MOVES
    ========================================= */

    storeKiller(move, depth) {

        if (!this.killers[depth]) {

            this.killers[depth] = [];
        }


        const list =
            this.killers[depth];


        if (
            list[0] &&
            this.sameMove(
                list[0],
                move
            )
        ) {
            return;
        }


        list.unshift({
            from: { ...move.from },
            to: { ...move.to },
            promotion: move.promotion,
            promoteTo: move.promoteTo,
            castle: move.castle,
            enPassant: move.enPassant
        });


        if (list.length > 2) {

            list.pop();
        }
    }


    /* =========================================
       HISTORY HEURISTIC
    ========================================= */

    addHistory(
        move,
        color,
        depth
    ) {

        const key =
            color +
            "|" +
            this.moveKey(move);


        const old =
            this.historyMoves.get(key) ||
            0;


        const value =
            Math.min(
                10000,
                old + depth * depth
            );


        this.historyMoves.set(
            key,
            value
        );
    }


    /* =========================================
       MOVE KEY
    ========================================= */

    moveKey(move) {

        return (
            move.from.row +
            "," +
            move.from.col +
            "-" +
            move.to.row +
            "," +
            move.to.col +
            "-" +
            (move.promoteTo || "")
        );
    }


    /* =========================================
       SAME MOVE
    ========================================= */

    sameMove(a, b) {

        if (!a || !b) {
            return false;
        }


        return (
            a.from.row === b.from.row &&
            a.from.col === b.from.col &&
            a.to.row === b.to.row &&
            a.to.col === b.to.col &&
            !!a.castle === !!b.castle &&
            !!a.enPassant === !!b.enPassant
        );
    }


    /* =========================================
       POSITION KEY
    ========================================= */

    positionKey(
        color,
        depth
    ) {

        const board =
            this.game.board
                .map(row =>
                    row
                        .map(
                            p => p || ".."
                        )
                        .join(",")
                )
                .join("/");


        return (
            color +
            "|" +
            depth +
            "|" +
            board +
            "|" +
            JSON.stringify(
                this.game.castling
            ) +
            "|" +
            JSON.stringify(
                this.game.enPassant
            )
        );
    }


    /* =========================================
       TIME
    ========================================= */

    timeUp() {

        return (
            performance.now() >=
            this.deadline
        );
    }


    /* =========================================
       SAVE SEARCH STATE
    ========================================= */

    saveState() {

        return {

            board:
                this.game.cloneBoard(
                    this.game.board
                ),

            turn:
                this.game.turn,

            castling:
                {
                    ...this.game.castling
                },

            enPassant:
                this.game.enPassant
                    ? {
                        ...this.game.enPassant
                    }
                    : null,

            lastMove:
                this.game.lastMove
                    ? JSON.parse(
                        JSON.stringify(
                            this.game.lastMove
                        )
                    )
                    : null,

            gameOver:
                this.game.gameOver,

            result:
                this.game.result
        };
    }


    /* =========================================
       RESTORE SEARCH STATE
    ========================================= */

    restoreState(s) {

        this.game.board =
            s.board;

        this.game.turn =
            s.turn;

        this.game.castling =
            s.castling;

        this.game.enPassant =
            s.enPassant;

        this.game.lastMove =
            s.lastMove;

        this.game.gameOver =
            s.gameOver;

        this.game.result =
            s.result;
    }
}