# Micro Survey Project

## Demo

https://ascend-survey-forddyces-projects.vercel.app/

## Table of Contents

- [System Diagram](#system-diagram)
- [Repo Stub](#repo-stub)
- [Development on Local](#development-on-local)
- [Supabase Setup](#supabase-setup)
  - [Setup on Local](#setup-on-local)
  - [Setup on Remote Supabase](#setup-on-remote-supabase)
  - [Supabase Google Auth Setup](#supabase-google-auth-setup)
  - [Upstash Setup (Redis)](#upstash-setup-redis)
- [Github Workflow Setup](#github-workflow-setup)
- [Project Retrospective](#project-retrospective)

---

## System Diagram

![Ascend Survey System Diagram](public/assets/AscendSurveyChart-FordyceGozali.png)

---

## Repo Stub

```
.
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # GitHub Actions CI/CD workflow
├── public/
│   └── assets/                   # Directory for static assets like images
│       └── AscendSurveyChart-FordyceGozali.png # System Diagram Image
│   └── index.html                # Public HTML file (Vite entry)
├── src/
│   ├── components/
│   │   ├── LoginPage.tsx         # Login component
│   │   └── LoginPage.test.tsx    # Vitest tests for LoginPage
│   ├── contexts/
│   │   └── SupabaseContext.ts    # Supabase React Context
│   ├── services/
│   │   └── supabaseService.ts    # Supabase client and auth functions
│   ├── types/                    # TypeScript type definitions (optional)
│   │   └── index.ts
│   ├── App.tsx                   # Main React App component with routing
│   ├── main.tsx                  # React entry point
│   └── setupTests.ts             # Vitest test setup (e.g., for @testing-library/jest-dom)
├── supabase/
│   ├── config.toml               # Supabase CLI configuration
│   ├── migrations/
│   │   └──YYYYMMDDHHMMSS_initial_schema.sql # Database migration file
│   └── functions/
│       └── submit-survey/        # Supabase Edge Function directory
│           ├── index.ts          # Edge Function source code (with Redis logic)
│       └── _shared/              # Shared utilities for Edge Functions
│           └── cors.ts           # CORS headers utility
├── .env.example                  # Example environment variables (for local dev)
├── .eslintrc.json                # ESLint configuration for code linting
├── .gitignore                    # Specifies intentionally untracked files
├── .prettierrc.json              # Prettier configuration for code formatting
├── package.json                  # Node.js project metadata and scripts
├── tsconfig.json                 # TypeScript configuration for the React app
├── tsconfig.node.json            # TypeScript configuration for Node environment
└── vercel.json                   # Vercel deployment configuration (e.g., disable auto-deploy)
├── README.md                     # Project README (this file)
└── retro.md                      # Project Retrospective
```

---

## Development on Local

If you want to run the project locally for development:

1.  **Clone this repository** and navigate into the project directory.
2.  **Install project dependencies:**
    ```bash
    npm install
    ```
3.  **Set up Supabase locally** (see [Setup on Local](#setup-on-local) section below).
4.  **Copy environment variables:** Copy the `env.example` file to `.env.local`.
    ```bash
    cp .env.example .env.local
    ```
5.  **Configure `.env.local`:** Update the values in `.env.local` according to your local Supabase setup (especially `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Vite requires variables to be prefixed with `VITE_`).
    - Example `.env.local`:
      ```
      VITE_SUPABASE_URL="[http://127.0.0.1:54321](http://127.0.0.1:54321)"
      VITE_SUPABASE_ANON_KEY="your-local-anon-key-from-supabase-start"
      ```
6.  **Run the development server:**
    ```bash
    npm run dev
    ```

---

## Supabase Setup

### Setup on Local

To run a local Supabase environment:

1.  **Ensure Docker is Installed and Running:** Supabase relies on Docker to run its services (PostgreSQL, Auth, Storage, etc.). Make sure Docker Desktop (for macOS/Windows) or Docker Engine (for Linux) is installed and running on your machine.
2.  **Install Supabase CLI locally (if not already in `package.json` dev dependencies):**
    ```bash
    npm install -D supabase
    ```
3.  **Initialize Supabase (if setting up for the first time):**
    Inside your project's root directory:
    ```bash
    npx supabase init
    ```
    This creates the `supabase/` directory structure.
4.  **Start Local Supabase Services:**
    ```bash
    npx supabase start
    ```
    Once started, you will see output with the default local URLs:
    ```
    API URL: [http://127.0.0.1:54321](http://127.0.0.1:54321)
    DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
    Studio URL: [http://127.0.0.1:54323](http://127.0.0.1:54323) (Access Supabase Studio UI here)
    Inbucket URL: [http://127.0.0.1:54324](http://127.0.0.1:54324) (For viewing email confirmations during local auth testing)
    ```
    Make note of the API URL and the **anon key** shown in the `supabase start` output (it's part of the `SUPABASE_ANON_KEY` for your local instance).

### Setup on Remote Supabase

To configure your project with a remote Supabase instance for deployment:

1.  **Create a Supabase Project:** If you don't have one, create a new project in the [Supabase Dashboard](https://supabase.com/dashboard).
2.  **Generate a Supabase Personal Access Token (PAT):**
    Go to [Supabase Dashboard > Account > Access Tokens](https://supabase.com/dashboard/account/tokens) and create a new token. This token will be used by the Supabase CLI in your CI/CD pipeline.
3.  **Link your local project to your remote Supabase project:**
    ```bash
    npx supabase link --project-ref <YOUR_SUPABASE_PROJECT_ID>
    ```
    (Your `SUPABASE_PROJECT_ID` is found in your Supabase project URL: `https://supabase.com/dashboard/project/{id}`).
    You'll be prompted for your `SUPABASE_ACCESS_TOKEN` (the PAT you generated in step 2).
4.  **Deploy Supabase Edge Functions:**
    ```bash
    npx supabase functions deploy submit-survey --no-verify-jwt
    ```
    This uploads the `submit-survey` function from `supabase/functions/submit-survey/index.ts`.
5.  **Apply Database Migrations:**
    ```bash
    npx supabase db push
    ```
    This applies any new `.sql` migration files from `supabase/migrations/` to your remote database.

### Supabase Google Auth Setup

To enable Google OAuth for authentication:

1.  **Configure Google Cloud Project:**
    - **Create OAuth Client ID:** Navigate to the [Google Cloud Console](https://console.cloud.google.com/) and go to "APIs & Services" > "Credentials".
    - Click "+ Create credentials" and select "OAuth client ID".
    - **Application Type:** Choose "Web application".
    - **Name:** Give your application a descriptive name (e.g., "Supabase Micro Survey Google Auth").
    - **Authorized JavaScript origins:** Add your deployed Supabase URL (e.g., `https://[your-project-ref].supabase.co`) and any custom domains for your frontend (e.g., `https://survey.yourcompany.com`). Also, include `http://localhost:5173` for local development.
    - **Authorized redirect URIs:** Add the Supabase OAuth callback URL. This is crucial for Google to redirect users back correctly.
      - `https://[your-project-ref].supabase.co/auth/v1/callback`
      - `http://localhost:5173/auth/callback` (for local development)
      - `https://[your-vercel-project-name].vercel.app/auth/callback` (for your main Vercel deployment)
      - `https://*-<your-vercel-org-or-account-slug>.vercel.app/auth/callback` (for Vercel preview deployments – replace with your actual slug)
      - `https://your-custom-domain.com/auth/callback` (if applicable)
    - **Copy Credentials:** After creation, copy the generated **Client ID** and **Client Secret**.

2.  **Configure Supabase Project:**
    - **Enable Google Provider:** In your Supabase dashboard, go to "Authentication" > "Providers" and enable Google.
    - **Paste Credentials:** Paste the **Client ID** and **Client Secret** obtained from Google Cloud Console into the respective fields in Supabase.
    - **Save Changes:** Click "Save" to apply the settings.
    - **URL Configuration:** Go to "Authentication" > "URL Configuration". Under "Redirect URLs", add all the `http://localhost`, Vercel, and custom domain URLs (including the `/**` wildcard for sub-paths) where your app might be accessed for redirects:
      ```
      http://localhost:5173/
      http://localhost:5173/**
      https://[your-vercel-project-name].vercel.app/
      https://[your-vercel-project-name].vercel.app/**
      https://*-<your-vercel-org-or-account-slug>.vercel.app/
      https://*-<your-vercel-org-or-account-slug>.vercel.app/**
      [https://your-custom-domain.com/](https://your-custom-domain.com/)
      [https://your-custom-domain.com/](https://your-custom-domain.com/)**
      ```
      _(Remember to replace placeholders like `[your-vercel-project-name]` and `<your-vercel-org-or-account-slug>` with your actual values.)_

### Upstash Setup (Redis)

To integrate Redis for rate limiting in your Edge Functions:

1.  **Create an Upstash Account/Project:** Go to <https://upstash.com/>, create a free account, and then create a new Redis database.

2.  **Note Connection Details:** Take note of the `Host`, `Port`, and `Password` (or `Token`) provided by Upstash for your Redis instance.

3.  **Add Redis Environment Variables to Supabase Edge Function:**
    - In your Supabase Dashboard, navigate to **Edge Functions**.

    - Select the `submit-survey` function.

    - Click on the **"Secrets"** tab (usually on the left-hand side).

    - Add the following secrets with the values from Upstash:
      - `REDIS_HOST`

      - `REDIS_PORT`

      - `REDIS_PASSWORD` (or `REDIS_TOKEN` depending on how your client library is configured to use it)

## Github Workflow Setup

Configure your GitHub Actions secrets to enable CI/CD. Go to your GitHub repository > **Settings** > **Secrets and variables** (left-hand side) > **Actions**. Create these repository secrets:

- **`SUPABASE_ACCESS_TOKEN`**: Your Supabase Personal Access Token.

- **`SUPABASE_PROJECT_REF`**: Your Supabase project ID (e.g., `abcdefghij12345`, found in your Supabase project URL `https://supabase.com/dashboard/project/{id}`).

- **`SUPABASE_URL`**: Your Supabase project API URL (e.g., `https://abcdefg.supabase.co`, found in Project Settings > API).

- **`SUPABASE_ANON_KEY`**: Your Supabase project's public anonymous key (found in Project Settings > API).

- **`SUPABASE_DB_PASSWORD`**: The database password for your `postgres` user in Supabase (found in Project Settings > Database > Database Passwords). This is crucial for `supabase db push`.

- **`VERCEL_TOKEN`**: Your Vercel API Token (generate this in Vercel Dashboard -> Account Settings -> Tokens).

- **`VERCEL_ORG_ID`**: Your Vercel Organization ID (found in Vercel project settings, if you're deploying under a team).

- **`VERCEL_PROJECT_ID`**: Your Vercel Project ID (found in Vercel project settings).

**Important Note on `GITHUB_TOKEN` Permissions:**
The `deploy-frontend` job in your `ci-cd.yml` pipeline (using `amondnet/vercel-action`) requires elevated permissions for the default `GITHUB_TOKEN` to update deployment statuses, comments on PRs, etc. Ensure your workflow explicitly grants these permissions (e.g., `contents: write`, `deployments: write`, `pull-requests: write`, `statuses: write`) in the `permissions` block of that job.

## Project Retrospective

### What went well:

- Initial setup of Vite, React, and Tailwind CSS was smooth.
- Integration with Supabase (Auth, Database, Edge Functions) was successful.
- The implementation of Vitest for frontend testing is a solid foundation.
- Setting up the basic CI/CD pipeline on GitHub Actions for linting, testing, and deployment.

### Could improve:

- More proactive identification and resolution of environment-specific issues (e.g., Supabase redirect URLs, GITHUB_TOKEN permissions).
- Clarity in documentation regarding Deno-specific environment variables for Edge Functions.
- Better initial understanding of Vercel's automatic deployment behavior when integrating with GitHub Actions. (stuck here the most)

### Next bets:

- Develop the core survey creation and management features for admin. (more field types? custom dropdown?)
- Implement the public-facing survey response UI.
- Explore more advanced rate-limiting strategies in Redis if needed.

### Open risks:

- Scalability of the PostgreSQL function for atomic submissions under very high load.
- Robustness of IP-based rate limiting against sophisticated bot attacks (consider user based limits for authenticated actions).
- Ongoing maintenance of CI/CD secrets and environment variables.
- Potential for complex UI state management as the application grows.
