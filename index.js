// The entry point Expo names in `app.json`. Everything real is in `src/` so that the
// hygiene audits in `test/purity.test.mjs` — which read `src/` — actually see it.
import './src/main';
