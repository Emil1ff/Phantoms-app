export const APP_NAME = 'Phantoms';
export const API_BASE_URL =
  'https://codephantoms.azurewebsites.net/api';
// Toggle temporary mock API mode.
// true  => all requests use local mock data
// false => requests go to API_BASE_URL
export const MOCK_API_ENABLED = false;

// Optional: set your Google Web Client ID for server authentication (OAuth 2.0).
// Example: '12345-abcdefg.apps.googleusercontent.com'
// Leave empty to keep the manual token paste fallback in the app.
// Replace with your OAuth Web client ID from Google Cloud Console if backend
// strictly validates `aud` against web client only.
export const GOOGLE_WEB_CLIENT_ID =
  '704008713327-4tt42epqj04uae1khhg8030261svmtjg.apps.googleusercontent.com';

// iOS requires either GoogleService-Info.plist or iosClientId.
// Example: '12345-abcdefg.apps.googleusercontent.com'
export const GOOGLE_IOS_CLIENT_ID =
  '704008713327-21160rgf5o13b1cnqded6nv7p3hmvdmc.apps.googleusercontent.com';
