# Team Driver Rewards - React Frontend

A modern React-based frontend for the Team Driver Rewards platform, built with Vite, React Router, and Axios.

## Features

- **Authentication System**: Login, registration, and JWT cookie-based authentication
- **Role-Based Access Control**: Separate dashboards for Admin, Sponsor, and Driver roles
- **Modern UI**: Clean, responsive design with custom CSS
- **API Integration**: Full integration with Flask backend via Axios
- **Protected Routes**: Role-based route protection

## Tech Stack

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **React Router v6**: Client-side routing
- **Axios**: HTTP client for API calls
- **CSS3**: Custom styling (no frameworks)

## Project Structure

```
Frontend_Rework/
├── src/
│   ├── components/        # Reusable components
│   │   ├── Layout.jsx     # Main layout with sidebar
│   │   └── ProtectedRoute.jsx
│   ├── contexts/          # React contexts
│   │   └── AuthContext.jsx
│   ├── pages/             # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── SponsorDashboard.jsx
│   │   ├── DriverDashboard.jsx
│   │   └── About.jsx
│   ├── services/          # API services
│   │   ├── api.js         # Axios instance
│   │   └── apiService.js  # API methods
│   ├── styles/            # CSS files
│   │   ├── Layout.css
│   │   ├── Auth.css
│   │   └── Dashboard.css
│   ├── App.jsx            # Main app component
│   └── main.jsx           # Entry point
├── vite.config.js         # Vite configuration
└── package.json
```

## Getting Started

### Prerequisites

- Node.js v18+ (for the React app)
- Docker (for the Flask backend)
- Running MySQL database

### Installation

1. Install dependencies:
```bash
cd Frontend_Rework
npm install
```

2. Make sure your Flask backend is built:
```bash
cd ../src
docker build -t myapp .
```

3. Run both servers using the helper script:
```bash
cd ..
./start-dev.sh
```

Or run them separately:

**Backend (in one terminal):**
```bash
cd src
docker run --rm -p 5000:5000 \
  -e DB_HOST="your_db_host" \
  -e DB_USER="your_db_user" \
  -e DB_PASSWORD="your_db_password" \
  -e DB_NAME="your_db_name" \
  myapp
```

**Frontend (in another terminal):**
```bash
cd Frontend_Rework
npm run dev
```

### Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## API Configuration

The frontend proxies all `/api` requests to the Flask backend running on `http://localhost:5000`. This is configured in `vite.config.js`.

## Authentication Flow

1. User logs in via `/login`
2. Backend sets JWT cookie
3. Frontend stores user data in AuthContext
4. Protected routes check user role
5. Axios interceptor handles 401 errors

## Role-Based Dashboards

### Admin Dashboard
- View all accounts
- Impersonate users
- Delete accounts

### Sponsor Dashboard
- View active drivers
- Approve/reject driver applications
- Add/subtract points for drivers
- Impersonate drivers

### Driver Dashboard
- View available sponsors
- Apply to sponsors
- Check point balance
- View application status

## Troubleshooting

### CORS Issues
Make sure your Flask backend has CORS configured:
```python
CORS(app, origins=['http://localhost:3000'], supports_credentials=True)
```

### Cookie Issues
Ensure JWT cookies are configured for cross-origin:
```python
app.config['JWT_COOKIE_SAMESITE'] = 'None'
app.config['JWT_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
```

### Port Conflicts
- Frontend runs on port 3000
- Backend runs on port 5000
- Make sure these ports are available

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
