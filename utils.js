// ملف الأدوات المساعدة للخادم

const crypto = require('crypto');

// كائن التخزين في الذاكرة (بديل مؤقت لقاعدة البيانات)
const storage = {
    meetings: new Map(),       // تخزين المكالمات
    users: new Map(),          // تخزين المستخدمين المتصلين
    messages: new Map(),       // تخزين الرسائل
    files: new Map()           // تخزين الملفات
};

// توليد معرف فريد
function generateId(type = 'meeting') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    
    let prefix;
    switch(type) {
        case 'meeting': prefix = 'mt'; break;
        case 'user': prefix = 'usr'; break;
        case 'message': prefix = 'msg'; break;
        case 'file': prefix = 'file'; break;
        default: prefix = 'id';
    }
    
    return `${prefix}_${timestamp}_${random}`;
}

// توليد رمز مكالمة قصير (مثل Google Meet)
function generateMeetingCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const hyphenPositions = [3, 7]; // positions for hyphens: xxx-xxx-xxxx
    
    let code = '';
    for (let i = 0; i < 10; i++) {
        if (hyphenPositions.includes(i)) {
            code += '-';
        }
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return code;
}

// إنشاء مكالمة جديدة
function createMeeting(hostName, options = {}) {
    const meetingId = generateMeetingCode();
    const hostId = generateId('user');
    const createdAt = new Date();
    
    const meeting = {
        id: meetingId,
        hostId: hostId,
        hostName: hostName,
        participants: new Map(),
        messages: [],
        files: [],
        settings: {
            maxParticipants: options.maxParticipants || 100,
            allowVideo: options.allowVideo !== false,
            allowAudio: options.allowAudio !== false,
            allowScreenShare: options.allowScreenShare !== false,
            requireAuth: options.requireAuth || false,
            recordingAllowed: options.recordingAllowed || false,
            waitingRoom: options.waitingRoom || false
        },
        status: 'active',
        createdAt: createdAt,
        startedAt: null,
        endedAt: null,
        stats: {
            totalParticipants: 0,
            messagesCount: 0,
            filesCount: 0,
            duration: 0
        }
    };
    
    // إضافة المضيف كمشارك
    addParticipantToMeeting(meetingId, hostId, hostName, true);
    
    // حفظ المكالمة
    storage.meetings.set(meetingId, meeting);
    
    return {
        meetingId: meetingId,
        hostId: hostId,
        hostLink: `/meeting/${meetingId}?host=true&id=${hostId}`,
        guestLink: `/meeting/${meetingId}`,
        meeting: meeting
    };
}

// إضافة مشارك إلى مكالمة
function addParticipantToMeeting(meetingId, userId, userName, isHost = false) {
    const meeting = storage.meetings.get(meetingId);
    if (!meeting) {
        throw new Error('المكالمة غير موجودة');
    }
    
    // التحقق من الحد الأقصى للمشاركين
    if (meeting.participants.size >= meeting.settings.maxParticipants) {
        throw new Error('تم الوصول إلى الحد الأقصى للمشاركين');
    }
    
    const participant = {
        id: userId,
        name: userName,
        isHost: isHost,
        joinedAt: new Date(),
        leftAt: null,
        status: 'joined',
        devices: {
            audio: true,
            video: true,
            screenShare: false
        },
        connectionInfo: {
            socketId: null,
            peerId: null,
            lastSeen: new Date()
        }
    };
    
    meeting.participants.set(userId, participant);
    meeting.stats.totalParticipants = meeting.participants.size;
    
    // إذا كانت أول مشاركة، تعيين وقت البدء
    if (meeting.participants.size === 1 && !meeting.startedAt) {
        meeting.startedAt = new Date();
    }
    
    // حفظ المستخدم في التخزين العام
    storage.users.set(userId, {
        userId: userId,
        meetingId: meetingId,
        userName: userName,
        joinedAt: new Date()
    });
    
    return participant;
}

// إزالة مشارك من مكالمة
function removeParticipantFromMeeting(meetingId, userId) {
    const meeting = storage.meetings.get(meetingId);
    if (!meeting) return false;
    
    const participant = meeting.participants.get(userId);
    if (participant) {
        participant.leftAt = new Date();
        participant.status = 'left';
        meeting.participants.delete(userId);
        
        // إذا لم يبقى أي مشاركين، إنهاء المكالمة
        if (meeting.participants.size === 0) {
            meeting.endedAt = new Date();
            meeting.status = 'ended';
            meeting.stats.duration = meeting.endedAt - meeting.startedAt;
        }
        
        return true;
    }
    
    return false;
}

// الحصول على معلومات المكالمة
function getMeetingInfo(meetingId) {
    const meeting = storage.meetings.get(meetingId);
    if (!meeting) return null;
    
    const participants = Array.from(meeting.participants.values()).map(p => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        status: p.status,
        joinedAt: p.joinedAt,
        devices: p.devices
    }));
    
    return {
        id: meeting.id,
        hostName: meeting.hostName,
        participants: participants,
        participantCount: meeting.participants.size,
        settings: meeting.settings,
        status: meeting.status,
        createdAt: meeting.createdAt,
        startedAt: meeting.startedAt,
        duration: meeting.stats.duration,
        stats: meeting.stats
    };
}

// إضافة رسالة إلى المكالمة
function addMessageToMeeting(meetingId, userId, message, type = 'text') {
    const meeting = storage.meetings.get(meetingId);
    if (!meeting) return null;
    
    const participant = meeting.participants.get(userId);
    if (!participant) return null;
    
    const messageId = generateId('message');
    const messageObj = {
        id: messageId,
        meetingId: meetingId,
        userId: userId,
        userName: participant.name,
        type: type,
        content: message,
        timestamp: new Date(),
        readBy: new Set([userId]),
        deleted: false
    };
    
    meeting.messages.push(messageObj);
    meeting.stats.messagesCount++;
    
    // تخزين الرسالة بشكل منفصل للبحث السريع
    storage.messages.set(messageId, messageObj);
    
    return messageObj;
}

// الحصول على رسائل المكالمة
function getMeetingMessages(meetingId, limit = 50, offset = 0) {
    const meeting = storage.meetings.get(meetingId);
    if (!meeting) return [];
    
    return meeting.messages
        .slice(offset, offset + limit)
        .map(msg => ({
            id: msg.id,
            userName: msg.userName,
            type: msg.type,
            content: msg.content,
            timestamp: msg.timestamp,
            readBy: Array.from(msg.readBy)
        }));
}

// رفع ملف إلى المكالمة
function uploadFileToMeeting(meetingId, userId, fileInfo) {
    const meeting = storage.meetings.get(meetingId);
    if (!meeting) return null;
    
    const participant = meeting.participants.get(userId);
    if (!participant) return null;
    
    const fileId = generateId('file');
    const fileObj = {
        id: fileId,
        meetingId: meetingId,
        userId: userId,
        userName: participant.name,
        originalName: fileInfo.originalName,
        fileName: fileInfo.fileName,
        fileType: fileInfo.fileType,
        fileSize: fileInfo.fileSize,
        uploadDate: new Date(),
        downloadCount: 0,
        deleted: false
    };
    
    meeting.files.push(fileObj);
    meeting.stats.filesCount++;
    
    // تخزين الملف بشكل منفصل
    storage.files.set(fileId, fileObj);
    
    return fileObj;
}

// الحصول على ملفات المكالمة
function getMeetingFiles(meetingId) {
    const meeting = storage.meetings.get(meetingId);
    if (!meeting) return [];
    
    return meeting.files.map(file => ({
        id: file.id,
        userName: file.userName,
        originalName: file.originalName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        uploadDate: file.uploadDate,
        downloadCount: file.downloadCount,
        downloadUrl: `/api/files/${file.id}`
    }));
}

// تحديث حالة جهاز المستخدم
function updateUserDeviceStatus(meetingId, userId, device, status) {
    const meeting = storage.meetings.get(meetingId);
    if (!meeting) return false;
    
    const participant = meeting.participants.get(userId);
    if (!participant) return false;
    
    if (device === 'audio' || device === 'video' || device === 'screenShare') {
        participant.devices[device] = status;
        return true;
    }
    
    return false;
}

// التحقق من صلاحيات المستخدم
function checkUserPermission(meetingId, userId, permission) {
    const meeting = storage.meetings.get(meetingId);
    if (!meeting) return false;
    
    const participant = meeting.participants.get(userId);
    if (!participant) return false;
    
    switch(permission) {
        case 'host':
            return participant.isHost;
        case 'moderate':
            return participant.isHost || meeting.settings.allowAllModerate;
        case 'share_screen':
            return meeting.settings.allowScreenShare;
        case 'record':
            return participant.isHost && meeting.settings.recordingAllowed;
        default:
            return true;
    }
}

// البحث عن مكالمة
function searchMeetings(query, filters = {}) {
    const results = [];
    
    for (const [meetingId, meeting] of storage.meetings) {
        let match = true;
        
        // البحث في المعرف
        if (query && !meetingId.toLowerCase().includes(query.toLowerCase())) {
            match = false;
        }
        
        // التصفية حسب الحالة
        if (filters.status && meeting.status !== filters.status) {
            match = false;
        }
        
        // التصفية حسب التاريخ
        if (filters.startDate && meeting.createdAt < new Date(filters.startDate)) {
            match = false;
        }
        
        if (filters.endDate && meeting.createdAt > new Date(filters.endDate)) {
            match = false;
        }
        
        if (match) {
            results.push({
                id: meeting.id,
                hostName: meeting.hostName,
                participantCount: meeting.participants.size,
                status: meeting.status,
                createdAt: meeting.createdAt,
                duration: meeting.stats.duration
            });
        }
    }
    
    return results;
}

// تنظيف المكالمات المنتهية
function cleanupExpiredMeetings(maxAgeHours = 24) {
    const now = new Date();
    const expiredMeetings = [];
    
    for (const [meetingId, meeting] of storage.meetings) {
        if (meeting.status === 'ended') {
            const ageHours = (now - meeting.endedAt) / (1000 * 60 * 60);
            
            if (ageHours > maxAgeHours) {
                // حذف المكالمة والبيانات المرتبطة
                storage.meetings.delete(meetingId);
                
                // حذف رسائل المكالمة
                meeting.messages.forEach(msg => {
                    storage.messages.delete(msg.id);
                });
                
                // حذف ملفات المكالمة
                meeting.files.forEach(file => {
                    storage.files.delete(file.id);
                });
                
                // حذف المستخدمين
                for (const [userId, user] of storage.users) {
                    if (user.meetingId === meetingId) {
                        storage.users.delete(userId);
                    }
                }
                
                expiredMeetings.push(meetingId);
            }
        }
    }
    
    return expiredMeetings;
}

// توليد تقرير عن المكالمة
function generateMeetingReport(meetingId) {
    const meeting = storage.meetings.get(meetingId);
    if (!meeting) return null;
    
    const participants = Array.from(meeting.participants.values());
    const messages = meeting.messages;
    const files = meeting.files;
    
    return {
        meetingId: meeting.id,
        hostName: meeting.hostName,
        createdAt: meeting.createdAt,
        startedAt: meeting.startedAt,
        endedAt: meeting.endedAt,
        duration: meeting.stats.duration,
        participants: {
            total: participants.length,
            list: participants.map(p => ({
                name: p.name,
                isHost: p.isHost,
                joinedAt: p.joinedAt,
                leftAt: p.leftAt,
                status: p.status
            }))
        },
        messages: {
            total: messages.length,
            byType: messages.reduce((acc, msg) => {
                acc[msg.type] = (acc[msg.type] || 0) + 1;
                return acc;
            }, {})
        },
        files: {
            total: files.length,
            byType: files.reduce((acc, file) => {
                const type = file.fileType.split('/')[0];
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {})
        },
        settings: meeting.settings
    };
}

// التحقق من صحة الرمز
function validateMeetingCode(code) {
    const pattern = /^[A-Za-z0-9]{3}-[A-Za-z0-9]{3}-[A-Za-z0-9]{4}$/;
    return pattern.test(code);
}

// تشفير البيانات الحساسة
function encryptData(data, key = 'meeting-app-secret') {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// فك تشفير البيانات
function decryptData(encryptedData, key = 'meeting-app-secret') {
    try {
        const decipher = crypto.createDecipher('aes-256-cbc', key);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    } catch (error) {
        return null;
    }
}

// إنشاء رمز وصول سريع (Quick Access)
function generateQuickAccessCode(meetingId, expiresInMinutes = 60) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    
    return {
        code: code,
        meetingId: meetingId,
        expiresAt: expiresAt,
        used: false,
        createdAt: new Date()
    };
}

// التحقق من رمز الوصول السريع
function verifyQuickAccessCode(code, meetingId) {
    // في الإصدار الحقيقي، سيتم تخزين هذه في قاعدة بيانات
    // هذا مجرد مثال
    const storedCode = storage.quickAccessCodes?.get(code);
    
    if (!storedCode) return false;
    if (storedCode.meetingId !== meetingId) return false;
    if (storedCode.used) return false;
    if (new Date() > storedCode.expiresAt) return false;
    
    return true;
}

// تسجيل حدث المكالمة
function logMeetingEvent(meetingId, eventType, data = {}) {
    const event = {
        id: generateId('event'),
        meetingId: meetingId,
        type: eventType,
        data: data,
        timestamp: new Date(),
        ip: data.ip || 'unknown'
    };
    
    // في الإصدار الحقيقي، سيتم تخزين الأحداث في قاعدة بيانات
    console.log(`[MEETING EVENT] ${meetingId} - ${eventType}:`, data);
    
    return event;
}

// تحويل الوقت إلى صيغة مقروءة
function formatDuration(ms) {
    if (!ms) return '00:00';
    
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// تنسيق حجم الملف
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// تصفية البيانات الحساسة قبل الإرسال
function sanitizeMeetingData(meeting, userId = null) {
    const sanitized = { ...meeting };
    
    // إزالة البيانات الحساسة
    delete sanitized.messages; // سيكون لها نقطة نهاية منفصلة
    delete sanitized.files; // سيكون لها نقطة نهاية منفصلة
    
    // تحويل Map إلى Array للمشاركين
    sanitized.participants = Array.from(meeting.participants.values()).map(p => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        status: p.status,
        joinedAt: p.joinedAt,
        devices: p.devices
    }));
    
    // إخفاء بعض المعلومات بناءً على المستخدم
    if (!userId || !meeting.participants.has(userId)) {
        delete sanitized.settings;
        delete sanitized.stats;
    }
    
    return sanitized;
}

// تصدير الوظائف
module.exports = {
    // التخزين
    storage,
    
    // توليد المعرفات
    generateId,
    generateMeetingCode,
    
    // إدارة المكالمات
    createMeeting,
    getMeetingInfo,
    addParticipantToMeeting,
    removeParticipantFromMeeting,
    cleanupExpiredMeetings,
    
    // الرسائل والملفات
    addMessageToMeeting,
    getMeetingMessages,
    uploadFileToMeeting,
    getMeetingFiles,
    
    // إدارة المستخدمين
    updateUserDeviceStatus,
    checkUserPermission,
    
    // البحث والتقارير
    searchMeetings,
    generateMeetingReport,
    
    // التحقق والأمان
    validateMeetingCode,
    encryptData,
    decryptData,
    generateQuickAccessCode,
    verifyQuickAccessCode,
    
    // التسجيل
    logMeetingEvent,
    
    // التنسيق
    formatDuration,
    formatFileSize,
    sanitizeMeetingData
};