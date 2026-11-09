// Both eels use a single continuous silhouette. Reflecting it around the gap
// gives the ceiling and floor the same mouth, width and collision clearance.
export function drawEelGate(ctx, x, tip, width, length, upper, time) {
  ctx.save();
  ctx.translate(x + width / 2, tip);
  ctx.scale(width / 76, upper ? -1 : 1);

  const jaw = 5 + Math.sin(time / 180) * 3;
  const tail = Math.max(length + 18, 67);
  const skin = ctx.createLinearGradient(-32, 0, 32, 0);
  skin.addColorStop(0, "#163342");
  skin.addColorStop(0.35, "#356d66");
  skin.addColorStop(0.66, "#82a475");
  skin.addColorStop(1, "#1c524f");

  ctx.beginPath();
  ctx.moveTo(-29, tail);
  ctx.bezierCurveTo(-20, 78, -35, 49, -29, 31);
  ctx.bezierCurveTo(-32, 18, -22, 5, 2, 4);
  ctx.quadraticCurveTo(15, 2, 28, 3);
  ctx.quadraticCurveTo(36, 6, 30, 11);
  ctx.lineTo(3, 15);
  ctx.quadraticCurveTo(1, 22, 11, 21 + jaw);
  ctx.lineTo(28, 18 + jaw);
  ctx.quadraticCurveTo(34, 23 + jaw, 26, 27 + jaw);
  ctx.quadraticCurveTo(12, 40, 24, 57);
  ctx.bezierCurveTo(31, 76, 22, 98, 29, tail);
  ctx.closePath();
  ctx.fillStyle = skin;
  ctx.fill();
  ctx.strokeStyle = "#122f3e";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Paint the pattern inside the silhouette so no scales clip into the water.
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = "#cbe0a34f";
  ctx.lineWidth = 2;
  for (let y = 43; y < tail; y += 13) {
    ctx.beginPath();
    ctx.moveTo(-24, y);
    ctx.quadraticCurveTo(-8, y - 10, 2, y - 2);
    ctx.moveTo(3, y + 5);
    ctx.quadraticCurveTo(14, y - 4, 27, y + 1);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = "#f2c978";
  ctx.beginPath();
  ctx.ellipse(-13, 14, 6, 5, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#19303a";
  ctx.beginPath();
  ctx.ellipse(-12, 14, 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e7dfb8";
  for (const tooth of [13, 20, 27]) {
    ctx.beginPath();
    ctx.moveTo(tooth - 2, 13);
    ctx.lineTo(tooth, 18);
    ctx.lineTo(tooth + 2, 12);
    ctx.fill();
  }
  ctx.restore();
}
