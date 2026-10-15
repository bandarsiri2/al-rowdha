# AL-ROWDHA — Carpet & Handcrafted Goods

A bilingual (English / العربية) e-commerce storefront for handcrafted Turkish goods: prayer rugs, sharashef bedding, mabkharas, oud perfume and robes. Pure static site — no framework, no build step.

**Live:** https://temporary-instant-glacier-efeep5t.vercel.app (Vercel)

## Features

- 🌐 Full EN / AR translation with RTL layout (language toggle in the header)
- 🛍️ Shop page: category grid, filters (color / material / size), sorting
- 📱 **Buy via WhatsApp** — the checkout form composes an order message and opens WhatsApp on the shop's number
- 🖼️ Product detail pages (static pages + dynamic `product.html?id=…`)
- 🔐 Admin panel (`admin.html`) — email + password login, or a magic grant link

## Admin Panel

Open `admin.html` and log in with the credentials configured in `assets/js/catalog.js` (`ADMIN_EMAIL`, `ADMIN_PASS`).

| Tab | What it does |
|---|---|
| **Products** | Add / edit / delete products — names (EN + AR), price, category, stock, photo |
| **Orders** | View WhatsApp orders, change status (new → confirmed → shipped → done), set the shop's WhatsApp number |
| **Photos** | Upload photos and assign them to image slots across the site |
| **Site Content** | Edit key texts (announcement bar, hero titles, footer…) in EN + AR |

## Where is the data? (No database)

This is a fully static site — **there is no server-side database**. All data lives in the visitor's browser:

| Storage | Key | What it holds |
|---|---|---|
| `localStorage` | `ar-admin-v1` | Admin changes: products, deleted items, photo uploads, content edits, WhatsApp number |
| `localStorage` | `ar-orders-v1` | Orders placed from that browser (also sent via WhatsApp) |
| `localStorage` | `ar-cart` | Shopping bag |
| `localStorage` | `arlang` | Language choice (`en` / `ar`) |
| `sessionStorage` | `ar-admin-auth` | Admin login session (cleared when the tab closes) |

Consequences of this design:

- Admin edits apply **only in the browser where they were made** — other visitors keep seeing the defaults baked into `assets/js/catalog.js`.
- Orders reach the shop via **WhatsApp**, not a database.

## Project structure

```
al-rowdha/
├── index.html              # Home page (hero, categories, bestsellers)
├── prayer-rugs.html        # Shop page (filters + sorting)
├── product-*.html          # Static product detail pages
├── product.html            # Dynamic product page (?id=…)
├── craftsmanship.html      # About / craftsmanship story
├── admin.html              # Admin panel (login + dashboard)
├── admin.css               # Admin-only styles
└── assets/
    ├── css/styles.css      # Site-wide stylesheet
    ├── js/i18n.js          # EN/AR translations (window.I18N)
    ├── js/catalog.js       # Product catalog + admin store (window.AR)
    ├── js/app.js           # Storefront logic (cart, checkout, WhatsApp)
    ├── js/admin.js         # Admin panel logic
    └── img/                # SVG illustrations + photos/photos-1..9.jpg
```

## Run locally

Any static file server works — no build step:

```bash
cd al-rowdha
python3 -m http.server 8080
# → open http://localhost:8080
```

## Notes

- Fonts (Cormorant Garamond, Jost, Cairo, Amiri) load from Google Fonts.
- The admin "Reset All Changes" button clears `ar-admin-v1` from the browser and restores defaults.
- E2E coverage for this site (Playwright) lives in a separate `e2e/` folder outside this repo.