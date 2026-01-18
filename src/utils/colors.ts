export const GOLDEN_RATIO_CONJUGATE = 0.618033988749895;

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/**
 * Retorna { background, text, hue } em HSL para um identificador.
 * Determinístico: mesma chave -> mesma cor.
 */
export function projectColors(key: string, s = 65, l = 55) {
  const hash = hashString(String(key));
  // normalized fraction [0,1)
  const frac = (hash / 4294967296 + GOLDEN_RATIO_CONJUGATE) % 1;
  const hue = Math.floor(frac * 360);
  const background = `hsl(${hue} ${s}% ${l}%)`;
  const text = l > 58 ? '#111' : '#fff';
  return { background, text, hue };
}

/**
 * Gera um mapa de cores para um conjunto de projects de forma que as cores
 * fiquem distribuídas uniformemente pelo círculo de hue (0-360).
 * Determinístico: mesma lista -> mesmas cores; a ordem dos projetos não altera o resultado
 */
export function generateProjectColorMap(projects: { id: string }[], s = 65, l = 55) {
  const ids = Array.from(new Set(projects.map(p => p.id))).sort();
  const n = Math.max(1, ids.length);
  // offset para variar o ponto inicial, derivado do hash da lista
  const seedHash = hashString(ids.join('|')) / 4294967296;
  const offset = Math.floor((seedHash % 1) * 360);
  const map: Record<string, { background: string; text: string; hue: number }> = {};
  ids.forEach((id, i) => {
    // even spacing
    const hue = (Math.round((i * 360) / n) + offset) % 360;
    const background = `hsl(${hue} ${s}% ${l}%)`;
    const text = l > 58 ? '#111' : '#fff';
    map[id] = { background, text, hue };
  });
  return map;
}