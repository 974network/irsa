// معالج اتصالات WebRTC للمكالمات الجماعية

class PeerHandler {
    constructor() {
        this.peers = new Map(); // تخزين جميع الاتصالات
        this.localStream = null;
        this.screenStream = null;
        this.socket = null;
        this.userId = null;
        this.meetingId = null;
        this.configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' }
            ]
        };
    }

    // تهيئة المعالج
    async initialize(socket, userId, meetingId) {
        this.socket = socket;
        this.userId = userId;
        this.meetingId = meetingId;
        
        try {
            await this.getLocalStream();
            this.setupSocketListeners();
            return true;
        } catch (error) {
            console.error('خطأ في التهيئة:', error);
            throw error;
        }
    }

    // الحصول على تدفق الوسائط المحلي
    async getLocalStream() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // تحديث حالة الأجهزة
            this.updateDeviceStatus();
            return this.localStream;
        } catch (error) {
            console.error('خطأ في الوصول إلى الوسائط:', error);
            throw error;
        }
    }

    // إعداد مستمعي Socket.io
    setupSocketListeners() {
        // عند استقبال إشارة من مستخدم آخر
        this.socket.on('signal', async (data) => {
            const { from, signal, type } = data;
            
            if (type === 'offer') {
                await this.handleOffer(from, signal);
            } else if (type === 'answer') {
                await this.handleAnswer(from, signal);
            } else if (type === 'candidate') {
                await this.handleCandidate(from, signal);
            }
        });

        // عند انضمام مستخدم جديد
        this.socket.on('user-joined', async (data) => {
            const { userId } = data;
            if (userId !== this.userId) {
                await this.createPeer(userId, true);
            }
        });

        // عند مغادرة مستخدم
        this.socket.on('user-left', (data) => {
            const { userId } = data;
            this.removePeer(userId);
        });

        // عند انقطاع اتصال مستخدم
        this.socket.on('user-disconnected', (data) => {
            const { userId } = data;
            this.removePeer(userId);
        });

        // للتحكم في المكالمة
        this.socket.on('call-control', (data) => {
            const { userId, action, value } = data;
            this.handleCallControl(userId, action, value);
        });
    }

    // إنشاء اتصال WebRTC جديد
    async createPeer(targetUserId, initiator = false) {
        // إذا كان الاتصال موجود بالفعل
        if (this.peers.has(targetUserId)) {
            console.log('الاتصال موجود بالفعل:', targetUserId);
            return this.peers.get(targetUserId);
        }

        try {
            // إنشاء اتصال WebRTC جديد
            const peer = new RTCPeerConnection(this.configuration);
            
            // إضافة تيار الوسائط المحلي
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    peer.addTrack(track, this.localStream);
                });
            }

            // إعداد معالج ICE Candidate
            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    this.socket.emit('signal', {
                        to: targetUserId,
                        signal: event.candidate,
                        type: 'candidate'
                    });
                }
            };

            // عند استقبال تيار وسائط عن بعد
            peer.ontrack = (event) => {
                const [remoteStream] = event.streams;
                this.onRemoteStream(remoteStream, targetUserId);
            };

            // تغيير حالة ICE
            peer.oniceconnectionstatechange = () => {
                console.log(`حالة ICE لـ ${targetUserId}:`, peer.iceConnectionState);
                
                if (peer.iceConnectionState === 'disconnected' ||
                    peer.iceConnectionState === 'failed' ||
                    peer.iceConnectionState === 'closed') {
                    this.removePeer(targetUserId);
                }
            };

            // حفظ الاتصال
            this.peers.set(targetUserId, peer);

            // إذا كنا المبادرين، نرسل عرض
            if (initiator) {
                await this.createOffer(targetUserId);
            }

            return peer;
        } catch (error) {
            console.error('خطأ في إنشاء الاتصال:', error);
            throw error;
        }
    }

    // إنشاء عرض للاتصال
    async createOffer(targetUserId) {
        try {
            const peer = this.peers.get(targetUserId);
            if (!peer) return;

            const offer = await peer.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            
            await peer.setLocalDescription(offer);
            
            // إرسال العرض عبر Socket
            this.socket.emit('signal', {
                to: targetUserId,
                signal: offer,
                type: 'offer'
            });
            
            console.log('تم إرسال العرض إلى:', targetUserId);
        } catch (error) {
            console.error('خطأ في إنشاء العرض:', error);
        }
    }

    // معالجة العرض الوارد
    async handleOffer(from, offer) {
        try {
            const peer = await this.createPeer(from, false);
            
            await peer.setRemoteDescription(new RTCSessionDescription(offer));
            
            // إنشاء إجابة
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            
            // إرسال الإجابة
            this.socket.emit('signal', {
                to: from,
                signal: answer,
                type: 'answer'
            });
            
            console.log('تم إرسال الإجابة إلى:', from);
        } catch (error) {
            console.error('خطأ في معالجة العرض:', error);
        }
    }

    // معالجة الإجابة الواردة
    async handleAnswer(from, answer) {
        try {
            const peer = this.peers.get(from);
            if (!peer) return;

            await peer.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('تم استقبال الإجابة من:', from);
        } catch (error) {
            console.error('خطأ في معالجة الإجابة:', error);
        }
    }

    // معالجة ICE Candidate الوارد
    async handleCandidate(from, candidate) {
        try {
            const peer = this.peers.get(from);
            if (!peer) return;

            await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('خطأ في معالجة ICE Candidate:', error);
        }
    }

    // إزالة اتصال
    removePeer(userId) {
        if (this.peers.has(userId)) {
            const peer = this.peers.get(userId);
            
            // إغلاق الاتصال
            peer.getSenders().forEach(sender => {
                if (sender.track) sender.track.stop();
            });
            
            peer.getReceivers().forEach(receiver => {
                if (receiver.track) receiver.track.stop();
            });
            
            peer.close();
            this.peers.delete(userId);
            
            // إزالة الفيديو من الواجهة
            this.onPeerRemoved(userId);
            
            console.log('تم إزالة الاتصال:', userId);
        }
    }

    // تبديل الميكروفون
    toggleMic() {
        if (!this.localStream) return;
        
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            
            // إرسال حالة الميكروفون للمشاركين
            this.socket.emit('call-control', {
                meetingId: this.meetingId,
                action: 'mic',
                value: audioTrack.enabled
            });
            
            return audioTrack.enabled;
        }
        return false;
    }

    // تبديل الكاميرا
    toggleCamera() {
        if (!this.localStream) return;
        
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            
            // إرسال حالة الكاميرا للمشاركين
            this.socket.emit('call-control', {
                meetingId: this.meetingId,
                action: 'camera',
                value: videoTrack.enabled
            });
            
            return videoTrack.enabled;
        }
        return false;
    }

    // مشاركة الشاشة
    async toggleScreenShare() {
        try {
            if (this.screenStream) {
                // إيقاف مشاركة الشاشة
                this.screenStream.getTracks().forEach(track => track.stop());
                this.screenStream = null;
                
                // العودة إلى الكاميرا
                await this.switchToCamera();
                return false;
            } else {
                // بدء مشاركة الشاشة
                this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        cursor: "always",
                        frameRate: { ideal: 30 }
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true
                    }
                });
                
                // تبديل إلى شاشة المشاركة
                await this.switchToScreen();
                
                // معالجة إيقاف مشاركة الشاشة
                this.screenStream.getVideoTracks()[0].onended = () => {
                    this.toggleScreenShare();
                };
                
                return true;
            }
        } catch (error) {
            console.error('خطأ في مشاركة الشاشة:', error);
            return false;
        }
    }

    // التبديل إلى مشاركة الشاشة
    async switchToScreen() {
        if (!this.screenStream || !this.localStream) return;
        
        // إيقاف كاميرا الفيديو
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) videoTrack.stop();
        
        // إضافة شاشة المشاركة
        const screenTrack = this.screenStream.getVideoTracks()[0];
        if (screenTrack) {
            this.localStream.addTrack(screenTrack);
            
            // تحديث جميع الاتصالات
            this.updateAllConnections();
        }
    }

    // التبديل إلى الكاميرا
    async switchToCamera() {
        if (!this.localStream) return;
        
        // إيقاف شاشة المشاركة
        const screenTrack = this.localStream.getVideoTracks().find(track => 
            track.kind === 'video' && track.label.includes('screen')
        );
        if (screenTrack) {
            screenTrack.stop();
            this.localStream.removeTrack(screenTrack);
        }
        
        // إضافة كاميرا جديدة
        try {
            const cameraStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            const cameraTrack = cameraStream.getVideoTracks()[0];
            if (cameraTrack) {
                this.localStream.addTrack(cameraTrack);
                
                // تحديث جميع الاتصالات
                this.updateAllConnections();
            }
        } catch (error) {
            console.error('خطأ في العودة إلى الكاميرا:', error);
        }
    }

    // تحديث جميع الاتصالات
    updateAllConnections() {
        this.peers.forEach((peer, userId) => {
            const sender = peer.getSenders().find(s => 
                s.track && s.track.kind === 'video'
            );
            
            if (sender && this.localStream) {
                const videoTrack = this.localStream.getVideoTracks()[0];
                if (videoTrack) {
                    sender.replaceTrack(videoTrack);
                }
            }
        });
    }

    // معالجة تحكم المكالمة
    handleCallControl(userId, action, value) {
        switch (action) {
            case 'mic':
                console.log(`المستخدم ${userId} ${value ? 'فعل' : 'كتم'} الميكروفون`);
                break;
            case 'camera':
                console.log(`المستخدم ${userId} ${value ? 'فعل' : 'أوقف'} الكاميرا`);
                break;
        }
    }

    // تحديث حالة الأجهزة
    updateDeviceStatus() {
        if (!this.localStream) return;
        
        const micStatus = document.getElementById('micStatus');
        const cameraStatus = document.getElementById('cameraStatus');
        
        if (micStatus) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            micStatus.textContent = audioTrack ? '✅ متصل' : '❌ غير متصل';
        }
        
        if (cameraStatus) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            cameraStatus.textContent = videoTrack ? '✅ متصل' : '❌ غير متصل';
        }
    }

    // الحصول على حالة الأجهزة
    getDeviceStatus() {
        if (!this.localStream) return { mic: false, camera: false };
        
        const audioTrack = this.localStream.getAudioTracks()[0];
        const videoTrack = this.localStream.getVideoTracks()[0];
        
        return {
            mic: audioTrack ? audioTrack.enabled : false,
            camera: videoTrack ? videoTrack.enabled : false
        };
    }

    // إغلاق جميع الاتصالات
    closeAllConnections() {
        this.peers.forEach((peer, userId) => {
            this.removePeer(userId);
        });
        
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
            this.screenStream = null;
        }
    }

    // الحصول على قائمة بالمستخدمين المتصلين
    getConnectedUsers() {
        return Array.from(this.peers.keys());
    }

    // إعادة ضبط الاتصال
    async reconnect() {
        try {
            // إغلاق جميع الاتصالات الحالية
            this.closeAllConnections();
            
            // إعادة الحصول على الوسائط المحلية
            await this.getLocalStream();
            
            // إعادة إنشاء الاتصالات مع جميع المستخدمين
            const connectedUsers = this.getConnectedUsers();
            for (const userId of connectedUsers) {
                await this.createPeer(userId, true);
            }
            
            console.log('تمت إعادة الاتصال بنجاح');
            return true;
        } catch (error) {
            console.error('خطأ في إعادة الاتصال:', error);
            return false;
        }
    }

    // كائنات الاستدعاء (Callback) التي يجب تعريفها في meeting.js
    onRemoteStream(stream, userId) {
        console.log('استقبال تيار وسائط من:', userId, stream);
        // سيتم تعريف هذه الدالة في meeting.js
    }

    onPeerRemoved(userId) {
        console.log('تم إزالة الاتصال مع:', userId);
        // سيتم تعريف هذه الدالة في meeting.js
    }

    onConnectionStateChange(userId, state) {
        console.log('تغيير حالة الاتصال لـ', userId, ':', state);
        // سيتم تعريف هذه الدالة في meeting.js
    }
}

// إنشاء نسخة عامة
const peerHandler = new PeerHandler();