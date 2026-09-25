# Ashwin Vergis George — personal website

Plain HTML, CSS and JavaScript. No framework, no build step: edit the files in any text editor and open `index.html` in a browser to check.

## What's where

```
index.html                  Home: your name, one-line description, the sky
about.html                  Photo, bio, timeline, schools, skills, CV download
research/index.html         Both projects + publications
research/thesis.html        Carving Cavities in the Cosmos (video slot)
research/cold-clouds.html   MPA internship, interactive cloud comparison, figure
contact.html                Email, GitHub, arXiv, ADS, AIP address
css/style.css               All styling. Colours are at the top (Starlight theme)
js/sky.js                   Star field. Settings at the top (density, seed, frame rate)
js/site.js                  Day/night switch, video link, copy email, cloud comparison
assets/                     Fonts, images, CV
```

## Things to fill in

Search the HTML for `<!--` to find every note. The main ones:

- **Home description** in `index.html` is placeholder text.
- **Bio** in `about.html` is a draft built from your CV. Rewrite it in your own voice.
- **Thesis text** in `research/thesis.html` is a broad-strokes placeholder. Check the Weinberger et al. (2023) reference and add a link to it.
- **YouTube link**: in `research/thesis.html`, paste the link between the quotes in `href=""` on the line under the comment. Until then the still shows "Video coming soon".
- **ORCID**: there's a commented-out line ready in `contact.html`.
- **CV**: `assets/cv/Ashwin_Vergis_George_CV.pdf` is your CV with the phone number removed. To update it, replace the file and keep the same name.

## Publish on GitHub Pages (free)

1. On github.com, create a new public repository named exactly `gregwisenoah.github.io`.
2. Upload everything in this folder, including the hidden `.nojekyll` file, to the repository's main branch. You can drag the files onto "Add file → Upload files".
3. In the repository, open Settings → Pages and set Source to "Deploy from a branch", branch `main`, folder `/ (root)`.
4. After a minute or two the site is live at `https://gregwisenoah.github.io`.

To use your own domain, such as ashwingeorge.de, buy it from any registrar. Then add it under Settings → Pages → Custom domain and follow GitHub's DNS instructions.

Once you know the final address, replace the `og:image` value in each page's `<head>` with the full URL. It would look like `https://gregwisenoah.github.io/assets/img/og-image.jpg`. That's what makes link previews show the image.

## Small tweaks

- **Colours**: edit the tokens at the top of `css/style.css`. Night values are under `:root`, day values under `:root[data-theme="light"]`, and the same day values are repeated in the `prefers-color-scheme` block.
- **More or fewer stars**: change `DENSITY` in `js/sky.js`. For a different arrangement, change `SEED`.
- **Sun size**: `--sun-size` in `css/style.css`.

## Notes

- Fonts (Jost, and STIX Two Text for maths) are stored on the site itself rather than loaded from Google, and the site sets no cookies and uses no trackers.
- The stars pause when the tab is hidden and stay still for visitors who have turned on reduced motion.
- Page-to-page transitions (your name gliding into the header) work in Chrome, Edge and Safari 18.2+. Other browsers just load the page normally.
