# AI Smart Notes - Mobile App Build Guide

## Overview
This guide explains how to build an Android APK for your AI Smart Notes app using Capacitor, which wraps your React web app into a native mobile application.

## Prerequisites

### 1. Install Android Studio
1. Download and install [Android Studio](https://developer.android.com/studio)
2. During installation, make sure to install:
   - Android SDK
   - Android SDK Platform-Tools
   - Android SDK Build-Tools
   - Android Emulator (optional for testing)

### 2. Set Environment Variables
Add these to your system environment (Windows: System Properties > Environment Variables, Mac/Linux: ~/.bashrc or ~/.zshrc):

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/build-tools/34.0.0
```

## Quick Setup

### Automated Setup (Recommended)
```bash
# Run the setup script
./setup-mobile.sh
```

Or manually:

### Step 1: Build the Web App
```bash
npm run build
```

### Step 2: Initialize Capacitor (First time only)
```bash
npx cap init "AI Smart Notes" "com.aismartnotes.app" --web-dir="dist/public"
```

### Step 3: Add Android Platform
```bash
npx cap add android
```

### Step 4: Copy Web Assets to Native Project
```bash
npx cap copy android
```

### Step 5: Sync Project
```bash
npx cap sync android
```

### Step 6: Open in Android Studio
```bash
npx cap open android
```

### Step 6: Build APK in Android Studio
1. Android Studio will open with your project
2. Wait for Gradle sync to complete
3. Go to **Build > Generate Signed Bundle / APK**
4. Choose **APK** and click **Next**
5. Create a new keystore or use existing one:
   - **Keystore path**: Choose location for your keystore file
   - **Password**: Create a strong password
   - **Key alias**: e.g., "ai-smart-notes-key"
   - **Key password**: Same or different from keystore password
   - **Certificate info**: Fill in your details
6. Choose build variant (usually **release**)
7. Click **Finish**

## Alternative: Command Line Build

### For Debug APK (for testing):
```bash
cd android
./gradlew assembleDebug
```
APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### For Release APK:
1. Create keystore first:
```bash
cd android
keytool -genkey -v -keystore ai-smart-notes.keystore -alias ai-smart-notes-key -keyalg RSA -keysize 2048 -validity 10000
```

2. Create `android/app/build.gradle` signing config:
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('ai-smart-notes.keystore')
            storePassword 'your-keystore-password'
            keyAlias 'ai-smart-notes-key'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

3. Build release APK:
```bash
./gradlew assembleRelease
```
APK location: `android/app/build/outputs/apk/release/app-release.apk`

## Development Workflow

### During Development:
1. Make changes to your React app
2. Build the web app: `npm run build`
3. Sync changes: `npx cap sync android`
4. Test in Android Studio or on device

### Live Reload (for development):
```bash
npx cap run android --livereload --external
```

## Mobile App Features

### Native Features Implemented
- **Haptic Feedback**: Provides tactile feedback for user interactions
- **Status Bar Styling**: Matches app theme
- **Keyboard Management**: Handles on-screen keyboard properly
- **Deep Linking**: Support for direct navigation to specific features
- **Offline Detection**: Shows offline indicator when network is unavailable
- **PWA Install**: Install prompt for web users

### Mobile-Optimized UI
- Touch-friendly buttons and interactive elements
- Responsive design that works on all screen sizes
- Proper keyboard handling for form inputs
- Native-style navigation and transitions

## App Store Preparation

### 1. App Icons
- Create app icons in various sizes and place in `android/app/src/main/res/`
- Use [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/) for proper sizing

### 2. Splash Screen
- Create splash screen assets
- Place in `android/app/src/main/res/drawable/`

### 3. App Permissions
Edit `android/app/src/main/AndroidManifest.xml` to add required permissions:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### 4. Version Management
Update version in `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        versionCode 1
        versionName "1.0.0"
    }
}
```

## Google Play Store Upload

### 1. Create Developer Account
- Sign up for [Google Play Console](https://play.google.com/console)
- Pay one-time $25 registration fee

### 2. Create App Listing
1. Go to Play Console > Create app
2. Fill in app details:
   - **App name**: AI Smart Notes
   - **Default language**: English
   - **App or game**: App
   - **Free or paid**: Free (with in-app purchases for Pro tiers)

### 3. Upload APK/AAB
1. Generate signed bundle (AAB recommended over APK):
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
2. Upload to Play Console > App releases > Production
3. Fill in release notes

### 4. Store Listing
- **App description**: Use your marketing copy from the web app
- **Screenshots**: Take screenshots from your app (required: phone, tablet)
- **Feature graphic**: Create 1024x500px promotional image
- **App icon**: 512x512px high-res icon

### 5. Content Rating
- Complete the content rating questionnaire
- Your app will likely be rated "Everyone" or "Teen"

### 6. Privacy Policy
- Create and host a privacy policy (required for apps that collect data)
- Add the URL in Play Console

## Troubleshooting

### Common Issues:

**Build fails with SDK errors:**
- Ensure Android SDK is properly installed
- Check environment variables are set correctly
- Update to latest SDK tools

**App crashes on startup:**
- Check `capacitor.config.ts` webDir points to correct build folder
- Ensure `npm run build` completed successfully
- Check browser console for errors

**Network requests fail:**
- Add network security config for HTTP requests (if needed)
- Check CORS settings on your server

**App doesn't update:**
- Run `npx cap sync android` after building
- Clean and rebuild: `cd android && ./gradlew clean && ./gradlew assembleDebug`

## Testing

### Device Testing:
1. Enable Developer Options on Android device
2. Enable USB Debugging
3. Connect device and run: `npx cap run android --target [device-id]`

### Firebase App Distribution (for beta testing):
1. Set up Firebase project
2. Add Android app to Firebase
3. Use Firebase CLI to distribute to testers

## Optimization Tips

### App Size Reduction:
- Enable code splitting in Vite build
- Optimize images and assets
- Remove unused dependencies

### Performance:
- Implement service worker for offline functionality
- Use lazy loading for routes
- Optimize API calls for mobile networks

### Native Features:
- Add push notifications using Capacitor plugins
- Implement device storage for offline functionality
- Use native UI elements where appropriate

---

This guide provides everything needed to create and publish your AI Smart Notes app to the Google Play Store. The Capacitor approach maintains your existing React codebase while providing native mobile functionality.