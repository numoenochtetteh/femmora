# FEMMORA website — version 5

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

The original video entrance remains the first screen. Scroll below it to see the new offer feature, upcoming-release cards, Reservations introduction and email-signup preview.

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
