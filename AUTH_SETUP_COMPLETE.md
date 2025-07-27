# Complete Authentication Setup Guide

## Overview

Smart To-Do AI uses Supabase for authentication with Google OAuth integration. This guide provides step-by-step instructions to set up cross-platform Gmail authentication with proper redirection.

## Current Status

✅ **Completed Components:**
- Enhanced landing page with detailed insights and testimonials
- Improved authentication callback with better error handling and user feedback
- Cross-platform redirect configuration for mobile and web
- Comprehensive error messaging for authentication failures

## Step-by-Step Setup

### 1. Supabase Project Configuration

1. **Access Your Supabase Dashboard:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Your project ID: `humafgsbdqaiidnprkzx`
   - Project URL: `https://humafgsbdqaiidnprkzx.supabase.co`

2. **Verify Environment Variables:**
   - ✅ `VITE_SUPABASE_URL` - Already configured
   - ✅ `VITE_SUPABASE_ANON_KEY` - Already configured

### 2. Google Cloud Console Setup

1. **Create OAuth 2.0 Client:**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client IDs**
   - Choose **Web application**

2. **Configure Authorized Redirect URIs:**
   Add these exact URLs to **Authorized redirect URIs**:
   ```
   https://humafgsbdqaiidnprkzx.supabase.co/auth/v1/callback
   ```

3. **Copy Credentials:**
   - Copy your **Client ID** (starts with numbers, ends with `.apps.googleusercontent.com`)
   - Copy your **Client Secret** (random string)

### 3. Supabase Authentication Provider Setup

1. **Enable Google Provider:**
   - In Supabase Dashboard → **Authentication** → **Providers**
   - Find **Google** and toggle it **ON**
   - Enter your Google **Client ID** and **Client Secret**
   - Click **Save**

2. **Configure Site URL:**
   - In **Authentication** → **URL Configuration**
   - Set **Site URL** to your Replit domain
   - Add redirect URLs for both development and production

### 4. Cross-Platform Configuration

**For Web Applications:**
- Redirect URL: `https://[your-replit-domain]/auth/callback`
- The callback page handles authentication state and redirects appropriately

**For Mobile (Capacitor) Applications:**
- The same callback URL works for mobile through the webview
- Custom URL scheme can be added later if needed

### 5. Testing Authentication

1. **Test Google Sign-In:**
   - Click "Continue with Google" on the login page
   - You should be redirected to Google OAuth consent screen
   - After authorization, you'll return to the app

2. **Verify User Flow:**
   - New users are directed to onboarding
   - Returning users go to the main dashboard
   - Authentication state persists across sessions

## Enhanced Features

### Improved Callback Handling
- Real-time status updates (loading, success, error)
- Detailed error messages with specific guidance
- Automatic redirection based on onboarding completion
- Toast notifications for user feedback

### Better Error Handling
- Specific error messages for different failure types
- Configuration guidance for administrators
- Fallback navigation for failed authentication attempts

### Cross-Platform Compatibility
- Works on desktop browsers
- Compatible with mobile webviews
- Capacitor integration ready
- Proper URL handling for all platforms

## Troubleshooting

### Common Issues:

**"Provider not found" Error:**
- Ensure Google provider is enabled in Supabase
- Verify Client ID and Secret are correctly entered

**"Invalid redirect URI" Error:**
- Check that redirect URI exactly matches in Google Cloud Console
- Ensure no trailing slashes in URLs

**"Authentication service not configured" Error:**
- Verify environment variables are set correctly
- Restart the application after adding variables

### Quick Fixes:

1. **Clear browser cache and cookies**
2. **Check browser console for detailed error messages**
3. **Verify Google OAuth app is not in testing mode**
4. **Ensure Supabase project is not paused**

## Production Deployment

When deploying to production:

1. Update Google OAuth redirect URIs with production domain
2. Update Supabase Site URL and redirect URLs
3. Ensure environment variables are set in production environment
4. Test authentication flow in production environment

## Security Notes

- Supabase anon key is safe to be public (designed for client-side use)
- JWT tokens are automatically handled by Supabase
- Row Level Security (RLS) policies protect user data
- Authentication state is securely managed

## Next Steps

After authentication setup is complete:

1. Test the complete user journey: Landing → Login → Onboarding → Dashboard
2. Verify user data persistence across sessions
3. Test on different devices and browsers
4. Configure any additional OAuth providers if needed

---

**Status:** Ready for testing and production use
**Last Updated:** January 27, 2025
**Contact:** Development team for any configuration issues