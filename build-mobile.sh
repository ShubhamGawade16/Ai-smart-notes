#!/bin/bash

echo "🚀 GPT Do Mobile Build Script"
echo "========================================="

# Step 1: Build the web app
echo "📦 Building web application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Web build failed"
    exit 1
fi

# Step 2: Sync to Capacitor
echo "🔄 Syncing to mobile platforms..."
npx cap sync

if [ $? -ne 0 ]; then
    echo "❌ Capacitor sync failed"
    exit 1
fi

echo "✅ Mobile app ready!"
echo ""
echo "🎯 Next Steps:"
echo "1. PWA (Recommended): Deploy to Replit and install as PWA on your phone"
echo "2. APK Build: Open Android Studio and build APK"
echo "   - Run: npx cap open android"
echo "   - In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)"
echo ""
echo "📱 Your app is mobile-optimized and ready to test!"