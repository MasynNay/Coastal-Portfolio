## Run locally

```sh
npm ci
npm start
```

Open the address printed by the development server, then visit `/design/glass` for the main redesign.

| Route                                    | View                          |
| ---------------------------------------- | ----------------------------- |
| `/design/glass`                          | Main portfolio                |
| `/design/glass/resume`                   | Resume in the glass layout    |
| `/design/desktop`                        | Mac Mode                      |
| `/world`                                 | Game Mode                     |
| `/world/sprites`                         | Character and action workshop |
| `/game`                                  | Pocket Arcade                 |
| `/projects/mixstream`                    | MixStream demo                |
| `/projects/typeninja`                    | TypeNinja typing game         |
| `/projects/semisnitch`                   | SemiSnitch demo               |
| `/React-Portfolio/` archive, `/resume`                           | Original portfolio and resume |
| `/design/polished`, `/design/expressive` | Earlier design studies        |

The project demos adapt the original projects to this portfolio. They are not production backends: some use local sample data. See the notices inside each demo for its limits. TypeNinja's original MIT notice is in [docs/licenses/TypeNinja.txt](licenses/TypeNinja.txt).

## Phones, tablets and controls

The main website collapses its navigation and stacks content on smaller screens. Mac Mode keeps the iMac frame, uses contained app windows on touch screens, and lets the dock scroll horizontally. Selecting a cartridge opens its player and controls in a separate Mac window. The shared cartridge catalog includes eleven self-hosted GBA cartridges and seven island originals: Element Runner, Poké Ball Match, Windfall 2048, Orc Hunt, Wizard Memory, Axolotl Drift and Axolotl Race. Originals use distinct custom cartridge shells and isolated `/arcade/:game` players that reuse the island's components and race rules without loading the town. The hidden `/game` page uses the same catalog. All cartridge players provide keyboard/touch instructions; **Open game separately** is available for more space.

GBA cartridges, Element Runner and Axolotl Drift open maximized in Mac Mode, using a `?view=mac` layout that fits their courses to the iframe and puts controls beside the game on wide screens. Their extra controls panel starts collapsed, and a Fullscreen button can expand the player beyond the iMac frame. The green window control restores a smaller draggable window.

| Game action                            | Keyboard / mouse                                             | Phone / tablet                                                 |
| -------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| Walk                                   | WASD, arrow keys or click ground                             | Tap clear ground to walk to that spot                          |
| Run                                    | Hold Shift while moving, or double-click a destination       | Double-tap a destination                                       |
| Stop                                   | Release held movement keys; Space stops destination movement | Pinch to stop the current route; tap another spot to change it |
| Interact, surf, mount or return a ride | E                                                            | Labeled action button                                          |
| Costume ability or ride trick          | Q                                                            | Ability / Trick button; usable while moving                    |
| Fish                                   | Fish button                                                  | Fish button                                                    |
| Fly                                    | Choose a minimap destination                                 | Open Map in the toolbar, then tap a home or the pond           |
| Zoom                                   | + / − buttons or Shift + scroll                              | Pinch or + / − buttons                                         |
| Read a room                            | Opens on entry; reopen from its information button           | Same behavior                                                  |
| Close a panel                          | Escape or ×                                                  | ×                                                              |
| Axolotl Drift                          | Space / Up to rise                                           | Tap the course or Rise button                                  |

The welcome screen waits for **Let's explore** on every visit. Help in Game Mode explains the controls and activities. Modal panels keep keyboard focus inside, close with Escape and return focus to the control that opened them. Mac windows remain independent rather than trapping focus in one app. The main site provides a skip link, labeled navigation and form controls, and reduced-motion styling.

Game Mode is a visual experience; it is not a screen-reader equivalent of the portfolio. The regular website presents the same professional content in standard HTML.

## Where to edit things

| Location                      | Responsibility                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `src/data/resume.js`          | Professional information, experience and achievements                                                        |
| `src/data/projects.js`        | Shared project descriptions, screenshots and destinations                                                    |
| `src/data/games.js`           | One game catalog for Pocket Arcade and the Mac Games app                                                     |
| `src/designs/content.js`      | Shared skill groups and presentation content                                                                 |
| `src/designs/`                | Glass layouts, Mac windows, dock and system menu                                                             |
| `src/components/`             | Shared portfolio sections and the original page                                                              |
| `src/hooks/useDialogFocus.js` | Shared modal keyboard, focus restoration and scroll behavior                                                 |
| `src/world/RoomContent.js`    | Portfolio information shown inside the town's homes                                                          |
| `src/world/`                  | Town simulation, renderer, artwork manifests and React menus; see its [directory guide](../src/world/README.md) |
| `src/typing/`                 | TypeNinja's offline word rounds and device-local scores                                                      |
| `src/demos/`                  | Project demo screens                                                                                         |
| `public/slideshow/`           | Images used by the Photos app                                                                                |
| `public/world/`               | Published game artwork                                                                                       |
| `docs/source-assets/`         | Editable artwork and source records, outside the served website                                              |
| `scripts/`                    | Photo indexing, artwork importers and validation tools                                                       |

Branding: the main navigation uses the `masynnay` wordmark and the floating hero uses the original `mn` monogram. `src/components/BrandMark.js` uses the approved mint MN lotus in the other branded locations and footer. The transparent web exports and app icons live in `public/brand/`; the original image, transparent source and edit prompt are preserved in `docs/source-assets/brand/`. Run `python3 scripts/BrandAssets.py` after updating that source to rebuild the responsive images and icons. Framed variants preserve contrast on light pages and over the town.

Project artwork: `public/images/projects/` contains vector interface previews based on the local demos, rather than browser captures. Edit `scripts/ProjectPreviews.cjs` and run it with Node to rebuild these images.

Photos currently displays the public **Frames** album configured in `src/data/photos.js`. Add or remove photos in that shared album, then reopen Photos or select **Refresh album**. Updating the album does not require rebuilding the portfolio. The album's own controls provide its slideshow, photo navigation and mobile gestures; **Open album** also opens the full viewer in a separate tab. Keep the share available for public viewing.

For a local gallery instead, set `photoAlbum` to `null`, put images in `public/slideshow/`, then restart the development server or rebuild. The photo index is generated automatically. Publish those files to update the live site. The local slideshow pauses while its app is inactive or minimized.

Keep shared facts in the data files rather than copying them into each presentation. Keep rendering, simulation and menus separate. Comments should explain a component's purpose, important behavior and connections to other parts of the UI; avoid narrating obvious statements. CSS comments identify layout sections, responsive behavior and reasons for exceptions. Use simple file names and preserve existing saved IDs when changing labels or artwork.

## Check changes

```sh
CI=true npm test -- --watchAll=false --runInBand
npm run lint
npm run build
```

Tests cover movement and touch gestures, rides and tricks, collection counts and habitats, sprite directions, arcade behavior, dialog focus and the Mac apps. The lint command checks application code and tests. Building creates `build/`; it does not publish the site.

For artwork changes, also run:

```sh
python3 scripts/CleanSprites.py
python3 scripts/VerifySprites.py
python3 scripts/VerifyDirections.py
python3 scripts/VerifyWorldAssets.py
```

After importing artwork, run `python3 scripts/CleanSprites.py --write` before the read-only checks. See [sprite maintenance](SPRITE-CLEANUP.md), [town behavior](SPRITE-VILLAGE.md) and the [cleanup record](CLEANUP.md).

Automated checks verify behavior and build output, but do not replace visual playtesting on an actual phone or iPad. Before publishing, check portrait and landscape layouts, touch movement with simultaneous actions, modal scrolling, the dock, typing with an on-screen keyboard, and the GBA players on the target devices. EmulatorJS requires WebAssembly and working WebGL graphics; embedded browser panels may not supply them. See [the arcade guide](ARCADE.md).

## Preserved original portfolio

The generated `public/React-Portfolio/` demo is isolated from the new site's components and artwork. It comes from original commit `78f927db488071bb42ab2b05ff914381387e59a3` in `MasynNay/React-Portfolio`. Hosting changes are limited to the base path, archive-local home links, removal of the old custom-domain file, and a GitHub Pages fallback. The original screenshots and logos remain intact.

To rebuild it from a separate checkout of the original repository:

```sh
python3 scripts/ArchivePortfolio.py --original-repo /path/to/React-Portfolio
```

Normal site builds use the already preserved static demo and do not fetch the original repository. The new source repository excludes machine credentials, local editor state, dependencies and generated `build/` output.

Element Runner at the chimes supports A/D or Left/Right for lanes, W/Up/Space to jump, S/Down to slide, directional swipes and touch buttons. Windmill 2048 accepts mouse drags, finger swipes, arrow keys and buttons. The other island arcades use tappable targets/cards/balls. Surfboard steering uses the same keyboard and tap-to-route system as other manual rides, with a small trailing wave. Steer onto any beach to step ashore there; the board resets at its original rack.

The two lawn seats share `RestSpots.js`: a trainer stool by Portfolio and a rocking seahorse beside Contact. Current costumes remain equipped while seated; E, the touch action or movement stands up. Mailboxes use `TownLayout.js` for both drawing and collision, with room to read them beside each entrance.

## Consistent maintenance

Use `npm run format:check` to check authored JavaScript/CSS and `npm run format` to apply the pinned formatter. Use `python3 -m black --check scripts` for Python tools after installing `scripts/requirements.txt`. Vendor runtime, archived output and generated sprite manifests are excluded from source formatting.

`npm run check:project` checks the import graph, local asset references and documentation links without fetching URLs or changing files. It also reports application modules with no path from the entry point. Continue using `VerifyWorldAssets.py` for dynamic artwork manifests; static import checks cannot identify those references by themselves. The [shared data guide](../src/data/README.md), [source-media guide](../src/assets/README.md) and [tools guide](../scripts/README.md) explain their folder responsibilities.
