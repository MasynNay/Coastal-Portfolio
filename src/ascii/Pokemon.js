// Recognizable silhouettes are built specifically for each Pokémon. These
// shapes are still rendered as terminal characters by AquariumScene's grid;
// they do not reuse the ordinary fish or turtle models with different colors.
export function drawPokemon(art, kind) {
  const { body, stroke, at, polygon, beat } = art;
  const blue = [89, 186, 237],
    cream = [255, 230, 169];
  const white = [245, 250, 246],
    ink = [13, 27, 46];
  const gold = [255, 209, 81],
    orange = [248, 117, 62];
  const eye = (x, y, size = 0.9) => {
    body(x, y, size, size * 1.2, white);
    body(x + 0.3, y, size * 0.4, size * 0.7, ink);
  };
  if (kind === "pikachu") {
    const yellow = [248, 219, 105];
    polygon(
      [
        [-3, -4],
        [-5, -10],
        [-3, -11],
        [-1, -4],
      ],
      yellow,
    );
    polygon(
      [
        [1, -4],
        [3, -11],
        [5, -10],
        [3, -4],
      ],
      yellow,
    );
    polygon(
      [
        [-5, -10],
        [-3, -11],
        [-2.6, -8],
      ],
      ink,
    );
    polygon(
      [
        [3, -11],
        [5, -10],
        [4, -8],
      ],
      ink,
    );
    polygon(
      [
        [-3, 2],
        [-8, 1],
        [-6, -2],
        [-11, -3],
        [-9, -5],
        [-4, -3],
        [-6, 0],
        [-2, 0],
      ],
      yellow,
    );
    body(0, 2, 3.8, 4.3, yellow);
    body(0, -3, 4.2, 3.3, yellow);
    eye(-1.5, -3.5, 0.65);
    eye(1.5, -3.5, 0.65);
    body(-3, -2, 0.9, 0.8, orange);
    body(3, -2, 0.9, 0.8, orange);
    at(0, -2, "v", ink);
    stroke(-2, 6, -3, 7, yellow, "#");
    stroke(2, 6, 3, 7, yellow, "#");
    stroke(-3, 1, -4, 3 + beat * 0.4, yellow, "#");
    stroke(3, 1, 4, 3 - beat * 0.4, yellow, "#");
    return true;
  }
  if (kind === "eevee") {
    const brown = [187, 137, 92];
    polygon(
      [
        [-3, -3],
        [-5, -10],
        [-2, -9],
        [0, -3],
      ],
      brown,
    );
    polygon(
      [
        [1, -3],
        [3, -10],
        [5, -9],
        [3, -2],
      ],
      brown,
    );
    body(-1, 2, 4.8, 3.5, brown);
    body(-6, 0, 4, 2.7, brown);
    body(-8, -1, 1.8, 2, cream);
    body(2, -3, 3.8, 3.2, brown);
    eye(3, -3.5, 0.9);
    at(5, -2, "o", ink);
    polygon(
      [
        [-2, -1],
        [-3, 2],
        [-1, 1],
        [0, 4],
        [1, 2],
        [3, 3],
        [4, 0],
        [2, -1],
      ],
      cream,
    );
    stroke(-3, 4, -4, 7, brown, "#");
    stroke(2, 4, 3, 7, brown, "#");
    return true;
  }
  if (kind === "dragonite") {
    polygon(
      [
        [-3, -1],
        [-9, -7 - beat],
        [-8, 1],
        [-3, 2],
      ],
      orange,
    );
    polygon(
      [
        [3, -1],
        [9, -7 + beat],
        [8, 1],
        [3, 2],
      ],
      orange,
    );
    polygon(
      [
        [-4, -1],
        [-8, -5 - beat],
        [-7, 0],
      ],
      [118, 185, 151],
    );
    polygon(
      [
        [4, -1],
        [8, -5 + beat],
        [7, 0],
      ],
      [118, 185, 151],
    );
    body(0, 2, 4.8, 5, orange);
    body(0, 3, 3.2, 3.8, cream);
    body(0, -4, 3.5, 3, orange);
    stroke(-1, -6, -3, -9, cream, "~");
    stroke(1, -6, 3, -9, cream, "~");
    eye(-1.3, -4.4, 0.7);
    eye(1.3, -4.4, 0.7);
    stroke(-3, 6, -5, 7, orange, "#");
    stroke(3, 6, 5, 7, orange, "#");
    return true;
  }
  if (kind === "magikarp") {
    // Cream forked tail, golden crown, round eyes, open pink lips and long
    // barbels are the distinguishing features, not the orange body alone.
    polygon(
      [
        [-4, -1],
        [-11, -4],
        [-9, 0],
        [-11, 4],
        [-4, 1],
      ],
      cream,
    );
    polygon(
      [
        [-3, -3],
        [-4, -7],
        [-1, -5],
        [0, -8],
        [2, -5],
        [4, -6],
        [3, -2],
      ],
      gold,
    );
    polygon(
      [
        [-2, 2],
        [-1, 6],
        [3, 5],
        [2, 2],
      ],
      cream,
    );
    body(0, 0, 5.7, 4.1, orange);
    for (let i = -3; i <= 1; i += 2)
      stroke(i, -2.5, i - 1, 2.6, [217, 89, 55], ")");
    polygon(
      [
        [-1, 0],
        [2, 1 + beat * 0.4],
        [-2, 3],
      ],
      cream,
    );
    eye(3.1, -1.6, 1.6);
    body(5.6, 0.4, 1.5, 1.7, [255, 177, 185]);
    body(5.8, 0.4, 0.6, 1, ink);
    stroke(4.5, 2, 8, 3.5, gold, "~");
    stroke(8, 3.5, 9, 1.5, gold, "~");
    stroke(4.5, -0.5, 8, -2.5, gold, "~");
    return true;
  }
  if (kind === "horsea") {
    polygon(
      [
        [-3, -4],
        [-6, -5],
        [-4, -2],
        [-6, 0],
        [-3, 1],
      ],
      blue,
    );
    body(-0.5, 2, 3.1, 4.3, blue);
    body(0.6, 2.2, 1.6, 3.1, cream);
    for (let i = 0; i < 4; i++)
      stroke(-0.4, i * 1.3, 1.9, i * 1.3, [187, 165, 105], "-");
    // The large head and tubular snout differ from an ordinary seahorse.
    body(0, -4, 3.8, 3.2, blue);
    body(4, -3.5, 3.1, 1.2, blue);
    stroke(6.6, -4.6, 6.6, -2.4, cream, ")");
    eye(1.4, -5, 1.1);
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2.4;
      at(-1 + Math.cos(a) * (2.4 - i / 16), 7 + Math.sin(a) * 1.7, "#", blue);
    }
    stroke(-3, 0, -5, 2 + beat, [155, 216, 237], "/");
    return true;
  }
  if (kind === "lapras") {
    // Low oval shell, individual pegs, long cream throat, curled ears and
    // pointed flippers keep Lapras distinct from a generic blue sea turtle.
    polygon(
      [
        [-6, 2],
        [-10, 5 + beat * 0.5],
        [-3, 4],
      ],
      blue,
    );
    polygon(
      [
        [3, 2],
        [8, 6 - beat * 0.5],
        [1, 4],
      ],
      blue,
    );
    body(-1, 1, 7.5, 3, blue);
    body(-0.5, 2.2, 6, 1.4, cream);
    body(-2, -1, 5.8, 2.3, [159, 173, 199]);
    for (const [x, y] of [
      [-6, -2],
      [-3, -3],
      [0, -2.8],
      [2, -1],
    ]) {
      polygon(
        [
          [x - 0.8, y + 1],
          [x, y - 1.5],
          [x + 0.8, y + 1],
        ],
        [213, 220, 230],
      );
    }
    body(4, -2, 2.3, 4.2, blue);
    body(5, -4.2, 1.9, 4.3, blue);
    body(5.8, -3, 0.9, 3.4, cream);
    body(6, -8, 3.2, 2.1, blue);
    body(8.6, -7.6, 2, 1, blue);
    polygon(
      [
        [7, -9],
        [7.5, -12],
        [8.2, -9],
      ],
      cream,
    );
    body(3.4, -9, 1.4, 1.7, blue);
    at(3.3, -9, "c", cream);
    eye(7, -8.4, 0.7);
    stroke(8, -6.7, 9.4, -6.7, ink, "_");
    return true;
  }
  if (kind === "squirtle") {
    body(-3, 2, 4, 4.4, [151, 110, 76]);
    body(-1, 2, 3, 3.8, cream);
    stroke(-2.5, 0, 0.5, 3, [180, 150, 102], ":");
    stroke(-3, 2, 0, 1, [180, 150, 102], "-");
    body(1, -3, 4.3, 3.8, blue);
    body(1.5, -1.1, 2.6, 1.2, [145, 211, 235]);
    eye(2.5, -4.2, 1.3);
    body(2.3, 1 + beat * 0.4, 2.8, 1.1, blue);
    body(-1, 6, 2.4, 1.1, blue);
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      at(-7 + Math.cos(a) * (2.7 - i / 16), 4 + Math.sin(a) * 1.5, "#", blue);
    }
    return true;
  }
  if (kind === "poliwag") {
    polygon(
      [
        [-3, 2],
        [-10, 4 + beat],
        [-9, -1],
        [-3, 0],
      ],
      [199, 227, 246],
    );
    body(0, 0, 4.8, 4.6, [80, 144, 225]);
    body(0, 1.1, 3.3, 2.8, white);
    for (let i = 0; i < 50; i++) {
      const a = (i / 50) * Math.PI * 5;
      const r = (i / 50) * 2.5;
      at(Math.cos(a) * r, 1.1 + Math.sin(a) * r * 0.8, "@", ink);
    }
    eye(-1.5, -2.5, 0.9);
    eye(1.5, -2.5, 0.9);
    body(0, -0.7, 1.2, 0.5, [255, 170, 191]);
    stroke(-1, 4, -2, 6, [91, 149, 225], "v");
    stroke(2, 4, 3, 6, [91, 149, 225], "v");
    return true;
  }
  if (kind === "psyduck") {
    const yellow = [255, 213, 91];
    body(-1, 2, 4.4, 4.2, yellow);
    body(0, -3.5, 4.2, 3.6, yellow);
    body(3.4, -1.8, 3.1, 1.3, cream);
    eye(1.4, -4, 1.1);
    for (let i = -1; i <= 1; i++)
      stroke(i, -6.5, i * 1.6, -8.5, [122, 137, 153], "|");
    body(-3.4, -0.5 + beat * 0.3, 1.7, 2.4, yellow);
    polygon(
      [
        [-2, 5],
        [-5, 7],
        [-1, 7],
      ],
      cream,
    );
    polygon(
      [
        [1, 5],
        [0, 7],
        [5, 7],
      ],
      cream,
    );
    return true;
  }
  return false;
}
