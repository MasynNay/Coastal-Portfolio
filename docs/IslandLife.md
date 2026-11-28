# Island life and collection progress

The new features extend the existing world; they do not create a second game state or change catch probabilities.

## Passport and favorites

`Passport.js` derives stamps from the world's existing visited-home IDs. Collection milestones use lifetime discoveries, so releasing the last resident does not remove a stamp. Cards count printing IDs rather than foil variants or duplicate quantities. The original `IslandJournal.js` still owns secrets, mailbox hints, and glass-float hunt controls.

`CollectionPreferences.js` validates saved favorites against the shipped species and card catalogs. Its shared change event updates mounted views without restarting the engine. Creature sorting uses copied arrays and never reorders the catalogs used for seeded rarity rolls.

## Display room

`DisplayRoomData.js` stores six references and a room theme. `DisplayRoom.js` resolves those references against owned collections when drawing the room. A released last resident leaves the shelf empty. The picker shows one collection at a time, with search and 24-item batches, to keep large inventories manageable on phones.

Coastal Study is available immediately. Visiting every home unlocks Moonlit Library; discovering ten bugs unlocks Fern Conservatory. Unlocks are derived, not separately awarded or purchased. Shelf movement uses buttons as well as normal item selection, making rearrangement accessible to touch and keyboard users.

## Save backups

`IslandSave.js` maintains an explicit allowlist of island keys. It never exports unrelated local storage, account information, ROM files, or emulator saves. JSON imports have a 2 MB limit, a format/version header, catalog validation, and a preview before replacement. Unknown keys are rejected. If a write fails, the restore attempts to roll touched keys back before reporting the error.

`SaveBackup.js` offers a current-save download before applying an import. A successful restore reloads the world so engine collections, card state, preferences, and UI progress all read the restored values together. This is manual backup and transfer, not background sync. Keep a downloaded backup before clearing browser data.

## Sound and motion

`IslandAudio.js` owns one opt-in Web Audio context, a low-volume ocean loop, and short disposable sound voices. It creates no context while disabled, suspends in hidden tabs, and removes listeners/closes the context when leaving the world. Actual land movement supplies footstep distance; menu pauses and surfing do not generate walking sounds. The Help panel owns the switch and volume slider.

The engine preserves the player's stride clock across short pauses instead of rewinding it on each idle frame. Existing room/character reset behavior is retained. `AnimationReview.js` compares the shipped walk/run sheets using common body sizing, eight directions, and variable playback speed. This release does not replace character art or publish the separate local 3D prototype.

## Verification

Tests cover round-trip saves with unfinished reveals, malformed and oversized imports, rejection of unrelated keys, storage-write rollback, explicit restore confirmation, favorites, passport unlocks, display ownership/reordering, audio opt-in/disposal, and stride continuity. The normal collection and world suites remain applicable. Physical phone appearance and audio output should also be checked when browser preview is available.
