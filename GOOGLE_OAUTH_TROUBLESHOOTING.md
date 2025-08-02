# Google OAuth Setup Instructions

The Google OAuth error occurs because we need to properly configure the OAuth provider in Supabase. Here's how to fix it:

## 1. Configure Google OAuth in Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/humafgsbdqaiidnprkzx
2. Navigate to **Authentication > Providers**
3. Find **Google** in the list and click to configure it
4. Enable Google provider
5. You'll need to create a Google OAuth app first

## 2. Create Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client IDs**
5. Configure the OAuth consent screen first if needed
6. For Application type, choose **Web application**
7. Add these redirect URIs:
   - `https://humafgsbdqaiidnprkzx.supabase.co/auth/v1/callback`
   - `https://58b4a0e9-b742-4897-8d84-5e0499fa7064-00-emk88i8uomeu.spock.replit.dev/auth/callback`

## 3. Configure Supabase with Google Credentials

1. Copy the **Client ID** and **Client Secret** from Google Console
2. In Supabase dashboard under Authentication > Providers > Google:
   - Paste the Client ID
   - Paste the Client Secret
   - Enable the provider
3. Save the configuration

## 4. Update Environment Variables

Add these to your `.env` file:
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## 5. Test the Integration

After completing the setup:
1. Try the Google OAuth login again
2. It should redirect properly through Google's consent screen
3. Then redirect back to your application

## Common Issues

- **403 Error**: Usually means the OAuth app isn't properly configured
- **Redirect URI mismatch**: Make sure all redirect URIs are added in Google Console
- **Invalid client**: Client ID/Secret not properly configured in Supabase

## Alternative: Email/Password Authentication

If Google OAuth setup is complex, you can use email/password authentication which should work immediately with Supabase without additional configuration.