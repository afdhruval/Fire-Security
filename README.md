# 🔥 FireSentrix – Fire & Security Management System

### A Full Stack Security Operations Platform for Managing Guards, Clients, Equipment, Attendance, and Communication

**FireSentrix** is a full-stack security management platform designed to streamline operations for security companies and facility managers.
The system enables administrators to manage security personnel, track attendance, monitor equipment, handle invoices, and facilitate internal communication.

The application is built with a **modern MERN-style architecture**, featuring a structured backend with controllers, models, middleware, and REST APIs.

---

# 🚀 Core Features

### 🔐 Authentication & Authorization

* Secure user authentication
* Role-based access control
* Protected API routes
* JWT-based session handling

---

### 👮 Guard Management

* Add and manage security guards
* Update guard details
* Assign guards to sites
* Track guard status

---

### 🏢 Client Management

* Add client companies
* Manage client contact details
* Link clients with security sites
* Maintain service records

---

### 📍 Site Management

* Manage security deployment locations
* Assign guards to sites
* Track operational details

---

### 🛠 Equipment Management

* Add security equipment
* Track equipment assignments
* Monitor maintenance status

---

### 📅 Attendance System

* Record guard attendance
* Track attendance per site
* Generate attendance logs

---

### 💰 Salary Management

* Calculate guard salaries
* Generate salary records
* Payment status tracking

---

### 🧾 Invoice Management

* Generate invoices for clients
* Track payment records
* Maintain billing history

---

### 💬 Internal Messaging System

* Send messages between users
* Maintain communication logs
* Secure internal communication

---

# 🏗 Backend Architecture

The backend follows a **modular MVC-style architecture** to maintain scalability and code organization.

```
backend
│
├── config
│
├── controllers
│   ├── attendanceController.js
│   ├── authController.js
│   ├── clientController.js
│   ├── equipmentController.js
│   ├── guardController.js
│   ├── invoiceController.js
│   ├── messageController.js
│   ├── salaryController.js
│   └── siteController.js
│
├── middleware
│   ├── auth.js
│   ├── errorHandler.js
│   └── validate.js
│
├── models
│   ├── Attendance.js
│   ├── Client.js
│   ├── Equipment.js
│   ├── Guard.js
│   ├── Invoice.js
│   ├── Message.js
│   ├── Salary.js
│   ├── Site.js
│   └── User.js
│
├── routes
│   ├── attendanceRoutes.js
│   ├── authRoutes.js
│   ├── clientRoutes.js
│   ├── equipmentRoutes.js
│   ├── guardRoutes.js
│   ├── invoiceRoutes.js
│   ├── messageRoutes.js
│   ├── salaryRoutes.js
│   └── siteRoutes.js
│
├── server.js
└── seed.js
```

---

# 🛠 Tech Stack

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose

### Authentication

* JWT (JSON Web Token)

### API Architecture

* RESTful APIs

### Middleware

* Custom authentication middleware
* Validation middleware
* Error handling middleware

---

# ⚙️ Environment Variables

Create a `.env` file inside the backend folder.

Example:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

# ▶️ Running the Backend

Install dependencies

```
npm install
```

Start the server

```
npm run start
```

Server will run on:

```
http://localhost:5000
```

---

# 🎯 Purpose of the Project

This project demonstrates how to build a **production-level backend architecture** for a security operations management system, including:

* Modular API architecture
* Secure authentication
* Organized controller structure
* Scalable data models
* Middleware-based security

---

# 👨‍💻 Author

Your Name

GitHub:dhruval1907
