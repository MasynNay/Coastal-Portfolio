# Harbor artwork

`RedLion.png` is the current sailboat source. Run `python3 scripts/ImportHarbor.py --red-lion` to rebuild the in-game sheet and minimap icon. The source has five views in order from south through north. The importer reflects the three angled views to make the west-facing poses and packs all eight in game heading order.

Built-in image generation prompt brief for `RedLion.png`: use the supplied Wind Waker sailboat reference to draw an empty red wooden sailboat with an ivory and gold horned lion figurehead, open cockpit, and cream sail with a teal spiral. Match the island’s shaded overhead pixel art. Place south, southeast, east, northeast, and north views in separate cells of a transparent 3×2 sheet, with the sixth cell empty.

`Boat.png` is the original motorboat source. `JetSki.png` is the eight-direction jet ski source. Riders come from `people/` and `BuildActivities.py`. The renderer clips the seated driver behind the sailboat’s near rail.
