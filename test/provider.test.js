const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isForcedCandidate,
  makeSubtitleId,
  readSubtitleId,
  searchOpenSubtitles
} = require('../src/provider');

test('only accepts explicitly marked forced/foreign-parts results', () => {
  assert.equal(
    isForcedCandidate({ attributes: { release: 'Example.Forced.1080p' } }),
    true
  );
  assert.equal(
    isForcedCandidate({ attributes: { release: 'foreign parts only' } }),
    true
  );
  assert.equal(
    isForcedCandidate({ attributes: { release: 'Example.English.WEB-DL' } }),
    false
  );
});

test('signed subtitle IDs reject tampering', () => {
  const secret = 'a'.repeat(32);
  const signed = makeSubtitleId(12345, secret);

  assert.equal(readSubtitleId(signed, secret), '12345');
  assert.equal(readSubtitleId(`${signed.slice(0, -1)}0`, secret), null);
});

test('search deduplicates results and excludes ordinary/non-English subtitles', async () => {
  const body = {
    data: [
      { attributes: { language: 'en', release: 'Film.Forced', files: [{ file_id: 7 }] } },
      { attributes: { language: 'en', release: 'Film.Forced', files: [{ file_id: 7 }] } },
      { attributes: { language: 'en', release: 'Film.WEB-DL', files: [{ file_id: 8 }] } },
      { attributes: { language: 'fr', release: 'Film.Forced', files: [{ file_id: 9 }] } }
    ]
  };

  const result = await searchOpenSubtitles({
    type: 'movie',
    id: 'tt1234567',
    apiKey: 'test-key',
    token: 'test-token',
    signingSecret: 's'.repeat(32),
    fetchImpl: async () => ({ ok: true, json: async () => body })
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].fileId, 7);
});
