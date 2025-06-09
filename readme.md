# APSIT-In : APSIT's Social Network Platform

A full-stack social networking platform built for APSIT students, faculty, and clubs. This platform facilitates seamless communication, event management, and community building within the institution.

## 🌐 Live Demo
[Visit APSIT-In](https://apsitin.onrender.com)

## 🚀 Key Features

### User Management
- Role-based authentication (Students, Faculty, Club Admins)
- Custom email validation for APSIT domain
- Profile customization with rich media support
- Privacy settings and connection management

### Social Features
- Real-time messaging with file sharing
- Post creation with media support
- Comments and reactions system
- Connection requests and management
- Activity feed with infinite scroll

### Club Management
- Club creation and administration
- Member management with roles
- Event creation and RSVP system
- Club-specific announcements

### Event Management
- Event creation and management
- RSVP functionality
- Event reminders and notifications
- Calendar integration

### Technical Highlights
- Real-time updates using Socket.IO
- File uploads with Cloudinary integration
- Responsive design for all devices
- Dark/Light mode support
- Progressive Web App (PWA) capabilities

## 🛠️ Tech Stack

### Frontend
- React.js with Vite
- Tailwind CSS for styling
- DaisyUI for UI components
- Socket.IO client for real-time features
- Axios for API requests
- React Router for navigation
- Context API for state management

### Backend
- Node.js with Express
- MongoDB with Mongoose
- Socket.IO for real-time communication
- JWT for authentication
- Cloudinary for media storage
- Nodemailer for email notifications
- Multer for file uploads

### Deployment
- Render for hosting
- MongoDB Atlas for database
- Cloudinary for media storage
- Environment-based configuration

## 🔒 Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Secure file uploads

## 📱 Mobile Responsiveness
- Fully responsive design
- Mobile-first approach
- Touch-friendly interface
- Optimized for all screen sizes

## 🚀 Performance Optimizations
- Code splitting
- Lazy loading
- Image optimization
- Database indexing for frequently accessed queries

## 🔄 Real-time Features
- Live messaging
- Instant notifications
- Real-time updates

## 📈 Architecture
- MVC architecture
- RESTful API design
- Modular code organization
- Separation of concerns
- Reusable components

## 🛠️ Development Setup

1. Clone the repository
```bash
git clone https://github.com/DarshK25/Project-ApsitIn.git
```

2. Install dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

3. Set up environment variables
```bash
# Root .env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# Frontend .env
VITE_API_URL=your_api_url
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

4. Run the development server
```bash
# Run backend
npm run dev

# Run frontend (in a new terminal)
cd frontend
npm run dev
```

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 👨‍💻 Author
- Darsh Kalathiya
- GitHub: [@DarshK25](https://github.com/DarshK25)

## 🙏 Acknowledgments
- APSIT for inspiration
- All contributors and supporters
- Open source community

---

**Elevate your academic journey with APSIT-In. Your network, your future.**

