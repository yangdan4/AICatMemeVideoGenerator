import { AppRegistry } from 'react-native';
import App from './App.js';
import { name as appName } from './app.json';
import { name as appNameLow } from './applow.json';

// Register the app component
AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent(appNameLow, () => App);