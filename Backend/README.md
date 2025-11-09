# SentiScope Backend API

Backend API untuk aplikasi SentiScope - Platform Analisis Sentimen menggunakan Express.js dan TypeScript.

## 🚀 Fitur

- ✅ Express.js dengan TypeScript
- ✅ Authentication & Authorization (JWT)
- ✅ Sentiment Analysis API
- ✅ User Management
- ✅ Error Handling
- ✅ Security Middleware (Helmet, CORS)
- ✅ Request Logging (Morgan)
- ✅ Input Validation
- ✅ RESTful API Design

## 📋 Prerequisites

- Node.js (v18 atau lebih baru)
- npm atau yarn

## 🔧 Installation

1. Install dependencies:
```bash
npm install
```

2. Copy file `.env.example` ke `.env`:
```bash
cp .env.example .env
```

3. Edit file `.env` dan sesuaikan konfigurasi:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key
```

## 🏃 Running the Server

### Development Mode
```bash
npm run dev
```

Server akan berjalan di `http://localhost:5000` dengan hot-reload menggunakan `tsx watch`.

### Production Mode
```bash
# Build TypeScript
npm run build

# Start server
npm start
```

## 📁 Struktur Folder

```
Backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Custom middleware
│   ├── routes/           # Route definitions
│   ├── services/         # Business logic
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   └── server.ts         # Entry point
├── dist/                 # Compiled JavaScript (generated)
├── .env                  # Environment variables
├── .env.example          # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Endpoints

### Health Check
- `GET /health` - Check server status

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token

### Analysis (Protected)
- `POST /api/analysis/analyze` - Analyze text sentiment
- `GET /api/analysis/history` - Get analysis history
- `GET /api/analysis/history/:id` - Get analysis by ID
- `DELETE /api/analysis/history/:id` - Delete analysis
- `GET /api/analysis/reports` - Get analysis reports

### User (Protected)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/account` - Delete user account

## 🔐 Authentication

Semua endpoint yang dilindungi memerlukan JWT token di header:
```
Authorization: Bearer <token>
```

## 📝 Example Requests

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Analyze Text
```bash
curl -X POST http://localhost:5000/api/analysis/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "text": "I love this product! It's amazing!"
  }'
```

## 🛠️ Development

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

## 📦 Dependencies

### Production
- `express` - Web framework
- `cors` - CORS middleware
- `helmet` - Security headers
- `morgan` - HTTP logger
- `compression` - Response compression
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `dotenv` - Environment variables
- `express-validator` - Input validation

### Development
- `typescript` - TypeScript compiler
- `tsx` - TypeScript execution
- `@types/*` - Type definitions
- `eslint` - Code linting

## 🔄 Next Steps

1. **Database Integration**: Ganti mock data store dengan database (PostgreSQL, MongoDB, dll)
2. **Advanced Sentiment Analysis**: Integrasikan ML model untuk analisis sentimen yang lebih akurat
3. **Rate Limiting**: Tambahkan rate limiting untuk mencegah abuse
4. **Testing**: Tambahkan unit tests dan integration tests
5. **Documentation**: Setup Swagger/OpenAPI documentation
6. **Docker**: Containerize aplikasi dengan Docker

## 📄 License

ISC

