# FEMMORA website — version 11

A complete editable clothing storefront with the supplied FEMMORA video and 13 product photos. It uses plain HTML, CSS and JavaScript, with no third-party runtime dependencies.

## Open in VS Code

1. Extract this ZIP.
2. Open the **femmora-website** folder in VS Code. Open the folder containing `package.json`.
3. Install Node.js if it is not already installed; Node 18 or later is supported.
4. In the VS Code terminal, run:

```powershell
npm install
npm run dev
```

5. Open **http://localhost:5173** in your browser. Keep the terminal running while working. Refresh the browser after saving changes.

Do not double-click `index.html`: the JavaScript modules and local assets need the development server.

## What changed in this version

- Added a floral-emblem browser tab favicon in ICO and PNG formats, plus an Apple touch icon.
- Added the exact supplied full FEMMORA logo as the shared-link image.
- Added static Open Graph and social-card metadata, available before JavaScript runs.
- Builds automatically insert the correct Vercel production domain into preview image links and the canonical URL.

- Reduced the home logo by about 30% on desktop and mobile. Header and footer logo sizes are retained.
- The video changes automatically across the 640px breakpoint and preserves a paused state when resizing.
- Each screen initially loads only its matching video and poster.

- Added the supplied FEMMORA logo throughout the store.
- Uses the new landscape video on tablets and laptops (641px and wider), filling the background. Phones keep the existing FEMMORA portrait video.
- Added the Instagram contact link and the verified Accra location.

- Kept **WhatsApp Video 2026-10-24 at 12.12.51 AM.mp4** for phones. Added **7760169-uhd_4096_2160_25fps.mp4** for larger screens, optimized to 1920 × 1012, 25fps, 1.52 MB (92% smaller than the source).
- Used **DM Sans**, a clean sans-serif font. The font files and their licence are included, so the website does not need Google Fonts requests.
- Set product image areas to the supplied light grey: **#EBECE9**. Every active product photo has its background removed and uses an actual transparent cutout.
- Increased navigation, product names, prices, buttons, body text and supporting text on desktop and mobile.
- Retained search, filters, sorting, product pages, image enlargement, size selection, quantities, a saved shopping bag and the FAQ. Events is excluded.

## Edit the website

| File | Purpose |
| --- | --- |
| `index.html` | Main page, metadata and font preloads |
| `styles.css` | Layout, colours, typography and responsive sizes |
| `catalog.js` | Product names, prices, descriptions, categories and image filenames |
| `app.js` | Page rendering, search, filters and shopping bag |
| `assets/` | Original photos, video, video poster, logo and local fonts |
| `assets/products/` | Active transparent product cutouts |
| `vercel.json` | Vercel build and output settings |

## Save to GitHub

Create an empty GitHub repository, then run these commands from the project folder. Replace `YOUR_REPOSITORY_URL` with the repository URL GitHub gives you.

```powershell
git init
git add .
git commit -m "Initial FEMMORA storefront"
git branch -M main
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

## Host on Vercel

Import your GitHub repository into Vercel. Select the folder containing `package.json` as the root directory. The included configuration supplies:

| Setting | Value |
| --- | --- |
| Framework preset | Other |
| Build command | `npm run build` |
| Output directory | `dist` |
| Install command | `npm install` |

No environment variables are needed for this frontend preview.

You can verify the production build locally:

```powershell
npm run build
npm run preview
```

This export runs independently of the private ChatGPT preview. The exported website has no ChatGPT sign-in requirement.

## Before accepting orders

Names, prices, sample sizes and product availability are provisional. Confirm the final catalogue, sizing information, shipping charges and returns policy before launch.

Online payments and order processing are not connected. Checkout is clearly labelled as a preview and does not take a payment. The bag is saved only in the visitor's browser. Connecting a real checkout and order service is the next commerce step.

## Fonts

DM Sans is bundled under the SIL Open Font License. See `assets/fonts/DM-Sans-OFL.txt`.

## Logo in browser tabs and shared links

The tab uses the floral monogram; shared links use the original full logo on its cream background. The icon assets are versioned to avoid stale browser-icon caches.

Vercel runs `npm run build`, which fills the initial HTML metadata with your production domain using `VERCEL_PROJECT_PRODUCTION_URL`, falling back to `VERCEL_URL`. Keep access to System Environment Variables enabled in Vercel project settings.

For a preferred custom domain, you can optionally set `SITE_URL` to the complete public HTTPS origin and redeploy. This overrides automatic domain selection. For a local build with no deployment variables, metadata uses `http://localhost:5173`.

The public production site and logo image need to be accessible to messaging-app crawlers. Some apps cache older link previews; after a change, their preview may need to refresh.

## Version 6: offers, upcoming drops and first picks

The video hero remains the first screen, now with a visible headline, product description and shopping buttons. Scroll below it to see the offer feature, upcoming-release cards, Reservations introduction and email-signup preview.

New routes:

- #/promotions — Selected Styles Sale, a fixed countdown and a four-piece offer edit.
- #/drops — upcoming sample collections, release times, notification buttons and a link to Reservations.
- #/reserve — browse all upcoming pieces, filter by collection, choose size and quantity, save and remove reservation previews.
- #/faq?section=releases and #/faq?section=reservations — explanations of the preview flows.

### Edit the example campaign and releases

Open campaigns.js. This is the single source for the example discount, selected product IDs, campaign dates and upcoming collections.

The included offer is **20% off four preview products**, with a fixed example end time of **15 November 2026 at 23:59:59 GMT**. The three example releases are **6, 13 and 20 November 2026 at 18:00 GMT**. These dates, product choices and offers are examples, not confirmed FEMMORA promotions. Replace them with approved details before real offers open.

Use full ISO timestamps such as 2026-11-15T23:59:59Z; Z is UTC/GMT, matching Ghana time. The countdown uses one fixed deadline and does not restart for returning visitors. Preview discounts begin at the configured start and stop at the configured end. Product cards, sorting, product pages, bag confirmations, totals and checkout previews all use the same price calculation.

Use product IDs from catalog.js in campaign.productIds and each release's productIds. The page headings and sales copy are in discovery.js. Layouts are in discovery.css; the existing store styling remains in styles.css.

Run npm test after changing campaign details, and npm run build before deployment.

### What the forms do

The new features are frontend previews. Email forms validate the address and consent checkbox, then show an explicit preview confirmation. They do **not** subscribe anyone, store email addresses or send messages.

Reservation previews validate the product, release, size, quantity and acknowledgement. They save only the selected product, collection, size and quantity in browser storage. Names and email addresses are not stored or transmitted. Repeating the same piece and size updates that preview rather than creating a duplicate. Customers can remove previews from the Reservations page. The form closes to new previews once its example release time is reached.

A saved preview does **not** hold stock, submit a request, guarantee a piece, take a deposit or create an order. To accept real customers later, connect durable reservation storage and an email provider, then replace the preview confirmations with the real service response and the brand's confirmed reservation terms.

No new dependencies, environment variables or service credentials are required for this version. Existing Vercel automatic social-image URL handling is retained.

### Updating your existing project

Copy the files from this folder into your existing FEMMORA project. Preserve your existing Git history, Vercel project link and local environment files. The new campaigns.js, discovery.js and discovery.css files must be included when you push. Vercel still uses the Other preset, npm run build, and the dist output directory.

## Version 7: clearer storefront copy

The sale now states the discount and eligible styles directly. Upcoming collections, release alerts and reservations use short headings and clear action labels. Product descriptions list garment features and simple styling suggestions.

Reference storefronts reviewed: Zara, Mango, H&M, Oh Polly, MESHKI and Christie Brown. The FEMMORA wording is original; no brand claims or policies were copied.

The examples still use the same editable promotion dates and product selections. Signup and reservation forms remain clearly labelled previews. No price, stock, payment, email or reservation service configuration changed in this copy update.

## Version 8: a homepage that leads into shopping

The first screen now introduces what FEMMORA sells and gives visitors a clear next step:

- Headline: **Outfits worth making plans for.**
- Supporting copy: **Dresses, matching sets and easy everyday pieces. Find your next look with FEMMORA.**
- Primary action: **Shop the collection**.
- Secondary action: **Shop sale**.
- Local context: **Based in Accra · Prices in GHS**.

The supplied logo is smaller in the top navigation. The separate phone and landscape films remain in place, with a stronger contrast overlay for readable text. Home navigation is visible on desktop; phones and tablets use a menu button. Search, the bag, video pause and reduced-motion preferences are retained.

Edit this hero in `renderHome()` in `app.js`; its layout is in `styles.css`. This update does not turn preview forms or checkout into live services.

`OUTREACH.md` contains the MadeBySebi lead-selection criteria, three preliminary leads to qualify and the email-profile checklist. It is an internal handoff document and is excluded from the website build.

To update the existing GitHub project, replace its website files with this folder's files, then run:

```powershell
npm run build
git add .
git commit -m "Improve FEMMORA homepage hero"
git push
```

Keep your existing Git history, repository remote, local environment files and Vercel project link. Your connected Vercel project will deploy after the push. This ZIP does not push or deploy your public Vercel project on its own.

## Version 9: a homepage built around browsing clothing

- The desktop navigation is centred independently of the logo and utility icons.
- On phones and tablets, the logo sits left and search, bag and menu sit right.
- The hero explicitly introduces FEMMORA as a women's clothing brand. Phones use a smaller Shop the collection button and hide the sale link and location/currency line.
- Immediately after the hero, four category cards show one representative style each: Tops, Sets, Bottoms and Dresses. The background is the existing #EBECE9. These are a row of four on desktop and swipe horizontally on phones.
- Category cards open shareable filtered collection links such as #/shop?category=Dresses. Opening the general Shop route resets to All; category filters preserve the selected URL when sorting or opening product pages.
- A four-product section with prices follows the categories, ahead of the existing example promotion.
- Coming soon is now a horizontal carousel on both the home and release pages. Native scrolling supports touch, and arrows, indicator buttons and keyboard controls support browsing. The focused slide track accepts Left/Right, Home and End. It does not auto-advance. Reduced-motion preferences are respected.

The release images, names, dates, View collection actions and notification forms remain together on each slide. Reservations and notification forms remain previews, and checkout does not take payment.

The new layout is in `storefront.css`, loaded after the original styles. Category, product and carousel content lives in `discovery.js`. The header and hero are in `app.js`. The build script includes `storefront.css`; copy it with the other files when updating an existing project.

The design reference review focused on the category discovery and shopping paths on Oh Polly, MESHKI and Aritzia. FEMMORA uses its own supplied logo, videos and product photos. No unverified sales, reviews, best-seller rankings or shipping promises were added.

## Version 10: persistent brand header and mobile navigation fixes

- Hero headline: **Your next favourite outfit**.
- The original copper logo appears on a white header from the first screen.
- The header remains at the top when scrolling in either direction, on all routes and screen sizes.
- A shared header-height value reserves page space and offsets anchor scrolling so content is not hidden behind the header.
- The mobile menu closes after an outside tap, page scrolling, Escape, a route change, search, or a window resize. Selecting the already-open page also dismisses it.
- Navigation remains scrollable inside its panel when the screen is too short to show all links.
- Escape and outside dismissal return focus to the menu control without moving the page; search returns focus to its own control when closed.
- General route changes scroll immediately to the top. Explicit category/release scrolling and reduced-motion support remain in place.

The category cards, product prices, collection slider, video variants and smaller mobile shopping button from version 9 are retained. The only files changed for the website are `app.js` and `storefront.css`.

Copy the updated project files into your existing repository, build with `npm run build`, then commit and push to update the connected Vercel deployment. Keep your existing Git history and Vercel configuration.

### Version 10 review

Reviewed at 320×568, 390×844, 640×800, 768×1024, 960×720, 1024×768, 1280×800 and 844×390 viewport sizes. The page stays within the viewport width and the main shopping action remains visible on the first screen at these sizes.

Checked outside-tap dismissal, scrolling, Escape and focus return, search from an open menu, reopening the current page, navigation to Shop and FAQ, and resizing between mobile and desktop navigation. The landscape menu fits within the viewport. Desktop navigation remains centred.

Confirmed that a scrolled FAQ section remains below the fixed header, that the bag popup opens below the header, and that adding/removing a test item still works. The test bag was cleared. The production build and all four existing campaign/reservation tests passed.

## Version 11: Favourites and a transparent home header

- Tap a heart to save/remove a product from cards, search, related products, product pages or upcoming-product reservation previews.
- The header heart shows the saved-item count. Favourites is also linked from the mobile menu and footer.
- Open `#/favourites` to browse saved products, remove them or choose a size and quantity before adding to the bag. Adding to the bag keeps the product in Favourites.
- Favourites persist in this browser, update across open tabs and recover safely from invalid saved data. If browser storage is blocked, the list remains available for the current visit and the page explains the limitation. There is no account or cross-device sync.
- The home header is transparent over the video at the top, turns white after scrolling 24px, and returns to transparent at the top. The copper logo remains in its original colour. Other pages have a white header; opening the mobile menu also makes it white for readability.
- Mobile header spacing accommodates search, favourites, bag and menu, including narrow 320px screens. The existing outside-tap, scroll, Escape, navigation and resize menu dismissal is retained.

`favourites.js` owns saved-ID validation and storage. `app.js` contains the user interface and add-to-bag flow. `storefront.css` styles Favourites and the changing header. The build includes the new module. Run `npm test` and `npm run build` before deployment.

See `LIVE-STORE-STATUS.md` for what is working locally and what still needs a connected live commerce service.

### Version 11 review

All seven automated tests passed. The production build passed. Browser checks covered saving/removing from cards, search, upcoming-product previews and a product page; persistence after refresh; live updates across tabs; empty-state recovery; and size/quantity selection into the bag. Submitting without a size was blocked. Adding beyond the ten-per-size limit showed an error. A test quantity of two in size M produced the correct GH₵352 bag total and was cleared afterwards.

Checked 320, 390, 640, 768, 844, 960, 1024 and 1280px layouts for page overflow and header fit. Verified the home header is transparent at the top, white while scrolling, and returns to transparent at the top. Mobile outside-tap and scroll dismissal remain working. Test favourites and bag contents were cleared.
