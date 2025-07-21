# 🌟 Metaverse App

A modern, real-time 3D metaverse application built with React, Three.js, and Socket.IO. Features avatar customization, real-time chat, and interactive 3D environments.

## ✨ Features

- **3D Virtual World**: Explore immersive 3D environments with Three.js
- **Real-time Multiplayer**: Connect with other users in real-time using Socket.IO
- **Avatar Customization**: Customize your avatar's appearance and accessories
- **Real-time Chat**: Communicate with other users through an integrated chat system
- **Responsive Design**: Works seamlessly on both desktop and mobile devices
- **Modern UI**: Beautiful, intuitive interface built with Tailwind CSS

## 🚀 Tech Stack

### Frontend
- **React 18** + **TypeScript** - Modern UI framework
- **Three.js** + **React Three Fiber** - 3D graphics and rendering
- **Zustand** - State management
- **Tailwind CSS** - Styling and responsive design
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js** + **TypeScript** - Server runtime
- **Express** - Web framework
- **Socket.IO** - Real-time bidirectional communication
- **CORS** - Cross-origin resource sharing

### Real-time Communication
- **Socket.IO** - Real-time bidirectional communication
- **Room-based architecture** - Perfect for virtual spaces
- **Automatic reconnection** - Better user experience

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd metaverse-app
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../backend
   npm install
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:3001`

5. **Start the frontend development server**
   ```bash
   cd ../frontend
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

## 🎮 How to Use

### Getting Started
1. Open the application in your browser
2. Create your avatar by choosing a username, avatar name, and color
3. Click "Enter Metaverse" to join the virtual world

### Controls
- **WASD Keys** - Move your avatar around the world
- **Mouse** - Look around and explore the environment
- **Scroll** - Zoom in and out
- **Chat Button** (bottom right) - Open/close the chat interface
- **Avatar Button** (top right) - Customize your avatar

### Features
- **Real-time Chat**: Click the chat button to communicate with other users
- **Avatar Customization**: Modify your avatar's appearance anytime
- **Multiplayer**: See other users moving around in real-time
- **Room System**: Join different virtual spaces (currently lobby)

## 🏗️ Project Structure

```
metaverse-app/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── World3D.tsx   # Main 3D world component
│   │   │   ├── Chat.tsx      # Chat interface
│   │   │   ├── Login.tsx     # Authentication screen
│   │   │   └── AvatarCustomizer.tsx # Avatar customization
│   │   ├── stores/           # Zustand state management
│   │   │   └── metaverseStore.ts
│   │   └── App.tsx           # Main application component
│   └── package.json
├── backend/                  # Node.js backend server
│   ├── src/
│   │   └── server.ts         # Socket.IO server
│   └── package.json
└── README.md
```

## 🔧 Development

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Development
```bash
cd backend
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
```

### API Endpoints
- `GET /health` - Server health check
- `GET /stats` - Server statistics and connected users

### Socket.IO Events
- `joinRoom` - Join a virtual room
- `move` - Update user position
- `sendMessage` - Send chat message
- `updateAvatar` - Update avatar appearance
- `initializeUser` - Initialize user data

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Build the frontend: `npm run build`
2. Deploy the `dist` folder to your hosting platform
3. Set environment variables in your hosting platform

### Backend (Render/Railway)
1. Build the backend: `npm run build`
2. Deploy to your preferred platform
3. Update the frontend socket connection URL



## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the console for error messages
2. Ensure both frontend and backend servers are running
3. Verify your browser supports WebGL
4. Check that ports 3001 and 5173 are available

## 🔮 Future Enhancements

- [ ] Database integration for persistent user data
- [ ] User authentication and profiles
- [ ] Multiple virtual rooms and environments
- [ ] Advanced avatar customization (3D models)
- [ ] Voice chat integration
- [ ] Mobile touch controls
- [ ] VR/AR support
- [ ] Interactive objects and mini-games
- [ ] Social features (friends, groups)
- [ ] Analytics and user insights

---

**Built with ❤️ using modern web technologies** 