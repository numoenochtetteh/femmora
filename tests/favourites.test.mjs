import test from 'node:test';
import assert from 'node:assert/strict';
import { favouritesStorageKey, normaliseFavourites, readFavourites, writeFavourites } from '../favourites.js';
import { products } from '../catalog.js';
const ids = products.map(product => product.id);

test('saved favourites reject unknown IDs and duplicates without losing their order', () => {
  assert.deepEqual(normaliseFavourites([ids[1], 'missing-product', ids[1], null, { id: ids[0] }, ids[0]], ids), [ids[1], ids[0]]);
  assert.deepEqual(normaliseFavourites({ ids: [ids[0]] }, ids), []);
});

test('corrupt saved data recovers and can be replaced by a valid list', () => {
  let saved = '{broken-json';
  const storage = { getItem: () => saved, setItem: (key, value) => { assert.equal(key, favouritesStorageKey); saved = value; } };
  assert.deepEqual(readFavourites(() => storage, ids), { ids: [], persistent: true });
  assert.equal(writeFavourites(() => storage, [ids[0], ids[2]]), true);
  assert.deepEqual(readFavourites(() => storage, ids).ids, [ids[0], ids[2]]);
  assert.equal(writeFavourites(() => storage, []), true);
  assert.deepEqual(readFavourites(() => storage, ids).ids, []);
});

test('blocked browser storage reports that favourites cannot persist', () => {
  const blocked = () => { throw new Error('Storage access denied'); };
  assert.deepEqual(readFavourites(blocked, ids), { ids: [], persistent: false });
  assert.equal(writeFavourites(blocked, [ids[0]]), false);
  assert.equal(writeFavourites(() => ({ setItem: () => { throw new Error('Quota reached'); } }), [ids[0]]), false);
});
