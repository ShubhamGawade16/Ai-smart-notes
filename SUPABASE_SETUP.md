# Supabase Setup Guide for AI Smart Notes

This guide will walk you through setting up Supabase with Google OAuth for your AI Smart Notes application.

## Prerequisites

- A Google account for Supabase
- A Google Cloud Console account for OAuth setup

## Step 1: Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign up or log in with your Google account
3. Click **"New Project"**
4. Fill in the project details:
   - **Name**: `ai-smart-notes` (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose the closest region to your users
5. Click **"Create new project"**
6. Wait 2-3 minutes for the project to be created

## Step 2: Get Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public** key (under "Project API Keys")

✅ These have been added to your Replit secrets already!

## Step 3: Set Up Google OAuth

### 3.1 Create Google OAuth App

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" and enable it
4. Create OAuth credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**
   - Choose **"Web application"**
   - Add authorized redirect URIs:
     ```
     https://[your-supabase-project-id].supabase.co/auth/v1/callback
     ```
     (Replace `[your-supabase-project-id]` with your actual project ID from the URL)

### 3.2 Configure Supabase Auth

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and toggle it **ON**
3. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
4. Click **"Save"**

### 3.3 Configure Redirect URLs

In Supabase Authentication settings, add these redirect URLs:
- `https://[your-replit-url]/auth/callback`
- `http://localhost:3000/auth/callback` (for local development)

## Step 4: Database Schema Setup

Your database tables will be created automatically when users first sign up. The app uses:

- `users` - User profiles synced from Google OAuth
- `tasks` - User tasks and todos
- `notes` - User notes and content
- `ai_insights` - AI-generated productivity insights

## Step 5: Test Authentication

1. Go to your Replit app
2. Click **"Continue with Google"** on the login page
3. You should be redirected to Google OAuth
4. After authorization, you'll be redirected back to your app dashboard

## Security Notes

- Keep your Supabase anon key public-facing (it's designed to be)
- Never expose your service role key
- The app uses Row Level Security (RLS) for data protection
- All API calls are authenticated via Supabase JWT tokens

## Troubleshooting

### Issue: "Invalid redirect URL"
- Check that your redirect URLs match exactly in both Google Console and Supabase
- Ensure no trailing slashes

### Issue: "Provider not enabled"
- Verify Google provider is enabled in Supabase Authentication settings
- Check that Client ID and Secret are correctly entered

### Issue: Authentication not working
- Check browser console for errors
- Verify environment variables are set correctly in Replit
- Ensure your Google OAuth app is published (not in testing mode)

## Production Deployment

When deploying to production:

1. Update Google OAuth redirect URLs with your production domain
2. Update Supabase redirect URLs
3. Ensure environment variables are set in your production environment
4. Consider upgrading your Supabase plan for higher usage limits

## Support

For issues with this setup:
- Check Supabase documentation: https://supabase.com/docs
- Google OAuth documentation: https://developers.google.com/identity/protocols/oauth2
- Open an issue in your project repository

---

🎉 **Congratulations!** Your AI Smart Notes app now has secure Google authentication powered by Supabase!