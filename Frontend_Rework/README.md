## Getting Started

### Prerequisites

- Node.js v18+ (for the React app)
- Docker (for the Flask backend)

### Installation

1. Install dependencies:
```bash
cd Frontend_Rework
npm install
```
2. Run both servers using the helper script:
```bash
./start-dev.sh
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
