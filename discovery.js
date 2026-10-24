import { campaign, drops, campaignStatus, offerFor, priceFor, countdownParts, dropStatus, isReservable } from './campaigns.js';

export function createDiscovery({ $, main, icon, money, escape, asset, getProduct, sizes, productCard, openDialog, announce, onPricingChange }) {
  const dialog = $('#discovery-dialog');
  const storageKey = 'femmora-reservation-previews-v1';
  let reservations = readReservations();
  let lastTimingState = timingState();
  const date = (value, options = {}) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Accra', day: 'numeric', month: 'short', ...options }).format(new Date(value));
  const releaseDate = (drop) => date(drop.releasesAt, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) + ' GMT';
  const previewNotice = '<p class="campaign-preview"><span class="preview-dot" aria-hidden="true"></span>Collection preview · Offers, release dates and lineup are examples.</p>';

  function readReservations() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!Array.isArray(value)) return [];
      const unique = new Map();
      for (const item of value) {
        const drop = drops.find((entry) => entry.id === item?.dropId);
        if (!drop?.productIds.includes(item.productId) || !sizes.includes(item.size) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) continue;
        const key = item.dropId + ':' + item.productId + ':' + item.size;
        unique.set(key, { key, dropId: drop.id, productId: item.productId, size: item.size, quantity: item.quantity });
      }
      return [...unique.values()].slice(0, 30);
    } catch { return []; }
  }

  function saveReservations() {
    try { localStorage.setItem(storageKey, JSON.stringify(reservations)); return true; }
    catch { return false; }
  }

  function priceMarkup(product) {
    const offer = offerFor(product.id);
    return '<span class="price-current">' + money(priceFor(product)) + '</span>' +
      (offer ? '<del class="price-was"><span class="sr-only">Original price </span>' + money(product.price) + '</del>' : '');
  }

  function countdown() {
    const state = campaignStatus();
    const deadline = state === 'scheduled' ? campaign.startsAt : campaign.endsAt;
    const parts = countdownParts(deadline);
    return '<div class="countdown-block"><p class="countdown-label">' + (state === 'ended' ? 'This sample offer has ended' : state === 'scheduled' ? 'Sample offer starts in' : 'Sample offer ends in') + '</p>' +
      '<div class="countdown" role="timer" aria-live="off" aria-label="Sample offer ' + (state === 'scheduled' ? 'starts ' : 'ends ') + escape(date(deadline, { year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })) + ' GMT">' +
      Object.entries(parts).map(([unit, value]) => '<div class="countdown-unit"><span data-countdown="' + unit + '">' + String(value).padStart(2, '0') + '</span><small>' + unit + '</small></div>').join('') +
      '</div><p class="countdown-date">' + date(deadline, { year: 'numeric' }) + ' · ' + (state === 'scheduled' ? '00:00' : '23:59') + ' GMT</p></div>';
  }

  function offerFeature(page = false) {
    const active = campaignStatus() === 'active';
    const ended = campaignStatus() === 'ended';
    const first = getProduct(campaign.productIds[1]), second = getProduct(campaign.productIds[0]);
    return '<section id="home-offers" class="offer-feature ' + (page ? 'offer-feature-page' : '') + '" aria-labelledby="offer-heading">' +
      '<div class="offer-copy"><p class="overline">The Little Treat Edit / Offer preview</p><h' + (page ? '1' : '2') + ' id="offer-heading">' + (ended ? 'Until the<br>next little treat.' : 'Good pieces.<br>Better timing.') + '</h' + (page ? '1' : '2') + '>' +
      '<p class="feature-description">' + (ended ? 'This sample offer has finished. There is still plenty to fall for in the collection.' : 'The pieces you keep thinking about, at a sweeter price. Explore a handpicked edit with ' + campaign.percentOff + '% off preview prices.') + '</p>' +
      countdown() +
      (page && !ended ? '<button class="btn btn-dark" data-action="offer-pieces">Shop the offer edit ' + icon('arrow') + '</button>' : '<a class="btn btn-dark" href="' + (ended ? '#/shop' : '#/promotions') + '">' + (ended ? 'Find your next favourite' : 'Shop the little treat edit') + icon('arrow') + '</a>') +
      '<p class="offer-fineprint">Sample offer only. Final prices and promotion dates will be confirmed before orders open.</p></div>' +
      '<div class="offer-art" aria-label="A preview of The Dot Halter Mini and The Wrap Shirt">' +
      '<div class="offer-visual offer-visual-first"><img src="' + asset(first) + '" alt="' + escape(first.name) + '" width="800" height="1000" loading="lazy" /><span>' + escape(first.name) + '</span></div>' +
      '<div class="offer-visual offer-visual-second"><img src="' + asset(second) + '" alt="' + escape(second.name) + '" width="800" height="1000" loading="lazy" /><span>' + escape(second.name) + '</span></div>' +
      '<div class="offer-stamp"><strong>' + (ended ? 'Next' : campaign.percentOff + '%') + '</strong><span>' + (ended ? 'chapter' : active ? 'off / preview' : 'coming / preview') + '</span></div></div></section>';
  }

  function dropCard(drop) {
    const product = getProduct(drop.productIds[0]);
    const upcoming = dropStatus(drop) === 'upcoming';
    return '<article class="drop-card"><div class="drop-art"><span class="drop-number">EDIT ' + drop.number + '</span><img src="' + asset(product) + '" alt="' + escape(product.name) + ' from the ' + escape(drop.name) + ' preview edit" width="800" height="1000" loading="lazy" />' +
      '<span class="drop-image-tag">' + (upcoming ? 'Coming next / Preview' : 'Release preview') + '</span></div>' +
      '<div class="drop-card-copy"><p class="drop-date">Sample release · ' + releaseDate(drop) + '</p><h3>' + escape(drop.name) + '</h3><p>' + escape(drop.tagline) + '</p>' +
      '<div class="drop-card-actions"><a class="text-link" href="#/reserve?drop=' + drop.id + '">' + (upcoming ? 'Get a first look' : 'View the edit') + icon('arrowup') + '</a><button class="drop-notify" data-action="notify" data-drop="' + drop.id + '" aria-label="Preview notifications for ' + escape(drop.name) + '">' + icon('bell') + '<span>Notify me</span></button></div></div></article>';
  }

  function signupSection() {
    return '<section class="drop-signup" aria-labelledby="signup-heading"><div><p class="overline">Stay in the know</p><h2 id="signup-heading">Your next favourite.<br>Your first heads-up.</h2><p>First looks, fresh drops, and the pieces you will want on repeat. A little FEMMORA, straight to you.</p></div>' +
      '<div class="signup-invite"><button class="btn btn-dark" data-action="notify">Keep me in the loop ' + icon('arrow') + '</button><p>Preview the email signup. Subscriptions open at launch.</p><a href="https://www.instagram.com/femmora_gh/" class="text-link" target="_blank" rel="noopener noreferrer">Find us on Instagram ↗</a></div></section>';
  }

  function homeSections() {
    return '<div class="home-discovery" id="home-discovery"><div class="discovery-intro"><div><p class="overline">A little more FEMMORA</p><h2>Your wardrobe<br>has plans.</h2></div><div><p>The little treats. The next obsessions. The pieces you will want before everyone else.</p><div class="intro-links"><a href="#/promotions" class="text-link">Find an offer ' + icon('arrowup') + '</a><a href="#/drops" class="text-link">See what is next ' + icon('arrowup') + '</a></div></div></div>' +
      offerFeature() + '<section class="drops-section" aria-labelledby="home-drops-heading"><div class="discovery-heading"><div><p class="overline">A first look at what is next</p><h2 id="home-drops-heading">Meet your next obsession.</h2></div><a class="text-link" href="#/drops">Explore the next drops ' + icon('arrowup') + '</a></div>' + previewNotice +
      '<div class="drop-grid">' + drops.map(dropCard).join('') + '</div></section>' +
      '<section class="reserve-feature" aria-labelledby="reserve-feature-heading"><span class="reserve-feature-number" aria-hidden="true">01 / 02 / 03</span><p class="overline">Before the drop</p><h2 id="reserve-feature-heading">Saw it. Loved it.<br>Make it your first pick.</h2><p>Get a closer look at the next edit, choose your piece, and try the reservation preview before the collection arrives.</p><a href="#/reserve" class="btn btn-dark">Browse the early edit ' + icon('arrow') + '</a><small>Preview reservations only. No stock is held or payment taken.</small></section>' +
      signupSection() + '</div>';
  }

  function renderPromotions() {
    const selected = campaign.productIds.map(getProduct);
    main.innerHTML = '<div class="discovery-page"><div class="discovery-breadcrumb"><a href="#/">Home</a><span>/</span><span>Offers</span></div>' +
      offerFeature(true) + '<section class="offer-pieces"><div class="discovery-heading"><div><p class="overline">A handpicked edit</p><h2>' + (campaignStatus() === 'ended' ? 'Still easy to fall for.' : 'A little treat looks good on you.') + '</h2></div><span>' + selected.length + ' pieces</span></div>' +
      '<div class="product-grid offers-grid">' + selected.map(productCard).join('') + '</div>' +
      '<p class="preview-note">A little preview of what is to come. Final offers, prices and dates will be confirmed before orders open.</p></section>' +
      signupSection() + '</div>';
  }

  function renderDrops() {
    main.innerHTML = '<div class="discovery-page"><div class="discovery-breadcrumb"><a href="#/">Home</a><span>/</span><span>Next drops</span></div><header class="discovery-page-heading"><p class="overline">The next chapter</p><h1>Good things<br>are on the way.</h1><p>Get a first look. Find the piece that feels like you. Be there for the next FEMMORA moment.</p><div class="page-heading-actions"><a href="#/reserve" class="btn btn-dark">Browse before the drop ' + icon('arrow') + '</a><button class="text-link" data-action="notify">Keep me in the loop</button></div></header>' +
      previewNotice + '<section aria-labelledby="drop-list-heading"><h2 id="drop-list-heading" class="sr-only">Upcoming edits</h2><div class="drop-grid">' + drops.map(dropCard).join('') + '</div></section>' +
      '<section class="drop-explainer"><div><span>01</span><h2>Take a first look.</h2><p>Discover the next edit and the pieces catching your eye.</p></div><div><span>02</span><h2>Pick your favourite.</h2><p>Choose a piece and size to try the reservation preview.</p></div><div><span>03</span><h2>Stay close.</h2><p>Preview the signup for release updates. Real signups open at launch.</p></div></section>' + signupSection() + '</div>';
  }

  function reservationCard(product, drop) {
    const available = isReservable(drop.id, product.id);
    return '<article class="reserve-card"><div class="reserve-card-art"><img src="' + asset(product) + '" alt="' + escape(product.name) + '" width="800" height="1000" loading="lazy" /><span>' + escape(drop.name) + ' / Preview</span></div>' +
      '<div class="reserve-card-copy"><p class="drop-date">Sample release · ' + releaseDate(drop) + '</p><h2>' + escape(product.name) + '</h2><p>' + escape(product.description) + '</p><div class="reserve-card-bottom"><span>Preview price<br><strong>' + money(product.price) + '</strong></span><button class="btn" data-action="reserve" data-drop="' + drop.id + '" data-product="' + product.id + '" ' + (available ? '' : 'disabled') + '>' + (available ? 'Reserve a first pick' : 'Preview window closed') + (available ? icon('arrow') : '') + '</button></div></div></article>';
  }

  function savedReservations() {
    if (!reservations.length) return '<div class="saved-empty"><p>Your preview list is waiting for a first favourite.</p></div>';
    return '<ul class="saved-reservations">' + reservations.map((item) => {
      const product = getProduct(item.productId), drop = drops.find((entry) => entry.id === item.dropId);
      return '<li><img src="' + asset(product) + '" alt="" width="64" height="80" loading="lazy" /><div><h3>' + escape(product.name) + '</h3><p>' + escape(drop.name) + ' · ' + item.size + ' · Qty ' + item.quantity + '</p><small>Preview only · No stock reserved</small></div><button class="icon-button" data-action="reservation-remove" data-key="' + item.key + '" aria-label="Remove preview for ' + escape(product.name) + ', size ' + item.size + '">' + icon('trash') + '</button></li>';
    }).join('') + '</ul>';
  }

  function renderReserve(dropId) {
    const chosen = drops.find((entry) => entry.id === dropId);
    const selected = chosen ? [chosen] : drops;
    main.innerHTML = '<div class="discovery-page reserve-page"><div class="discovery-breadcrumb"><a href="#/">Home</a><span>/</span><a href="#/drops">Next drops</a><span>/</span><span>First picks</span></div>' +
      '<header class="discovery-page-heading"><p class="overline">Get ahead of the drop</p><h1>First look.<br>First on your list.</h1><p>' + (chosen ? escape(chosen.description) : 'Some pieces are worth finding early. Browse the upcoming edits, choose your size, and try your first pick.') + '</p><p class="reservation-preview-note">Reservation preview · No stock is held. No payment is taken.</p></header>' +
      '<nav class="drop-filters" aria-label="Browse a release"><a href="#/reserve" ' + (!chosen ? 'aria-current="page"' : '') + '>All first picks</a>' + drops.map((drop) => '<a href="#/reserve?drop=' + drop.id + '" ' + (chosen?.id === drop.id ? 'aria-current="page"' : '') + '>' + escape(drop.name) + '</a>').join('') + '</nav>' +
      '<div class="reserve-grid">' + selected.flatMap((drop) => drop.productIds.map((id) => reservationCard(getProduct(id), drop))).join('') + '</div>' +
      '<section class="saved-section" aria-labelledby="saved-heading"><div class="discovery-heading"><div><p class="overline">A little list of favourites</p><h2 id="saved-heading">Your reservation previews.</h2></div><span>' + reservations.length + ' saved</span></div><p class="saved-note">Saved on this device for your preview. These are not submitted reservation requests.</p><div id="saved-reservations-body">' + savedReservations() + '</div></section>' +
      signupSection() + '</div>';
  }

  const closeButton = '<button class="icon-button dialog-close" data-action="close-dialog" aria-label="Close">' + icon('close') + '</button>';

  function openSignup(dropId) {
    const drop = drops.find((entry) => entry.id === dropId);
    dialog.innerHTML = closeButton + '<div class="discovery-dialog-content"><p class="overline">The FEMMORA drop list</p><h2 id="discovery-dialog-title">' + (drop ? 'Be there for<br>' + escape(drop.name) + '.' : 'Good things.<br>First to you.') + '</h2><p>First looks and fresh pieces. A heads-up when your next favourite is ready.</p><div class="form-preview-label">Preview form · You will not be subscribed or sent emails.</div>' +
      '<form data-discovery-form="signup"><label class="field-label" for="drop-email">Email address</label><input id="drop-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" maxlength="254" required /><label class="consent-label"><input type="checkbox" name="consent" required /><span>I would like email updates about ' + (drop ? escape(drop.name) : 'FEMMORA releases') + ' when signups open.</span></label><button class="btn btn-dark btn-full" type="submit">Preview the signup ' + icon('arrow') + '</button><p class="form-fineprint">This preview does not store your email address. Signups will open at launch.</p></form></div>';
    openDialog(dialog);
    $('#drop-email').focus();
  }

  function openReservation(dropId, productId) {
    if (!isReservable(dropId, productId)) { announce('The preview window for this piece has closed. Explore the next drops.'); return; }
    const drop = drops.find((entry) => entry.id === dropId), product = getProduct(productId);
    dialog.innerHTML = closeButton + '<div class="discovery-dialog-content"><p class="overline">Before the drop / ' + escape(drop.name) + '</p><h2 id="discovery-dialog-title">Your first pick.</h2><div class="reservation-product"><img src="' + asset(product) + '" alt="' + escape(product.name) + '" width="96" height="120" /><div><h3>' + escape(product.name) + '</h3><p>' + escape(product.color) + '</p><p>Preview price · ' + money(product.price) + '</p><p>Sample release · ' + releaseDate(drop) + '</p></div></div><div class="form-preview-label">Preview only · No stock is held or payment taken.</div>' +
      '<form data-discovery-form="reservation" data-drop="' + drop.id + '" data-product="' + product.id + '"><div class="form-field-row"><div><label class="field-label" for="reserve-size">Choose your size</label><select name="size" id="reserve-size" required><option value="">Select a size</option>' + sizes.map((size) => '<option value="' + size + '">' + size + '</option>').join('') + '</select></div><div><label class="field-label" for="reserve-quantity">Quantity</label><input id="reserve-quantity" type="number" name="quantity" min="1" max="10" step="1" inputmode="numeric" value="1" required /></div></div><label class="field-label" for="reserve-name">Your name</label><input id="reserve-name" name="name" autocomplete="name" placeholder="Your name" maxlength="100" required /><label class="field-label" for="reserve-email">Email address</label><input id="reserve-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" maxlength="254" required /><label class="consent-label"><input type="checkbox" name="consent" required /><span>I understand this is a preview. It does not submit a reservation or guarantee availability.</span></label><p class="form-error" role="alert"></p><button class="btn btn-dark btn-full" type="submit">Save my preview ' + icon('arrow') + '</button><p class="form-fineprint">Only your selected piece, size and quantity are saved on this device. Your name and email are not stored or sent.</p></form></div>';
    openDialog(dialog);
    $('#reserve-size').focus();
  }

  function showConfirmation(reservation = null, persisted = true) {
    const product = reservation ? getProduct(reservation.productId) : null;
    dialog.innerHTML = closeButton + '<div class="discovery-dialog-content form-confirmation"><div class="confirmation-mark">' + icon('check') + '</div><p class="overline">Preview complete</p><h2 id="discovery-dialog-title">' + (reservation ? 'A lovely<br>first pick.' : 'You have seen<br>the first look.') + '</h2><p>' + (reservation ? escape(product.name) + ' · Size ' + reservation.size + ' · Qty ' + reservation.quantity : 'This is how customers will join the FEMMORA drop list.') + '</p><div class="form-preview-label">' + (reservation ? 'No reservation was submitted. No stock is held and no payment was taken.' : 'You have not been subscribed. No emails have been sent or saved.') + '</div>' +
      '<p class="form-fineprint">' + (reservation ? persisted ? 'Your piece is saved to your preview list on this device.' : 'Your piece is available in the preview list for this visit. Browser storage is unavailable.' : 'Follow @femmora_gh for current brand updates while signups are being prepared.') + '</p>' +
      (reservation ? '<a href="#/reserve?drop=' + reservation.dropId + '" class="btn btn-dark btn-full" data-action="view-previews">Back to my first picks ' + icon('arrow') + '</a>' : '<a href="https://www.instagram.com/femmora_gh/" target="_blank" rel="noopener noreferrer" class="btn btn-dark btn-full">Follow FEMMORA ↗</a>') + '<button class="continue-button" data-action="close-dialog">Keep exploring</button></div>';
    $('#discovery-dialog-title').setAttribute('tabindex', '-1');
    $('#discovery-dialog-title').focus();
  }

  function handleSubmit(event) {
    const form = event.target.closest('[data-discovery-form]');
    if (!form) return;
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (form.dataset.discoveryForm === 'signup') { showConfirmation(); return; }
    const data = new FormData(form);
    const size = String(data.get('size') || ''), quantity = Number(data.get('quantity'));
    if (!isReservable(form.dataset.drop, form.dataset.product) || !sizes.includes(size) || !Number.isInteger(quantity) || quantity < 1 || quantity > 10 || !String(data.get('name') || '').trim()) {
      $('.form-error', form).textContent = 'Check your selection. This release may no longer be available for preview.';
      return;
    }
    const key = form.dataset.drop + ':' + form.dataset.product + ':' + size;
    const item = { key, dropId: form.dataset.drop, productId: form.dataset.product, size, quantity };
    const existing = reservations.findIndex((entry) => entry.key === key);
    if (existing >= 0) reservations[existing] = item;
    else if (reservations.length < 30) reservations.push(item);
    else { $('.form-error', form).textContent = 'Your preview list is full. Remove a piece before adding another.'; return; }
    const persisted = saveReservations();
    if ($('#saved-reservations-body')) {
      $('#saved-reservations-body').innerHTML = savedReservations();
      $('.saved-section .discovery-heading > span').textContent = reservations.length + ' saved';
    }
    announce('Reservation preview saved. No stock is held.');
    showConfirmation(item, persisted);
  }

  function handleClick(action, target) {
    if (action === 'notify') openSignup(target.dataset.drop);
    else if (action === 'reserve') openReservation(target.dataset.drop, target.dataset.product);
    else if (action === 'offer-pieces') $('.offer-pieces')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    else if (action === 'home-discover') $('#home-discovery')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    else if (action === 'reservation-remove') {
      reservations = reservations.filter((item) => item.key !== target.dataset.key);
      saveReservations();
      $('#saved-reservations-body').innerHTML = savedReservations();
      $('.saved-section .discovery-heading > span').textContent = reservations.length + ' saved';
      $('#saved-heading').setAttribute('tabindex', '-1');
      $('#saved-heading').focus({ preventScroll: true });
      announce('Piece removed from your reservation preview list.');
    } else if (action === 'view-previews') {
      dialog.close();
      if (window.location.hash === target.getAttribute('href')) $('.saved-section')?.scrollIntoView({ block: 'start' });
    } else return false;
    return true;
  }

  function timingState() {
    return campaignStatus() + ':' + drops.map((drop) => dropStatus(drop)).join(':');
  }

  function tick() {
    if (document.hidden) return;
    const next = timingState();
    if (next !== lastTimingState) { lastTimingState = next; onPricingChange(); return; }
    const deadline = campaignStatus() === 'scheduled' ? campaign.startsAt : campaign.endsAt;
    const parts = countdownParts(deadline);
    for (const [unit, value] of Object.entries(parts)) {
      document.querySelectorAll('[data-countdown="' + unit + '"]').forEach((node) => { const text = String(value).padStart(2, '0'); if (node.textContent !== text) node.textContent = text; });
    }
  }

  window.setInterval(tick, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey) return;
    reservations = readReservations();
    if ($('#saved-reservations-body')) {
      $('#saved-reservations-body').innerHTML = savedReservations();
      $('.saved-section .discovery-heading > span').textContent = reservations.length + ' saved';
    }
  });
  return { homeSections, renderPromotions, renderDrops, renderReserve, priceMarkup, handleClick, handleSubmit };
}
