# Shared portfolio data

Layouts read these files instead of maintaining their own copies of facts.

| File | Owns |
| --- | --- |
| `resume.js` | Profile, contact details, experience, education and achievements |
| `links.js` | Public profile, repository and earlier-portfolio URLs |
| `projects.js` | Project titles, descriptions, screenshots, demos and source links |
| `games.js` | Shared ROM/island cartridge catalog and controls |
| `roms.json` | Approved archive metadata, integrity hashes and stable save IDs |
| `loveLetter.js` | Masyn’s hidden personal letter to Mi Shell |
| `friendsTrivia.json` | Questions and choices for the About room's trivia |
| `photos.js` | Public shared photo album selection |
| `patchNotes.js` | Actual dated release changes and comparison baselines |

Skills remain in `../designs/content.js`, which also combines achievements and web projects for the retained design studies. `../world/RoomGames.js` maps the unchanged secret IDs to cartridges; it does not duplicate game URLs. Do not change saved character, species or cartridge IDs to rename a display label.

Source images in `../assets/images/` use subject names. Public artwork uses manifest IDs because renderers, collisions and saved appearances rely on those IDs. Keep those distinctions when reorganizing assets.
