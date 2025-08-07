# Supabase Setup Guide for Planify

## Current Status
- **Supabase URL**: `https://humafgsbdqaiidnprkzx.supabase.co` ✅
- **Anon Key**: Configured ✅
- **Issue**: Network/CORS error during signup

## Required Supabase Configuration Steps

### 1. Authentication Settings
Go to your Supabase project → **Authentication** → **Settings**:

#### Site URL
Set your Site URL to: `https://58b4a0e9-b742-4897-8d84-5e0499fa7064-00-emk88i8uomeu.spock.replit.dev`

#### Additional Redirect URLs
Add these redirect URLs:
```
https://58b4a0e9-b742-4897-8d84-5e0499fa7064-00-emk88i8uomeu.spock.replit.dev/auth/callback
https://58b4a0e9-b742-4897-8d84-5e0499fa7064-00-emk88i8uomeu.spock.replit.dev/auth/verified
https://58b4a0e9-b742-4897-8d84-5e0499fa7064-00-emk88i8uomeu.spock.replit.dev
```

### 2. Email Settings
Go to **Authentication** → **Settings** → **SMTP Settings**:

#### Option A: Use Supabase Built-in SMTP (Recommended for testing)
- Enable "Enable email confirmations"
- This uses Supabase's built-in email service

#### Option B: Custom SMTP (For production)
- Configure your own SMTP settings
- Required fields: SMTP Host, Port, Username, Password

### 3. Database Setup
Go to **Table Editor** and verify you have these tables:

#### Users Table (if using custom user management)
```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Row Level Security (RLS)
Enable RLS and add policies:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own data
CREATE POLICY "Users can read their own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Policy for users to update their own data
CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);
```

### 5. Google OAuth Setup (Optional)
If you want Google sign-in:

1. Go to **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID: `your-google-client-id`
   - Client Secret: `your-google-client-secret`

To get Google OAuth credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://humafgsbdqaiidnprkzx.supabase.co/auth/v1/callback`

## Quick Fix Steps

### Step 1: Update Site URL
1. Go to Supabase Dashboard → Your Project → Settings → Authentication
2. Set **Site URL** to: `https://58b4a0e9-b742-4897-8d84-5e0499fa7064-00-emk88i8uomeu.spock.replit.dev`

### Step 2: Add Redirect URLs
In **Additional Redirect URLs**, add:
```
https://58b4a0e9-b742-4897-8d84-5e0499fa7064-00-emk88i8uomeu.spock.replit.dev/auth/callback
https://58b4a0e9-b742-4897-8d84-5e0499fa7064-00-emk88i8uomeu.spock.replit.dev/auth/verified
```

### Step 3: Enable Email Confirmations
1. Go to Authentication → Settings
2. Toggle "Enable email confirmations" to ON
3. Optionally disable "Enable email signup confirmations" if you want immediate signup

### Step 4: Test Again
Try signing up again after making these changes.

## Common Issues & Solutions

### Network Error (Status 0)
- **Cause**: CORS/redirect URL mismatch
- **Fix**: Ensure Site URL and Redirect URLs are correctly set

### Email Not Sending
- **Cause**: SMTP not configured
- **Fix**: Enable Supabase built-in SMTP or configure custom SMTP

### Sign-up Not Working
- **Cause**: Email confirmations enabled but not configured
- **Fix**: Either configure SMTP or disable email confirmations for testing

## Current Project Configuration
- Project ID: `humafgsbdqaiidnprkzx`
- URL: `https://humafgsbdqaiidnprkzx.supabase.co`
- Current Domain: `https://58b4a0e9-b742-4897-8d84-5e0499fa7064-00-emk88i8uomeu.spock.replit.dev`