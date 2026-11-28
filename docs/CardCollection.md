# Island card collection

The vending machine dispenses free sealed packs, one or ten at a time. Packs live in Inventory → Card Collection; dragging across the seal consumes one pack, while Quick Open and Open 10 Packs reveal five or fifty cards together. Rewards are saved before the reveal begins. Closing midway never awards them twice.

The English physical TCG catalog contains 202 collections and 21,432 provider-indexed printings, including promotional sets. Digital-only Pokémon TCG Pocket sets are excluded. The six original collections retain their save identifiers. Some printings lack a provider scan and use a labeled placeholder until artwork is available.

`src/world/OfficialCards.json` contains compact provider metadata; the original `TradingCards.json` preserves legacy rarity and foil details. Refresh the snapshot by running `node scripts/ImportOfficialCards.cjs` with network access. Metadata and available card scans come from [TCGdex](https://tcgdex.dev/); Pokémon artwork belongs to its respective creators. The wrappers are original island layouts using set logos and [PokéAPI character artwork](https://github.com/PokeAPI/sprites). No catalog request is needed while opening a pack.

Each island pack prefers four regular printings and a rare/chase slot. Possible chase families include EX, V, VMAX, VSTAR, illustration rare, special illustration rare (SIR), secret rare, and shiny printings. Availability varies by set. These are custom island odds, not retail pack probabilities. Different species are preferred; tiny promotional checklists may require repeated cards to fill a pack of five.

The binder counts distinct printing IDs toward completion. Duplicate quantities and reverse-holo variants do not inflate that progress. The Full Checklist, My Cards, and Missing Cards controls can be combined with set and rarity filters. Original character-style cards remain in Earlier Keepsakes. Existing quantities, unopened packs, and unfinished reveals keep using the same device save.

- `CardCatalog.js` handles pack pools, draw rules, image lookup, and completion counts.
- `CardCollection.js` owns saved quantities and atomic pack opening.
- `TearPack.js` supplies shared foil wrappers and pointer/keyboard seal interaction.
- `CardAlbum.js` supplies the owned/missing checklist and card inspection.
- `CardPacks.js` composes the vending shelf, bag, reveal, and full-card presentation.
- `LegacyCards.js` keeps earlier saves readable without mixing those old prints into the new checklist.

New artwork is requested only when a card is visible or inspected. Images that fail to load show a readable name and printing description; the saved card is retained.

## Phone and tablet layout

The collection opens as a full-screen card app below 900px, with separate Shop, Packs, and Binder tabs. Desktop uses the same navigation inside the world window. Only the content scrolls; the navigation stays visible and respects device safe areas.

The shop presents one pack at a time. Swipe horizontally, use the arrows, or search and select a collection by name. The binder loads 24 checklist entries at a time, supports name search and combined ownership/set/rarity filters, and opens individual cards in a separate inspection screen. Swipe or use the previous/next buttons to browse; Escape returns to the binder before closing the panel. Returning restores the selected slot and scroll position.

Pack opening still uses the original atomic save transaction. Leaving a reveal returns to a resumable pack; browsing the binder or shop cannot consume it twice. A horizontal swipe turns/replaces a revealed card, while vertical gestures remain scrolling and taps remain taps.

- `CardApp.js` shares the persistent navigation and horizontal gesture handling.
- `CardApp.css` scopes the app layout to card dialogs, without changing other room panels.
