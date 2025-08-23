# Environment Variables Guide

This document explains all environment variables used in the application and how to configure them for different environments.

## Required Variables

### VITE_SUPABASE_URL

**Description**: The URL of your Supabase project API endpoint.

**Format**: `https://[project-id].supabase.co`

**How to get this value**:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the **Project URL** from the "Config" section

**Example**: `https://abcdefghijklmnop.supabase.co`

### VITE_SUPABASE_ANON_KEY

**Description**: The anonymous/public API key for your Supabase project. This key is safe to use in client-side code as it only allows operations permitted by your Row Level Security (RLS) policies.

**Format**: Long base64-encoded string starting with `eyJ`

**How to get this value**:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the **anon public** key from the "Project API keys" section

**Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Optional Variables

### VITE_APP_ENV

**Description**: Specifies the current application environment. Used for environment-specific behavior and debugging.

**Allowed Values**:
- `development` - Local development environment
- `staging` - Staging/preview environment
- `production` - Production environment

**Default**: `development` (if not specified)

**Usage in code**:
```typescript
const isProduction = import.meta.env.VITE_APP_ENV === 'production';
const isDevelopment = import.meta.env.VITE_APP_ENV === 'development';
```

## Local Development Setup

1. **Copy the example file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your Supabase credentials**:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_APP_ENV=development
   ```

3. **Restart your development server**:
   ```bash
   npm run dev
   ```

## Vercel Deployment Setup

### Method 1: Vercel Dashboard

1. Go to your project in the [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: Your Supabase project URL
   - **Environments**: Select Production, Preview, and Development as needed
4. Repeat for `VITE_SUPABASE_ANON_KEY` and `VITE_APP_ENV`
5. Redeploy your application

### Method 2: Vercel CLI

```bash
# Add environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_APP_ENV

# Deploy with environment variables
vercel --prod
```

### Method 3: vercel.json Configuration

```json
{
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "VITE_APP_ENV": "production"
  }
}
```

*Note: Use Vercel's secret management for sensitive values with the `@` prefix.*

## Environment-Specific Configurations

### Development
```env
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-anon-key
VITE_APP_ENV=development
```

### Staging
```env
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key
VITE_APP_ENV=staging
```

### Production
```env
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
VITE_APP_ENV=production
```

## Security Considerations

### Safe to Expose (Client-Side)
- ✅ `VITE_SUPABASE_URL` - Public API endpoint
- ✅ `VITE_SUPABASE_ANON_KEY` - Public key with RLS protection
- ✅ `VITE_APP_ENV` - Environment identifier

### Never Expose (Server-Side Only)
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - Full database access (not used in this app)
- ❌ Database passwords or connection strings
- ❌ Third-party API secrets

### Important Notes

1. **Vite Prefix**: All client-side environment variables must start with `VITE_` to be accessible in the browser.

2. **RLS Protection**: The `VITE_SUPABASE_ANON_KEY` is safe to expose because Supabase uses Row Level Security (RLS) policies to control data access.

3. **Environment Files**: Never commit `.env.local`, `.env`, or any file containing actual secrets to version control.

4. **Build Time**: Environment variables are embedded at build time, so changes require a rebuild/redeploy.

## Troubleshooting

### Common Issues

**"Failed to connect to Supabase"**
- Verify `VITE_SUPABASE_URL` is correct and accessible
- Check that your Supabase project is active

**"Invalid API key"**
- Verify `VITE_SUPABASE_ANON_KEY` is the correct anon/public key
- Ensure the key hasn't been regenerated in Supabase

**"Environment variable not found"**
- Ensure the variable name starts with `VITE_`
- Restart your development server after adding new variables
- Check that the variable is defined in your environment

### Debugging

```typescript
// Check if environment variables are loaded
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('App Environment:', import.meta.env.VITE_APP_ENV);
// Never log the anon key in production!
```

## References

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)