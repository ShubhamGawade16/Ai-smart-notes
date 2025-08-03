# Android Build Guide - Planify App

## Quick Start for Google Play Store

Your Planify app is ready for Android! Follow these steps to publish on Google Play Store.

## Step 1: Install Android Development Tools

### Install Android Studio
1. Download from: https://developer.android.com/studio
2. Install with default settings
3. Open Android Studio and complete initial setup

### Verify Installation
```bash
# Check if you can open the project
npx cap open android
```

## Step 2: App Icons Setup

I've generated a modern app icon for Planify. You'll need to:

1. **Download the generated icon** (I'll provide this)
2. **Create different sizes** using online tools:
   - Use https://icon.kitchen/ or https://www.appicon.co/
   - Upload the icon and generate Android icon pack
   - Download the ZIP file with all sizes

3. **Replace default icons** in these folders:
   ```
   android/app/src/main/res/mipmap-hdpi/ic_launcher.png (72x72)
   android/app/src/main/res/mipmap-mdpi/ic_launcher.png (48x48)
   android/app/src/main/res/mipmap-xhdpi/ic_launcher.png (96x96)
   android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png (144x144)
   android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png (192x192)
   ```

## Step 3: Configure App Details

### Update App Name and Package
The app is already configured with:
- **Package**: `com.planify.taskmanager`
- **App Name**: `Planify - Smart AI Task Management`

### Update Version Information
In `android/app/build.gradle`, update:
```gradle
android {
    defaultConfig {
        versionCode 1
        versionName "1.0"
        // ... other settings
    }
}
```

## Step 4: Create Signing Key

### Generate Release Keystore
```bash
# Navigate to android/app directory
cd android/app

# Generate keystore (replace with your details)
keytool -genkey -v -keystore planify-release-key.keystore -alias planify -keyalg RSA -keysize 2048 -validity 10000
```

When prompted, enter:
- Your name and organization details
- Choose a strong password (remember this!)
- Confirm the information

### Configure Signing in build.gradle
Add this to `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('planify-release-key.keystore')
            storePassword 'your-keystore-password'
            keyAlias 'planify'
            keyPassword 'your-key-password'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Step 5: Build Release APK/AAB

### Build Android App Bundle (Recommended)
```bash
cd android
./gradlew bundleRelease
```

The AAB file will be created at:
`android/app/build/outputs/bundle/release/app-release.aab`

### Alternative: Build APK
```bash
cd android
./gradlew assembleRelease
```

## Step 6: Google Play Console Setup

### Create Developer Account
1. Go to https://play.google.com/console
2. Pay $25 registration fee
3. Complete account verification
4. Agree to terms and conditions

### Create New App
1. Click "Create app"
2. Fill in details:
   - **App name**: Planify - Smart AI Task Management
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free

### Upload App Bundle
1. Go to "Production" > "Create new release"
2. Upload your AAB file
3. Add release notes:
   ```
   Initial release of Planify - Smart AI Task Management
   
   Features:
   - AI-powered task categorization
   - Smart timing recommendations
   - Priority detection
   - Progress tracking
   - Freemium model with premium features
   ```

## Step 7: Store Listing

### App Details Required
1. **App description** (copy from APP_STORE_CHECKLIST.md)
2. **Short description**: "AI-powered task management with smart recommendations and productivity insights"
3. **Screenshots**: Take 2-8 screenshots of your app
4. **Feature graphic**: 1024 x 500 image
5. **App icon**: 512 x 512 PNG

### Privacy Policy
You'll need a privacy policy URL. Key points to include:
- Data collection practices
- How AI features work
- User data protection
- Contact information

### Content Rating
Complete the questionnaire about your app content. Planify should be rated "Everyone" as it's a productivity app.

## Step 8: Testing and Review

### Internal Testing (Optional)
1. Upload your AAB to Internal testing track
2. Test on real devices
3. Fix any issues before production release

### Submit for Review
1. Complete all store listing requirements
2. Click "Review release"
3. Submit for review

**Review time**: Usually 1-3 days

## Commands Summary

```bash
# Build and sync mobile app
npm run build
npx cap sync

# Open in Android Studio
npx cap open android

# Build release (in android/ directory)
./gradlew bundleRelease

# Test on connected device
npx cap run android
```

## Troubleshooting

### Common Issues
1. **Java/Gradle errors**: Ensure you have JDK 11+ installed
2. **Signing errors**: Double-check keystore path and passwords
3. **Build failures**: Clean and rebuild: `./gradlew clean bundleRelease`

### Getting Help
- Android Studio has excellent error messages
- Check Android developer documentation
- Capacitor documentation: https://capacitorjs.com/docs/android

## Cost Breakdown
- **Google Play Console**: $25 (one-time)
- **Time investment**: 1-2 days for first-time setup
- **Review time**: 1-3 days

## Next Steps After Publishing
1. Monitor app performance in Play Console
2. Respond to user reviews
3. Plan app updates and new features
4. Consider marketing and ASO (App Store Optimization)

Ready to start? Let me know if you need help with any specific step!