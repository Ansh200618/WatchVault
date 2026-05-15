# WatchVault

React/Vite frontend with a Node.js/Express backend for movie, TV, anime, ratings, and streaming-provider data.

## Setup

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
npm --prefix backend install
```

Backend secrets live in `backend/.env`. Use `backend/.env.example` as the safe template if you need to recreate the file.

## Run

Start the backend:

```bash
npm run dev:backend
```

Start the frontend in another terminal:

```bash
npm run dev
```

The frontend dev server proxies `/api` requests to `http://localhost:5000`.

## Verify

```bash
npm run test:backend
npm run build
```

Useful backend checks:

```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/status
curl http://localhost:5000/api/media/popular
```
