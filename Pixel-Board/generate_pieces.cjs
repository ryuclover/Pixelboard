const fs = require('fs');
const path = require('path');

function createSVG(pixels, colorMap) {
  let rects = '';
  const lines = pixels.trim().split('\n');
  for (let y = 0; y < lines.length; y++) {
    for (let x = 0; x < lines[y].length; x++) {
      const char = lines[y][x];
      if (colorMap[char]) {
        rects += `  <rect x="${x}" y="${y}" width="1" height="1" fill="${colorMap[char]}" />\n`;
      }
    }
  }
  return `<svg width="100%" height="100%" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">\n${rects}</svg>`;
}

const manPattern = `
....BBBBBBBB....
..BBBBBBBBBBBB..
..BBLLLLLLLLDD..
.BBLLllllllLLDD.
.BBLLllllllLLDD.
.BBLLllllllLLDD.
BBLLllllllllLLDD
BBLLllllllllLLDD
BBLLllllllllLLDD
BBLLllllllllLLDD
.BBLLllllllLLDD.
.BBLLllllllLLDD.
.BBLLllllllLLDD.
..BBDDDDDDDDDD..
..BBBBBBBBBBBB..
....BBBBBBBB....
`;

const kingPattern = `
....BBBBBBBB....
..BBBBBBBBBBBB..
..BBLLLLLLLLDD..
.BBLLllKKllLLDD.
.BBLLlKllKlLLDD.
.BBLLlKllKlLLDD.
BBLLllKllKllLLDD
BBLLllKllKllLLDD
BBLLllKllKllLLDD
BBLLllKllKllLLDD
.BBLLllKKllLLDD.
.BBLLllllllLLDD.
.BBLLllllllLLDD.
..BBDDDDDDDDDD..
..BBBBBBBBBBBB..
....BBBBBBBB....
`;

// "White" player will use Red pieces to match the cover
const redColors = {
  'B': '#3E100C',
  'L': '#F1948A',
  'l': '#C0392B',
  'D': '#7B241C',
  'K': '#F1C40F'
};

const blackColors = {
  'B': '#000000',
  'L': '#808B96',
  'l': '#2C3E50',
  'D': '#1C2833',
  'K': '#F1C40F'
};

const outDir = path.join(__dirname, 'src', 'games', 'damas', 'assets');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'w_man.svg'), createSVG(manPattern, redColors));
fs.writeFileSync(path.join(outDir, 'w_king.svg'), createSVG(kingPattern, redColors));
fs.writeFileSync(path.join(outDir, 'b_man.svg'), createSVG(manPattern, blackColors));
fs.writeFileSync(path.join(outDir, 'b_king.svg'), createSVG(kingPattern, blackColors));

console.log('SVG pieces generated successfully!');
