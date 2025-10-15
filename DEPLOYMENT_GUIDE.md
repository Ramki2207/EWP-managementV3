# Deployment Guide - EWP Management Application

## ✅ Pre-Deployment Checklist

The application is ready to deploy! The following has been completed:

- ✅ Production build created in `/dist` directory
- ✅ Environment variables configured in `.env`
- ✅ Netlify configuration file created (`netlify.toml`)
- ✅ Redirects configured for SPA routing
- ✅ Supabase database connected and configured
- ✅ Client portal download functionality fixed

## 🚀 Deployment to Netlify

You have two options to deploy to Netlify:

### Option 1: Deploy via Netlify Dashboard (Recommended)

1. **Login to Netlify**
   - Go to https://app.netlify.com
   - Sign in with your account

2. **Create New Site**
   - Click "Add new site" → "Import an existing project"
   - OR click "Sites" → "Add new site" → "Deploy manually"

3. **Deploy the Built Application**
   - If deploying manually: Drag and drop the entire `dist` folder
   - If connecting to Git: Connect your repository and Netlify will auto-deploy

4. **Configure Environment Variables**
   - Go to Site settings → Environment variables
   - Add the following variables from your `.env` file:
     ```
     VITE_SUPABASE_URL=https://zgcbynprsfbhnskarxnp.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnY2J5bnByc2ZiaG5za2FyeG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5OTAxODAsImV4cCI6MjA2MzU2NjE4MH0.qen3uxz0Tm03SBlVOG_ks61qbAmCpr5vvDcuPyoTzwI
     ```

5. **Configure Custom Domain**
   - Go to Site settings → Domain management
   - Click "Add custom domain"
   - Enter: `ewp-management.nl`
   - Follow the DNS configuration instructions
   - Netlify will automatically provision an SSL certificate

### Option 2: Deploy via Netlify CLI

If you prefer using the command line:

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Deploy to Production**
   ```bash
   netlify deploy --prod --dir=dist
   ```

4. **Configure Environment Variables**
   ```bash
   netlify env:set VITE_SUPABASE_URL "https://zgcbynprsfbhnskarxnp.supabase.co"
   netlify env:set VITE_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnY2J5bnByc2ZiaG5za2FyeG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5OTAxODAsImV4cCI6MjA2MzU2NjE4MH0.qen3uxz0Tm03SBlVOG_ks61qbAmCpr5vvDcuPyoTzwI"
   ```

## 🔧 Post-Deployment Configuration

### 1. Update DNS Settings for ewp-management.nl

Configure your domain DNS settings to point to Netlify:

- **A Record**: Point to Netlify's load balancer IP (provided by Netlify)
- **CNAME Record**: Point `www` to your Netlify subdomain

Netlify will provide specific DNS settings in the dashboard.

### 2. Verify SSL Certificate

- Netlify automatically provisions SSL certificates via Let's Encrypt
- Wait 1-2 minutes after DNS configuration
- Verify HTTPS is working: https://ewp-management.nl

### 3. Test Client Portal Links

- The client portal URLs will now use the production domain
- Format: `https://ewp-management.nl/client-portal/{access-code}`
- Test document downloads to ensure storage access works

### 4. Update Supabase Allowed Origins (if needed)

If you encounter CORS issues:

1. Go to Supabase Dashboard
2. Navigate to Settings → API
3. Under "Site URL", add: `https://ewp-management.nl`
4. Under "Additional Redirect URLs", add: `https://ewp-management.nl/**`

## 📋 Continuous Deployment (Optional)

To enable automatic deployments when you push changes:

1. **Connect Git Repository**
   - In Netlify dashboard: Site settings → Build & deploy
   - Link your GitHub/GitLab/Bitbucket repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - These are already configured in `netlify.toml`

3. **Enable Auto-Deploy**
   - Netlify will automatically build and deploy on every push to main branch

## ✅ Verification Checklist

After deployment, verify the following:

- [ ] Site loads at https://ewp-management.nl
- [ ] Login page works correctly
- [ ] Dashboard loads after login
- [ ] Projects and distributors data loads from Supabase
- [ ] Client portal access works with test access code
- [ ] Document downloads work from client portal
- [ ] SSL certificate is valid (green padlock in browser)
- [ ] All routes work correctly (no 404 errors on refresh)

## 🆘 Troubleshooting

### Issue: Site shows 404 errors on refresh
**Solution**: Verify `_redirects` file is in the `dist` directory

### Issue: Environment variables not working
**Solution**:
- Verify variables are set in Netlify dashboard
- Variable names must start with `VITE_` for Vite apps
- Rebuild and redeploy after adding variables

### Issue: Database connection fails
**Solution**:
- Check Supabase URL and anon key are correct
- Verify Supabase project is not paused
- Check browser console for specific errors

### Issue: Document downloads fail
**Solution**:
- Verify Supabase storage bucket "documents" is public
- Check CORS configuration in Supabase
- Ensure files have been uploaded correctly

## 📞 Support

For deployment issues, check:
- Netlify Status: https://www.netlifystatus.com/
- Supabase Status: https://status.supabase.com/
- Project logs in Netlify dashboard

## 🎉 You're Ready to Deploy!

Your application is fully built and ready for production. Follow the steps above to deploy to Netlify and make it available at https://ewp-management.nl.
