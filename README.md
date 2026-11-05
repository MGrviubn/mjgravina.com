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
