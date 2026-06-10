/**
 * Ornate 1-bit panel chrome — the Glagstone-style rope border. Drawn into a
 * 2D canvas in pure white/black (palette arrives via the multiply overlay).
 */

/**
 * Snap a freshly drawn canvas to 1-bit. Canvas 2D antialiases shapes and
 * text; under the multiply palette overlay every AA gray becomes an off-tone
 * that breaks the 2-color histogram gate. Quantizing also gives text the
 * chunky bitmap look the aesthetic wants.
 *
 * mode "mask":  white-on-transparent (alpha threshold)
 * mode "panel": opaque white/black (luminance threshold)
 */
export function quantizeCanvas1Bit(
  ctx: CanvasRenderingContext2D,
  mode: "mask" | "panel",
): void {
  const { width, height } = ctx.canvas;
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (mode === "mask") {
      const on = (d[i + 3] ?? 0) >= 128;
      d[i] = d[i + 1] = d[i + 2] = 255;
      d[i + 3] = on ? 255 : 0;
    } else {
      const lum =
        0.2126 * (d[i] ?? 0) + 0.7152 * (d[i + 1] ?? 0) + 0.0722 * (d[i + 2] ?? 0);
      const a = d[i + 3] ?? 0;
      const white = a >= 128 ? lum >= 128 : true;
      d[i] = d[i + 1] = d[i + 2] = white ? 255 : 0;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** Fill + ornate border. Interior is WHITE (panel paper = ink color). */
export function drawOrnatePanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  // panel field
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, w, h);

  // braided edge: alternating diagonal ticks between two black rules
  ctx.strokeStyle = "#000000";
  ctx.fillStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 7.5, y + 7.5, w - 15, h - 15);

  const tick = 6;
  ctx.beginPath();
  for (let tx = x + 8; tx < x + w - 8; tx += tick) {
    ctx.moveTo(tx, y + 3);
    ctx.lineTo(tx + 4, y + 7);
    ctx.moveTo(tx + 4, y + h - 7);
    ctx.lineTo(tx, y + h - 3);
  }
  for (let ty = y + 8; ty < y + h - 8; ty += tick) {
    ctx.moveTo(x + 3, ty + 4);
    ctx.lineTo(x + 7, ty);
    ctx.moveTo(x + w - 7, ty);
    ctx.lineTo(x + w - 3, ty + 4);
  }
  ctx.stroke();

  // corner blocks
  for (const [cx, cy] of [
    [x + 2, y + 2],
    [x + w - 8, y + 2],
    [x + 2, y + h - 8],
    [x + w - 8, y + h - 8],
  ] as const) {
    ctx.fillRect(cx, cy, 6, 6);
  }
}
