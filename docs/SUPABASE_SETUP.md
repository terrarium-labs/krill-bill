# Supabase Integration Guide for Krill Bill

This guide walks you through setting up Supabase for Krill Bill with proper authentication and free-tier data storage.

## Prerequisites

- Supabase account (free tier)
- Cloudflare Pages deployment (where your frontend is hosted)
- Node.js and npm installed locally

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up or log in
2. Click "New Project" and enter:
   - **Project Name**: `krill-bill` (or your preference)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Select closest to your users (e.g., EU-West-1 for Europe)
   - **Pricing Plan**: Select "Free" (includes 500MB storage, perfect for invoicing)
3. Wait for project to be created (2-5 minutes)

## Step 2: Get Your Credentials

1. In your Supabase dashboard, go to **Settings → API**
2. Copy these values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Publishable Anon Key** → `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Create a `.env.local` file in project root with:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

## Step 3: Enable Authentication Providers

### Enable Email/Password Auth (Built-in)
1. Go to **Authentication → Providers**
2. Email Provider should already be enabled
3. Optionally set:
   - Enable "Confirm email" for better security
   - Set auto-confirm on (for free tier, good UX)

### Enable Google OAuth (Recommended for Free Tier)

**Best option**: Use Google as it's free and works immediately.

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project: "Krill Bill"
3. Go to **OAuth consent screen**:
   - User type: External
   - Fill in app name, support email, etc.
   - Add scopes: `email`, `profile`
   - Add test users (your email)
4. Go to **Credentials**:
   - Create OAuth 2.0 Client ID (Web Application)
   - Authorized redirect URIs:
     ```
     https://your-project-id.supabase.co/auth/v1/callback
     https://yourdomain.pages.dev/auth/callback
     http://localhost:5175/auth/callback
     ```
   - Copy Client ID and Client Secret
5. In Supabase **Authentication → Providers → Google**:
   - Enable Google
   - Paste Client ID and Secret
   - Save

### Optional: Azure/Microsoft OAuth

1. Go to [Azure Portal](https://portal.azure.com)
2. Register an application
3. Add redirect URIs (same as Google above)
4. In Supabase, enable Azure provider with credentials

## Step 4: Database Setup

The database schema is already created via migrations. Verify tables exist:

1. Go to **SQL Editor** in Supabase
2. Run:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

Should see: `invoices`, `clients`, `providers`, `serial_numbers`, `user_profiles`

## Step 5: Row Level Security (RLS)

All tables have RLS policies enabled automatically. This means:

- ✅ Users can ONLY see their own data
- ✅ Users cannot access other users' invoices/clients/providers
- ✅ All queries automatically filtered by `auth.uid()`
- ✅ No sensitive data leaks possible

To verify RLS is working:
1. Go to **Authentication → Policies**
2. Each table should show multiple policies (SELECT, INSERT, UPDATE, DELETE)

## Step 6: Set Redirect URLs in Supabase

1. Go to **Authentication → URL Configuration**
2. Set:
   - **Site URL**: `https://yourdomain.pages.dev` (your Cloudflare Pages domain)
   - **Redirect URLs**:
     ```
     https://yourdomain.pages.dev
     https://yourdomain.pages.dev/dashboard
     https://yourdomain.pages.dev/settings
     ```

## Step 7: Local Development

1. Clone `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Add your Supabase credentials:
```bash
VITE_SUPABASE_URL=https://your-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

3. Start development server:
```bash
npm run dev
```

4. Test auth:
   - Go to http://localhost:5175/login
   - Try email/password signup
   - Try Google OAuth (should redirect back)

## Step 8: Deploy to Cloudflare Pages

1. Push to GitHub
2. In Cloudflare Pages:
   - Connect GitHub repo
   - Build command: `npm run build`
   - Build output: `dist`
3. In project settings → Environment:
   - Add same environment variables as `.env.local`
4. Deploy!

## Free Tier Limits

The free Supabase tier includes:

| Feature | Limit | Note |
|---------|-------|------|
| Storage | 500 MB | Plenty for invoicing app (each invoice ~1KB) |
| Database Connections | 5 | Adequate for single frontend |
| Bandwidth | 5 GB/month | Sufficient for most users |
| Auth Users | Unlimited | Free user signups |
| RLS | Enabled | All queries secure |
| Backups | Automatic | Daily backups included |

**Example capacity**: 500 MB can store ~500,000 invoices with metadata!

## API Usage

### Authentication
```tsx
import { useAuth } from '@/auth/AuthContext';

const { user, session, signIn, signUp, loginWithGoogle, signOut } = useAuth();
```

### Fetching Data
```tsx
import { fetchInvoices, createInvoice, updateInvoice, deleteInvoice } from '@/api/invoices';
import { fetchClients, createClient, updateClient, deleteClient } from '@/api/clients';
import { fetchUserProfile, updateUserProfile } from '@/api/user';

// Fetch all invoices (automatically filtered by current user)
const { data: invoices } = await fetchInvoices();

// Create invoice (automatically sets user_id)
const { data: newInvoice } = await createInvoice({
    client_id: 'uuid',
    invoice_number: 'INV-001',
    invoice_type: 'sales',
    issue_date: '2026-05-13',
    due_date: '2026-06-13',
    amount: 100.00,
    currency: 'EUR',
    status: 'draft'
});
```

### User Profile
```tsx
// Fetch user company info
const { data: profile } = await fetchUserProfile();

// Update company settings
const { data: updated } = await updateCompanyInfo({
    business_name: 'Acme Inc',
    currency: 'EUR',
    country: 'ES'
});
```

## Troubleshooting

### OAuth redirect not working?
- Check Site URL in Authentication → URL Configuration
- Verify redirect URI exactly matches (no trailing slash differences)
- Clear browser cookies and try again

### Can't see data after login?
- Check browser console for auth token
- Verify RLS policies in Supabase → Authentication → Policies
- Ensure user_id matches in tables

### Getting "insufficient permissions" errors?
- User might not have proper role - check Supabase logs
- Refresh browser and try again
- Check that RLS policies are properly configured

### Storage limit concerns?
- Monitor usage in **Storage → Usage** dashboard
- Free tier auto-throttles at 500MB (doesn't delete)
- Upgrade plan if needed ($25/month adds 100GB+)

## Next Steps

1. ✅ Users can sign up and authenticate
2. ✅ Invoices are stored securely per user
3. ✅ Clients/Providers linked to user company
4. ✅ All data encrypted in transit (HTTPS/SSL)
5. ✅ Automatic daily backups included

### Optional Enhancements

- Add email notifications for invoice due dates (Supabase Edge Functions)
- Generate PDF invoices (Supabase Storage for files)
- Set up webhook for Stripe payments
- Create admin dashboard for analytics

## Support

- [Supabase Docs](https://supabase.com/docs)
- [Krill Bill GitHub](https://github.com/yourusername/krill-bill)
- [Supabase Discord](https://discord.supabase.io)
