const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const utils = require('./utils');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// خدمة الملفات الثابتة
app.use(express.static(path.join(__dirname, '../frontend')));

// تخزين اتصالات Socket
const socketConnections = new Map();

// API Routes

// 1. إنشاء مكالمة جديدة
app.post('/api/create-meeting', (req, res) => {
    const { hostName, userName, options = {} } = req.body;
    
    if (!hostName && !userName) {
        return res.status(400).json({
            success: false,
            message: 'الرجاء إدخال اسم المضيف'
        });
    }
    
    const name = hostName || userName;
    
    try {
        const meeting = utils.createMeeting(name, options);
        
        // تسجيل الحدث
        utils.logMeetingEvent(meeting.meetingId, 'meeting_created', {
            hostName: name,
            options: options,
            ip: req.ip
        });
        
        res.json({
            success: true,
            meetingId: meeting.meetingId,
            hostId: meeting.hostId,
            hostLink: `${req.protocol}://${req.get('host')}/meeting.html?room=${meeting.meetingId}&host=true&id=${meeting.hostId}`,
            guestLink: `${req.protocol}://${req.get('host')}/meeting.html?room=${meeting.meetingId}`,
            quickJoinLink: `${req.protocol}://${req.get('host')}/join/${meeting.meetingId}`,
            message: 'تم إنشاء الرابط بنجاح',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error creating meeting:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'حدث خطأ في إنشاء المكالمة'
        });
    }
});

// 2. التحقق من وجود مكالمة
app.get('/api/meeting/:id', (req, res) => {
    const meetingId = req.params.id;
    const meeting = utils.getMeetingInfo(meetingId);
    
    if (meeting) {
        res.json({
            exists: true,
            ...meeting,
            joinUrl: `${req.protocol}://${req.get('host')}/meeting.html?room=${meetingId}`
        });
    } else {
        res.json({ 
            exists: false,
            message: 'المكالمة غير موجودة أو انتهت'
        });
    }
});

// 3. الحصول على معلومات مفصلة عن المكالمة
app.get('/api/meeting/:id/details', (req, res) => {
    const meetingId = req.params.id;
    const userId = req.query.userId;
    
    const meeting = utils.storage.meetings.get(meetingId);
    if (!meeting) {
        return res.status(404).json({ 
            error: 'المكالمة غير موجودة',
            code: 'MEETING_NOT_FOUND'
        });
    }
    
    res.json(utils.sanitizeMeetingData(meeting, userId));
});

// 4. الحصول على رسائل المكالمة
app.get('/api/meeting/:id/messages', (req, res) => {
    const meetingId = req.params.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const messages = utils.getMeetingMessages(meetingId, limit, offset);
    res.json({ 
        success: true,
        messages: messages,
        total: messages.length,
        limit: limit,
        offset: offset
    });
});

// 5. الحصول على ملفات المكالمة
app.get('/api/meeting/:id/files', (req, res) => {
    const meetingId = req.params.id;
    const files = utils.getMeetingFiles(meetingId);
    
    res.json({ 
        success: true,
        files: files,
        total: files.length
    });
});

// 6. الحصول على إحصائيات المكالمة
app.get('/api/meeting/:id/stats', (req, res) => {
    const meetingId = req.params.id;
    const meeting = utils.storage.meetings.get(meetingId);
    
    if (!meeting) {
        return res.status(404).json({ 
            success: false,
            error: 'المكالمة غير موجودة'
        });
    }
    
    res.json({
        success: true,
        stats: meeting.stats,
        duration: utils.formatDuration(meeting.stats.duration),
        formattedDuration: utils.formatDuration(meeting.stats.duration),
        participantHistory: Array.from(meeting.participants.values()).map(p => ({
            name: p.name,
            isHost: p.isHost,
            joinedAt: p.joinedAt,
            leftAt: p.leftAt,
            duration: p.leftAt ? utils.formatDuration(p.leftAt - p.joinedAt) : 'مستمر',
            status: p.status
        }))
    });
});

// 7. البحث في المكالمات
app.get('/api/meetings/search', (req, res) => {
    const { q, status, startDate, endDate, limit = 20, page = 1 } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const results = utils.searchMeetings(q, filters);
    
    // تطبيق التقسيم (pagination)
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedResults = results.slice(startIndex, endIndex);
    
    res.json({
        success: true,
        results: paginatedResults,
        total: results.length,
        page: parseInt(page),
        totalPages: Math.ceil(results.length / limit),
        hasNext: endIndex < results.length,
        hasPrev: startIndex > 0
    });
});

// 8. إنشاء رمز وصول سريع
app.post('/api/meeting/:id/quick-access', (req, res) => {
    const meetingId = req.params.id;
    const { expiresInMinutes = 60 } = req.body;
    
    const meeting = utils.storage.meetings.get(meetingId);
    if (!meeting) {
        return res.status(404).json({
            success: false,
            message: 'المكالمة غير موجودة'
        });
    }
    
    const quickAccess = utils.generateQuickAccessCode(meetingId, expiresInMinutes);
    
    // تخزين الرمز (في الإصدار الحقيقي سيتم تخزينه في قاعدة بيانات)
    if (!utils.storage.quickAccessCodes) {
        utils.storage.quickAccessCodes = new Map();
    }
    utils.storage.quickAccessCodes.set(quickAccess.code, quickAccess);
    
    res.json({
        success: true,
        code: quickAccess.code,
        expiresAt: quickAccess.expiresAt,
        joinUrl: `${req.protocol}://${req.get('host')}/join/${quickAccess.code}`
    });
});

// 9. التحقق من رمز الوصول السريع
app.get('/api/quick-access/:code', (req, res) => {
    const code = req.params.code;
    
    if (!utils.storage.quickAccessCodes) {
        return res.json({ valid: false });
    }
    
    const quickAccess = utils.storage.quickAccessCodes.get(code);
    if (!quickAccess) {
        return res.json({ valid: false });
    }
    
    const isValid = utils.verifyQuickAccessCode(code, quickAccess.meetingId);
    
    res.json({
        valid: isValid,
        meetingId: quickAccess.meetingId,
        expiresAt: quickAccess.expiresAt,
        joinUrl: `${req.protocol}://${req.get('host')}/meeting.html?room=${quickAccess.meetingId}`
    });
});

// 10. صفحة الانضمام السريع
app.get('/join/:code', (req, res) => {
    const code = req.params.code;
    
    // التحقق إذا كان رمز مكالمة عادي
    if (utils.validateMeetingCode(code)) {
        return res.redirect(`/meeting.html?room=${code}`);
    }
    
    // التحقق إذا كان رمز وصول سريع
    if (utils.storage.quickAccessCodes) {
        const quickAccess = utils.storage.quickAccessCodes.get(code);
        if (quickAccess && utils.verifyQuickAccessCode(code, quickAccess.meetingId)) {
            // تحديث حالة الرمز
            quickAccess.used = true;
            quickAccess.usedAt = new Date();
            
            return res.redirect(`/meeting.html?room=${quickAccess.meetingId}`);
        }
    }
    
    // إذا لم يكن صالحاً، عرض صفحة الخطأ
    res.sendFile(path.join(__dirname, '../frontend/error.html'));
});

// 11. تحميل ملف
app.post('/api/upload', (req, res) => {
    // في الإصدار الحقيقي، سيكون هنا معالجة رفع الملفات باستخدام multer
    res.json({
        success: true,
        message: 'ميزة رفع الملفات قريباً',
        note: 'يجب إضافة multer لمعالجة رفع الملفات'
    });
});

// 12. التحقق من صحة الخادم
app.get('/api/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        meetings: utils.storage.meetings.size,
        users: utils.storage.users.size,
        messages: utils.storage.messages.size,
        files: utils.storage.files.size
    };
    
    res.json(health);
});

// 13. الحصول على إحصائيات النظام
app.get('/api/stats', (req, res) => {
    const stats = {
        totalMeetings: utils.storage.meetings.size,
        activeMeetings: Array.from(utils.storage.meetings.values())
            .filter(m => m.status === 'active').length,
        totalUsers: utils.storage.users.size,
        totalMessages: utils.storage.messages.size,
        totalFiles: utils.storage.files.size,
        activeConnections: socketConnections.size,
        serverTime: new Date().toISOString(),
        serverUptime: process.uptime()
    };
    
    res.json(stats);
});

// 14. الحصول على المكالمات النشطة
app.get('/api/meetings/active', (req, res) => {
    const activeMeetings = Array.from(utils.storage.meetings.values())
        .filter(m => m.status === 'active')
        .map(m => ({
            id: m.id,
            hostName: m.hostName,
            participants: m.participants.size,
            startedAt: m.startedAt,
            duration: utils.formatDuration(new Date() - m.startedAt)
        }));
    
    res.json({
        success: true,
        meetings: activeMeetings,
        total: activeMeetings.length
    });
});

// 15. نقطة نهاية الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/meeting.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/meeting.html'));
});

// Socket.io Handlers
io.on('connection', (socket) => {
    console.log('✅ مستخدم جديد متصل:', socket.id);
    
    // تخزين اتصال السوكيت
    socketConnections.set(socket.id, {
        socketId: socket.id,
        connectedAt: new Date(),
        meetingId: null,
        userId: null
    });
    
    // الانضمام إلى مكالمة
    socket.on('join-meeting', async (data) => {
        const { meetingId, userId, userName, isHost = false } = data;
        
        console.log(`🎯 محاولة الانضمام: ${userName} (${userId}) إلى ${meetingId}`);
        
        try {
            // التحقق من وجود المكالمة
            const meeting = utils.storage.meetings.get(meetingId);
            if (!meeting) {
                socket.emit('meeting-error', {
                    message: 'المكالمة غير موجودة أو انتهت'
                });
                return;
            }
            
            // إضافة المستخدم إلى المكالمة
            const participant = utils.addParticipantToMeeting(
                meetingId, 
                userId, 
                userName, 
                isHost
            );
            
            // تحديث اتصال السوكيت
            const connection = socketConnections.get(socket.id);
            if (connection) {
                connection.meetingId = meetingId;
                connection.userId = userId;
                connection.userName = userName;
            }
            
            // الانضمام إلى غرفة المكالمة
            socket.join(meetingId);
            
            // تخزين معرف المكالمة في السوكيت
            socket.meetingId = meetingId;
            socket.userId = userId;
            socket.userName = userName;
            
            // تسجيل حدث الانضمام
            utils.logMeetingEvent(meetingId, 'user_joined', {
                userId: userId,
                userName: userName,
                isHost: isHost,
                socketId: socket.id
            });
            
            // إرسال تأكيد الانضمام
            socket.emit('joined-meeting', {
                meetingId: meetingId,
                userId: userId,
                meetingInfo: utils.sanitizeMeetingData(meeting, userId),
                participants: Array.from(meeting.participants.values()).map(p => ({
                    id: p.id,
                    name: p.name,
                    isHost: p.isHost,
                    devices: p.devices
                }))
            });
            
            // إعلام المشاركين الآخرين
            socket.to(meetingId).emit('user-joined', {
                userId: userId,
                userName: userName,
                isHost: isHost,
                participants: meeting.participants.size,
                participantList: Array.from(meeting.participants.values()).map(p => ({
                    id: p.id,
                    name: p.name
                }))
            });
            
            console.log(`✅ ${userName} انضم إلى ${meetingId}`);
            
        } catch (error) {
            console.error('❌ خطأ في الانضمام:', error);
            socket.emit('meeting-error', {
                message: error.message || 'حدث خطأ في الانضمام إلى المكالمة'
            });
        }
    });
    
    // إرسال إشارة WebRTC
    socket.on('signal', (data) => {
        const { to, signal, type } = data;
        
        // إرسال الإشارة إلى المستلم
        socket.to(to).emit('signal', {
            from: socket.userId,
            signal: signal,
            type: type,
            timestamp: new Date().toISOString()
        });
    });
    
    // إرسال رسالة دردشة
    socket.on('send-message', (data) => {
        const { meetingId, message, type = 'text' } = data;
        
        if (!meetingId || !message) return;
        
        try {
            // حفظ الرسالة
            const savedMessage = utils.addMessageToMeeting(
                meetingId,
                socket.userId,
                message,
                type
            );
            
            if (savedMessage) {
                // بث الرسالة لجميع المشاركين
                io.to(meetingId).emit('new-message', {
                    id: savedMessage.id,
                    userId: socket.userId,
                    userName: socket.userName,
                    message: message,
                    type: type,
                    timestamp: savedMessage.timestamp,
                    readBy: [socket.userId]
                });
                
                // تسجيل حدث الرسالة
                utils.logMeetingEvent(meetingId, 'message_sent', {
                    userId: socket.userId,
                    messageId: savedMessage.id,
                    type: type
                });
            }
        } catch (error) {
            console.error('❌ خطأ في إرسال الرسالة:', error);
        }
    });
    
    // تحديث حالة الجهاز
    socket.on('update-device', (data) => {
        const { meetingId, device, status } = data;
        
        try {
            const updated = utils.updateUserDeviceStatus(
                meetingId,
                socket.userId,
                device,
                status
            );
            
            if (updated) {
                // إعلام المشاركين الآخرين
                socket.to(meetingId).emit('device-updated', {
                    userId: socket.userId,
                    device: device,
                    status: status,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('❌ خطأ في تحديث الجهاز:', error);
        }
    });
    
    // مشاركة الشاشة
    socket.on('screen-share', (data) => {
        const { meetingId, isSharing } = data;
        
        // تحديث حالة جهاز المستخدم
        utils.updateUserDeviceStatus(
            meetingId,
            socket.userId,
            'screenShare',
            isSharing
        );
        
        // إعلام المشاركين الآخرين
        socket.to(meetingId).emit('screen-sharing', {
            userId: socket.userId,
            isSharing: isSharing,
            timestamp: new Date().toISOString()
        });
    });
    
    // طلب معلومات المشاركين
    socket.on('request-participants', (data) => {
        const { meetingId } = data;
        
        const meeting = utils.storage.meetings.get(meetingId);
        if (!meeting) return;
        
        const participants = Array.from(meeting.participants.values()).map(p => ({
            id: p.id,
            name: p.name,
            isHost: p.isHost,
            devices: p.devices,
            joinedAt: p.joinedAt
        }));
        
        socket.emit('participants-list', {
            meetingId: meetingId,
            participants: participants
        });
    });
    
    // التحكم في المكالمة (كتم، إزالة، إلخ)
    socket.on('control-call', (data) => {
        const { meetingId, action, targetUserId, value } = data;
        
        // التحقق من صلاحيات المستخدم
        const hasPermission = utils.checkUserPermission(
            meetingId,
            socket.userId,
            'moderate'
        );
        
        if (!hasPermission) {
            socket.emit('permission-denied', {
                action: action,
                message: 'ليس لديك صلاحية لهذا الإجراء'
            });
            return;
        }
        
        // تنفيذ الإجراء
        switch (action) {
            case 'mute':
            case 'unmute':
                socket.to(targetUserId).emit('call-control', {
                    action: 'audio',
                    value: action === 'mute' ? false : true,
                    by: socket.userId
                });
                break;
                
            case 'stop-video':
                socket.to(targetUserId).emit('call-control', {
                    action: 'video',
                    value: false,
                    by: socket.userId
                });
                break;
                
            case 'remove':
                // إزالة المستخدم من المكالمة
                const removed = utils.removeParticipantFromMeeting(
                    meetingId,
                    targetUserId
                );
                
                if (removed) {
                    // إعلام المستخدم بإزالته
                    socket.to(targetUserId).emit('removed-from-meeting', {
                        by: socket.userId,
                        reason: value || 'تمت إزالته من قبل المضيف'
                    });
                    
                    // إغلاق اتصال السوكيت الخاص به
                    io.sockets.sockets.get(targetUserId)?.disconnect();
                    
                    // إعلام الآخرين
                    socket.to(meetingId).emit('user-removed', {
                        userId: targetUserId,
                        by: socket.userId
                    });
                }
                break;
                
            case 'make-host':
                // جعل مستخدم مضيفاً (سيتم تنفيذه في قاعدة بيانات حقيقية)
                socket.to(meetingId).emit('new-host', {
                    newHostId: targetUserId,
                    by: socket.userId
                });
                break;
        }
        
        // تسجيل حدث التحكم
        utils.logMeetingEvent(meetingId, 'call_control', {
            action: action,
            byUserId: socket.userId,
            targetUserId: targetUserId,
            value: value
        });
    });
    
    // النقر للتحدث (Push to Talk)
    socket.on('push-to-talk', (data) => {
        const { meetingId, isTalking } = data;
        
        socket.to(meetingId).emit('user-talking', {
            userId: socket.userId,
            isTalking: isTalking,
            timestamp: new Date().toISOString()
        });
    });
    
    // تفاعل المستخدم (رفع يد، تفاعل)
    socket.on('user-reaction', (data) => {
        const { meetingId, reaction } = data;
        
        socket.to(meetingId).emit('reaction', {
            userId: socket.userId,
            userName: socket.userName,
            reaction: reaction,
            timestamp: new Date().toISOString()
        });
    });
    
    // مغادرة المكالمة
    socket.on('leave-meeting', (data) => {
        const { meetingId, userId } = data;
        
        console.log(`👋 ${socket.userName} يغادر ${meetingId}`);
        
        // إزالة المستخدم من المكالمة
        const removed = utils.removeParticipantFromMeeting(meetingId, userId);
        
        if (removed) {
            // إعلام المشاركين الآخرين
            socket.to(meetingId).emit('user-left', {
                userId: userId,
                userName: socket.userName,
                participants: utils.storage.meetings.get(meetingId)?.participants.size || 0
            });
            
            // تسجيل حدث المغادرة
            utils.logMeetingEvent(meetingId, 'user_left', {
                userId: userId,
                userName: socket.userName
            });
        }
        
        // مغادرة غرفة السوكيت
        socket.leave(meetingId);
        
        // تنظيف بيانات السوكيت
        delete socket.meetingId;
        delete socket.userId;
        delete socket.userName;
    });
    
    // نقر قلب (keep-alive)
    socket.on('heartbeat', () => {
        socket.emit('heartbeat-response', {
            timestamp: new Date().toISOString(),
            serverTime: Date.now()
        });
    });
    
    // عند انقطاع الاتصال
    socket.on('disconnect', () => {
        console.log('❌ مستخدم منفصل:', socket.id);
        
        // إذا كان المستخدم في مكالمة
        if (socket.meetingId && socket.userId) {
            // إزالة المستخدم من المكالمة
            const removed = utils.removeParticipantFromMeeting(
                socket.meetingId,
                socket.userId
            );
            
            if (removed) {
                // إعلام المشاركين الآخرين
                socket.to(socket.meetingId).emit('user-disconnected', {
                    userId: socket.userId,
                    userName: socket.userName,
                    reason: 'انقطع الاتصال'
                });
                
                // تسجيل حدث الانقطاع
                utils.logMeetingEvent(socket.meetingId, 'user_disconnected', {
                    userId: socket.userId,
                    userName: socket.userName,
                    socketId: socket.id
                });
            }
        }
        
        // إزالة اتصال السوكيت
        socketConnections.delete(socket.id);
    });
});

// جدولة تنظيف المكالمات المنتهية كل 30 دقيقة
setInterval(() => {
    try {
        const cleaned = utils.cleanupExpiredMeetings();
        if (cleaned.length > 0) {
            console.log(`🧹 تم تنظيف ${cleaned.length} مكالمة منتهية`);
        }
    } catch (error) {
        console.error('❌ خطأ في التنظيف:', error);
    }
}, 30 * 60 * 1000);

// بدء الخادم
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`🚀 الخادم يعمل على http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log(`📊 إحصائيات التخزين الأولية:`);
    console.log(`   - المكالمات: ${utils.storage.meetings.size}`);
    console.log(`   - المستخدمين: ${utils.storage.users.size}`);
    console.log(`   - الرسائل: ${utils.storage.messages.size}`);
    console.log(`   - الملفات: ${utils.storage.files.size}`);
    console.log(`\n📎 روابط مهمة:`);
    console.log(`   - الصفحة الرئيسية: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log(`   - صفحة المكالمة: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/meeting.html`);
    console.log(`   - التحقق من الصحة: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api/health`);
    console.log(`   - إحصائيات النظام: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api/stats`);
    console.log(`\n✅ جاهز لاستقبال المكالمات!`);
});

// معالجة الأخطاء غير المتوقعة
process.on('uncaughtException', (error) => {
    console.error('⚠️ خطأ غير متوقع:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ وعد مرفوض غير معالج:', reason);
});

// عند إغلاق الخادم
process.on('SIGINT', () => {
    console.log('\n🛑 إيقاف الخادم...');
    
    // حفظ البيانات (في الإصدار الحقيقي سيتم حفظها في قاعدة بيانات)
    console.log('💾 حفظ البيانات...');
    
    // إغلاق جميع اتصالات السوكيت
    io.close();
    server.close();
    
    console.log('👋 تم إيقاف الخادم');
    process.exit(0);
});

// تصدير للتطبيقات الاختبارية
module.exports = { app, server, io };
