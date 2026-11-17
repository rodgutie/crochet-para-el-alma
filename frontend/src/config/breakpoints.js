// Single source of truth for the mobile/desktop split.
// Mobile = viewport width < 768px, i.e. max-width: 767px.
// Used by the JS (hero slide filtering) and injected into the CSS media
// queries at build time (see vite.config.js: __MOBILE_MAX__ in index.css).
export const MOBILE_MAX_WIDTH = 767
export const MOBILE_QUERY = `(max-width: ${MOBILE_MAX_WIDTH}px)`
