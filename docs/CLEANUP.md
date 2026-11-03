# Sprite-game directory cleanup

Removed about 448 MiB of unused 3D models, model views, vendor runtime files, cached town renders, obsolete 3D source/build scripts, earlier sprite repairs, and the old world project. Three.js was removed from the package dependencies. The old 3D tests and documentation were removed with their unused implementations.

Six animal source sheets still support the current 2D game. Those originals, plus ten original family/costume sheets retained as useful references, now live in `docs/source-assets/legacy/`. `PrepareLegacyAnimals.py` uses that new location. Runtime animal copies remain under `public/world/sprites/`, so no page depends on the deleted project folder.

Current published artwork is retained only when referenced by the effective sprite/place/terrain manifests or the pond icon. Full-resolution source art stays in `docs/source-assets/`; it is not served with the website. Build output is regenerated from the cleaned public directory.

The current pass also removes superseded loose playground toys, draft ability/spider sources, unused sample images and Windows thumbnail caches. The original portfolio and earlier design routes remain functional. Retired renderer hooks and unused geometry were removed; collision-aware path smoothing is shared by NPCs and bicycles.

The source import graph and public artwork manifests were checked before removal. Active source art, prompt records, photos and resume content are retained. Generated build output is ignored and can be recreated. Nothing was committed or pushed.

The final character pass consolidates four retired human importers into `PreparePeople.py` and its explicit `People.json` catalog. Superseded simplified walk/run drafts were removed. Original identity sources and directly used pose references remain. Parked bicycle artwork has its own small importer; rider art shares the character publisher.

## Complete-body character replacement

Removed about 170 MiB of superseded stride/run/skating/motion and component-animation experiments, plus their obsolete registration scripts. The selected deck moved to `source-assets/boards/Skateboard.png`; current axolotls moved to `source-assets/people/Mounts.png`. Preferred reference drawings were preserved under `people/references/`. The final component references and pending-work manifest were removed after the replacement activity sheets were completed. New movement and available activities share the appearance catalog and fixed-origin full-body exporters.

The renderer now leaves native atlas ownership with the bounded art cache instead of keeping permanent duplicate references. Loading markers clear after completion so an evicted costume can be decoded again. Converted legacy previews retain only 24 cached entries.

## Coastal release

The original site is built separately from its last original commit into `public/React-Portfolio/`, with original logos and screenshots. New artwork cannot leak into that demo through shared components. Its source remains in the original repository.

Removed the unused sample mail server. The contact form subsequently moved from the inaccessible EmailJS account to FormSubmit; the unused EmailJS SDK was removed. Removed the obsolete root GitHub Pages CNAME file because the redesigned site is hosted through Cloudflare. Local credentials and editor state are ignored. Build output remains reproducible and excluded from the new source repository.

Dedicated board-balancing drawings replace the earlier skating walk cycle for all family appearances and costumes. The artwork import scripts preserve editable sources and publish only the packed atlases required at runtime. The retired sandcastle mini-game panel was removed; the construction now belongs to the shared world's animation clock.
