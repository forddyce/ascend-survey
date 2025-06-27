## Supabase Setup

init supabase to your machine: (get your access token from your supabase account (https://supabase.com/dashboard/account/tokens))
`export SUPABASE_ACCESS_TOKEN=""`

setup supabase edge functions:
`npx supabase functions deploy submit-survey --no-verify-jwt`

## Github CI/CD setup
Go to your github repo > settings > secrets and variables (left hand side) > actions. Create 4 secrets:
- SUPABASE_ACCESS_TOKEN: Your Personal Access Token from Supabase.
- SUPABASE_PROJECT_REF: Your Supabase project ID (e.g., abcdefghij12345, from your supabase project url https://supabase.com/dashboard/project/{id}).
- SUPABASE_URL: Your Supabase project URL.
- SUPABASE_ANON_KEY: Your Supabase project's public anon key.
- VERCEL_TOKEN: Your Vercel API Token (generate in Vercel Dashboard -> Settings -> Tokens).
- VERCEL_ORG_ID: Your Vercel Organization ID (found in Vercel project settings).
- VERCEL_PROJECT_ID: Your Vercel Project ID (found in Vercel project settings)