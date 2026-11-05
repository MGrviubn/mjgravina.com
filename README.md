# mjgravina.com
My own personal website acting as a personal portfolio of my life and projects.

## Homepage and deployment

- The homepage source is `homepage.html`. This is an intentional exception to
  the course's `index.html` naming requirement; there is no second homepage copy.
- GitHub Pages publishes from `main` at `/(root)` with the custom domain
  `mjgravina.com` and HTTPS enabled.
- Cloudflare must proxy the domain and rewrite requests for `/` to
  `/homepage.html`, preserving the query string. This serves the homepage while
  the browser keeps the root URL.
- A Cloudflare redirect from `/index.html` and `/homepage.html` to
  `https://mjgravina.com/` preserves older homepage links. Match the original
  request path, so the internal rewrite does not trigger a redirect loop.
- When applying the update, delete the former root `index.html`. Keep the
  separate `index.html` files inside WWR, Halloween, and the old portfolio path.
- Home links use `/`. A local preview server must serve this folder as its root
  and map `/` to `homepage.html` to reproduce the deployed Home-link behavior.
  A basic static server can display `/homepage.html` directly, but does not
  provide that root mapping automatically.

## Portfolio layout

The Web Development collection remains at `webdevelopment.html`. Its eight
project cards use two columns at viewport widths of 1000 CSS pixels or more,
and one column below that. The `#ice` link targets the first ICE challenge.
Headers contain only Home, Web Development, and About Me. The former homepage
contact form has been removed. Each portfolio footer contains a Contact section
with an empty text area for confirmed public contact details.

The existing Web Development / ICE collection intentionally remains at
`webdevelopment.html`; Matthew has overridden the `wdd130/ice.html` location.

## Quotes

- `quotes.html` displays the entire collection when its JavaScript loads.
- The homepage's See All Quotes link opens that page. Its random quote and
  Next quote button continue to work independently.
- `scripts/quote-data.js` is the single shared collection. Edit quote text,
  attribution, source notes, and personal `reason` fields there.
- `scripts/quotes.js` controls only the homepage's random quote.
- `scripts/quote-search.js` controls the collection and search form. Search
  checks every entered word in the quote text and ignores capitalization.
  Speakers, sources, and personal comments are displayed but are not searched.
  Search remains in the browser.
- Show All Quotes clears the search input and restores the full collection.
- Empty personal explanations are explicitly marked as not yet added.
  They must be supplied by Matthew in each quote's `reason` field. Each quote
  has a separate comment section. Existing attribution qualifications remain.
- Matthew's supplied wording is applied to the homepage quote heading and
  the collection's introduction, form legend, search hint/button, no-match
  message, comment heading, and load-error message. Quote text and attribution
  are kept separate from interface wording.

Shared hover styles add small movements and color feedback to navigation,
buttons, project cards, quote cards, portraits, and project previews. Reduced
motion preferences disable the movement while retaining color feedback.

## Images and footers

All HTML pages containing images load `scripts/image-fallback.js` and
`styles/image-fallback.css`, including the nested coursework pages. If an
image fails, a visible `image failed to load` message replaces the broken
image. Original `alt` descriptions are preserved and used to describe the
fallback to assistive technology. Successful images keep their existing
appearance; a successful retry restores the image.

Each portfolio footer includes the Gravina logo linking to `/`, alongside
the existing copyright and reserved contact text.

## Browser tab icon

All HTML pages link to favicon assets derived from the existing Gravina logo.
`favicon.ico` contains 16, 32, and 48 pixel versions; `images/favicon-32.png`
provides a 32 pixel PNG version. Nested pages use paths back to the same icons.
