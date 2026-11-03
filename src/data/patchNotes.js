// Add a dated entry when a patch ships. These describe the actual changes since
// the preceding production commit, rather than fictional in-game release notes.
const patchNotes = [
  {
    version: "1.0.9",
    date: "November 3, 2026",
    previousCommit: "31eed2e",
    changes: [
      "Windfall Lodge’s back-right treasure chests now open all eighteen cartridges, with the same game player, controls and ROM downloads as Mac Mode. Return to the shelf to choose another game.",
      "Mi Shell can reveal A Message For My Love by throwing dollar bills toward the About room’s back-right blue light. Use Q or the on-screen ability button, then interact with the light to read Masyn’s letter. The discovery is saved on this device.",
      "About this Mac now says About 150 lbs of FAT32 and Dad jokes rendered in 4K.",
      "Shared the cartridge shelf and player between Mac Mode and room games so controls and future library changes stay consistent.",
    ],
  },
  {
    version: "1.0.8",
    date: "November 3, 2026",
    previousCommit: "fb276d0",
    changes: [
      "Added Download ROM (.gba) to GBA game controls in Mac Mode, Pocket Arcade and the hidden room games. Downloads contain the original GBA file, not a ZIP archive.",
      "Downloads reuse the bundled ZIP decoder in a separate worker and verify the extracted file against its original checksum. Closing or changing a game cancels unfinished work.",
      "All emulator start buttons now say Play Game, with bounded button widths so long cartridge names cannot overflow the player.",
      "Game window controls wrap on narrow screens to keep the new download button accessible on phones and tablets.",
    ],
  },
  {
    version: "1.0.7",
    date: "November 3, 2026",
    previousCommit: "6868192",
    changes: [
      "Added Pokémon Ash Gray — Newerest Edition v1.0, Pokémon Null v1.2.6, Pokémon Elysium Part A v2.5.0 and Pokémon Radical Red v4.10 to the shared GBA library.",
      "Each new game has its own cartridge color, icon and version label in Mac Mode and Pocket Arcade, with independent save IDs.",
      "The library now includes eleven GBA cartridges alongside the seven original island mini-games. Existing cartridges and saves retain their IDs.",
    ],
  },
  {
    version: "1.0.6",
    date: "November 3, 2026",
    previousCommit: "39cdc8e",
    changes: [
      "Consolidated profile URLs, project/demo metadata and bug/fish rarity rules into shared modules, preserving existing catch rates and saved collection IDs.",
      "Unified the route tree, retained all current view aliases and made unmatched addresses return to the main website.",
      "Removed unreachable old skills/footer components, six unused source images, obsolete styles and four unused packages. Renamed numbered source media by subject.",
      "Separated the room cartridge map from the Friends trivia data and added folder guides and purpose comments for the remaining application modules.",
      "Formatted authored JavaScript, CSS and Python tools consistently, and added repeatable formatting, import, asset-path and documentation-link checks. Preserved vendor files and the frozen original portfolio.",
    ],
  },
  {
    version: "1.0.5",
    date: "November 2, 2026",
    previousCommit: "1587097",
    changes: [
      "Replaced the ad-supported retro players with a self-hosted Game Boy Advance emulator and all seven supplied cartridges: Heart & Soul, Hoenn’s Last Wish, Emerald Rogue, Amethyst, Sword and Shield Ultimate Plus, Unbound and Red Rescue Team Shiny Patch+.",
      "Mac Mode, Pocket Arcade and the five hidden room games now use the same ROM library. The seven original island mini-games remain available.",
      "Added keyboard, gamepad and on-screen touch controls, individual game saves, save-file import/export and fullscreen play. Game progress stays in this browser; export a save before clearing browser data or changing devices.",
      "Cartridges are served directly from the portfolio, with verified downloads during the build. No RetroGames player or advertising page is loaded.",
      "Added keyboard activation for Play and a clear message when a browser has no WebGL graphics available.",
    ],
  },
  {
    version: "1.0.4",
    date: "November 2, 2026",
    previousCommit: "b8ae9df",
    changes: [
      "Element Runner and Axolotl Drift now open maximized inside Mac Mode, with their courses using the available window space.",
      "Moved game information beside the courses in wide Mac windows and collapsed the extra controls panel by default. Show Controls and Restore remain available.",
      "Added a Fullscreen control for these two games when an even larger view is wanted.",
    ],
  },
  {
    version: "1.0.3",
    date: "November 2, 2026",
    previousCommit: "d6d5b23",
    changes: [
      "Connected Mac Mode's Photos app to the live Frames shared album, with photo browsing and slideshow controls.",
      "Added Refresh Album and Open Album controls. Photo changes can now come directly from the shared album without a portfolio rebuild.",
      "Kept the local slideshow folder available as an alternative and documented how to switch photo sources.",
      "Added all seven island mini-games to Mac Mode's Games app and the hidden Pocket Arcade, each with a custom cartridge and keyboard/touch instructions.",
      "The same game components and rules power the island and standalone cartridge players, including a compact version of the family axolotl race.",
    ],
  },
  {
    version: "1.0.2",
    date: "November 2, 2026",
    previousCommit: "eb2a0d2",
    changes: [
      "Restored Mother Goose Tumbling to the shared project list across the website, Mac Mode and Game Mode.",
      "Added a real screenshot, the preserved live application and source links, and a note that the current site has moved to a new administrator.",
    ],
  },
  {
    version: "1.0.1",
    date: "November 2, 2026",
    previousCommit: "d79d89b",
    changes: [
      "Terrariums and aquariums fit the screen in normal and close-up views. Only the creature picker scrolls sideways.",
      "Inventory and Open Field Guide share one toolbar, and creature details are centered beneath their habitats.",
      "Release One and Look Closer have matching sizes on opposite sides of each habitat. Pause is centered below the details.",
      "Releasing a creature now asks for confirmation. Discoveries stay in the field guide after release.",
      "Added phone, tablet and keyboard instructions for shaking trees, catching bugs and fishing, in the collection screens and Help.",
      "Fixed Contact Me email delivery with FormSubmit. Activation is complete, and a test from the live website was received successfully. Messages include the visitor's contact details and message; failed submissions keep their draft and offer a direct email link.",
      "The Windfall mailbox now holds these real patch notes instead of a duplicate Rickroll.",
    ],
  },
];
export default patchNotes;
