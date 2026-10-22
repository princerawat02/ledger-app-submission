# MiniLedger

MiniLedger is a full-stack mobile application for recording money lent to
friends, tracking due dates, and marking loans as repaid.

This repository is structured as an intern-project submission:

- `server/` contains the TypeScript Express API and PostgreSQL integration.
- `app/` contains the Expo SDK 57 React Native frontend.
- The mobile app communicates with the backend over HTTP. It never connects
  directly to PostgreSQL or Supabase.

## Features

- Mock phone OTP authentication
- JWT-based authenticated sessions
- Persistent login on the mobile device
- Dashboard summary:
  - Total lent
  - Total repaid
  - Overdue amount
- User-specific loan list
- Overdue loan highlighting
- Add a loan with validation
- Mark an unpaid loan as repaid
- Pull-to-refresh for dashboard data
- Logout and protected routes
- Loading, empty, validation, and error states

## Technology stack

### Frontend

- Expo SDK 57
- React Native 0.86
- React 19
- Expo Router for file-based navigation
- TypeScript
- Axios for HTTP requests
- AsyncStorage for JWT persistence
- React Native `StyleSheet` for UI styling

### Backend

- Node.js
- Express
- TypeScript
- PostgreSQL hosted by Supabase
- `pg` PostgreSQL client
- `jsonwebtoken` for JWT signing and verification
- `cors` for cross-origin development requests
- `dotenv` for environment configuration
- `tsx` for TypeScript development

## Project structure

```text
ledger-app/
├── app/
│   ├── src/
│   │   ├── app/
│   │   │   ├── _layout.tsx       # Root navigation and auth provider
│   │   │   ├── index.tsx         # Auth-based redirect
│   │   │   ├── login.tsx         # Phone and OTP login
│   │   │   ├── dashboard.tsx     # Summary, loans, repayment, logout
│   │   │   └── add-loan.tsx      # Create-loan form
│   │   ├── context/
│   │   │   └── auth-context.tsx  # JWT restore, sign-in, sign-out
│   │   └── services/
│   │       └── api.ts            # Shared Axios API service
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
├── server/
│   ├── src/
│   │   ├── app.ts                # Express middleware and route mounting
│   │   ├── server.ts             # HTTP server startup
│   │   ├── middleware/
│   │   │   └── auth.ts           # Bearer JWT middleware
│   │   └── routes/
│   │       ├── auth.routes.ts
│   │       ├── loan.routes.ts
│   │       └── summary.routes.ts
│   ├── database/
│   │   └── schema.sql
│   └── package.json
└── README.md
```

## Backend API routes

All responses use this wrapper:

```json
{
  "success": true,
  "message": "Human-readable result",
  "data": {}
}
```

Errors use:

```json
{
  "success": false,
  "message": "Description of the error"
}
```

### `GET /health`

Checks that the API is running.

```powershell
curl http://localhost:5000/health
```

### `POST /api/auth/send-otp`

Starts mock OTP authentication.

Request:

```json
{
  "phone": "+919876543210"
}
```

The OTP is intentionally printed in the backend terminal and is not returned
to the mobile app.

### `POST /api/auth/verify-otp`

Verifies the mock OTP and returns a JWT.

Request:

```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

Successful response data:

```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "phone": "+919876543210",
    "createdAt": "timestamp"
  }
}
```

The OTP expires after five minutes and is limited to five verification
attempts. OTPs are stored in memory for this development assignment.

### `POST /api/loans`

Creates a loan for the authenticated user.

Header:

```text
Authorization: Bearer <jwt>
```

Request:

```json
{
  "friendName": "Rahul",
  "amount": 2500,
  "dueDate": "2026-10-25"
}
```

### `GET /api/loans`

Returns the authenticated user's loans, newest first.

Each loan includes:

```json
{
  "id": "loan-id",
  "friendName": "Rahul",
  "amount": "2500.00",
  "dueDate": "2026-10-25",
  "isRepaid": false,
  "createdAt": "timestamp",
  "isOverdue": false
}
```

### `PATCH /api/loans/:id/repay`

Marks an authenticated user's unpaid loan as repaid.

```text
PATCH /api/loans/<loan-id>/repay
Authorization: Bearer <jwt>
```

### `GET /api/summary`

Returns aggregate values for the authenticated user:

```json
{
  "totalLent": "2500.00",
  "totalRepaid": "1000.00",
  "overdueAmount": "0.00",
  "totalOutstanding": "1500.00"
}
```

## Frontend routes

The frontend uses Expo Router under `app/src/app`.

| Route | Purpose |
| --- | --- |
| `/` | Checks whether a JWT exists and redirects to `/login` or `/dashboard` |
| `/login` | Validates the phone number, sends OTP, verifies OTP, and stores the JWT |
| `/dashboard` | Loads summary and loans, highlights overdue items, supports repayment and logout |
| `/add-loan` | Validates and submits a new loan, then returns to the dashboard |

The root layout displays the splash/loading state while AsyncStorage restores
the previous session. Authenticated screens redirect to login when no token is
available.

## API service design

The frontend uses one Axios client in
[`app/src/services/api.ts`](./app/src/services/api.ts).

It:

1. Reads `EXPO_PUBLIC_API_URL`.
2. Uses a shared Axios `baseURL`.
3. Sends JSON request bodies.
4. Adds `Authorization: Bearer <token>` for protected requests.
5. Unwraps the backend's `{ success, message, data }` response.
6. Converts backend, timeout, and connection errors into readable messages.

The screens do not contain raw URLs or duplicate request logic.

## Database schema

The backend uses two tables:

- `users`
  - UUID primary key
  - Unique phone number
  - Creation timestamp
- `loans`
  - UUID primary key
  - Foreign key to `users`
  - Friend name
  - Positive numeric amount
  - Due date
  - Repaid flag
  - Creation timestamp

Indexes support user loan listing and due-date queries. The schema is in
[`server/database/schema.sql`](./server/database/schema.sql).

## Setup

### Prerequisites

- Node.js 18 or newer
- pnpm
- A Supabase PostgreSQL database
- Expo Go, an Android emulator, or an iOS Simulator

### Configure the backend

```powershell
cd server
pnpm install
```

Create `server/.env`:

```env
PORT=5000
DATABASE_URL=your_supabase_postgres_connection_string
JWT_SECRET=replace_with_a_long_random_secret
```

Run [`server/database/schema.sql`](./server/database/schema.sql) in the
Supabase SQL Editor, then start the server:

```powershell
pnpm run dev
```

The API should be available at `http://localhost:5000`.

### Configure the mobile app

```powershell
cd app
pnpm install
```

Create `app/.env` with a URL appropriate for the device:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.6:5000
```

Networking values:

| Target | URL |
| --- | --- |
| Web on the development computer | `http://localhost:5000` |
| Android Studio emulator | `http://10.0.2.2:5000` |
| iOS Simulator on the same computer | `http://localhost:5000` |
| Physical phone | `http://<computer-LAN-IP>:5000` |

For a physical phone:

- Use the computer's reachable LAN IP, not `localhost`.
- Put the phone and computer on the same Wi-Fi network.
- Test `http://<computer-LAN-IP>:5000/health` in the phone browser.
- Restart Expo after changing `.env`.

Start the frontend:

```powershell
cd app
npx expo start
```

For a clean environment-variable reload:

```powershell
npx expo start -c
```

## User flow for demonstration

1. Start PostgreSQL-backed API with `pnpm run dev`.
2. Start Expo with `npx expo start`.
3. Open the app on a device or emulator.
4. Enter a valid international phone number, such as `+919876543210`.
5. Tap **Send OTP**.
6. Copy the six-digit OTP from the backend terminal.
7. Verify the OTP.
8. Confirm the dashboard summary and empty state.
9. Add a loan with a future or past due date.
10. Confirm the loan appears in the list and overdue loans are highlighted.
11. Mark an unpaid loan as repaid.
12. Confirm the list and summary refresh.
13. Log out and confirm the app returns to login.
14. Relaunch the app after logging in to verify JWT restoration.

## Validation performed

Frontend checks:

```powershell
cd app
npx tsc --noEmit
npx expo lint
npx expo install --check
npx expo-doctor
npx expo export --platform web
```

Backend checks:

```powershell
cd server
pnpm run build
```

Manual API smoke test:

```powershell
curl http://localhost:5000/health
```

Expected health response:

```json
{
  "success": true,
  "message": "MiniLedger API is running."
}
```

## Engineering decisions

- **Existing Expo project preserved:** The implementation was completed inside
  the existing `app/` project rather than generating a new Expo project.
- **Expo Router retained:** The existing `src/app` route structure was reused.
- **Backend contract followed:** API requests and response fields match the
  existing Express routes instead of inventing a second contract.
- **Single API module:** HTTP behavior is centralized in Axios so screens stay
  focused on UI and user interaction.
- **JWT stored locally:** AsyncStorage restores the login session between app
  launches. Database credentials and JWT signing secrets remain server-only.
- **No fake production data:** Empty and error states are rendered from real API
  results.
- **Simple architecture:** The project uses a small auth context and API
  service rather than adding unnecessary state-management or networking
  frameworks.

## Limitations and future improvements

These are intentional assignment-level limitations:

- OTPs are mock OTPs printed to the backend terminal.
- OTP state is in memory and is lost when the backend restarts.
- The app currently uses a development API URL configured through
  `EXPO_PUBLIC_API_URL`.
- Production deployment would require HTTPS, real SMS delivery, stronger
  secret management, and a production host.
- AsyncStorage is suitable for this assignment; a production mobile release
  could use a secure credential store for the JWT.

## Submission summary

This submission demonstrates:

- Full-stack TypeScript development
- REST API integration
- Authentication and protected resources
- PostgreSQL-backed data modeling
- Mobile routing and session handling
- Form validation and user feedback
- Responsive React Native UI
- Environment-aware local networking
- Type checking, linting, dependency checks, and Expo diagnostics
