const DEFAULT_CHUNK_SIZE = 1200;
const DEFAULT_OVERLAP = 180;

export function chunkDocument(content, options = {}) {
  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
  const overlap = options.overlap || DEFAULT_OVERLAP;
  const normalized = normalizeWhitespace(content);

  if (!normalized) {
    return [];
  }

  if (normalized.length <= chunkSize) {
    return [normalized];
  }

  const chunks = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);

    if (end < normalized.length) {
      const boundary = normalized.lastIndexOf(". ", end);
      if (boundary > start + Math.floor(chunkSize * 0.5)) {
        end = boundary + 1;
      }
    }

    const slice = normalized.slice(start, end).trim();
    if (slice) {
      chunks.push(slice);
    }

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

function normalizeWhitespace(text) {
  return text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").replace(/[ \t]+/g, " ").trim();
}
