Vercel deployment notes
=======================

Quick static restore
- This project contains a static admin UI in `admin.html`. To get the storefront back on Vercel quickly, we added `vercel.json` and an `index.html` redirect so Vercel serves `admin.html` at `/`.

Recommended production approach
- Frontend (static UI): Host on Vercel (static files). Keep `admin.html`, `script.js`, `style.css` in the repo root.
- Backend (API + uploads + Prisma): Host on a Node-friendly platform (Render, Railway, Fly) that supports long-running Node processes and persistent disk or cloud storage for uploads.

Why split the two
- Vercel serverless functions are ephemeral and not ideal for long-lived DB connections, disk uploads via `multer`, or Prisma connection pooling. Hosting the backend on a service that supports persistent Node servers avoids runtime issues.

Deploy steps (fast)
1. From project root, deploy frontend to Vercel (if connected to GitHub, push the `main` branch). Or run:

```bash
# install/vercel CLI if not present
npx vercel --prod
```

2. Deploy backend to Render/Railway/Fly:
- Create a new service, set `NODE_ENV=production`, `DATABASE_URL` environment variable, and run `npm install && npm run start` (or `node server.js`).

3. Update frontend API base URLs in `script.js` to point to the hosted backend URL (e.g. `https://api.example.com/api/products`).

If you want, I can:
- Patch `script.js` to read the API base from an environment variable replacement at build time, and add a small README snippet for deploying the backend on Render.
- Convert the API to Vercel serverless functions and replace disk uploads with Cloudinary/S3 (this is a larger migration).
