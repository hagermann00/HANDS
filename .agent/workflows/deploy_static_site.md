---
description: Deploy static website to GitHub Pages or Netlify
---

# Deploy Static Site

## Prerequisites
- Static site files ready (HTML, CSS, JS)
- Git repository initialized
- GitHub account or Netlify account

## Option A: GitHub Pages

// turbo
1. Create gh-pages branch:
```bash
git checkout -b gh-pages
```

2. Ensure index.html is in root

// turbo
3. Push to GitHub:
```bash
git push origin gh-pages
```

4. Enable GitHub Pages in repo settings:
   - Go to Settings → Pages
   - Source: Deploy from branch
   - Branch: gh-pages, / (root)

5. Access site at: `https://<username>.github.io/<repo-name>/`

## Option B: Netlify CLI

// turbo
1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Login to Netlify:
```bash
netlify login
```

// turbo
3. Deploy site:
```bash
netlify deploy --prod --dir=.
```

## Option C: Netlify Drag & Drop
1. Go to https://app.netlify.com/drop
2. Drag your site folder
3. Get instant URL

## Success Criteria
- Site accessible via public URL
- All assets loading correctly
- HTTPS enabled
