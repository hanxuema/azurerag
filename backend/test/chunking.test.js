import test from "node:test";
import assert from "node:assert/strict";
import { chunkDocument } from "../src/lib/chunking.js";

test("chunkDocument returns one chunk for short input", () => {
  const chunks = chunkDocument("Short content.");
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0], "Short content.");
});

test("chunkDocument creates multiple chunks for long input", () => {
  const text = Array.from({ length: 120 }, () => "This is a sentence for chunking.").join(" ");
  const chunks = chunkDocument(text, { chunkSize: 200, overlap: 40 });
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((entry) => entry.length <= 220));
});
