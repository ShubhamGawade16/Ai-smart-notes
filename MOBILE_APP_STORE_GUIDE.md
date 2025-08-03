# Planify Mobile App Store Publishing Guide

This guide will help you publish your Planify AI Task Management app on both Google Play Store and Apple App Store.

## Prerequisites

✅ Your app is already set up with Capacitor for mobile deployment
✅ React web app is working properly
✅ All required dependencies are installed

## Phase 1: Prepare for Mobile Build

### 1. Update App Configuration

Your app is configured with:
- **App ID**: `com.planify.taskmanager`
- **App Name**: `Planify - Smart AI Task Management`
- **Web Directory**: `dist/public`

### 2. Create App Icons and Splash Screens

You'll need icons in various sizes:

**Android Icons Required:**
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` (72x72)
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` (48x48)
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` (96x96)
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` (144x144)
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192x192)

**iOS Icons Required (if building for iOS):**
- Various sizes from 20x20 to 1024x1024

**Recommended Tools:**
- Use online icon generators like [Icon Kitchen](https://icon.kitchen/) or [App Icon Generator](https://www.appicon.co/)
- Upload your Planify logo and generate all required sizes

### 3. Build Commands Available

Run these commands in sequence:

```bash
# Build the web app and sync with mobile
npm run build
npx cap sync

# Open Android Studio for Android development
npx cap open android

# For iOS (requires macOS and Xcode)
npx cap open ios
```

## Phase 2: Android App (Google Play Store)

### Step 1: Setup Android Development Environment

1. **Install Android Studio**: Download from [developer.android.com](https://developer.android.com/studio)
2. **Install Java JDK 11+**: Required for Android development
3. **Set Environment Variables**:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```

### Step 2: Configure Android App

1. **Open Android Studio**:
   ```bash
   npx cap open android
   ```

2. **Update App Details** in `android/app/src/main/AndroidManifest.xml`:
   - App name
   - Permissions
   - Version code and name

3. **Add App Icons**: Place generated icons in the respective `mipmap` folders

### Step 3: Generate Signed APK/AAB

1. **Create Keystore**:
   ```bash
   keytool -genkey -v -keystore planify-release-key.keystore -alias planify -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure Signing** in `android/app/build.gradle`:
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file('planify-release-key.keystore')
               storePassword 'your-store-password'
               keyAlias 'planify'
               keyPassword 'your-key-password'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled false
               proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

3. **Build Release AAB** (recommended for Play Store):
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

### Step 4: Google Play Console Setup

1. **Create Developer Account**: 
   - Go to [Google Play Console](https://play.google.com/console)
   - Pay $25 one-time registration fee
   - Complete account verification

2. **Create New App**:
   - App name: "Planify - Smart AI Task Management"
   - Category: Productivity
   - Content rating: Everyone

3. **Upload App Bundle**:
   - Upload the generated AAB file from `android/app/build/outputs/bundle/release/`
   - Complete store listing with screenshots, descriptions, and privacy policy

### Step 5: Store Listing Requirements

**Screenshots Needed:**
- Phone screenshots (at least 2, up to 8)
- Tablet screenshots (recommended)
- Feature graphic (1024 x 500)

**App Description Example:**
```
Planify transforms your productivity with AI-powered task management. Get smart task suggestions, priority recommendations, and personalized timing insights.

Key Features:
✅ AI-powered task categorization
✅ Smart timing recommendations
✅ Priority detection and suggestions
✅ Progress tracking and analytics
✅ Freemium model with premium features

Perfect for professionals, students, and anyone looking to optimize their daily productivity with artificial intelligence.
```

## Phase 3: iOS App (Apple App Store)

### Requirements
- **macOS computer** (required for iOS development)
- **Xcode** (free from Mac App Store)
- **Apple Developer Account** ($99/year)

### Step 1: Setup iOS Development

1. **Install Xcode** from Mac App Store
2. **Open iOS project**:
   ```bash
   npx cap open ios
   ```

### Step 2: Configure iOS App

1. **Update Bundle Identifier**: Set to `com.planify.taskmanager`
2. **Configure App Icons**: Add all required iOS icon sizes
3. **Set Version and Build Numbers**
4. **Configure Signing**: Use your Apple Developer account

### Step 3: Build and Upload

1. **Archive App** in Xcode:
   - Product → Archive
   - Validate the archive
   - Distribute to App Store

2. **App Store Connect**:
   - Create app listing
   - Upload binary via Xcode or Application Loader
   - Submit for review

## Phase 4: App Store Optimization

### App Store Assets Needed

1. **App Icon**: 1024x1024 PNG (no transparency)
2. **Screenshots**: 
   - iPhone 6.7" display (mandatory)
   - iPhone 6.5" display (mandatory)
   - Additional sizes for better coverage
3. **App Preview Videos** (optional but recommended)

### Marketing Materials

Create a landing page for your app with:
- App features and benefits
- Download links for both stores
- Privacy policy and terms of service
- Support contact information

## Phase 5: Post-Launch

### Analytics and Monitoring

1. **Set up Firebase Analytics** (optional):
   ```bash
   npm install @capacitor-firebase/analytics
   ```

2. **Monitor App Performance**:
   - Google Play Console analytics
   - App Store Connect analytics
   - User reviews and ratings

### App Updates

To update your app:
1. Make changes to your React app
2. Increment version number
3. Build and sync: `npm run build && npx cap sync`
4. Generate new signed APK/AAB for Android
5. Create new archive for iOS
6. Upload to respective stores

## Cost Summary

- **Google Play Store**: $25 (one-time)
- **Apple App Store**: $99/year
- **Total First Year**: $124

## Timeline Estimate

- **Android Setup & Build**: 2-4 days
- **iOS Setup & Build**: 3-5 days (if you have Mac)
- **Store Review Process**: 1-7 days (varies)
- **Total**: 1-2 weeks for both platforms

## Need Help?

The setup requires several steps and technical configurations. If you need assistance with:
- Setting up development environment
- Generating icons and assets
- Building signed APKs
- Configuring store listings

Let me know what specific part you'd like help with next!