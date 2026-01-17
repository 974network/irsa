let socket;
let currentUser;
let peerConnection;
let localStream;

// الاتصال بالخادم
function connectToServer() {
    socket = io('http://localhost:3000');
    
    socket.on('connect', () => {
        console.log('متصل بالخادم');
    });
    
    socket.on('receive_message', (data) => {
        displayMessage(data.sender, data.message);
    });
    
    socket.on('incoming_call', (data) => {
        if (confirm(`مكالمة واردة من ${data.from}. قبول؟`)) {
            startWebRTC(false, data.signal);
            socket.emit('accept_call', { to: data.from, signal: peerConnection.signal });
        }
    });
    
    socket.on('call_accepted', (signal) => {
        peerConnection.signal(signal);
    });
}

// تسجيل المستخدم
function registerUser() {
    const username = document.getElementById('username').value;
    if (!username) return;
    
    currentUser = username;
    socket.emit('register', username);
    
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('chat-section').style.display = 'block';
    
    connectToServer();
}

// إرسال رسالة
function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value;
    const receiver = 'user2'; // يجب اختيار المستلم من قائمة
    
    if (message.trim()) {
        socket.emit('send_message', {
            receiver: receiver,
            message: message
        });
        
        displayMessage('أنت', message);
        messageInput.value = '';
    }
}

// عرض الرسائل
function displayMessage(sender, message) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    messagesDiv.appendChild(messageElement);
}

// بدء مكالمة فيديو باستخدام WebRTC
async function startVideoCall() {
    const constraints = { video: true, audio: true };
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    document.getElementById('local-video').srcObject = localStream;
    document.getElementById('chat-section').style.display = 'none';
    document.getElementById('call-section').style.display = 'block';
    
    startWebRTC(true);
}

// بدء اتصال WebRTC
function startWebRTC(isCaller, signal = null) {
    // هنا يجب إضافة كود WebRTC كامل
    // (باستخدام SimplePeer أو مكتبة مشابهة)
    console.log('بدء اتصال WebRTC');
}

// إنهاء المكالمة
function endCall() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    document.getElementById('call-section').style.display = 'none';
    document.getElementById('chat-section').style.display = 'block';
}

// عند تحميل الصفحة
window.onload = function() {
    connectToServer();
};