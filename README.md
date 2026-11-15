# Cargo Masters Marine Services website

Static site for www.cargomastersms.com, hosted on Netlify.

- `main` is what's live. Merging a pull request into `main` publishes it automatically.
- Every pull request gets its own Netlify preview link before it goes live.
- No build step: Netlify serves the files in this folder as they are (see `netlify.toml`).

## Notes for editing

- `assets/site.css` is precompiled Tailwind, so new Tailwind classes won't work. Put new styles in a separate plain-CSS file such as `assets/motion.css`.
- `assets/app.js` is minified. Patch it with exact text replacements.
- `assets/smooth-nav.js` handles smooth scrolling for the menu links.
