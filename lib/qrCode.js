/**
 * Generator QR Code murni JavaScript (ISO/IEC 18004, Byte Mode, EC Level M, Versi 1–6).
 * Berjalan 100% lokal/offline di browser tanpa dependensi eksternal maupun panggilan API luar.
 */

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(ecCount) {
  let poly = [1];
  for (let i = 0; i < ecCount; i++) {
    const next = new Array(poly.length + 1).fill(0);
    const factor = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], factor);
    }
    poly = next;
  }
  return poly;
}

function rsComputeEc(data, ecCount) {
  const gen = rsGeneratorPoly(ecCount);
  const res = new Uint8Array(data.length + ecCount);
  res.set(data);
  for (let i = 0; i < data.length; i++) {
    const coef = res[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        res[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return Array.from(res.slice(data.length));
}

// Tabel kapasitas & blok EC Level M (Versi 1..6)
const VERSI_SPEC_M = [
  null,
  { ver: 1, size: 21, totalData: 16, blocks: 1, dataPerBlock: 16, ecPerBlock: 10, align: [], rem: 0 },
  { ver: 2, size: 25, totalData: 28, blocks: 1, dataPerBlock: 28, ecPerBlock: 16, align: [6, 18], rem: 7 },
  { ver: 3, size: 29, totalData: 44, blocks: 1, dataPerBlock: 44, ecPerBlock: 26, align: [6, 22], rem: 7 },
  { ver: 4, size: 33, totalData: 64, blocks: 2, dataPerBlock: 32, ecPerBlock: 18, align: [6, 26], rem: 7 },
  { ver: 5, size: 37, totalData: 86, blocks: 2, dataPerBlock: 43, ecPerBlock: 24, align: [6, 30], rem: 7 },
  { ver: 6, size: 41, totalData: 108, blocks: 4, dataPerBlock: 27, ecPerBlock: 16, align: [6, 34], rem: 7 },
];

function computeFormatBits(maskPattern) {
  // EC Level M = 00 (2 bit) + maskPattern (3 bit)
  const data = maskPattern & 0x7; // karena M = 00
  let d = data << 10;
  const gen = 0x537;
  for (let i = 14; i >= 10; i--) {
    if ((d >> i) & 1) {
      d ^= gen << (i - 10);
    }
  }
  return ((data << 10) | d) ^ 0x5412;
}

function encodeBytesToCodewords(bytes, spec) {
  const bits = [];
  const pushBits = (val, len) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  // Mode Byte = 0100, panjang karakter 8 bit (untuk versi 1-9)
  pushBits(0b0100, 4);
  pushBits(bytes.length, 8);
  for (const b of bytes) pushBits(b, 8);

  const maxBits = spec.totalData * 8;
  const terminator = Math.min(4, maxBits - bits.length);
  for (let i = 0; i < terminator; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const codewords = [];
  for (let i = 0; i < bits.length; i += 8) {
    let cw = 0;
    for (let j = 0; j < 8; j++) cw = (cw << 1) | bits[i + j];
    codewords.push(cw);
  }

  const pads = [0xec, 0x11];
  let padIdx = 0;
  while (codewords.length < spec.totalData) {
    codewords.push(pads[padIdx % 2]);
    padIdx += 1;
  }

  // Bagi blok & interleaving data + EC
  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;
  for (let b = 0; b < spec.blocks; b++) {
    const slice = codewords.slice(offset, offset + spec.dataPerBlock);
    offset += spec.dataPerBlock;
    dataBlocks.push(slice);
    ecBlocks.push(rsComputeEc(slice, spec.ecPerBlock));
  }

  const finalBytes = [];
  for (let i = 0; i < spec.dataPerBlock; i++) {
    for (let b = 0; b < spec.blocks; b++) finalBytes.push(dataBlocks[b][i]);
  }
  for (let i = 0; i < spec.ecPerBlock; i++) {
    for (let b = 0; b < spec.blocks; b++) finalBytes.push(ecBlocks[b][i]);
  }

  const outBits = [];
  for (const cw of finalBytes) {
    for (let i = 7; i >= 0; i--) outBits.push((cw >> i) & 1);
  }
  for (let i = 0; i < spec.rem; i++) outBits.push(0);
  return outBits;
}

function buildBaseMatrix(spec) {
  const n = spec.size;
  const modules = Array.from({ length: n }, () => new Int8Array(n).fill(-1));
  const isFunc = Array.from({ length: n }, () => new Uint8Array(n));

  const setFunc = (r, c, val) => {
    if (r >= 0 && r < n && c >= 0 && c < n) {
      modules[r][c] = val ? 1 : 0;
      isFunc[r][c] = 1;
    }
  };

  const drawFinder = (r0, c0) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = r0 + dr;
        const c = c0 + dc;
        if (r < 0 || r >= n || c < 0 || c >= n) continue;
        const inside = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const dark =
          inside &&
          (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
        setFunc(r, c, dark);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, n - 7);
  drawFinder(n - 7, 0);

  // Timing patterns
  for (let i = 8; i < n - 8; i++) {
    setFunc(6, i, i % 2 === 0);
    setFunc(i, 6, i % 2 === 0);
  }

  // Dark module
  setFunc(n - 8, 8, true);

  // Alignment patterns
  const pos = spec.align;
  for (const rCenter of pos) {
    for (const cCenter of pos) {
      if (
        (rCenter === 6 && cCenter === 6) ||
        (rCenter === 6 && cCenter === n - 7) ||
        (rCenter === n - 7 && cCenter === 6)
      ) {
        continue;
      }
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setFunc(rCenter + dr, cCenter + dc, dark);
        }
      }
    }
  }

  // Reserve format info cells
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      setFunc(8, i, false);
      setFunc(i, 8, false);
    }
  }
  for (let i = 0; i < 8; i++) {
    setFunc(8, n - 1 - i, false);
    if (i < 7) setFunc(n - 1 - i, 8, false);
  }

  return { modules, isFunc };
}

function applyMaskAndFormat(baseModules, isFunc, spec, maskIdx, dataBits) {
  const n = spec.size;
  const grid = baseModules.map((row) => Int8Array.from(row));

  const maskFn = [
    (r, c) => (r + c) % 2 === 0,
    (r) => r % 2 === 0,
    (_, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
  ][maskIdx];

  // Tempatkan data bits secara zig-zag kanan-ke-kiri
  let bitIdx = 0;
  let upward = true;
  for (let col = n - 1; col >= 1; col -= 2) {
    if (col === 6) col -= 1; // Lewati kolom timing pattern
    for (let step = 0; step < n; step++) {
      const r = upward ? n - 1 - step : step;
      for (const dc of [0, -1]) {
        const c = col + dc;
        if (!isFunc[r][c]) {
          const bit = bitIdx < dataBits.length ? dataBits[bitIdx++] : 0;
          grid[r][c] = bit ^ (maskFn(r, c) ? 1 : 0);
        }
      }
    }
    upward = !upward;
  }

  // Tulis 15-bit format information (MSB bit 14 -> LSB bit 0)
  const fmt = computeFormatBits(maskIdx);
  const getFmtBit = (i) => (fmt >> i) & 1;

  for (let i = 0; i <= 5; i++) grid[8][i] = getFmtBit(14 - i);
  grid[8][7] = getFmtBit(8);
  grid[8][8] = getFmtBit(7);
  grid[7][8] = getFmtBit(6);
  for (let i = 9; i <= 14; i++) grid[14 - i][8] = getFmtBit(14 - i);

  for (let i = 0; i < 8; i++) grid[8][n - 1 - i] = getFmtBit(i);
  for (let i = 0; i < 7; i++) grid[n - 1 - i][8] = getFmtBit(14 - i);

  return grid;
}

function penaltyScore(grid) {
  const n = grid.length;
  let score = 0;

  // Rule 1: 5+ modul warna sama berurutan per baris & kolom
  for (let r = 0; r < n; r++) {
    let runLen = 1;
    for (let c = 1; c < n; c++) {
      if (grid[r][c] === grid[r][c - 1]) runLen += 1;
      else {
        if (runLen >= 5) score += 3 + (runLen - 5);
        runLen = 1;
      }
    }
    if (runLen >= 5) score += 3 + (runLen - 5);
  }
  for (let c = 0; c < n; c++) {
    let runLen = 1;
    for (let r = 1; r < n; r++) {
      if (grid[r][c] === grid[r - 1][c]) runLen += 1;
      else {
        if (runLen >= 5) score += 3 + (runLen - 5);
        runLen = 1;
      }
    }
    if (runLen >= 5) score += 3 + (runLen - 5);
  }

  // Rule 2: blok 2x2 warna sama
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n - 1; c++) {
      const v = grid[r][c];
      if (v === grid[r][c + 1] && v === grid[r + 1][c] && v === grid[r + 1][c + 1]) {
        score += 3;
      }
    }
  }

  // Rule 4: keseimbangan modul gelap
  let dark = 0;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) if (grid[r][c] === 1) dark += 1;
  }
  const pct = (dark * 100) / (n * n);
  score += Math.floor(Math.abs(pct - 50) / 5) * 10;
  return score;
}

/**
 * Hasilkan matriks QR Code (2D array 0/1) untuk teks UTF-8 hingga 106 byte.
 */
export function buatMatriksQR(text) {
  const encoder = new TextEncoder();
  const bytes = Array.from(encoder.encode(String(text || '')));
  const spec = VERSI_SPEC_M.find((v) => v && bytes.length <= v.totalData - 2);
  if (!spec) {
    throw new Error('Teks terlalu panjang untuk QR Code lokal (maks 106 byte).');
  }

  const dataBits = encodeBytesToCodewords(bytes, spec);
  const { modules, isFunc } = buildBaseMatrix(spec);

  let bestGrid = null;
  let bestScore = Infinity;
  for (let m = 0; m < 8; m++) {
    const candidate = applyMaskAndFormat(modules, isFunc, spec, m, dataBits);
    const s = penaltyScore(candidate);
    if (s < bestScore) {
      bestScore = s;
      bestGrid = candidate;
    }
  }

  return bestGrid.map((row) => Array.from(row));
}

