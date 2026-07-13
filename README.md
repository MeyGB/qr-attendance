# QR Attendance System

A QR-code-based office attendance system: React Native mobile app + Node/Express API + MySQL (managed via phpMyAdmin).

## How it works

1. A tablet/monitor at the office entrance displays a QR code that **rotates every ~45 seconds**
   (fetched from `GET /api/attendance/current-qr`). This prevents someone from photographing
   the code and using it later, or sharing it outside the office.
2. Employees log into the mobile app with their own account.
3. They scan the on-screen QR code to check in, and again to check out.
4. Admins can view/manage everything directly in phpMyAdmin, or via the `/api/attendance/all`
   and `/api/employees` endpoints.

## 1. Database setup (phpMyAdmin)

1. Open phpMyAdmin, go to the **Import** tab.
2. Choose the file `backend/schema.sql` and click **Go**. This creates the database and all tables.
3. Generate a real password hash for your first admin account:
   ```
   cd backend
   npm install
   node services/hashPassword.js "YourAdminPassword"
   ```
4. In phpMyAdmin, open the `employees` table and insert a row manually:
   - `full_name`: your name
   - `email`: your email
   - `password_hash`: the hash printed by the command above
   - `employee_code`: e.g. `ADMIN001`
   - `role`: `admin`

## 2. Backend setup

```
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your MySQL credentials (same ones you use to log into phpMyAdmin) and a
random `JWT_SECRET`. Then run:

```
npm run dev
```

The API starts on `http://localhost:4000` and immediately starts rotating QR tokens.
Display `GET http://localhost:4000/api/attendance/current-qr` as a QR image on the
entrance tablet (any simple webpage that polls this endpoint and renders it with a
QR-generating library like `qrcode` works well).

## 3. Mobile app setup

```
cd mobile
npm install
```

Edit `src/services/api.js` and set `BASE_URL` to your computer's LAN IP (not `localhost`,
since the phone/emulator needs to reach your machine over the network), e.g.:

```js
const BASE_URL = 'http://192.168.1.10:4000/api';
```

Then run:

```
npx expo start
```

Scan the Expo QR code with the **Expo Go** app on your phone, or press `a`/`i` to open in
an Android/iOS emulator.

## Project structure

```
qr-attendance/
  backend/
    schema.sql              # MySQL schema — import via phpMyAdmin
    server.js                # Express app entry point
    config/db.js             # MySQL connection pool
    middleware/auth.js        # JWT auth + admin guard
    routes/
      auth.routes.js          # POST /login
      attendance.routes.js    # check-in, check-out, current QR, history
      employees.routes.js     # employee management (admin)
    services/
      qrRotation.js           # rotates the QR token every N seconds
      hashPassword.js          # CLI helper to generate bcrypt hashes
  mobile/
    App.js
    src/
      screens/                # Login, Home, Scan, History
      services/api.js          # API client
      navigation/AppNavigator.js
```

## Next steps you may want

- Build a simple entrance-display webpage that polls `/api/attendance/current-qr` and
  renders it as an actual QR image (using the `qrcode` npm package or `qrcode.react`).
- Add a basic admin web dashboard for non-technical staff, on top of the same MySQL DB.
- Deploy the backend somewhere reachable by phones outside your LAN (e.g. a small VPS)
  once you move past local testing.
