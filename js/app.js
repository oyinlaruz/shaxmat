/* =========================================
   OFFLINE CHESS - APP
   BOT / LOCAL 2 PLAYER
   PLAYER COLOR + BOTH CLOCKS
========================================= */

const game = new ChessGame();
const bot = new ChessBot(game, "expert");

let gameMode = "bot";
let botLevel = "expert";

let playerColor = "w";
let boardFlipped = false;

let selectedTime = 10;
let increment = 0;

let whiteSeconds = 600;
let blackSeconds = 600;

let timer = null;
let botThinking = false;
let soundOn = true;


/* =========================================
   TIME SETTINGS
========================================= */

const timeSettings = {
    5: [300, 0],
    10: [600, 0],
    15: [900, 10]
};


/* =========================================
   RESET CLOCK
========================================= */

function resetClock() {

    const settings =
        timeSettings[selectedTime] ||
        [600, 0];

    whiteSeconds = settings[0];
    blackSeconds = settings[0];
    increment = settings[1];

    updateClocks();
}


/* =========================================
   FORMAT CLOCK
========================================= */

function formatTime(sec) {

    sec = Math.max(
        0,
        Math.floor(sec)
    );

    const minutes =
        Math.floor(sec / 60);

    const seconds =
        sec % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0")
    );
}


/* =========================================
   UPDATE CLOCKS
========================================= */

function updateClocks() {

    const whiteClock =
        document.getElementById(
            "whiteClock"
        );

    const blackClock =
        document.getElementById(
            "blackClock"
        );


    if (whiteClock) {

        whiteClock.textContent =
            formatTime(
                whiteSeconds
            );
    }


    if (blackClock) {

        blackClock.textContent =
            formatTime(
                blackSeconds
            );
    }


    if (whiteClock) {

        whiteClock.classList.toggle(
            "active-clock",
            game.turn === "w" &&
            !game.gameOver
        );
    }


    if (blackClock) {

        blackClock.classList.toggle(
            "active-clock",
            game.turn === "b" &&
            !game.gameOver
        );
    }
}


/* =========================================
   START TIMER
========================================= */

function startTimer() {

    stopTimer();


    timer = setInterval(() => {

        if (game.gameOver) {
            return;
        }


        /*
         * IMPORTANT:
         *
         * Old version:
         * if(botThinking) return;
         *
         * This made bot clock stop.
         *
         * Now the clock ALWAYS runs for
         * whoever's turn it is.
         */


        if (game.turn === "w") {

            whiteSeconds--;

        } else {

            blackSeconds--;
        }


        updateClocks();


        if (whiteSeconds <= 0) {

            whiteSeconds = 0;

            game.gameOver = true;

            game.result = "black";

            stopTimer();

            updateAll();

            showResult(game);

            return;
        }


        if (blackSeconds <= 0) {

            blackSeconds = 0;

            game.gameOver = true;

            game.result = "white";

            stopTimer();

            updateAll();

            showResult(game);

            return;
        }

    }, 1000);
}


/* =========================================
   STOP TIMER
========================================= */

function stopTimer() {

    if (timer) {

        clearInterval(timer);

        timer = null;
    }
}


/* =========================================
   ADD INCREMENT
========================================= */

function addIncrement(moverColor) {

    if (!increment) {
        return;
    }


    /*
     * Increment belongs to the player
     * who JUST moved.
     */

    if (moverColor === "w") {

        whiteSeconds += increment;

    } else {

        blackSeconds += increment;
    }


    updateClocks();
}


/* =========================================
   MOVE SOUND
========================================= */

function playMoveSound() {

    if (!soundOn) {
        return;
    }


    try {

        const AudioCtx =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioCtx) {
            return;
        }


        const ctx =
            new AudioCtx();

        const oscillator =
            ctx.createOscillator();

        const gain =
            ctx.createGain();


        oscillator.frequency.value =
            game.gameOver
                ? 220
                : 360;

        gain.gain.value =
            0.035;


        oscillator.connect(gain);

        gain.connect(
            ctx.destination
        );


        oscillator.start();

        oscillator.stop(
            ctx.currentTime + 0.055
        );

    } catch (e) {}
}


/* =========================================
   UPDATE EVERYTHING
========================================= */

function updateAll(botBusy = false) {

    renderBoard(
        game,
        boardFlipped
    );

    renderMoves(game);

    renderProfile();

    updateStatus(
        game,
        gameMode,
        botBusy
    );

    updateClocks();
}


/* =========================================
   PLAYER COLOR
========================================= */

function setPlayerColor(color) {

    playerColor =
        color === "b"
            ? "b"
            : "w";


    /*
     * If player chooses black,
     * board automatically flips.
     */

    boardFlipped =
        playerColor === "b";
}


/* =========================================
   NEW GAME
========================================= */

function newGame(
    mode = gameMode,
    color = playerColor
) {

    gameMode = mode;

    setPlayerColor(color);

    game.reset();

    bot.setLevel(
        botLevel
    );

    botThinking = false;

    resetClock();

    hideModal(
        "newGameModal"
    );


    const botSettings =
        document.getElementById(
            "botSettings"
        );


    if (botSettings) {

        botSettings.style.display =
            gameMode === "bot"
                ? "block"
                : "none";
    }


    updateAll();


    /*
     * BOT AS WHITE
     *
     * Player chose black.
     * Bot must start.
     */

    if (
        gameMode === "bot" &&
        playerColor === "b"
    ) {

        makeBotMove();
    }


    startTimer();
}


/* =========================================
   CLICK SQUARE
========================================= */

function clickSquare(row, col) {

    if (game.gameOver) {
        return;
    }


    if (botThinking) {
        return;
    }


    /*
     * In bot mode:
     * player can only move his own color.
     */

    if (
        gameMode === "bot" &&
        game.turn !== playerColor
    ) {

        return;
    }


    const piece =
        game.board[row][col];


    /*
     * Nothing selected yet.
     */

    if (!game.selected) {

        if (
            piece &&
            piece[0] === game.turn
        ) {

            game.selected = {
                row,
                col
            };

            updateAll();
        }

        return;
    }


    const from =
        game.selected;


    const legal =
        game.getLegalMoves(
            from.row,
            from.col
        ).find(
            move =>
                move.to.row === row &&
                move.to.col === col
        );


    /*
     * Illegal square.
     */

    if (!legal) {

        if (
            piece &&
            piece[0] === game.turn
        ) {

            game.selected = {
                row,
                col
            };

        } else {

            game.selected = null;
        }


        updateAll();

        return;
    }


    const moverColor =
        game.turn;


    const move = {
        ...legal
    };


    /*
     * Automatically promote to queen.
     */

    if (move.promotion) {

        move.promoteTo = "q";
    }


    const notation =
        algebraic(
            move,
            game
        );


    const success =
        game.makeMove(move);


    if (!success) {
        return;
    }


    game.selected = null;


    const historyItem =
        game.history[
            game.history.length - 1
        ];


    if (historyItem) {

        historyItem.move =
            notation;
    }


    /*
     * Add time to player who moved.
     */

    addIncrement(
        moverColor
    );


    playMoveSound();

    updateAll();


    /*
     * Game ended.
     */

    if (game.gameOver) {

        stopTimer();

        showResult(game);

        return;
    }


    /*
     * BOT TURN.
     */

    if (
        gameMode === "bot" &&
        game.turn !== playerColor
    ) {

        makeBotMove();
    }
}


/* =========================================
   BOT MOVE
========================================= */

function makeBotMove() {

    if (game.gameOver) {
        return;
    }


    /*
     * Prevent duplicate bot moves.
     */

    if (botThinking) {
        return;
    }


    /*
     * Bot must be opposite player.
     */

    const botColor =
        playerColor === "w"
            ? "b"
            : "w";


    if (game.turn !== botColor) {
        return;
    }


    botThinking = true;

    updateAll(true);


    const cfg =
        BOT_LEVELS[
            botLevel
        ] ||
        BOT_LEVELS.expert;


    /*
     * Small delay makes bot feel natural.
     *
     * IMPORTANT:
     * Timer DOES NOT stop.
     */

    setTimeout(() => {

        if (game.gameOver) {

            botThinking = false;

            return;
        }


        const move =
            bot.chooseMove();


        if (!move) {

            botThinking = false;

            updateAll();

            return;
        }


        const moverColor =
            game.turn;


        const notation =
            algebraic(
                move,
                game
            );


        const success =
            game.makeMove(move);


        if (success) {

            const historyItem =
                game.history[
                    game.history.length - 1
                ];


            if (historyItem) {

                historyItem.move =
                    notation;
            }


            /*
             * Bot receives increment
             * if it has one.
             */

            addIncrement(
                moverColor
            );


            playMoveSound();
        }


        botThinking = false;

        updateAll();


        if (game.gameOver) {

            stopTimer();

            showResult(game);

            return;
        }


    }, Math.max(
        150,
        cfg.think / 3
    ));
}


/* =========================================
   UNDO
========================================= */

function undoMove() {

    if (botThinking) {
        return;
    }


    stopTimer();


    if (gameMode === "bot") {

        /*
         * Undo both:
         * bot move + player's move.
         */

        if (
            game.history.length >= 2
        ) {

            game.undo();

            game.undo();

        } else if (
            game.history.length
        ) {

            game.undo();
        }

    } else {

        /*
         * Local 2 player:
         * undo one move.
         */

        if (
            game.history.length
        ) {

            game.undo();
        }
    }


    game.selected = null;

    /*
     * Resetting clocks on undo is safer
     * than keeping an invalid time state.
     */

    resetClock();

    startTimer();

    updateAll();


    /*
     * If player is black and game was
     * undone to initial position,
     * bot must start again.
     */

    if (
        gameMode === "bot" &&
        playerColor === "b" &&
        game.turn === "b" &&
        game.history.length === 0
    ) {

        makeBotMove();
    }
}


/* =========================================
   PROFILE
========================================= */

function saveProfile() {

    const input =
        document.getElementById(
            "profileName"
        );


    const name =
        (
            input?.value || ""
        )
            .trim()
            .slice(0, 24);


    if (!name) {
        return;
    }


    localStorage.setItem(
        "offlineChessName",
        name
    );


    renderProfile();


    const saved =
        document.getElementById(
            "profileSaved"
        );


    if (saved) {

        saved.textContent =
            "Saqlandi ✓";


        setTimeout(
            () => {
                saved.textContent = "";
            },
            1800
        );
    }
}


/* =========================================
   PAGE NAVIGATION
========================================= */

function setPage(id) {

    document
        .querySelectorAll(".page")
        .forEach(
            page =>
                page.classList.remove(
                    "active-page"
                )
        );


    document
        .getElementById(id)
        ?.classList.add(
            "active-page"
        );


    document
        .querySelectorAll(
            ".nav-btn[data-page]"
        )
        .forEach(
            button =>
                button.classList.toggle(
                    "active",
                    button.dataset.page === id
                )
        );
}


/* =========================================
   EVENTS
========================================= */

document.addEventListener(
    "click",
    event => {

        const square =
            event.target.closest(
                ".square"
            );


        if (square) {

            clickSquare(
                Number(
                    square.dataset.row
                ),
                Number(
                    square.dataset.col
                )
            );
        }


        const nav =
            event.target.closest(
                ".nav-btn[data-page]"
            );


        if (nav) {

            setPage(
                nav.dataset.page
            );
        }
    }
);


/* =========================================
   NEW GAME BUTTON
========================================= */

document
    .getElementById(
        "newGameBtn"
    )
    ?.addEventListener(
        "click",
        () =>
            showModal(
                "newGameModal"
            )
    );


document
    .getElementById(
        "newGameNav"
    )
    ?.addEventListener(
        "click",
        () =>
            showModal(
                "newGameModal"
            )
    );


/* =========================================
   BOT GAME
========================================= */

document
    .getElementById(
        "modalBot"
    )
    ?.addEventListener(
        "click",
        () => {

            /*
             * If color buttons exist,
             * use selected color.
             */

            const selected =
                document.querySelector(
                    ".color-option.active"
                );


            const color =
                selected?.dataset.color ||
                playerColor;


            newGame(
                "bot",
                color
            );
        }
    );


/* =========================================
   LOCAL 2 PLAYER
========================================= */

document
    .getElementById(
        "modalLocal"
    )
    ?.addEventListener(
        "click",
        () => {

            newGame(
                "local",
                "w"
            );
        }
    );


/* =========================================
   PLAY AGAIN
========================================= */

document
    .getElementById(
        "playAgainBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            hideModal(
                "resultModal"
            );


            newGame(
                gameMode,
                playerColor
            );
        }
    );


/* =========================================
   FLIP BOARD
========================================= */

document
    .getElementById(
        "flipBoard"
    )
    ?.addEventListener(
        "click",
        () => {

            boardFlipped =
                !boardFlipped;

            updateAll();
        }
    );


/* =========================================
   UNDO BUTTON
========================================= */

document
    .getElementById(
        "undoBtn"
    )
    ?.addEventListener(
        "click",
        undoMove
    );


/* =========================================
   SETTINGS
========================================= */

document
    .getElementById(
        "settingsNav"
    )
    ?.addEventListener(
        "click",
        () =>
            showModal(
                "settingsModal"
            )
    );


/* =========================================
   PROFILE
========================================= */

document
    .getElementById(
        "saveProfile"
    )
    ?.addEventListener(
        "click",
        saveProfile
    );


/* =========================================
   GAME MODE
========================================= */

document
    .getElementById(
        "gameMode"
    )
    ?.addEventListener(
        "change",
        event => {

            newGame(
                event.target.value,
                playerColor
            );
        }
    );


/* =========================================
   DRAW
========================================= */

document
    .getElementById(
        "drawBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            if (
                game.gameOver ||
                botThinking
            ) {
                return;
            }


            game.gameOver = true;

            game.result = "draw";

            stopTimer();

            updateAll();

            showResult(game);
        }
    );


/* =========================================
   RESIGN
========================================= */

document
    .getElementById(
        "resignBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            if (
                game.gameOver ||
                botThinking
            ) {
                return;
            }


            game.gameOver = true;


            game.result =
                game.turn === "w"
                    ? "black"
                    : "white";


            stopTimer();

            updateAll();

            showResult(game);
        }
    );


/* =========================================
   CLOSE MODALS
========================================= */

document
    .querySelectorAll(
        "[data-close]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () =>
                    hideModal(
                        button.dataset.close
                    )
            );
        }
    );


/* =========================================
   DIFFICULTY
========================================= */

document
    .querySelectorAll(
        ".difficulty"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".difficulty"
                        )
                        .forEach(
                            x =>
                                x.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    botLevel =
                        button.dataset.level;


                    bot.setLevel(
                        botLevel
                    );


                    const blackLevel =
                        document.getElementById(
                            "blackLevel"
                        );


                    if (blackLevel) {

                        blackLevel.textContent =
                            BOT_LEVELS[
                                botLevel
                            ].name;
                    }


                    newGame(
                        gameMode,
                        playerColor
                    );
                }
            );
        }
    );


/* =========================================
   TIME OPTIONS
========================================= */

document
    .querySelectorAll(
        ".time-option"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".time-option"
                        )
                        .forEach(
                            x =>
                                x.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    selectedTime =
                        Number(
                            button.dataset.time
                        );


                    const settings =
                        timeSettings[
                            selectedTime
                        ] ||
                        [600, 0];


                    whiteSeconds =
                        settings[0];

                    blackSeconds =
                        settings[0];

                    increment =
                        settings[1];


                    updateClocks();
                }
            );
        }
    );


/* =========================================
   COLOR OPTIONS
========================================= */

document
    .querySelectorAll(
        ".color-option"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".color-option"
                        )
                        .forEach(
                            x =>
                                x.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    playerColor =
                        button.dataset.color === "b"
                            ? "b"
                            : "w";


                    boardFlipped =
                        playerColor === "b";
                }
            );
        }
    );


/* =========================================
   SOUND
========================================= */

document
    .getElementById(
        "soundToggle"
    )
    ?.addEventListener(
        "change",
        event =>
            soundOn =
                event.target.checked
    );


/* =========================================
   ESCAPE
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            document
                .querySelectorAll(
                    ".modal"
                )
                .forEach(
                    modal =>
                        modal.classList.add(
                            "hidden"
                        )
                );
        }
    }
);


/* =========================================
   COLOR SELECTOR
   If HTML doesn't have color buttons,
   create them automatically.
========================================= */

function ensureColorSelector() {

    const modal =
        document.getElementById(
            "newGameModal"
        );


    if (!modal) {
        return;
    }


    if (
        modal.querySelector(
            ".color-selector"
        )
    ) {
        return;
    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "color-selector";


    wrapper.style.cssText = `
        display:flex;
        gap:10px;
        margin:12px 0;
        justify-content:center;
        flex-wrap:wrap;
    `;


    const title =
        document.createElement(
            "div"
        );


    title.textContent =
        "Botga qarshi qaysi rangda o‘ynaysiz?";


    title.style.cssText = `
        width:100%;
        text-align:center;
        font-weight:600;
        margin-bottom:4px;
    `;


    wrapper.appendChild(
        title
    );


    const colors = [
        ["w", "⚪ Men oq"],
        ["b", "⚫ Men qora"]
    ];


    colors.forEach(
        ([color, text]) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";

            button.className =
                "color-option";


            if (
                color === playerColor
            ) {

                button.classList.add(
                    "active"
                );
            }


            button.dataset.color =
                color;


            button.textContent =
                text;


            button.style.cssText = `
                padding:9px 16px;
                border-radius:8px;
                border:1px solid #999;
                cursor:pointer;
                font-size:14px;
            `;


            button.addEventListener(
                "click",
                () => {

                    wrapper
                        .querySelectorAll(
                            ".color-option"
                        )
                        .forEach(
                            x =>
                                x.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    playerColor =
                        color;

                    boardFlipped =
                        color === "b";
                }
            );


            wrapper.appendChild(
                button
            );
        }
    );


    const botButton =
        modal.querySelector(
            "#modalBot"
        );


    if (botButton) {

        botButton.parentNode.insertBefore(
            wrapper,
            botButton
        );
    } else {

        modal.appendChild(
            wrapper
        );
    }
}


/* =========================================
   INIT
========================================= */

renderProfile();

ensureColorSelector();

newGame(
    "bot",
    "w"
);