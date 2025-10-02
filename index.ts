import { registerRootComponent } from 'expo';

// CRITICAL: Import theme FIRST to ensure it's initialized before any components load
import './src/constants/theme';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
