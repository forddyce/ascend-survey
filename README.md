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
- [Marginal Costs](#marginal-costs)
- [Performance Budget And Measurement Methods](#performance-budget-and-measurement-methods)

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

## Marginal Costs

1.  **Supabase (Database Rows & Operations)**:

Supabase has a tiered pricing model (Free, Pro, Team, Enterprise). Your costs are primarily determined by:

- **Database Size (Rows/Disk Usage)**: This is the total storage consumed by your tables and indexes.

  Marginal Cost: On paid plans (Pro and above), you get an included amount of disk space (e.g., 8 GB on Pro). Beyond this, you pay per GB (e.g., $0.125 per GB).

- **Monthly Active Users (MAU)**: For authentication.

  Marginal Cost: After an included MAU quota (e.g., 100,000 on Pro), you pay per additional MAU (e.g., $0.00325 per MAU).

- **Edge Function Invocations**: Each call to your submit-survey Edge Function.

  Marginal Cost: After an included invocation quota (e.g., 2 million on Pro), you pay per additional million invocations (e.g., $2 per million).

- **Realtime Message Count & Peak Connections**: If you implement real-time features (like live vote updates).

  Marginal Cost: Billed per million messages and per 1,000 peak connections beyond included quotas.

- **Egress (Bandwidth)**: Data transfer out from your database or storage.

  Marginal Cost: After an included bandwidth quota, you pay per GB.

- **Compute:** The underlying server resources for your Postgres database. On paid plans, you have dedicated compute, and you can scale this up for better performance, which incurs additional costs.

2.  **Upstash (Redis Operations)**:

Upstash Redis instances also have different pricing models (Free, Pay-as-you-go, Fixed Plans, Prod Pack, Enterprise). Your primary cost drivers for your rate limiter will be:

- **Commands (Requests):** Every INCR or EXPIRE command sent to Redis is counted.

  Marginal Cost: On the "Pay-as-you-go" plan, after the Free Tier's 500K commands/month, you typically pay per 100K requests (e.g., $0.20 per 100K requests). Fixed plans include a certain request per second (RPS) limit.

- **Storage:** The amount of data stored in Redis.

  Marginal Cost: Beyond the free tier (256MB), you pay per GB (e.g., $0.25/GB for pay-as-you-go). For a rate limiter, storage usage is usually minimal unless you store large amounts of data per key or have a massive number of unique IPs to track.

- **Bandwidth:** Data transfer in and out of Redis.

  Marginal Cost: The "Pay-as-you-go" plan includes a certain amount of free bandwidth (e.g., 200GB), then charges per additional GB.

# Performance Budget And Measurement Methods

### 1. Frontend Performance (React App on Vercel)

These budgets focus on the user's experience in the browser.

**Recommended Budgets:**

- **Loading Performance (Core Web Vitals):**
  - **Largest Contentful Paint (LCP):** < 2.5 seconds (measures perceived load speed)
  - **First Contentful Paint (FCP):** < 1.8 seconds (measures when first content is drawn)
- **Interactivity Performance (Core Web Vitals):**
  - **Interaction to Next Paint (INP):** < 200 ms (measures overall responsiveness to user input)
  - _(Note: INP is replacing FID as a Core Web Vital in March 2024)_
  - **Total Blocking Time (TBT):** < 200 ms (measures CPU blocking during loading)
- **Visual Stability (Core Web Vitals):**
  - **Cumulative Layout Shift (CLS):** < 0.1 (measures unexpected layout shifts)
- **Bundle Size:**
  - **JavaScript Bundle Size (Gzipped):** < 200 KB (for the initial load, smaller is always better)
  - **CSS Bundle Size (Gzipped):** < 50 KB

**Measurement Methods:**

- **Development & Debugging:**
  - **Chrome DevTools (Lighthouse Tab):** Run audits directly in your browser. Provides detailed reports on Core Web Vitals and suggestions for improvement.
  - **Chrome DevTools (Performance Tab):** Record runtime performance to identify slow renders, long tasks, and layout shifts.
  - **React DevTools:** Helps identify re-renders and component performance issues.
- **Pre-deployment / CI/CD Integration:**
  - **Lighthouse CI:** Integrate Lighthouse audits into your GitHub Actions pipeline (`.github/workflows/ci-cd.yml`). This ensures performance regressions are caught before deployment. You can set budget thresholds that fail the build if not met.
  - **Webpack Bundle Analyzer (or equivalent for Vite):** Use a tool to visualize your JavaScript bundle composition and identify large dependencies that could be trimmed.
  - **WebPageTest:** A more advanced tool for synthetic testing from various locations and network conditions. Can be automated.
- **Production Monitoring (Real User Monitoring - RUM):**
  - **Google Search Console (Core Web Vitals Report):** Provides field data from real users.
  - **Vercel Analytics / Speed Insights:** Vercel offers built-in analytics that include performance metrics.
  - **Google Analytics / custom RUM solutions:** Collect real-user data on performance metrics.

---

### 2. Backend Performance (Supabase & Upstash)

These budgets focus on the speed and efficiency of your server-side operations and data stores.

#### **2.1. Supabase Database (PostgreSQL)**

**Recommended Budgets:**

- **Query Latency (P95):** < 100 ms for critical read/write operations (e.g., fetching a survey, inserting a submission). P95 means 95% of queries should be faster than this.
- **Database CPU Usage:** Average < 60%, Peak < 90% (sustained).
- **Database Memory Usage:** Average < 70%, Peak < 90% (sustained).
- **Active Connections:** Keep within Supabase's recommended pooler limits (e.g., < 400 for standard plans).
- **Disk I/O:** Monitor for high read/write IOPS, which can indicate inefficient queries or insufficient indexing.

**Measurement Methods:**

- **Supabase Dashboard:**
  - **"Usage" / "Billing & Usage":** Provides aggregate data on database size, egress, and function invocations.
  - **"Database" > "Reports" / "Metrics":** Offers charts for CPU, memory, disk usage, active connections, and query performance (requires `pg_stat_statements` enabled).
- **Supabase CLI (`supabase inspect db`):**
  - `supabase inspect db long-running-queries`: Identify slow queries.
  - `supabase inspect db unused-indexes`: Find indexes that aren't being used.
  - `supabase inspect db cache-hit`: Check database cache efficiency.
  - `supabase inspect db table-sizes` / `index-sizes`: Monitor data and index growth.
- **SQL Queries in Supabase Studio:**
  - `EXPLAIN ANALYZE <your_query>;`: Analyze the execution plan and cost of specific SQL queries to optimize them.
  - Query `pg_stat_statements` (if enabled in database settings) for top queries by execution time, calls, etc.
- **Postgres Logs:** Supabase provides access to Postgres logs, which can reveal slow queries, errors, and connection issues.

#### **2.2. Supabase Edge Functions (`submit-survey`)**

**Recommended Budgets:**

- **Invocation Latency (P95):**
  - **Cold Start:** < 500 ms (initial invocation after inactivity).
  - **Warm Start:** < 100 ms (subsequent invocations).
- **Error Rate:** < 0.5% (percentage of invocations resulting in an error).
- **Memory Usage:** Stay well within the allocated memory limit (e.g., < 128 MB or 256 MB depending on Supabase's allocation).
- **Execution Duration:** The actual time the Deno code runs (aim for low milliseconds).

**Measurement Methods:**

- **Supabase Dashboard (`Edge Functions` section):**
  - Shows total invocations and average execution time for each function.
  - Provides access to function logs, where you can see detailed output, errors, and cold start warnings.
- **Custom Logging:** Implement detailed logging within your Edge Function (`console.log`) to track specific operation durations (e.g., Redis calls, database RPC calls) and error messages. These logs will appear in the Supabase Edge Function logs.

#### **2.3. Upstash Redis (Rate Limiter)**

**Recommended Budgets:**

- **Command Latency (P95):** < 5 ms (for `INCR` and `EXPIRE` commands). Redis is extremely fast, so this should be very low.
- **Throughput:** Handle your expected commands per second (e.g., 5-10 commands/second per active IP). Ensure you stay within your plan's RPS limits.
- **Keyspace Size:** Monitor the number of keys. For a rate limiter, it should correlate with the number of unique IPs accessing your service within the rate limit window. Keep it manageable.
- **Memory Usage:** For the rate limiter, this should be very low (few MBs).

**Measurement Methods:**

- **Upstash Console Dashboard:**
  - **"Metrics and Charts":** Provides real-time graphs for:
    - **Throughput:** Commands per second (reads, writes, total). This directly shows your rate limiter's activity.
    - **Service Time Latency:** Latency statistics (mean, max, percentiles) for Redis commands.
    - **Data Size / Keyspace:** Tracks the number of keys and total memory consumed.
    - **Daily Cost:** Gives you a direct view of the cost impact.
- **Redis `MONITOR` Command (for debugging):** While not for production monitoring, you can temporarily use this through an external Redis client to see all commands hitting your Redis instance in real-time.
