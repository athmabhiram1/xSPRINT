# Xthlete Backend API

Backend API for the Xthlete Smart Tournament Engine using Node.js, Express, TypeScript, Prisma, and NeonDB.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file with your NeonDB connection strings (already configured):
```env
DATABASE_URL="your-neon-pooled-connection-string"
DIRECT_URL="your-neon-direct-connection-string"
PORT=5000
NODE_ENV=development
```

### 3. Database Setup

Generate Prisma Client:
```bash
npm run db:generate
```

Push schema to database (development):
```bash
npm run db:push
```

Or create a migration:
```bash
npm run db:migrate
```

Open Prisma Studio to view/edit data:
```bash
npm run db:studio
```

### 4. Test Database Connection
```bash
npx ts-node src/test-db.ts
```

## Development

Start the development server with hot reload:
```bash
npm run dev
```

## Build & Production

Build TypeScript to JavaScript:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## Database

- **Provider**: PostgreSQL (NeonDB)
- **ORM**: Prisma 7.0
- **Adapter**: @prisma/adapter-pg (standard PostgreSQL driver)
- **Schema**: `prisma/schema.prisma`

## Tech Stack

- Node.js + TypeScript
- Express.js
- Prisma ORM
- NeonDB (PostgreSQL)
- dotenv for environment variables
