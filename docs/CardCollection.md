# Island card collection

The vending machine dispenses free sealed packs. Packs live in Inventory → Card Collection; dragging across the seal consumes one pack and saves its five cards before the reveal begins. Closing midway does not lose the cards or award them again.

There are 200 collectible printings in six curated island checklists. These are selections from 151, Evolving Skies, Obsidian Flames, Silver Tempest, Paldean Fates, and Prismatic Evolutions, rather than every card in those retail sets.

`src/world/TradingCards.json` records the printing IDs, collector numbers, real rarities, card-image addresses, and source set IDs. Metadata and complete card scans come from [TCGdex](https://tcgdex.dev/); Pokémon artwork belongs to its respective creators. The wrappers are original island layouts using set logos and [PokéAPI character artwork](https://github.com/PokeAPI/sprites). No catalog request is needed while opening a pack.

Each island pack contains four regular printings and a rare/chase slot. Possible chase families include EX, V, VMAX, VSTAR, illustration rare, special illustration rare (SIR), secret rare, and shiny printings. Availability varies by set. These are custom island odds, not retail pack probabilities. Five different species appear in every pack, including when several printings of one Pokémon are in the pool.

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

The shop presents one pack at a time. Swipe horizontally, use the arrows, or select a collection dot. The binder loads 24 checklist entries at a time, supports name search and combined ownership/set/rarity filters, and opens individual cards in a separate inspection screen. Swipe or use the previous/next buttons to browse; Escape returns to the binder before closing the panel. Returning restores the selected slot and scroll position.

Pack opening still uses the original atomic save transaction. Leaving a reveal returns to a resumable pack; browsing the binder or shop cannot consume it twice. A horizontal swipe turns/replaces a revealed card, while vertical gestures remain scrolling and taps remain taps.

- `CardApp.js` shares the persistent navigation and horizontal gesture handling.
- `CardApp.css` scopes the app layout to card dialogs, without changing other room panels.
