const samplers = [  // The various different algorithms use different ways of deciding which space to grow into
  (max) => max,
  (max) => randomInt(0, max),
  (max) => randomInt(Math.max(0, max - 30), max),
  (max) => Math.random() < 0.5 ? 0 : max,
  (max) => Math.random() < 0.5 ? 0 : max,
  (max) => max,
];

function mod (a, b) {
  let m = a  % b;
  return m < 0 ? m + b : m;
}

function pullRandom (array) {
  return array.splice(Math.floor(Math.random() * array.length), 1)[0];
}

function randomInt (min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}


class Maze {
  constructor (params, canvas) {
    this.params = params;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.deriveDimensions();
    
    this.data = [];
    for (let i = 0; i < params.width; i++) {
      this.data.push(new Array(params.height));
    }
    
    const initX = Math.floor(params.width/3);
    const initY = Math.floor(params.height/3);
    this.periphery = [initX, initY, initX, initY];
    
    this.frame = null;
    this.animate();
  }

  getExtensions (x, y) {
    let extensions = [
      [x + 1, y, x + 2, y],
      [x - 1, y, x - 2, y],
      [x, y + 1, x, y + 2],
      [x, y - 1, x, y - 2]
    ];
  
    let positions = [0, 1, 2, 3];
    return [
      extensions[pullRandom(positions)],
      extensions[pullRandom(positions)],
      extensions[pullRandom(positions)],
      extensions[positions[0]]
    ].filter(([ox, oy, x, y]) => !(this.data[mod(x, this.params.width)][mod(y, this.params.height)]));
  }

  fill (x, y) {
    let {width, height, scale} = this.params;
    x = mod(x, width);
    y = mod(y, height);
    this.data[x][y] = true;
    this.ctx.fillRect(x * scale, y * scale, scale, scale);
  }

  grow () {
    let periphery = this.periphery;
    let {algorithm, width, height} = this.params;
    let ox, oy, x, y;
    
    // Loop until we find an empty space or the maze is finished
    do {
      if (periphery.length == 0) {
        return false;
      }

      // Select a position from the spaces we can expand into and remove it from the list
      [[ox, oy, x, y]] = periphery.splice(samplers[algorithm](periphery.length - 1), 1);

    } while (this.data[mod(x, width)][mod(y, height)]);

    this.fill(ox, oy);	// Fill the space that bridges the selected space to the one it branched from
    this.fill(x, y);	// Fill in the selected space

    // Update the list of spaces that we can expand into
    if (algorithm > 3 && Math.random() < 0.5) {
      this.periphery = this.getExtensions(x, y).concat(periphery);
    } else {
      this.periphery = periphery.concat(this.getExtensions(x, y));
    }

    return true;
  }

  animate () {
    this.deriveDimensions();
    let {width, height, scale, bg, fg} = this.params;
    
    this.data = [];
    for (let i = 0; i < width; i++) {
      this.data.push(new Array(height));
    }
    
    const initX = Math.floor(width/3);
    const initY = Math.floor(height/3);
    this.periphery = [[initX, initY, initX, initY]];

    this.canvas.width  = width * scale;
    this.canvas.height = height * scale;

    this.ctx.fillStyle = bg;
    this.ctx.fillRect(0, 0, width * scale, height * scale);
    this.ctx.fillStyle = fg;

    if (this.frame !== null) {
      window.cancelAnimationFrame(this.frame);
    }

    const drawFrame = () => {
      for (let i = 0; i < this.params.speed; i++) {
        if (!this.grow()) {
          return;
        }
      }
      
      this.frame = window.requestAnimationFrame(drawFrame);
    };
    
    this.frame = window.requestAnimationFrame(drawFrame);
  }

  deriveDimensions () {
    let {boundingRect, scale} = this.params;
    this.params.width = Math.floor(boundingRect.width/(scale * 2)) * 2;
    this.params.height = Math.floor(boundingRect.height/(scale * 2)) * 2;
  }
}


const defaultParams = {
  algorithm: 0,
  boundingRect:  document.getElementById("canvas-container").getBoundingClientRect(),
  scale: 1,
  speed: 15,
  bg: "#151515",
  fg:"#708090"
};

const maze = new Maze(defaultParams, document.getElementById("maze-canvas"));

const algorithmDescriptions = [
  ["right end", "right end"],
  ["right end", "uniform random"],
  ["right end", "rightmost 30"],
  ["right end", "random end"],
  ["random end", "random end"],
  ["random end", "right end"]
];

const queueDesc = document.getElementById("algorithm-queue");
const sampleDesc = document.getElementById("algorithm-sample");

function setDescription (index) {
  let [queue, sample] = algorithmDescriptions[index];
  queueDesc.innerHTML = queue;
  sampleDesc.innerHTML = sample;
}

setDescription(defaultParams.algorithm);

function linkSlider (id, onChange, transform = (x) => x) {
  let slider = document.getElementById(id + "-control");
  let counter = document.getElementById(id + "-counter");
  let value = defaultParams[id];
  slider.value = value;
  counter.innerHTML = transform(value);

  slider.oninput = () => {
    let value = transform(parseInt(slider.value));
    counter.innerHTML = value;
    onChange(value);
  };
}

linkSlider("speed", (x) => {maze.params.speed = x});
linkSlider("scale", (x) => {
  maze.params.scale = x;
  maze.animate();
}, (x) => 2**(x-1));
linkSlider("algorithm",(x) => {
  maze.params.algorithm = x;
  setDescription(x);
});

document.getElementById("generate").onclick = () => maze.animate();