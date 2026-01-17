const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

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
app.use(express.static('public'));

// تخزين المكالمات النشطة
const activeMeetings = new Map();

// إنشاء رابط مكالمة جديد
app.post('/api/create-meeting', (req, res) => {
    const meetingId = uuidv4().substring(0, 8); // رابط قصير
    const hostId = uuidv4();
    
    activeMeetings.set(meetingId, {
        host: hostId,
        participants: [],
        created: new Date(),
        status: 'waiting'
    });
    
    res.json({
        success: true,
        meetingId: meetingId,
        hostLink: `${req.protocol}://${req.get('host')}/meeting.html?room=${meetingId}&host=true&id=${hostId}`,
        guestLink: `${req.protocol}://${req.get('host')}/meeting.html?room=${meetingId}`,
        message: 'تم إنشاء الرابط بنجاح'
    });
});

// التحقق من وجود المكالمة
app.get('/api/meeting/:id', (req, res) => {
    const meetingId = req.params.id;
    
    if (activeMeetings.has(meetingId)) {
        const meeting = activeMeetings.get(meetingId);
        res.json({
            exists: true,
            participants: meeting.participants.length,
            status: meeting.status
        });
    } else {
        res.json({ exists: false });
    }
});

// Socket.io للاتصال في الوقت الحقيقي
io.on('connection', (socket) => {
    console.log('مستخدم متصل:', socket.id);
    
    socket.on('join-meeting', (data) => {
        const { meetingId, userId, userName, isHost } = data;
        
        socket.join(meetingId);
        
        if (isHost) {
            socket.to(meetingId).emit('host-joined', {
                userId: userId,
                userName: userName
            });
        }
        
        // إعلام جميع المشاركين
        io.to(meetingId).emit('user-joined', {
            userId: userId,
            userName: userName,
            participants: getMeetingParticipants(meetingId)
        });
        
        socket.meetingId = meetingId;
        socket.userId = userId;
        
        console.log(`المستخدم ${userName} انضم إلى ${meetingId}`);
    });
    
    // إرسال إشارة WebRTC
    socket.on('signal', (data) => {
        const { to, signal, type } = data;
        socket.to(to).emit('signal', {
            from: socket.userId,
            signal: signal,
            type: type
        });
    });
    
    // طلب بدء المكالمة
    socket.on('start-call', (data) => {
        const { meetingId } = data;
        io.to(meetingId).emit('call-started');
    });
    
    // إرسال رسالة في الدردشة
    socket.on('send-message', (data) => {
        const { meetingId, message, userName } = data;
        io.to(meetingId).emit('new-message', {
            userName: userName,
            message: message,
            time: new Date().toLocaleTimeString()
        });
    });
    
    // التحكم في المكالمة (كتم، إيقاف فيديو، إلخ)
    socket.on('control-call', (data) => {
        const { meetingId, action, value } = data;
        socket.to(meetingId).emit('call-control', {
            userId: socket.userId,
            action: action,
            value: value
        });
    });
    
    // مغادرة المكالمة
    socket.on('leave-meeting', (data) => {
        const { meetingId, userId } = data;
        
        socket.leave(meetingId);
        socket.to(meetingId).emit('user-left', {
            userId: userId,
            participants: getMeetingParticipants(meetingId)
        });
        
        console.log(`المستخدم ${userId} غادر ${meetingId}`);
    });
    
    socket.on('disconnect', () => {
        if (socket.meetingId) {
            socket.to(socket.meetingId).emit('user-disconnected', {
                userId: socket.userId
            });
        }
    });
});

// دالة مساعدة للحصول على المشاركين
function getMeetingParticipants(meetingId) {
    const room = io.sockets.adapter.rooms.get(meetingId);
    return room ? Array.from(room).length : 0;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ الخادم يعمل على http://localhost:${PORT}`);
});
