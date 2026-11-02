import { raceCourse, raceLanes } from "./AxolotlRace";

// Course decoration stays in world coordinates, just like the five swimmers.
// Ropes, buoys and full-width starting gates replace the old square foot pads.
export function drawRaceCourse(ctx, at, unit, time) {
  const left = raceCourse.startX - 1.1;
  const right = raceCourse.finishX + 1.1;
  const rope = (z) => {
    const a = at(left, z),
      b = at(right, z);
    ctx.strokeStyle = "#0f506a75";
    ctx.lineWidth = Math.max(3, unit * 0.09);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y + unit * 0.05);
    ctx.lineTo(b.x, b.y + unit * 0.05);
    ctx.stroke();
    ctx.strokeStyle = "#d6e3d4";
    ctx.lineWidth = Math.max(1, unit * 0.025);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    for (let x = left; x <= right; x += 0.85) {
      const p = at(x, z);
      const bob = Math.sin(time / 500 + x * 0.5 + z) * unit * 0.018;
      ctx.fillStyle = "#0b415d55";
      ctx.beginPath();
      ctx.ellipse(
        p.x,
        p.y + unit * 0.08,
        unit * 0.13,
        unit * 0.07,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.fillStyle = Math.round((x - left) / 0.85) % 2 ? "#edb39a" : "#f5ecce";
      ctx.strokeStyle = "#526e73";
      ctx.lineWidth = Math.max(1, unit * 0.025);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + bob, unit * 0.115, unit * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  };
  ctx.save();
  ctx.lineCap = "round";
  for (const z of [raceLanes[0].near, ...raceLanes.map((l) => l.far)]) rope(z);
  for (const lane of raceLanes) {
    const top = at(raceCourse.startX + 0.65, lane.near + 0.12);
    const bottom = at(raceCourse.startX + 0.65, lane.far - 0.12);
    // A floating, outlined checker boom spans the whole lane ahead of the
    // swimmer. It never sits underneath the mount as a mysterious white block.
    const gate = (x, finish = false) => {
      const p = at(x, lane.near + 0.12);
      const h = bottom.y - top.y;
      const w = Math.max(3, unit * 0.21);
      ctx.fillStyle = "#103d5970";
      ctx.fillRect(p.x - w / 2, p.y + 2, w + 2, h + 2);
      for (let r = 0; r < 10; r++) {
        ctx.fillStyle = r % 2 ? "#173e4a" : "#f7eed4";
        ctx.fillRect(p.x - w / 2, p.y + (r * h) / 10, w, h / 10 + 0.5);
      }
      ctx.strokeStyle = finish ? "#e1c67b" : lane.color;
      ctx.lineWidth = Math.max(1, unit * 0.035);
      ctx.strokeRect(p.x - w / 2, p.y, w, h);
    };
    gate(raceCourse.startX + 0.65);
    gate(raceCourse.finishX, true);
    const p = at(left - 0.35, lane.z - 0.1);
    ctx.fillStyle = lane.color;
    ctx.strokeStyle = "#294b56";
    ctx.lineWidth = Math.max(1, unit * 0.035);
    ctx.beginPath();
    ctx.roundRect(
      p.x - unit * 0.27,
      p.y - unit * 0.35,
      unit * 0.54,
      unit * 0.5,
      unit * 0.1,
    );
    ctx.fill();
    ctx.stroke();
    ctx.font = `700 ${Math.max(8, unit * 0.3)}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#163c48";
    ctx.fillText(lane.number, p.x, p.y + unit * 0.015);
  }
  ctx.restore();
}
