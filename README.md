# NoteFlow

A simple full-stack note-taking app where you can create, manage, and organize notes with a clean and minimal interface.

This project is inspired by tools like Notion, but focuses more on simplicity and speed rather than too many features.

---

## Live Demo

https://note-app-eight-phi.vercel.app/

---

## Features

- Create and delete notes  
- Star important notes  
- Search notes in real-time  
- Clean and responsive UI  
- Dark and light mode  
- User authentication (JWT)  

---

## Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Axios
- Framer Motion

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication

---

## Project Structure

```
note-app/
├── backend/
│   ├── config/        # Database connection setup
│   ├── controllers/   # Request handling logic
│   ├── middleware/    # Auth middleware (JWT etc.)
│   ├── models/        # Mongoose schemas
│   ├── routes/        # API routes
│   └── server.js      # Entry point of backend
│
└── frontend/
    ├── src/
    │   ├── api/        # Axios configuration
    │   ├── components/ # Reusable UI components
    │   ├── pages/      # App pages (Dashboard, Login, etc.)
    │   ├── context/    # Global state (Auth, Theme)
    │   └── App.jsx     # Main app component
    │
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── vercel.json     # Routing config for Vercel
```

---

## Getting Started

### Clone the repository

```
git clone https://github.com/kswajal/note-app.git
cd note-app
```

---

### Backend setup

```
cd backend
npm install
```

Create a `.env` file:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Run backend:

```
npm run dev
```

---

### Frontend setup

Open a new terminal:

```
cd frontend
npm install
```

Create a `.env` file:

```
VITE_API_URL=http://localhost:5000/api
```

Run frontend:

```
npm run dev
```

---

## Deployment

- Frontend: Vercel  
- Backend: Render  

---

## License

This project is licensed under the MIT License.
