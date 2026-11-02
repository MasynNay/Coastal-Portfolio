// Local word pools keep TypeNinja playable without its old random-words server.
// Developer mode adds the terms the original bootcamp project was built to practice.
export const wordPools = {
  words:
    `after again almost along always answer around autumn away beach beautiful
  because before begin beside better between blue boat book both bright bring build
  call calm carry change city clear close coast color come could country create day
  deep different discover down dream each early earth easy enough every explore face
  family far feel field find first fish flower follow forest friend from garden gentle
  give glass good grass great green grow hand happy have heart help here high home hope
  house idea island just keep kind know lake land large last later learn leave left
  letter life light little live long look love make many meet might moment moon more
  morning most mountain move much music name nature near never next night north ocean
  often once only open other outside over own page paper park part path people place
  play point pond pretty quiet read ready real right river road room round run same
  sand school sea season second seem shade share shell shore show simple since skill
  small smile smooth some sound south space spring stand star start stay step still
  stone story summer sun take tell than thank their them then there these thing think
  this those thought three through time today together town tree true turn under until
  use very walk warm watch water wave way welcome well went were what when where which
  while white whole why wide will wind window with wonder word work world would write
  year yellow young your`.split(/\s+/),
  developer:
    `array async await boolean branch browser build button cache callback
  canvas character class client clone code column command commit component condition
  console constant context controller cookie create cursor data database debug default
  deploy design document element endpoint engine error event export fetch filter focus
  frame frontend function git github handler height hook html import index input
  interface javascript json keyboard layout length library listener local loop map
  merge method module mouse network node object package parameter pixel pointer promise
  property prototype query react reduce refactor render request response return route
  row runtime scope screen script scroll search section select server session set
  socket sort source sprite state storage string style submit target terminal test
  thread timeout timer token transform type update value variable vector version view
  viewport website width window worker`.split(/\s+/),
};

export function makeWords(mode = "words", count = 200, random = Math.random) {
  const pool = wordPools[mode] || wordPools.words,
    result = [];
  for (let i = 0; i < count; i++) {
    let index = Math.floor(random() * pool.length) % pool.length;
    if (pool[index] === result[i - 1]) index = (index + 1) % pool.length;
    result.push(pool[index]);
  }
  return result;
}
