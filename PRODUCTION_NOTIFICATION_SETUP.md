# Production Notification Setup Guide

## 🔥 Firebase Setup for Android (FCM)

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and name it "GPT Do"
3. Enable Google Analytics (recommended)
4. Wait for project creation

### Step 2: Add Android App
1. Click "Add app" → Android icon
2. **Android package name**: `com.aismartnotes.app`
3. **App nickname**: GPT Do
4. **Debug signing certificate**: Leave blank for now
5. Click "Register app"

### Step 3: Download Configuration
1. Download `google-services.json`
2. Place it in your project root (same level as package.json)
3. **DO NOT commit this file to git** - add to .gitignore

### Step 4: Enable Cloud Messaging
1. In Firebase Console → Project Settings → Cloud Messaging
2. Copy the **Server key** - you'll need this for backend
3. Copy the **Sender ID** - you'll need this for frontend

### Step 5: Add Environment Variables
Add these to your `.env` file:
```bash
# Firebase Cloud Messaging
FCM_SERVER_KEY=your_fcm_server_key_here
FCM_SENDER_ID=your_fcm_sender_id_here
```

## 🍎 Apple Push Notifications Setup (APNs)

### Step 1: Apple Developer Account
1. Sign up for [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
2. Complete enrollment process

### Step 2: Create App Identifier
1. In Apple Developer Console → Certificates, Identifiers & Profiles
2. Click Identifiers → App IDs
3. **Bundle ID**: `com.aismartnotes.app`
4. **Capabilities**: Enable "Push Notifications"
5. Save the App ID

### Step 3: Create APNs Certificate
1. Certificates → Production → Create Certificate
2. Select "Apple Push Notification service SSL"
3. Choose your App ID (`com.aismartnotes.app`)
4. Generate CSR (Certificate Signing Request):
   - Open Keychain Access on Mac
   - Certificate Assistant → Request Certificate from CA
   - Enter your email and name
   - Save to disk
5. Upload CSR and download certificate
6. Double-click to install in Keychain

### Step 4: Export APNs Key
1. In Keychain, find your certificate
2. Right-click → Export
3. Save as `.p12` file with password
4. Convert to `.pem` format:
```bash
openssl pkcs12 -in apns_cert.p12 -out apns_cert.pem -nodes
```

### Step 5: Add Environment Variables
Add these to your `.env` file:
```bash
# Apple Push Notifications
APNS_KEY_PATH=./apns_cert.pem
APNS_KEY_ID=your_key_id_here
APNS_TEAM_ID=your_team_id_here
APNS_BUNDLE_ID=com.aismartnotes.app
APNS_ENVIRONMENT=production  # or 'sandbox' for testing
```

## 📱 Capacitor Build Configuration

### Android Build Setup
1. **Install Android Studio** and Android SDK
2. **Add platforms**:
```bash
npx cap add android
npx cap copy android
npx cap open android
```

3. **Place google-services.json** in `android/app/`
4. **Build**: In Android Studio → Build → Generate Signed Bundle/APK

### iOS Build Setup
1. **Install Xcode** (Mac only)
2. **Add platforms**:
```bash
npx cap add ios
npx cap copy ios
npx cap open ios
```

3. **Configure signing** in Xcode with your Apple Developer account
4. **Build**: In Xcode → Product → Archive

## 🔐 Security Best Practices

### Environment Variables
Never commit these secrets to version control:
- FCM Server Key
- APNs certificates/keys
- API keys
- Database credentials

### .gitignore Updates
```gitignore
# Firebase
google-services.json
GoogleService-Info.plist

# APNs
*.p12
*.pem
apns_cert.*

# Environment
.env.local
.env.production
```

## 🧪 Testing Strategy

### Development Testing
1. **Web**: Test in browser with notification permission
2. **Android**: Use Firebase Console to send test messages
3. **iOS**: Use APNs provider tools or Xcode simulator

### Production Testing
1. **Internal testing**: TestFlight (iOS) and Internal Testing (Android)
2. **Beta testing**: Limited release to test users
3. **Monitoring**: Set up Firebase Analytics and Crashlytics

## 📊 Analytics Setup

### Firebase Analytics (Recommended)
- Track notification delivery rates
- Monitor user engagement
- A/B test notification timing and content

### Custom Analytics
- Track notification open rates
- Monitor task completion after notifications
- Measure productivity improvements

## 🚀 Deployment Checklist

### Before Production Release:
- [ ] Firebase project configured
- [ ] FCM server key added to backend
- [ ] APNs certificates configured
- [ ] Android app signed and uploaded to Play Store
- [ ] iOS app signed and uploaded to App Store
- [ ] Notification permissions tested on real devices
- [ ] Backend notification service tested with real tokens
- [ ] Analytics tracking implemented
- [ ] Error monitoring configured

Your notification system is code-complete and ready for production once you complete these credential setups!