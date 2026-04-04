# Admeasy Phase 2 Setup

## New Environment Variable

Add to your Server `.env`:

```
JWT_SCHOOL_SECRET=your-secure-random-string-for-school-teacher-jwt
```

Generate a secure random string (e.g. `openssl rand -hex 32`).

---

## Phase 2 Features

### Space System
- **Public spaces**: Anyone can join and post (default)
- **Private spaces**: Created by users; configurable join approval and posting restrictions
- **School spaces**: Created automatically when admin creates a school; only school members can join

### School System
- Schools created only via Admin Panel → `/admin/schools`
- School Code format: 2 letters + 5 digits (e.g. AA00001)
- Admin creates school, gets code + password; credentials shared manually

### School Login
- URL: `/school-login`
- **School Admin**: schoolCode + password
- **Teacher**: schoolCode + email + password

### Teacher Flow
1. School admin adds teacher email at `/school/add-teacher`
2. System returns invite link
3. Teacher opens link, sets password at `/school/teacher/set-password?token=...`
4. Teacher logs in at `/school-login` (Teacher tab)

### API Routes

| Route | Description |
|-------|-------------|
| POST /api/schools/create | Admin: create school |
| POST /api/schools/login | School admin login |
| GET /api/schools/me | Current school/teacher (auth) |
| POST /api/schools/add-teacher | School admin: add teacher |
| GET /api/schools/:id | School details |
| GET /api/admin/schools | Admin: list schools |
| POST /api/teachers/login | Teacher login |
| POST /api/teachers/set-password | Teacher set password (invite) |
| GET /api/teachers/:id | Teacher profile |
| POST /api/users/join-school | User joins school (schoolCode) |
| POST /api/spaces | Create space (type: public\|private) |
| POST /api/spaces/:id/join | Join or request to join |
| GET /api/spaces/:spaceId/requests | List pending requests (moderator) |
| POST /api/spaces/approve | Approve/reject request |

---

## Database Migration

Existing spaces will work with `type: 'public'` as default. No migration needed for spaces.

Ensure `UserProfile` has `schoolId` as ObjectId (updated in schema). Existing `schoolId` as String may need a one-time migration if you had string IDs.
