// ملف اجتماع المكالمة

let socket;
let userId;
let meetingId;
let userName;
let isHost = false;

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    // الحصول على معلمات الرابط
    const urlParams = new URLSearchParams(window.location.search);
    meetingId = urlParams.get('room') || generateMeetingId();
    userName = urlParams.get('name') || 'مستخدم';
    isHost = urlParams.has('host');
    userId = urlParams.get('id') || generateUserId();
    
    // تحديث واجهة الترحيب
    document.getElementById('displayMeetingId').textContent = meetingId;
    document.getElementById('displayUserName').textContent = userName;
    document.getElementById('meetingId').textContent = `المكالمة: ${meetingId}`;
    
    // الاتصال بالخادم
    await connectToServer();
    
    // عرض نافذة الترحيب
    document.getElementById('welcomeModal').style.display = 'flex';
});

// الاتصال بخادم Socket.io
async function connectToServer() {
    const socketUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000'
        : window.location.origin;
    
    socket = io(socketUrl);
    
    // مستمعي Socket.io
    socket.on('connect', () => {
        console.log('✅ متصل بالخادم');
    });
    
    socket.on('connect_error', (error) => {
        console.error('❌ خطأ في الاتصال:', error);
        showError('تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
    });
    
    socket.on('user-joined', (data) => {
        updateParticipants(data.participants);
        addParticipantToList(data.userId, data.userName);
        showNotification(`انضم ${data.userName} إلى المكالمة`);
    });
    
    socket.on('user-left', (data) => {
        updateParticipants(data.participants);
        removeParticipantFromList(data.userId);
        showNotification(`غادر ${data.userId} المكالمة`);
    });
    
    socket.on('new-message', (data) => {
        addMessageToChat(data.userName, data.message, data.time);
    });
    
    socket.on('host-joined', (data) => {
        showNotification(`المضيف ${data.userName} انضم إلى المكالمة`);
    });
    
    // تهيئة معالج WebRTC
    try {
        await peerHandler.initialize(socket, userId, meetingId);
        
        // تعريف دوال الاستدعاء
        peerHandler.onRemoteStream = (stream, remoteUserId) => {
            addVideoStream(stream, remoteUserId);
        };
        
        peerHandler.onPeerRemoved = (remoteUserId) => {
            removeVideoStream(remoteUserId);
        };
    } catch (error) {
        console.error('❌ خطأ في تهيئة WebRTC:', error);
        showError('تعذر تهيئة المكالمة. تحقق من الأذونات.');
    }
}

// الانضمام إلى المكالمة
async function joinMeeting() {
    try {
        // إخفاء نافذة الترحيب
        document.getElementById('welcomeModal').style.display = 'none';
        
        // عرض الفيديو المحلي
        if (peerHandler.localStream) {
            const localVideo = document.getElementById('localVideo');
            localVideo.srcObject = peerHandler.localStream;
        }
        
        // الانضمام إلى المكالمة عبر Socket
        socket.emit('join-meeting', {
            meetingId: meetingId,
            userId: userId,
            userName: userName,
            isHost: isHost
        });
        
        // إضافة المستخدم الحالي إلى القائمة
        addParticipantToList(userId, userName);
        
        showNotification('تم الانضمام إلى المكالمة بنجاح!');
    } catch (error) {
        console.error('❌ خطأ في الانضمام:', error);
        showError('تعذر الانضمام إلى المكالمة');
    }
}

// إضافة فيديو عن بعد
function addVideoStream(stream, remoteUserId) {
    const videoGrid = document.getElementById('videoGrid');
    
    // التحقق من عدم وجود الفيديو مسبقاً
    if (document.getElementById(`video-${remoteUserId}`)) {
        return;
    }
    
    const videoContainer = document.createElement('div');
    videoContainer.className = 'remote-video-container';
    videoContainer.id = `video-${remoteUserId}`;
    
    const videoElement = document.createElement('video');
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    videoElement.srcObject = stream;
    
    const videoLabel = document.createElement('div');
    videoLabel.className = 'video-label';
    videoLabel.textContent = remoteUserId;
    
    videoContainer.appendChild(videoElement);
    videoContainer.appendChild(videoLabel);
    videoGrid.appendChild(videoContainer);
    
    // تحديث تخطيط الفيديو
    updateVideoLayout();
}

// إزالة فيديو عن بعد
function removeVideoStream(remoteUserId) {
    const videoElement = document.getElementById(`video-${remoteUserId}`);
    if (videoElement) {
        videoElement.remove();
        updateVideoLayout();
    }
}

// تحديث تخطيط الفيديو
function updateVideoLayout() {
    const videoGrid = document.getElementById('videoGrid');
    const videos = videoGrid.querySelectorAll('.remote-video-container');
    
    // تحديد عدد الأعمدة حسب عدد المشاركين
    const count = videos.length + 1; // +1 للفيديو المحلي
    let columns;
    
    if (count <= 2) {
        columns = 2;
    } else if (count <= 4) {
        columns = 2;
    } else if (count <= 9) {
        columns = 3;
    } else {
        columns = 4;
    }
    
    videoGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
}

// إضافة مشارك إلى القائمة
function addParticipantToList(userId, userName) {
    const participantsList = document.getElementById('participantsList');
    
    // التحقق من عدم وجود المشارك مسبقاً
    if (document.getElementById(`participant-${userId}`)) {
        return;
    }
    
    const listItem = document.createElement('li');
    listItem.id = `participant-${userId}`;
    listItem.innerHTML = `
        <i class="fas fa-user-circle"></i>
        <span>${userName}</span>
        <span class="user-id">(${userId.substring(0, 8)})</span>
    `;
    
    participantsList.appendChild(listItem);
}

// إزالة مشارك من القائمة
function removeParticipantFromList(userId) {
    const participantElement = document.getElementById(`participant-${userId}`);
    if (participantElement) {
        participantElement.remove();
    }
}

// تحديث عدد المشاركين
function updateParticipants(count) {
    document.getElementById('participantCount').textContent = count;
}

// إرسال رسالة
function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (message) {
        socket.emit('send-message', {
            meetingId: meetingId,
            message: message,
            userName: userName
        });
        
        // إضافة الرسالة للدردشة المحلية
        addMessageToChat(userName, message, new Date().toLocaleTimeString());
        chatInput.value = '';
    }
}

// إضافة رسالة للدردشة
function addMessageToChat(sender, message, time) {
    const chatMessages = document.getElementById('chatMessages');
    
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.innerHTML = `
        <div class="message-header">
            <strong>${sender}</strong>
            <small>${time}</small>
        </div>
        <div class="message-content">${message}</div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// تبديل الميكروفون
function toggleMic() {
    const isEnabled = peerHandler.toggleMic();
    const button = document.querySelector('[onclick="toggleMic()"]');
    
    if (isEnabled) {
        button.innerHTML = '<i class="fas fa-microphone"></i>';
        button.classList.remove('muted');
    } else {
        button.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        button.classList.add('muted');
    }
}

// تبديل الكاميرا
function toggleCamera() {
    const isEnabled = peerHandler.toggleCamera();
    const button = document.querySelector('[onclick="toggleCamera()"]');
    
    if (isEnabled) {
        button.innerHTML = '<i class="fas fa-video"></i>';
        button.classList.remove('muted');
    } else {
        button.innerHTML = '<i class="fas fa-video-slash"></i>';
        button.classList.add('muted');
    }
}

// مشاركة الشاشة
async function toggleScreenShare() {
    const isSharing = await peerHandler.toggleScreenShare();
    const button = document.querySelector('[onclick="toggleScreenShare()"]');
    
    if (isSharing) {
        button.innerHTML = '<i class="fas fa-stop-circle"></i> إيقاف المشاركة';
        button.classList.add('active');
    } else {
        button.innerHTML = '<i class="fas fa-desktop"></i> مشاركة الشاشة';
        button.classList.remove('active');
    }
}

// نسخ رابط المكالمة
function copyMeetingLink() {
    const meetingLink = `${window.location.origin}${window.location.pathname}?room=${meetingId}`;
    
    navigator.clipboard.writeText(meetingLink)
        .then(() => {
            showNotification('تم نسخ الرابط!');
        })
        .catch(err => {
            showNotification('تعذر نسخ الرابط', 'error');
        });
}

// تسجيل المكالمة
async function toggleRecording() {
    // تنفيذ تسجيل المكالمة هنا
    showNotification('ميزة التسجيل قريباً...', 'info');
}

// مغادرة المكالمة
function leaveMeeting() {
    if (confirm('هل تريد مغادرة المكالمة؟')) {
        // إرسال حدث المغادرة
        socket.emit('leave-meeting', {
            meetingId: meetingId,
            userId: userId
        });
        
        // إغلاق جميع اتصالات WebRTC
        peerHandler.closeAllConnections();
        
        // إغلاق اتصال Socket
        socket.disconnect();
        
        // العودة للصفحة الرئيسية
        window.location.href = '/';
    }
}

// عرض الإشعارات
function showNotification(message, type = 'success') {
    // يمكنك إضافة مكتبة إشعارات أو استخدام console.log مؤقتاً
    console.log(`🔔 ${message}`);
    
    // عرض رسالة مؤقتة
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#f44336' : '#4CAF50'};
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 9999;
        animation: fadeInOut 3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// عرض خطأ
function showError(message) {
    showNotification(message, 'error');
}

// توليد معرف مكالمة
function generateMeetingId() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// توليد معرف مستخدم
function generateUserId() {
    return 'user_' + Math.random().toString(36).substring(2, 9);
}

// عند إغلاق الصفحة
window.addEventListener('beforeunload', () => {
    if (socket && socket.connected) {
        socket.emit('leave-meeting', {
            meetingId: meetingId,
            userId: userId
        });
        peerHandler.closeAllConnections();
    }
});