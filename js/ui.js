/* =========================================
   OFFLINE CHESS - UI
========================================= */

const PIECE_URLS = {
    wk:"https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/rhosgfx/wK.svg",
    wq:"https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/rhosgfx/wQ.svg",
    wr:"https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/rhosgfx/wR.svg",
    wb:"https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/rhosgfx/wB.svg",
    wn:"https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/rhosgfx/wN.svg",
    wp:"https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/rhosgfx/wP.svg",
    bk:"https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/rhosgfx/bK.svg",
    bq:"https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/rhosgfx/bQ.svg",
    br:"https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/rhosgfx/bR.svg",
    bb:"https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/rhosgfx/bB.svg",
    bn:"https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/rhosgfx/bN.svg",
    bp:"https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/rhosgfx/bP.svg"
};

const PIECE_FALLBACK = {
    wk:"♔",wq:"♕",wr:"♖",wb:"♗",wn:"♘",wp:"♙",
    bk:"♚",bq:"♛",br:"♜",bb:"♝",bn:"♞",bp:"♟"
};

const FILES = ["a","b","c","d","e","f","g","h"];

function squareName(row,col){ return `${FILES[col]}${8-row}`; }

function renderBoard(game, flipped=false){
    const board = document.getElementById("chessBoard");
    if(!board) return;
    board.innerHTML = "";

    for(let visualR=0;visualR<8;visualR++){
        for(let visualC=0;visualC<8;visualC++){
            const row = flipped ? 7-visualR : visualR;
            const col = flipped ? 7-visualC : visualC;
            const piece = game.board[row][col];
            const square = document.createElement("div");
            square.className = `square ${(row+col)%2===0?"light":"dark"}`;
            square.dataset.row = row;
            square.dataset.col = col;

            if(game.selected && game.selected.row===row && game.selected.col===col) square.classList.add("selected");
            if(game.lastMove && ((game.lastMove.from.row===row&&game.lastMove.from.col===col)||(game.lastMove.to.row===row&&game.lastMove.to.col===col))) square.classList.add("last-move");
            if(piece && piece[1]==="k" && game.isInCheck(piece[0])) square.classList.add("check");

            if(game.selected){
                const legal = game.getLegalMoves(game.selected.row,game.selected.col).find(m=>m.to.row===row&&m.to.col===col);
                if(legal){
                    if(piece && piece[0]!==game.turn) square.classList.add("capture-move");
                    else square.classList.add("valid-move");
                }
            }

            if(piece){
                const img = document.createElement("img");
                img.className = `piece ${piece[0]==="w"?"white-piece":"black-piece"}`;
                img.alt = piece;
                img.src = PIECE_URLS[piece];
                img.draggable = false;
                img.onerror = function(){
                    const span=document.createElement("span");
                    span.className="piece piece-fallback";
                    span.textContent=PIECE_FALLBACK[piece];
                    span.setAttribute("aria-label",piece);
                    this.replaceWith(span);
                };
                square.appendChild(img);
            }
            board.appendChild(square);
        }
    }
}

function renderMoves(game){
    const list=document.getElementById("moveList");
    if(!list) return;
    list.innerHTML="";
    const moves=game.history.map(h=>h.move).filter(Boolean);
    for(let i=0;i<moves.length;i+=2){
        const row=document.createElement("div");
        row.className="move-row";
        row.innerHTML=`<span class="move-number">${i/2+1}.</span><span class="move-white">${moves[i]||""}</span><span class="move-black">${moves[i+1]||""}</span>`;
        list.appendChild(row);
    }
    list.scrollTop=list.scrollHeight;
}

function renderProfile(){
    const name=localStorage.getItem("offlineChessName")||"Siz";
    const input=document.getElementById("profileName");
    const preview=document.getElementById("profileNamePreview");
    const white=document.getElementById("whiteName");
    if(input && !input.matches(":focus")) input.value=name;
    if(preview) preview.textContent=name;
    if(white) white.textContent=name;
}

function updateStatus(game,mode,botThinking=false){
    const el=document.getElementById("gameStatus");
    if(!el) return;
    if(game.gameOver){
        el.textContent=game.result==="draw"?"Durrang":`${game.result==="white"?"Oq":"Qora"} g‘alaba qozondi`;
        return;
    }
    if(mode==="bot") el.textContent=botThinking?"Bot o‘ylayapti...":(game.turn==="w"?"Oq donalar sizniki":"Bot navbati");
    else el.textContent=game.turn==="w"?"Oq donalar yuradi":"Qora donalar yuradi";
}

function showModal(id){document.getElementById(id)?.classList.remove("hidden")}
function hideModal(id){document.getElementById(id)?.classList.add("hidden")}

function showResult(game){
    const title=document.getElementById("resultTitle"), text=document.getElementById("resultText"), icon=document.getElementById("resultIcon");
    if(game.result==="draw"){icon.textContent="🤝";title.textContent="Durrang";text.textContent="O‘yin durang bilan yakunlandi."}
    else if(game.result==="white"){icon.textContent="🏆";title.textContent="Oq g‘alaba!";text.textContent="Oq tomon g‘alaba qozondi."}
    else {icon.textContent="🏆";title.textContent="Qora g‘alaba!";text.textContent="Qora tomon g‘alaba qozondi."}
    showModal("resultModal");
}

function algebraic(move,game){
    const piece=game.board[move.from.row][move.from.col]||"";
    const target=game.board[move.to.row][move.to.col];
    const type=piece[1];
    if(move.castle==="K") return "O-O";
    if(move.castle==="Q") return "O-O-O";
    const letters={n:"N",b:"B",r:"R",q:"Q",k:"K"};
    let s=type==="p"?"":letters[type];
    if(target||move.enPassant) s+=type==="p"?FILES[move.from.col]+"x":"x";
    s+=squareName(move.to.row,move.to.col);
    if(move.promotion) s+=`=${(move.promoteTo||"q").toUpperCase()}`;
    return s;
}
