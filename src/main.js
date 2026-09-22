// `@expo/metro-runtime` is what gives `expo start --web` its fast refresh and error
// overlay, and it is a no-op on native. Tier 3 is driven in a browser
// (`development-process.md` §5), so it earns its place in the manifest.
import '@expo/metro-runtime';
import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);
