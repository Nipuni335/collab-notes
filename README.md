# NoteCollab — Collaborative Note-Taking App
### Production-Ready MERN Stack Application

---

## 📁 Project Structure

```
collab-notes/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection (Atlas-compatible)
│   ├── controllers/
│   │   ├── authController.js      # register, login, logout, me
│   │   └── noteController.js      # CRUD + search + collaborators
│   ├── middleware/
│   │   ├── auth.js                # JWT verify (cookie + Bearer)
│   │   ├── noteAuth.js            # requireAccess / requireOwner
│   │   └── errorHandler.js        # Centralised error shape
│   ├── models/
│   │   ├── User.js                # bcrypt pre-save hook
│   │   └── Note.js                # text index, collaborators
│   ├── routes/
│   │   ├── auth.js
│   │   └── notes.js
│   ├── validators/
│   │   └── authValidators.js      # express-validator rules
│   ├── .env.example
│   ├── package.json
│   └── server.js                  # Express entry point
│
└── frontend/
    ├── public/index.html
    ├── src/
    │   ├── components/
    │   │   ├── common/
    │   │   │   └── ProtectedRoute.jsx
    │   │   ├── editor/
    │   │   │   └── NoteEditor.jsx  # React Quill + auto-save
    │   │   ├── layout/
    │   │   │   └── Sidebar.jsx
    │   │   └── notes/
    │   │       └── CollaboratorModal.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── NotesContext.jsx
    │   ├── hooks/
    │   │   └── useAutoSave.js
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   └── DashboardPage.jsx
    │   ├── services/
    │   │   └── api.js             # Axios instance + endpoints
    │   ├── App.jsx
    │   ├── index.js
    │   └── index.css
    ├── tailwind.config.js
    ├── postcss.config.js
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB (local) or MongoDB Atlas account
- npm ≥ 9

### 1 — Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGO_URI, JWT_SECRET, CLIENT_ORIGIN

npm install
npm run dev        # nodemon, port 5000
```

### 2 — Frontend Setup

```bash
cd frontend
npm install
npm start          # CRA dev server, port 3000
```

The frontend proxies `/api` to `http://localhost:5000` via `"proxy"` in package.json.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable          | Description                                  | Example                          |
|-------------------|----------------------------------------------|----------------------------------|
| `PORT`            | Express port                                 | `5000`                           |
| `NODE_ENV`        | `development` or `production`                | `development`                    |
| `MONGO_URI`       | MongoDB connection string                    | `mongodb://localhost:27017/collab_notes` |
| `JWT_SECRET`      | Random secret for signing JWTs (32+ chars)   | `s3cr3t_change_me`               |
| `JWT_EXPIRES_IN`  | Token lifespan                               | `7d`                             |
| `COOKIE_SECURE`   | `true` in production (HTTPS only)            | `false`                          |
| `COOKIE_SAME_SITE`| `lax` local, `none` cross-origin             | `lax`                            |
| `CLIENT_ORIGIN`   | Allowed CORS origins (comma-separated)       | `http://localhost:3000`          |

### Frontend (`frontend/.env`)

| Variable               | Description             | Default   |
|------------------------|-------------------------|-----------|
| `REACT_APP_API_URL`    | API base URL            | `/api`    |

---

## 🗄️ MongoDB Schema

### User
```js
{
  name:      String (required, max 60),
  email:     String (required, unique, lowercase),
  password:  String (hashed, bcrypt 12 rounds, select: false),
  avatar:    String (URL),
  createdAt, updatedAt
}
```

### Note
```js
{
  title:         String (max 200, default "Untitled Note"),
  content:       String (HTML, sanitised by DOMPurify server-side),
  owner:         ObjectId → User (indexed),
  collaborators: [ObjectId → User],
  isArchived:    Boolean (default false),
  color:         String (hex, default #ffffff),
  createdAt, updatedAt
}

// Text index (full-text search):
{ title: "text", content: "text" }
// Weights: title × 10, content × 3
```

---

## 🛣️ REST API Reference

All routes prefixed with `/api`.

### Auth

| Method | Endpoint           | Auth | Description              |
|--------|--------------------|------|--------------------------|
| POST   | `/auth/register`   | —    | Create account           |
| POST   | `/auth/login`      | —    | Login, set cookie        |
| POST   | `/auth/logout`     | —    | Clear cookie             |
| GET    | `/auth/me`         | ✅   | Current user profile     |
| PUT    | `/auth/me`         | ✅   | Update name / avatar     |

### Notes

| Method | Endpoint                              | Auth | Access       | Description              |
|--------|---------------------------------------|------|--------------|--------------------------|
| GET    | `/notes`                              | ✅   | All accessible| List notes               |
| POST   | `/notes`                              | ✅   | Authenticated | Create note              |
| GET    | `/notes/search?q=keyword`             | ✅   | All accessible| Full-text search         |
| GET    | `/notes/:id`                          | ✅   | Owner/Collab  | Get single note          |
| PUT    | `/notes/:id`                          | ✅   | Owner/Collab  | Update note              |
| DELETE | `/notes/:id`                          | ✅   | Owner only    | Delete note              |
| POST   | `/notes/:id/collaborators`            | ✅   | Owner only    | Add collaborator         |
| DELETE | `/notes/:id/collaborators/:userId`    | ✅   | Owner only    | Remove collaborator      |

---

## 📮 Postman Testing Guide

### Setup
1. Create a Postman **collection**: `NoteCollab`
2. Create a **variable**: `baseUrl = http://localhost:5000/api`
3. Set **Cookie Jar** enabled (Settings → Send cookies)

---

### Step 1 — Register

```
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "password": "Password1"
}
```

**Expected 201:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": { "_id": "...", "name": "Alice Smith", "email": "alice@example.com" }
}
```

> Copy the `token` value → set Postman collection variable `token = <value>`

---

### Step 2 — Login

```
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "Password1"
}
```

---

### Step 3 — Authenticated requests

Add to **Headers**:
```
Authorization: Bearer {{token}}
```

**Get current user:**
```
GET {{baseUrl}}/auth/me
```

---

### Step 4 — Create a note

```
POST {{baseUrl}}/notes
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "title": "My First Note",
  "content": "<p>Hello <strong>world</strong></p>",
  "color": "#fef9c3"
}
```

**Expected 201:**
```json
{
  "success": true,
  "note": {
    "_id": "note_id_here",
    "title": "My First Note",
    "content": "<p>Hello <strong>world</strong></p>",
    "owner": { ... },
    "collaborators": [],
    ...
  }
}
```

> Copy `note._id` → set variable `noteId`

---

### Step 5 — Update a note

```
PUT {{baseUrl}}/notes/{{noteId}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "<p>Updated content with <em>italic</em></p>"
}
```

---

### Step 6 — Full-text search

```
GET {{baseUrl}}/notes/search?q=italic
Authorization: Bearer {{token}}
```

**Returns:** Notes ranked by text relevance score.

---

### Step 7 — Add collaborator

First register Bob:
```
POST {{baseUrl}}/auth/register
{ "name": "Bob Jones", "email": "bob@example.com", "password": "Password1" }
```

Then Alice adds Bob:
```
POST {{baseUrl}}/notes/{{noteId}}/collaborators
Authorization: Bearer {{aliceToken}}
Content-Type: application/json

{ "email": "bob@example.com" }
```

---

### Step 8 — Remove collaborator

```
DELETE {{baseUrl}}/notes/{{noteId}}/collaborators/{{bobUserId}}
Authorization: Bearer {{aliceToken}}
```

---

### Step 9 — Delete note

```
DELETE {{baseUrl}}/notes/{{noteId}}
Authorization: Bearer {{token}}
```

---

### Common Error Responses

| Scenario                        | Status | Message                              |
|---------------------------------|--------|--------------------------------------|
| Missing/invalid token           | 401    | Not authenticated — no token         |
| Expired token                   | 401    | Session expired — please log in again|
| Non-owner tries to delete       | 403    | Only the owner can perform this action|
| Note not found                  | 404    | Note not found                       |
| Email already registered        | 409    | Email already registered             |
| Validation failure              | 422    | Validation failed + errors array     |
| Rate limit exceeded             | 429    | Too many requests, slow down         |
| Invalid ObjectId in URL         | 400    | Invalid _id: <value>                 |

---

## 🔒 Security Architecture

### Authentication
- **bcrypt** (12 rounds) hashes passwords before storage
- `select: false` on password field — never returned in queries unless explicit
- JWT signed with `HS256`, 7-day expiry
- Token stored in **HttpOnly cookie** (inaccessible to JS/XSS)
- Bearer header supported as fallback (Postman / mobile)

### XSS Protection
- **DOMPurify** on the server strips dangerous HTML before DB storage
- **DOMPurify** also runs on the client before rendering
- React Quill renders into an iframe-like sandbox
- `helmet()` sets security headers (CSP, X-Content-Type, etc.)

### Injection Prevention
- `express-mongo-sanitize` strips `$` and `.` from all inputs
- Mongoose typed schemas reject unexpected field types
- `express-validator` validates all inputs before controller logic

### Rate Limiting
- 200 req / 15 min on all `/api/` routes
- 20 req / 15 min on auth endpoints (brute-force protection)

### CORS
- Whitelist-only origins via `CLIENT_ORIGIN` env var
- `credentials: true` — required for cross-origin cookie auth

---

## 🏗️ Architecture Decisions

| Decision | Rationale |
|---|---|
| HTTP-only cookie for JWT | Prevents XSS token theft; Bearer fallback keeps Postman/mobile working |
| Server-side DOMPurify | Defence-in-depth — sanitise even if frontend is bypassed |
| `select: false` on password | Password never leaks via accidental `.find()` |
| Text index weights | Title matches (10×) rank higher than content matches (3×) |
| Separate `requireAccess` / `requireOwner` middleware | Avoids duplicating auth logic across routes |
| `Note.findAccessible` static method | Keeps access query co-located with the model |
| Auto-save with 1.5s debounce | Reduces API calls while feeling instant |
| Context + useReducer over Redux | Sufficient complexity for this app; no extra dependency |

---

## 🚢 Deployment

### MongoDB Atlas
1. Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Add your server IP to the Network Access allowlist (or `0.0.0.0/0` for open)
3. Create a DB user, copy the connection string
4. Set `MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/collab_notes?retryWrites=true&w=majority`

### Backend (Railway / Render / Fly.io)
```bash
cd backend
npm install
npm start
```
Set environment variables in your platform's dashboard.

### Frontend (Vercel / Netlify)
```bash
cd frontend
npm run build
# Serve the /build directory
```
Set `REACT_APP_API_URL=https://your-api.railway.app/api`

### Production JWT Checklist
- [ ] `JWT_SECRET` is a 32+ character random string
- [ ] `COOKIE_SECURE=true`
- [ ] `COOKIE_SAME_SITE=none` (if frontend and backend on different domains)
- [ ] `NODE_ENV=production`
- [ ] `CLIENT_ORIGIN` set to your exact frontend URL (no trailing slash)

### Build Commands Summary
```bash
# Backend
npm install && npm start

# Frontend
npm install && npm run build
# Serve ./build with nginx or a static host
```

---

## 🧪 Running Tests

```bash
# Backend integration tests (requires running MongoDB)
cd backend
npm test

# Frontend unit tests
cd frontend
npm test
```

---

## 📦 Key Dependencies

### Backend
| Package | Purpose |
|---|---|
| `express` | Web framework |
| `mongoose` | MongoDB ODM |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT sign/verify |
| `express-validator` | Input validation |
| `helmet` | Security headers |
| `express-rate-limit` | Rate limiting |
| `express-mongo-sanitize` | NoSQL injection prevention |
| `dompurify` + `jsdom` | Server-side HTML sanitisation |
| `cookie-parser` | Parse incoming cookies |
| `cors` | CORS middleware |

### Frontend
| Package | Purpose |
|---|---|
| `react-router-dom` v6 | Client-side routing |
| `axios` | HTTP client with interceptors |
| `react-quill` | Rich text editor (Quill.js) |
| `dompurify` | Client-side HTML sanitisation |
| `react-hot-toast` | Toast notifications |
| `date-fns` | Date formatting |
| `tailwindcss` | Utility-first CSS |
