const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// تخزين مؤقت للمستخدمين (يجب استبداله بقاعدة بيانات)
const users = {};
const socketToUser = {};

// التعامل مع الاتصالات في الوقت الحقيقي
io.on('connection', (socket) => {
  console.log('مستخدم متصل:', socket.id);

  // تسجيل المستخدم
  socket.on('register', (username) => {
    users[username] = socket.id;
    socketToUser[socket.id] = username;
    console.log(`المستخدم ${username} مسجل`);
  });

  // إرسال رسالة
  socket.on('send_message', (data) => {
    const { receiver, message } = data;
    const receiverSocketId = users[receiver];
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive_message', {
        sender: socketToUser[socket.id],
        message: message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // بدء مكالمة
  socket.on('call_user', (data) => {
    const { userToCall, signalData } = data;
    const receiverSocketId = users[userToCall];
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('incoming_call', {
        from: socketToUser[socket.id],
        signal: signalData
      });
    }
  });

  // قبول المكالمة
  socket.on('accept_call', (data) => {
    const { to, signal } = data;
    const receiverSocketId = users[to];
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('call_accepted', signal);
    }
  });

  socket.on('disconnect', () => {
    const username = socketToUser[socket.id];
    if (username) {
      delete users[username];
      delete socketToUser[socket.id];
    }
    console.log('مستخدم منفصل:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
});