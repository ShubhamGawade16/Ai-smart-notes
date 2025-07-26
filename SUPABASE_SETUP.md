# Supabase Setup Guide for AI Smart Notes

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `ai-smart-notes`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project" and wait for setup to complete (~2 minutes)

## Step 2: Get Project Credentials

1. In your Supabase dashboard, go to **Settings > API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Project API Keys > anon public**: `eyJhbGciOiJIUzI1NiIs...`
   - **Connection string**: Go to Settings > Database, copy "Connection string" under "Connection pooling"

## Step 3: Configure Google OAuth

1. Go to **Authentication > Providers** in your Supabase dashboard
2. Click on **Google** provider
3. Toggle **Enable Google provider** to ON
4. You'll need Google OAuth credentials:

### Get Google OAuth Credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API:
   - Go to **APIs & Services > Library**
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth 2.0 Client IDs**
   - Application type: **Web application**
   - Name: `AI Smart Notes`
   - Authorized redirect URIs: `https://your-project-id.supabase.co/auth/v1/callback`

5. Copy the **Client ID** and **Client Secret**
6. Back in Supabase, paste these into the Google provider settings
7. Set redirect URL to: `https://your-replit-domain/auth/callback`
8. Click **Save**

## Step 4: Add Environment Variables to Replit

1. In your Replit project, click the **Secrets** tab (lock icon in sidebar)
2. Add these secrets:

```
VITE_SUPABASE_URL = https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY = your_anon_key_here
DATABASE_URL = your_supabase_connection_string
```

## Step 5: Set Up Database Tables

The app will automatically create the necessary tables when you first run it. The schema is defined in `shared/schema.ts`.

## Step 6: Test Authentication

1. Restart your Replit application
2. Navigate to `/login`
3. Click "Continue with Google"
4. You should be redirected to Google OAuth
5. After approval, you'll be redirected back to your app

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**: Make sure the redirect URI in Google Console exactly matches your Supabase callback URL
2. **"Missing environment variables"**: Double-check all secrets are added in Replit
3. **Database connection errors**: Verify the DATABASE_URL is correct and includes password

### Check Setup:
- Supabase project is created and running
- Google OAuth is enabled with correct credentials
- All environment variables are set in Replit Secrets
- Application restarts successfully

## Security Notes

- Never commit `.env` files or expose API keys
- Use Replit Secrets for all sensitive information
- The anon key is safe to use in frontend code
- Database policies will be handled by your backend authentication

## Next Steps

Once authentication is working:
1. Test user registration and login flow
2. Verify user data syncs to your backend
3. Test tier management and AI features
4. Configure any additional OAuth providers if needed