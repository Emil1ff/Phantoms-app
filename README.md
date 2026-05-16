This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Google Sign-In Full Setup (iOS + Android + Backend)

Bu layihədə Google login axını aşağıdakı endpoint-ə gedir:
- `POST /Auth/google-signin` (`src/services/auth/authService.ts`)

## 1) Qoşulacaq servislər

1. `Google Cloud Console` (OAuth client-lər yaratmaq üçün)
2. `Firebase Console` (iOS `GoogleService-Info.plist` və Android `google-services.json` almaq üçün - tövsiyə olunur)
3. `Backend API` (Google ID token verify və user session yaratmaq üçün)

## 2) Google Cloud konfiqurasiyası

1. Project yarat: `Google Cloud Console`.
2. `OAuth consent screen` doldur (app adı, support email, developer contact).
3. 3 fərqli OAuth Client yarat:
   - `Web client` -> bu dəyər `GOOGLE_WEB_CLIENT_ID` olacaq.
   - `iOS client` (bundle id: `com.phantoms`) -> bu dəyər `GOOGLE_IOS_CLIENT_ID` olacaq.
   - `Android client` (package: `com.phantoms`, SHA-1 debug/release) -> Android üçün lazımdır.

## 3) Firebase konfiqurasiyası (tövsiyə olunan yol)

1. Eyni Google project-ə bağlı Firebase project aç.
2. iOS app əlavə et (`com.phantoms`) və `GoogleService-Info.plist` yüklə.
3. Android app əlavə et (`com.phantoms`) və `google-services.json` yüklə.
4. Faylları yerləşdir:
   - `ios/Phantoms/GoogleService-Info.plist`
   - `android/app/google-services.json`

## 4) Layihədə dəyərləri yaz

`src/constants/index.ts`:
- `GOOGLE_WEB_CLIENT_ID='xxxx.apps.googleusercontent.com'`
- `GOOGLE_IOS_CLIENT_ID='yyyy.apps.googleusercontent.com'`

## 5) iOS native addım

1. Xcode ilə `ios/Phantoms.xcworkspace` aç.
2. `GoogleService-Info.plist` faylını `Phantoms` target-ə əlavə et (`Copy items if needed` aktiv).
3. Pod install:
   - `cd ios`
   - `bundle exec pod install`

## 6) Android native addım

Android üçün debug SHA-1 alma:
```sh
cd android
./gradlew signingReport
```
Çıxan SHA-1-i Google/Firebase Android OAuth client-də qeyd et.

## 7) Backend tələbi (`/Auth/google-signin`)

Backend bu axını etməlidir:
1. Gələn `idToken`-i Google public keys ilə verify et.
2. `aud` claim `GOOGLE_WEB_CLIENT_ID`-ə bərabər olmalıdır.
3. `iss`, `exp`, `email_verified` yoxla.
4. User tap/yarat.
5. Normal login kimi `AuthSession` qaytar:
   - `accessToken`, `refreshToken`, `accessTokenExpiry`, `userId`, `email`, `fullName`, `roles`.

## 8) Hazırkı app davranışı

Login ekranı artıq bu qorumaları edir:
- `GOOGLE_WEB_CLIENT_ID` yoxdursa crash olmur, xəbərdarlıq verir.
- iOS-da `GOOGLE_IOS_CLIENT_ID` / plist yoxdursa crash olmur, xəbərdarlıq verir.
- Google cancel olarsa xəta göstərmir.

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
