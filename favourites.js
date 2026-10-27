export const favouritesStorageKey = 'femmora-favourites-v1';

export function normaliseFavourites(value, productIds) {
  if (!Array.isArray(value)) return [];
  const known = new Set(productIds);
  return [...new Set(value.filter((id) => typeof id === 'string' && known.has(id)))];
}

export function readFavourites(getStorage, productIds) {
  let raw;
  try {
    const storage = getStorage();
    if (!storage) return { ids: [], persistent: false };
    raw = storage.getItem(favouritesStorageKey);
  } catch { return { ids: [], persistent: false }; }
  try { return { ids: normaliseFavourites(JSON.parse(raw || '[]'), productIds), persistent: true }; }
  catch { return { ids: [], persistent: true }; }
}

export function writeFavourites(getStorage, ids) {
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.setItem(favouritesStorageKey, JSON.stringify(ids));
    return true;
  } catch { return false; }
}
