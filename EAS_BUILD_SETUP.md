# EAS Build Setup (Expo)

## 🚀 **Notification Compatibility: 100% Maintained**

EAS Build compiles your existing Capacitor code without modifications. Your notification system remains fully functional:

- **Local notifications**: Work immediately (no configuration needed)
- **Push notifications**: Ready for Firebase FCM and Apple APNs
- **AI-powered timing**: All behavioral analysis preserved
- **Cross-platform sync**: Identical functionality across web/mobile

## 📱 **EAS Build Setup**

### **Step 1: Install EAS CLI**
```bash
npm install -g @expo/cli
npm install -g eas-cli
```

### **Step 2: Configure for Capacitor**
Create `eas.json`:
```json
{
  "cli": {
    "version": ">= 8.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### **Step 3: Add Expo Configuration**
Create `app.json`:
```json
{
  "expo": {
    "name": "AI Smart Notes",
    "slug": "ai-smart-notes",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./android/app/src/main/res/drawable/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "platforms": ["android", "ios"],
    "android": {
      "package": "com.aismartnotes.app",
      "compileSdkVersion": 34,
      "targetSdkVersion": 34,
      "permissions": [
        "android.permission.INTERNET",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE",
        "android.permission.WAKE_LOCK"
      ]
    },
    "ios": {
      "bundleIdentifier": "com.aismartnotes.app",
      "buildNumber": "1"
    }
  }
}
```

### **Step 4: Build Commands**
```bash
# Login to Expo
eas login

# Build APK (development)
eas build --platform android --profile development

# Build APK (internal testing)  
eas build --platform android --profile preview

# Build AAB (Play Store)
eas build --platform android --profile production
```

### **Step 5: Download APK**
- Build completes in ~15-20 minutes
- Download link sent to email
- Direct download from EAS dashboard

## 🔔 **Why Notifications Keep Working**

EAS Build:
1. **Preserves your Capacitor plugins** - All notification code intact
2. **Maintains native permissions** - Android manifest unchanged
3. **Keeps your service worker** - Web notifications preserved
4. **Bundles your AI logic** - Smart timing algorithms included

## 💰 **Pricing**
- **Free tier**: 30 builds/month
- **Production**: $99/month for unlimited builds
- **Priority**: Faster build queue for paid plans

## ⚡ **Quick Start**
```bash
# Install tools
npm install -g @expo/cli eas-cli

# Setup project
eas login
eas build:configure

# Build APK
eas build --platform android --profile preview
```

## 🎯 **Recommendation**

**For your use case**: EAS Build is excellent because:
- Works seamlessly with Capacitor
- Maintains all notification functionality
- Provides both APK and AAB builds
- Good free tier for testing

Your AI-powered notifications will work exactly as designed!