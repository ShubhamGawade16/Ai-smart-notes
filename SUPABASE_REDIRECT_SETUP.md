# Supabase Redirect URL Configuration

## Problem
Email verification links are redirecting to `localhost:3000` instead of the Replit app URL, causing "Unable to connect" errors.

## Solution
You need to configure the correct redirect URLs in your Supabase project dashboard.

## Steps to Fix:

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/humafgsbdqaiidnprkzx

2. **Navigate to Authentication → URL Configuration**

3. **Add these URLs to "Redirect URLs"**:
   - `https://58b4a0e9-b742-4897-8d84-5e0499fa7064-00-emk88i8uomeu.spock.replit.dev/auth/callback`
   - `https://*.replit.dev/auth/callback` (wildcard for future deployments)

4. **Set Site URL** to:
   - `https://58b4a0e9-b742-4897-8d84-5e0499fa7064-00-emk88i8uomeu.spock.replit.dev`

5. **Save the configuration**

## Current Replit URL
Your app is currently running at:
`https://58b4a0e9-b742-4897-8d84-5e0499fa7064-00-emk88i8uomeu.spock.replit.dev`

## After Configuration
- Email verification will work properly
- Users will be redirected to the correct app URL after clicking email links
- No more "localhost:3000" redirect errors

## Test the Flow
1. Sign up with a new email
2. Check your email for verification link
3. Click the link - should redirect to the app dashboard
4. If still redirecting to localhost, double-check the Supabase URL configuration