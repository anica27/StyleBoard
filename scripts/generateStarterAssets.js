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
    // Alpha blending with existing pixel
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
    // Scanline polygon fill
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

// 1. Trenchcoat (Tops / Outerwear) - Camel / Beige elegant trenchcoat
createPng(320, 420, (ctx) => {
  const camel = [210, 180, 140];
  const camelDark = [185, 155, 115];
  const button = [50, 40, 30];

  // Coat body
  ctx.fillPolygon([
    { x: 110, y: 50 }, { x: 210, y: 50 },
    { x: 280, y: 120 }, { x: 260, y: 150 },
    { x: 230, y: 130 }, { x: 245, y: 390 },
    { x: 75, y: 390 }, { x: 90, y: 130 },
    { x: 60, y: 150 }, { x: 40, y: 120 }
  ], camel[0], camel[1], camel[2]);

  // Lapel collar left
  ctx.fillPolygon([
    { x: 110, y: 50 }, { x: 160, y: 140 }, { x: 120, y: 150 }, { x: 90, y: 100 }
  ], camelDark[0], camelDark[1], camelDark[2]);

  // Lapel collar right
  ctx.fillPolygon([
    { x: 210, y: 50 }, { x: 160, y: 140 }, { x: 200, y: 150 }, { x: 230, y: 100 }
  ], camelDark[0], camelDark[1], camelDark[2]);

  // Belt
  ctx.fillRoundedRect(70, 210, 180, 24, 4, camelDark[0], camelDark[1], camelDark[2]);
  ctx.fillRoundedRect(145, 206, 30, 32, 4, button[0], button[1], button[2]);
  ctx.fillRect(151, 212, 18, 20, camel[0], camel[1], camel[2]);

  // Buttons
  ctx.fillCircle(140, 170, 5, button[0], button[1], button[2]);
  ctx.fillCircle(180, 170, 5, button[0], button[1], button[2]);
  ctx.fillCircle(140, 270, 5, button[0], button[1], button[2]);
  ctx.fillCircle(180, 270, 5, button[0], button[1], button[2]);
}, 'trenchcoat.png');

// 2. White Silk Blouse (Tops) - Minimalist off-white cream blouse
createPng(300, 360, (ctx) => {
  const white = [248, 246, 240];
  const shadow = [225, 222, 215];
  const charcoal = [60, 60, 65];

  // Body and sleeves
  ctx.fillPolygon([
    { x: 105, y: 40 }, { x: 195, y: 40 },
    { x: 275, y: 110 }, { x: 250, y: 140 },
    { x: 215, y: 120 }, { x: 220, y: 330 },
    { x: 80, y: 330 }, { x: 85, y: 120 },
    { x: 50, y: 140 }, { x: 25, y: 110 }
  ], white[0], white[1], white[2]);

  // Collar V-neck
  ctx.fillPolygon([
    { x: 105, y: 40 }, { x: 150, y: 115 }, { x: 195, y: 40 }
  ], shadow[0], shadow[1], shadow[2]);

  // Buttons
  ctx.fillCircle(150, 140, 3, charcoal[0], charcoal[1], charcoal[2]);
  ctx.fillCircle(150, 185, 3, charcoal[0], charcoal[1], charcoal[2]);
  ctx.fillCircle(150, 230, 3, charcoal[0], charcoal[1], charcoal[2]);
  ctx.fillCircle(150, 275, 3, charcoal[0], charcoal[1], charcoal[2]);
}, 'silk_blouse.png');

// 3. Wide-Leg Trousers (Bottoms) - Tailored Charcoal Trousers
createPng(260, 420, (ctx) => {
  const charcoal = [45, 48, 55];
  const charcoalDark = [35, 38, 45];

  // Waistband
  ctx.fillRoundedRect(55, 30, 150, 24, 4, charcoalDark[0], charcoalDark[1], charcoalDark[2]);

  // Left leg
  ctx.fillPolygon([
    { x: 55, y: 50 }, { x: 128, y: 50 },
    { x: 125, y: 140 }, { x: 120, y: 400 },
    { x: 45, y: 400 }, { x: 55, y: 140 }
  ], charcoal[0], charcoal[1], charcoal[2]);

  // Right leg
  ctx.fillPolygon([
    { x: 132, y: 50 }, { x: 205, y: 50 },
    { x: 205, y: 140 }, { x: 215, y: 400 },
    { x: 140, y: 400 }, { x: 135, y: 140 }
  ], charcoal[0], charcoal[1], charcoal[2]);

  // Crease lines
  ctx.fillRect(82, 70, 2, 320, 60, 64, 72);
  ctx.fillRect(177, 70, 2, 320, 60, 64, 72);
}, 'tailored_trousers.png');

// 4. Little Black Dress (Dresses) - Sleek 90s Slip Dress
createPng(260, 420, (ctx) => {
  const black = [28, 28, 30];
  const silkHighlight = [55, 55, 60];

  // Straps
  ctx.fillRect(85, 30, 4, 50, black[0], black[1], black[2]);
  ctx.fillRect(171, 30, 4, 50, black[0], black[1], black[2]);

  // Dress body
  ctx.fillPolygon([
    { x: 75, y: 75 }, { x: 185, y: 75 },
    { x: 175, y: 140 }, { x: 210, y: 395 },
    { x: 50, y: 395 }, { x: 85, y: 140 }
  ], black[0], black[1], black[2]);

  // Subtle sheen fold
  ctx.fillPolygon([
    { x: 120, y: 90 }, { x: 135, y: 90 }, { x: 155, y: 380 }, { x: 145, y: 380 }
  ], silkHighlight[0], silkHighlight[1], silkHighlight[2], 120);
}, 'slip_dress.png');

// 5. Chunky Leather Loafers (Shoes)
createPng(320, 220, (ctx) => {
  const leather = [30, 30, 34];
  const sole = [15, 15, 18];
  const gold = [218, 165, 32];

  // Sole
  ctx.fillRoundedRect(35, 140, 250, 36, 12, sole[0], sole[1], sole[2]);
  ctx.fillRoundedRect(40, 160, 80, 24, 6, sole[0], sole[1], sole[2]); // heel

  // Shoe upper
  ctx.fillPolygon([
    { x: 45, y: 145 }, { x: 85, y: 95 },
    { x: 150, y: 85 }, { x: 230, y: 110 },
    { x: 280, y: 145 }
  ], leather[0], leather[1], leather[2]);

  // Front tongue / vamp
  ctx.fillRoundedRect(110, 82, 100, 45, 10, 45, 45, 52);

  // Gold bit / buckle
  ctx.fillRoundedRect(135, 96, 50, 10, 4, gold[0], gold[1], gold[2]);
  ctx.fillCircle(142, 101, 3, 250, 220, 100);
  ctx.fillCircle(178, 101, 3, 250, 220, 100);
}, 'leather_loafers.png');

// 6. Leather Tote Bag (Bags) - Minimalist caramel tote
createPng(280, 340, (ctx) => {
  const leather = [180, 115, 65];
  const leatherDark = [150, 90, 45];
  const gold = [218, 165, 32];

  // Straps
  ctx.fillRoundedRect(95, 30, 12, 130, 6, leatherDark[0], leatherDark[1], leatherDark[2]);
  ctx.fillRoundedRect(173, 30, 12, 130, 6, leatherDark[0], leatherDark[1], leatherDark[2]);

  // Bag body (trapezoid)
  ctx.fillPolygon([
    { x: 40, y: 120 }, { x: 240, y: 120 },
    { x: 215, y: 310 }, { x: 65, y: 310 }
  ], leather[0], leather[1], leather[2]);

  // Top rim fold
  ctx.fillRoundedRect(36, 115, 208, 16, 6, leatherDark[0], leatherDark[1], leatherDark[2]);

  // Tiny gold brand stamp / stud
  ctx.fillCircle(140, 170, 4, gold[0], gold[1], gold[2]);
}, 'leather_tote.png');

// 7. Gold Hoop Earrings (Accessories)
createPng(240, 240, (ctx) => {
  const gold = [225, 180, 60];
  const goldLight = [255, 220, 110];
  const goldDark = [180, 135, 35];

  // Left Hoop
  ctx.fillCircle(75, 120, 50, goldDark[0], goldDark[1], goldDark[2]);
  ctx.fillCircle(75, 120, 48, gold[0], gold[1], gold[2]);
  ctx.fillCircle(75, 120, 34, 0, 0, 0, 0); // clear hole

  // Right Hoop
  ctx.fillCircle(165, 120, 50, goldDark[0], goldDark[1], goldDark[2]);
  ctx.fillCircle(165, 120, 48, gold[0], gold[1], gold[2]);
  ctx.fillCircle(165, 120, 34, 0, 0, 0, 0); // clear hole

  // Highlights
  ctx.fillCircle(60, 95, 6, goldLight[0], goldLight[1], goldLight[2]);
  ctx.fillCircle(150, 95, 6, goldLight[0], goldLight[1], goldLight[2]);
}, 'gold_hoops.png');

// 8. Retro Sunglasses (Accessories)
createPng(320, 180, (ctx) => {
  const frame = [25, 25, 28];
  const lens = [60, 75, 90, 220];
  const gold = [218, 165, 32];

  // Bridge
  ctx.fillRoundedRect(140, 80, 40, 12, 4, frame[0], frame[1], frame[2]);

  // Left Frame & Lens
  ctx.fillRoundedRect(40, 60, 95, 75, 26, frame[0], frame[1], frame[2]);
  ctx.fillRoundedRect(50, 68, 75, 59, 18, lens[0], lens[1], lens[2], lens[3]);

  // Right Frame & Lens
  ctx.fillRoundedRect(185, 60, 95, 75, 26, frame[0], frame[1], frame[2]);
  ctx.fillRoundedRect(195, 68, 75, 59, 18, lens[0], lens[1], lens[2], lens[3]);

  // Side pins
  ctx.fillCircle(45, 72, 3, gold[0], gold[1], gold[2]);
  ctx.fillCircle(275, 72, 3, gold[0], gold[1], gold[2]);
}, 'sunglasses.png');

console.log('All starter fashion assets created successfully.');
