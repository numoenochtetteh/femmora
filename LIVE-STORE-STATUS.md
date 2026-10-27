# FEMMORA live-store status

## Working storefront features

Collection browsing, categories, search, sorting, product details, size/quantity selection, product image enlargement, a saved bag, favourites with browser persistence, favourites-to-bag size selection, example promotions/countdowns, upcoming-release carousel, reservation previews, email-signup previews and customer-care pages.

## Required before accepting real orders

The current project is not yet a complete live commerce backend. Checkout does not charge a customer or create an order. Stock, fulfilment, payment webhooks, transactional emails and customer accounts are not connected. Reservations do not hold stock and notification forms do not send emails. Favourites are saved on the current device; account-based sync is not implemented.

To complete a live store, connect FEMMORA's authorised commerce service and payment account, then integrate the real product/variant IDs, confirmed inventory, secure checkout, order/payment status, shipping rules and order-confirmation emails. Confirm the catalogue, prices, sizes, delivery areas/charges and returns terms with the business. Replace the example promotions and release dates with approved values.

No merchant account, payment credentials, inventory service or backend connection is present in this ZIP. No payment or completed-order flow is represented as live.

## Connection check during this revision

An attempted Vercel commerce-discovery command unexpectedly started a Vercel login. Automatic approval review blocked further interaction because signing in had not been specifically authorised for that exploratory command. The sign-in was not completed, and no commerce resource was provisioned. Favourites and header work were completed independently.
