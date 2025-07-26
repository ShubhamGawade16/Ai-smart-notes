# Google OAuth Setup for Supabase

## Quick Setup Steps

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add these URLs to **Authorized redirect URIs**:
   ```
   https://humafgsbdqaiidnprkzx.supabase.co/auth/v1/callback
   ```
7. Copy your **Client ID** and **Client Secret**

### 2. Supabase Configuration
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `humafgsbdqaiidnprkzx`
3. Go to **Authentication** → **Providers**
4. Find **Google** and click the toggle to enable it
5. Enter your Google **Client ID** and **Client Secret**
6. Click **Save**

### 3. Test Authentication
1. Try clicking "Continue with Google" on the login page
2. You should be redirected to Google OAuth
3. After successful login, you'll be redirected back to the app

## Troubleshooting

If you get errors:
- Check that the redirect URI exactly matches in Google Cloud Console
- Ensure both Client ID and Secret are correctly entered in Supabase
- Make sure the Google OAuth consent screen is configured

## Current Project Details
- Supabase Project: `humafgsbdqaiidnprkzx`
- Required Redirect URI: `https://humafgsbdqaiidnprkzx.supabase.co/auth/v1/callback`