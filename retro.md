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
