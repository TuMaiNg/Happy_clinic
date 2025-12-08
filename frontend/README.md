# Happy Care Clinic - Frontend

Frontend web application for Happy Care Clinic built with React, TypeScript, and Tailwind CSS.

## Features

- Responsive design (mobile, tablet, desktop)
- Authentication (login, register, password reset)
- Role-based dashboards (Patient, Doctor, Staff, Admin)
- Appointment booking system
- Real-time notifications (Socket.IO)
- Vietnamese language support
- Modern UI with Tailwind CSS

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
REACT_APP_API_URL=http://localhost:3000/api
```

## Running the Application

### Development
```bash
npm start
```

The app will be available at `http://localhost:3001`

### Production Build
```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts (Auth, etc.)
│   ├── pages/          # Page components
│   ├── services/       # API service functions
│   ├── config/         # Configuration files
│   ├── App.tsx         # Main app component
│   └── index.tsx       # Entry point
├── public/             # Static files
└── package.json
```

## Features in Development

- [x] Authentication (Login, Register)
- [ ] Appointment booking
- [ ] Doctor schedules
- [ ] Patient dashboard
- [ ] Doctor dashboard
- [ ] Staff/Admin dashboard
- [ ] Real-time notifications
- [ ] Payment integration
- [ ] Reports and analytics

## License

ISC
