# EduLearn (MERN)

AI-powered study assistant: upload PDFs, chat with AI, generate quizzes, take notes (text + audio), and get YouTube recommendations. Clean, modern UI with light/dark themes using modular CSS.

## Folders
- Backend — Express + MongoDB API
- Frontend — React (Vite) UI with modular CSS

## Quick start

1) Backend

Create `Backend/.env` from `.env.example` and fill values. Then install and start:

```
cd Backend
npm install
npm run dev
```

2) Frontend

```
cd Frontend
npm install
npm run dev
```

Open: http://localhost:5173

## Environment

Backend `.env`:

```
PORT=4000
MONGO_URI=mongodb://localhost:27017/edulearn
OPENAI_API_KEY= # optional, enables LLM summaries
YOUTUBE_API_KEY= # optional, enables real YouTube search
ORIGIN=http://localhost:5173
JWT_SECRET=dev-access-secret
JWT_REFRESH_SECRET=dev-refresh-secret
```

If API keys are not set, the API returns safe mock data so you can develop offline.

## Scripts

- Backend: `npm run dev` starts Nodemon on http://localhost:4000
- Frontend: `npm run dev` starts Vite on http://localhost:5173

## Notes

- Styling uses CSS Modules and theme variables toggled via `<ThemeToggle/>`.
- PDF parsing uses `pdf-parse`; large files are handled on the server and summaries are cached in Mongo.
- Auth uses JWT (access + refresh). Access tokens are returned to the client and attached in the `Authorization` header; refresh tokens are stored as httpOnly cookies scoped to `/api/auth`.
