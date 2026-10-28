import { products, sizes, categories } from './catalog.js';
import { campaign, campaignStatus, countdownParts, offerFor, priceFor } from './campaigns.js';
import { createDiscovery } from './discovery.js';
import { favouritesStorageKey, readFavourites, writeFavourites } from './favourites.js';

const $ = (selector, root = document) => root.querySelector(selector);
const main = $('#main');
const searchDialog = $('#search-dialog');
const bagDialog = $('#bag-dialog');
const zoomDialog = $('#zoom-dialog');
const favouritesDialog = $('#favourites-dialog');
const instagram = 'https://www.instagram.com/femmora_gh/';
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const money = (value) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2 }).format(value);
const getProduct = (id) => products.find((product) => product.id === id);
const asset = (product) => `/assets/${product.image}`;
const wideHeroScreen = window.matchMedia('(min-width: 641px)');
const heroMedia = () => wideHeroScreen.matches
  ? { src: '/assets/femmora-wide-film.mp4', poster: '/assets/wide-film-poster.jpg', variant: 'wide' }
  : { src: '/assets/femmora-film.mp4', poster: '/assets/film-poster.jpg', variant: 'phone' };
const brandMark = (className = '') => `<span class="brandmark ${className}"><img src="/assets/femmora-logo.png" alt="" width="1774" height="887" decoding="async" /></span>`;
const keyFor = (item) => `${item.id}:${item.size}`;
const maxQuantity = 10;
let storageAvailable = true;
let cart = readCart();
const favouriteState = readFavourites(() => window.localStorage, products.map((product) => product.id));
let favourites = favouriteState.ids;
let favouritesPersistent = favouriteState.persistent;
let collectionFilter = 'All';
let collectionSort = 'featured';
let selectedSize = 'S';
let productQuantity = 1;
let menuOpen = false;
let currentProductId = null;
let dialogTrigger = null;

const paths = {
  search: '<circle cx="10.8" cy="10.8" r="7.5"/><path d="m16.3 16.3 5 5"/>',
  bag: '<path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  close: '<path d="m5 5 14 14M19 5 5 19"/>',
  arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
  arrowup: '<path d="M6 18 18 6M6 6h12v12"/>',
  menu: '<path d="M3 8h18M3 16h18"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  trash: '<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
  zoom: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6M7 10h6M10 7v6"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
};
const icon = (name) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ''}</svg>`;
const announce = (message) => { $('#announcer').textContent = message; };
const discovery = createDiscovery({ $, main, icon, money, escape, asset, getProduct, products, sizes, productCard, favouriteButton, openDialog, announce, onPricingChange: () => { if (!document.hidden) render(); } });

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('femmora-bag-v1') || '[]');
    if (!Array.isArray(saved)) return [];
    const validated = new Map();
    for (const item of saved) {
      if (!item || !getProduct(item.id) || !sizes.includes(item.size) || !Number.isFinite(Number(item.quantity))) continue;
      const quantity = Math.max(1, Math.min(maxQuantity, Math.floor(Number(item.quantity))));
      const key = keyFor(item);
      const previous = validated.get(key)?.quantity || 0;
      validated.set(key, { id: item.id, size: item.size, quantity: Math.min(maxQuantity, previous + quantity) });
    }
    return [...validated.values()];
  } catch { storageAvailable = false; return []; }
}

function persistCart() {
  try { localStorage.setItem('femmora-bag-v1', JSON.stringify(cart)); }
  catch { storageAvailable = false; announce('Your bag is available for this visit. Browser storage is unavailable.'); }
  renderHeader();
}
const cartCount = () => cart.reduce((total, item) => total + item.quantity, 0);
const cartTotal = () => cart.reduce((total, item) => total + priceFor(getProduct(item.id)) * item.quantity, 0);

function route() {
  const hash = window.location.hash.slice(1) || '/';
  const [path, query = ''] = hash.split('?');
  const parts = path.split('/').filter(Boolean);
  return { name: parts[0] || 'home', id: parts[1], query: new URLSearchParams(query) };
}

function renderOfferBar() {
  const bar = $('#offer-bar');
  const now = Date.now();
  const state = campaignStatus(now);
  const visible = state !== 'ended';
  document.documentElement.classList.toggle('has-offer-bar', visible);
  bar.hidden = !visible;
  if (!visible) { bar.replaceChildren(); return; }
  const scheduled = state === 'scheduled';
  const deadline = scheduled ? campaign.startsAt : campaign.endsAt;
  const endDate = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Accra', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(deadline));
  const units = { days: 'd', hours: 'h', minutes: 'm', seconds: 's' };
  bar.setAttribute('aria-label', `${campaign.name}${campaign.preview ? ' preview' : ''}`);
  bar.innerHTML = `<p class="offer-bar-copy"><span>${campaign.percentOff}% off selected styles</span>${campaign.preview ? '<span class="offer-bar-preview">Preview offer</span>' : ''}</p>
    <span class="offer-bar-timer" role="timer" aria-live="off" aria-label="Offer ${scheduled ? 'starts' : 'ends'} ${escape(endDate)} GMT"><span aria-hidden="true"><span class="offer-bar-timer-label">${scheduled ? 'Starts in' : 'Ends in'}</span>${Object.entries(countdownParts(deadline, now)).map(([unit, value]) => `<span class="offer-bar-unit"><span data-countdown="${unit}">${String(value).padStart(2, '0')}</span><span>${units[unit]}</span></span>`).join('')}</span></span>
    <a class="offer-bar-link" href="#/promotions" aria-label="${scheduled ? 'Preview' : 'Shop'} the selected styles sale">${scheduled ? 'Preview sale' : 'Shop sale'} ${icon('arrow')}</a>`;
}

function renderHeader() {
  renderOfferBar();
  const current = route().name;
  const count = cartCount();
  const nav = [['Home', '#/', 'home'], ['Shop', '#/shop', 'shop'], ['Sale', '#/promotions', 'promotions'], ['Coming soon', '#/drops', 'drops'], ['FAQ', '#/faq', 'faq']];
  const links = nav.map(([label, url, name]) => `<a href="${url}" ${current === name ? 'class="active" aria-current="page"' : ''}>${label}</a>`).join('');
  $('#header').innerHTML = `
    <a class="header-logo" href="#/" aria-label="FEMMORA home">${brandMark()}</a>
    <nav class="desktop-nav" aria-label="Main navigation">${links}</nav>
    <div class="header-tools">
      <span class="currency-label">GHS ₵ <span class="muted">/ Ghana</span></span>
      <button class="icon-button" data-action="search" aria-label="Search the collection">${icon('search')}</button>
      <a class="icon-button favourites-link" href="#/favourites" aria-label="Favourites, ${favourites.length} saved ${favourites.length === 1 ? 'item' : 'items'}" ${current === 'favourites' ? 'aria-current="page"' : ''}>${icon('heart')}<span class="favourites-count" ${favourites.length ? '' : 'hidden'} aria-hidden="true">${favourites.length}</span></a>
      <a class="icon-button bag-button" href="#/cart" aria-label="Shopping bag, ${count} ${count === 1 ? 'item' : 'items'}">${icon('bag')}${count ? `<span class="bag-count" aria-hidden="true">${count}</span>` : ''}</a>
      <button class="icon-button mobile-menu-toggle" data-action="menu" aria-label="${menuOpen ? 'Close' : 'Open'} navigation" aria-expanded="${menuOpen}" aria-controls="mobile-nav">${icon(menuOpen ? 'close' : 'menu')}</button>
    </div>
    ${menuOpen ? `<button type="button" class="menu-backdrop" data-action="menu-close" aria-label="Close navigation menu" tabindex="-1"></button><nav id="mobile-nav" class="mobile-nav" aria-label="Mobile navigation">${links}<a href="#/favourites" ${current === 'favourites' ? 'class="active" aria-current="page"' : ''}>Favourites <span class="mobile-favourites-count">(${favourites.length})</span></a></nav>` : ''}`;
}

function updateHeaderAppearance() {
  document.body.classList.toggle('header-scrolled', window.scrollY > 24);
  document.body.classList.toggle('menu-is-open', menuOpen);
}

function closeMenu({ restoreFocus = false } = {}) {
  if (!menuOpen) return;
  menuOpen = false;
  renderHeader();
  updateHeaderAppearance();
  if (restoreFocus) $('.mobile-menu-toggle')?.focus({ preventScroll: true });
}

function renderFooter() {
  $('#footer').innerHTML = `
    <div class="footer-content">
      <div class="footer-note"><span class="overline muted">Stay in touch</span><h2>Get new drop updates.</h2><p>New styles, release dates and offers from FEMMORA.</p><button class="text-link footer-signup-button" data-action="notify">Preview email signup ↗</button><a class="text-link" href="${instagram}" target="_blank" rel="noopener noreferrer">Follow @femmora_gh ↗</a></div>
      <nav class="footer-links" aria-label="Explore"><span class="overline">Explore</span><a href="#/shop">Shop the collection</a><a href="#/favourites">Your favourites</a><a href="#/promotions">Shop sale</a><a href="#/drops">Coming soon</a><a href="#/reserve">Reserve styles</a><a href="#/faq">FAQ & customer care</a><a href="#/cart">Your bag</a></nav>
      <nav class="footer-links" aria-label="Find us"><span class="overline">Find us</span><a href="${instagram}" target="_blank" rel="noopener noreferrer">Instagram ↗</a><span>Accra, Ghana · GHS ₵</span></nav>
    </div>
    <div class="footer-brand" aria-hidden="true">${brandMark()}</div>
    <div class="footer-bottom"><span>© ${new Date().getFullYear()} FEMMORA</span><span>Collection preview · Details and prices to be confirmed.</span></div>`;
}

function renderHome() {
  const media = heroMedia();
  main.innerHTML = `
    <section class="entrance" aria-labelledby="hero-heading">
      <video id="entrance-film" src="${media.src}" data-variant="${media.variant}" autoplay muted loop playsinline preload="metadata" poster="${media.poster}" aria-hidden="true"></video>
      <div class="entrance-center">
        <p class="hero-eyebrow">FEMMORA / Women’s clothing</p>
        <h1 id="hero-heading">Your next<br>favourite outfit</h1>
        <p class="hero-description">Dresses, tops, bottoms and matching sets.<br class="hero-copy-break"> For everyday plans and nights out.</p>
        <div class="hero-actions"><a class="btn hero-shop" href="#/shop">Shop the collection ${icon('arrow')}</a><a class="hero-sale" href="#/promotions">Shop sale ${icon('arrowup')}</a></div>
        <p class="hero-detail">Based in Accra · Prices in GHS</p>
      </div>
      <button class="entrance-caption home-scroll" data-action="home-discover" aria-label="Explore clothing categories">Explore the collection ${icon('arrow')}</button>
      <div class="entrance-bottom"><button id="film-toggle" class="film-toggle" data-action="film" aria-label="Pause background video">${icon('pause')}<span>Pause film</span></button><a href="${instagram}" target="_blank" rel="noopener noreferrer">@FEMMORA_GH ↗</a></div>
    </section>${discovery.homeSections()}`;
  discovery.mountCarousels();
  const video = $('#entrance-film');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  video.muted = true;
  video.addEventListener('pause', updateFilmButton);
  video.addEventListener('play', updateFilmButton);
  if (reducedMotion) { video.autoplay = false; video.pause(); updateFilmButton(); }
  else { video.play().catch(() => updateFilmButton()); }
}

function syncHeroMedia() {
  const video = $('#entrance-film');
  if (!video) return;
  const media = heroMedia();
  if (video.getAttribute('src') === media.src) return;
  const shouldPlay = !video.paused && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  video.autoplay = shouldPlay;
  video.poster = media.poster;
  video.src = media.src;
  video.dataset.variant = media.variant;
  video.load();
  if (shouldPlay) video.play().catch(updateFilmButton);
  else { video.pause(); updateFilmButton(); }
}

function updateFilmButton() {
  const video = $('#entrance-film');
  const button = $('#film-toggle');
  if (!video || !button) return;
  button.innerHTML = `${icon(video.paused ? 'play' : 'pause')}<span>${video.paused ? 'Play film' : 'Pause film'}</span>`;
  button.setAttribute('aria-label', `${video.paused ? 'Play' : 'Pause'} background video`);
}

function productCard(product, index = 9) {
  return `<article class="product-card">${offerFor(product.id) ? '<span class="offer-badge">' + offerFor(product.id).percentOff + '% off<span class="sr-only"> / preview price</span></span>' : ''}
    ${favouriteButton(product)}
    <a href="#/product/${product.id}" class="product-photo" aria-label="View ${escape(product.name)}"><img src="${asset(product)}" alt="${escape(product.color + ' ' + product.name)}" width="800" height="1000" loading="${index < 5 ? 'eager' : 'lazy'}" decoding="async" /><span class="product-view" aria-hidden="true">View product ${icon('arrow')}</span></a>
    <div class="product-card-info"><h2><a href="#/product/${product.id}">${escape(product.name)}</a></h2><p>${discovery.priceMarkup(product)}</p></div>
  </article>`;
}

function favouriteButton(product, context = 'card') {
  const saved = favourites.includes(product.id);
  return `<button type="button" class="favourite-toggle ${saved ? 'is-saved' : ''} ${context === 'product' ? 'favourite-product-action' : ''}" data-action="favourite" data-id="${product.id}" data-favourite-context="${context}" aria-pressed="${saved}" aria-label="${saved ? 'Remove' : 'Save'} ${escape(product.name)} ${saved ? 'from' : 'to'} favourites">${icon('heart')}${context === 'product' ? `<span data-favourite-label>${saved ? 'Saved to favourites' : 'Save to favourites'}</span>` : ''}</button>`;
}

function syncFavouriteControls() {
  document.querySelectorAll('[data-action="favourite"]').forEach((button) => {
    const product = getProduct(button.dataset.id);
    if (!product) return;
    const saved = favourites.includes(product.id);
    button.classList.toggle('is-saved', saved);
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute('aria-label', `${saved ? 'Remove' : 'Save'} ${product.name} ${saved ? 'from' : 'to'} favourites`);
    const label = $('[data-favourite-label]', button);
    if (label) label.textContent = saved ? 'Saved to favourites' : 'Save to favourites';
  });
  const link = $('.favourites-link');
  if (link) {
    link.setAttribute('aria-label', `Favourites, ${favourites.length} saved ${favourites.length === 1 ? 'item' : 'items'}`);
    const count = $('.favourites-count', link);
    count.textContent = favourites.length;
    count.hidden = !favourites.length;
  }
  const mobileCount = $('.mobile-favourites-count');
  if (mobileCount) mobileCount.textContent = `(${favourites.length})`;
}

function favouriteList() {
  if (!favourites.length) return `<div class="favourites-empty">${icon('heart')}<h2>Nothing saved yet.</h2><p>Tap the heart on a style you love. Find it here whenever you’re ready.</p><a href="#/shop" class="btn btn-dark">Explore the collection ${icon('arrow')}</a></div>`;
  return `<div class="product-grid favourites-grid">${favourites.map((id) => {
    const product = getProduct(id);
    return `<div class="favourites-item">${productCard(product)}<button type="button" class="btn btn-full favourite-choose" data-action="favourite-choose" data-id="${id}" aria-label="Choose size and add ${escape(product.name)} to bag">Choose size & add ${icon('bag')}</button></div>`;
  }).join('')}</div>`;
}

function renderFavourites() {
  main.innerHTML = `<div class="page-shell favourites-page"><header class="favourites-heading"><div><p class="overline">Saved for later</p><h1 tabindex="-1">Your favourites.</h1><p>Keep the pieces you love in one place. Choose a size when you’re ready to add one to your bag.</p></div><a class="text-link" href="#/shop">Continue shopping ${icon('arrowup')}</a></header><div class="favourites-summary"><span id="favourites-total">${favourites.length} ${favourites.length === 1 ? 'style' : 'styles'} saved</span><p id="favourites-storage-note">${favouritesPersistent ? 'Saved on this device.' : 'Browser storage is unavailable. Favourites are kept for this visit.'}</p></div><div id="favourites-list">${favouriteList()}</div></div>`;
}

function refreshFavouriteList() {
  if (route().name !== 'favourites') return;
  $('#favourites-list').innerHTML = favouriteList();
  $('#favourites-total').textContent = `${favourites.length} ${favourites.length === 1 ? 'style' : 'styles'} saved`;
  $('#favourites-storage-note').textContent = favouritesPersistent ? 'Saved on this device.' : 'Browser storage is unavailable. Favourites are kept for this visit.';
}

function toggleFavourite(id) {
  const product = getProduct(id);
  if (!product) return;
  const previousIndex = favourites.indexOf(id);
  const saved = previousIndex === -1;
  favourites = saved ? [id, ...favourites] : favourites.filter((value) => value !== id);
  favouritesPersistent = writeFavourites(() => window.localStorage, favourites);
  syncFavouriteControls();
  refreshFavouriteList();
  announce(`${product.name} ${saved ? 'saved to' : 'removed from'} your favourites.${favouritesPersistent ? '' : ' Saved for this visit only.'}`);
  if (route().name === 'favourites') {
    const controls = [...document.querySelectorAll('#favourites-list [data-action="favourite"]')];
    (controls[Math.min(Math.max(previousIndex, 0), controls.length - 1)] || $('.favourites-heading h1'))?.focus({ preventScroll: true });
  }
}

function openFavouriteOptions(id) {
  const product = getProduct(id);
  if (!product) return;
  favouritesDialog.innerHTML = `<button type="button" class="icon-button dialog-close" data-action="close-dialog" aria-label="Close size selection">${icon('close')}</button><div class="favourite-dialog-product"><img src="${asset(product)}" alt="${escape(product.name)}" width="100" height="125" /><div><p class="overline">From your favourites</p><h2 id="favourites-dialog-title">${escape(product.name)}</h2><p>${discovery.priceMarkup(product)}</p></div></div><form data-favourite-form data-id="${id}"><label for="favourite-size">Choose your size</label><select id="favourite-size" name="size" required><option value="" selected disabled>Select a size</option>${sizes.map((size) => `<option value="${size}">${size}</option>`).join('')}</select><label for="favourite-quantity">Quantity</label><input id="favourite-quantity" type="number" name="quantity" min="1" max="${maxQuantity}" step="1" value="1" required /><p class="favourite-form-error" role="alert"></p><button type="submit" class="btn btn-dark btn-full">Add to bag ${icon('bag')}</button><p class="favourite-size-note">Sample sizes · Final availability will be confirmed before launch.</p></form>`;
  openDialog(favouritesDialog);
  $('#favourite-size').focus();
}

function sortedProducts(list) {
  const copy = [...list];
  if (collectionSort === 'price-low') copy.sort((a, b) => priceFor(a) - priceFor(b));
  if (collectionSort === 'price-high') copy.sort((a, b) => priceFor(b) - priceFor(a));
  if (collectionSort === 'name') copy.sort((a, b) => a.name.localeCompare(b.name));
  return copy;
}

function renderShop() {
  const filtered = sortedProducts(products.filter((product) => collectionFilter === 'All' || product.category === collectionFilter));
  main.innerHTML = `<div class="page-shell collection-page">
    <div class="collection-toolbar">
      <div class="collection-label"><h1>The collection</h1><span class="collection-count">${filtered.length} pieces</span></div>
      <div class="filters" role="group" aria-label="Filter by category">${categories.map((category) => `<button class="filter-button ${collectionFilter === category ? 'active' : ''}" data-action="filter" data-category="${category}" aria-pressed="${collectionFilter === category}">${category}</button>`).join('')}</div>
      <div class="sort-wrap"><label for="sort">Sort by</label><select id="sort" aria-label="Sort products"><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A–Z</option></select></div>
    </div>
    <div class="product-grid" aria-label="${escape(collectionFilter)} products">${filtered.map(productCard).join('')}</div>
    <p class="preview-note">Store preview. Product names, sizes and prices are provisional.</p>
  </div>`;
  $('#sort').value = collectionSort;
}

function quantityControl(quantity, context, label = 'Quantity') {
  return `<div class="quantity-control"><button type="button" data-action="quantity" data-context="${context}" data-delta="-1" aria-label="Decrease ${escape(label)}" ${quantity <= 1 ? 'disabled' : ''}>−</button><input type="number" inputmode="numeric" min="1" max="${maxQuantity}" value="${quantity}" data-quantity="${context}" aria-label="${escape(label)}" /><button type="button" data-action="quantity" data-context="${context}" data-delta="1" aria-label="Increase ${escape(label)}" ${quantity >= maxQuantity ? 'disabled' : ''}>+</button></div>`;
}

function renderProduct(id) {
  const product = getProduct(id);
  if (!product) return renderNotFound();
  if (currentProductId !== id) { selectedSize = 'S'; productQuantity = 1; currentProductId = id; }
  const related = products.filter((item) => item.id !== id).sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category)).slice(0, 4);
  main.innerHTML = `<div class="page-shell">
    <div class="breadcrumbs"><a href="#/shop">Collection</a><span>/</span><span>${escape(product.name)}</span></div>
    <div class="product-layout">
      <div class="product-gallery"><button class="product-main-image" data-action="zoom" data-id="${id}" aria-label="Enlarge ${escape(product.name)} image"><img src="${asset(product)}" alt="${escape(product.color + ' ' + product.name)}" width="800" height="1000" fetchpriority="high" /><span class="zoom-hint">${icon('zoom')}</span></button><p class="gallery-caption">${escape(product.name)} · ${escape(product.color)}</p></div>
      <div class="product-info"><p class="overline">FEMMORA / ${escape(product.category)}</p><h1 class="product-title">${escape(product.name)}</h1><p class="product-price">${discovery.priceMarkup(product)}</p><p class="product-description">${escape(product.description)}</p><p class="color-line">Colour <span>${escape(product.color)}</span></p>
        <div class="size-label"><span>Size — <span id="chosen-size">${selectedSize}</span></span><a href="#/faq?section=sizing">Size help</a></div>
        <div class="sizes" role="group" aria-label="Choose a size">${sizes.map((size) => `<button class="size-button ${size === selectedSize ? 'active' : ''}" data-action="size" data-size="${size}" aria-pressed="${size === selectedSize}">${size}</button>`).join('')}</div>
        <span class="quantity-label">Quantity</span><div id="product-quantity-control">${quantityControl(productQuantity, 'product')}</div>
        <button class="btn btn-dark btn-full add-button" data-action="add" data-id="${id}">Add to bag ${icon('arrow')}</button>${favouriteButton(product, 'product')}<p class="launch-note">Collection preview · Final details and prices to be confirmed.</p>
        <div class="detail-accordion"><details><summary>The details</summary><div class="details-content"><ul>${product.details.map((detail) => `<li>${escape(detail)}</li>`).join('')}</ul></div></details><details><summary>Size & fit</summary><div class="details-content">Sample sizes are shown for this preview. For current fit advice, <a class="text-link" href="${instagram}" target="_blank" rel="noopener noreferrer">contact FEMMORA</a> before ordering.</div></details><details><summary>Delivery & returns</summary><div class="details-content">Delivery areas, charges and the returns policy will be confirmed before online orders open. <a class="text-link" href="#/faq?section=delivery">Visit customer care</a>.</div></details></div>
      </div>
    </div>
    <section class="related" aria-labelledby="related-heading"><div class="section-heading"><h2 id="related-heading">You may also like</h2><a class="text-link" href="#/shop">Explore all</a></div><div class="product-grid">${related.map(productCard).join('')}</div></section>
  </div>`;
}

function openDialog(dialog) {
  dialogTrigger = document.activeElement;
  if (!dialog.open) dialog.showModal();
}

function closeDialogs() {
  [...document.querySelectorAll('dialog')].forEach((dialog) => { if (dialog.open) dialog.close(); });
}

function openSearch() {
  searchDialog.innerHTML = `<div class="search-top"><div class="search-field"><label id="search-title" for="search-input">Search the collection</label><input type="search" id="search-input" autocomplete="off" placeholder="Search dresses, tops or sets…" maxlength="100" />${icon('search')}</div><button class="icon-button" data-action="close-dialog" aria-label="Close search">${icon('close')}</button></div><div id="search-body" class="search-body"></div>`;
  updateSearch('');
  openDialog(searchDialog);
  $('#search-input').focus();
}

function searchProducts(query) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return products.filter((product) => terms.every((term) => `${product.name} ${product.color} ${product.category} ${product.description}`.toLowerCase().includes(term)));
}

function updateSearch(query) {
  const matches = searchProducts(query);
  $('#search-body').innerHTML = `<p class="search-results-label" role="status">${query.trim() ? `${matches.length} ${matches.length === 1 ? 'piece' : 'pieces'} found` : 'Explore the collection'}</p>${matches.length ? `<div class="search-results">${matches.slice(0, 4).map(productCard).join('')}</div>${query.trim() && matches.length > 4 ? `<p style="text-align:center;margin-top:25px"><a class="text-link" href="#/search?q=${encodeURIComponent(query)}">View all ${matches.length} results</a></p>` : ''}` : '<div class="search-empty"><p>No pieces found. Try “dress”, “gingham” or “cherry”.</p></div>'}`;
}

function renderSearch(query) {
  const matches = searchProducts(query);
  main.innerHTML = `<div class="page-shell"><div class="section-heading"><h1 style="font-size:24px;letter-spacing:-.03em">${query ? `Results for “${escape(query)}”` : 'The collection'}</h1><button class="text-link" data-action="search">Search again</button></div><p class="muted" style="font-size:14px;margin-bottom:25px">${matches.length} pieces</p>${matches.length ? `<div class="product-grid">${matches.map(productCard).join('')}</div>` : '<div class="empty-state"><p>No pieces found. Try another search.</p><a class="btn" href="#/shop">Explore the collection</a></div>'}</div>`;
}

function addToCart(id, { size = selectedSize, quantity = productQuantity } = {}) {
  if (!getProduct(id) || !sizes.includes(size) || !Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity) return;
  const existing = cart.find((item) => item.id === id && item.size === size);
  if (existing && existing.quantity + quantity > maxQuantity) { announce(`You can add up to ${maxQuantity} of the same size. Your bag already has ${existing.quantity}.`); openAddedToBag(existing, false); return; }
  if (existing) existing.quantity += quantity;
  else cart.push({ id, size, quantity });
  persistCart();
  const added = { id, size, quantity };
  announce(`${getProduct(id).name}, size ${size}, added to your bag.`);
  openAddedToBag(added, true);
}

function openAddedToBag(item, added) {
  const product = getProduct(item.id);
  bagDialog.innerHTML = `<button class="icon-button dialog-close" data-action="close-dialog" aria-label="Close bag confirmation">${icon('close')}</button><h2 id="bag-title" class="bag-notification-title">${icon('check')}${added ? 'Added to your bag' : 'Your bag has the maximum quantity'}</h2><div class="bag-added-product"><img src="${asset(product)}" alt="${escape(product.name)}" width="90" height="112" /><div><h3>${escape(product.name)}</h3><p>Size: ${item.size} · Quantity: ${item.quantity}</p><p>${money(priceFor(product))}</p></div></div><a href="#/cart" class="btn btn-full">View bag (${cartCount()})</a><a href="#/checkout" class="btn btn-dark btn-full">Check out</a><button class="continue-button" data-action="close-dialog">Continue shopping</button>`;
  openDialog(bagDialog);
}

function renderCart() {
  if (!cart.length) { main.innerHTML = `<div class="empty-state"><p class="overline">Your bag</p><h1>Your bag is empty.</h1><p>Browse the collection to add your favourite styles.</p><a class="btn btn-dark" href="#/shop">Explore the collection ${icon('arrow')}</a></div>`; return; }
  main.innerHTML = `<div class="page-shell cart-page"><div class="cart-heading"><h1>Your bag <span class="muted" style="font-size:18px">(${cartCount()})</span></h1><a href="#/shop" class="text-link">Continue shopping</a></div><div class="cart-labels"><span>Product</span><span>Quantity</span><span>Total</span></div><div class="cart-items">${cart.map((item) => {
    const product = getProduct(item.id);
    return `<article class="cart-item"><div class="cart-item-product"><a href="#/product/${item.id}" tabindex="-1" aria-hidden="true"><img src="${asset(product)}" alt="" width="105" height="130" /></a><div><h2><a href="#/product/${item.id}">${escape(product.name)}</a></h2><p>${money(priceFor(product))}</p><p>Size: ${item.size} · ${escape(product.color)}</p></div></div><div class="cart-item-quantity">${quantityControl(item.quantity, keyFor(item), `${product.name}, size ${item.size}, quantity`)}<button class="icon-button" data-action="remove" data-key="${keyFor(item)}" aria-label="Remove ${escape(product.name)}, size ${item.size}">${icon('trash')}</button></div><p class="cart-item-total">${money(priceFor(product) * item.quantity)}</p></article>`;
  }).join('')}</div><div class="cart-summary"><div class="total-line"><span>Estimated total</span><span>${money(cartTotal())}</span></div><p>Preview prices. Delivery charges and final totals will be confirmed when online orders open.</p><a href="#/checkout" class="btn btn-dark btn-full">Check out ${icon('arrow')}</a><p style="text-align:center;margin-top:14px">${storageAvailable ? 'Your bag is saved in this browser.' : 'Your bag is available for this visit.'}</p></div></div>`;
}

function updateQuantity(context, value, trigger = null) {
  let quantity = Math.max(1, Math.min(maxQuantity, Math.floor(Number(value) || 1)));
  if (context === 'product') { productQuantity = quantity; $('#product-quantity-control').innerHTML = quantityControl(quantity, 'product'); }
  else {
    const item = cart.find((entry) => keyFor(entry) === context);
    if (!item) return;
    item.quantity = quantity;
    persistCart(); renderCart(); announce(`Quantity updated to ${quantity}. Bag total ${money(cartTotal())}.`);
  }
  if (trigger) {
    const buttons = [...document.querySelectorAll('[data-action="quantity"]')];
    const next = buttons.find((button) => button.dataset.context === context && button.dataset.delta === trigger && !button.disabled);
    if (next) next.focus({ preventScroll: true });
    else [...document.querySelectorAll('[data-quantity]')].find((input) => input.dataset.quantity === context)?.focus({ preventScroll: true });
  }
}

function renderCheckout() {
  if (!cart.length) return renderCart();
  main.innerHTML = `<div class="checkout-page"><div class="checkout-top"><p class="overline">FEMMORA</p><h1>Checkout preview</h1><p>Online checkout is coming soon. Your bag is ready for when the store opens. No payment has been taken.</p></div><div class="checkout-summary">${cart.map((item) => {
    const product = getProduct(item.id);
    return `<div class="checkout-summary-row"><img src="${asset(product)}" alt="${escape(product.name)}" width="55" height="70" /><div><h2>${escape(product.name)}</h2><p>${item.size} / Qty ${item.quantity}</p></div><span>${money(priceFor(product) * item.quantity)}</span></div>`;
  }).join('')}<div class="total-line"><span>Preview subtotal</span><span>${money(cartTotal())}</span></div><p class="muted" style="font-size:13px;line-height:1.8">Delivery costs and final prices will be shown before payment once online checkout is available.</p></div><div class="checkout-actions"><a class="text-link" href="#/cart">Back to your bag</a><a class="text-link" href="#/shop">Keep exploring</a></div></div>`;
}

function renderFAQ(section) {
  main.innerHTML = `<div class="page-shell faq-page"><p class="overline muted">Customer care</p><h1 class="faq-title">FAQ & customer care.</h1><div class="faq-layout"><nav class="faq-index" aria-label="Customer care sections">${[['orders', 'Orders'], ['releases', 'Offers & drops'], ['reservations', 'Reservations'], ['delivery', 'Delivery'], ['sizing', 'Sizing & fit'], ['returns', 'Returns & exchanges'], ['care', 'Caring for your pieces'], ['contact', 'Get in touch']].map(([id, name]) => `<a href="#/faq?section=${id}" data-action="faq-section" data-section="${id}">${name}</a>`).join('')}</nav><div class="faq-copy">
    <section id="faq-orders"><h2>Orders</h2><h3>How do I shop FEMMORA?</h3><p>Explore the collection, choose your size and add your favourites to your bag. You can change quantities or remove pieces in your bag before checking out.</p><h3>Is online checkout open?</h3><p>The online store is in preview. Online checkout is coming soon. Product names, prices and available sizes shown in this preview will be confirmed before orders open.</p></section>
    <section id="faq-releases"><h2>Offers & new drops</h2><h3>How does the countdown work?</h3><p>Selected Styles Sale has one fixed sample end date. While this preview offer is active, its discounted prices appear in the collection, product pages and bag. When it ends, the normal preview prices return. Offer details and dates are examples until FEMMORA confirms them.</p><h3>Can I get notified about a drop?</h3><p>Explore Upcoming Drops and select Notify me to preview the email signup. No email address is stored, no subscription is created and no messages are sent in this demo. Follow @femmora_gh for current updates.</p><a href="#/drops" class="text-link">View upcoming collections</a></section>
    <section id="faq-reservations"><h2>Reservations</h2><h3>Can I reserve a piece before release?</h3><p>The Reservations page lets you browse example upcoming edits, choose a size and quantity, and save a reservation preview. It does not submit a reservation, hold stock or take payment. Release dates, sizes, availability and reservation terms will be confirmed before real requests open.</p><h3>Where is my preview saved?</h3><p>Your chosen piece, size and quantity are saved on this device when browser storage is available. Your name and email address are not saved or sent. You can remove saved previews from the Reservations page.</p><a href="#/reserve" class="text-link">Browse upcoming styles</a></section>
    <section id="faq-delivery"><h2>Delivery</h2><h3>Where does FEMMORA deliver?</h3><p>Delivery areas, charges and estimated timeframes will be published here before the online store opens for orders.</p><h3>Will I see delivery costs before paying?</h3><p>The final checkout will show the applicable delivery charge and your complete order total before payment.</p></section>
    <section id="faq-sizing"><h2>Sizing & fit</h2><h3>Which size should I choose?</h3><p>Fit can vary from piece to piece. Check each product’s details and contact FEMMORA for current measurements or help choosing your size.</p><p>Sizes shown in this preview are examples. Confirmed measurements and availability will be added before launch.</p></section>
    <section id="faq-returns"><h2>Returns & exchanges</h2><h3>What is the returns policy?</h3><p>FEMMORA’s final returns and exchanges policy will be published here before online checkout opens. Please review it before placing an order.</p></section>
    <section id="faq-care"><h2>Caring for your pieces</h2><h3>How should I care for my clothing?</h3><p>Follow the care label on each garment. Different fabrics and finishes need different care. If you are unsure, contact FEMMORA before washing.</p></section>
    <section id="faq-contact"><h2>Get in touch</h2><p>For product questions, sizing help or current availability, find FEMMORA on Instagram.</p><a class="text-link" href="${instagram}" target="_blank" rel="noopener noreferrer">@femmora_gh ↗</a></section>
  </div></div></div>`;
  if (section) requestAnimationFrame(() => $(`#faq-${CSS.escape(section)}`)?.scrollIntoView({ block: 'start' }));
}

function renderNotFound() {
  main.innerHTML = '<div class="empty-state"><h1>Page not found.</h1><p>We couldn’t find that page.</p><a class="btn btn-dark" href="#/shop">Back to the collection</a></div>';
}

function render() {
  const current = route();
  const isHome = current.name === 'home';
  document.body.classList.toggle('is-home', isHome);
  menuOpen = false;
  closeDialogs();
  renderHeader();
  renderFooter();
  const titles = { home: 'Women’s Clothing', shop: 'The Collection', favourites: 'Your Favourites', cart: 'Your Bag', faq: 'FAQ & Customer Care', checkout: 'Checkout Preview', search: 'Search', promotions: 'Sale', drops: 'Coming Soon', reserve: 'Reservation Preview' };
  document.title = `FEMMORA — ${current.name === 'product' ? getProduct(current.id)?.name || 'Collection' : titles[current.name] || 'Explore'}`;
  if (isHome) renderHome();
  else if (current.name === 'shop') {
    const requestedCategory = current.query.get('category');
    collectionFilter = categories.includes(requestedCategory) ? requestedCategory : 'All';
    renderShop();
  }
  else if (current.name === 'promotions') discovery.renderPromotions();
  else if (current.name === 'drops') discovery.renderDrops();
  else if (current.name === 'reserve') discovery.renderReserve(current.query.get('drop'));
  else if (current.name === 'product') renderProduct(current.id);
  else if (current.name === 'cart') renderCart();
  else if (current.name === 'favourites') renderFavourites();
  else if (current.name === 'checkout') renderCheckout();
  else if (current.name === 'faq') renderFAQ(current.query.get('section'));
  else if (current.name === 'search') renderSearch(current.query.get('q') || '');
  else renderNotFound();
  window.scrollTo(0, 0);
  updateHeaderAppearance();
  main.focus({ preventScroll: true });
}

document.addEventListener('click', async (event) => {
  if (menuOpen && !event.target.closest('#header')) closeMenu();
  if (event.target.closest('a[href="#main"]')) { event.preventDefault(); main.focus(); main.scrollIntoView({ block: 'start' }); return; }
  const navigationLink = event.target.closest('a[href^="#/"]');
  if (navigationLink) {
    closeDialogs();
    if (navigationLink.getAttribute('href') === window.location.hash) closeMenu();
  }
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (discovery.handleClick(action, target)) return;
  if (action === 'menu') { menuOpen = !menuOpen; renderHeader(); updateHeaderAppearance(); $('.mobile-menu-toggle')?.focus({ preventScroll: true }); }
  else if (action === 'menu-close') closeMenu({ restoreFocus: true });
  else if (action === 'favourite') toggleFavourite(target.dataset.id);
  else if (action === 'favourite-choose') openFavouriteOptions(target.dataset.id);
  else if (action === 'search') {
    if (menuOpen) {
      closeMenu();
      $('[data-action="search"]', $('#header'))?.focus({ preventScroll: true });
    }
    openSearch();
  }
  else if (action === 'close-dialog') target.closest('dialog')?.close();
  else if (action === 'filter') {
    collectionFilter = categories.includes(target.dataset.category) ? target.dataset.category : 'All';
    const destination = collectionFilter === 'All' ? '#/shop' : '#/shop?category=' + encodeURIComponent(collectionFilter);
    history.replaceState(null, '', destination);
    renderShop();
    [...document.querySelectorAll('[data-action="filter"]')].find((button) => button.dataset.category === collectionFilter)?.focus({ preventScroll: true });
    announce(`Showing ${collectionFilter.toLowerCase()} products.`);
  }
  else if (action === 'size') { selectedSize = target.dataset.size; document.querySelectorAll('[data-action="size"]').forEach((button) => { const active = button.dataset.size === selectedSize; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); }); $('#chosen-size').textContent = selectedSize; }
  else if (action === 'quantity') { const context = target.dataset.context; const current = context === 'product' ? productQuantity : cart.find((item) => keyFor(item) === context)?.quantity; updateQuantity(context, current + Number(target.dataset.delta), target.dataset.delta); }
  else if (action === 'add') addToCart(target.dataset.id);
  else if (action === 'remove') { const item = cart.find((entry) => keyFor(entry) === target.dataset.key); cart = cart.filter((entry) => keyFor(entry) !== target.dataset.key); persistCart(); renderCart(); announce(`${getProduct(item?.id)?.name || 'Item'} removed from your bag.`); $('.cart-heading h1, .empty-state h1')?.setAttribute('tabindex', '-1'); $('.cart-heading h1, .empty-state h1')?.focus({ preventScroll: true }); }
  else if (action === 'zoom') { const product = getProduct(target.dataset.id); zoomDialog.innerHTML = `<button class="icon-button dialog-close" data-action="close-dialog" aria-label="Close enlarged image">${icon('close')}</button><img src="${asset(product)}" alt="${escape(product.name)}" />`; openDialog(zoomDialog); }
  else if (action === 'film') { const video = $('#entrance-film'); if (video.paused) { try { await video.play(); } catch { announce('The film could not be played. You can still explore the collection.'); } } else video.pause(); updateFilmButton(); }
  else if (action === 'faq-section' && window.location.hash === target.getAttribute('href')) { $(`#faq-${CSS.escape(target.dataset.section)}`)?.scrollIntoView({ block: 'start' }); }
});

document.addEventListener('submit', discovery.handleSubmit);
document.addEventListener('submit', (event) => {
  const form = event.target;
  if (!form.matches('[data-favourite-form]')) return;
  event.preventDefault();
  const data = new FormData(form);
  const size = data.get('size');
  const quantity = Number(data.get('quantity'));
  const id = form.dataset.id;
  const error = $('.favourite-form-error', form);
  if (!sizes.includes(size) || !Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity || !getProduct(id)) { error.textContent = 'Choose a valid size and a quantity from 1 to 10.'; return; }
  const existing = cart.find((item) => item.id === id && item.size === size);
  if ((existing?.quantity || 0) + quantity > maxQuantity) { error.textContent = `Your bag already has ${existing.quantity} in this size. You can add up to ${maxQuantity} in total.`; return; }
  const trigger = dialogTrigger;
  favouritesDialog.close();
  if (trigger?.isConnected) trigger.focus({ preventScroll: true });
  addToCart(id, { size, quantity });
});
document.addEventListener('input', (event) => { if (event.target.id === 'search-input') updateSearch(event.target.value); });
document.addEventListener('change', (event) => {
  if (event.target.id === 'sort') { collectionSort = event.target.value; renderShop(); $('#sort').focus({ preventScroll: true }); }
  if (event.target.matches('[data-quantity]')) updateQuantity(event.target.dataset.quantity, event.target.value);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.id === 'search-input') { const query = event.target.value.trim(); searchDialog.close(); window.location.hash = `/search?q=${encodeURIComponent(query)}`; }
  if (event.key === 'Escape' && menuOpen) closeMenu({ restoreFocus: true });
});
document.addEventListener('focusin', (event) => {
  if (menuOpen && !event.target.closest('#header')) closeMenu();
});
document.addEventListener('touchmove', (event) => {
  const panel = event.target.closest('#mobile-nav');
  if (menuOpen && (!panel || panel.scrollHeight <= panel.clientHeight)) closeMenu();
}, { passive: true });
window.addEventListener('wheel', (event) => {
  const panel = event.target.closest('#mobile-nav');
  if (menuOpen && event.deltaY && (!panel || panel.scrollHeight <= panel.clientHeight)) closeMenu();
}, { passive: true });
window.addEventListener('scroll', () => { closeMenu(); updateHeaderAppearance(); }, { passive: true });
window.addEventListener('resize', () => closeMenu());
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('click', (event) => { if (event.target !== dialog) return; const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); });
  dialog.addEventListener('close', () => { if (!document.querySelector('dialog[open]') && dialogTrigger?.isConnected) dialogTrigger.focus({ preventScroll: true }); });
}
document.addEventListener('visibilitychange', () => { const video = $('#entrance-film'); if (document.hidden) { closeMenu(); if (video) video.pause(); } });
window.addEventListener('storage', (event) => { if (event.key === 'femmora-bag-v1' || event.key === null) { cart = readCart(); renderHeader(); if (route().name === 'cart') renderCart(); if (route().name === 'checkout') renderCheckout(); } });
window.addEventListener('storage', (event) => {
  if (event.key !== favouritesStorageKey && event.key !== null) return;
  const latest = readFavourites(() => window.localStorage, products.map((product) => product.id));
  favourites = latest.ids;
  favouritesPersistent = latest.persistent;
  syncFavouriteControls();
  refreshFavouriteList();
});
window.addEventListener('hashchange', render);
wideHeroScreen.addEventListener('change', syncHeroMedia);
render();
