# Local project demos

The portfolio cards in the main site, Mac Mode and the island link to the same three demos. These run within this website and keep their own browser storage; the original repositories remain linked. MixStream uses its local demo rather than the retired live site.

| Project    | Local route            | Working interactions                                                                     | Source snapshot                                                 |
| ---------- | ---------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| MixStream  | `/projects/mixstream`  | Movie/TV search, details, saved favorites, region-specific watch-guide links             | MasynNay/MixStream `8014fefa307733455031689d610d7fe12a378052`   |
| TypeNinja  | `/projects/typeninja`  | Timed typing, accuracy, scores, word modes                                               | MasynNay/TypeNinja `308f4a1ec783998b4edfcf74e5059f209c84c052`   |
| SemiSnitch | `/projects/semisnitch` | Sample fleet reports, local JSON import, coaching statuses, delete/undo, sample download | greg4949/Semi-Snitch `3778d0bb8f554838dda1ebf02bdae494744fedee` |

MixStream preserves the original HTML structure, Foundation and project CSS, banner and group credits. Its retired credential-dependent search is replaced with public TVmaze and Wikipedia searches. Source links appear with each result; a six-title starter catalog also works offline. Favorites are stored locally. Where-to-watch links open JustWatch for the selected region; the demo does not claim current streaming availability or fabricate providers. Requests time out, stale responses are ignored, and partial/offline failures are explained in the interface. SemiSnitch adapts its original Header, Reports, Report and IdleTableRow markup and compiled Tailwind stylesheet; browser storage replaces account, GraphQL, database and weather services for the demo. Imported JSON is validated and rendered as text, never sent to a server. Original group credits remain in both demos.

The two older apps are isolated in iframes so their global Foundation/Tailwind rules cannot affect the portfolio. TypeNinja reuses the same React component as its Mac Mode dock app. Its source and license notes are in `src/typing/README.md` and `docs/licenses/TypeNinja.txt`.

No old API keys or credentials are carried into these demos.

Mother Goose Tumbling (MGT) is also listed as a client project. Its current site has moved to a new administrator; the card links to [the preserved live application](https://masynnay.github.io/MGT/) and its source repository. The preview is a real homepage screenshot in `public/images/projects/mgt.jpg`, captured from that preserved site.
