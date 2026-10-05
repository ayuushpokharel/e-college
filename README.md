# College Management System

A full-stack MERN (MongoDB, Express, React, Node.js) application for managing
day-to-day college operations across three roles: Admin, Staff, and Student.

## Features

- Role-based login (Admin / Staff / Student) with JWT authentication
- Admin: manage departments, subjects, staff, and student records
- Staff: manage class timetables, upload/share study materials, enter and update student marks, search students
- Student: view timetable, download materials, check marks, view notices
- Shared: notices board, profile management, password reset via email, file uploads (profile pictures, materials)

## Tech Stack

**Backend:** Node.js, Express, MongoDB (Mongoose), JWT, Multer, Nodemailer
**Frontend:** React, Redux, React Router, Tailwind CSS, Axios

## Project Structure

```
ecollege/
├── backend/
│   ├── database/          # MongoDB connection setup
│   ├── controllers/        # Request handlers (admin, staff, student, exam, marks, ...)
│   │   └── details/        # Handlers for /admin, /staff, /student "details" resources
│   ├── middlewares/         # auth (JWT) and multer (file upload) middleware
│   ├── models/              # Mongoose schemas
│   │   └── details/
│   ├── routes/               # Express route definitions
│   │   └── details/
│   ├── utils/                # ApiResponse helper, SendMail
│   ├── media/                # Uploaded files (gitignored, kept via .gitkeep)
│   ├── admin-seeder.js        # Creates the initial admin account
│   ├── index.js                # App entry point
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── assets/            # Static SVGs used by the UI
│   ├── src/
│   │   ├── Screens/            # Page-level components, grouped by role
│   │   │   ├── Admin/
│   │   │   ├── Staff/
│   │   │   └── Student/
│   │   ├── components/          # Shared/reusable UI components
│   │   ├── redux/                # Store, reducer, action creators
│   │   ├── utils/                  # Axios wrapper
│   │   ├── App.js                   # Routes
│   │   └── index.js                  # React entry point
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v16 or later recommended)
- MongoDB running locally or a connection URI to a hosted instance

### Backend Setup

```bash
cd backend
cp .env.sample .env
```

Fill in `.env`:

| Variable                               | Description                                                                                  |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| `MONGODB_URI`                          | MongoDB connection string                                                                    |
| `PORT`                                 | Port the API server listens on                                                               |
| `FRONTEND_API_LINK`                    | URL of the running frontend (used for CORS)                                                  |
| `JWT_SECRET`                           | Secret used to sign auth tokens                                                              |
| `NODEMAILER_EMAIL` / `NODEMAILER_PASS` | Credentials for sending password-reset emails (optional; leave blank to skip email features) |

Install dependencies and seed an initial admin account:

```bash
npm install
npm run seed
```

The seeder prints the generated admin login (Employee ID and password) to the console — use those to log in as Admin.

Start the API:

```bash
npm run dev     # with auto-reload (nodemon)
# or
npm start
```

### Frontend Setup

```bash
cd frontend
cp .env.sample .env
```

Fill in `.env`:

| Variable               | Description                       |
| ---------------------- | --------------------------------- |
| `REACT_APP_APILINK`    | Base URL of the backend API       |
| `REACT_APP_MEDIA_LINK` | Base URL for uploaded media files |

Install dependencies and start the dev server:

```bash
npm install
npm start
```

The app will be available at `http://localhost:3000`, calling the API at the URL set in `REACT_APP_APILINK`.

## Available Scripts

**Backend** (`backend/package.json`)

- `npm start` — run the server
- `npm run dev` — run the server with nodemon (auto-restart on changes)
- `npm run seed` — create the initial admin account

**Frontend** (`frontend/package.json`)

- `npm start` — run the development server
- `npm run build` — create a production build
