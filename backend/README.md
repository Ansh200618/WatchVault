# WatchVault Backend

Express API for WatchVault. It provides local app endpoints plus proxy routes for external media APIs so API keys stay out of the frontend bundle.

## Run

```bash
npm install
npm run dev
```

Production start:

```bash
npm start
```

## Environment

Create `backend/.env` from `backend/.env.example` and fill in the real keys:

- `OMDB_API_KEY`
- `TMDB_API_KEY`
- `TMDB_READ_ACCESS_TOKEN`
- `WATCHMODE_API_KEY`
- `PORT`
- `CORS_ORIGINS`

AniList and Jikan are public and do not need keys.

## Endpoints

- `GET /api/health`
- `GET /api/status`
- `GET /api/media/popular`
- `GET /api/media/search?q=<query>&kind=<movie|tv|anime>`
- `GET /api/media/:id`
- `GET /api/upcoming`
- `GET /api/user/library`
- `POST /api/user/library`
- `PATCH /api/user/library/:mediaId`
- `DELETE /api/user/library/:mediaId`
- `GET /api/omdb?<params>`
- `GET /api/tmdb/<endpoint>?<params>`
- `POST /api/anilist`
- `GET /api/jikan/<endpoint>?<params>`
- `GET /api/watchmode/<endpoint>?<params>`

## Test

```bash
npm test
```
