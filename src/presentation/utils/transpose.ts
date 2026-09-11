const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const transposeChord = (chord: string, steps: number): string => {
  // Regex to match a chord root note, optionally followed by accidentals (#/b), and the rest of the chord
  // E.g. C#m7/G -> Root: C#, Rest: m7/G
  // We need to parse bass notes too!
  const chordRegex = /^([A-G][#b]?)(.*)$/;
  const match = chord.match(chordRegex);

  if (!match) return chord; // If it doesn't match a chord pattern, return as is

  let [, root, rest] = match;

  // Normalize flat to sharp for our NOTES array
  let isFlat = root.endsWith('b');
  if (isFlat) {
    const flatMap: Record<string, string> = {
      'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
      'Cb': 'B', 'Fb': 'E'
    };
    root = flatMap[root] || root;
  }

  const rootIndex = NOTES.indexOf(root);
  if (rootIndex === -1) return chord;

  // Calculate new index
  let newIndex = (rootIndex + steps) % 12;
  if (newIndex < 0) newIndex += 12;

  let newRoot = NOTES[newIndex];

  // Also handle bass note transposing if there is a slash
  if (rest.includes('/')) {
    const [modifier, bass] = rest.split('/');
    if (bass) {
      const transposedBass = transposeChord(bass, steps);
      rest = `${modifier}/${transposedBass}`;
    }
  }

  return `${newRoot}${rest}`;
};

export interface SongSection {
  id: string;
  name: string;
  type: 'intro' | 'verse' | 'pre-chorus' | 'chorus' | 'bridge' | 'solo' | 'instrumental' | 'outro' | 'tag' | 'other';
}

export const getSectionType = (name: string): SongSection['type'] => {
  const lower = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (lower.includes('intro')) return 'intro';
  if (lower.includes('pre-refrao') || lower.includes('pre-coro') || lower.includes('pre chorus')) return 'pre-chorus';
  if (lower.includes('refrao') || lower.includes('coro') || lower.includes('chorus')) return 'chorus';
  if (lower.includes('ponte') || lower.includes('bridge')) return 'bridge';
  if (lower.includes('solo')) return 'solo';
  if (lower.includes('instrumental') || lower.includes('interludio') || lower.includes('interlude')) return 'instrumental';
  if (lower.includes('final') || lower.includes('outro') || lower.includes('coda')) return 'outro';
  if (lower.includes('tag')) return 'tag';
  if (lower.includes('verso') || lower.includes('parte') || lower.includes('estrofe')) return 'verse';
  return 'other';
};

const chordWordRegex = /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|\+|-)?\d*(m)?\d*([#b]\d+)?((\/|-)\d+)?(\([^)]+\))?((\/|-)[A-G][#b]?)?$/i;

export const isSectionHeader = (line: string): { isSection: boolean; label: string; type: SongSection['type'] } => {
  const trimmed = line.trim();
  if (!trimmed) return { isSection: false, label: '', type: 'other' };

  // Formato com colchetes: [Intro], [Verso 1], [Refrão], [Ponte], etc.
  const bracketMatch = trimmed.match(/^\[([^\]]+)\]$/);
  if (bracketMatch) {
    const inside = bracketMatch[1].trim();
    if (!chordWordRegex.test(inside)) {
      return { isSection: true, label: inside, type: getSectionType(inside) };
    }
  }

  // Formato com parênteses: (Intro), (Refrão)
  const parenMatch = trimmed.match(/^\(([^\)]+)\)$/);
  if (parenMatch) {
    const inside = parenMatch[1].trim();
    const type = getSectionType(inside);
    if (type !== 'other') {
      return { isSection: true, label: inside, type };
    }
  }

  // Formato com dois pontos: Intro:, Refrão:, Verso 1:, Ponte:
  const colonMatch = trimmed.match(/^([A-Za-zÀ-ÿ0-9\s-]+):$/);
  if (colonMatch) {
    const inside = colonMatch[1].trim();
    const type = getSectionType(inside);
    if (type !== 'other') {
      return { isSection: true, label: inside, type };
    }
  }

  // Linhas curtas com palavras-chave diretas: INTRO, REFRÃO, VERSO 1, PONTE, SOLO
  const type = getSectionType(trimmed);
  if (type !== 'other' && trimmed.length <= 25 && !trimmed.includes('  ')) {
    return { isSection: true, label: trimmed, type };
  }

  return { isSection: false, label: '', type: 'other' };
};

export const parseSongSections = (lyrics?: string | null): SongSection[] => {
  if (!lyrics) return [];
  const lines = lyrics.split('\n');
  const sections: SongSection[] = [];
  let counter = 0;

  for (const line of lines) {
    const { isSection, label, type } = isSectionHeader(line);
    if (isSection) {
      const sectionId = `song-section-${counter++}-${type}`;
      sections.push({
        id: sectionId,
        name: label,
        type
      });
    }
  }
  return sections;
};

export const transposeLyrics = (lyrics: string, steps: number, highlightChords: boolean = false, showChords: boolean = true): string => {
  if (!lyrics) return '';

  const lines = lyrics.split('\n');
  let sectionCounter = 0;

  const result = lines.map(line => {
    // 1. Verificar se a linha é um cabeçalho de seção (Estrutura da Música)
    const sectionCheck = isSectionHeader(line);
    if (sectionCheck.isSection) {
      const sectionId = `song-section-${sectionCounter++}-${sectionCheck.type}`;
      return `<div id="${sectionId}" class="song-section-chip section-${sectionCheck.type}" data-section="${sectionCheck.type}">` +
        `<span class="chip-dot"></span><span class="chip-text">${sectionCheck.label}</span>` +
        `</div>`;
    }

    // 2. Heurística para linha de acordes
    const words = line.split(/(\s+)/);
    const nonWhitespaceWords = words.filter(w => w.trim().length > 0);

    let chordCount = 0;
    for (const w of nonWhitespaceWords) {
      if (chordWordRegex.test(w)) {
        chordCount++;
      }
    }

    const isChordLine = nonWhitespaceWords.length > 0 &&
      (chordCount / nonWhitespaceWords.length > 0.5 || chordCount === nonWhitespaceWords.length);

    if (isChordLine) {
      if (!showChords) return null;
      return words.map(word => {
        if (word.trim().length === 0) return word;
        if (chordWordRegex.test(word)) {
          const transposed = transposeChord(word, steps);
          return highlightChords ? `<span class="chord-highlight">${transposed}</span>` : transposed;
        }
        return word;
      }).join('');
    }

    // 3. Suporte para acordes inline [C] ou [G/B]
    return line.replace(/\[([A-G][#b]?[^\]]*)\]/g, (_, chordInside) => {
      if (!showChords) return '';
      const transposed = transposeChord(chordInside, steps);
      return highlightChords ? `[<span class="chord-highlight">${transposed}</span>]` : `[${transposed}]`;
    });
  }).filter(line => line !== null);

  return result.join('\n');
};

