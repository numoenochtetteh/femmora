import { campaign, drops, campaignStatus, offerFor, priceFor, countdownParts, dropStatus, isReservable } from './campaigns.js';

export function createDiscovery({ $, main, icon, money, escape, asset, getProduct, products, sizes, productCard, favouriteButton, openDialog, announce, onPricingChange }) {
  const dialog = $('#discovery-dialog');
  const storageKey = 'femmora-reservation-previews-v1';
  let reservations = readReservations();
  let lastTimingState = timingState();
  const date = (value, options = {}) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Accra', day: 'numeric', month: 'short', ...options }).format(new Date(value));
  const releaseDate = (drop) => date(drop.releasesAt, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) + ' GMT';
  const previewNotice = '<p class="campaign-preview"><span class="preview-dot" aria-hidden="true"></span>Preview collection · Release dates and offers are examples.</p>';

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
    return '<div class="countdown-block"><p class="countdown-label">' + (state === 'ended' ? 'Offer ended' : state === 'scheduled' ? 'Offer starts in' : 'Offer ends in') + '</p>' +
      '<div class="countdown" role="timer" aria-live="off" aria-label="Offer ' + (state === 'scheduled' ? 'starts ' : 'ends ') + escape(date(deadline, { year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })) + ' GMT">' +
      Object.entries(parts).map(([unit, value]) => '<div class="countdown-unit"><span data-countdown="' + unit + '">' + String(value).padStart(2, '0') + '</span><small>' + unit + '</small></div>').join('') +
      '</div><p class="countdown-date">' + date(deadline, { year: 'numeric' }) + ' · ' + (state === 'scheduled' ? '00:00' : '23:59') + ' GMT</p></div>';
  }

  function offerFeature(page = false) {
    const active = campaignStatus() === 'active';
    const ended = campaignStatus() === 'ended';
    const first = getProduct(campaign.productIds[1]), second = getProduct(campaign.productIds[0]);
    return '<section id="home-offers" class="offer-feature ' + (page ? 'offer-feature-page' : '') + '" aria-labelledby="offer-heading">' +
      '<div class="offer-copy"><p class="overline">Selected styles sale / Preview</p><h' + (page ? '1' : '2') + ' id="offer-heading">' + (ended ? 'This offer<br>has ended.' : campaign.percentOff + '% off<br>selected styles.') + '</h' + (page ? '1' : '2') + '>' +
      '<p class="feature-description">' + (ended ? 'Browse the collection for dresses, tops and matching sets.' : active ? 'Save on selected dresses, tops and shorts before the offer ends.' : 'Preview the selected styles before this offer starts.') + '</p>' +
      countdown() +
      (page && !ended ? '<button class="btn btn-dark" data-action="offer-pieces">Shop sale ' + icon('arrow') + '</button>' : '<a class="btn btn-dark" href="' + (ended ? '#/shop' : '#/promotions') + '">' + (ended ? 'Shop all styles' : 'Shop sale') + icon('arrow') + '</a>') +
      '<p class="offer-fineprint">Demo offer. Prices and dates will be confirmed before launch.</p></div>' +
      '<div class="offer-art" aria-label="A preview of The Dot Halter Mini and The Wrap Shirt">' +
      '<div class="offer-visual offer-visual-first"><img src="' + asset(first) + '" alt="' + escape(first.name) + '" width="800" height="1000" loading="lazy" /><span>' + escape(first.name) + '</span></div>' +
      '<div class="offer-visual offer-visual-second"><img src="' + asset(second) + '" alt="' + escape(second.name) + '" width="800" height="1000" loading="lazy" /><span>' + escape(second.name) + '</span></div>' +
      '<div class="offer-stamp"><strong>' + (ended ? 'Offer' : campaign.percentOff + '%') + '</strong><span>' + (ended ? 'ended' : active ? 'off' : 'coming soon') + '</span></div></div></section>';
  }

  function dropCard(drop, index) {
    const product = getProduct(drop.productIds[0]);
    const upcoming = dropStatus(drop) === 'upcoming';
    return '<article class="drop-card" role="group" aria-roledescription="slide" aria-label="' + (index + 1) + ' of ' + drops.length + ': ' + escape(drop.name) + '"><div class="drop-art"><span class="drop-number">DROP ' + drop.number + '</span><img src="' + asset(product) + '" alt="' + escape(product.name) + ' from the ' + escape(drop.name) + ' preview collection" width="800" height="1000" loading="lazy" />' +
      '<span class="drop-image-tag">' + (upcoming ? 'Coming soon' : 'Release preview') + '</span></div>' +
      '<div class="drop-card-copy"><p class="drop-date">Release · ' + releaseDate(drop) + '</p><h3>' + escape(drop.name) + '</h3><p>' + escape(drop.tagline) + '</p>' +
      '<div class="drop-card-actions"><a class="text-link" href="#/reserve?drop=' + drop.id + '">View collection' + icon('arrowup') + '</a><button class="drop-notify" data-action="notify" data-drop="' + drop.id + '" aria-label="Preview notifications for ' + escape(drop.name) + '">' + icon('bell') + '<span>Notify me</span></button></div></div></article>';
  }

  function categorySection() {
    const categories = [
      { name: 'Tops', productId: 'gingham-halter', caption: 'The outfit starts here.' },
      { name: 'Sets', productId: 'gingham-coord', caption: 'A match made easy.' },
      { name: 'Bottoms', productId: 'washed-denim-shorts', caption: 'Build your everyday look.' },
      { name: 'Dresses', productId: 'polka-dot-dress', caption: 'One piece. All your plans.' },
    ];
    return '<section class="home-categories" aria-labelledby="category-heading"><div class="home-section-heading"><div><p class="overline">The FEMMORA collection</p><h2 id="category-heading">Shop by category.</h2></div><a class="text-link" href="#/shop">Shop all clothing ' + icon('arrowup') + '</a></div>' +
      '<nav class="category-rail" aria-label="Shop clothing categories">' + categories.map((category) => {
        const product = getProduct(category.productId);
        return '<a class="category-card" href="#/shop?category=' + category.name + '" aria-label="Shop ' + category.name.toLowerCase() + '"><span class="category-art"><img src="' + asset(product) + '" alt="' + escape(product.name) + '" width="800" height="1000" loading="lazy" decoding="async" /></span><span class="category-label"><span>' + category.name + '</span>' + icon('arrowup') + '</span><span class="category-caption">' + category.caption + '</span></a>';
      }).join('') + '</nav><p class="category-swipe-hint">Swipe to explore all four categories ' + icon('arrow') + '</p></section>';
  }

  function featuredSection() {
    const selected = ['blue-stripe-shirt', 'gingham-shorts', 'everyday-tank', 'gingham-coord'].map(getProduct);
    return '<section class="home-products" aria-labelledby="home-products-heading"><div class="home-section-heading"><div><p class="overline">Find your next favourite</p><h2 id="home-products-heading">The collection.</h2></div><a class="text-link" href="#/shop">View all ' + products.length + ' styles ' + icon('arrowup') + '</a></div><div class="product-grid home-product-grid">' + selected.map((product) => productCard(product)).join('') + '</div><p class="home-products-note">Choose a style to see the details and available size options.</p></section>';
  }

  function dropCarousel(id) {
    return '<div class="drop-carousel" role="region" aria-roledescription="carousel" aria-label="Upcoming FEMMORA collections"><div id="' + id + '" class="drop-track" tabindex="0" aria-label="Collection slides. Use the left and right arrow keys to browse.">' + drops.map(dropCard).join('') + '</div>' +
      '<div class="carousel-controls"><span class="carousel-count" aria-live="polite" aria-atomic="true">Collection <span data-carousel-current>1</span> of ' + drops.length + '</span><div class="carousel-dots">' + drops.map((drop, index) => '<button class="carousel-dot" data-action="drop-slide" data-index="' + index + '" aria-label="Show ' + escape(drop.name) + ', collection ' + (index + 1) + ' of ' + drops.length + '" aria-current="' + (index === 0 ? 'true' : 'false') + '" aria-controls="' + id + '"><span></span></button>').join('') + '</div><div class="carousel-arrows"><button class="carousel-arrow carousel-prev" data-action="drop-previous" aria-label="Previous collection" aria-controls="' + id + '" disabled>' + icon('arrow') + '</button><button class="carousel-arrow carousel-next" data-action="drop-next" aria-label="Next collection" aria-controls="' + id + '">' + icon('arrow') + '</button></div></div></div>';
  }

  function currentSlide(track) {
    const slides = [...track.children];
    const first = slides[0]?.offsetLeft || 0;
    return slides.reduce((nearest, slide, index) => Math.abs(slide.offsetLeft - first - track.scrollLeft) < Math.abs(slides[nearest].offsetLeft - first - track.scrollLeft) ? index : nearest, 0);
  }

  function updateCarousel(track) {
    const carousel = track.closest('.drop-carousel');
    const index = currentSlide(track);
    $('[data-carousel-current]', carousel).textContent = index + 1;
    $('.carousel-prev', carousel).disabled = index === 0;
    $('.carousel-next', carousel).disabled = index === track.children.length - 1;
    carousel.querySelectorAll('.carousel-dot').forEach((button, position) => button.setAttribute('aria-current', String(position === index)));
  }

  function goToSlide(carousel, index) {
    const track = $('.drop-track', carousel);
    const position = Math.max(0, Math.min(track.children.length - 1, index));
    track.scrollTo({ left: track.children[position].offsetLeft - track.children[0].offsetLeft, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function mountCarousels() {
    main.querySelectorAll('.drop-track').forEach((track) => {
      let pendingFrame = false;
      track.addEventListener('scroll', () => {
        if (pendingFrame) return;
        pendingFrame = true;
        requestAnimationFrame(() => { pendingFrame = false; if (track.isConnected) updateCarousel(track); });
      }, { passive: true });
      track.addEventListener('keydown', (event) => {
        if (event.target !== track || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const index = event.key === 'Home' ? 0 : event.key === 'End' ? track.children.length - 1 : currentSlide(track) + (event.key === 'ArrowRight' ? 1 : -1);
        goToSlide(track.closest('.drop-carousel'), index);
      });
      updateCarousel(track);
    });
  }

  function signupSection() {
    return '<section class="drop-signup" aria-labelledby="signup-heading"><div><p class="overline">New drop alerts</p><h2 id="signup-heading">Don’t miss<br>the next drop.</h2><p>Get updates on new styles, release dates and offers.</p></div>' +
      '<div class="signup-invite"><button class="btn btn-dark" data-action="notify">Get notified ' + icon('arrow') + '</button><p>Email signup preview. Subscriptions are not open yet.</p><a href="https://www.instagram.com/femmora_gh/" class="text-link" target="_blank" rel="noopener noreferrer">Follow FEMMORA on Instagram ↗</a></div></section>';
  }

  function homeSections() {
    return '<div class="home-discovery" id="home-discovery">' + categorySection() + featuredSection() +
      '<div class="home-offer-wrap">' + offerFeature() + '</div><section class="drops-section home-drops" aria-labelledby="home-drops-heading"><div class="home-section-heading"><div><p class="overline">The next collections</p><h2 id="home-drops-heading">Coming soon.</h2></div><a class="text-link" href="#/drops">View upcoming drops ' + icon('arrowup') + '</a></div>' + previewNotice +
      dropCarousel('home-drop-track') + '</section>' +
      '<section class="reserve-feature" aria-labelledby="reserve-feature-heading"><span class="reserve-feature-number" aria-hidden="true">01 / 02 / 03</span><p class="overline">Before the drop</p><h2 id="reserve-feature-heading">Reserve your favourites<br>before they drop.</h2><p>Browse upcoming styles and choose your size before the release.</p><a href="#/reserve" class="btn btn-dark">Browse upcoming styles ' + icon('arrow') + '</a><small>Preview reservations only. No stock is held or payment taken.</small></section>' +
      signupSection() + '</div>';
  }

  function renderPromotions() {
    const selected = campaign.productIds.map(getProduct);
    main.innerHTML = '<div class="discovery-page"><div class="discovery-breadcrumb"><a href="#/">Home</a><span>/</span><span>Sale</span></div>' +
      offerFeature(true) + '<section class="offer-pieces"><div class="discovery-heading"><div><p class="overline">Selected styles</p><h2>' + (campaignStatus() === 'ended' ? 'Browse these styles.' : 'Shop the sale.') + '</h2></div><span>' + selected.length + ' styles</span></div>' +
      '<div class="product-grid offers-grid">' + selected.map(productCard).join('') + '</div>' +
      '<p class="preview-note">Preview only. Offer details and prices will be confirmed before launch.</p></section>' +
      signupSection() + '</div>';
  }

  function renderDrops() {
    main.innerHTML = '<div class="discovery-page"><div class="discovery-breadcrumb"><a href="#/">Home</a><span>/</span><span>Coming soon</span></div><header class="discovery-page-heading"><p class="overline">Upcoming releases</p><h1>New styles.<br>Coming soon.</h1><p>See the next collections, check the release dates and choose your favourites.</p><div class="page-heading-actions"><a href="#/reserve" class="btn btn-dark">Browse upcoming styles ' + icon('arrow') + '</a><button class="text-link" data-action="notify">Get notified</button></div></header>' +
      previewNotice + '<section aria-labelledby="drop-list-heading"><h2 id="drop-list-heading" class="sr-only">Upcoming collections</h2>' + dropCarousel('all-drop-track') + '</section>' +
      '<section class="drop-explainer"><div><span>01</span><h2>Browse upcoming styles.</h2><p>See what is coming in each collection.</p></div><div><span>02</span><h2>Choose your size.</h2><p>Select a style, size and quantity to preview a reservation.</p></div><div><span>03</span><h2>Get release updates.</h2><p>Try the email signup preview. Subscriptions open at launch.</p></div></section>' + signupSection() + '</div>';
    mountCarousels();
  }

  function reservationCard(product, drop) {
    const available = isReservable(drop.id, product.id);
    return '<article class="reserve-card"><div class="reserve-card-art">' + favouriteButton(product) + '<img src="' + asset(product) + '" alt="' + escape(product.name) + '" width="800" height="1000" loading="lazy" /><span>' + escape(drop.name) + ' / Preview</span></div>' +
      '<div class="reserve-card-copy"><p class="drop-date">Release · ' + releaseDate(drop) + '</p><h2>' + escape(product.name) + '</h2><p>' + escape(product.description) + '</p><div class="reserve-card-bottom"><span>Preview price<br><strong>' + money(product.price) + '</strong></span><button class="btn" data-action="reserve" data-drop="' + drop.id + '" data-product="' + product.id + '" ' + (available ? '' : 'disabled') + '>' + (available ? 'Preview reservation' : 'Reservations closed') + (available ? icon('arrow') : '') + '</button></div></div></article>';
  }

  function savedReservations() {
    if (!reservations.length) return '<div class="saved-empty"><p>No saved selections yet.</p></div>';
    return '<ul class="saved-reservations">' + reservations.map((item) => {
      const product = getProduct(item.productId), drop = drops.find((entry) => entry.id === item.dropId);
      return '<li><img src="' + asset(product) + '" alt="" width="64" height="80" loading="lazy" /><div><h3>' + escape(product.name) + '</h3><p>' + escape(drop.name) + ' · ' + item.size + ' · Qty ' + item.quantity + '</p><small>Preview only · No stock reserved</small></div><button class="icon-button" data-action="reservation-remove" data-key="' + item.key + '" aria-label="Remove preview for ' + escape(product.name) + ', size ' + item.size + '">' + icon('trash') + '</button></li>';
    }).join('') + '</ul>';
  }

  function renderReserve(dropId) {
    const chosen = drops.find((entry) => entry.id === dropId);
    const selected = chosen ? [chosen] : drops;
    main.innerHTML = '<div class="discovery-page reserve-page"><div class="discovery-breadcrumb"><a href="#/">Home</a><span>/</span><a href="#/drops">Coming soon</a><span>/</span><span>Reservations</span></div>' +
      '<header class="discovery-page-heading"><p class="overline">Before the release</p><h1>Reserve your<br>favourite styles.</h1><p>' + (chosen ? escape(chosen.description) : 'Browse upcoming styles, choose your size and preview a reservation before launch.') + '</p><p class="reservation-preview-note">Reservation preview · No stock is held. No payment is taken.</p></header>' +
      '<nav class="drop-filters" aria-label="Browse a release"><a href="#/reserve" ' + (!chosen ? 'aria-current="page"' : '') + '>All upcoming styles</a>' + drops.map((drop) => '<a href="#/reserve?drop=' + drop.id + '" ' + (chosen?.id === drop.id ? 'aria-current="page"' : '') + '>' + escape(drop.name) + '</a>').join('') + '</nav>' +
      '<div class="reserve-grid">' + selected.flatMap((drop) => drop.productIds.map((id) => reservationCard(getProduct(id), drop))).join('') + '</div>' +
      '<section class="saved-section" aria-labelledby="saved-heading"><div class="discovery-heading"><div><p class="overline">Reservation preview</p><h2 id="saved-heading">Your saved selections.</h2></div><span>' + reservations.length + ' saved</span></div><p class="saved-note">Your selections are saved on this device. No reservation requests have been sent.</p><div id="saved-reservations-body">' + savedReservations() + '</div></section>' +
      signupSection() + '</div>';
  }

  const closeButton = '<button class="icon-button dialog-close" data-action="close-dialog" aria-label="Close">' + icon('close') + '</button>';

  function openSignup(dropId) {
    const drop = drops.find((entry) => entry.id === dropId);
    dialog.innerHTML = closeButton + '<div class="discovery-dialog-content"><p class="overline">New drop updates</p><h2 id="discovery-dialog-title">' + (drop ? 'Get updates on<br>' + escape(drop.name) + '.' : 'Get notified<br>about new drops.') + '</h2><p>Preview email alerts for new styles and release dates.</p><div class="form-preview-label">Preview form · You will not be subscribed or sent emails.</div>' +
      '<form data-discovery-form="signup"><label class="field-label" for="drop-email">Email address</label><input id="drop-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" maxlength="254" required /><label class="consent-label"><input type="checkbox" name="consent" required /><span>I would like to receive email updates about ' + (drop ? escape(drop.name) : 'FEMMORA releases') + ' when signups open.</span></label><button class="btn btn-dark btn-full" type="submit">Preview signup ' + icon('arrow') + '</button><p class="form-fineprint">This preview does not store your email address. Signups will open at launch.</p></form></div>';
    openDialog(dialog);
    $('#drop-email').focus();
  }

  function openReservation(dropId, productId) {
    if (!isReservable(dropId, productId)) { announce('Reservations for this release are closed. Browse the other upcoming collections.'); return; }
    const drop = drops.find((entry) => entry.id === dropId), product = getProduct(productId);
    dialog.innerHTML = closeButton + '<div class="discovery-dialog-content"><p class="overline">Before the drop / ' + escape(drop.name) + '</p><h2 id="discovery-dialog-title">Preview your reservation.</h2><div class="reservation-product"><img src="' + asset(product) + '" alt="' + escape(product.name) + '" width="96" height="120" /><div><h3>' + escape(product.name) + '</h3><p>' + escape(product.color) + '</p><p>Preview price · ' + money(product.price) + '</p><p>Release · ' + releaseDate(drop) + '</p></div></div><div class="form-preview-label">Preview only · No stock is held or payment taken.</div>' +
      '<form data-discovery-form="reservation" data-drop="' + drop.id + '" data-product="' + product.id + '"><div class="form-field-row"><div><label class="field-label" for="reserve-size">Choose your size</label><select name="size" id="reserve-size" required><option value="">Select a size</option>' + sizes.map((size) => '<option value="' + size + '">' + size + '</option>').join('') + '</select></div><div><label class="field-label" for="reserve-quantity">Quantity</label><input id="reserve-quantity" type="number" name="quantity" min="1" max="10" step="1" inputmode="numeric" value="1" required /></div></div><label class="field-label" for="reserve-name">Your name</label><input id="reserve-name" name="name" autocomplete="name" placeholder="Your name" maxlength="100" required /><label class="field-label" for="reserve-email">Email address</label><input id="reserve-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" maxlength="254" required /><label class="consent-label"><input type="checkbox" name="consent" required /><span>I understand this is a preview. It does not submit a reservation or guarantee availability.</span></label><p class="form-error" role="alert"></p><button class="btn btn-dark btn-full" type="submit">Save selection ' + icon('arrow') + '</button><p class="form-fineprint">Only your selected piece, size and quantity are saved on this device. Your name and email are not stored or sent.</p></form></div>';
    openDialog(dialog);
    $('#reserve-size').focus();
  }

  function showConfirmation(reservation = null, persisted = true) {
    const product = reservation ? getProduct(reservation.productId) : null;
    dialog.innerHTML = closeButton + '<div class="discovery-dialog-content form-confirmation"><div class="confirmation-mark">' + icon('check') + '</div><p class="overline">Preview complete</p><h2 id="discovery-dialog-title">' + (reservation ? 'Selection<br>saved.' : 'Signup preview<br>complete.') + '</h2><p>' + (reservation ? escape(product.name) + ' · Size ' + reservation.size + ' · Qty ' + reservation.quantity : 'This form shows how customers will sign up for release updates.') + '</p><div class="form-preview-label">' + (reservation ? 'No reservation was submitted. No stock is held and no payment was taken.' : 'You have not been subscribed. No emails have been sent or saved.') + '</div>' +
      '<p class="form-fineprint">' + (reservation ? persisted ? 'Your selection is saved on this device.' : 'Your selection is saved for this visit only.' : 'Follow @femmora_gh for updates until email signups open.') + '</p>' +
      (reservation ? '<a href="#/reserve?drop=' + reservation.dropId + '" class="btn btn-dark btn-full" data-action="view-previews">View saved selections ' + icon('arrow') + '</a>' : '<a href="https://www.instagram.com/femmora_gh/" target="_blank" rel="noopener noreferrer" class="btn btn-dark btn-full">Follow FEMMORA ↗</a>') + '<button class="continue-button" data-action="close-dialog">Continue browsing</button></div>';
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
    else { $('.form-error', form).textContent = 'Your saved list is full. Remove a selection before adding another.'; return; }
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
    else if (action === 'drop-previous' || action === 'drop-next' || action === 'drop-slide') {
      const carousel = target.closest('.drop-carousel');
      const track = $('.drop-track', carousel);
      const index = action === 'drop-slide' ? Number(target.dataset.index) : currentSlide(track) + (action === 'drop-next' ? 1 : -1);
      goToSlide(carousel, index);
    }
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
      announce('Selection removed.');
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
  window.addEventListener('resize', () => main.querySelectorAll('.drop-track').forEach(updateCarousel));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey) return;
    reservations = readReservations();
    if ($('#saved-reservations-body')) {
      $('#saved-reservations-body').innerHTML = savedReservations();
      $('.saved-section .discovery-heading > span').textContent = reservations.length + ' saved';
    }
  });
  return { homeSections, renderPromotions, renderDrops, renderReserve, priceMarkup, handleClick, handleSubmit, mountCarousels };
}
