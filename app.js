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
        userDatabases: {} // تخزين قواعد بيانات المستخدمين
    };
    
    // حفظ البيانات الافتراضية في localStorage
    localStorage.setItem('propertyDB', JSON.stringify(defaultDB));
    return defaultDB;
};

// دالة لحفظ البيانات الرئيسية
const saveMainDB = (db) => {
    localStorage.setItem('propertyDB', JSON.stringify(db));
};

// مدير Firebase
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
            // تهيئة Firebase
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
                    // تحميل بيانات المستخدم من Firestore عند تسجيل الدخول
                    this.loadUserDataFromFirestore(user.uid);
                } else {
                    console.log('🔒 User signed out');
                }
            });
            
            console.log('✅ Firebase Manager initialized');
        } catch (error) {
            console.error('❌ Firebase Manager init error:', error);
        }
    }

    // 🔥 NEW: تحميل بيانات المستخدم من Firestore
    async loadUserDataFromFirestore(userId) {
        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                console.log('✅ User data loaded from Firestore:', userData);
                
                // إرسال البيانات إلى النظام الرئيسي
                if (window.propertySystem) {
                    window.propertySystem.onUserDataLoaded(userData);
                }
                
                return { success: true, data: userData };
            }
            return { success: false, error: 'User data not found' };
        } catch (error) {
            console.error('❌ Error loading user data:', error);
            return { success: false, error: error.message };
        }
    }

    // 🔥 NEW: حفظ بيانات المستخدم في Firestore
    async saveUserDataToFirestore(userId, userData) {
        try {
            await this.db.collection('users').doc(userId).set({
                ...userData,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            console.log('✅ User data saved to Firestore');
            return { success: true };
        } catch (error) {
            console.error('❌ Error saving user data:', error);
            return { success: false, error: error.message };
        }
    }

    // 🔥 NEW: حفظ العقارات في Firestore
    async savePropertiesToFirestore(userId, properties) {
        try {
            await this.db.collection('users').doc(userId).collection('properties').doc('data').set({
                properties: properties,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 🔥 NEW: تحميل العقارات من Firestore
    async loadPropertiesFromFirestore(userId) {
        try {
            const doc = await this.db.collection('users').doc(userId).collection('properties').doc('data').get();
            if (doc.exists) {
                return { success: true, data: doc.data().properties };
            }
            return { success: false, error: 'No properties found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 🔥 NEW: حفظ العملاء في Firestore
    async saveCustomersToFirestore(userId, customers) {
        try {
            await this.db.collection('users').doc(userId).collection('customers').doc('data').set({
                customers: customers,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 🔥 NEW: تحميل العملاء من Firestore
    async loadCustomersFromFirestore(userId) {
        try {
            const doc = await this.db.collection('users').doc(userId).collection('customers').doc('data').get();
            if (doc.exists) {
                return { success: true, data: doc.data().customers };
            }
            return { success: false, error: 'No customers found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 🔥 NEW: حفظ العقود في Firestore
    async saveContractsToFirestore(userId, contracts) {
        try {
            await this.db.collection('users').doc(userId).collection('contracts').doc('data').set({
                contracts: contracts,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 🔥 NEW: تحميل العقود من Firestore
    async loadContractsFromFirestore(userId) {
        try {
            const doc = await this.db.collection('users').doc(userId).collection('contracts').doc('data').get();
            if (doc.exists) {
                return { success: true, data: doc.data().contracts };
            }
            return { success: false, error: 'No contracts found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 🔥 NEW: حفظ المدفوعات في Firestore
    async savePaymentsToFirestore(userId, payments) {
        try {
            await this.db.collection('users').doc(userId).collection('payments').doc('data').set({
                payments: payments,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 🔥 NEW: تحميل المدفوعات من Firestore
    async loadPaymentsFromFirestore(userId) {
        try {
            const doc = await this.db.collection('users').doc(userId).collection('payments').doc('data').get();
            if (doc.exists) {
                return { success: true, data: doc.data().payments };
            }
            return { success: false, error: 'No payments found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 🔥 NEW: حفظ الصيانة في Firestore
    async saveMaintenanceToFirestore(userId, maintenance) {
        try {
            await this.db.collection('users').doc(userId).collection('maintenance').doc('data').set({
                maintenance: maintenance,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 🔥 NEW: تحميل الصيانة من Firestore
    async loadMaintenanceFromFirestore(userId) {
        try {
            const doc = await this.db.collection('users').doc(userId).collection('maintenance').doc('data').get();
            if (doc.exists) {
                return { success: true, data: doc.data().maintenance };
            }
            return { success: false, error: 'No maintenance found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 🔥 NEW: حفظ الإعدادات في Firestore
    async saveSettingsToFirestore(userId, settings) {
        try {
            await this.db.collection('users').doc(userId).collection('settings').doc('data').set({
                settings: settings,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 🔥 NEW: تحميل الإعدادات من Firestore
    async loadSettingsFromFirestore(userId) {
        try {
            const doc = await this.db.collection('users').doc(userId).collection('settings').doc('data').get();
            if (doc.exists) {
                return { success: true, data: doc.data().settings };
            }
            return { success: false, error: 'No settings found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 🔥 NEW: الاستماع للتحديثات في الوقت الحقيقي
    setupRealtimeListener(userId, callback) {
        return this.db.collection('users').doc(userId)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    callback(doc.data());
                }
            });
    }

    // تسجيل الدخول
    async login(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;
            return { success: true, user: this.currentUser };
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

    // إنشاء حساب
    async createAccount(email, password, userData = {}) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;
            
            // حفظ بيانات المستخدم في Firestore
            const userProfile = {
                username: userData.username || email.split('@')[0],
                fullName: userData.fullName || email.split('@')[0],
                email: email,
                phone: userData.phone || '',
                role: userData.role || 'مدير النظام',
                joinDate: new Date().toISOString().split('T')[0],
                storage: {
                    limit: 500, // 500 MB مساحة تخزين
                    used: 0,    // مساحة مستخدمة حالياً
                    unit: 'MB'
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await this.db.collection('users').doc(this.currentUser.uid).set(userProfile);
            
            // إنشاء البيانات الافتراضية للمستخدم الجديد
            await this.createDefaultUserData(this.currentUser.uid, userProfile);
            
            return { success: true, user: this.currentUser };
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

    // 🔥 NEW: إنشاء البيانات الافتراضية للمستخدم الجديد
    async createDefaultUserData(userId, userProfile) {
        try {
            const defaultProperties = [
                { id: 1, name: 'A-101', type: 'شقة', area: '120م²', status: 'شاغرة', rent: 1500, tenant: '', contractEnd: '' },
                { id: 2, name: 'A-102', type: 'شقة', area: '100م²', status: 'شاغرة', rent: 1200, tenant: '', contractEnd: '' },
                { id: 3, name: 'B-201', type: 'فيلا', area: '200م²', status: 'شاغرة', rent: 2500, tenant: '', contractEnd: '' }
            ];

            const defaultCustomers = [
                { id: 1, name: 'فاطمة محمد', phone: '0512345678', email: 'fatima@email.com', idNumber: '1234567890' },
                { id: 2, name: 'أحمد خالد', phone: '0554321098', email: 'ahmed@email.com', idNumber: '0987654321' }
            ];

            const defaultSettings = {
                companyName: 'نظام إدارة العقارات',
                currency: 'ريال',
                taxRate: 15
            };

            // حفظ البيانات الافتراضية في Firestore
            await this.savePropertiesToFirestore(userId, defaultProperties);
            await this.saveCustomersToFirestore(userId, defaultCustomers);
            await this.saveSettingsToFirestore(userId, defaultSettings);
            await this.saveContractsToFirestore(userId, []);
            await this.savePaymentsToFirestore(userId, []);
            await this.saveMaintenanceToFirestore(userId, []);
            
            console.log('✅ Default user data created in Firestore');
        } catch (error) {
            console.error('❌ Error creating default user data:', error);
        }
    }

    // تسجيل الخروج
    async logout() {
        try {
            await this.auth.signOut();
            this.currentUser = null;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // جلب بيانات المستخدم
    async getUserData() {
        if (!this.currentUser) return { success: false, error: 'No user logged in' };
        
        try {
            const doc = await this.db.collection('users').doc(this.currentUser.uid).get();
            if (doc.exists) {
                return { success: true, data: doc.data() };
            }
            return { success: false, error: 'User data not found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // رفع ملف إلى التخزين
    async uploadFile(file, path) {
        if (!this.currentUser) return { success: false, error: 'No user logged in' };
        
        try {
            const storageRef = this.storage.ref();
            const fileRef = storageRef.child(`${this.currentUser.uid}/${path}/${file.name}`);
            const snapshot = await fileRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            return { success: true, url: downloadURL, size: file.size };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // حساب المساحة المستخدمة
    async getStorageUsage() {
        if (!this.currentUser) return { success: false, error: 'No user logged in' };
        
        try {
            const storageRef = this.storage.ref();
            const userRef = storageRef.child(this.currentUser.uid);
            const result = await userRef.listAll();
            
            let totalSize = 0;
            for (const item of result.items) {
                const metadata = await item.getMetadata();
                totalSize += metadata.size;
            }
            
            return { success: true, used: totalSize / (1024 * 1024) }; // بالـ MB
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// النظام الرئيسي
class AdvancedPropertySystem {
    constructor() {
        this.currentPage = 'dashboard';
        this.currentLanguage = localStorage.getItem('propertyLanguage') || 'ar';
        this.mainDB = getPropertyDB();
        this.propertyDB = this.getDefaultUserDB();
        this.firebaseManager = new FirebaseManager();
        this.isDataLoaded = false;
        this.init();
    }

    // 🔥 NEW: دالة استدعاء عند تحميل بيانات المستخدم من Firestore
    async onUserDataLoaded(userData) {
        console.log('🔥 User data received from Firestore:', userData);
        
        const userId = this.firebaseManager.currentUser.uid;
        
        try {
            // تحميل جميع البيانات من Firestore
            const [propertiesResult, customersResult, contractsResult, paymentsResult, maintenanceResult, settingsResult] = await Promise.all([
                this.firebaseManager.loadPropertiesFromFirestore(userId),
                this.firebaseManager.loadCustomersFromFirestore(userId),
                this.firebaseManager.loadContractsFromFirestore(userId),
                this.firebaseManager.loadPaymentsFromFirestore(userId),
                this.firebaseManager.loadMaintenanceFromFirestore(userId),
                this.firebaseManager.loadSettingsFromFirestore(userId)
            ]);

            // تحديث قاعدة البيانات المحلية بالبيانات من Firestore
            this.propertyDB = {
                ...this.propertyDB,
                currentUser: userData.username,
                currentEmail: userData.email,
                userProfiles: {
                    [userData.username]: userData
                },
                properties: propertiesResult.success ? propertiesResult.data : this.propertyDB.properties,
                customers: customersResult.success ? customersResult.data : this.propertyDB.customers,
                contracts: contractsResult.success ? contractsResult.data : this.propertyDB.contracts,
                payments: paymentsResult.success ? paymentsResult.data : this.propertyDB.payments,
                maintenance: maintenanceResult.success ? maintenanceResult.data : this.propertyDB.maintenance,
                settings: settingsResult.success ? settingsResult.data : this.propertyDB.settings
            };

            this.isDataLoaded = true;
            
            // تحديث الواجهة
            this.applyPermissions();
            this.setupUserMenu();
            this.loadDashboard();
            
            console.log('✅ All user data synchronized from Firestore');
            this.showNotification('تم مزامنة البيانات بنجاح من السحابة');
            
        } catch (error) {
            console.error('❌ Error synchronizing user data:', error);
            this.showNotification('خطأ في مزامنة البيانات', 'error');
        }
    }

    // 🔥 NEW: حفظ جميع البيانات إلى Firestore
    async saveAllDataToFirestore() {
        if (!this.firebaseManager.currentUser || !this.isDataLoaded) return;
        
        const userId = this.firebaseManager.currentUser.uid;
        
        try {
            await Promise.all([
                this.firebaseManager.savePropertiesToFirestore(userId, this.propertyDB.properties),
                this.firebaseManager.saveCustomersToFirestore(userId, this.propertyDB.customers),
                this.firebaseManager.saveContractsToFirestore(userId, this.propertyDB.contracts),
                this.firebaseManager.savePaymentsToFirestore(userId, this.propertyDB.payments),
                this.firebaseManager.saveMaintenanceToFirestore(userId, this.propertyDB.maintenance),
                this.firebaseManager.saveSettingsToFirestore(userId, this.propertyDB.settings)
            ]);
            
            console.log('✅ All data saved to Firestore');
        } catch (error) {
            console.error('❌ Error saving data to Firestore:', error);
        }
    }

    // 🔥 NEW: حفظ البيانات مع التزامن التلقائي
    async saveCurrentUserDB() {
        if (!this.propertyDB || !this.propertyDB.currentUser) {
            console.warn('⚠️ لا يمكن حفظ البيانات: لا يوجد مستخدم نشط');
            return false;
        }

        try {
            // حفظ محلي للنسخة الاحتياطية
            const dataToSave = {
                ...this.propertyDB,
                _metadata: {
                    lastSaved: new Date().toISOString(),
                    user: this.propertyDB.currentUser
                }
            };
            
            localStorage.setItem(`propertyDB_${this.propertyDB.currentUser}`, JSON.stringify(dataToSave));
            
            // حفظ في Firestore للتزامن بين الأجهزة
            if (this.firebaseManager.currentUser && this.isDataLoaded) {
                await this.saveAllDataToFirestore();
            }
            
            console.log('✅ تم حفظ البيانات بنجاح (محلي + سحابي)');
            return true;
        } catch (error) {
            console.error('❌ فشل في حفظ البيانات:', error);
            this.showNotification('فشل في حفظ البيانات', 'error');
            return false;
        }
    }

    // 🔥 NEW: دالة مساعدة للحفظ الآمن
    async safeSave() {
        return await this.saveCurrentUserDB();
    }

    // 🔥 قاعدة بيانات افتراضية للمستخدم
    getDefaultUserDB() {
        return {
            currentUser: null,
            currentEmail: null,
            users: {},
            userProfiles: {},
            properties: [
                { id: 1, name: 'A-101', type: 'شقة', area: '120م²', status: 'شاغرة', rent: 1500, tenant: '', contractEnd: '' },
                { id: 2, name: 'A-102', type: 'شقة', area: '100م²', status: 'شاغرة', rent: 1200, tenant: '', contractEnd: '' },
                { id: 3, name: 'B-201', type: 'فيلا', area: '200م²', status: 'شاغرة', rent: 2500, tenant: '', contractEnd: '' }
            ],
            customers: [
                { id: 1, name: 'فاطمة محمد', phone: '0512345678', email: 'fatima@email.com', idNumber: '1234567890' },
                { id: 2, name: 'أحمد خالد', phone: '0554321098', email: 'ahmed@email.com', idNumber: '0987654321' }
            ],
            contracts: [],
            payments: [],
            maintenance: [],
            settings: {
                companyName: 'نظام إدارة العقارات',
                currency: 'ريال',
                taxRate: 15
            },
            storageUsage: {
                documents: 0,
                images: 0,
                total: 0
            }
        };
    }

    // 🔥 إنشاء قاعدة بيانات جديدة للمستخدم
    createNewUserDB(username, email) {
        const newUserDB = {
            currentUser: username,
            currentEmail: email,
            users: { [username]: '123456' },
            userProfiles: {
                [username]: {
                    id: Date.now(),
                    name: username,
                    email: email,
                    phone: '',
                    role: 'مدير النظام',
                    permissions: this.getDefaultPermissions('مدير النظام'),
                    joinDate: new Date().toISOString().split('T')[0],
                    profileImage: null,
                    storage: {
                        limit: 500, // 500 MB مساحة تخزين
                        used: 0,    // مساحة مستخدمة حالياً
                        unit: 'MB'
                    }
                }
            },
            properties: [...this.getDefaultUserDB().properties],
            customers: [...this.getDefaultUserDB().customers],
            contracts: [],
            payments: [],
            maintenance: [],
            settings: { ...this.getDefaultUserDB().settings },
            storageUsage: {
                documents: 0,
                images: 0,
                total: 0
            }
        };
        
        localStorage.setItem(`propertyDB_${username}`, JSON.stringify(newUserDB));
        return newUserDB;
    }

    // 🔥 الصلاحيات الافتراضية
    getDefaultPermissions(role) {
        const permissions = {
            'مدير النظام': {
                viewDashboard: true, manageProperties: true, manageCustomers: true,
                manageContracts: true, managePayments: true, manageMaintenance: true,
                viewReports: true, manageSettings: true, manageUsers: true,
                deleteData: true, editAll: true
            },
            'مشرف': {
                viewDashboard: true, manageProperties: true, manageCustomers: true,
                manageContracts: true, managePayments: true, manageMaintenance: true,
                viewReports: true, manageSettings: false, manageUsers: false,
                deleteData: false, editAll: true
            },
            'عضو': {
                viewDashboard: true, manageProperties: false, manageCustomers: false,
                manageContracts: false, managePayments: false, manageMaintenance: false,
                viewReports: false, manageSettings: false, manageUsers: false,
                deleteData: false, editAll: false
            }
        };
        return permissions[role] || permissions['عضو'];
    }

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
        
        if (!this.propertyDB.properties) this.propertyDB.properties = [];
        if (!this.propertyDB.customers) this.propertyDB.customers = [];
        if (!this.propertyDB.contracts) this.propertyDB.contracts = [];
        if (!this.propertyDB.payments) this.propertyDB.payments = [];
        if (!this.propertyDB.maintenance) this.propertyDB.maintenance = [];
        if (!this.propertyDB.settings) this.propertyDB.settings = {
            companyName: 'نظام إدارة العقارات',
            currency: 'ريال',
            taxRate: 15
        };
    }

    setupLogin() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // إعداد أزرار تبديل اللغة
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.getAttribute('data-lang');
                this.applyLanguage(lang);
            });
        });
    }

    // 🔥 التحقق من صحة البريد الإلكتروني
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 🔥 دالة تسجيل الدخول مع Firebase - معدلة
    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            this.showNotification('يرجى ملء جميع الحقول', 'error');
            return;
        }

        // التحقق من صحة البريد الإلكتروني
        if (!this.isValidEmail(email)) {
            this.showNotification('البريد الإلكتروني غير صالح', 'error');
            return;
        }

        // استخدام Firebase للمصادقة
        const result = await this.firebaseManager.login(email, password);
        
        if (result.success) {
            // سيتم تحميل البيانات تلقائياً عبر onUserDataLoaded
            const username = email.split('@')[0];
            
            this.propertyDB.currentUser = username;
            this.propertyDB.currentEmail = email;
            
            localStorage.setItem('propertyUser', username);
            localStorage.setItem('propertyEmail', email);
            localStorage.setItem('loginTime', new Date().toISOString());
            
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            this.showNotification('مرحباً بك في النظام! جاري مزامنة البيانات...');
            
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    // 🔥 دالة إنشاء حساب مع Firebase - معدلة
    async createNewAccount(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const email = formData.get('email');
        const fullName = formData.get('fullName');
        const phone = formData.get('phone');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        // التحقق من صحة البريد الإلكتروني
        if (!this.isValidEmail(email)) {
            this.showNotification('البريد الإلكتروني غير صالح!', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showNotification('كلمتا المرور غير متطابقتين!', 'error');
            return;
        }
        
        // استخدام Firebase لإنشاء الحساب
        const username = email.split('@')[0];
        const userData = {
            username: username,
            fullName: fullName,
            phone: phone,
            role: 'مدير النظام',
            storage: {
                limit: 500, // 500 MB مساحة تخزين
                used: 0,    // مساحة مستخدمة حالياً
                unit: 'MB'
            },
            createdAt: new Date().toISOString()
        };
        
        const result = await this.firebaseManager.createAccount(email, password, userData);
        
        if (result.success) {
            this.closeModal('createAccountModal');
            this.showNotification('تم إنشاء الحساب الجديد بنجاح! يمكنك الآن تسجيل الدخول');
            
            event.target.reset();
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    checkAuthStatus() {
        try {
            const savedUser = localStorage.getItem('propertyUser');
            if (savedUser) {
                // عرض شاشة التحمين
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('dashboard').style.display = 'block';
                this.showNotification('جاري تحميل البيانات من السحابة...', 'info');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.logout();
        }
    }

    // 🔥 تسجيل الخروج مع Firebase
    async logout() {
        // حفظ بيانات المستخدم الحالي قبل تسجيل الخروج
        if (this.propertyDB && this.propertyDB.currentUser) {
            await this.safeSave();
        }
        
        // تسجيل الخروج من Firebase
        await this.firebaseManager.logout();
        
        // مسح بيانات الجلسة
        localStorage.removeItem('propertyUser');
        localStorage.removeItem('propertyEmail');
        localStorage.removeItem('loginTime');
        
        // إعادة تعيين قاعدة البيانات للنظام
        this.propertyDB = this.getDefaultUserDB();
        this.isDataLoaded = false;
        
        // تحديث الواجهة
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
        
        // إعادة تعيين الحقول
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.reset();
        }
        
        // إزالة القائمة الجانبية للمستخدم
        const userMenu = document.querySelector('.user-menu-sidebar');
        if (userMenu) {
            userMenu.remove();
        }
        
        this.showNotification('تم تسجيل الخروج بنجاح');
        this.currentPage = 'dashboard';
        this.setupNavigation();
    }

    setupNavigation() {
        const navLinks = [
            { id: 'nav-dashboard', icon: 'fa-home', text: 'dashboard', page: 'dashboard' },
            { id: 'nav-properties', icon: 'fa-building', text: 'properties', page: 'properties' },
            { id: 'nav-customers', icon: 'fa-users', text: 'customers', page: 'customers' },
            { id: 'nav-contracts', icon: 'fa-file-contract', text: 'contracts', page: 'contracts' },
            { id: 'nav-payments', icon: 'fa-money-bill', text: 'payments', page: 'payments' },
            { id: 'nav-maintenance', icon: 'fa-tools', text: 'maintenance', page: 'maintenance' },
            { id: 'nav-reports', icon: 'fa-chart-bar', text: 'reports', page: 'reports' },
            { id: 'nav-settings', icon: 'fa-cog', text: 'settings', page: 'settings' },
        ];

        const navContainer = document.querySelector('.sidebar .nav-links');
        if (navContainer) {
            navContainer.innerHTML = navLinks.map(link => `
                <a href="#" class="nav-link" id="${link.id}" data-page="${link.page}">
                    <i class="fas ${link.icon}"></i>
                    <span data-translate="${link.text}">${this.getTranslation(link.text)}</span>
                </a>
            `).join('');

            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const page = e.currentTarget.getAttribute('data-page');
                    this.navigateTo(page);
                });
            });

            this.navigateTo('dashboard');
        }
    }

    setupUserMenu() {
        const username = this.propertyDB.currentUser;
        const userProfile = this.propertyDB.userProfiles?.[username] || {};
        const displayName = userProfile.name || username;
        const profileImage = userProfile.profileImage;
        const storageUsed = userProfile.storage?.used || 0;
        const storageLimit = userProfile.storage?.limit || 500;

        const userMenuHTML = `
            <div class="user-menu-container">
                <div class="user-avatar" onclick="propertySystem.toggleUserMenu()">
                    ${profileImage ? 
                        `<img src="${profileImage}" class="profile-image" alt="Profile">` : 
                        `<i class="fas fa-user-circle default-avatar"></i>`
                    }
                    <span class="user-display-name">${displayName}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="user-dropdown" id="userDropdown">
                    <div class="user-info">
                        ${profileImage ? 
                            `<img src="${profileImage}" class="profile-image-large" alt="Profile">` : 
                            `<i class="fas fa-user-circle profile-icon-large"></i>`
                        }
                        <div class="user-name">${displayName}</div>
                        <div class="user-role">${userProfile.role || 'مدير النظام'}</div>
                        <div class="storage-info-dropdown">
                            <div class="storage-progress">
                                <div class="storage-progress-bar" style="width: ${(storageUsed / storageLimit) * 100}%"></div>
                            </div>
                            <div class="storage-text">
                                ${storageUsed.toFixed(1)} MB / ${storageLimit} MB مستخدم
                            </div>
                        </div>
                    </div>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item" onclick="propertySystem.showProfileModal()">
                        <i class="fas fa-user"></i>
                        <span data-translate="profile">الملف الشخصي</span>
                    </a>
                    <a href="#" class="dropdown-item" onclick="propertySystem.showChangePasswordModal()">
                        <i class="fas fa-key"></i>
                        <span data-translate="changePassword">تغيير كلمة المرور</span>
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item logout-item" onclick="propertySystem.logout()">
                        <i class="fas fa-sign-out-alt"></i>
                        <span data-translate="logout">تسجيل الخروج</span>
                    </a>
                </div>
            </div>
        `;

        const oldMenu = document.querySelector('.user-menu-sidebar');
        if (oldMenu) oldMenu.remove();

        const sidebar = document.querySelector('.sidebar .nav-links');
        if (sidebar) {
            const userMenuContainer = document.createElement('div');
            userMenuContainer.className = 'user-menu-sidebar';
            userMenuContainer.innerHTML = userMenuHTML;
            sidebar.parentNode.insertBefore(userMenuContainer, sidebar.nextSibling);
        }

        this.setupUserMenuEvents();
    }

    setupUserMenuEvents() {
        document.addEventListener('click', (e) => {
            const userDropdown = document.getElementById('userDropdown');
            const userAvatar = document.querySelector('.user-avatar');
            
            if (userDropdown && userAvatar && !userAvatar.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }

    toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    showCreateAccountModal() {
        const createAccountHTML = `
            <div class="modal-overlay" id="createAccountModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-plus"></i> ${this.currentLanguage === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('createAccountModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.createNewAccount(event)">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'البريد الإلكتروني' : 'Email'} *:</label>
                            <input type="email" name="email" required placeholder="${this.currentLanguage === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email'}">
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الاسم الكامل' : 'Full Name'} *:</label>
                            <input type="text" name="fullName" required placeholder="${this.currentLanguage === 'ar' ? 'أدخل الاسم الكامل' : 'Enter full name'}">
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'رقم الهاتف' : 'Phone'}:</label>
                            <input type="tel" name="phone" placeholder="${this.currentLanguage === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'}">
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'كلمة المرور' : 'Password'} *:</label>
                            <input type="password" name="password" required minlength="6" placeholder="${this.currentLanguage === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}">
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'} *:</label>
                            <input type="password" name="confirmPassword" required minlength="6" placeholder="${this.currentLanguage === 'ar' ? 'أكد كلمة المرور' : 'Confirm password'}">
                        </div>
                        
                        <!-- معلومات المساحة التخزينية -->
                        <div class="storage-info">
                            <i class="fas fa-database"></i>
                            <span>${this.currentLanguage === 'ar' ? 'سيحصل الحساب على مساحة تخزين 500 ميجابايت' : 'Account will get 500 MB storage space'}</span>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> ${this.currentLanguage === 'ar' ? 'إنشاء الحساب' : 'Create Account'}
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('createAccountModal')">
                                ${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.showModal(createAccountHTML);
    }

    showChangePasswordModal() {
        const passwordHTML = `
            <div class="modal-overlay" id="passwordModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-key"></i> ${this.currentLanguage === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('passwordModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.changePassword(event)">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}:</label>
                            <input type="password" name="currentPassword" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}:</label>
                            <input type="password" name="newPassword" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}:</label>
                            <input type="password" name="confirmPassword" required minlength="6">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                ${this.currentLanguage === 'ar' ? 'حفظ كلمة المرور' : 'Save Password'}
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('passwordModal')">
                                ${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.showModal(passwordHTML);
    }

    async changePassword(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');
        
        if (newPassword !== confirmPassword) {
            this.showNotification('كلمتا المرور الجديدتين غير متطابقتين!', 'error');
            return;
        }
        
        try {
            // إعادة المصادقة لتغيير كلمة المرور
            const user = this.firebaseManager.currentUser;
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
            await user.reauthenticateWithCredential(credential);
            await user.updatePassword(newPassword);
            
            this.closeModal('passwordModal');
            this.showNotification('تم تغيير كلمة المرور بنجاح!');
        } catch (error) {
            this.showNotification('كلمة المرور الحالية غير صحيحة!', 'error');
        }
    }

    navigateTo(page) {
        this.currentPage = page;
        
        if (page === 'logout') {
            this.logout();
            return;
        }
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.getElementById(`nav-${page}`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        switch(page) {
            case 'dashboard': this.loadDashboard(); break;
            case 'properties': this.loadProperties(); break;
            case 'customers': this.loadCustomers(); break;
            case 'contracts': this.loadContracts(); break;
            case 'payments': this.loadPayments(); break;
            case 'maintenance': this.loadMaintenance(); break;
            case 'reports': this.loadReports(); break;
            case 'settings': this.loadSettings(); break;
        }
    }

    loadDashboard() {
        const content = document.querySelector('.main-content');
        const stats = this.calculateStats();
        const username = this.propertyDB.currentUser;
        const userProfile = this.propertyDB.userProfiles?.[username] || {};
        const storageUsed = userProfile.storage?.used || 0;
        const storageLimit = userProfile.storage?.limit || 500;
        const storagePercent = (storageUsed / storageLimit) * 100;
        
        content.innerHTML = `
            <div class="dashboard-compact">
                <div class="dashboard-header-compact">
                    <h1 class="dashboard-title-compact">
                        <i class="fas fa-home"></i> 
                        <span data-translate="dashboard">${this.getTranslation('dashboard')}</span>
                    </h1>
                    <div class="sync-status">
                        <i class="fas fa-cloud"></i>
                        <span>${this.currentLanguage === 'ar' ? 'مزامنة مع السحابة' : 'Cloud Sync'}</span>
                    </div>
                </div>

                <div class="stats-grid-compact">
                    <div class="stat-card-compact">
                        <i class="fas fa-building"></i>
                        <div class="stat-value-compact">${stats.totalProperties}</div>
                        <div class="stat-title-compact">${this.currentLanguage === 'ar' ? 'إجمالي الوحدات' : 'Total Units'}</div>
                    </div>
                    <div class="stat-card-compact">
                        <i class="fas fa-check-circle"></i>
                        <div class="stat-value-compact">${stats.occupied}</div>
                        <div class="stat-title-compact">${this.currentLanguage === 'ar' ? 'وحدات مشغولة' : 'Occupied'}</div>
                    </div>
                    <div class="stat-card-compact">
                        <i class="fas fa-money-bill-wave"></i>
                        <div class="stat-value-compact">${stats.totalRevenue.toLocaleString()}</div>
                        <div class="stat-title-compact">${this.currentLanguage === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}</div>
                    </div>
                    <div class="stat-card-compact">
                        <i class="fas fa-users"></i>
                        <div class="stat-value-compact">${this.propertyDB.customers.length}</div>
                        <div class="stat-title-compact">${this.currentLanguage === 'ar' ? 'العملاء' : 'Customers'}</div>
                    </div>
                </div>

                <!-- مساحة التخزين -->
                <div class="storage-card">
                    <h3><i class="fas fa-database"></i> ${this.currentLanguage === 'ar' ? 'مساحة التخزين' : 'Storage Space'}</h3>
                    <div class="storage-progress-container">
                        <div class="storage-progress">
                            <div class="storage-progress-bar" style="width: ${storagePercent}%"></div>
                        </div>
                        <div class="storage-text">
                            ${storageUsed.toFixed(1)} MB / ${storageLimit} MB ${this.currentLanguage === 'ar' ? 'مستخدم' : 'used'}
                        </div>
                    </div>
                    <div class="storage-percent">${storagePercent.toFixed(1)}%</div>
                </div>

                <div class="activities-compact">
                    <h3><i class="fas fa-clock"></i> ${this.currentLanguage === 'ar' ? 'أحدث النشاطات' : 'Recent Activities'}</h3>
                    <div class="activity-list-compact">
                        ${this.getCompactActivities()}
                    </div>
                </div>
            </div>
        `;
    }

    calculateStats() {
        const totalProperties = this.propertyDB.properties?.length || 0;
        const occupied = this.propertyDB.properties?.filter(p => p.status === 'مشغولة').length || 0;
        const totalRevenue = this.propertyDB.payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

        return {
            totalProperties,
            occupied,
            totalRevenue
        };
    }

    getCompactActivities() {
        const activities = [];
        
        if (this.propertyDB.payments.length > 0) {
            activities.push({
                icon: 'fa-money-bill-wave',
                text: this.currentLanguage === 'ar' ? 'مدفوعات حديثة' : 'Recent payments',
                time: this.currentLanguage === 'ar' ? 'اليوم' : 'Today'
            });
        }
        
        if (this.propertyDB.contracts.length > 0) {
            activities.push({
                icon: 'fa-file-contract',
                text: this.currentLanguage === 'ar' ? 'عقود نشطة' : 'Active contracts',
                time: this.currentLanguage === 'ar' ? 'هذا الأسبوع' : 'This week'
            });
        }
        
        if (activities.length === 0) {
            activities.push({
                icon: 'fa-info-circle',
                text: this.currentLanguage === 'ar' ? 'مرحباً بك في النظام' : 'Welcome to the system',
                time: this.currentLanguage === 'ar' ? 'الآن' : 'Now'
            });
        }
        
        return activities.map(activity => `
            <div class="activity-item-compact">
                <div class="activity-icon-compact">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-content-compact">
                    <div class="activity-text-compact">${activity.text}</div>
                    <div class="activity-time-compact">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }

    loadProperties() {
        const content = document.querySelector('.main-content');
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-building"></i> <span data-translate="properties">${this.getTranslation('properties')}</span></h2>
                <button class="btn btn-primary" onclick="propertySystem.showPropertyForm()">
                    <i class="fas fa-plus"></i> <span data-translate="addProperty">${this.getTranslation('addProperty')}</span>
                </button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${this.currentLanguage === 'ar' ? 'رقم الوحدة' : 'Unit Number'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'النوع' : 'Type'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'المساحة' : 'Area'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الإيجار' : 'Rent'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.propertyDB.properties.map(property => `
                            <tr>
                                <td>${property.name}</td>
                                <td>${property.type}</td>
                                <td>${property.area}</td>
                                <td>${property.status}</td>
                                <td>${property.rent} ${this.propertyDB.settings.currency}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async showPropertyForm() {
        const formHTML = `
            <div class="modal-overlay" id="propertyModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-building"></i> ${this.currentLanguage === 'ar' ? 'إضافة وحدة عقارية جديدة' : 'Add New Property'}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('propertyModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.addProperty(event)">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'رقم الوحدة' : 'Unit Number'}:</label>
                            <input type="text" name="name" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'نوع الوحدة' : 'Unit Type'}:</label>
                            <select name="type" required>
                                <option value="شقة">${this.currentLanguage === 'ar' ? 'شقة' : 'Apartment'}</option>
                                <option value="فيلا">${this.currentLanguage === 'ar' ? 'فيلا' : 'Villa'}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'المساحة' : 'Area'}:</label>
                            <input type="text" name="area" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الإيجار الشهري' : 'Monthly Rent'}:</label>
                            <input type="number" name="rent" required>
                        </div>
                        <button type="submit" class="btn btn-primary">${this.currentLanguage === 'ar' ? 'إضافة الوحدة' : 'Add Property'}</button>
                    </form>
                </div>
            </div>
        `;
        this.showModal(formHTML);
    }

    async addProperty(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const newProperty = {
            id: this.propertyDB.properties.length > 0 ? Math.max(...this.propertyDB.properties.map(p => p.id)) + 1 : 1,
            name: formData.get('name'),
            type: formData.get('type'),
            area: formData.get('area'),
            rent: parseInt(formData.get('rent')),
            status: 'شاغرة',
            tenant: '',
            contractEnd: ''
        };
        
        this.propertyDB.properties.push(newProperty);
        
        // استخدام الحفظ الآمن الذي يحفظ محلياً وفي Firestore
        await this.safeSave();
        
        this.closeModal('propertyModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة الوحدة العقارية بنجاح!' : 'Property added successfully!');
        this.loadProperties();
    }

    loadCustomers() {
        const content = document.querySelector('.main-content');
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-users"></i> <span data-translate="customers">${this.getTranslation('customers')}</span></h2>
                <button class="btn btn-primary" onclick="propertySystem.showCustomerForm()">
                    <i class="fas fa-plus"></i> <span data-translate="addCustomer">${this.getTranslation('addCustomer')}</span>
                </button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${this.currentLanguage === 'ar' ? 'الاسم' : 'Name'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'رقم الهاتف' : 'Phone'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.propertyDB.customers.map(customer => `
                            <tr>
                                <td>${customer.name}</td>
                                <td>${customer.phone}</td>
                                <td>${customer.email}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async showCustomerForm() {
        const formHTML = `
            <div class="modal-overlay" id="customerModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-plus"></i> ${this.currentLanguage === 'ar' ? 'إضافة عميل جديد' : 'Add New Customer'}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('customerModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.addCustomer(event)">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الاسم الكامل' : 'Full Name'}:</label>
                            <input type="text" name="name" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'رقم الهاتف' : 'Phone'}:</label>
                            <input type="tel" name="phone" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'البريد الإلكتروني' : 'Email'}:</label>
                            <input type="email" name="email">
                        </div>
                        <button type="submit" class="btn btn-primary">${this.currentLanguage === 'ar' ? 'إضافة العميل' : 'Add Customer'}</button>
                    </form>
                </div>
            </div>
        `;
        this.showModal(formHTML);
    }

    async addCustomer(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const newCustomer = {
            id: this.propertyDB.customers.length > 0 ? Math.max(...this.propertyDB.customers.map(c => c.id)) + 1 : 1,
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            idNumber: ''
        };
        
        this.propertyDB.customers.push(newCustomer);
        
        // استخدام الحفظ الآمن
        await this.safeSave();
        
        this.closeModal('customerModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة العميل بنجاح!' : 'Customer added successfully!');
        this.loadCustomers();
    }

    loadSettings() {
        const content = document.querySelector('.main-content');
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-cogs"></i> <span data-translate="settings">${this.getTranslation('settings')}</span></h2>
            </div>
            <div class="settings-grid">
                <div class="settings-card">
                    <h3>${this.currentLanguage === 'ar' ? 'إعدادات النظام' : 'System Settings'}</h3>
                    <form onsubmit="propertySystem.saveCompanySettings(event)">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'اسم الشركة' : 'Company Name'}:</label>
                            <input type="text" name="companyName" value="${this.propertyDB.settings.companyName}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'العملة' : 'Currency'}:</label>
                            <select name="currency" required>
                                <option value="ريال" ${this.propertyDB.settings.currency === 'ريال' ? 'selected' : ''}>ريال سعودي</option>
                                <option value="دولار" ${this.propertyDB.settings.currency === 'دولار' ? 'selected' : ''}>دولار أمريكي</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">${this.currentLanguage === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}</button>
                    </form>
                </div>
            </div>
        `;
    }

    async saveCompanySettings(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        this.propertyDB.settings = {
            companyName: formData.get('companyName'),
            currency: formData.get('currency'),
            taxRate: this.propertyDB.settings.taxRate || 15
        };
        
        await this.safeSave();
        this.showNotification(this.currentLanguage === 'ar' ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!');
    }

    loadContracts() { this.loadBasicPage('contracts', 'fa-file-contract', 'العقود', 'Contracts'); }
    loadPayments() { this.loadBasicPage('payments', 'fa-money-bill', 'المدفوعات', 'Payments'); }
    loadMaintenance() { this.loadBasicPage('maintenance', 'fa-tools', 'الصيانة', 'Maintenance'); }
    loadReports() { this.loadBasicPage('reports', 'fa-chart-bar', 'التقارير', 'Reports'); }

    loadBasicPage(type, icon, arTitle, enTitle) {
        const content = document.querySelector('.main-content');
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas ${icon}"></i> <span>${this.currentLanguage === 'ar' ? arTitle : enTitle}</span></h2>
                <p>${this.currentLanguage === 'ar' ? 'هذه الصفحة قيد التطوير' : 'This page is under development'}</p>
            </div>
        `;
    }

    // 🔥 دوال مساعدة
    showModal(html) {
        this.closeAllModals();
        document.body.insertAdjacentHTML('beforeend', html);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.remove();
    }

    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => modal.remove());
    }

    showNotification(message, type = 'success') {
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

    applyLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('propertyLanguage', lang);
        
        const html = document.documentElement;
        html.setAttribute('lang', lang);
        html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        
        this.updateAllTexts();
        this.showNotification(lang === 'ar' ? 'تم التبديل إلى العربية' : 'Switched to English');
    }

    getTranslation(key) {
        const translations = {
            'ar': {
                'email': 'البريد الإلكتروني',
                'username': 'اسم المستخدم', 
                'password': 'كلمة المرور', 
                'login': 'تسجيل الدخول',
                'dashboard': 'الرئيسية', 
                'properties': 'إدارة العقارات', 
                'customers': 'إدارة العملاء',
                'contracts': 'العقود', 
                'payments': 'المدفوعات', 
                'maintenance': 'الصيانة',
                'reports': 'التقارير', 
                'settings': 'الإعدادات', 
                'logout': 'تسجيل الخروج',
                'addProperty': 'إضافة وحدة جديدة', 
                'addCustomer': 'إضافة عميل جديد',
                'profile': 'الملف الشخصي', 
                'changePassword': 'تغيير كلمة المرور',
                'createAccount': 'إنشاء حساب جديد'
            },
            'en': {
                'email': 'Email',
                'username': 'Username', 
                'password': 'Password', 
                'login': 'Login',
                'dashboard': 'Dashboard', 
                'properties': 'Properties Management', 
                'customers': 'Customers Management',
                'contracts': 'Contracts', 
                'payments': 'Payments', 
                'maintenance': 'Maintenance',
                'reports': 'Reports', 
                'settings': 'Settings', 
                'logout': 'Logout',
                'addProperty': 'Add New Property', 
                'addCustomer': 'Add New Customer',
                'profile': 'Profile', 
                'changePassword': 'Change Password',
                'createAccount': 'Create New Account'
            }
        };
        return translations[this.currentLanguage][key] || key;
    }

    updateAllTexts() {
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            element.textContent = this.getTranslation(key);
        });
    }

    applyPermissions() {
        // تطبيق الصلاحيات حسب دور المستخدم
        const currentUser = this.propertyDB.currentUser;
        const userProfile = this.propertyDB.userProfiles?.[currentUser];
        
        if (!userProfile) return;
        
        // يمكن إضافة منطق إخفاء الأقسام حسب الصلاحيات هنا
    }

    hasPermission(permission) {
        const currentUser = this.propertyDB.currentUser;
        const userProfile = this.propertyDB.userProfiles?.[currentUser];
        return userProfile?.permissions?.[permission] || false;
    }
}

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.propertySystem = new AdvancedPropertySystem();
});
