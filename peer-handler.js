{
  "name": "meeting-app-server",
  "version": "1.0.0",
  "description": "تطبيق مكالمات فيديو مثل Google Meet",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "lint": "eslint .",
    "clean": "rm -rf node_modules package-lock.json"
  },
  "keywords": [
    "video-call",
    "meeting",
    "webrtc",
    "socket.io",
    "express"
  ],
  "author": "Meeting App",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.5.0",
    "cors": "^2.8.5",
    "uuid": "^9.0.0",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.0.3",
    "compression": "^1.7.4",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22",
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "eslint": "^8.39.0"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/meeting-app.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/meeting-app/issues"
  },
  "homepage": "https://github.com/yourusername/meeting-app#readme"
}
