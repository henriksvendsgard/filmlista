# **Filmlista**

A simple watch list application with authentication and shared lists built on Next.js 14 with TypeScript, Tailwind CSS, Shadcn UI components, and Supabase for backend services.

## **Project Overview**

Filmlista is a web application for tracking movies and TV shows you've watched or want to watch. It allows you to:

- Create and manage lists of movies and TV shows
- Share lists with friends
- Track what you've watched
- Discover new content based on popularity and recommendations
- See where movies and TV shows are available to stream

## **Features**

### **Core Functionality:**

- **Personal Watchlists:** Create, manage, and delete your own movie/TV show watchlists
- **Sharing and Collab:** Share your watchlists with other users and collaborate
- **Movie Search:** Search for movies or TV shows and see where they can be streamed
- **Watchlist Management:** Add and remove movies and TV shows from specific watchlists
- **Tracking:** Mark movies and TV shows as watched in your watchlists
- **Discovery:** Browse and find new movies and TV shows to watch

## **Tech Stack**

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Shadcn UI
- **Backend:** Supabase (Authentication, Database, Storage)
- **APIs:** TMDB (The Movie Database) for movie and TV show information

## **Getting Started**

### **Prerequisites**

- Node.js 20.9 or higher
- npm or yarn
- Supabase account
- TMDB API key
- Docker (for local Supabase development)

### **Installation**

1. Clone the repository:

    ```bash
    git clone https://github.com/henriksvendsgard/filmlista.git
    ```

2. Navigate to the project directory:

    ```bash
    cd filmlista
    ```

3. Install dependencies:

    ```bash
    npm install
    # or
    yarn install
    ```

4. Set up environment variables:

    - Copy `.env.example` to `.env.local`
    - Fill in the required environment variables (see Environment Variables section)

5. Run the development server:

    ```bash
    npm run dev
    # or
    yarn dev
    ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

### **Environment Variables**

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
TMDB_API_KEY=your_tmdb_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

See `.env.example` for more details.

### **Local Database Setup**

To avoid using the production database during development, you can set up a local Supabase instance using Docker:

1. Install the Supabase CLI:

    ```bash
    npm install -g supabase
    ```

2. Start a local Supabase instance:

    ```bash
    supabase start
    ```

    This will create a local Supabase instance with all the necessary services (PostgreSQL, Auth, Storage, etc.).

3. The CLI will output local connection details. Update your `.env.local` file with these values:

    ```
    NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
    ```

4. Initialize your database schema:

    ```bash
    supabase db reset
    ```

    This will apply all migrations in the `supabase/migrations` directory to your local database.

5. (Optional) Seed your database with test data:

    ```bash
    # If you have a seed script
    supabase db seed
    ```

6. Access the local Supabase Studio at http://localhost:54323 to manage your database, authentication, and storage.

You should create a test user in Supabase Studio (http://127.0.0.1:54323) (Authentication tab -> Add user -> Create new user), with auto-confirm toggled, because no email provider is set up locally.

When you're done developing, you can stop the local instance:

```bash
supabase stop
```

### **Database Migrations**

When making changes to your database schema:

1. Create a new migration:

    ```bash
    supabase migration new your_migration_name
    ```

2. Edit the generated SQL file in `supabase/migrations/`.

3. Apply the migration to your local database:

    ```bash
    supabase db reset
    ```

4. When ready to deploy, push the migrations to your production Supabase instance using their dashboard or CLI.

### **Production database migrations**

When opening a PR or deploying to production, apply pending migrations to the production Supabase project:

```bash
# Link your production project once
supabase link --project-ref <your-project-ref>

# Push all migrations from supabase/migrations/
supabase db push
```

Recent migrations include:

- `20240708120000_add_streaming_services.sql` — streaming service preferences on profiles
- `20240708130000_tighten_rls.sql` — stricter row-level security policies
- `20240708140000_add_provider_ids_cache.sql` — cached TMDB provider IDs on media items
- `20240708150000_fix_lists_insert_returning.sql` — fix list SELECT/INSERT policies after RLS tightening
- `20240709120000_add_shared_lists_can_edit.sql` — add `can_edit` column to `shared_lists` (required for list fetching)

**Important:** List fetching and creation in production depend on all of the above migrations. If `tighten_rls` is applied without the later fixes, authenticated users may be unable to read or create lists.

Verify migrations in the Supabase dashboard under **Database → Migrations** after pushing.

### **Deployment**

The application is deployed at [https://www.filmlista.no](https://www.filmlista.no), and can be installed as a Progressive Web App (PWA) for the best experience.

## **Development**

### **Scripts**

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint to check code quality
- `npm run test:e2e` - Run Playwright smoke tests (requires dev server)

## **Project Structure**

- `/src/app` - Next.js app router pages and layouts
- `/src/components` - Reusable UI components
- `/src/lib` - Utility libraries and configuration
- `/src/hooks` - Custom React hooks
- `/src/types` - TypeScript type definitions
- `/supabase` - Supabase migrations and configuration

## **Contributing**

Contributions are welcome! Please feel free to submit a Pull Request.

## **Acknowledgements**

- My brother, my girlfriend, and friends for testing and contributions
- [TMDB](https://www.themoviedb.org/) for providing the movie data API
- [Supabase](https://supabase.io/) for the backend infrastructure
- [Shadcn UI](https://ui.shadcn.com/) for the component library

## **License**

This project is licensed under the MIT License.
