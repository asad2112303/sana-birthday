# Sana’s Birthday Surprise

A little scrapbook website for Sana’s birthday (6 November), from Asad.

## Open it

Double-click **`index.html`**. It runs straight from this folder, with no internet needed.

## Share it with Sana

The site is live on GitHub Pages: **https://asad2112303.github.io/sana-birthday/**

Anyone with the link can open it, and the page asks search engines not to list it.

To update the live site, commit your change and push to `main`:

```bash
git add -A
git commit -m "Describe the change"
git push
```

GitHub republishes it within a minute or two. The original WhatsApp files in this folder are
not part of the repo (see `.gitignore`); the site only uses the copies in `assets/`.

## Change words, names, captions or photos

Everything Sana reads is in **`assets/js/content.js`**:

- **Names and date** are set once at the top (`FRIEND`, `ME`, `DATE`) and reused everywhere.
- **Captions, notes, the letter and every button label** are plain text between quotes.
- **Photos**: put a new photo in `assets/photos/`, then point an entry in the `PHOTOS` list at it.
  Every place that says `photo: "someKey"` uses a photo from that list.
- **Videos** for the “Little moving memories” strip are in the `VIDEOS` list. Delete an entry to
  hide that clip, or empty the list to hide the strip.

Save the file and refresh the page.

Two bits of text live elsewhere:

- The words around the certificate's gold stamp ("OFFICIALLY · KNOWS EVERYTHING") are drawn
  into `assets/illustrations/stamp-gold.svg`.
- The browser-tab title and the link-preview description are the `<title>` and
  `<meta name="description">` lines near the top of `index.html`. Edit them by hand if you change
  the names.

## Add music (optional)

Put an `.mp3` in `assets/music/` and set its path in `content.js`, for example
`const MUSIC = { src: "assets/music/birthday.mp3" };`. A music button and a mute button then
appear in the top bar. Without a file, no music controls are shown.

## What’s inside

| Path | What it is |
| --- | --- |
| `index.html` | The page structure |
| `assets/js/content.js` | All words, names, captions and photo choices |
| `assets/js/app.js` | How everything behaves |
| `assets/js/illustrations.js` | The gift, cake and wax-seal drawings, bundled so their parts can animate |
| `assets/css/styles.css` | The look |
| `assets/photos/` | Web copies of your photos |
| `assets/videos/` | The clips and their preview frames |
| `assets/illustrations/` | Bears, gifts, cake, seals, stamps, tape and doodles (SVG) |
| `assets/fonts/` | Fraunces, Alegreya and Caveat, so the site looks right offline |

## Notes

- Your original photos and videos are untouched. Two photos had the phone’s “Crop” button
  captured in their top corner; their web copies have only that strip of sky or leaves trimmed
  off. Faces are never cropped anywhere on the site.
- The certificate photo is a still taken from the formal-headshot video.
- The site respects “reduce motion” settings and works with the keyboard alone.
