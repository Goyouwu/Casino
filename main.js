let balance = 10000;
let soundOn = true;

const balanceText = document.getElementById("balance");
const reelsContainer = document.getElementById("reels");
const resultText = document.getElementById("result");
const spinButton = document.getElementById("spinButton");

// Sonidos
const spinSound = document.getElementById("spinSound");
const winSound = document.getElementById("winSound");
const bonusSound = document.getElementById("bonusSound");
const jackpotSound = document.getElementById("jackpotSound");

document.getElementById("soundToggle").addEventListener("click", () => {
  soundOn = !soundOn;
  document.getElementById("soundToggle").textContent = soundOn ? "🔊" : "🔇";
});

const symbols = [
  { name: "hombre", img: "img/Hombre.png", weight: 25 },
  { name: "sofa", img: "img/sofa.png", weight: 20 },
  { name: "maletin", img: "img/maletin.png", weight: 15 },
  { name: "wild", img: "img/Wild.png", weight: 6 },
  { name: "corazon", img: "img/corazon.png", weight: 10 },
  { name: "mascota", img: "img/Mascota.png", weight: 8 },
  { name: "auto", img: "img/auto.png", weight: 6 },
  { name: "dinero", img: "img/dinero.png", weight: 6 },
  { name: "casa", img: "img/casa.png", weight: 4 },
  { name: "casa-bonus", img: "img/casa-bonus.png", weight: 3 }
];

const payouts = {
  hombre:     { 3: 1,   4: 3,   5: 6 },
  sofa:       { 3: 2,   4: 4,   5: 8 },
  maletin:    { 3: 3,   4: 6,   5: 12 },
  corazon:    { 3: 4,   4: 8,   5: 16 },
  mascota:    { 3: 6,   4: 12,  5: 24 },
  auto:       { 3: 8,   4: 16,  5: 32 },
  dinero:     { 3: 10,  4: 20,  5: 40 },
  casa:       { 3: 12,  4: 25,  5: 50 },
  wild:       {},
  "casa-bonus": { 3: 0 }
};

function getCurrentBet() {
  return parseInt(document.getElementById("betAmount").value);
}

function updateBalanceText() {
  balanceText.textContent = `Saldo: $${Math.floor(balance)} CLP`;
}

function weightedRandomSymbol() {
  const pool = symbols.flatMap(sym => Array(sym.weight).fill(sym));
  return pool[Math.floor(Math.random() * pool.length)];
}

function spin() {
  const currentBet = getCurrentBet();

  if (balance < currentBet) {
    alert("Saldo insuficiente");
    return;
  }

  spinButton.disabled = true;
  if (soundOn) spinSound.play();

  reelsContainer.innerHTML = "";
  resultText.textContent = "";
  balance -= currentBet;
  updateBalanceText();

  const grid = [];
  const elements = [];
  let bonusCount = 0;

  for (let row = 0; row < 3; row++) {
    const rowSymbols = [];
    const rowElements = [];
    for (let col = 0; col < 5; col++) {
      const symbol = weightedRandomSymbol();
      const div = document.createElement("div");
      div.className = "reel";
      const img = document.createElement("img");
      img.src = symbol.img;
      img.alt = symbol.name;
      div.appendChild(img);
      reelsContainer.appendChild(div);
      rowSymbols.push(symbol);
      rowElements.push(div);
      if (symbol.name === "casa-bonus") bonusCount++;
    }
    grid.push(rowSymbols);
    elements.push(rowElements);
  }

  setTimeout(() => {
    if (bonusCount >= 3) {
      if (soundOn) bonusSound.play();
      triggerBonus(currentBet);
    } else {
      const { win, winningCoords } = evaluateWin(grid, currentBet);
      if (win > 0 && soundOn) winSound.play();
      balance += win;
      winningCoords.forEach(([r, c]) => elements[r][c].classList.add("win-highlight"));
      updateBalanceText();
      resultText.textContent = win > 0 ? `¡Ganaste $${Math.floor(win)} CLP!` : "No ganaste, intenta otra vez.";
      spinButton.disabled = false;
    }
  }, 600);
}

function evaluateWin(grid, currentBet) {
  const lines = [
    [[0,0],[0,1],[0,2],[0,3],[0,4]],
    [[1,0],[1,1],[1,2],[1,3],[1,4]],
    [[2,0],[2,1],[2,2],[2,3],[2,4]],
    [[0,0],[1,1],[2,2],[1,3],[0,4]],
    [[2,0],[1,1],[0,2],[1,3],[2,4]],
    [[0,0],[1,1],[2,2],[2,3],[2,4]],
    [[2,0],[2,1],[2,2],[1,3],[0,4]],
    [[1,0],[1,1],[0,2],[1,3],[2,4]],
    [[0,0],[0,1],[1,2],[2,3],[2,4]],
    [[2,0],[1,1],[0,2],[0,3],[0,4]]
  ];

  let win = 0;
  let winningCoords = [];

  lines.forEach(line => {
    let match = [];
    let base = grid[line[0][0]][line[0][1]].name;

    for (let i = 0; i < line.length; i++) {
      const [r, c] = line[i];
      const sym = grid[r][c].name;
      if (sym === base || sym === "wild" || base === "wild") {
        match.push([r, c]);
      } else {
        break;
      }
    }

    if (match.length >= 3) {
      const symbolName = base === "wild" ? grid[line[match.length - 1][0]][line[match.length - 1][1]].name : base;
      const payout = payouts[symbolName]?.[match.length];
      if (payout) {
        win += payout * (currentBet / 25);
        winningCoords.push(...match);
      }
    }
  });

  return { win, winningCoords };
}

function triggerBonus(currentBet) {
  let totalWin = 0;
  let stickyWilds = [];
  let spinIndex = 0;

  function playBonusSpin() {
    if (spinIndex >= 10) {
      const isJackpot = Math.random() < 1 / 400;
      if (isJackpot && soundOn) jackpotSound.play();
      if (isJackpot) totalWin = 500 * currentBet;

      balance += totalWin;
      updateBalanceText();
      resultText.textContent += `\n🎊 Bono finalizado: ganaste un total de $${Math.floor(totalWin)} CLP`;
      spinButton.disabled = false;
      return;
    }

    reelsContainer.innerHTML = "";
    const grid = [];

    for (let row = 0; row < 3; row++) {
      const rowSymbols = [];
      for (let col = 0; col < 5; col++) {
        const sticky = stickyWilds.find(w => w[0] === row && w[1] === col);
        let symbol;

        if (sticky) {
          const multiplier = sticky[2];
          symbol = { name: "wild", img: `img/Wild_${multiplier}x.png`, multiplier };
        } else {
          symbol = weightedRandomSymbol();
          if (symbol.name === "wild") {
            const multiplier = Math.random() < 0.33 ? 3 : (Math.random() < 0.5 ? 2 : 1);
            stickyWilds.push([row, col, multiplier]);
            symbol = { name: "wild", img: `img/Wild_${multiplier}x.png`, multiplier };
          }
        }

        rowSymbols.push(symbol);
        const div = document.createElement("div");
        div.className = "reel";
        const img = document.createElement("img");
        img.src = symbol.img;
        img.alt = symbol.name;
        div.appendChild(img);
        reelsContainer.appendChild(div);
      }
      grid.push(rowSymbols);
    }

    let roundWin = 0;
    const lines = [
      [[0,0],[0,1],[0,2],[0,3],[0,4]],
      [[1,0],[1,1],[1,2],[1,3],[1,4]],
      [[2,0],[2,1],[2,2],[2,3],[2,4]],
      [[0,0],[1,1],[2,2],[1,3],[0,4]],
      [[2,0],[1,1],[0,2],[1,3],[2,4]],
      [[0,0],[1,1],[2,2],[2,3],[2,4]],
      [[2,0],[2,1],[2,2],[1,3],[0,4]],
      [[1,0],[1,1],[0,2],[1,3],[2,4]],
      [[0,0],[0,1],[1,2],[2,3],[2,4]],
      [[2,0],[1,1],[0,2],[0,3],[0,4]]
    ];

    lines.forEach(line => {
      let match = [];
      let base = grid[line[0][0]][line[0][1]].name;
      let wildMultipliers = [];

      for (let i = 0; i < line.length; i++) {
        const [r, c] = line[i];
        const sym = grid[r][c];
        if (sym.name === base || sym.name === "wild" || base === "wild") {
          match.push(sym);
          if (sym.name === "wild") wildMultipliers.push(sym.multiplier || 1);
        } else {
          break;
        }
      }

      if (match.length >= 3) {
        const symbolName = base === "wild" ? match[match.length - 1].name : base;
        const payoutMultiplier = payouts[symbolName]?.[match.length];
        if (payoutMultiplier) {
          const multiplier = wildMultipliers.reduce((a, b) => a * b, 1);
          roundWin += payoutMultiplier * multiplier * (currentBet / 25);
        }
      }
    });

    if (roundWin > 0 && soundOn) winSound.play();
    totalWin += roundWin;
    resultText.textContent = `🎰 Giro ${spinIndex + 1}/10: Ganaste $${Math.floor(roundWin)} CLP`;

    spinIndex++;
    setTimeout(playBonusSpin, 1200);
  }

  resultText.textContent = "🎉 ¡BONO ACTIVADO! 10 giros gratis 🎉";
  playBonusSpin();
}
