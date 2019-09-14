let ctx;

let time = (new Date).getTime();
let diff = 0;

let interval = 300;

let rows = Math.round(window.innerHeight/window.innerWidth*40);
let cols = 40;
const ctxWidth = window.innerWidth;
const ctxHeight = window.innerHeight;
let blockWidth = ctxWidth/cols;
let blockHeight = ctxHeight/rows;
const paddingPercent = 10;
const paddingWidth = blockWidth/100*paddingPercent;
const paddingHeight = blockHeight/100*paddingPercent;

const DIRECTION_UP = 1;
const DIRECTION_DOWN = 2;
const DIRECTION_LEFT = 3;
const DIRECTION_RIGHT = 4;

const HEAD = 1;
const TAIL = 2;
const FOOD = 3;

let wannaChangeDirectionTo;

let theEnd = false;

let doExtraMoves = 0;

// initial state:
let initialHeadPosition = [Math.round(cols/2), Math.round(rows/2)];
let initialTail = [[Math.round(cols/2), Math.round(rows/2) + 1], [Math.round(cols/2), Math.round(rows/2) + 2]];
let foodPosition = [5,2];

let boardState = [];

function initBoard() {
  blockWidth = ctxWidth/cols;
  blockHeight = ctxHeight/rows;
  for (let col = 0; col < cols; col++) {
    boardState[col] = [];
    for (let row = 0; row < rows; row++) {
      boardState[col][row] = 0;
    }
  }
}

const direction = (function () {
  let currentDirection = DIRECTION_UP;
  return function(newDirection) {
    if (newDirection && [3, 7].indexOf(newDirection + currentDirection) === -1) {
      currentDirection = newDirection;
    }
    return currentDirection;
  };
})();

function setHeadToBoard(headPosition) {
  boardState[headPosition[0]][headPosition[1]] = HEAD;
}
function setFoodToBoard(foodPosition) {
  boardState[foodPosition[0]][foodPosition[1]] = FOOD;
}
function setClearToBoard([col, row]) {
  boardState[col][row] = 0;
}
function hitBoundaries([col, row]) {
  if (col < 0 || col >= cols || row < 0 || row >= rows) {
    theEnd = true;
  }
  return theEnd;
}
function hitTail(newHeadPosition, tail) {
  tail.map(([col, row]) => {
    if (col === newHeadPosition[0] && row === newHeadPosition[1]) {
      theEnd = true;
    }
  });
  return theEnd;
}
function createNewFood(newHeadPosition, tail) {
  const nonoCols = [newHeadPosition[0]].concat(tail.map(([col]) => col));
  const nonoRows = [newHeadPosition[1]].concat(tail.map(([col, row]) => row));
  let maybeFoodCols = [];
  let maybeFoodRows = [];
  for (let col = 0; col < cols; col++) {
    if (nonoCols.indexOf(col) === -1) {
      maybeFoodCols.push(col);
    }
  }
  for (let row = 0; row < rows; row++) {
    if (nonoRows.indexOf(row) === -1) {
      maybeFoodRows.push(row);
    }
  }
  foodPosition = [
    maybeFoodCols[Math.round(Math.random()*(maybeFoodCols.length -1))],
    maybeFoodRows[Math.round(Math.random()*(maybeFoodRows.length -1))],
  ];

  setFoodToBoard(foodPosition);
}

const move = function (headPosition, tail) {

  if (wannaChangeDirectionTo) {
    direction(wannaChangeDirectionTo);
    wannaChangeDirectionTo = null;
  }

  setClearToBoard(headPosition);

  let newHeadPosition;
  let [prevCol, prevRow] = headPosition;

  switch(direction()) {
  case DIRECTION_UP:
    newHeadPosition = [prevCol, prevRow - 1];
    break;
  case DIRECTION_DOWN:
    newHeadPosition = [prevCol, prevRow + 1];
    break;
  case DIRECTION_LEFT:
    newHeadPosition = [prevCol - 1, prevRow];
    break;
  case DIRECTION_RIGHT:
  default:
    newHeadPosition = [prevCol + 1, prevRow];
  }

  if (hitBoundaries(newHeadPosition)) {
    return [newHeadPosition, tail];
  }

  let [newCol, newRow] = newHeadPosition;
  let [foodCol, foodRow] = foodPosition;

  let eatFood = newCol === foodCol  && newRow === foodRow;

  if (tail.length) {
    boardState[tail[tail.length -1][0]][tail[tail.length -1][1]] = 0;
    tail = [headPosition, ...(eatFood ? tail : tail.slice(0, -1))];
  } else if (eatFood) {
    tail.push([prevCol, prevRow]);
  }

  if (hitTail(newHeadPosition, tail)) {
    return [newHeadPosition, tail];
  };

  if (eatFood) {
    createNewFood(newHeadPosition, tail);
  }

  setHeadToBoard(newHeadPosition);

  tail.map(([col, row]) => {
    boardState[col][row] = TAIL;
  });

  return [newHeadPosition, tail];
};

function drawTheEnd() {
  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, ctxWidth, ctxHeight);
  ctx.fillStyle = 'white';
  ctx.font = "50px Georgia";
  ctx.fillText("The end!", ctxWidth/2 - 100, ctxHeight/2 - 25);
}

function drawBoard() {
  if (!ctx) return;

  ctx.clearRect(0, 0, ctxWidth, ctxHeight);

  ctx.fillStyle = 'red';
  ctx.fillRect(0,0, ctxWidth, 3);
  ctx.fillRect(0,0, 3, ctxHeight);
  ctx.fillRect(0, ctxHeight -3, ctxWidth, 3);
  ctx.fillRect(ctxWidth-3, 0, 3, ctxHeight);

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      if (boardState[col][row] > 0) {
        switch(boardState[col][row]) {
        case HEAD:
          ctx.fillStyle = 'black';
          break;
        case TAIL:
          ctx.fillStyle = 'gray';
          break;
        case FOOD:
          ctx.fillStyle = 'green';
          break;
        }
        
        ctx.fillRect(
          col*blockWidth + paddingWidth,
          row*blockHeight + paddingHeight,
          blockWidth - paddingWidth*2,
          blockHeight - paddingHeight*2,
        );
      }
    }
  }
}

function tick(headPosition, tail) {
  let newHeadPosition = headPosition;
  let newTail = tail;
  let newTime = (new Date).getTime();
  diff = newTime - time;
  if (doExtraMoves) {
    for (let i = 0; i < doExtraMoves; i++) {
      [newHeadPosition, newTail] = move(headPosition, tail);

      if (theEnd) {
        drawTheEnd();
        return;
      }

      drawBoard();
    }
    doExtraMoves = 0;
  }
  if (diff >= interval) {
    time = newTime;

    [newHeadPosition, newTail] = move(headPosition, tail);

    if (theEnd) {
      drawTheEnd();
      return;
    }

    drawBoard();
  }
  window.requestAnimationFrame(() => tick(newHeadPosition, newTail));
}

document.addEventListener('DOMContentLoaded', function () {

  const canvas = document.getElementById('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx = canvas.getContext('2d');

  tick(initialHeadPosition, initialTail);

  document.addEventListener('keydown', function (e) {
    switch(e.key) {
    case '+':
      cols += 1;
      rows += 1;
      initBoard();
      setFoodToBoard(foodPosition);
      break;
    case '-':
      cols -= 1;
      rows -= 1;
      initBoard();
      setFoodToBoard(foodPosition);
      break;
    }
    switch(e.keyCode) {
    case 38:
      wannaChangeDirectionTo = DIRECTION_UP;
      break;
    case 40:
      wannaChangeDirectionTo = DIRECTION_DOWN;
      break;
    case 39:
      wannaChangeDirectionTo = DIRECTION_RIGHT;
      break;
    case 37:
      wannaChangeDirectionTo = DIRECTION_LEFT;
      break;
    }
    if ([37,38,39,40].indexOf(e.keyCode) !== -1) {
      doExtraMoves += 1;
    }
  });
});

initBoard();
setHeadToBoard(initialHeadPosition);
createNewFood(initialHeadPosition, initialTail);
