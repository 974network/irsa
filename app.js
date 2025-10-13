// قاعدة بيانات كاملة للتطبيق مع Firebase
const getPropertyDB = () => {
    const savedDB = localStorage.getItem('propertyDB');
    if (savedDB) {
        return JSON.parse(savedDB);
    }
    
    // البيانات الافتراضية
    const defaultDB = {
        currentUser: null,
        users: {
            'mohanad': '123456789119',
            'admin': 'admin123'
        },
        userProfiles: {
            'mohanad': {
                id: 1,
                name: 'مهند أحمد',
                email: 'mohanad@irsa.com',
                phone: '0512345678',
                role: 'مدير النظام',
                joinDate: '2024-01-01'
            },
            'admin': {
                id: 2,
                name: 'مدير النظام',
                email: 'admin@irsa.com',
                phone: '0500000000',
                role: 'مدير عام',
                joinDate: '2024-01-01'
            }
        },
        userDatabases: {}
    };
    
    localStorage.setItem('propertyDB', JSON.stringify(defaultDB));
    return defaultDB;
};

// دالة لحفظ البيانات الرئيسية
const saveMainDB = (db) => {
    localStorage.setItem('propertyDB', JSON.stringify(db));
};

// 🔥 مدير Firebase مع التخزين السحابي المتقدم
class FirebaseManager {
    constructor() {
        this.auth = null;
        this.db = null;
        this.storage = null;
        this.currentUser = null;
        this.init();
    }

    init() {
        try {
            // تهيئة Firebase مع جميع الخدمات
            const firebaseConfig = {
                apiKey: "AIzaSyBUMgt1C6gdDrtgpBcMkyHBZFDeHiDd1HI",
                authDomain: "mohanad-93df3.firebaseapp.com",
                projectId: "mohanad-93df3",
                storageBucket: "mohanad-93df3.appspot.com",
                messagingSenderId: "1057899918391",
                appId: "1:1057899918391:web:a1b2c3d4e5f6g7h8i9j0"
            };

            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            this.storage = firebase.storage();
            
            // مراقبة حالة المصادقة
            this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                if (user) {
                    console.log('✅ User signed in:', user.email);
                    this.updateUserOnlineStatus(true);
                } else {
                    console.log('🔒 User signed out');
                }
            });
            
            console.log('✅ Firebase Manager initialized with Storage');
        } catch (error) {
            console.error('❌ Firebase Manager init error:', error);
        }
    }

    // تحديث حالة المستخدم
    async updateUserOnlineStatus(online) {
        if (!this.currentUser) return;
        
        try {
            await this.db.collection('users').doc(this.currentUser.uid).update({
                isOnline: online,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating online status:', error);
        }
    }

    // 🔥 تسجيل الدخول
    async login(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;
            
            return { 
                success: true, 
                user: this.currentUser,
                message: 'تم تسجيل الدخول بنجاح'
            };
        } catch (error) {
            let errorMessage = 'فشل في تسجيل الدخول';
            switch (error.code) {
                case 'auth/user-not-found': errorMessage = 'المستخدم غير موجود'; break;
                case 'auth/wrong-password': errorMessage = 'كلمة المرور غير صحيحة'; break;
                case 'auth/invalid-email': errorMessage = 'البريد الإلكتروني غير صالح'; break;
                default: errorMessage = error.message;
            }
            return { success: false, error: errorMessage };
        }
    }

    // 🔥 إنشاء حساب
    async createAccount(email, password, userData = {}) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;
            
            // إنشاء مساحة تخزين للمستخدم الجديد
            const userProfile = {
                username: userData.username || email.split('@')[0],
                fullName: userData.fullName || email.split('@')[0],
                email: email,
                phone: userData.phone || '',
                role: userData.role || 'مدير النظام',
                joinDate: new Date().toISOString().split('T')[0],
                storageUsed: 0,
                maxStorage: 100 * 1024 * 1024, // 100MB لكل مستخدم
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await this.db.collection('users').doc(this.currentUser.uid).set(userProfile);
            
            // إنشاء المجلدات الأساسية للمستخدم
            await this.createUserFolders();
            
            return { 
                success: true, 
                user: this.currentUser,
                profile: userProfile
            };
        } catch (error) {
            let errorMessage = 'فشل في إنشاء الحساب';
            switch (error.code) {
                case 'auth/email-already-in-use': errorMessage = 'البريد الإلكتروني مستخدم مسبقاً'; break;
                case 'auth/weak-password': errorMessage = 'كلمة المرور ضعيفة'; break;
                default: errorMessage = error.message;
            }
            return { success: false, error: errorMessage };
        }
    }

    // 🔥 إنشاء مجلدات المستخدم
    async createUserFolders() {
        if (!this.currentUser) return;
        
        try {
            const folders = ['properties', 'customers', 'contracts', 'payments', 'maintenance', 'reports', 'backups'];
            
            for (const folder of folders) {
                // إنشاء مستند في Firestore للإشارة إلى المجلد
                await this.db.collection('userFolders').doc(this.currentUser.uid).collection('folders').doc(folder).set({
                    name: folder,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    fileCount: 0
                });
            }
            console.log('✅ تم إنشاء مجلدات المستخدم');
        } catch (error) {
            console.error('❌ خطأ في إنشاء المجلدات:', error);
        }
    }

    // 🔥 حفظ البيانات الكاملة للمستخدم
    async saveCompleteUserData(userData) {
        try {
            if (!this.currentUser) {
                return { success: false, error: 'لم يتم تسجيل الدخول' };
            }

            const timestamp = new Date().toISOString();
            const dataToSave = {
                ...userData,
                userId: this.currentUser.uid,
                lastBackup: timestamp,
                dataSize: JSON.stringify(userData).length,
                version: '2.0'
            };

            // حفظ في Firestore
            await this.db.collection('userBackups').doc(this.currentUser.uid).set({
                backups: firebase.firestore.FieldValue.arrayUnion(dataToSave)
            }, { merge: true });

            // حفظ في Storage كملف JSON (للنسخ الاحتياطي)
            const backupBlob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
            await this.storage.ref(`users/${this.currentUser.uid}/backups/complete_backup_${timestamp}.json`).put(backupBlob);

            // تحديث حجم التخزين المستخدم
            await this.updateStorageUsage(JSON.stringify(userData).length);

            console.log('✅ تم حفظ البيانات الكاملة في السحابة');
            return { success: true, size: dataToSave.dataSize };
        } catch (error) {
            console.error('❌ خطأ في حفظ البيانات الكاملة:', error);
            return { success: false, error: error.message };
        }
    }

    // 🔥 جلب البيانات الكاملة للمستخدم
    async getCompleteUserData() {
        try {
            if (!this.currentUser) {
                return { success: false, error: 'لم يتم تسجيل الدخول' };
            }

            // محاولة جلب من Firestore أولاً
            const doc = await this.db.collection('userBackups').doc(this.currentUser.uid).get();
            
            if (doc.exists && doc.data().backups && doc.data().backups.length > 0) {
                const backups = doc.data().backups;
                const latestBackup = backups[backups.length - 1]; // أحدث نسخة
                console.log('✅ تم جلب البيانات من Firestore');
                return { success: true, data: latestBackup };
            }

            // إذا لم توجد في Firestore، جرب من Storage
            try {
                const storageRef = this.storage.ref(`users/${this.currentUser.uid}/backups`);
                const files = await storageRef.listAll();
                
                if (files.items.length > 0) {
                    const latestFile = files.items[files.items.length - 1];
                    const url = await latestFile.getDownloadURL();
                    const response = await fetch(url);
                    const data = await response.json();
                    
                    console.log('✅ تم جلب البيانات من Storage');
                    return { success: true, data: data };
                }
            } catch (storageError) {
                console.warn('⚠️ لا توجد بيانات في Storage');
            }

            return { success: false, error: 'لا توجد بيانات محفوظة' };
        } catch (error) {
            console.error('❌ خطأ في جلب البيانات الكاملة:', error);
            return { success: false, error: error.message };
        }
    }

    // 🔥 حفظ البيانات بشكل منفصل (أكثر كفاءة)
    async saveUserDataSeparated(data) {
        try {
            if (!this.currentUser) {
                return { success: false, error: 'لم يتم تسجيل الدخول' };
            }

            const batch = this.db.batch();
            const timestamp = new Date().toISOString();

            // حفظ كل نوع بيانات في collection منفصل
            const collections = {
                properties: data.properties || [],
                customers: data.customers || [],
                contracts: data.contracts || [],
                payments: data.payments || [],
                maintenance: data.maintenance || [],
                settings: data.settings || {},
                userProfiles: data.userProfiles || {}
            };

            for (const [collectionName, collectionData] of Object.entries(collections)) {
                const docRef = this.db.collection(`user${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)}`)
                    .doc(this.currentUser.uid);
                batch.set(docRef, {
                    data: collectionData,
                    lastUpdated: timestamp,
                    recordCount: Array.isArray(collectionData) ? collectionData.length : 1
                });
            }

            await batch.commit();

            // تحديث حجم التخزين
            const totalSize = JSON.stringify(data).length;
            await this.updateStorageUsage(totalSize);

            console.log('✅ تم حفظ البيانات المنفصلة في السحابة');
            return { success: true, size: totalSize };
        } catch (error) {
            console.error('❌ خطأ في حفظ البيانات المنفصلة:', error);
            return { success: false, error: error.message };
        }
    }

    // 🔥 جلب البيانات المنفصلة
    async getUserDataSeparated() {
        try {
            if (!this.currentUser) {
                return { success: false, error: 'لم يتم تسجيل الدخول' };
            }

            const collections = ['Properties', 'Customers', 'Contracts', 'Payments', 'Maintenance', 'Settings', 'UserProfiles'];
            const result = {};

            for (const collection of collections) {
                try {
                    const doc = await this.db.collection(`user${collection}`).doc(this.currentUser.uid).get();
                    if (doc.exists && doc.data().data) {
                        const key = collection.toLowerCase();
                        result[key] = doc.data().data;
                    }
                } catch (error) {
                    console.warn(`⚠️ خطأ في جلب ${collection}:`, error);
                }
            }

            console.log('✅ تم جلب البيانات المنفصلة من السحابة');
            return { success: true, data: result };
        } catch (error) {
            console.error('❌ خطأ في جلب البيانات المنفصلة:', error);
            return { success: false, error: error.message };
        }
    }

    // 🔥 تحديث استخدام التخزين
    async updateStorageUsage(additionalBytes = 0) {
        try {
            if (!this.currentUser) return;

            const userDoc = await this.db.collection('users').doc(this.currentUser.uid).get();
            if (userDoc.exists) {
                const currentUsage = userDoc.data().storageUsed || 0;
                const newUsage = currentUsage + additionalBytes;
                
                await this.db.collection('users').doc(this.currentUser.uid).update({
                    storageUsed: newUsage,
                    lastStorageUpdate: firebase.firestore.FieldValue.serverTimestamp()
                });

                console.log(`💾 استخدام التخزين: ${this.formatBytes(newUsage)}`);
            }
        } catch (error) {
            console.error('❌ خطأ في تحديث استخدام التخزين:', error);
        }
    }

    // 🔥 جلب معلومات التخزين
    async getStorageInfo() {
        try {
            if (!this.currentUser) {
                return { success: false, error: 'لم يتم تسجيل الدخول' };
            }

            const userDoc = await this.db.collection('users').doc(this.currentUser.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                return {
                    success: true,
                    storageUsed: userData.storageUsed || 0,
                    maxStorage: userData.maxStorage || 100 * 1024 * 1024,
                    usagePercentage: ((userData.storageUsed || 0) / (userData.maxStorage || 100 * 1024 * 1024)) * 100
                };
            }
            return { success: false, error: 'لا توجد معلومات تخزين' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 🔥 رفع ملف إلى التخزين
    async uploadFile(file, folder = 'documents') {
        try {
            if (!this.currentUser) {
                return { success: false, error: 'لم يتم تسجيل الدخول' };
            }

            const filePath = `users/${this.currentUser.uid}/${folder}/${Date.now()}_${file.name}`;
            const fileRef = this.storage.ref(filePath);
            const snapshot = await fileRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();

            // تحديث استخدام التخزين
            await this.updateStorageUsage(file.size);

            // حفظ معلومات الملف في Firestore
            await this.db.collection('userFiles').doc(this.currentUser.uid).collection('files').add({
                name: file.name,
                path: filePath,
                url: downloadURL,
                size: file.size,
                type: file.type,
                uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { 
                success: true, 
                url: downloadURL,
                path: filePath,
                size: file.size
            };
        } catch (error) {
            console.error('❌ خطأ في رفع الملف:', error);
            return { success: false, error: error.message };
        }
    }

    // 🔥 جلب قائمة الملفات
    async getUserFiles(folder = 'documents') {
        try {
            if (!this.currentUser) {
                return { success: false, error: 'لم يتم تسجيل الدخول' };
            }

            const filesSnapshot = await this.db.collection('userFiles')
                .doc(this.currentUser.uid)
                .collection('files')
                .orderBy('uploadedAt', 'desc')
                .get();

            const files = [];
            filesSnapshot.forEach(doc => {
                files.push({ id: doc.id, ...doc.data() });
            });

            return { success: true, files: files };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 🔥 تنسيق حجم الملف
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // 🔥 تسجيل الخروج
    async logout() {
        try {
            await this.updateUserOnlineStatus(false);
            await this.auth.signOut();
            this.currentUser = null;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// 🔥 النظام الرئيسي مع التخزين السحابي
class AdvancedPropertySystem {
    constructor() {
        this.currentPage = 'dashboard';
        this.currentLanguage = localStorage.getItem('propertyLanguage') || 'ar';
        this.mainDB = getPropertyDB();
        this.propertyDB = this.loadUserDB();
        this.firebaseManager = new FirebaseManager();
        this.syncInterval = null;
        this.init();
    }

    // 🔥 تحميل قاعدة بيانات المستخدم مع السحابة
    async loadUserDB() {
        const currentUser = localStorage.getItem('propertyUser');
        if (currentUser) {
            // أولاً: جلب من localStorage
            const userDB = localStorage.getItem(`propertyDB_${currentUser}`);
            let localData = userDB ? JSON.parse(userDB) : this.getDefaultUserDB();
            
            // ثانياً: محاولة المزامنة مع السحابة
            if (this.firebaseManager.currentUser) {
                try {
                    console.log('🔄 مزامنة البيانات مع السحابة...');
                    
                    // جلب البيانات من السحابة
                    const cloudData = await this.firebaseManager.getUserDataSeparated();
                    
                    if (cloudData.success) {
                        console.log('✅ تم جلب البيانات من السحابة');
                        
                        // دمج البيانات (السحابة أولاً)
                        localData = {
                            ...localData,
                            ...cloudData.data,
                            currentUser: currentUser
                        };
                        
                        // حفظ النسخة المدمجة محلياً
                        localStorage.setItem(`propertyDB_${currentUser}`, JSON.stringify(localData));
                    } else {
                        // إذا لم توجد بيانات في السحابة، حفظ البيانات المحلية في السحابة
                        console.log('☁️ رفع البيانات المحلية إلى السحابة...');
                        await this.firebaseManager.saveUserDataSeparated(localData);
                    }
                    
                } catch (error) {
                    console.warn('⚠️ فشل في مزامنة البيانات مع السحابة:', error);
                }
            }
            
            return localData;
        }
        return this.getDefaultUserDB();
    }

    // 🔥 قاعدة بيانات افتراضية
    getDefaultUserDB() {
        return {
            currentUser: null,
            users: {},
            userProfiles: {},
            properties: [],
            customers: [],
            contracts: [],
            payments: [],
            maintenance: [],
            settings: {
                companyName: 'نظام إدارة العقارات',
                currency: 'ريال',
                taxRate: 15,
                autoSync: true,
                backupInterval: 30 // دقائق
            }
        };
    }

    // 🔥 حفظ البيانات مع السحابة
    async saveCurrentUserDB() {
        if (!this.propertyDB || !this.propertyDB.currentUser) {
            console.warn('⚠️ لا يمكن حفظ البيانات: لا يوجد مستخدم نشط');
            return false;
        }

        try {
            const timestamp = new Date().toISOString();
            
            // 1. حفظ في localStorage
            const dataToSave = {
                ...this.propertyDB,
                _metadata: {
                    lastSaved: timestamp,
                    user: this.propertyDB.currentUser,
                    localSave: true
                }
            };
            
            localStorage.setItem(`propertyDB_${this.propertyDB.currentUser}`, JSON.stringify(dataToSave));

            // 2. حفظ في السحابة (إذا كان متصلاً)
            if (this.firebaseManager.currentUser) {
                try {
                    // حفظ البيانات المنفصلة (أكثر كفاءة)
                    const saveResult = await this.firebaseManager.saveUserDataSeparated(this.propertyDB);
                    
                    if (saveResult.success) {
                        console.log(`✅ تم حفظ ${this.firebaseManager.formatBytes(saveResult.size)} في السحابة`);
                        
                        // عرض معلومات التخزين
                        const storageInfo = await this.firebaseManager.getStorageInfo();
                        if (storageInfo.success) {
                            console.log(`💾 التخزين: ${this.firebaseManager.formatBytes(storageInfo.storageUsed)} / ${this.firebaseManager.formatBytes(storageInfo.maxStorage)} (${storageInfo.usagePercentage.toFixed(1)}%)`);
                        }
                    }
                    
                    // حفظ نسخة كاملة احتياطية كل 10 عمليات حفظ
                    const saveCount = localStorage.getItem('saveCount') || 0;
                    if (saveCount % 10 === 0) {
                        await this.firebaseManager.saveCompleteUserData(this.propertyDB);
                    }
                    localStorage.setItem('saveCount', parseInt(saveCount) + 1);
                    
                } catch (cloudError) {
                    console.warn('⚠️ فشل في الحفظ السحابي، تم الحفظ محلياً فقط:', cloudError);
                }
            }

            return true;
        } catch (error) {
            console.error('❌ فشل في حفظ البيانات:', error);
            this.showNotification('فشل في حفظ البيانات', 'error');
            return false;
        }
    }

    // 🔥 تحديث واجهة معلومات التخزين
    async updateStorageUI() {
        if (!this.firebaseManager.currentUser) return;
        
        try {
            const storageInfo = await this.firebaseManager.getStorageInfo();
            if (storageInfo.success) {
                const storageElement = document.getElementById('storageInfo');
                if (storageElement) {
                    storageElement.innerHTML = `
                        <div class="storage-info">
                            <i class="fas fa-cloud"></i>
                            <div class="storage-progress">
                                <div class="storage-bar">
                                    <div class="storage-used" style="width: ${Math.min(storageInfo.usagePercentage, 100)}%"></div>
                                </div>
                                <span>${this.firebaseManager.formatBytes(storageInfo.storageUsed)} / ${this.firebaseManager.formatBytes(storageInfo.maxStorage)}</span>
                            </div>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.warn('⚠️ فشل في تحديث واجهة التخزين:', error);
        }
    }

    // 🔥 المزامنة التلقائية
    setupAutoSync() {
        // إيقاف أي مزامنة سابقة
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        // مزامنة كل 30 ثانية
        this.syncInterval = setInterval(async () => {
            if (this.propertyDB.currentUser && this.firebaseManager.currentUser) {
                await this.saveCurrentUserDB();
                await this.updateStorageUI();
            }
        }, 30000);

        // مزامنة عند إغلاق الصفحة
        window.addEventListener('beforeunload', async () => {
            if (this.propertyDB.currentUser) {
                await this.saveCurrentUserDB();
            }
        });

        console.log('🔄 تم تفعيل المزامنة التلقائية');
    }

    // 🔥 النسخ الاحتياطي اليدوي
    async createManualBackup() {
        try {
            if (!this.propertyDB.currentUser) {
                this.showNotification('يجب تسجيل الدخول أولاً', 'error');
                return;
            }

            this.showNotification('جاري إنشاء نسخة احتياطية...', 'info');
            
            const result = await this.firebaseManager.saveCompleteUserData(this.propertyDB);
            
            if (result.success) {
                this.showNotification(`تم إنشاء نسخة احتياطية (${this.firebaseManager.formatBytes(result.size)}) ✅`);
            } else {
                this.showNotification('فشل في إنشاء النسخة الاحتياطية', 'error');
            }
        } catch (error) {
            this.showNotification('خطأ في النسخ الاحتياطي', 'error');
        }
    }

    // 🔥 استعادة من النسخة الاحتياطية
    async restoreFromBackup() {
        try {
            if (!this.propertyDB.currentUser) {
                this.showNotification('يجب تسجيل الدخول أولاً', 'error');
                return;
            }

            this.showNotification('جاري استعادة البيانات...', 'info');
            
            const result = await this.firebaseManager.getCompleteUserData();
            
            if (result.success) {
                this.propertyDB = { ...result.data, currentUser: this.propertyDB.currentUser };
                await this.saveCurrentUserDB();
                this.showNotification('تم استعادة البيانات بنجاح ✅');
                this.reloadCurrentPage();
            } else {
                this.showNotification('فشل في استعادة البيانات', 'error');
            }
        } catch (error) {
            this.showNotification('خطأ في استعادة البيانات', 'error');
        }
    }

    // 🔥 دالة تسجيل الدخول مع السحابة
    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            this.showNotification('يرجى ملء جميع الحقول', 'error');
            return;
        }

        const email = this.formatUsernameToEmail(username);
        const result = await this.firebaseManager.login(email, password);
        
        if (result.success) {
            // تحميل البيانات مع المزامنة
            this.propertyDB = await this.loadUserDB();
            this.propertyDB.currentUser = username;
            
            localStorage.setItem('propertyUser', username);
            localStorage.setItem('loginTime', new Date().toISOString());
            
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            
            this.showNotification(`مرحباً بك! مساحة التخزين: 100MB ☁️`);
            
            this.applyPermissions();
            this.setupUserMenu();
            this.setupAutoSync();
            this.loadDashboard();
            
            // تحديث واجهة التخزين
            setTimeout(() => this.updateStorageUI(), 2000);
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    // 🔥 دوال مساعدة
    formatUsernameToEmail(username) {
        return username.includes('@') ? username : `${username}@irsa.com`;
    }

    // 🔥 دوال الواجهة الأخرى (مختصرة)
    init() {
        try {
            this.initializeDatabase();
            this.setupLogin();
            this.setupNavigation();
            this.checkAuthStatus();
            this.applyLanguage(this.currentLanguage);
            this.setupUserMenu();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showEmergencyLogin();
        }
    }

    showEmergencyLogin() {
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('dashboard').style.display = 'none';
        this.showNotification('تم إعادة تهيئة النظام، يرجى تسجيل الدخول مرة أخرى', 'info');
    }

    initializeDatabase() {
        if (!this.propertyDB) {
            this.propertyDB = this.getDefaultUserDB();
        }
        
        // التأكد من وجود جميع الحقول
        const requiredFields = ['properties', 'customers', 'contracts', 'payments', 'maintenance', 'settings'];
        requiredFields.forEach(field => {
            if (!this.propertyDB[field]) {
                this.propertyDB[field] = this.getDefaultUserDB()[field];
            }
        });
    }

    setupLogin() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.getAttribute('data-lang');
                this.applyLanguage(lang);
            });
        });
    }

    // ... باقي الدوال (setupNavigation, setupUserMenu, etc.) تبقى كما هي

    // 🔥 تحديث واجهة الإعدادات لإظهار معلومات التخزين
    loadSettings() {
        const content = document.querySelector('.main-content');
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-cogs"></i> <span data-translate="settings">${this.getTranslation('settings')}</span></h2>
            </div>

            <div class="settings-grid">
                <!-- معلومات التخزين -->
                <div class="settings-card storage-card">
                    <div class="settings-card-header">
                        <div class="settings-icon">
                            <i class="fas fa-cloud"></i>
                        </div>
                        <h3>${this.currentLanguage === 'ar' ? 'التخزين السحابي' : 'Cloud Storage'}</h3>
                    </div>
                    <div class="settings-card-body">
                        <div id="storageInfo" class="storage-info-container">
                            <!-- سيتم ملؤها ديناميكياً -->
                        </div>
                        <div class="storage-actions">
                            <button class="btn btn-primary" onclick="propertySystem.createManualBackup()">
                                <i class="fas fa-save"></i>
                                ${this.currentLanguage === 'ar' ? 'نسخ احتياطي' : 'Backup'}
                            </button>
                            <button class="btn btn-secondary" onclick="propertySystem.restoreFromBackup()">
                                <i class="fas fa-download"></i>
                                ${this.currentLanguage === 'ar' ? 'استعادة' : 'Restore'}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- إعدادات الشركة -->
                <div class="settings-card">
                    <h3>${this.currentLanguage === 'ar' ? 'إعدادات الشركة' : 'Company Settings'}</h3>
                    <form onsubmit="propertySystem.saveCompanySettings(event)">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'اسم الشركة' : 'Company Name'}:</label>
                            <input type="text" name="companyName" value="${this.propertyDB.settings.companyName}" required>
                        </div>
                        <button type="submit" class="btn btn-primary">${this.currentLanguage === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}</button>
                    </form>
                </div>
            </div>
        `;

        // تحديث واجهة التخزين
        setTimeout(() => this.updateStorageUI(), 100);
    }

    // ... باقي الدوال تبقى كما هي

    showNotification(message, type = 'success') {
        // دالة الإشعارات (نفس السابقة)
        document.querySelectorAll('.notification').forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// تهيئة النظام
document.addEventListener('DOMContentLoaded', () => {
    window.propertySystem = new AdvancedPropertySystem();
});
