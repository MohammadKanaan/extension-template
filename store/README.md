# Store submission

[`listing.md`](listing.md) holds the text for each field of the Chrome Web
Store and addons.mozilla.org forms, the permission justifications, and the
image sizes each store wants.

The Chrome Web Store takes 24-bit PNG or JPEG images with no transparency, at
exactly the sizes in `listing.md`.

## Submission checklist

- [ ] `bun run build` and `bun run test` pass.
- [ ] Run `bun run package:chrome` and upload `artifacts/*-chrome.zip`.
- [ ] Run `bun run package:firefox` and upload `artifacts/*-firefox.xpi` to AMO.
- [ ] Upload `icons/icon-128.png` as the store icon.
- [ ] Upload the screenshots in the order you want them shown.
- [ ] Upload the small promo tile, and the marquee if the listing is featured.
- [ ] Paste the listing copy from `listing.md`.
- [ ] Host `PRIVACY.html` at a public URL and paste that URL into the privacy
      policy field.
- [ ] Fill in the privacy practices answers from `listing.md`.
