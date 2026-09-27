# Player Pay Calculator

A small web-based player payroll manager built with plain HTML, CSS, and JavaScript.

## Features

- Create factions
- Add players to factions
- Create jobs/items with custom unit prices
- Record completed work with quantity
- Automatically calculate each player's total
- Show grand total for all players
- Filter players by faction
- Search players
- Delete players, factions, items, and payment records
- Data persists in the browser using `localStorage`

## Run locally

Open `index.html` in a browser.

For a local development server, you can also use any static server, for example:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## GitHub Pages

This project is static, so it can be deployed directly through GitHub Pages.

The first version stores data in `localStorage`, which means data is local to the browser/device.

For shared multi-user data, authentication, or a central database, a backend/database such as Supabase should be added later.

## Project structure

```text
player-pay-calculator/
├── index.html
├── style.css
├── app.js
└── README.md
```
