# Easy Deployment Guide

## Option 1: Vercel (Recommended - Easiest & Free)

### Steps:
1. **Install Vercel CLI** (one-time setup):
   ```bash
   npm install -g vercel
   ```

2. **Deploy** (from your project folder):
   ```bash
   vercel
   ```

3. **Follow the prompts**:
   - Login with GitHub/Email
   - Confirm project settings (just press Enter)
   - Wait 30 seconds
   - Get your live URL!

4. **Done!** Your app is live at: `https://your-app.vercel.app`

### Update deployment:
```bash
vercel --prod
```

---

## Option 2: Netlify (Also Easy & Free)

### Steps:
1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Build the project**:
   ```bash
   npm run build
   ```

3. **Deploy**:
   ```bash
   netlify deploy
   ```

4. **For production**:
   ```bash
   netlify deploy --prod
   ```

---

## Option 3: GitHub Pages (Free)

### Steps:
1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json scripts**:
   ```json
   "deploy": "npm run build && gh-pages -d dist"
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

4. **Enable GitHub Pages** in your repo settings

---

## Important Notes:

### PeerJS Server:
Since we're using PeerJS cloud server (free), no server deployment needed! The app works out of the box.

### Custom Domain (Optional):
- Vercel: Add custom domain in dashboard
- Netlify: Add custom domain in dashboard
- Both support free SSL certificates

### Environment:
- No environment variables needed
- No database required
- No backend server needed (using PeerJS cloud)

---

## Quick Deploy Commands:

### Vercel (Fastest):
```bash
npm install -g vercel
vercel
```

### Netlify:
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod
```

---

## Your app will be live at:
- Vercel: `https://your-app-name.vercel.app`
- Netlify: `https://your-app-name.netlify.app`
- GitHub Pages: `https://username.github.io/repo-name`

All options are **100% FREE** and include:
✅ HTTPS/SSL
✅ Global CDN
✅ Automatic deployments
✅ Custom domains
