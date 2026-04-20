# 🔥 Krisha Fire - Security Management System

This repo contains:

- `frontend/`: React + Vite + Tailwind CSS app (originally built using localStorage).
- `backend/`: Express + MongoDB API with JWT auth + RBAC.

## ✨ Features

- ✅ **Frontend (localStorage)** - Works without backend
- ✅ **Backend APIs** - Ready to connect when you want
- ✅ **Role-Based Access** - Admin, Employee, HR
- ✅ **Authentication** - Login & Signup with localStorage
- ✅ **8 Modules** - Dashboard, Clients, Guards, Equipment, Attendance, Salary, Invoices, Chat
- ✅ **Live Chat** - Real-time messaging (localStorage-based)
- ✅ **Responsive** - Mobile, Tablet, Desktop
- ✅ **Zero Dependencies** - No Axios, no backend APIs

## 🚀 Quick Start (Frontend)

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 🚀 Quick Start (Backend)

You need MongoDB running locally.

```bash
cd backend
npm install
cp .env.example .env
npm run start
```

## 🔐 Default Credentials

**Admin:**
- Email: admin@krishafire.com
- Password: admin123

**Employee:**
- Email: employee@krishafire.com
- Password: employee123

**HR:**
- Email: hr@krishafire.com
- Password: hr1234

## 📁 Project Structure

```
src/
├── components/
│   └── common/          # Reusable components
├── pages/               # All page components
├── context/             # AuthContext
├── services/            # localStorage services
└── utils/               # Helper functions
```

## 🎯 Role Permissions

| Feature | Admin | Employee | HR |
|---------|-------|-------|-------------|
| Dashboard | ✅ | ✅ | ✅ |
| Clients | ✅ | ✅ | ❌ |
| Guards | ✅ | ✅ | ❌ |
| Equipment | ✅ | ✅ | ✅ |
| Attendance | ✅ | ✅ | ✅ |
| Salary | ✅ | ✅ | ❌ |
| Chat | ✅ | ✅ | ✅ |
| Delete | ✅ | ❌ | ❌ |

## 💾 Data Storage

All data is stored in localStorage with these keys:
- `users` - User accounts
- `currentUser` - Logged-in user
- `clients` - Client records
- `guards` - Guard records
- `equipment` - Equipment records
- `attendance` - Attendance records
- `salaries` - Salary records
- `invoices` - Invoice records
- `messages` - Chat messages

## 🛠️ Tech Stack

- React 18
- Vite
- Tailwind CSS
- React Router v6
- Lucide React (icons)

## 📝 License

© 2025 Krisha Fire Security Management
