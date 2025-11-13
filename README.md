# Storefront Database
Store Manager simulator. Be an entrepreneur for the day!

## Environment variables and Vercel Blob token

This project uses environment variables for secrets (database URL, tokens). Do NOT commit secrets to the repository. Use the provided `.env.example` as a template.

- Local development: copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
# edit .env and replace placeholders (DATABASE_URL, VERCEL_BLOB_TOKEN)
```

- Production (recommended): set `DATABASE_URL` and `VERCEL_BLOB_TOKEN` in your hosting provider's environment settings (for Vercel, go to Project → Settings → Environment Variables).

### Vercel Blob token
- Create a Vercel Blob token in your Vercel dashboard if you plan to use Vercel's Blob storage.
- Add the token to your Vercel project as an environment variable named `VERCEL_BLOB_TOKEN`.
- Do not paste the token into code or commit the token to the repo. Use environment variables instead.

If `.env` (or any secret) has already been committed, rotate the secret immediately and remove the file from git history. I can provide commands to fully remove a secret from history on request.
