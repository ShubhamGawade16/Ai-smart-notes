# Detailed Supabase Setup Guide

## Current Issue
Email verification links redirect to `localhost:3000` instead of your app, causing "Unable to connect" errors.

## Step-by-Step Solution

### Step 1: Access Your Supabase Project
1. **Open your browser** and go to: https://supabase.com/dashboard/project/qtdjrdxwfvhcwowebxnm
2. **Log in** to your Supabase account if prompted
3. You should see your project dashboard for project ID: `qtdjrdxwfvhcwowebxnm`

### Step 2: Navigate to Authentication Settings
1. **Look at the left sidebar** in your Supabase dashboard
2. **Click on "Authentication"** (it has a key icon 🔑)
3. **Click on "URL Configuration"** (this is a sub-menu under Authentication)
   - Alternative path: Go to Settings → Authentication → URL Configuration

### Step 3: Configure Redirect URLs
In the URL Configuration page, you'll see several fields:

#### A. Site URL
- **Find the field labeled "Site URL"**
- **Clear any existing URL** and enter: `https://58b4a0e9-b742-4897-8d84-5e0499fa7064-00-emk88i8uomeu.spock.replit.dev`
- This is your main app URL

#### B. Redirect URLs
- **Find the section labeled "Redirect URLs"**
- **Add these URLs one by one** (click "Add URL" for each):

1. `https://58b4a0e9-b742-4897-8d84-5e0499fa7064-00-emk88i8uomeu.spock.replit.dev/auth/callback`
2. `https://*.replit.dev/auth/callback`

### Step 4: Save Configuration
1. **Scroll to the bottom** of the URL Configuration page
2. **Click the "Save" button** (usually green or blue)
3. **Wait for confirmation** that settings were saved

### Step 5: Test Email Authentication
1. **Go back to your app**: https://58b4a0e9-b742-4897-8d84-5e0499fa7064-00-emk88i8uomeu.spock.replit.dev
2. **Click "Sign Up"** 
3. **Fill out the form** with a real email address
4. **Click "Create Account"**
5. **Check your email** for the verification link
6. **Click the verification link** - it should now redirect to your app correctly!

## Visual Guide

### What you're looking for in Supabase Dashboard:

**Left Sidebar:**
```
🏠 Home
📊 Table Editor
🔑 Authentication  ← Click this
   📝 Users
   🔗 URL Configuration  ← Then click this
   📧 Email Templates
   etc...
🛡️ Policies
⚙️ Settings
```

**URL Configuration Page Fields:**
```
Site URL: [text input field]
↓
Redirect URLs: 
[text input 1] [Add URL button]
[text input 2] [Add URL button]
↓
[Save button]
```

## Troubleshooting

### If you can't find "URL Configuration":
1. Try going to **Settings** → **Authentication** instead
2. Look for "Auth" or "Authentication" in the sidebar
3. The URL configuration might be under a different submenu

### If the Save button is grayed out:
1. Make sure all URLs start with `https://`
2. Check that there are no extra spaces in the URL fields
3. Ensure you're logged in with proper permissions

### If emails still redirect to localhost:
1. **Wait 2-3 minutes** after saving (changes take time to propagate)
2. **Try signing up with a different email** address
3. **Clear your browser cache** and try again

## Contact Points
- **Supabase Support**: If you're still stuck, contact Supabase support through their dashboard
- **Project ID**: qtdjrdxwfvhcwowebxnm (mention this in any support requests)