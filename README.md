# Family Houses

Manage properties & groceries with Next.js, Clerk authentication, and Convex database.

## Features

- Next.js 16 App Router
- Clerk authentication
- Convex real-time database
- Styling with [Tailwind CSS](https://tailwindcss.com)
- Components with [shadcn/ui](https://ui.shadcn.com/)
- Internationalization (English & Japanese)
- Dark/Light/System theme support

## Setup

### 1. Clone and install dependencies

```bash
npm install
```

### 2. Set up Convex

Create a Convex project at [dashboard.convex.dev](https://dashboard.convex.dev) and run:

```bash
npx convex dev
```

This will prompt you to log in and create a project. It will also generate the Convex URL.

### 3. Configure Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_CLERK_SECRET_KEY

# Convex Database
NEXT_PUBLIC_CONVEX_URL=YOUR_CONVEX_URL
```

Get your Clerk keys from the [Clerk Dashboard](https://dashboard.clerk.com/).
Get your Convex URL from the [Convex Dashboard](https://dashboard.convex.dev/).

### 4. Run the development server

In one terminal, start the Convex dev server:

```bash
npx convex dev
```

In another terminal, start the Next.js dev server:

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm run start
```

## Database Schema

The app uses Convex for storing:

- `profiles` - User profiles (linked to Clerk user IDs)
- `properties` - House/property information
- `groceryItems` - To-do/grocery lists per property
- `propertyItems` - Inventory items per property
- `propertyNotes` - Notes per property

## Real-time Updates

Convex provides real-time subscriptions out of the box. The grocery items, property items, and property notes components will automatically update when data changes.

## License

MIT
