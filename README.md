# Development on Local

If just want to run the project on local. Download this repo and do `npm install`.

After doing the supabase setup below. Copy the `env.sample` to `.env`, change the values according to your supabase setup, then you can run `rpm run dev`.

# Supabase Setup

Create Supabase account if not have already. Then setup supabase to your machine: (get your access token from your supabase account (https://supabase.com/dashboard/account/tokens))

`export SUPABASE_ACCESS_TOKEN=""` // if using ubuntu, may vary according to your OS, just make sure your path variable is correct

`npx supabase init`

install supabase cli (if your machine don't have global one):

`npm install supabase -D`

setup supabase edge functions:

`npx supabase functions deploy submit-survey --no-verify-jwt`

migrate the db:

`npx supabase db push`

## Supabase Google Auth Setup

1. Configure Google Cloud Project:

- Create OAuth Client ID: Navigate to the Google Cloud Console and go to "APIs & Services" > "Credentials".
- Create Credentials: Click "+ Create credentials" and select "OAuth client ID".
- Application Type: Choose "Web application".
- Name: Give your application a name (e.g., "Supabase Google Auth").
- Authorized JavaScript origins: Add your Supabase project URL (e.g., https://[your-project-ref].supabase.co).
- Authorized redirect URIs: Add https://[your-project-ref].supabase.co/auth/v1/callback.
- Copy Credentials: After creating the credentials, copy the generated Client ID and Client Secret.

2. Configure Supabase Project:

- Enable Google Provider: In your Supabase dashboard, go to "Authentication" > "Providers" and enable Google.
- Paste Credentials: Paste the Client ID and Client Secret obtained from the Google Cloud Console into the respective fields in Supabase.
- Save Changes: Click "Save" to apply the settings.
- Go to Authentication > URL Configuration.
- Add these url for the redirect urls (vercel url will change depending on your vercel URL):

```
http://localhost:5173/
http://localhost:5173/**
https://[yourdomain].vercel.app/
https://[yourdomain].vercel.app/**
```

## Upstash Setup

- Go to https://upstash.com/, create a free account and project
- Select Redis as type.
- Take note of the host, port, and token.
- Go to your edge functions in Supabase. Select the `submit-survey` function.
- On left-hand side, click Secrets.
- Add `REDIS_HOST`, `REDIS_PASSWORD`, and `REDIS PORT` values.

# Github Workflow setup

Go to your github repo > settings > secrets and variables (left hand side) > actions. Create these secrets:

- SUPABASE_ACCESS_TOKEN: Your Personal Access Token from Supabase.
- SUPABASE_PROJECT_REF: Your Supabase project ID (e.g., abcdefghij12345, from your supabase project url https://supabase.com/dashboard/project/{id}).
- SUPABASE_URL: Your Supabase project URL (e.g., https://abcdefg.supabase.co).
- SUPABASE_ANON_KEY: Your Supabase project's public anon key.
- VERCEL_TOKEN: Your Vercel API Token (generate in Vercel Dashboard -> Settings -> Tokens).
- VERCEL_ORG_ID: Your Vercel Organization ID (found in Vercel project settings, this is teams).
- VERCEL_PROJECT_ID: Your Vercel Project ID (found in Vercel project settings)
