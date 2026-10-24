// All offers and releases below are editable examples for the collection preview.
// Use fixed dates: a returning visitor must never see an artificially reset timer.
export const campaign = {
  id: 'little-treat-edit',
  name: 'Selected Styles Sale',
  startsAt: '2026-10-24T00:00:00Z',
  endsAt: '2026-11-15T23:59:59Z',
  percentOff: 20,
  productIds: ['blue-stripe-shirt', 'polka-dot-dress', 'gingham-halter', 'gingham-shorts'],
  preview: true,
};

export const drops = [
  { id: 'after-hours', number: '01', name: 'After Hours', tagline: 'Leopard prints for your next night out.', description: 'A leopard-print mini dress and a matching cami and trouser set. Choose your style before the release.', releasesAt: '2026-11-06T18:00:00Z', productIds: ['leopard-mini', 'leopard-trouser-set'], preview: true },
  { id: 'cherry-picked', number: '02', name: 'Cherry Picked', tagline: 'Cherry prints and matching sets.', description: 'Two cherry-print sets with camisoles and matching shorts. Browse the collection before it arrives.', releasesAt: '2026-11-13T18:00:00Z', productIds: ['cherry-knit-set', 'cherry-lounge-set'], preview: true },
  { id: 'off-the-clock', number: '03', name: 'Off the Clock', tagline: 'Graphic tees, denim and printed skirts.', description: 'Casual tee and skirt sets for everyday wear. Choose your size and preview a reservation.', releasesAt: '2026-11-20T18:00:00Z', productIds: ['off-duty-set', 'leopard-skirt-set'], preview: true },
];

export function campaignStatus(now = Date.now()) {
  if (now < Date.parse(campaign.startsAt)) return 'scheduled';
  return now < Date.parse(campaign.endsAt) ? 'active' : 'ended';
}

export function offerFor(id, now = Date.now()) {
  return campaignStatus(now) === 'active' && campaign.productIds.includes(id) ? campaign : null;
}

export function priceFor(product, now = Date.now()) {
  const offer = offerFor(product.id, now);
  return offer ? Math.round(product.price * (100 - offer.percentOff)) / 100 : product.price;
}

export function countdownParts(deadline, now = Date.now()) {
  const remaining = Math.max(0, Math.ceil((Date.parse(deadline) - now) / 1000));
  return { days: Math.floor(remaining / 86400), hours: Math.floor(remaining / 3600) % 24, minutes: Math.floor(remaining / 60) % 60, seconds: remaining % 60 };
}

export function dropStatus(drop, now = Date.now()) {
  return now < Date.parse(drop.releasesAt) ? 'upcoming' : 'released';
}

export function isReservable(dropId, productId, now = Date.now()) {
  const drop = drops.find((entry) => entry.id === dropId);
  return Boolean(drop && drop.productIds.includes(productId) && dropStatus(drop, now) === 'upcoming');
}
