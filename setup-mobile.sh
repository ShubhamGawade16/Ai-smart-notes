#!/bin/bash

# AI Smart Notes - Mobile Setup Script
# This script sets up the mobile app build environment

echo "🚀 Setting up AI Smart Notes mobile app..."

# Step 1: Build the web app
echo "📦 Building web application..."
npm run build

# Step 2: Initialize Capacitor
echo "📱 Initializing Capacitor..."
npx cap init "AI Smart Notes" "com.aismartnotes.app" --web-dir="dist/public"

# Step 3: Add Android platform
echo "🤖 Adding Android platform..."
npx cap add android

# Step 4: Copy web assets
echo "📋 Copying web assets to native project..."
npx cap copy android

# Step 5: Sync everything
echo "🔄 Syncing project..."
npx cap sync android

echo "✅ Mobile setup complete!"
echo ""
echo "Next steps:"
echo "1. Install Android Studio from https://developer.android.com/studio"
echo "2. Set up Android SDK and environment variables"
echo "3. Run 'npx cap open android' to open in Android Studio"
echo "4. Build APK using Android Studio or Gradle"
echo ""
echo "For detailed instructions, see MOBILE_BUILD_GUIDE.md"