# @adviverse/extension

Adviverse ads on your browser extension's **own pages**: popup, options page, new tab, side panel. Works in Chrome, Edge and Firefox (Manifest V3).

Manifest V3 doesn't let extension pages run remote scripts, so the ad runs in an https iframe from `serve.adviverse.com/frame`, which loads the normal Adviverse web SDK. Your extension ships only this small module. It needs no permissions and no manifest changes.

## 1. Register the extension

Register it as an app whose bundle id is your extension id, then create a placement for it:

```bash
adviverse apps create --kind mobile_app --name "My Extension" \
  --bundle <extension id> --platform chrome      # or edge / firefox
adviverse placements create --app <app id> --name popup --format banner --width 300 --height 250
```

The REST equivalents are `POST /v1/publisher/apps` with `{kind:"mobile_app", name, bundleId:"<extension id>", platform:"chrome"}` and `POST /v1/publisher/placements` with `appId`. The MCP tools are `create_app` and `create_placement`.

Before verification, use the test tag `tk_test`.

## 2. Verify it

Verify with either method:

- **Store listing** (Chrome Web Store or Edge Add-ons). Set `storeUrl` to the listing, for example `https://chromewebstore.google.com/detail/<name>/<extension id>`, then call `POST /v1/publisher/apps/{id}/verify` with `{"method":"store_listing"}`.
- **Developer site** (any browser, including Firefox). Link a verified website property with `developerPropertyId`, and publish `adviverse.com, <your account id>, DIRECT` in that site's `/app-ads.txt`.

## 3. Show an ad

```bash
npm i @adviverse/extension
```

```js
// popup.js (bundled), or <script type="module" src="popup.js"> with this file copied in
import { mountAd } from '@adviverse/extension';

mountAd(document.getElementById('ad'), {
  tag: 'tk_…',
  size: '300x250',
  onNoFill: () => {},   // the slot already collapses on no-fill
});
```

`mountAd` returns `{ destroy() }`.

| Option | Default | |
|---|---|---|
| `tag` | | Placement tag key. Required. |
| `size` | fill the container, auto-size to the creative | `"WxH"` |
| `personalized` | `false` | Contextual ads with no identifier. Set it to `true` only after the user has consented. |
| `extensionId` | `(browser ?? chrome).runtime.id` | |
| `platform` | detected from the browser | `chrome` \| `edge` \| `firefox` |
| `onFill`, `onNoFill` | | Callbacks |

Clicks open a new tab. The iframe is sandboxed without `allow-top-navigation`, so an ad can never navigate your extension page.

## Store policy

- Show ads only on your extension's own pages. Injecting ads into other websites is banned by the Chrome Web Store and by Firefox Add-ons.
- Disclose the ads in your store listing. Ads are labelled "Advertisement" in the page.
- Don't put an ad in a context the user didn't open, such as an unrequested new-tab override.
