Generated with the built-in image generation tool. Reference inputs: Masyn's `costume-skills` walking sheet and the first four-frame action strip. The source preserves four cardinal facing rows; runtime uses 64×72 cells with foot anchors.

Final source was corrected with the built-in image tool using this prompt:

Use case: precise-object-edit. Correct the directional bow action atlas in image 1 while preserving Masyn's brown hair, green eyes, beard, green clothes, and GBA pixel-art style. Image2 is his walking identity reference. Keep the sheet exactly FOUR columns by FOUR rows, full bodies separated on transparent background. The existing atlas has wrong arrow directions. Draw new consistent action poses:
ROW1 DOWN/front: face directly toward camera in ALL four frames. Take bow off back; hold bow across front with arrow POINTING VERTICALLY DOWN toward BOTTOM OF IMAGE (foreshortened frontal aiming pose, arrow is NOT horizontal); release empty bow still aiming DOWN; stow bow.
ROW2 UP/back: show back of head and green outfit, NO FACE in ALL four frames. Take bow; aim arrow VERTICALLY UP toward TOP OF IMAGE; release empty bow still aiming UP; stow bow. NO horizontal arrow in this row.
ROW3 LEFT: profile facing LEFT in ALL four frames. Take bow; aim arrow HORIZONTALLY LEFT; release empty bow still facing LEFT; stow bow.
ROW4 RIGHT: profile facing RIGHT in ALL four frames. Take bow; aim arrow HORIZONTALLY RIGHT; release empty bow still facing RIGHT; stow bow.
The third-column release must NEVER reverse the direction from the second-column aiming pose. Bow appears in hands only columns2/3, appears on back only column4, never duplicate. No detached arrows or effects. Same feet baseline and body size in every cell. Do not simply copy the incorrect directions from reference. STRICT 4x4 sixteen frames, generous transparent gutters, no text, grid, labels, shadows or background.

The importer mirrors side cells 9, 10 and 14 to normalize their facing. Front and back rows are independently drawn, not rotated side poses.

First directional prompt:

Use case: identity-preserve. Game production art: ONE transparent sprite animation sheet of this clothed adult man, Masyn, matching the provided reference. EXACTLY 4 columns by 4 rows, sixteen separated full-body sprites. Use first reference for his brown hair, green eyes, small beard, clothing and pixel art proportions. Second reference shows the four action poses you must redraw in additional directions. Maintain this adult character's identity and wardrobe. Crisp expressive GBA-inspired pixel art with dark contours.
Orientation rows in order top to bottom: DOWN (front view directly toward camera), UP (back view away from camera, back of head and clothing, no face), LEFT (left side profile), RIGHT (right side profile).
Every row contains the same action sequence in columns 1 to 4: take wooden bow from back; draw bow and arrow aiming in facing direction; release string with empty bow (no arrow visible); put bow on back. The whole body, hands, held item and clothing must all turn appropriately to that row's direction. Up/down poses must aim up/down, not sideways.
Strict 4x4 regular grid, same cell dimensions, same foot baseline and consistent body size in all sixteen cells. Wide clear transparent gutters, generous margins around complete bodies/held objects. No text, labels, grid lines, backgrounds, scenery, detached projectiles, magic particles or notes. No duplicate weapons. Transparent background.
