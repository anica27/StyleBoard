const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const starterDir = path.join(__dirname, '..', 'assets', 'starter');
if (!fs.existsSync(starterDir)) {
  fs.mkdirSync(starterDir, { recursive: true });
}

function createPng(width, height, drawFn, filename) {
  const png = new PNG({ width, height, filterType: -1 });

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (width * y + x) << 2;
    const bgA = png.data[idx + 3] / 255;
    const fgA = a / 255;
    const outA = fgA + bgA * (1 - fgA);
    if (outA > 0) {
      png.data[idx] = Math.round((r * fgA + png.data[idx] * bgA * (1 - fgA)) / outA);
      png.data[idx + 1] = Math.round((g * fgA + png.data[idx + 1] * bgA * (1 - fgA)) / outA);
      png.data[idx + 2] = Math.round((b * fgA + png.data[idx + 2] * bgA * (1 - fgA)) / outA);
      png.data[idx + 3] = Math.round(outA * 255);
    }
  }

  function fillRect(x1, y1, w, h, r, g, b, a = 255) {
    for (let y = y1; y < y1 + h; y++) {
      for (let x = x1; x < x1 + w; x++) {
        setPixel(x, y, r, g, b, a);
      }
    }
  }

  function fillCircle(cx, cy, radius, r, g, b, a = 255) {
    const r2 = radius * radius;
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (d2 <= r2) {
          setPixel(x, y, r, g, b, a);
        }
      }
    }
  }

  function fillRoundedRect(x, y, w, h, radius, r, g, b, a = 255) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        let inside = true;
        if (px < x + radius && py < y + radius) {
          inside = (px - (x + radius)) ** 2 + (py - (y + radius)) ** 2 <= radius ** 2;
        } else if (px > x + w - radius && py < y + radius) {
          inside = (px - (x + w - radius)) ** 2 + (py - (y + radius)) ** 2 <= radius ** 2;
        } else if (px < x + radius && py > y + h - radius) {
          inside = (px - (x + radius)) ** 2 + (py - (y + h - radius)) ** 2 <= radius ** 2;
        } else if (px > x + w - radius && py > y + h - radius) {
          inside = (px - (x + w - radius)) ** 2 + (py - (y + h - radius)) ** 2 <= radius ** 2;
        }
        if (inside) setPixel(px, py, r, g, b, a);
      }
    }
  }

  function fillPolygon(points, r, g, b, a = 255) {
    let minY = height, maxY = 0;
    for (const p of points) {
      if (p.y < minY) minY = Math.floor(p.y);
      if (p.y > maxY) maxY = Math.ceil(p.y);
    }
    minY = Math.max(0, minY);
    maxY = Math.min(height - 1, maxY);

    for (let y = minY; y <= maxY; y++) {
      const nodeX = [];
      let j = points.length - 1;
      for (let i = 0; i < points.length; i++) {
        if ((points[i].y < y && points[j].y >= y) || (points[j].y < y && points[i].y >= y)) {
          const x = points[i].x + (y - points[i].y) / (points[j].y - points[i].y) * (points[j].x - points[i].x);
          nodeX.push(x);
        }
        j = i;
      }
      nodeX.sort((a, b) => a - b);
      for (let i = 0; i < nodeX.length; i += 2) {
        if (nodeX[i] >= width) break;
        if (nodeX[i + 1] > 0) {
          const startX = Math.max(0, Math.floor(nodeX[i]));
          const endX = Math.min(width - 1, Math.ceil(nodeX[i + 1]));
          for (let x = startX; x <= endX; x++) {
            setPixel(x, y, r, g, b, a);
          }
        }
      }
    }
  }

  drawFn({ width, height, setPixel, fillRect, fillCircle, fillRoundedRect, fillPolygon });

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(path.join(starterDir, filename), buffer);
  console.log(`Generated ${filename}`);
}

// 1. Classic Dressform / Tailor Dummy (Schneiderpuppe)
createPng(300, 520, (ctx) => {
  const beige = [232, 224, 212];
  const wood = [140, 95, 55];
  const woodDark = [110, 70, 35];
  const stitch = [205, 195, 180];

  // Neck cap
  ctx.fillCircle(150, 48, 12, wood[0], wood[1], wood[2]);
  ctx.fillRoundedRect(144, 30, 12, 24, 4, woodDark[0], woodDark[1], woodDark[2]);

  // Torso
  ctx.fillPolygon([
    { x: 130, y: 60 }, { x: 170, y: 60 },
    { x: 205, y: 95 }, { x: 195, y: 160 },
    { x: 168, y: 200 }, { x: 195, y: 270 },
    { x: 175, y: 310 }, { x: 125, y: 310 },
    { x: 105, y: 270 }, { x: 132, y: 200 },
    { x: 105, y: 160 }, { x: 95, y: 95 }
  ], beige[0], beige[1], beige[2]);

  // Center vertical seam
  ctx.fillRect(149, 62, 2, 246, stitch[0], stitch[1], stitch[2]);
  // Waist line
  ctx.fillRect(134, 200, 32, 2, stitch[0], stitch[1], stitch[2]);

  // Stand pole
  ctx.fillRect(147, 310, 6, 150, woodDark[0], woodDark[1], woodDark[2]);

  // Base tripod
  ctx.fillPolygon([
    { x: 150, y: 440 }, { x: 90, y: 505 },
    { x: 98, y: 510 }, { x: 150, y: 450 }
  ], wood[0], wood[1], wood[2]);
  ctx.fillPolygon([
    { x: 150, y: 440 }, { x: 210, y: 505 },
    { x: 202, y: 510 }, { x: 150, y: 450 }
  ], wood[0], wood[1], wood[2]);
  ctx.fillRoundedRect(138, 435, 24, 18, 5, woodDark[0], woodDark[1], woodDark[2]);
}, 'dressform.png');

// 2. Female Fashion Model Silhouette
createPng(300, 600, (ctx) => {
  const skin = [225, 218, 212];
  const dark = [190, 182, 175];

  // Head
  ctx.fillCircle(150, 45, 18, skin[0], skin[1], skin[2]);
  // Neck
  ctx.fillRoundedRect(145, 60, 10, 22, 3, dark[0], dark[1], dark[2]);

  // Shoulders & Chest
  ctx.fillPolygon([
    { x: 145, y: 78 }, { x: 155, y: 78 },
    { x: 195, y: 98 }, { x: 180, y: 175 },
    { x: 160, y: 215 }, { x: 185, y: 280 },
    { x: 115, y: 280 }, { x: 140, y: 215 },
    { x: 120, y: 175 }, { x: 105, y: 98 }
  ], skin[0], skin[1], skin[2]);

  // Left Leg
  ctx.fillPolygon([
    { x: 120, y: 280 }, { x: 148, y: 280 },
    { x: 145, y: 420 }, { x: 138, y: 560 },
    { x: 128, y: 560 }, { x: 126, y: 420 }
  ], skin[0], skin[1], skin[2]);

  // Right Leg
  ctx.fillPolygon([
    { x: 152, y: 280 }, { x: 180, y: 280 },
    { x: 174, y: 420 }, { x: 168, y: 560 },
    { x: 158, y: 560 }, { x: 155, y: 420 }
  ], skin[0], skin[1], skin[2]);

  // Feet
  ctx.fillRoundedRect(124, 558, 14, 18, 4, dark[0], dark[1], dark[2]);
  ctx.fillRoundedRect(158, 558, 14, 18, 4, dark[0], dark[1], dark[2]);

  // Arms subtle
  ctx.fillPolygon([
    { x: 105, y: 98 }, { x: 92, y: 200 },
    { x: 88, y: 290 }, { x: 96, y: 290 },
    { x: 102, y: 200 }, { x: 115, y: 110 }
  ], dark[0], dark[1], dark[2]);
  ctx.fillPolygon([
    { x: 195, y: 98 }, { x: 208, y: 200 },
    { x: 212, y: 290 }, { x: 204, y: 290 },
    { x: 198, y: 200 }, { x: 185, y: 110 }
  ], dark[0], dark[1], dark[2]);
}, 'female_mannequin.png');

// 3. Male Fashion Model Silhouette
createPng(320, 620, (ctx) => {
  const tone = [218, 212, 208];
  const dark = [185, 178, 172];

  // Head
  ctx.fillRoundedRect(145, 30, 30, 36, 12, tone[0], tone[1], tone[2]);
  // Neck
  ctx.fillRoundedRect(152, 64, 16, 22, 4, dark[0], dark[1], dark[2]);

  // Broad Shoulders & Torso
  ctx.fillPolygon([
    { x: 150, y: 82 }, { x: 170, y: 82 },
    { x: 225, y: 100 }, { x: 205, y: 210 },
    { x: 185, y: 245 }, { x: 198, y: 300 },
    { x: 122, y: 300 }, { x: 135, y: 245 },
    { x: 115, y: 210 }, { x: 95, y: 100 }
  ], tone[0], tone[1], tone[2]);

  // Left Leg
  ctx.fillPolygon([
    { x: 125, y: 300 }, { x: 156, y: 300 },
    { x: 152, y: 440 }, { x: 144, y: 580 },
    { x: 130, y: 580 }, { x: 128, y: 440 }
  ], tone[0], tone[1], tone[2]);

  // Right Leg
  ctx.fillPolygon([
    { x: 164, y: 300 }, { x: 195, y: 300 },
    { x: 192, y: 440 }, { x: 186, y: 580 },
    { x: 172, y: 580 }, { x: 168, y: 440 }
  ], tone[0], tone[1], tone[2]);

  // Feet
  ctx.fillRoundedRect(126, 578, 20, 20, 5, dark[0], dark[1], dark[2]);
  ctx.fillRoundedRect(170, 578, 20, 20, 5, dark[0], dark[1], dark[2]);

  // Arms
  ctx.fillPolygon([
    { x: 95, y: 100 }, { x: 80, y: 215 },
    { x: 74, y: 310 }, { x: 84, y: 310 },
    { x: 92, y: 215 }, { x: 106, y: 115 }
  ], dark[0], dark[1], dark[2]);
  ctx.fillPolygon([
    { x: 225, y: 100 }, { x: 240, y: 215 },
    { x: 246, y: 310 }, { x: 236, y: 310 },
    { x: 228, y: 215 }, { x: 214, y: 115 }
  ], dark[0], dark[1], dark[2]);
}, 'male_mannequin.png');

console.log('Mannequin silhouettes generated successfully.');
