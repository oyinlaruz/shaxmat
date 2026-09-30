/* =========================================
   OFFLINE CHESS - GAME ENGINE
========================================= */

const PIECES = {
    w: {
        k: "♔",
        q: "♕",
        r: "♖",
        b: "♗",
        n: "♘",
        p: "♙"
    },

    b: {
        k: "♚",
        q: "♛",
        r: "♜",
        b: "♝",
        n: "♞",
        p: "♟"
    }
};


/* =========================================
   INITIAL BOARD
========================================= */

const INITIAL_BOARD = [
    ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
    ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
    ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"]
];


/* =========================================
   CHESS GAME
========================================= */

class ChessGame {

    constructor() {
        this.reset();
    }


    /* =====================================
       RESET
    ===================================== */

    reset() {

        this.board =
            INITIAL_BOARD.map(row => [...row]);

        this.turn = "w";

        this.selected = null;

        this.lastMove = null;

        this.castling = {
            wK: true,
            wQ: true,
            bK: true,
            bQ: true
        };

        this.enPassant = null;

        this.history = [];

        this.gameOver = false;

        this.result = null;
    }


    /* =====================================
       BOARD CLONE
    ===================================== */

    cloneBoard(board) {
        return board.map(row => [...row]);
    }


    /* =====================================
       HELPERS
    ===================================== */

    inside(row, col) {

        return (
            row >= 0 &&
            row < 8 &&
            col >= 0 &&
            col < 8
        );
    }


    colorOf(piece) {
        return piece ? piece[0] : null;
    }


    typeOf(piece) {
        return piece ? piece[1] : null;
    }


    opposite(color) {
        return color === "w"
            ? "b"
            : "w";
    }


    getPiece(row, col) {

        if (!this.inside(row, col)) {
            return null;
        }

        return this.board[row][col];
    }


    isEmpty(row, col) {
        return this.getPiece(row, col) === null;
    }


    /* =====================================
       FIND KING
    ===================================== */

    findKing(
        color,
        board = this.board
    ) {

        for (
            let row = 0;
            row < 8;
            row++
        ) {

            for (
                let col = 0;
                col < 8;
                col++
            ) {

                if (
                    board[row][col] ===
                    color + "k"
                ) {

                    return {
                        row,
                        col
                    };
                }
            }
        }

        return null;
    }


    /* =====================================
       SQUARE ATTACKED
    ===================================== */

    isSquareAttacked(
        row,
        col,
        byColor,
        board = this.board
    ) {

        /* ---------------------------------
           PAWN
        --------------------------------- */

        const pawnRow =
            byColor === "w"
                ? row + 1
                : row - 1;


        for (
            const dc of [-1, 1]
        ) {

            const r = pawnRow;
            const c = col + dc;


            if (
                this.inside(r, c) &&
                board[r][c] ===
                    byColor + "p"
            ) {

                return true;
            }
        }


        /* ---------------------------------
           KNIGHT
        --------------------------------- */

        const knightMoves = [
            [-2, -1],
            [-2, 1],
            [-1, -2],
            [-1, 2],
            [1, -2],
            [1, 2],
            [2, -1],
            [2, 1]
        ];


        for (
            const [dr, dc]
            of knightMoves
        ) {

            const r = row + dr;
            const c = col + dc;


            if (
                this.inside(r, c) &&
                board[r][c] ===
                    byColor + "n"
            ) {

                return true;
            }
        }


        /* ---------------------------------
           BISHOP / QUEEN
        --------------------------------- */

        const diagonals = [
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1]
        ];


        for (
            const [dr, dc]
            of diagonals
        ) {

            let r = row + dr;
            let c = col + dc;


            while (
                this.inside(r, c)
            ) {

                const piece =
                    board[r][c];


                if (piece) {

                    if (
                        piece[0] === byColor &&
                        (
                            piece[1] === "b" ||
                            piece[1] === "q"
                        )
                    ) {

                        return true;
                    }

                    break;
                }


                r += dr;
                c += dc;
            }
        }


        /* ---------------------------------
           ROOK / QUEEN
        --------------------------------- */

        const straight = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1]
        ];


        for (
            const [dr, dc]
            of straight
        ) {

            let r = row + dr;
            let c = col + dc;


            while (
                this.inside(r, c)
            ) {

                const piece =
                    board[r][c];


                if (piece) {

                    if (
                        piece[0] === byColor &&
                        (
                            piece[1] === "r" ||
                            piece[1] === "q"
                        )
                    ) {

                        return true;
                    }

                    break;
                }


                r += dr;
                c += dc;
            }
        }


        /* ---------------------------------
           KING
        --------------------------------- */

        for (
            let dr = -1;
            dr <= 1;
            dr++
        ) {

            for (
                let dc = -1;
                dc <= 1;
                dc++
            ) {

                if (
                    dr === 0 &&
                    dc === 0
                ) {
                    continue;
                }


                const r = row + dr;
                const c = col + dc;


                if (
                    this.inside(r, c) &&
                    board[r][c] ===
                        byColor + "k"
                ) {

                    return true;
                }
            }
        }


        return false;
    }


    /* =====================================
       CHECK
    ===================================== */

    isInCheck(
        color,
        board = this.board
    ) {

        const king =
            this.findKing(
                color,
                board
            );


        /*
            Agar shoh topilmasa,
            holat xavfli deb olinadi.
        */

        if (!king) {
            return true;
        }


        return this.isSquareAttacked(
            king.row,
            king.col,
            this.opposite(color),
            board
        );
    }


    /* =====================================
       PSEUDO MOVES
    ===================================== */

    pseudoMoves(row, col) {

        const piece =
            this.board[row][col];


        if (!piece) {
            return [];
        }


        const color = piece[0];
        const type = piece[1];

        const moves = [];


        /* ---------------------------------
           ADD MOVE
        --------------------------------- */

        const add = (
            r,
            c,
            extra = {}
        ) => {

            if (
                !this.inside(r, c)
            ) {
                return;
            }


            const target =
                this.board[r][c];


            /*
                O'z donasini olish mumkin emas.
            */

            if (
                target &&
                target[0] === color
            ) {

                return;
            }


            /*
                Shohni oddiy yurishda
                "urish" mumkin emas.
            */

            if (
                target &&
                target[1] === "k"
            ) {

                return;
            }


            moves.push({

                from: {
                    row,
                    col
                },

                to: {
                    row: r,
                    col: c
                },

                ...extra
            });
        };


        /* =================================
           PAWN
        ================================= */

        if (type === "p") {

            const direction =
                color === "w"
                    ? -1
                    : 1;


            const startRow =
                color === "w"
                    ? 6
                    : 1;


            const promotionRow =
                color === "w"
                    ? 0
                    : 7;


            /* ONE STEP */

            const oneRow =
                row + direction;


            if (
                this.inside(
                    oneRow,
                    col
                ) &&
                !this.board[
                    oneRow
                ][col]
            ) {

                add(
                    oneRow,
                    col,
                    {
                        promotion:
                            oneRow ===
                            promotionRow
                    }
                );


                /* TWO STEPS */

                const twoRow =
                    row +
                    direction * 2;


                if (
                    row === startRow &&
                    this.inside(
                        twoRow,
                        col
                    ) &&
                    !this.board[
                        twoRow
                    ][col]
                ) {

                    add(
                        twoRow,
                        col,
                        {
                            doublePawn: true
                        }
                    );
                }
            }


            /* CAPTURE */

            for (
                const dc of [-1, 1]
            ) {

                const r =
                    row + direction;

                const c =
                    col + dc;


                if (
                    !this.inside(r, c)
                ) {
                    continue;
                }


                const target =
                    this.board[r][c];


                if (
                    target &&
                    target[0] !== color &&
                    target[1] !== "k"
                ) {

                    add(
                        r,
                        c,
                        {
                            promotion:
                                r ===
                                promotionRow
                        }
                    );
                }


                /* EN PASSANT */

                if (
                    this.enPassant &&
                    this.enPassant.row === r &&
                    this.enPassant.col === c
                ) {

                    /*
                        En-passant katagida
                        haqiqatan ham yonida
                        raqib piyodasi borligini
                        ham tekshiramiz.
                    */

                    const capturedRow =
                        color === "w"
                            ? r + 1
                            : r - 1;


                    const capturedPiece =
                        this.inside(
                            capturedRow,
                            c
                        )
                            ? this.board[
                                capturedRow
                            ][c]
                            : null;


                    if (
                        capturedPiece ===
                        this.opposite(color) + "p"
                    ) {

                        add(
                            r,
                            c,
                            {
                                enPassant: true
                            }
                        );
                    }
                }
            }
        }


        /* =================================
           KNIGHT
        ================================= */

        if (type === "n") {

            const jumps = [
                [-2, -1],
                [-2, 1],
                [-1, -2],
                [-1, 2],
                [1, -2],
                [1, 2],
                [2, -1],
                [2, 1]
            ];


            for (
                const [dr, dc]
                of jumps
            ) {

                add(
                    row + dr,
                    col + dc
                );
            }
        }


        /* =================================
           BISHOP / ROOK / QUEEN
        ================================= */

        if (
            type === "b" ||
            type === "r" ||
            type === "q"
        ) {

            const directions = [];


            if (
                type === "b" ||
                type === "q"
            ) {

                directions.push(
                    [-1, -1],
                    [-1, 1],
                    [1, -1],
                    [1, 1]
                );
            }


            if (
                type === "r" ||
                type === "q"
            ) {

                directions.push(
                    [-1, 0],
                    [1, 0],
                    [0, -1],
                    [0, 1]
                );
            }


            for (
                const [dr, dc]
                of directions
            ) {

                let r = row + dr;
                let c = col + dc;


                while (
                    this.inside(r, c)
                ) {

                    const target =
                        this.board[r][c];


                    if (!target) {

                        add(r, c);

                    } else {

                        if (
                            target[0] !== color &&
                            target[1] !== "k"
                        ) {

                            add(r, c);
                        }

                        break;
                    }


                    r += dr;
                    c += dc;
                }
            }
        }


        /* =================================
           KING
        ================================= */

        if (type === "k") {

            /* NORMAL KING MOVES */

            for (
                let dr = -1;
                dr <= 1;
                dr++
            ) {

                for (
                    let dc = -1;
                    dc <= 1;
                    dc++
                ) {

                    if (
                        dr === 0 &&
                        dc === 0
                    ) {
                        continue;
                    }


                    add(
                        row + dr,
                        col + dc
                    );
                }
            }


            /* CASTLING */

            const enemy =
                this.opposite(color);


            /*
                Qirol hozir shaxda bo'lmasligi kerak.
            */

            if (
                !this.isInCheck(color)
            ) {

                /* -------------------------
                   WHITE
                ------------------------- */

                if (
                    color === "w" &&
                    row === 7 &&
                    col === 4
                ) {

                    /* KING SIDE */

                    if (
                        this.castling.wK &&
                        this.board[7][5] === null &&
                        this.board[7][6] === null &&
                        this.board[7][7] === "wr" &&
                        !this.isSquareAttacked(
                            7,
                            5,
                            enemy
                        ) &&
                        !this.isSquareAttacked(
                            7,
                            6,
                            enemy
                        )
                    ) {

                        moves.push({

                            from: {
                                row: 7,
                                col: 4
                            },

                            to: {
                                row: 7,
                                col: 6
                            },

                            castle: "K"
                        });
                    }


                    /* QUEEN SIDE */

                    if (
                        this.castling.wQ &&
                        this.board[7][1] === null &&
                        this.board[7][2] === null &&
                        this.board[7][3] === null &&
                        this.board[7][0] === "wr" &&
                        !this.isSquareAttacked(
                            7,
                            3,
                            enemy
                        ) &&
                        !this.isSquareAttacked(
                            7,
                            2,
                            enemy
                        )
                    ) {

                        moves.push({

                            from: {
                                row: 7,
                                col: 4
                            },

                            to: {
                                row: 7,
                                col: 2
                            },

                            castle: "Q"
                        });
                    }
                }


                /* -------------------------
                   BLACK
                ------------------------- */

                if (
                    color === "b" &&
                    row === 0 &&
                    col === 4
                ) {

                    /* KING SIDE */

                    if (
                        this.castling.bK &&
                        this.board[0][5] === null &&
                        this.board[0][6] === null &&
                        this.board[0][7] === "br" &&
                        !this.isSquareAttacked(
                            0,
                            5,
                            enemy
                        ) &&
                        !this.isSquareAttacked(
                            0,
                            6,
                            enemy
                        )
                    ) {

                        moves.push({

                            from: {
                                row: 0,
                                col: 4
                            },

                            to: {
                                row: 0,
                                col: 6
                            },

                            castle: "K"
                        });
                    }


                    /* QUEEN SIDE */

                    if (
                        this.castling.bQ &&
                        this.board[0][1] === null &&
                        this.board[0][2] === null &&
                        this.board[0][3] === null &&
                        this.board[0][0] === "br" &&
                        !this.isSquareAttacked(
                            0,
                            3,
                            enemy
                        ) &&
                        !this.isSquareAttacked(
                            0,
                            2,
                            enemy
                        )
                    ) {

                        moves.push({

                            from: {
                                row: 0,
                                col: 4
                            },

                            to: {
                                row: 0,
                                col: 2
                            },

                            castle: "Q"
                        });
                    }
                }
            }
        }


        return moves;
    }


    /* =====================================
       APPLY MOVE
    ===================================== */

    applyMove(
        move,
        record = true
    ) {

        const {
            from,
            to
        } = move;


        const piece =
            this.board[
                from.row
            ][
                from.col
            ];


        if (!piece) {
            return false;
        }


        const captured =
            this.board[
                to.row
            ][
                to.col
            ];


        /* ---------------------------------
           SAVE HISTORY
        --------------------------------- */

        if (record) {

            this.history.push({

                board:
                    this.cloneBoard(
                        this.board
                    ),

                turn:
                    this.turn,

                castling:
                    {
                        ...this.castling
                    },

                enPassant:
                    this.enPassant
                        ? {
                            ...this.enPassant
                        }
                        : null,

                lastMove:
                    this.lastMove
                        ? JSON.parse(
                            JSON.stringify(
                                this.lastMove
                            )
                        )
                        : null,

                gameOver:
                    this.gameOver,

                result:
                    this.result
            });
        }


        /* ---------------------------------
           REMOVE FROM SOURCE
        --------------------------------- */

        this.board[
            from.row
        ][from.col] = null;


        /* ---------------------------------
           EN PASSANT CAPTURE
        --------------------------------- */

        if (
            move.enPassant
        ) {

            const captureRow =
                piece[0] === "w"
                    ? to.row + 1
                    : to.row - 1;


            this.board[
                captureRow
            ][to.col] = null;
        }


        /* ---------------------------------
           MOVE PIECE
        --------------------------------- */

        this.board[
            to.row
        ][to.col] = piece;


        /* ---------------------------------
           CASTLING - KING SIDE
        --------------------------------- */

        if (
            move.castle === "K"
        ) {

            const row =
                from.row;


            this.board[row][5] =
                this.board[row][7];


            this.board[row][7] =
                null;
        }


        /* ---------------------------------
           CASTLING - QUEEN SIDE
        --------------------------------- */

        if (
            move.castle === "Q"
        ) {

            const row =
                from.row;


            this.board[row][3] =
                this.board[row][0];


            this.board[row][0] =
                null;
        }


        /* ---------------------------------
           PROMOTION
        --------------------------------- */

        if (
            piece[1] === "p" &&
            (
                to.row === 0 ||
                to.row === 7
            )
        ) {

            const allowed = [
                "q",
                "r",
                "b",
                "n"
            ];


            const requested =
                String(
                    move.promoteTo || "q"
                ).toLowerCase();


            const promotionPiece =
                allowed.includes(
                    requested
                )
                    ? requested
                    : "q";


            this.board[
                to.row
            ][to.col] =
                piece[0] +
                promotionPiece;
        }


        /* =================================
           CASTLING RIGHTS
        ================================= */

        /* WHITE KING */

        if (
            piece === "wk"
        ) {

            this.castling.wK = false;
            this.castling.wQ = false;
        }


        /* BLACK KING */

        if (
            piece === "bk"
        ) {

            this.castling.bK = false;
            this.castling.bQ = false;
        }


        /* WHITE ROOK */

        if (
            piece === "wr"
        ) {

            if (
                from.row === 7 &&
                from.col === 0
            ) {

                this.castling.wQ =
                    false;
            }


            if (
                from.row === 7 &&
                from.col === 7
            ) {

                this.castling.wK =
                    false;
            }
        }


        /* BLACK ROOK */

        if (
            piece === "br"
        ) {

            if (
                from.row === 0 &&
                from.col === 0
            ) {

                this.castling.bQ =
                    false;
            }


            if (
                from.row === 0 &&
                from.col === 7
            ) {

                this.castling.bK =
                    false;
            }
        }


        /* ---------------------------------
           ROOK CAPTURED
        --------------------------------- */

        if (
            captured === "wr"
        ) {

            if (
                to.row === 7 &&
                to.col === 0
            ) {

                this.castling.wQ =
                    false;
            }


            if (
                to.row === 7 &&
                to.col === 7
            ) {

                this.castling.wK =
                    false;
            }
        }


        if (
            captured === "br"
        ) {

            if (
                to.row === 0 &&
                to.col === 0
            ) {

                this.castling.bQ =
                    false;
            }


            if (
                to.row === 0 &&
                to.col === 7
            ) {

                this.castling.bK =
                    false;
            }
        }


        /* =================================
           EN PASSANT TARGET
        ================================= */

        this.enPassant = null;


        if (
            piece[1] === "p" &&
            Math.abs(
                to.row - from.row
            ) === 2
        ) {

            this.enPassant = {

                row:
                    (
                        from.row +
                        to.row
                    ) / 2,

                col:
                    from.col
            };
        }


        /* =================================
           LAST MOVE
        ================================= */

        this.lastMove = {

            from: {
                ...from
            },

            to: {
                ...to
            }
        };


        /* =================================
           CHANGE TURN
        ================================= */

        this.turn =
            this.opposite(
                this.turn
            );


        /* =================================
           UPDATE GAME STATE
        ================================= */

        if (record) {
            this.updateGameState();
        }


        return {
            piece,
            captured
        };
    }


    /* =====================================
       MAKE MOVE
    ===================================== */

    makeMove(move) {

        if (
            !move ||
            !move.from ||
            !move.to
        ) {

            return false;
        }


        const legalMoves =
            this.getLegalMoves(
                move.from.row,
                move.from.col,
                this.turn
            );


        const legal =
            legalMoves.find(
                candidate =>
                    candidate.to.row ===
                        move.to.row &&
                    candidate.to.col ===
                        move.to.col
            );


        if (!legal) {
            return false;
        }


        /*
            Promotion tanlovi.
        */

        if (
            move.promoteTo
        ) {

            legal.promoteTo =
                move.promoteTo;
        }


        /*
            Qo'shimcha flaglar.
        */

        if (
            move.castle
        ) {

            legal.castle =
                move.castle;
        }


        if (
            move.enPassant
        ) {

            legal.enPassant = true;
        }


        const result =
            this.applyMove(
                legal,
                true
            );


        return !!result;
    }


    /* =====================================
       GET LEGAL MOVES
    ===================================== */

    getLegalMoves(
        row,
        col,
        color = this.turn
    ) {

        const piece =
            this.board[row]?.[col];


        if (
            !piece ||
            piece[0] !== color
        ) {

            return [];
        }


        const pseudo =
            this.pseudoMoves(
                row,
                col
            );


        const legal = [];


        for (
            const move of pseudo
        ) {

            /*
                Butun holatni saqlaymiz.
            */

            const snapshot = {

                board:
                    this.cloneBoard(
                        this.board
                    ),

                turn:
                    this.turn,

                castling:
                    {
                        ...this.castling
                    },

                enPassant:
                    this.enPassant
                        ? {
                            ...this.enPassant
                        }
                        : null,

                lastMove:
                    this.lastMove
                        ? JSON.parse(
                            JSON.stringify(
                                this.lastMove
                            )
                        )
                        : null,

                gameOver:
                    this.gameOver,

                result:
                    this.result
            };


            /*
                Juda muhim:
                Simulyatsiyadan oldin
                haqiqiy yuruvchi rangni o'rnatamiz.
            */

            this.turn = piece[0];


            /*
                Yurishni faqat tekshirish uchun
                bajarish.
            */

            this.applyMove(
                move,
                false
            );


            /*
                O'z shohi shaxda qolmagan
                bo'lsa, yurish legal.
            */

            const stillInCheck =
                this.isInCheck(
                    piece[0]
                );


            /*
                Barcha holatni qaytaramiz.
            */

            this.board =
                snapshot.board;

            this.turn =
                snapshot.turn;

            this.castling =
                {
                    ...snapshot.castling
                };

            this.enPassant =
                snapshot.enPassant
                    ? {
                        ...snapshot.enPassant
                    }
                    : null;

            this.lastMove =
                snapshot.lastMove
                    ? JSON.parse(
                        JSON.stringify(
                            snapshot.lastMove
                        )
                    )
                    : null;

            this.gameOver =
                snapshot.gameOver;

            this.result =
                snapshot.result;


            if (
                !stillInCheck
            ) {

                legal.push(move);
            }
        }


        return legal;
    }


    /* =====================================
       ALL LEGAL MOVES
    ===================================== */

    allLegalMoves(
        color = this.turn
    ) {

        const moves = [];


        for (
            let row = 0;
            row < 8;
            row++
        ) {

            for (
                let col = 0;
                col < 8;
                col++
            ) {

                const piece =
                    this.board[row][col];


                if (
                    piece &&
                    piece[0] === color
                ) {

                    moves.push(
                        ...this.getLegalMoves(
                            row,
                            col,
                            color
                        )
                    );
                }
            }
        }


        return moves;
    }


    /* =====================================
       UPDATE GAME STATE
    ===================================== */

    updateGameState() {

        /*
            Har bir real yurishdan keyin
            gameOver/resultni avval tozalaymiz.
        */

        this.gameOver = false;
        this.result = null;


        const legalMoves =
            this.allLegalMoves(
                this.turn
            );


        /* ---------------------------------
           CHECKMATE / STALEMATE
        --------------------------------- */

        if (
            legalMoves.length === 0
        ) {

            this.gameOver = true;


            if (
                this.isInCheck(
                    this.turn
                )
            ) {

                /*
                    Navbatdagi tomon mat bo'ldi.
                    Qarama-qarshi tomon g'olib.
                */

                this.result =
                    this.turn === "w"
                        ? "black"
                        : "white";

            } else {

                /*
                    Pat.
                */

                this.result =
                    "draw";
            }


            return;
        }


        /* ---------------------------------
           INSUFFICIENT MATERIAL
        --------------------------------- */

        if (
            this.isInsufficientMaterial()
        ) {

            this.gameOver = true;

            this.result = "draw";
        }
    }


    /* =====================================
       INSUFFICIENT MATERIAL
    ===================================== */

    isInsufficientMaterial() {

        const pieces = [];


        for (
            const row of this.board
        ) {

            for (
                const piece of row
            ) {

                if (piece) {
                    pieces.push(piece);
                }
            }
        }


        /*
            Faqat ikki shoh.
        */

        const nonKings =
            pieces.filter(
                piece =>
                    piece[1] !== "k"
            );


        if (
            nonKings.length === 0
        ) {

            return true;
        }


        /*
            Shoh + bitta fil.
        */

        if (
            nonKings.length === 1 &&
            (
                nonKings[0][1] === "b" ||
                nonKings[0][1] === "n"
            )
        ) {

            return true;
        }


        return false;
    }


    /* =====================================
       UNDO
    ===================================== */

    undo() {

        if (
            !this.history.length
        ) {

            return false;
        }


        const previous =
            this.history.pop();


        this.board =
            previous.board;


        this.turn =
            previous.turn;


        this.castling =
            {
                ...previous.castling
            };


        this.enPassant =
            previous.enPassant
                ? {
                    ...previous.enPassant
                }
                : null;


        this.lastMove =
            previous.lastMove
                ? JSON.parse(
                    JSON.stringify(
                        previous.lastMove
                    )
                )
                : null;


        this.gameOver =
            previous.gameOver || false;


        this.result =
            previous.result || null;


        this.selected = null;


        return true;
    }
}