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

export const transposeLyrics = (lyrics: string, steps: number, highlightChords: boolean = false, showChords: boolean = true): string => {
  if (steps === 0 && !highlightChords && showChords) return lyrics;

  const lines = lyrics.split('\n');

  const result = lines.map(line => {
    // A heuristic to check if a line is a "chord line".
    // It checks if the line contains mostly chords and whitespace.
    // If it's a chord line, we transpose its words.

    // Split line into words
    const words = line.split(/(\s+)/);

    // Regex for what we consider a valid chord word
    const chordWordRegex = /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|\+|-)?\d*(m)?\d*([#b]\d+)?((\/|-)\d+)?(\([^)]+\))?((\/|-)[A-G][#b]?)?$/i;

    const nonWhitespaceWords = words.filter(w => w.trim().length > 0);

    // Count how many non-whitespace words look like chords
    let chordCount = 0;
    for (const w of nonWhitespaceWords) {
      if (chordWordRegex.test(w)) {
        chordCount++;
      }
    }

    // If more than 50% of the words are chords, we consider it a chord line
    // Or if there are only 1-2 words and they are all chords
    const isChordLine = nonWhitespaceWords.length > 0 &&
      (chordCount / nonWhitespaceWords.length > 0.5 || chordCount === nonWhitespaceWords.length);

    if (isChordLine) {
      if (!showChords) return null;
      return words.map(word => {
        if (word.trim().length === 0) return word; // keep whitespace
        // If the word matches our chord pattern, transpose it
        if (chordWordRegex.test(word)) {
          // There might be some trailing characters we need to be careful with, but our regex is strict.
          const transposed = transposeChord(word, steps);
          return highlightChords ? `<span class="chord-highlight">${transposed}</span>` : transposed;
        }
        return word;
      }).join('');
    }

    // Also support inline chords like [C] or {C}
    return line.replace(/\[([A-G][#b]?[^\]]*)\]/g, (chordInside) => {
      if (!showChords) return '';
      const transposed = transposeChord(chordInside, steps);
      return highlightChords ? `[<span class="chord-highlight">${transposed}</span>]` : `[${transposed}]`;
    });
  }).filter(line => line !== null);

  return result.join('\n');
};
