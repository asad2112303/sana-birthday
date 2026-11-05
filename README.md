# Sana’s Birthday Surprise

A little scrapbook website for Sana’s birthday (6 November), from Asad.

## Open it

Double-click **`index.html`**. It runs straight from this folder, with no internet needed.

## Share it with Sana

Upload this whole folder to any static host and send her the link. The quickest option is
[Netlify Drop](https://app.netlify.com/drop): drag the folder onto the page and you get a link
in a few seconds.

The original WhatsApp files in the top of this folder are not used by the site, so you can leave
them out of the upload. Everything the site needs is in `index.html` and `assets/`.

## Change words, names, captions or photos

Everything Sana reads is in **`assets/js/content.js`**:

- **Names and date** are set once at the top (`FRIEND`, `ME`, `DATE`) and reused everywhere.
- **Captions, notes, the letter and every button label** are plain text between quotes.
- **Photos**: put a new photo in `assets/photos/`, then point an entry in the `PHOTOS` list at it.
  Every place that says `photo: "someKey"` uses a photo from that list.
- **Videos** for the “Little moving memories” strip are in the `VIDEOS` list. Delete an entry to
  hide that clip, or empty the list to hide the strip.

Save the file and refresh the page.

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
