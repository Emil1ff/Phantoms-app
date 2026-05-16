import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProviders } from './providers/AppProviders';
import { AppNavigator } from '../navigation/AppNavigator';

function AppRoot() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <AppNavigator />
      </AppProviders>
    </SafeAreaProvider>
  );
}

export default AppRoot;
