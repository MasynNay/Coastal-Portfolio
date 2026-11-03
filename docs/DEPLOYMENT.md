# Publishing the portfolio

The current portfolio lives in [Coastal-Portfolio](https://github.com/MasynNay/Coastal-Portfolio). Cloudflare Pages builds the `main` branch and serves it at [masynnay.com](https://masynnay.com).

## Current site

Cloudflare's build settings are:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Build command | `npm run build` |
| Output directory | `build` |
| Root directory | Repository root |
| Node version | `22`, from `.node-version` |

Run the tests, lint and build before pushing. A push to `main` starts a new Cloudflare deployment. Build output, dependencies and local credentials are excluded from the source repository. No server or database is needed.

```sh
npm ci
CI=true npm test -- --watchAll=false --runInBand
npm run lint
npm run build
```

Cloudflare serves the React app for client-side routes such as `/world` and `/design/desktop`. The original portfolio under `/React-Portfolio/` is a separate static build, with its own assets and fallback page.

Check the deployment's Pages preview before changing custom domains. For an application regression, use **Workers & Pages → Coastal Portfolio → Deployments → Rollback** to restore a previous successful production deployment. Keep the original Cloudflare project until the replacement is verified.

## Original portfolio

The [React-Portfolio repository](https://github.com/MasynNay/React-Portfolio) retains its original source history. Its `gh-pages` branch contains a frozen static build, served at [the original demo address](https://masynnay.github.io/React-Portfolio/). That branch has no custom-domain `CNAME` file, so the demo stays independent of masynnay.com.

The same original build is included in this project at `public/React-Portfolio/`. See [the development guide](DEVELOPMENT.md#preserved-original-portfolio) for rebuilding it from the fixed original commit. Normal portfolio builds use that saved demo without fetching or modifying the old repository.

The domain belongs to the current site. Do not add it back to GitHub Pages or the old Cloudflare project after the migration.

## Contact email

The shared contact form uses FormSubmit to deliver submissions to `masynnay33@gmail.com`, with the subject **Someone sent you a message from your portfolio**. It includes the visitor's name, email, optional phone number and message. Reply-To points to the visitor's address.

Activation is complete. On November 2, 2026, a test submitted through the live website was accepted by FormSubmit and confirmed received by Masyn. If the recipient changes, the new address must complete FormSubmit's one-time activation before receiving messages.

No EmailJS account, SMTP password or private API key is required. The form keeps the visitor's input when a request fails and offers a direct email link. See [FormSubmit's setup instructions](https://formsubmit.co/) for activation, and [ContactMail.js](../src/components/ContactMail.js) for the shared request.

## In-game patch notes

Windfall's mailbox reads `src/data/patchNotes.js`. Add only completed changes relative to the recorded production commit, and publish the matching version tag so its comparison link points to the actual patch.
