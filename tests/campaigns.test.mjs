import test from 'node:test';
import assert from 'node:assert/strict';
import { campaign, drops, campaignStatus, priceFor, countdownParts, isReservable } from '../campaigns.js';
import { products } from '../catalog.js';

test('offer begins at its fixed start and stops at its fixed end', () => {
  const product = products.find((entry) => entry.id === campaign.productIds[0]);
  const start = Date.parse(campaign.startsAt), end = Date.parse(campaign.endsAt);
  assert.equal(campaignStatus(start - 1), 'scheduled');
  assert.equal(priceFor(product, start - 1), product.price);
  assert.equal(campaignStatus(start), 'active');
  assert.equal(priceFor(product, start), 176);
  assert.equal(campaignStatus(end), 'ended');
  assert.equal(priceFor(product, end), product.price);
  assert.equal(priceFor(products.find((entry) => !campaign.productIds.includes(entry.id)), start), 260);
});

test('countdown never wraps into negative values after expiry', () => {
  const end = Date.parse(campaign.endsAt);
  assert.deepEqual(countdownParts(campaign.endsAt, end + 1000), { days: 0, hours: 0, minutes: 0, seconds: 0 });
  assert.deepEqual(countdownParts(campaign.endsAt, end - 90061000), { days: 1, hours: 1, minutes: 1, seconds: 1 });
});

test('reservations require a matching piece and a future drop', () => {
  const drop = drops[0], release = Date.parse(drop.releasesAt);
  assert.equal(isReservable(drop.id, drop.productIds[0], release - 1), true);
  assert.equal(isReservable(drop.id, drop.productIds[0], release), false);
  assert.equal(isReservable(drop.id, 'everyday-tank', release - 1), false);
  assert.equal(isReservable('missing', drop.productIds[0], release - 1), false);
});

test('configured campaigns reference real, distinct catalogue pieces', () => {
  const known = new Set(products.map((entry) => entry.id));
  for (const id of campaign.productIds) assert.ok(known.has(id));
  const dropPieces = drops.flatMap((drop) => drop.productIds);
  assert.equal(new Set(dropPieces).size, dropPieces.length);
  for (const drop of drops) {
    assert.ok(Number.isFinite(Date.parse(drop.releasesAt)));
    for (const id of drop.productIds) assert.ok(known.has(id));
  }
});
