// Add a dated entry when a patch ships. These describe the actual changes since
// the preceding production commit, rather than fictional in-game release notes.
const patchNotes = [
  {
    version: "1.1.5",
    date: "November 10, 2026",
    previousCommit: "6f5f2ae",
    changes: [
      "Fixed island flickering by keeping the scenery and sprites in use loaded, including when you return from a house.",
      "Added frames between existing poses for walking, running, rides, and character abilities across all 15 appearances.",
      "Haymitch and Lenore Dove now use separate swimming poses. Birds leave wakes, dogs pause to sniff, and insects move differently by species.",
      "Fish and bugs have smoother animations in the field guide and their habitats.",
      "The Anything Plays project card now shows its Ocarina of Time screenshot.",
    ],
  },
  {
    version: "1.1.4",
    date: "November 9, 2026",
    previousCommit: "ed2a88c",
    changes: [
      "Updated the Anything Plays card to reflect the public 3.0 release.",
      "The card now describes its 18 console profiles and 11 bundled emulator cores.",
      "Added a direct link to the Windows, macOS, and Linux desktop installers.",
      "The updated description and download link appear on the main site, in Mac Mode, and in Game Mode.",
    ],
  },
  {
    version: "1.1.3",
    date: "November 9, 2026",
    previousCommit: "21c1b1f",
    changes: [
      "Everyday Fallyn can do two back handsprings into a full twist with Q or the on-screen Tumble button. All 24 poses use her everyday body scale and colors. Ladybug Fallyn keeps her yo-yo.",
      "Masyn’s Airbender, Pokémon Trainer, and Hyrulian Adventurer outfits use his Everyday Hoodie face as their reference, including during rides and outfit abilities.",
      "Residents now skateboard, surf, wakeboard, and dance with Totoro. Interact at the usual activity spot to take over, then the resident resumes their route.",
      "Characters settle their last step into idle, and fishing poses and lines move together when a fish bites.",
      "Cleaned stray pixels from bird, insect, and aquatic frames, fixed backward pond sprites, and retained fine details on 88 small map sprites.",
    ],
  },
  {
    version: "1.1.2",
    date: "November 9, 2026",
    previousCommit: "b1e5bcc",
    changes: [
      "Your character now circles the cedar with Totoro and friends, crouching and reaching in time with the group.",
      "The dance uses your current outfit and shows a dedicated prompt while the group performs.",
      "When the dance ends, your character returns to the exact spot and direction where they started.",
      "No-Face peeks out from behind the tree to the right of Windfall Lodge.",
    ],
  },
  {
    version: "1.1.1",
    date: "November 9, 2026",
    previousCommit: "aa63a2c",
    changes: [
      "Element Runner now follows a winding Air Temple bridge. The camera follows lane changes, and coin trails mark an open lane through mixed obstacle rows.",
      "Waterbending coins arc visibly above the runner and award points when they reach the rider. Fire clears obstacles in a burst of embers and leaves the coins in place. All four powers have distinct animated effects.",
      "Element Runner keeps its animation state when paused and accepts a slide pressed just before landing.",
      "Axolotl Drift uses the original painted morays again, with a blended neck, full-size scale patterns, and matching animated openings above and below.",
    ],
  },
  {
    version: "1.1.0",
    date: "November 9, 2026",
    previousCommit: "c1d7133",
    changes: [
      "Coding now opens first in Portfolio. Added AFTERTONE and Keystoria, expanded the Anything Plays card with its 3.0 development status, and added skills from all three projects.",
      "The Mac menu offers twelve wallpapers and twelve bezel colors, with choices saved on this device.",
      "Added Ponyo as a super-rare ocean catch and a repeatable dance near the northwest trees. Totoro and friends circle the trunk, crouch, and reach together as the tree grows in three beats.",
      "Terrariums offer five selectable habitats for each species. Repacked misaligned aquatic frames and removed stray pixels from affected fish and insect artwork.",
      "The harbor boat now has a King of Red Lions–inspired red hull, lion figurehead, and spiral sail in all eight sailing directions.",
      "World interaction buttons stay compact, and each house has collision boundaries that follow its visible floor.",
      "Element Runner now responds when a swipe crosses its threshold, uses a low slide pose with matching obstacle clearance, and draws the road with fewer canvas operations. Axolotl Drift has a taller play area and mirrored, seamless eel gates.",
    ],
  },
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
