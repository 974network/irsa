// قاعدة بيانات كاملة للتطبيق
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

// النظام الرئيسي
class AdvancedPropertySystem {
    constructor() {
        this.currentPage = 'dashboard';
        this.currentLanguage = localStorage.getItem('propertyLanguage') || 'ar';
        this.mainDB = getPropertyDB(); // قاعدة البيانات الرئيسية
        this.propertyDB = this.loadUserDB(); // قاعدة بيانات المستخدم الحالي
        this.init();
    }

    // 🔥 **دالة محسنة: تحميل قاعدة بيانات المستخدم الحالي**
    loadUserDB() {
        const currentUser = localStorage.getItem('propertyUser');
        if (currentUser) {
            const userDB = localStorage.getItem(`propertyDB_${currentUser}`);
            if (userDB) {
                return JSON.parse(userDB);
            } else {
                // إنشاء قاعدة بيانات جديدة للمستخدم
                return this.createNewUserDB(currentUser);
            }
        }
        return this.getDefaultUserDB();
    }

    // 🔥 **دالة جديدة: قاعدة بيانات افتراضية للمستخدم**
    getDefaultUserDB() {
        return {
            currentUser: null,
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
            }
        };
    }
    

    // 🔥 **دالة محسنة: إنشاء قاعدة بيانات جديدة للمستخدم**
    // 🔥 **تحسين دالة إنشاء قاعدة بيانات جديدة للمستخدم**
// 🔥 تحديث دالة إنشاء قاعدة بيانات المستخدم
// 🔥 في دالة createNewUserDB أضف الصلاحيات
createNewUserDB(username) {
    const newUserDB = {
        currentUser: username,
        users: {
            [username]: '123456'
        },
        userProfiles: {
            [username]: {
                id: Date.now(),
                name: username,
                email: `${username}@irsa.com`,
                phone: '0512345678',
                role: 'مدير النظام', // 🔥 الأدوار: مدير النظام، مشرف، عضو
                permissions: this.getDefaultPermissions('مدير النظام'), // 🔥 الصلاحيات الجديدة
                joinDate: new Date().toISOString().split('T')[0],
                profileImage: null
            }
        },
        // ... باقي البيانات
    };
    
    localStorage.setItem(`propertyDB_${username}`, JSON.stringify(newUserDB));
    return newUserDB;
}

// 🔥 دالة الحصول على الصلاحيات الافتراضية
getDefaultPermissions(role) {
    const permissions = {
        'مدير النظام': {
            viewDashboard: true,
            manageProperties: true,
            manageCustomers: true,
            manageContracts: true,
            managePayments: true,
            manageMaintenance: true,
            viewReports: true,
            manageSettings: true,
            manageUsers: true,
            deleteData: true,
            editAll: true
        },
        'مشرف': {
            viewDashboard: true,
            manageProperties: true,
            manageCustomers: true,
            manageContracts: true,
            managePayments: true,
            manageMaintenance: true,
            viewReports: true,
            manageSettings: false,
            manageUsers: false,
            deleteData: false,
            editAll: true
        },
        'عضو': {
            viewDashboard: true,
            manageProperties: false,
            manageCustomers: false,
            manageContracts: false,
            managePayments: false,
            manageMaintenance: false,
            viewReports: false,
            manageSettings: false,
            manageUsers: false,
            deleteData: false,
            editAll: false
        }
    };
    return permissions[role] || permissions['عضو'];
}

    // 🔥 **دالة محسنة: حفظ بيانات المستخدم الحالي**
    saveCurrentUserDB() {
    if (!this.propertyDB || !this.propertyDB.currentUser) {
        console.warn('⚠️ لا يمكن حفظ البيانات: لا يوجد مستخدم نشط');
        return false;
    }

    try {
        // 1. تحديث بيانات النظام قبل الحفظ
        this.updateSystemDataBeforeSave();
        
        // 2. التحقق من حجم البيانات
        const dataSize = JSON.stringify(this.propertyDB).length;
        const maxSize = 5 * 1024 * 1024; // 5MB حد أقصى
        
        if (dataSize > maxSize) {
            this.handleLargeDataSize(dataSize, maxSize);
            return false;
        }
        
        // 3. إنشاء نسخة احتياطية قبل الحفظ
        this.createAutoBackup();
        
        // 4. إضافة بيانات التعريف
        const dataToSave = {
            ...this.propertyDB,
            _metadata: {
                lastSaved: new Date().toISOString(),
                dataVersion: '1.0',
                user: this.propertyDB.currentUser,
                dataSize: dataSize
            }
        };
        
        // 5. محاولة الحفظ مع التعامل مع الأخطاء
        localStorage.setItem(`propertyDB_${this.propertyDB.currentUser}`, JSON.stringify(dataToSave));
        
        // 6. تحديث وقت الحفظ الأخير
        this.lastSaveTime = new Date();
        
        // 7. تسجيل النجاح
        console.log(`✅ تم حفظ بيانات المستخدم "${this.propertyDB.currentUser}" بنجاح`, {
            size: this.formatBytes(dataSize),
            timestamp: new Date().toLocaleString()
        });
        
        return true;
        
    } catch (error) {
        console.error('❌ فشل في حفظ البيانات:', error);
        
        // 8. التعامل مع أنواع الأخطاء المختلفة
        if (error.name === 'QuotaExceededError') {
            this.handleStorageQuotaExceeded();
        } else if (error.name === 'SecurityError') {
            this.showNotification('خطأ في الأمان: لا يمكن حفظ البيانات', 'error');
        } else {
            this.showNotification('فشل في حفظ البيانات', 'error');
        }
        
        return false;
    }
}

// 🔧 الدوال المساعدة الجديدة
updateSystemDataBeforeSave() {
    // تحديث الإحصائيات والتقارير قبل الحفظ
    if (this.propertyDB.settings) {
        this.propertyDB.settings.lastModified = new Date().toISOString();
    }
    
    // تحديث إحصائيات الاستخدام
    if (!this.propertyDB.usageStats) {
        this.propertyDB.usageStats = {};
    }
    this.propertyDB.usageStats.lastSave = new Date().toISOString();
    this.propertyDB.usageStats.saveCount = (this.propertyDB.usageStats.saveCount || 0) + 1;
}

createAutoBackup() {
    try {
        const backupKey = `backup_${this.propertyDB.currentUser}_${Date.now()}`;
        const backupData = {
            ...this.propertyDB,
            _backup: {
                timestamp: new Date().toISOString(),
                type: 'auto_save',
                originalUser: this.propertyDB.currentUser
            }
        };
        
        // حفظ آخر 3 نسخ احتياطية فقط
        this.cleanupOldBackups();
        
        localStorage.setItem(backupKey, JSON.stringify(backupData));
        console.log('📦 تم إنشاء نسخة احتياطية تلقائية');
        
    } catch (error) {
        console.warn('⚠️ فشل في إنشاء نسخة احتياطية:', error);
    }
}

cleanupOldBackups() {
    try {
        const backups = [];
        const currentUser = this.propertyDB.currentUser;
        
        // جمع جميع النسخ الاحتياطية للمستخدم الحالي
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(`backup_${currentUser}_`)) {
                backups.push({
                    key: key,
                    timestamp: parseInt(key.split('_').pop())
                });
            }
        }
        
        // ترتيب من الأقدم إلى الأحدث
        backups.sort((a, b) => a.timestamp - b.timestamp);
        
        // حذف النسخ القديمة (الإبقاء على آخر 3 فقط)
        while (backups.length > 3) {
            const oldBackup = backups.shift();
            localStorage.removeItem(oldBackup.key);
            console.log('🗑️ تم حذف نسخة احتياطية قديمة:', oldBackup.key);
        }
        
    } catch (error) {
        console.warn('⚠️ فشل في تنظيف النسخ الاحتياطية:', error);
    }
}

handleLargeDataSize(currentSize, maxSize) {
    console.error('📏 حجم البيانات كبير جداً:', {
        current: this.formatBytes(currentSize),
        max: this.formatBytes(maxSize),
        excess: this.formatBytes(currentSize - maxSize)
    });
    
    this.showNotification(
        `حجم البيانات كبير جداً (${this.formatBytes(currentSize)})، يرجى تنظيف بعض البيانات`,
        'warning'
    );
    
    // محاولة ضغط البيانات أو حذف البيانات المؤقتة
    this.cleanupTemporaryData();
}

handleStorageQuotaExceeded() {
    console.error('💾 مساحة التخزين ممتلئة');
    
    this.showNotification('مساحة التخزين ممتلئة، يرجى تنظيف بعض البيانات', 'error');
    
    // محاولة تنظيف الذاكرة
    this.cleanupStorage();
}

cleanupStorage() {
    try {
        // حذف النسخ الاحتياطية القديمة
        this.cleanupOldBackups();
        
        // حذف البيانات المؤقتة
        this.cleanupTemporaryData();
        
        this.showNotification('تم تنظيف مساحة التخزين، يرجى المحاولة مرة أخرى', 'info');
        
    } catch (error) {
        console.error('❌ فشل في تنظيف التخزين:', error);
    }
}

cleanupTemporaryData() {
    // حذف البيانات المؤقتة إذا وجدت
    const tempKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('_temp') || key.includes('cache_')) {
            tempKeys.push(key);
        }
    }
    
    tempKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log('🗑️ تم حذف بيانات مؤقتة:', key);
    });
}

formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 🎯 دالة حفظ سريعة للاستخدام المتكرر
quickSave() {
    if (this.propertyDB && this.propertyDB.currentUser) {
        try {
            localStorage.setItem(`propertyDB_${this.propertyDB.currentUser}`, JSON.stringify(this.propertyDB));
            return true;
        } catch (error) {
            console.warn('⚠️ فشل في الحفظ السريع:', error);
            return false;
        }
    }
    return false;
}

    init() {
        this.setupLogin();
        this.setupNavigation();
        this.checkAuthStatus();
        this.setupSessionCheck();
        this.applyLanguage(this.currentLanguage);
        this.setupUserMenu();
    }

    setupLogin() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // إضافة زر إنشاء حساب جديد في صفحة Login
        const loginContainer = document.querySelector('.login-container');
        if (loginContainer && !document.getElementById('createAccountBtn')) {
            const createAccountBtn = document.createElement('button');
            createAccountBtn.type = 'button';
            createAccountBtn.id = 'createAccountBtn';
            createAccountBtn.className = 'btn btn-secondary';
            createAccountBtn.innerHTML = '<i class="fas fa-user-plus"></i> إنشاء حساب جديد';
            createAccountBtn.onclick = () => this.showCreateAccountModal();
            loginContainer.appendChild(createAccountBtn);
        }

        // إعداد أزرار تبديل اللغة في صفحة Login
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.getAttribute('data-lang');
                this.applyLanguage(lang);
            });
        });
    }

    // 🔥 **دالة محسنة: معالجة تسجيل الدخول**
    // 🔥 **إصلاح دالة تسجيل الدخول لضمان عزل البيانات**
// 🔥 **إصلاح دالة تسجيل الدخول لتحميل البيانات مباشرة**
// 🔥 تحديث دالة تسجيل الدخول
handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        this.showNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    // البحث في قاعدة البيانات الرئيسية للمستخدمين
    if (this.mainDB.users[username] === password) {
        // تحميل قاعدة بيانات المستخدم الخاصة
        const userDBKey = `propertyDB_${username}`;
        const userDB = localStorage.getItem(userDBKey);
        
        if (userDB) {
            this.propertyDB = JSON.parse(userDB);
        } else {
            // إنشاء قاعدة بيانات جديدة معزولة
            this.propertyDB = this.createNewUserDB(username);
            this.propertyDB.users = { [username]: password };
            
            this.propertyDB.userProfiles = {
                [username]: {
                    id: Date.now(),
                    name: username,
                    email: `${username}@irsa.com`,
                    phone: '0512345678',
                    role: 'عضو', // 🔥 العضو الجديد بيكون عضو عادي
                    permissions: this.getDefaultPermissions('عضو'),
                    joinDate: new Date().toISOString().split('T')[0],
                    profileImage: null
                }
            };
            
            this.saveCurrentUserDB();
        }
        
        this.propertyDB.currentUser = username;
        localStorage.setItem('propertyUser', username);
        localStorage.setItem('loginTime', new Date().toISOString());
        
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        this.showNotification('مرحباً بك في النظام!');
        
        // 🔥 تطبيق الصلاحيات بعد تسجيل الدخول
        this.applyPermissions();
        this.setupUserMenu();
        this.loadDashboard();
    } else {
        this.showNotification('اسم المستخدم أو كلمة المرور غير صحيحة!', 'error');
    }
}

    // 🔥 **دالة محسنة: التحقق من حالة المصادقة**
    checkAuthStatus() {
        const savedUser = localStorage.getItem('propertyUser');
        if (savedUser) {
            const userDB = localStorage.getItem(`propertyDB_${savedUser}`);
            if (userDB) {
                this.propertyDB = JSON.parse(userDB);
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('dashboard').style.display = 'block';
                this.loadDashboard();
            }
        }
    }

    setupSessionCheck() {
        setInterval(() => {
            this.checkSession();
        }, 60000);
    }

    checkSession() {
        const loginTime = localStorage.getItem('loginTime');
        if (loginTime) {
            const sessionDuration = 2 * 60 * 60 * 1000;
            const currentTime = new Date().getTime();
            const loginTimestamp = new Date(loginTime).getTime();
            
            if (currentTime - loginTimestamp > sessionDuration) {
                this.logout();
                this.showNotification('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى', 'warning');
            }
        }
    }

    // 🔥 **دالة محسنة: تسجيل الخروج**
    // ✅ الحل: الحفاظ على البيانات مع تسجيل الخروج الآمن
// 🔥 **تحسين دالة تسجيل الخروج**
logout() {
    // 1. حفظ بيانات المستخدم الحالي قبل تسجيل الخروج
    if (this.propertyDB && this.propertyDB.currentUser) {
        this.saveCurrentUserDB();
    }
    
    // 2. مسح بيانات الجلسة فقط (ليس بيانات المستخدم)
    localStorage.removeItem('propertyUser');
    localStorage.removeItem('loginTime');
    
    // 3. إعادة تعيين قاعدة البيانات للنظام
    this.propertyDB = this.getDefaultUserDB();
    
    // 4. تحديث الواجهة
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
    
    // 5. إعادة تعيين الحقول
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.reset();
    }
    
    // 6. إزالة القائمة الجانبية للمستخدم
    const userMenu = document.querySelector('.user-menu-sidebar');
    if (userMenu) {
        userMenu.remove();
    }
    
    this.showNotification('تم تسجيل الخروج بنجاح');
    
    // 7. تحديث حالة النظام
    this.currentPage = 'dashboard';
    this.setupNavigation(); // إعادة تعيين التنقل
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

    // 🔥 **تحسين دالة إعداد القائمة الجانبية للمستخدم**
// 🔥 **تحسين دالة إعداد القائمة الجانبية - استبدال الأيقونة بالصورة**
// 🔥 **تحسين دالة إعداد القائمة الجانبية - تحديث فوري**
setupUserMenu() {
    const username = this.propertyDB.currentUser;
    const userProfile = this.propertyDB.userProfiles?.[username] || {};
    const displayName = userProfile.name || username;
    const profileImage = userProfile.profileImage;

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
                </div>
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item" onclick="propertySystem.showProfileModal()">
                    <i class="fas fa-user"></i>
                    <span data-translate="profile">الملف الشخصي</span>
                </a>
                <a href="#" class="dropdown-item" onclick="propertySystem.showChangeImageModal()">
                    <i class="fas fa-camera"></i>
                    <span>${this.currentLanguage === 'ar' ? 'تغيير الصورة' : 'Change Photo'}</span>
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

    // إزالة القائمة القديمة إذا كانت موجودة
    const oldMenu = document.querySelector('.user-menu-sidebar');
    if (oldMenu) {
        oldMenu.remove();
    }

    // إضافة القائمة الجديدة
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
    // 🔥 **دالة جديدة: تحديث البروفايل فوراً**
updateProfileImmediately() {
    const username = this.propertyDB.currentUser;
    const userProfile = this.propertyDB.userProfiles?.[username] || {};
    const displayName = userProfile.name || username;
    const profileImage = userProfile.profileImage;

    // تحديث الصورة والاسم في القائمة الجانبية
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar) {
        const existingImage = userAvatar.querySelector('.profile-image');
        const existingIcon = userAvatar.querySelector('.fa-user-circle');
        const nameSpan = userAvatar.querySelector('.user-display-name');

        // تحديث الاسم
        if (nameSpan) {
            nameSpan.textContent = displayName;
        }

        // تحديث الصورة
        if (profileImage) {
            if (existingIcon) {
                existingIcon.style.display = 'none';
            }
            if (existingImage) {
                existingImage.src = profileImage;
            } else {
                const img = document.createElement('img');
                img.className = 'profile-image';
                img.src = profileImage;
                img.alt = 'Profile';
                userAvatar.insertBefore(img, userAvatar.firstChild);
            }
        } else {
            if (existingImage) {
                existingImage.remove();
            }
            if (existingIcon) {
                existingIcon.style.display = 'block';
            }
        }
    }

    // تحديث القائمة المنسدلة
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        const dropdownImage = dropdown.querySelector('.profile-image-large');
        const dropdownIcon = dropdown.querySelector('.profile-icon-large');
        const dropdownName = dropdown.querySelector('.user-name');
        const dropdownRole = dropdown.querySelector('.user-role');

        if (dropdownName) dropdownName.textContent = displayName;
        if (dropdownRole) dropdownRole.textContent = userProfile.role || 'مدير النظام';

        if (profileImage) {
            if (dropdownIcon) dropdownIcon.style.display = 'none';
            if (dropdownImage) {
                dropdownImage.src = profileImage;
            } else {
                const img = document.createElement('img');
                img.className = 'profile-image-large';
                img.src = profileImage;
                img.alt = 'Profile';
                const userInfo = dropdown.querySelector('.user-info');
                if (userInfo) {
                    userInfo.insertBefore(img, userInfo.firstChild);
                }
            }
        } else {
            if (dropdownImage) dropdownImage.remove();
            if (dropdownIcon) dropdownIcon.style.display = 'block';
        }
    }
}
    // 🔥 **تحسين دالة رفع الصورة الشخصية**
uploadProfileImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    // التحقق من نوع الصورة
    if (!file.type.startsWith('image/')) {
        this.showNotification(this.currentLanguage === 'ar' ? 'يرجى اختيار ملف صورة فقط' : 'Please select an image file only', 'error');
        return;
    }

    // التحقق من حجم الصورة (5MB كحد أقصى)
    if (file.size > 5 * 1024 * 1024) {
        this.showNotification(this.currentLanguage === 'ar' ? 'حجم الصورة كبير جداً (الحد الأقصى 5MB)' : 'Image size too large (max 5MB)', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const username = this.propertyDB.currentUser;
        
        // حفظ الصورة في قاعدة البيانات
        if (!this.propertyDB.userProfiles) {
            this.propertyDB.userProfiles = {};
        }
        
        this.propertyDB.userProfiles[username] = {
            ...this.propertyDB.userProfiles[username],
            profileImage: e.target.result
        };

        this.saveCurrentUserDB();
        this.showNotification(this.currentLanguage === 'ar' ? 'تم تحديث الصورة الشخصية بنجاح!' : 'Profile image updated successfully!');
        
        // 🔥 تحديث الواجهة فوراً
        this.updateProfileImmediately();
    };
    reader.readAsDataURL(file);
}

// 🔥 **دالة تحديث عرض الصورة**
updateProfileImageDisplay() {
    const username = this.propertyDB.currentUser;
    const userProfile = this.propertyDB.userProfiles?.[username] || {};
    const profileImage = userProfile.profileImage;

    // تحديث الصورة في القائمة الجانبية
    const avatarIcons = document.querySelectorAll('.user-avatar .profile-image, .user-avatar .fa-user-circle');
    avatarIcons.forEach(icon => {
        if (profileImage) {
            if (icon.classList.contains('fa-user-circle')) {
                icon.style.display = 'none';
            }
        } else {
            if (icon.classList.contains('fa-user-circle')) {
                icon.style.display = 'block';
            }
        }
    });

    // إضافة عناصر الصورة إذا لم تكن موجودة
    const avatarContainers = document.querySelectorAll('.user-avatar');
    avatarContainers.forEach(container => {
        let existingImage = container.querySelector('.profile-image');
        if (profileImage && !existingImage) {
            const img = document.createElement('img');
            img.className = 'profile-image';
            img.src = profileImage;
            img.alt = 'Profile Image';
            container.insertBefore(img, container.firstChild);
        } else if (existingImage) {
            if (profileImage) {
                existingImage.src = profileImage;
            } else {
                existingImage.remove();
            }
        }
    });
}

// 🔥 **تحسين دالة إعداد القائمة الجانبية**
setupUserMenu() {
    const username = this.propertyDB.currentUser;
    const userProfile = this.propertyDB.userProfiles?.[username] || {};
    const displayName = userProfile.name || username;
    const profileImage = userProfile.profileImage;

    const userMenuHTML = `
        <div class="user-menu-container">
            <div class="user-avatar" onclick="propertySystem.toggleUserMenu()">
                ${profileImage ? 
                    `<img src="${profileImage}" class="profile-image" alt="Profile">` : 
                    `<i class="fas fa-user-circle"></i>`
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
                </div>
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item" onclick="propertySystem.showProfileModal()">
                    <i class="fas fa-user"></i>
                    <span data-translate="profile">الملف الشخصي</span>
                </a>
                <a href="#" class="dropdown-item" onclick="propertySystem.showChangeImageModal()">
                    <i class="fas fa-camera"></i>
                    <span>${this.currentLanguage === 'ar' ? 'تغيير الصورة' : 'Change Photo'}</span>
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

    // إزالة القائمة القديمة إذا كانت موجودة
    const oldMenu = document.querySelector('.user-menu-sidebar');
    if (oldMenu) {
        oldMenu.remove();
    }

    // إضافة القائمة الجديدة
    const sidebar = document.querySelector('.sidebar .nav-links');
    if (sidebar) {
        const userMenuContainer = document.createElement('div');
        userMenuContainer.className = 'user-menu-sidebar';
        userMenuContainer.innerHTML = userMenuHTML;
        sidebar.parentNode.insertBefore(userMenuContainer, sidebar.nextSibling);
    }

    this.setupUserMenuEvents();
}

    showChangeImageModal() {
    const username = this.propertyDB.currentUser;
    const userProfile = this.propertyDB.userProfiles?.[username] || {};
    const profileImage = userProfile.profileImage;

    const changeImageHTML = `
        <div class="modal-overlay" id="changeImageModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-camera"></i> ${this.currentLanguage === 'ar' ? 'تغيير الصورة الشخصية' : 'Change Profile Photo'}</h3>
                    <button class="close-btn" onclick="propertySystem.closeModal('changeImageModal')">&times;</button>
                </div>
                <div class="image-upload-container">
                    <div class="current-image-preview">
                        <h4>${this.currentLanguage === 'ar' ? 'الصورة الحالية' : 'Current Photo'}</h4>
                        ${profileImage ? 
                            `<img src="${profileImage}" class="preview-image" alt="Current Profile">` : 
                            `<div class="no-image">
                                <i class="fas fa-user-circle"></i>
                                <span>${this.currentLanguage === 'ar' ? 'لا توجد صورة' : 'No Image'}</span>
                            </div>`
                        }
                    </div>
                    
                    <div class="upload-section">
                        <h4>${this.currentLanguage === 'ar' ? 'اختر صورة جديدة' : 'Choose New Photo'}</h4>
                        <div class="upload-area" id="uploadArea">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <p>${this.currentLanguage === 'ar' ? 'اسحب وأفلت الصورة هنا أو انقر للاختيار' : 'Drag & drop image here or click to select'}</p>
                            <input type="file" id="imageInput" accept="image/*" style="display: none;">
                            <button type="button" class="btn btn-secondary" onclick="document.getElementById('imageInput').click()">
                                <i class="fas fa-folder-open"></i>
                                ${this.currentLanguage === 'ar' ? 'اختيار صورة' : 'Choose Image'}
                            </button>
                        </div>
                        <div class="image-preview" id="imagePreview" style="display: none;">
                            <h5>${this.currentLanguage === 'ar' ? 'معاينة الصورة' : 'Image Preview'}</h5>
                            <img id="previewImg" src="" alt="Preview">
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-danger" onclick="propertySystem.removeProfileImage()" ${!profileImage ? 'disabled' : ''}>
                        <i class="fas fa-trash"></i>
                        ${this.currentLanguage === 'ar' ? 'حذف الصورة' : 'Remove Photo'}
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('changeImageModal')">
                        ${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    this.showModal(changeImageHTML);
    this.setupImageUpload();
}

// 🔥 **دالة إعداد رفع الصورة**
setupImageUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');

    if (uploadArea && imageInput) {
        // النقر على منطقة الرفع
        uploadArea.addEventListener('click', () => {
            imageInput.click();
        });

        // سحب وإفلات الصورة
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleImageSelection(files[0]);
            }
        });

        // تغيير الملف المختار
        imageInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleImageSelection(e.target.files[0]);
            }
        });
    }
}

// 🔥 **دالة معالجة اختيار الصورة**
handleImageSelection(file) {
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');

    if (!file.type.startsWith('image/')) {
        this.showNotification(this.currentLanguage === 'ar' ? 'يرجى اختيار ملف صورة فقط' : 'Please select an image file only', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        this.showNotification(this.currentLanguage === 'ar' ? 'حجم الصورة كبير جداً (الحد الأقصى 5MB)' : 'Image size too large (max 5MB)', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        imagePreview.style.display = 'block';
        
        // رفع الصورة تلقائياً بعد المعاينة
        this.uploadProfileImage({ target: { files: [file] } });
        setTimeout(() => {
            this.closeModal('changeImageModal');
        }, 1500);
    };
    reader.readAsDataURL(file);
}

// 🔥 **دالة حذف الصورة**
// 🔥 **تحسين دالة حذف الصورة**
removeProfileImage() {
    const username = this.propertyDB.currentUser;
    
    if (this.propertyDB.userProfiles && this.propertyDB.userProfiles[username]) {
        delete this.propertyDB.userProfiles[username].profileImage;
        this.saveCurrentUserDB();
        this.showNotification(this.currentLanguage === 'ar' ? 'تم حذف الصورة الشخصية بنجاح!' : 'Profile image removed successfully!');
        this.closeModal('changeImageModal');
        
        // 🔥 تحديث الواجهة فوراً
        this.updateProfileImmediately();
    }
}

// 🔥 **تحسين دالة عرض البروفيل**
// 🔥 **تحسين دالة عرض البروفيل مع إضافة زر تغيير الصورة**
showProfileModal() {
    const username = this.propertyDB.currentUser;
    const userProfile = this.propertyDB.userProfiles?.[username] || {};
    const profileImage = userProfile.profileImage;

    const profileHTML = `
        <div class="modal-overlay" id="profileModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user"></i> ${this.currentLanguage === 'ar' ? 'الملف الشخصي' : 'Profile'}</h3>
                    <button class="close-btn" onclick="propertySystem.closeModal('profileModal')">&times;</button>
                </div>
                <div class="profile-content">
                    <div class="profile-avatar">
                        ${profileImage ? 
                            `<img src="${profileImage}" class="profile-image-large" alt="Profile">` : 
                            `<i class="fas fa-user-circle profile-icon-large"></i>`
                        }
                        <button class="change-photo-btn" onclick="propertySystem.showChangeImageModal()">
                            <i class="fas fa-camera"></i>
                            ${this.currentLanguage === 'ar' ? 'تغيير الصورة' : 'Change Photo'}
                        </button>
                    </div>
                    <div class="profile-info">
                        <div class="info-item">
                            <label>${this.currentLanguage === 'ar' ? 'اسم المستخدم' : 'Username'}:</label>
                            <span>${username}</span>
                        </div>
                        <div class="info-item editable-item">
                            <label>${this.currentLanguage === 'ar' ? 'الاسم الكامل' : 'Full Name'}:</label>
                            <div class="name-container">
                                <span id="displayName">${userProfile.name || username}</span>
                                <button class="btn-edit-name" onclick="propertySystem.enableNameEdit()">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>
                            <div class="edit-name-container" style="display: none;">
                                <input type="text" id="editNameInput" value="${userProfile.name || username}" class="edit-name-input">
                                <div class="name-actions">
                                    <button class="btn-save-name" onclick="propertySystem.saveFullName()">
                                        <i class="fas fa-check"></i> ${this.currentLanguage === 'ar' ? 'حفظ' : 'Save'}
                                    </button>
                                    <button class="btn-cancel-name" onclick="propertySystem.cancelNameEdit()">
                                        <i class="fas fa-times"></i> ${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="info-item">
                            <label>${this.currentLanguage === 'ar' ? 'البريد الإلكتروني' : 'Email'}:</label>
                            <span>${userProfile.email || `${username}@irsa.com`}</span>
                        </div>
                        <div class="info-item">
                            <label>${this.currentLanguage === 'ar' ? 'رقم الهاتف' : 'Phone'}:</label>
                            <span>${userProfile.phone || '0512345678'}</span>
                        </div>
                        <div class="info-item">
                            <label>${this.currentLanguage === 'ar' ? 'الدور' : 'Role'}:</label>
                            <span>${userProfile.role || 'مدير النظام'}</span>
                        </div>
                        <div class="info-item">
                            <label>${this.currentLanguage === 'ar' ? 'تاريخ الانضمام' : 'Join Date'}:</label>
                            <span>${userProfile.joinDate || new Date().toISOString().split('T')[0]}</span>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('profileModal')">
                        ${this.currentLanguage === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    `;
    this.showModal(profileHTML);
}
enableNameEdit() {
    const displayElement = document.querySelector('.name-container');
    const editElement = document.querySelector('.edit-name-container');
    
    if (displayElement && editElement) {
        displayElement.style.display = 'none';
        editElement.style.display = 'block';
        
        const input = document.getElementById('editNameInput');
        if (input) {
            input.focus();
            input.select();
        }
    }
}

// 🔥 **دالة حفظ الاسم الجديد**
saveFullName() {
    const input = document.getElementById('editNameInput');
    if (!input) return;
    
    const newName = input.value.trim();
    if (!newName) {
        this.showNotification(this.currentLanguage === 'ar' ? 'يرجى إدخال اسم' : 'Please enter a name', 'error');
        return;
    }
    
    const username = this.propertyDB.currentUser;
    
    // تحديث الاسم في قاعدة البيانات
    if (!this.propertyDB.userProfiles) {
        this.propertyDB.userProfiles = {};
    }
    
    this.propertyDB.userProfiles[username] = {
        ...this.propertyDB.userProfiles[username],
        name: newName
    };
    
    // حفظ التغييرات
    this.saveCurrentUserDB();
    
    // تحديث الواجهة
    this.cancelNameEdit();
    document.getElementById('displayName').textContent = newName;
    
    // تحديث القائمة الجانبية فوراً
    this.updateProfileImmediately();
    
    this.showNotification(this.currentLanguage === 'ar' ? 'تم تحديث الاسم بنجاح!' : 'Name updated successfully!');
}

// 🔥 **دالة إلغاء التعديل**
cancelNameEdit() {
    const displayElement = document.querySelector('.name-container');
    const editElement = document.querySelector('.edit-name-container');
    
    if (displayElement && editElement) {
        displayElement.style.display = 'flex';
        editElement.style.display = 'none';
        
        // إعادة تعيين القيمة الأصلية
        const username = this.propertyDB.currentUser;
        const userProfile = this.propertyDB.userProfiles?.[username] || {};
        const input = document.getElementById('editNameInput');
        if (input) {
            input.value = userProfile.name || username;
        }
    }
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
    // 🔥 **دالة رفع الصورة الشخصية**
uploadProfileImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    // التحقق من نوع الصورة
    if (!file.type.startsWith('image/')) {
        this.showNotification(this.currentLanguage === 'ar' ? 'يرجى اختيار ملف صورة فقط' : 'Please select an image file only', 'error');
        return;
    }

    // التحقق من حجم الصورة (2MB كحد أقصى)
    if (file.size > 2 * 1024 * 1024) {
        this.showNotification(this.currentLanguage === 'ar' ? 'حجم الصورة كبير جداً (الحد الأقصى 2MB)' : 'Image size too large (max 2MB)', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const username = this.propertyDB.currentUser;
        
        // حفظ الصورة في قاعدة البيانات
        if (!this.propertyDB.userProfiles) {
            this.propertyDB.userProfiles = {};
        }
        
        this.propertyDB.userProfiles[username] = {
            ...this.propertyDB.userProfiles[username],
            profileImage: e.target.result
        };

        this.saveCurrentUserDB();
        this.showNotification(this.currentLanguage === 'ar' ? 'تم تحديث الصورة الشخصية بنجاح!' : 'Profile image updated successfully!');
        
        // تحديث الواجهة
        this.setupUserMenu();
    };
    reader.readAsDataURL(file);
}

// 🔥 **دالة عرض نافذة تغيير الصورة**
showChangeImageModal() {
    const username = this.propertyDB.currentUser;
    const userProfile = this.propertyDB.userProfiles?.[username] || {};
    const profileImage = userProfile.profileImage;

    const changeImageHTML = `
        <div class="modal-overlay" id="changeImageModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-camera"></i> ${this.currentLanguage === 'ar' ? 'تغيير الصورة الشخصية' : 'Change Profile Photo'}</h3>
                    <button class="close-btn" onclick="propertySystem.closeModal('changeImageModal')">&times;</button>
                </div>
                <div class="image-upload-container">
                    <div class="current-image-preview">
                        <h4>${this.currentLanguage === 'ar' ? 'الصورة الحالية' : 'Current Photo'}</h4>
                        ${profileImage ? 
                            `<img src="${profileImage}" class="preview-image" alt="Current Profile">` : 
                            `<div class="no-image">
                                <i class="fas fa-user-circle"></i>
                                <span>${this.currentLanguage === 'ar' ? 'لا توجد صورة' : 'No Image'}</span>
                            </div>`
                        }
                    </div>
                    
                    <div class="upload-section">
                        <h4>${this.currentLanguage === 'ar' ? 'اختر صورة جديدة' : 'Choose New Photo'}</h4>
                        <div class="upload-area" id="uploadArea">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <p>${this.currentLanguage === 'ar' ? 'انقر لاختيار صورة' : 'Click to select image'}</p>
                            <input type="file" id="imageInput" accept="image/*" style="display: none;">
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-primary" onclick="document.getElementById('imageInput').click()">
                        <i class="fas fa-upload"></i>
                        ${this.currentLanguage === 'ar' ? 'رفع صورة' : 'Upload Image'}
                    </button>
                    <button type="button" class="btn btn-danger" onclick="propertySystem.removeProfileImage()" ${!profileImage ? 'disabled' : ''}>
                        <i class="fas fa-trash"></i>
                        ${this.currentLanguage === 'ar' ? 'حذف الصورة' : 'Remove Photo'}
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('changeImageModal')">
                        ${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    this.showModal(changeImageHTML);
    this.setupImageUpload();
}

// 🔥 **دالة إعداد رفع الصورة**
setupImageUpload() {
    const imageInput = document.getElementById('imageInput');
    
    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.uploadProfileImage(e);
                setTimeout(() => {
                    this.closeModal('changeImageModal');
                }, 1000);
            }
        });
    }
}

// 🔥 **دالة حذف الصورة**
removeProfileImage() {
    const username = this.propertyDB.currentUser;
    
    if (this.propertyDB.userProfiles && this.propertyDB.userProfiles[username]) {
        delete this.propertyDB.userProfiles[username].profileImage;
        this.saveCurrentUserDB();
        this.showNotification(this.currentLanguage === 'ar' ? 'تم حذف الصورة الشخصية بنجاح!' : 'Profile image removed successfully!');
        this.closeModal('changeImageModal');
        this.setupUserMenu();
    }
}

    // 🔥 **دالة محسنة: إنشاء حساب جديد**
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
                            <label>${this.currentLanguage === 'ar' ? 'اسم المستخدم' : 'Username'}:</label>
                            <input type="text" name="username" required minlength="3" placeholder="${this.currentLanguage === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}">
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الاسم الكامل' : 'Full Name'}:</label>
                            <input type="text" name="fullName" required placeholder="${this.currentLanguage === 'ar' ? 'أدخل الاسم الكامل' : 'Enter full name'}">
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'البريد الإلكتروني' : 'Email'}:</label>
                            <input type="email" name="email" placeholder="${this.currentLanguage === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email'}">
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'رقم الهاتف' : 'Phone'}:</label>
                            <input type="tel" name="phone" placeholder="${this.currentLanguage === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'}">
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'كلمة المرور' : 'Password'}:</label>
                            <input type="password" name="password" required minlength="6" placeholder="${this.currentLanguage === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}">
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}:</label>
                            <input type="password" name="confirmPassword" required minlength="6" placeholder="${this.currentLanguage === 'ar' ? 'أكد كلمة المرور' : 'Confirm password'}">
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

    // 🔥 **دالة محسنة: معالجة إنشاء الحساب**
    // 🔥 **تحسين دالة إنشاء حساب جديد**
// 🔥 **تحسين دالة إنشاء حساب جديد**
createNewAccount(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const username = formData.get('username');
    const fullName = formData.get('fullName');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    // التحقق من البيانات
    if (this.mainDB.users[username]) {
        this.showNotification(this.currentLanguage === 'ar' ? 'اسم المستخدم موجود مسبقاً!' : 'Username already exists!', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        this.showNotification(this.currentLanguage === 'ar' ? 'كلمتا المرور غير متطابقتين!' : 'Passwords do not match!', 'error');
        return;
    }
    
    // إضافة المستخدم إلى قاعدة البيانات الرئيسية
    this.mainDB.users[username] = password;
    this.mainDB.userProfiles[username] = {
        id: Date.now(), // 🔥 معرف فريد
        name: fullName, // 🔥 حفظ الاسم الكامل
        email: email || '',
        phone: phone || '',
        role: 'مدير النظام',
        joinDate: new Date().toISOString().split('T')[0]
    };
    
    // حفظ قاعدة البيانات الرئيسية
    saveMainDB(this.mainDB);
    
    // 🔥 إنشاء قاعدة بيانات مستقلة تماماً للمستخدم الجديد
    const newUserDB = {
        currentUser: username,
        users: {
            [username]: password
        },
        userProfiles: {
            [username]: {
                id: Date.now(), // 🔥 معرف فريد
                name: fullName, // 🔥 حفظ الاسم الكامل
                email: email || '',
                phone: phone || '',
                role: 'مدير النظام',
                joinDate: new Date().toISOString().split('T')[0],
                profileImage: null // 🔥 صورة فارغة في البداية
            }
        },
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
        }
    };
    
    // حفظ قاعدة البيانات الجديدة للمستخدم
    localStorage.setItem(`propertyDB_${username}`, JSON.stringify(newUserDB));
    
    this.closeModal('createAccountModal');
    this.showNotification(
        this.currentLanguage === 'ar' 
            ? 'تم إنشاء الحساب الجديد بنجاح! يمكنك الآن تسجيل الدخول' 
            : 'New account created successfully! You can now login'
    );
    
    event.target.reset();
}
showAddMemberModal() {
    const addMemberHTML = `
        <div class="modal-overlay" id="addMemberModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user-plus"></i> ${this.currentLanguage === 'ar' ? 'إضافة عضو جديد' : 'Add New Member'}</h3>
                    <button class="close-btn" onclick="propertySystem.closeModal('addMemberModal')">&times;</button>
                </div>
                <form onsubmit="propertySystem.addNewMember(event)">
                    <div class="form-group">
                        <label>${this.currentLanguage === 'ar' ? 'اسم المستخدم' : 'Username'}:</label>
                        <input type="text" name="username" required minlength="3" 
                               placeholder="${this.currentLanguage === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}">
                    </div>
                    <div class="form-group">
                        <label>${this.currentLanguage === 'ar' ? 'الاسم الكامل' : 'Full Name'}:</label>
                        <input type="text" name="fullName" required 
                               placeholder="${this.currentLanguage === 'ar' ? 'أدخل الاسم الكامل' : 'Enter full name'}">
                    </div>
                    <div class="form-group">
                        <label>${this.currentLanguage === 'ar' ? 'الدور' : 'Role'}:</label>
                        <select name="role" class="role-select" required>
                            <option value="عضو">${this.currentLanguage === 'ar' ? 'عضو' : 'Member'}</option>
                            <option value="مشرف">${this.currentLanguage === 'ar' ? 'مشرف' : 'Supervisor'}</option>
                            <option value="مدير النظام">${this.currentLanguage === 'ar' ? 'مدير النظام' : 'System Admin'}</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>${this.currentLanguage === 'ar' ? 'كلمة المرور' : 'Password'}:</label>
                        <input type="password" name="password" required minlength="4" 
                               placeholder="${this.currentLanguage === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}">
                    </div>
                    <div class="form-group">
                        <label>${this.currentLanguage === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}:</label>
                        <input type="password" name="confirmPassword" required minlength="4" 
                               placeholder="${this.currentLanguage === 'ar' ? 'أكد كلمة المرور' : 'Confirm password'}">
                    </div>
                    <div class="form-group">
                        <label>${this.currentLanguage === 'ar' ? 'البريد الإلكتروني' : 'Email'}:</label>
                        <input type="email" name="email" 
                               placeholder="${this.currentLanguage === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email'}">
                    </div>
                    <div class="form-group">
                        <label>${this.currentLanguage === 'ar' ? 'رقم الهاتف' : 'Phone'}:</label>
                        <input type="tel" name="phone" 
                               placeholder="${this.currentLanguage === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'}">
                    </div>
                    
                    <!-- 🔥 عرض الصلاحيات حسب الدور -->
                    <div class="permissions-preview">
                        <h4>${this.currentLanguage === 'ar' ? 'الصلاحيات المتاحة:' : 'Available Permissions:'}</h4>
                        <div id="permissionsList" class="permissions-list">
                            ${this.getPermissionsPreview('عضو')}
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> ${this.currentLanguage === 'ar' ? 'إضافة العضو' : 'Add Member'}
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('addMemberModal')">
                            ${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    this.showModal(addMemberHTML);
     // 🔥 إضافة مستمع لتغيير الدور
    const roleSelect = document.querySelector('.role-select');
    if (roleSelect) {
        roleSelect.addEventListener('change', (e) => {
            this.updatePermissionsPreview(e.target.value);
        });
    }
}

// 🔥 دالة تحديث عرض الصلاحيات
updatePermissionsPreview(role) {
    const permissionsList = document.getElementById('permissionsList');
    if (permissionsList) {
        permissionsList.innerHTML = this.getPermissionsPreview(role);
    }
}

// 🔥 دالة الحصول على عرض الصلاحيات
getPermissionsPreview(role) {
    const permissions = this.getDefaultPermissions(role);
    const permissionsText = {
        viewDashboard: this.currentLanguage === 'ar' ? 'عرض لوحة التحكم' : 'View Dashboard',
        manageProperties: this.currentLanguage === 'ar' ? 'إدارة العقارات' : 'Manage Properties',
        manageCustomers: this.currentLanguage === 'ar' ? 'إدارة العملاء' : 'Manage Customers',
        manageContracts: this.currentLanguage === 'ar' ? 'إدارة العقود' : 'Manage Contracts',
        managePayments: this.currentLanguage === 'ar' ? 'إدارة المدفوعات' : 'Manage Payments',
        manageMaintenance: this.currentLanguage === 'ar' ? 'إدارة الصيانة' : 'Manage Maintenance',
        viewReports: this.currentLanguage === 'ar' ? 'عرض التقارير' : 'View Reports',
        manageSettings: this.currentLanguage === 'ar' ? 'إدارة الإعدادات' : 'Manage Settings',
        manageUsers: this.currentLanguage === 'ar' ? 'إدارة المستخدمين' : 'Manage Users',
        deleteData: this.currentLanguage === 'ar' ? 'حذف البيانات' : 'Delete Data',
        editAll: this.currentLanguage === 'ar' ? 'التعديل على جميع البيانات' : 'Edit All Data'
    };

    return Object.entries(permissions)
        .map(([key, value]) => `
            <div class="permission-item ${value ? 'allowed' : 'denied'}">
                <i class="fas fa-${value ? 'check' : 'times'}"></i>
                ${permissionsText[key]}
            </div>
        `).join('');
}

// 🔥 دالة إضافة عضو جديد
// 🔥 تحديث دالة إضافة عضو جديد مع الصلاحيات
addNewMember(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const username = formData.get('username');
    const fullName = formData.get('fullName');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const role = formData.get('role') || 'عضو'; // 🔥 اختيار الدور
    
    // التحقق من البيانات
    if (this.propertyDB.users[username]) {
        this.showNotification(this.currentLanguage === 'ar' ? 'اسم المستخدم موجود مسبقاً!' : 'Username already exists!', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        this.showNotification(this.currentLanguage === 'ar' ? 'كلمتا المرور غير متطابقتين!' : 'Passwords do not match!', 'error');
        return;
    }
    
    // إضافة العضو الجديد مع الصلاحيات
    this.propertyDB.users[username] = password;
    this.propertyDB.userProfiles[username] = {
        id: Date.now(),
        name: fullName,
        email: email || '',
        phone: phone || '',
        role: role,
        permissions: this.getDefaultPermissions(role), // 🔥 إضافة الصلاحيات
        joinDate: new Date().toISOString().split('T')[0],
        profileImage: null
    };
    
    this.saveCurrentUserDB();
    this.closeModal('addMemberModal');
    this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة العضو بنجاح!' : 'Member added successfully!');
    this.loadSettings();
}

    changePassword(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');
        
        if (this.propertyDB.users[this.propertyDB.currentUser] !== currentPassword) {
            this.showNotification(this.currentLanguage === 'ar' ? 'كلمة المرور الحالية غير صحيحة!' : 'Current password is incorrect!', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showNotification(this.currentLanguage === 'ar' ? 'كلمتا المرور الجديدتين غير متطابقتين!' : 'New passwords do not match!', 'error');
            return;
        }
        
        // تحديث كلمة المرور في قاعدة بيانات المستخدم
        this.propertyDB.users[this.propertyDB.currentUser] = newPassword;
        this.saveCurrentUserDB();
        
        // تحديث كلمة المرور في قاعدة البيانات الرئيسية
        this.mainDB.users[this.propertyDB.currentUser] = newPassword;
        saveMainDB(this.mainDB);
        
        this.closeModal('passwordModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم تغيير كلمة المرور بنجاح!' : 'Password changed successfully!');
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
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'properties':
                this.loadProperties();
                break;
            case 'customers':
                this.loadCustomers();
                break;
            case 'contracts':
                this.loadContracts();
                break;
            case 'payments':
                this.loadPayments();
                break;
            case 'maintenance':
                this.loadMaintenance();
                break;
            case 'reports':
                this.loadReports();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    loadDashboard() {
    const content = document.querySelector('.main-content');
    const stats = this.calculateStats();
    const financialStats = this.calculateFinancialStats();
    
    content.innerHTML = `
        <div class="dashboard-compact">
            <!-- رأس مدمج -->
            <div class="dashboard-header-compact">
                <h1 class="dashboard-title-compact">
                    <i class="fas fa-home"></i> 
                    <span data-translate="dashboard">${this.getTranslation('dashboard')}</span>
                </h1>
                <div class="dashboard-actions-compact">
                    <button class="btn btn-primary btn-sm" onclick="propertySystem.generateReport()">
                        <i class="fas fa-download"></i> 
                        ${this.currentLanguage === 'ar' ? 'تقرير' : 'Report'}
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="propertySystem.refreshDashboard()">
                        <i class="fas fa-sync-alt"></i> 
                        ${this.currentLanguage === 'ar' ? 'تحديث' : 'Refresh'}
                    </button>
                </div>
            </div>

            <!-- الإحصائيات الرئيسية المدمجة -->
            <!-- الإحصائيات الرئيسية المدمجة -->
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
        <div class="stat-value-compact">${financialStats.monthlyRevenue.toLocaleString()}</div>
        <div class="stat-title-compact">${this.currentLanguage === 'ar' ? 'إيراد الشهر' : 'Monthly Revenue'}</div>
    </div>
    <div class="stat-card-compact">
        <i class="fas fa-tools"></i>
        <div class="stat-value-compact">${this.getTotalMaintenanceCost().toLocaleString()}</div>
        <div class="stat-title-compact">${this.currentLanguage === 'ar' ? 'إجمالي الصيانة' : 'Total Maintenance'}</div>
    </div>
</div>

            <!-- التقارير السريعة المدمجة -->
            <div class="quick-stats-compact">
    <div class="quick-stat-compact">
        <div class="quick-value-compact">${stats.occupancyRate}%</div>
        <div class="quick-label-compact">${this.currentLanguage === 'ar' ? 'معدل الإشغال' : 'Occupancy Rate'}</div>
    </div>
    <div class="quick-stat-compact">
        <div class="quick-value-compact">${financialStats.latePayments}</div>
        <div class="quick-label-compact">${this.currentLanguage === 'ar' ? 'متأخرات' : 'Late Payments'}</div>
    </div>
    <div class="quick-stat-compact">
        <div class="quick-value-compact">${this.propertyDB.customers.length}</div>
        <div class="quick-label-compact">${this.currentLanguage === 'ar' ? 'العملاء' : 'Customers'}</div>
    </div>
    <div class="quick-stat-compact">
        <div class="quick-value-compact">${this.getMonthlyMaintenanceCost().toLocaleString()}</div>
        <div class="quick-label-compact">${this.currentLanguage === 'ar' ? 'تكاليف الصيانة هذا شهر' : 'This Month'}</div>
    </div>
</div>

            <!-- المخططات المدمجة -->
            <div class="charts-container-compact">
                <div class="chart-box-compact">
                    <h3><i class="fas fa-chart-line"></i> ${this.currentLanguage === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue'}</h3>
                    <canvas id="revenueChart" height="200"></canvas>
                </div>
                <div class="chart-box-compact">
                    <h3><i class="fas fa-chart-pie"></i> ${this.currentLanguage === 'ar' ? 'توزيع الوحدات' : 'Units Distribution'}</h3>
                    <canvas id="unitsChart" height="200"></canvas>
                </div>
            </div>

            <!-- النشاطات الحديثة المدمجة -->
            <div class="activities-compact">
                <h3><i class="fas fa-clock"></i> ${this.currentLanguage === 'ar' ? 'أحدث النشاطات' : 'Recent Activities'}</h3>
                <div class="activity-list-compact">
                    ${this.getCompactActivities()}
                </div>
            </div>
        </div>
    `;

    this.initializeCharts();
}
editMember(username) {
    const userProfile = this.propertyDB.userProfiles[username];
    
    const editMemberHTML = `
        <div class="modal-overlay" id="editMemberModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-edit"></i> ${this.currentLanguage === 'ar' ? 'تعديل بيانات العضو' : 'Edit Member'}</h3>
                    <button class="close-btn" onclick="propertySystem.closeModal('editMemberModal')">&times;</button>
                </div>
                <form onsubmit="propertySystem.updateMember(event, '${username}')">
                    <div class="form-group">
                        <label>${this.currentLanguage === 'ar' ? 'اسم المستخدم' : 'Username'}:</label>
                        <input type="text" value="${username}" disabled style="background: #f0f0f0;">
                        <small>${this.currentLanguage === 'ar' ? 'لا يمكن تغيير اسم المستخدم' : 'Username cannot be changed'}</small>
                    </div>
                    <div class="form-group">
                        <label>${this.currentLanguage === 'ar' ? 'الاسم الكامل' : 'Full Name'}:</label>
                        <input type="text" name="fullName" value="${userProfile.name || username}" required>
                    </div>
                    <div class="form-group">
                        <label>${this.currentLanguage === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}:</label>
                        <input type="password" name="newPassword" placeholder="${this.currentLanguage === 'ar' ? 'اتركه فارغاً للحفاظ على كلمة المرور الحالية' : 'Leave blank to keep current password'}">
                    </div>
                    <div class="form-group">
                        <label>${this.currentLanguage === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}:</label>
                        <input type="password" name="confirmPassword" placeholder="${this.currentLanguage === 'ar' ? 'أكد كلمة المرور الجديدة' : 'Confirm new password'}">
                    </div>
                    <div class="form-group">
                        <label>${this.currentLanguage === 'ar' ? 'البريد الإلكتروني' : 'Email'}:</label>
                        <input type="email" name="email" value="${userProfile.email || ''}">
                    </div>
                    <div class="form-group">
                        <label>${this.currentLanguage === 'ar' ? 'رقم الهاتف' : 'Phone'}:</label>
                        <input type="tel" name="phone" value="${userProfile.phone || ''}">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> ${this.currentLanguage === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('editMemberModal')">
                            ${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    this.showModal(editMemberHTML);
}

// 🔥 دالة تحديث بيانات العضو
updateMember(event, username) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const fullName = formData.get('fullName');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    const email = formData.get('email');
    const phone = formData.get('phone');
    
    // التحقق من كلمة المرور إذا تم إدخالها
    if (newPassword && newPassword !== confirmPassword) {
        this.showNotification(this.currentLanguage === 'ar' ? 'كلمتا المرور غير متطابقتين!' : 'Passwords do not match!', 'error');
        return;
    }
    
    // تحديث بيانات العضو
    this.propertyDB.userProfiles[username] = {
        ...this.propertyDB.userProfiles[username],
        name: fullName,
        email: email || '',
        phone: phone || ''
    };
    
    // تحديث كلمة المرور إذا تم إدخالها
    if (newPassword) {
        this.propertyDB.users[username] = newPassword;
    }
    
    this.saveCurrentUserDB();
    this.closeModal('editMemberModal');
    this.showNotification(this.currentLanguage === 'ar' ? 'تم تحديث بيانات العضو بنجاح!' : 'Member updated successfully!');
    this.loadSettings();
}

// 🔥 دالة حذف العضو
deleteMember(username) {
    const message = this.currentLanguage === 'ar' ? 
        `هل أنت متأكد من حذف العضو "${username}"؟` : 
        `Are you sure you want to delete member "${username}"?`;
    
    if (confirm(message)) {
        delete this.propertyDB.users[username];
        delete this.propertyDB.userProfiles[username];
        
        this.saveCurrentUserDB();
        this.showNotification(this.currentLanguage === 'ar' ? 'تم حذف العضو بنجاح!' : 'Member deleted successfully!');
        this.loadSettings();
    }
}

// 🔥 دالة عرض قائمة الأعضاء
renderMembersList() {
    const members = Object.entries(this.propertyDB.userProfiles || {});
    
    if (members.length === 0) {
        return `<div class="no-members">${this.currentLanguage === 'ar' ? 'لا توجد أعضاء' : 'No members found'}</div>`;
    }

    return `
        <div class="members-table">
            <div class="members-header">
                <div>${this.currentLanguage === 'ar' ? 'اسم العضو' : 'Member Name'}</div>
                <div>${this.currentLanguage === 'ar' ? 'اسم المستخدم' : 'Username'}</div>
                <div>${this.currentLanguage === 'ar' ? 'الدور' : 'Role'}</div>
                <div>${this.currentLanguage === 'ar' ? 'الإجراءات' : 'Actions'}</div>
            </div>
            <div class="members-body">
                ${members.map(([username, profile]) => `
                    <div class="member-row" data-username="${username}">
                        <div class="member-info">
                            <div class="member-name">${profile.name || username}</div>
                            <div class="member-username">${username}</div>
                            <div class="member-role">${profile.role || 'عضو'}</div>
                            <div class="member-actions">
                                <button class="btn btn-sm btn-edit" onclick="propertySystem.editMember('${username}')">
                                    <i class="fas fa-edit"></i>
                                    ${this.currentLanguage === 'ar' ? 'تعديل' : 'Edit'}
                                </button>
                                ${username !== this.propertyDB.currentUser ? `
                                    <button class="btn btn-sm btn-delete" onclick="propertySystem.deleteMember('${username}')">
                                        <i class="fas fa-trash"></i>
                                        ${this.currentLanguage === 'ar' ? 'حذف' : 'Delete'}
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}
// 🔥 دوال التحقق من الصلاحيات
hasPermission(permission) {
    const currentUser = this.propertyDB.currentUser;
    const userProfile = this.propertyDB.userProfiles?.[currentUser];
    
    if (!userProfile || !userProfile.permissions) {
        return false;
    }
    
    return userProfile.permissions[permission] === true;
}

// 🔥 دالة التحقق إذا كان مدير نظام
isAdmin() {
    const currentUser = this.propertyDB.currentUser;
    const userProfile = this.propertyDB.userProfiles?.[currentUser];
    return userProfile && userProfile.role === 'مدير النظام';
}

// 🔥 دالة إخفاء العناصر حسب الصلاحيات
applyPermissions() {
    const currentUser = this.propertyDB.currentUser;
    const userProfile = this.propertyDB.userProfiles?.[currentUser];
    
    if (!userProfile) return;
    
    // إخفاء الأقسام حسب الصلاحيات
    if (!this.hasPermission('manageProperties')) {
        this.hideSection('nav-properties');
    }
    
    if (!this.hasPermission('manageCustomers')) {
        this.hideSection('nav-customers');
    }
    
    if (!this.hasPermission('manageContracts')) {
        this.hideSection('nav-contracts');
    }
    
    if (!this.hasPermission('managePayments')) {
        this.hideSection('nav-payments');
    }
    
    if (!this.hasPermission('manageMaintenance')) {
        this.hideSection('nav-maintenance');
    }
    
    if (!this.hasPermission('viewReports')) {
        this.hideSection('nav-reports');
    }
    
    if (!this.hasPermission('manageSettings')) {
        this.hideSection('nav-settings');
    }
}

// 🔥 دالة إخفاء القسم
hideSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'none';
    }
}

// 🔥 دالة محسنة للنشاطات الأخيرة
getRealRecentActivitiesImproved() {
    const activities = [];
    
    // المدفوعات الحديثة
    const recentPayments = [...this.propertyDB.payments]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    recentPayments.forEach(payment => {
        const contract = this.propertyDB.contracts.find(c => c.id === payment.contractId);
        const property = this.propertyDB.properties.find(p => p.id === contract?.propertyId);
        const timeAgo = this.getTimeAgo(payment.date);
        
        activities.push({
            icon: 'fa-money-bill-wave',
            text: this.currentLanguage === 'ar' ? 
                `دفع إيجار ${property?.name || 'وحدة'} - ${payment.amount} ${this.propertyDB.settings.currency}` :
                `Rent payment for ${property?.name || 'unit'} - ${payment.amount} ${this.propertyDB.settings.currency}`,
            time: timeAgo
        });
    });
    
    // العقود الجديدة
    const recentContracts = [...this.propertyDB.contracts]
        .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
        .slice(0, 3);
    
    recentContracts.forEach(contract => {
        const property = this.propertyDB.properties.find(p => p.id === contract.propertyId);
        const customer = this.propertyDB.customers.find(c => c.id === contract.customerId);
        const timeAgo = this.getTimeAgo(contract.startDate);
        
        activities.push({
            icon: 'fa-file-contract',
            text: this.currentLanguage === 'ar' ?
                `عقد جديد - ${property?.name} - ${customer?.name}` :
                `New contract - ${property?.name} - ${customer?.name}`,
            time: timeAgo
        });
    });
    
    // إضافة نشاطات افتراضية إذا لم يكن هناك نشاطات كافية
    if (activities.length === 0) {
        activities.push(
            {
                icon: 'fa-user-plus',
                text: this.currentLanguage === 'ar' ? 'مرحباً بك في نظام إدارة العقارات' : 'Welcome to Property Management System',
                time: this.currentLanguage === 'ar' ? 'الآن' : 'Now'
            }
        );
    }
    
    return activities.map(activity => `
        <div class="activity-item-improved">
            <div class="activity-icon-improved">
                <i class="fas ${activity.icon}"></i>
            </div>
            <div class="activity-content-improved">
                <div class="activity-text-improved">${activity.text}</div>
                <div class="activity-time-improved">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

// 🔥 دالة تحديث الداشبورد
refreshDashboard() {
    this.showNotification(this.currentLanguage === 'ar' ? 'تم تحديث البيانات' : 'Data refreshed');
    this.loadDashboard();
}

    // 🔥 **دوال إدارة العقارات**
    loadProperties() {
        const content = document.querySelector('.main-content');
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-building"></i> <span data-translate="properties">${this.getTranslation('properties')}</span></h2>
                <div class="header-actions">
                    <div class="search-box">
                        <input type="text" id="propertySearch" placeholder="${this.currentLanguage === 'ar' ? 'ابحث في العقارات...' : 'Search properties...'}">
                        <i class="fas fa-search"></i>
                    </div>
                    <button class="btn btn-primary" onclick="propertySystem.showPropertyForm()">
                        <i class="fas fa-plus"></i> <span data-translate="addProperty">${this.getTranslation('addProperty')}</span>
                    </button>
                </div>
            </div>

            <div class="filters-container">
                <select id="statusFilter" onchange="propertySystem.filterProperties()">
                    <option value="">${this.currentLanguage === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
                    <option value="مشغولة">${this.currentLanguage === 'ar' ? 'مشغولة' : 'Occupied'}</option>
                    <option value="شاغرة">${this.currentLanguage === 'ar' ? 'شاغرة' : 'Vacant'}</option>
                </select>
                <select id="typeFilter" onchange="propertySystem.filterProperties()">
                    <option value="">${this.currentLanguage === 'ar' ? 'جميع الأنواع' : 'All Types'}</option>
                    <option value="شقة">${this.currentLanguage === 'ar' ? 'شقة' : 'Apartment'}</option>
                    <option value="فيلا">${this.currentLanguage === 'ar' ? 'فيلا' : 'Villa'}</option>
                    <option value="محل">${this.currentLanguage === 'ar' ? 'محل' : 'Shop'}</option>
                </select>
            </div>

            <div class="table-container">
                <table class="data-table" id="propertiesTable">
                </table>
            </div>
        `;

        this.loadPropertiesTable();
        this.setupPropertySearch();
    }

    setupPropertySearch() {
        const searchInput = document.getElementById('propertySearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProperties();
            });
        }
    }

    filterProperties() {
        const searchTerm = document.getElementById('propertySearch').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;

        let filteredProperties = this.propertyDB.properties.filter(property => {
            const matchesSearch = property.name.toLowerCase().includes(searchTerm) ||
                                property.tenant.toLowerCase().includes(searchTerm);
            
            const matchesStatus = !statusFilter || property.status === statusFilter;
            const matchesType = !typeFilter || property.type === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });

        this.renderPropertiesTable(filteredProperties);
    }

    renderPropertiesTable(properties) {
        const table = document.getElementById('propertiesTable');
        if (!table) return;

        table.innerHTML = `
            <thead>
                <tr>
                    <th>${this.currentLanguage === 'ar' ? 'رقم الوحدة' : 'Unit Number'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'النوع' : 'Type'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'المساحة' : 'Area'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'الإيجار' : 'Rent'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'المستأجر' : 'Tenant'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'انتهاء العقد' : 'Contract End'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
            </thead>
            <tbody>
                ${properties.map(property => `
                    <tr>
                        <td>${property.name}</td>
                        <td>${property.type}</td>
                        <td>${property.area}</td>
                        <td><span class="status-badge status-${property.status === 'مشغولة' ? 'occupied' : 'vacant'}">${this.currentLanguage === 'ar' ? property.status : (property.status === 'مشغولة' ? 'Occupied' : 'Vacant')}</span></td>
                        <td>${property.rent} ${this.propertyDB.settings.currency}</td>
                        <td>${property.tenant || '-'}</td>
                        <td>${property.contractEnd || '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-edit" onclick="propertySystem.editProperty(${property.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-delete" onclick="propertySystem.deleteProperty(${property.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
    }

    loadPropertiesTable() {
        this.renderPropertiesTable(this.propertyDB.properties);
    }

    showPropertyForm(property = null) {
        const isEdit = property !== null;
        
        const formHTML = `
            <div class="modal-overlay" id="propertyModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-${isEdit ? 'edit' : 'building'}"></i> ${isEdit ? (this.currentLanguage === 'ar' ? 'تعديل الوحدة العقارية' : 'Edit Property') : (this.currentLanguage === 'ar' ? 'إضافة وحدة عقارية جديدة' : 'Add New Property')}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('propertyModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.${isEdit ? 'updateProperty' : 'addProperty'}(event, ${isEdit ? property.id : ''})">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'رقم الوحدة' : 'Unit Number'}:</label>
                            <input type="text" name="name" value="${isEdit ? property.name : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'نوع الوحدة' : 'Unit Type'}:</label>
                            <select name="type" required>
                                <option value="شقة" ${isEdit && property.type === 'شقة' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'شقة' : 'Apartment'}</option>
                                <option value="فيلا" ${isEdit && property.type === 'فيلا' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'فيلا' : 'Villa'}</option>
                                <option value="محل" ${isEdit && property.type === 'محل' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'محل' : 'Shop'}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'المساحة' : 'Area'}:</label>
                            <input type="text" name="area" value="${isEdit ? property.area : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الإيجار الشهري' : 'Monthly Rent'}:</label>
                            <input type="number" name="rent" value="${isEdit ? property.rent : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}:</label>
                            <select name="status" required>
                                <option value="شاغرة" ${isEdit && property.status === 'شاغرة' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'شاغرة' : 'Vacant'}</option>
                                <option value="مشغولة" ${isEdit && property.status === 'مشغولة' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'مشغولة' : 'Occupied'}</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">${isEdit ? (this.currentLanguage === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (this.currentLanguage === 'ar' ? 'إضافة الوحدة' : 'Add Property')}</button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('propertyModal')">${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.showModal(formHTML);
    }

    addProperty(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const newProperty = {
            id: this.propertyDB.properties.length > 0 ? Math.max(...this.propertyDB.properties.map(p => p.id)) + 1 : 1,
            name: formData.get('name'),
            type: formData.get('type'),
            area: formData.get('area'),
            rent: parseInt(formData.get('rent')),
            status: formData.get('status'),
            tenant: '',
            contractEnd: ''
        };
        
        this.propertyDB.properties.push(newProperty);
        this.saveCurrentUserDB();
        this.closeModal('propertyModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة الوحدة العقارية بنجاح!' : 'Property added successfully!');
        this.loadProperties();
    }

    editProperty(id) {
        const property = this.propertyDB.properties.find(p => p.id === id);
        if (property) {
            this.showPropertyForm(property);
        }
    }

    deleteProperty(id) {
        const message = this.currentLanguage === 'ar' ? 'هل أنت متأكد من حذف هذه الوحدة؟' : 'Are you sure you want to delete this property?';
        if (confirm(message)) {
            this.propertyDB.properties = this.propertyDB.properties.filter(p => p.id !== id);
            this.saveCurrentUserDB();
            this.showNotification(this.currentLanguage === 'ar' ? 'تم حذف الوحدة بنجاح!' : 'Property deleted successfully!');
            this.loadProperties();
        }
    }

    updateProperty(event, id) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const propertyIndex = this.propertyDB.properties.findIndex(p => p.id === id);
        if (propertyIndex !== -1) {
            this.propertyDB.properties[propertyIndex] = {
                ...this.propertyDB.properties[propertyIndex],
                name: formData.get('name'),
                type: formData.get('type'),
                area: formData.get('area'),
                rent: parseInt(formData.get('rent')),
                status: formData.get('status')
            };
            
            this.saveCurrentUserDB();
            this.closeModal('propertyModal');
            this.showNotification(this.currentLanguage === 'ar' ? 'تم تعديل الوحدة العقارية بنجاح!' : 'Property updated successfully!');
            this.loadProperties();
        }
    }

    // 🔥 **دوال إدارة العملاء**
    loadCustomers() {
        const content = document.querySelector('.main-content');
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-users"></i> <span data-translate="customers">${this.getTranslation('customers')}</span></h2>
                <div class="header-actions">
                    <div class="search-box">
                        <input type="text" id="customerSearch" placeholder="${this.currentLanguage === 'ar' ? 'ابحث في العملاء...' : 'Search customers...'}">
                        <i class="fas fa-search"></i>
                    </div>
                    <button class="btn btn-primary" onclick="propertySystem.showCustomerForm()">
                        <i class="fas fa-plus"></i> <span data-translate="addCustomer">${this.getTranslation('addCustomer')}</span>
                    </button>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table" id="customersTable">
                </table>
            </div>
        `;

        this.loadCustomersTable();
        this.setupCustomerSearch();
    }

    setupCustomerSearch() {
        const searchInput = document.getElementById('customerSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterCustomers();
            });
        }
    }

    filterCustomers() {
        const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
        
        let filteredCustomers = this.propertyDB.customers.filter(customer => {
            return customer.name.toLowerCase().includes(searchTerm) ||
                   customer.phone.includes(searchTerm) ||
                   customer.email.toLowerCase().includes(searchTerm) ||
                   customer.idNumber.includes(searchTerm);
        });

        this.renderCustomersTable(filteredCustomers);
    }

    renderCustomersTable(customers) {
        const table = document.getElementById('customersTable');
        if (!table) return;

        table.innerHTML = `
            <thead>
                <tr>
                    <th>${this.currentLanguage === 'ar' ? 'الاسم' : 'Name'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'رقم الهاتف' : 'Phone'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'رقم الهوية' : 'ID Number'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
            </thead>
            <tbody>
                ${customers.map(customer => `
                    <tr>
                        <td>${customer.name}</td>
                        <td>${customer.phone}</td>
                        <td>${customer.email}</td>
                        <td>${customer.idNumber}</td>
                        <td>
                            <button class="btn btn-sm btn-edit" onclick="propertySystem.editCustomer(${customer.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-delete" onclick="propertySystem.deleteCustomer(${customer.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
    }

    loadCustomersTable() {
        this.renderCustomersTable(this.propertyDB.customers);
    }

    showCustomerForm(customer = null) {
        const isEdit = customer !== null;
        
        const formHTML = `
            <div class="modal-overlay" id="customerModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-${isEdit ? 'edit' : 'user-plus'}"></i> ${isEdit ? (this.currentLanguage === 'ar' ? 'تعديل العميل' : 'Edit Customer') : (this.currentLanguage === 'ar' ? 'إضافة عميل جديد' : 'Add New Customer')}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('customerModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.${isEdit ? 'updateCustomer' : 'addCustomer'}(event, ${isEdit ? customer.id : ''})">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الاسم الكامل' : 'Full Name'}:</label>
                            <input type="text" name="name" value="${isEdit ? customer.name : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'رقم الهاتف' : 'Phone'}:</label>
                            <input type="tel" name="phone" value="${isEdit ? customer.phone : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'البريد الإلكتروني' : 'Email'}:</label>
                            <input type="email" name="email" value="${isEdit ? customer.email : ''}">
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'رقم الهوية' : 'ID Number'}:</label>
                            <input type="text" name="idNumber" value="${isEdit ? customer.idNumber : ''}" required>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">${isEdit ? (this.currentLanguage === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (this.currentLanguage === 'ar' ? 'إضافة العميل' : 'Add Customer')}</button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('customerModal')">${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.showModal(formHTML);
    }

    addCustomer(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const newCustomer = {
            id: this.propertyDB.customers.length > 0 ? Math.max(...this.propertyDB.customers.map(c => c.id)) + 1 : 1,
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            idNumber: formData.get('idNumber')
        };
        
        this.propertyDB.customers.push(newCustomer);
        this.saveCurrentUserDB();
        this.closeModal('customerModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة العميل بنجاح!' : 'Customer added successfully!');
        this.loadCustomers();
    }

    editCustomer(id) {
        const customer = this.propertyDB.customers.find(c => c.id === id);
        if (customer) {
            this.showCustomerForm(customer);
        }
    }

    deleteCustomer(id) {
        const message = this.currentLanguage === 'ar' ? 'هل أنت متأكد من حذف هذا العميل؟' : 'Are you sure you want to delete this customer?';
        if (confirm(message)) {
            this.propertyDB.customers = this.propertyDB.customers.filter(c => c.id !== id);
            this.saveCurrentUserDB();
            this.showNotification(this.currentLanguage === 'ar' ? 'تم حذف العميل بنجاح!' : 'Customer deleted successfully!');
            this.loadCustomers();
        }
    }

    updateCustomer(event, id) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const customerIndex = this.propertyDB.customers.findIndex(c => c.id === id);
        if (customerIndex !== -1) {
            this.propertyDB.customers[customerIndex] = {
                ...this.propertyDB.customers[customerIndex],
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                idNumber: formData.get('idNumber')
            };
            
            this.saveCurrentUserDB();
            this.closeModal('customerModal');
            this.showNotification(this.currentLanguage === 'ar' ? 'تم تعديل العميل بنجاح!' : 'Customer updated successfully!');
            this.loadCustomers();
        }
    }

    // 🔥 **دوال إدارة الصيانة**
    loadMaintenance() {
        const content = document.querySelector('.main-content');
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-tools"></i> <span data-translate="maintenance">${this.getTranslation('maintenance')}</span></h2>
                <div class="header-actions">
                    <div class="search-box">
                        <input type="text" id="maintenanceSearch" placeholder="${this.currentLanguage === 'ar' ? 'ابحث في طلبات الصيانة...' : 'Search maintenance...'}">
                        <i class="fas fa-search"></i>
                    </div>
                    <button class="btn btn-primary" onclick="propertySystem.showMaintenanceForm()">
                        <i class="fas fa-plus"></i> <span data-translate="addMaintenance">${this.getTranslation('addMaintenance')}</span>
                    </button>
                </div>
            </div>

            <div class="filters-container">
                <select id="statusFilter" onchange="propertySystem.filterMaintenance()">
                    <option value="">${this.currentLanguage === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
                    <option value="معلقة">${this.currentLanguage === 'ar' ? 'معلقة' : 'Pending'}</option>
                    <option value="قيد التنفيذ">${this.currentLanguage === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</option>
                    <option value="مكتمل">${this.currentLanguage === 'ar' ? 'مكتمل' : 'Completed'}</option>
                </select>
                <select id="priorityFilter" onchange="propertySystem.filterMaintenance()">
                    <option value="">${this.currentLanguage === 'ar' ? 'جميع الأولويات' : 'All Priorities'}</option>
                    <option value="منخفضة">${this.currentLanguage === 'ar' ? 'منخفضة' : 'Low'}</option>
                    <option value="متوسطة">${this.currentLanguage === 'ar' ? 'متوسطة' : 'Medium'}</option>
                    <option value="عالية">${this.currentLanguage === 'ar' ? 'عالية' : 'High'}</option>
                </select>
            </div>

            <div class="table-container">
                <table class="data-table" id="maintenanceTable">
                </table>
            </div>
        `;

        this.loadMaintenanceTable();
        this.setupMaintenanceSearch();
    }

    setupMaintenanceSearch() {
        const searchInput = document.getElementById('maintenanceSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterMaintenance();
            });
        }
    }

    filterMaintenance() {
        const searchTerm = document.getElementById('maintenanceSearch').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;

        let filteredMaintenance = this.propertyDB.maintenance.filter(item => {
            const matchesSearch = item.issue.toLowerCase().includes(searchTerm);
            const matchesStatus = !statusFilter || item.status === statusFilter;
            const matchesPriority = !priorityFilter || item.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesPriority;
        });

        this.renderMaintenanceTable(filteredMaintenance);
    }

    renderMaintenanceTable(maintenance) {
        const table = document.getElementById('maintenanceTable');
        if (!table) return;

        table.innerHTML = `
            <thead>
                <tr>
                    <th>${this.currentLanguage === 'ar' ? 'رقم الطلب' : 'Request ID'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'الوحدة' : 'Property'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'المشكلة' : 'Issue'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'الأولوية' : 'Priority'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'التاريخ' : 'Date'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'التكلفة' : 'Cost'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
            </thead>
            <tbody>
                ${maintenance.map(item => {
                    const property = this.propertyDB.properties.find(p => p.id === item.propertyId);
                    return `
                    <tr>
                        <td>#${item.id}</td>
                        <td>${property ? property.name : 'غير معروف'}</td>
                        <td>${item.issue}</td>
                        <td><span class="priority-badge priority-${item.priority}">${this.currentLanguage === 'ar' ? item.priority : this.translatePriority(item.priority)}</span></td>
                        <td><span class="status-badge status-${item.status}">${this.currentLanguage === 'ar' ? item.status : this.translateStatus(item.status)}</span></td>
                        <td>${item.date}</td>
                        <td>${item.cost} ${this.propertyDB.settings.currency}</td>
                        <td>
                            <button class="btn btn-sm btn-edit" onclick="propertySystem.editMaintenance(${item.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-delete" onclick="propertySystem.deleteMaintenance(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `}).join('')}
            </tbody>
        `;
    }

    translatePriority(priority) {
        const translations = {
            'منخفضة': 'Low',
            'متوسطة': 'Medium',
            'عالية': 'High'
        };
        return translations[priority] || priority;
    }

    translateStatus(status) {
        const translations = {
            'معلقة': 'Pending',
            'قيد التنفيذ': 'In Progress',
            'مكتمل': 'Completed'
        };
        return translations[status] || status;
    }

    loadMaintenanceTable() {
        this.renderMaintenanceTable(this.propertyDB.maintenance);
    }

    showMaintenanceForm(maintenance = null) {
        const isEdit = maintenance !== null;
        
        const formHTML = `
            <div class="modal-overlay" id="maintenanceModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-${isEdit ? 'edit' : 'tools'}"></i> ${isEdit ? (this.currentLanguage === 'ar' ? 'تعديل طلب الصيانة' : 'Edit Maintenance') : (this.currentLanguage === 'ar' ? 'إضافة طلب صيانة جديد' : 'Add New Maintenance')}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('maintenanceModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.${isEdit ? 'updateMaintenance' : 'addMaintenance'}(event, ${isEdit ? maintenance.id : ''})">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الوحدة العقارية' : 'Property'}:</label>
                            <select name="propertyId" required>
                                <option value="">${this.currentLanguage === 'ar' ? 'اختر الوحدة' : 'Select Property'}</option>
                                ${this.propertyDB.properties.map(property => `
                                    <option value="${property.id}" ${isEdit && maintenance.propertyId === property.id ? 'selected' : ''}>${property.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'وصف المشكلة' : 'Issue Description'}:</label>
                            <textarea name="issue" required>${isEdit ? maintenance.issue : ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الأولوية' : 'Priority'}:</label>
                            <select name="priority" required>
                                <option value="منخفضة" ${isEdit && maintenance.priority === 'منخفضة' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'منخفضة' : 'Low'}</option>
                                <option value="متوسطة" ${isEdit && maintenance.priority === 'متوسطة' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'متوسطة' : 'Medium'}</option>
                                <option value="عالية" ${isEdit && maintenance.priority === 'عالية' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'عالية' : 'High'}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}:</label>
                            <select name="status" required>
                                <option value="معلقة" ${isEdit && maintenance.status === 'معلقة' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'معلقة' : 'Pending'}</option>
                                <option value="قيد التنفيذ" ${isEdit && maintenance.status === 'قيد التنفيذ' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</option>
                                <option value="مكتمل" ${isEdit && maintenance.status === 'مكتمل' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'مكتمل' : 'Completed'}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'التاريخ' : 'Date'}:</label>
                            <input type="date" name="date" value="${isEdit ? maintenance.date : new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'التكلفة' : 'Cost'}:</label>
                            <input type="number" name="cost" value="${isEdit ? maintenance.cost : ''}" step="0.01">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">${isEdit ? (this.currentLanguage === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (this.currentLanguage === 'ar' ? 'إضافة الطلب' : 'Add Request')}</button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('maintenanceModal')">${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.showModal(formHTML);
    }

    addMaintenance(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const newMaintenance = {
            id: this.propertyDB.maintenance.length > 0 ? Math.max(...this.propertyDB.maintenance.map(m => m.id)) + 1 : 1,
            propertyId: parseInt(formData.get('propertyId')),
            issue: formData.get('issue'),
            priority: formData.get('priority'),
            status: formData.get('status'),
            date: formData.get('date'),
            cost: parseFloat(formData.get('cost')) || 0
        };
        
        this.propertyDB.maintenance.push(newMaintenance);
        this.saveCurrentUserDB();
        this.closeModal('maintenanceModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة طلب الصيانة بنجاح!' : 'Maintenance request added successfully!');
        this.loadMaintenance();
    }

    editMaintenance(id) {
        const maintenance = this.propertyDB.maintenance.find(m => m.id === id);
        if (maintenance) {
            this.showMaintenanceForm(maintenance);
        }
    }

    deleteMaintenance(id) {
        const message = this.currentLanguage === 'ar' ? 'هل أنت متأكد من حذف طلب الصيانة هذا؟' : 'Are you sure you want to delete this maintenance request?';
        if (confirm(message)) {
            this.propertyDB.maintenance = this.propertyDB.maintenance.filter(m => m.id !== id);
            this.saveCurrentUserDB();
            this.showNotification(this.currentLanguage === 'ar' ? 'تم حذف طلب الصيانة بنجاح!' : 'Maintenance request deleted successfully!');
            this.loadMaintenance();
        }
    }

    updateMaintenance(event, id) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const maintenanceIndex = this.propertyDB.maintenance.findIndex(m => m.id === id);
        if (maintenanceIndex !== -1) {
            this.propertyDB.maintenance[maintenanceIndex] = {
                ...this.propertyDB.maintenance[maintenanceIndex],
                propertyId: parseInt(formData.get('propertyId')),
                issue: formData.get('issue'),
                priority: formData.get('priority'),
                status: formData.get('status'),
                date: formData.get('date'),
                cost: parseFloat(formData.get('cost')) || 0
            };
            
            this.saveCurrentUserDB();
            this.closeModal('maintenanceModal');
            this.showNotification(this.currentLanguage === 'ar' ? 'تم تعديل طلب الصيانة بنجاح!' : 'Maintenance request updated successfully!');
            this.loadMaintenance();
        }
    }

    // 🔥 **دوال إدارة العقود**
    loadContracts() {
        const content = document.querySelector('.main-content');
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-file-contract"></i> <span data-translate="contracts">${this.getTranslation('contracts')}</span></h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="propertySystem.showContractForm()">
                        <i class="fas fa-plus"></i> <span data-translate="addContract">${this.getTranslation('addContract')}</span>
                    </button>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table" id="contractsTable">
                </table>
            </div>
        `;

        this.loadContractsTable();
    }

    renderContractsTable(contracts) {
        const table = document.getElementById('contractsTable');
        if (!table) return;

        table.innerHTML = `
            <thead>
                <tr>
                    <th>${this.currentLanguage === 'ar' ? 'رقم العقد' : 'Contract ID'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'الوحدة' : 'Property'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'المستأجر' : 'Tenant'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'تاريخ البدء' : 'Start Date'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'الإيجار' : 'Rent'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
            </thead>
            <tbody>
                ${contracts.map(contract => {
                    const property = this.propertyDB.properties.find(p => p.id === contract.propertyId);
                    const customer = this.propertyDB.customers.find(c => c.id === contract.customerId);
                    return `
                    <tr>
                        <td>#${contract.id}</td>
                        <td>${property ? property.name : 'غير معروف'}</td>
                        <td>${customer ? customer.name : 'غير معروف'}</td>
                        <td>${contract.startDate}</td>
                        <td>${contract.endDate}</td>
                        <td>${contract.rent} ${this.propertyDB.settings.currency}</td>
                        <td><span class="status-badge status-${contract.status === 'نشط' ? 'active' : 'inactive'}">${this.currentLanguage === 'ar' ? contract.status : (contract.status === 'نشط' ? 'Active' : 'Inactive')}</span></td>
                        <td>
                            <button class="btn btn-sm btn-edit" onclick="propertySystem.editContract(${contract.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-delete" onclick="propertySystem.deleteContract(${contract.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `}).join('')}
            </tbody>
        `;
    }

    loadContractsTable() {
        this.renderContractsTable(this.propertyDB.contracts);
    }

    showContractForm(contract = null) {
        const isEdit = contract !== null;
        
        const formHTML = `
            <div class="modal-overlay" id="contractModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-${isEdit ? 'edit' : 'file-contract'}"></i> ${isEdit ? (this.currentLanguage === 'ar' ? 'تعديل العقد' : 'Edit Contract') : (this.currentLanguage === 'ar' ? 'إضافة عقد جديد' : 'Add New Contract')}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('contractModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.${isEdit ? 'updateContract' : 'addContract'}(event, ${isEdit ? contract.id : ''})">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الوحدة العقارية' : 'Property'}:</label>
                            <select name="propertyId" required>
                                <option value="">${this.currentLanguage === 'ar' ? 'اختر الوحدة' : 'Select Property'}</option>
                                ${this.propertyDB.properties.filter(p => p.status === 'شاغرة' || (isEdit && p.id === contract.propertyId)).map(property => `
                                    <option value="${property.id}" ${isEdit && contract.propertyId === property.id ? 'selected' : ''}>${property.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'المستأجر' : 'Tenant'}:</label>
                            <select name="customerId" required>
                                <option value="">${this.currentLanguage === 'ar' ? 'اختر المستأجر' : 'Select Tenant'}</option>
                                ${this.propertyDB.customers.map(customer => `
                                    <option value="${customer.id}" ${isEdit && contract.customerId === customer.id ? 'selected' : ''}>${customer.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'تاريخ البدء' : 'Start Date'}:</label>
                            <input type="date" name="startDate" value="${isEdit ? contract.startDate : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}:</label>
                            <input type="date" name="endDate" value="${isEdit ? contract.endDate : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الإيجار الشهري' : 'Monthly Rent'}:</label>
                            <input type="number" name="rent" value="${isEdit ? contract.rent : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}:</label>
                            <select name="status" required>
                                <option value="نشط" ${isEdit && contract.status === 'نشط' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'نشط' : 'Active'}</option>
                                <option value="منتهي" ${isEdit && contract.status === 'منتهي' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'منتهي' : 'Inactive'}</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">${isEdit ? (this.currentLanguage === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (this.currentLanguage === 'ar' ? 'إضافة العقد' : 'Add Contract')}</button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('contractModal')">${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.showModal(formHTML);
    }

    addContract(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const newContract = {
            id: this.propertyDB.contracts.length > 0 ? Math.max(...this.propertyDB.contracts.map(c => c.id)) + 1 : 1,
            propertyId: parseInt(formData.get('propertyId')),
            customerId: parseInt(formData.get('customerId')),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            rent: parseInt(formData.get('rent')),
            status: formData.get('status')
        };
        
        this.propertyDB.contracts.push(newContract);
        
        // تحديث حالة الوحدة العقارية
        const propertyIndex = this.propertyDB.properties.findIndex(p => p.id === newContract.propertyId);
        if (propertyIndex !== -1 && newContract.status === 'نشط') {
            const customer = this.propertyDB.customers.find(c => c.id === newContract.customerId);
            this.propertyDB.properties[propertyIndex].status = 'مشغولة';
            this.propertyDB.properties[propertyIndex].tenant = customer ? customer.name : '';
            this.propertyDB.properties[propertyIndex].contractEnd = newContract.endDate;
        }
        
        this.saveCurrentUserDB();
        this.closeModal('contractModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة العقد بنجاح!' : 'Contract added successfully!');
        this.loadContracts();
    }

    editContract(id) {
        const contract = this.propertyDB.contracts.find(c => c.id === id);
        if (contract) {
            this.showContractForm(contract);
        }
    }

    deleteContract(id) {
        const message = this.currentLanguage === 'ar' ? 'هل أنت متأكد من حذف هذا العقد؟' : 'Are you sure you want to delete this contract?';
        if (confirm(message)) {
            this.propertyDB.contracts = this.propertyDB.contracts.filter(c => c.id !== id);
            this.saveCurrentUserDB();
            this.showNotification(this.currentLanguage === 'ar' ? 'تم حذف العقد بنجاح!' : 'Contract deleted successfully!');
            this.loadContracts();
        }
    }

    updateContract(event, id) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const contractIndex = this.propertyDB.contracts.findIndex(c => c.id === id);
        if (contractIndex !== -1) {
            this.propertyDB.contracts[contractIndex] = {
                ...this.propertyDB.contracts[contractIndex],
                propertyId: parseInt(formData.get('propertyId')),
                customerId: parseInt(formData.get('customerId')),
                startDate: formData.get('startDate'),
                endDate: formData.get('endDate'),
                rent: parseInt(formData.get('rent')),
                status: formData.get('status')
            };
            
            this.saveCurrentUserDB();
            this.closeModal('contractModal');
            this.showNotification(this.currentLanguage === 'ar' ? 'تم تعديل العقد بنجاح!' : 'Contract updated successfully!');
            this.loadContracts();
        }
    }

    // 🔥 **دوال إدارة المدفوعات**
    loadPayments() {
        const content = document.querySelector('.main-content');
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-money-bill"></i> <span data-translate="payments">${this.getTranslation('payments')}</span></h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="propertySystem.showPaymentForm()">
                        <i class="fas fa-plus"></i> <span data-translate="addPayment">${this.getTranslation('addPayment')}</span>
                    </button>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table" id="paymentsTable">
                </table>
            </div>
        `;

        this.loadPaymentsTable();
    }

    renderPaymentsTable(payments) {
        const table = document.getElementById('paymentsTable');
        if (!table) return;

        table.innerHTML = `
            <thead>
                <tr>
                    <th>${this.currentLanguage === 'ar' ? 'رقم الدفعة' : 'Payment ID'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'العقد' : 'Contract'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'المبلغ' : 'Amount'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'التاريخ' : 'Date'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th>${this.currentLanguage === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
            </thead>
            <tbody>
                ${payments.map(payment => {
                    const contract = this.propertyDB.contracts.find(c => c.id === payment.contractId);
                    const property = this.propertyDB.properties.find(p => p.id === contract?.propertyId);
                    return `
                    <tr>
                        <td>#${payment.id}</td>
                        <td>${property ? property.name : 'غير معروف'}</td>
                        <td>${payment.amount} ${this.propertyDB.settings.currency}</td>
                        <td>${payment.date}</td>
                        <td><span class="status-badge status-${payment.status === 'مسدد' ? 'paid' : 'unpaid'}">${this.currentLanguage === 'ar' ? payment.status : (payment.status === 'مسدد' ? 'Paid' : 'Unpaid')}</span></td>
                        <td>
                            <button class="btn btn-sm btn-edit" onclick="propertySystem.editPayment(${payment.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-delete" onclick="propertySystem.deletePayment(${payment.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `}).join('')}
            </tbody>
        `;
    }

    loadPaymentsTable() {
        this.renderPaymentsTable(this.propertyDB.payments);
    }

    showPaymentForm(payment = null) {
        const isEdit = payment !== null;
        
        const formHTML = `
            <div class="modal-overlay" id="paymentModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-${isEdit ? 'edit' : 'money-bill'}"></i> ${isEdit ? (this.currentLanguage === 'ar' ? 'تعديل الدفعة' : 'Edit Payment') : (this.currentLanguage === 'ar' ? 'إضافة دفعة جديدة' : 'Add New Payment')}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('paymentModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.${isEdit ? 'updatePayment' : 'addPayment'}(event, ${isEdit ? payment.id : ''})">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'العقد' : 'Contract'}:</label>
                            <select name="contractId" required>
                                <option value="">${this.currentLanguage === 'ar' ? 'اختر العقد' : 'Select Contract'}</option>
                                ${this.propertyDB.contracts.filter(c => c.status === 'نشط').map(contract => {
                                    const property = this.propertyDB.properties.find(p => p.id === contract.propertyId);
                                    return `<option value="${contract.id}" ${isEdit && payment.contractId === contract.id ? 'selected' : ''}>${property ? property.name : 'غير معروف'} - ${contract.rent} ${this.propertyDB.settings.currency}</option>`;
                                }).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'المبلغ' : 'Amount'}:</label>
                            <input type="number" name="amount" value="${isEdit ? payment.amount : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'التاريخ' : 'Date'}:</label>
                            <input type="date" name="date" value="${isEdit ? payment.date : new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}:</label>
                            <select name="status" required>
                                <option value="مسدد" ${isEdit && payment.status === 'مسدد' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'مسدد' : 'Paid'}</option>
                                <option value="غير مسدد" ${isEdit && payment.status === 'غير مسدد' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'غير مسدد' : 'Unpaid'}</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">${isEdit ? (this.currentLanguage === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (this.currentLanguage === 'ar' ? 'إضافة الدفعة' : 'Add Payment')}</button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('paymentModal')">${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.showModal(formHTML);
    }

    addPayment(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const newPayment = {
            id: this.propertyDB.payments.length > 0 ? Math.max(...this.propertyDB.payments.map(p => p.id)) + 1 : 1,
            contractId: parseInt(formData.get('contractId')),
            amount: parseInt(formData.get('amount')),
            date: formData.get('date'),
            status: formData.get('status')
        };
        
        this.propertyDB.payments.push(newPayment);
        this.saveCurrentUserDB();
        this.closeModal('paymentModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة الدفعة بنجاح!' : 'Payment added successfully!');
        this.loadPayments();
    }

    editPayment(id) {
        const payment = this.propertyDB.payments.find(p => p.id === id);
        if (payment) {
            this.showPaymentForm(payment);
        }
    }

    deletePayment(id) {
        const message = this.currentLanguage === 'ar' ? 'هل أنت متأكد من حذف هذه الدفعة؟' : 'Are you sure you want to delete this payment?';
        if (confirm(message)) {
            this.propertyDB.payments = this.propertyDB.payments.filter(p => p.id !== id);
            this.saveCurrentUserDB();
            this.showNotification(this.currentLanguage === 'ar' ? 'تم حذف الدفعة بنجاح!' : 'Payment deleted successfully!');
            this.loadPayments();
        }
    }

    updatePayment(event, id) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const paymentIndex = this.propertyDB.payments.findIndex(p => p.id === id);
        if (paymentIndex !== -1) {
            this.propertyDB.payments[paymentIndex] = {
                ...this.propertyDB.payments[paymentIndex],
                contractId: parseInt(formData.get('contractId')),
                amount: parseInt(formData.get('amount')),
                date: formData.get('date'),
                status: formData.get('status')
            };
            
            this.saveCurrentUserDB();
            this.closeModal('paymentModal');
            this.showNotification(this.currentLanguage === 'ar' ? 'تم تعديل الدفعة بنجاح!' : 'Payment updated successfully!');
            this.loadPayments();
        }
    }

    // 🔥 **دوال إدارة التقارير**
   loadReports() {
    const content = document.querySelector('.main-content');
    const stats = this.calculateStats();
    const financialStats = this.calculateFinancialStats();
    const maintenanceStats = this.getMaintenanceStats();
    
    content.innerHTML = `
        <div class="reports-dashboard">
            <!-- رأس التقارير -->
            <div class="reports-header">
                <h1 class="reports-title">
                    <i class="fas fa-chart-bar"></i> 
                    <span data-translate="reports">${this.getTranslation('reports')}</span>
                </h1>
                <div class="reports-actions">
                    <button class="btn btn-primary btn-sm" onclick="propertySystem.generateReport()">
                        <i class="fas fa-download"></i> 
                        ${this.currentLanguage === 'ar' ? 'تحميل PDF' : 'Download PDF'}
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="propertySystem.printReport()">
                        <i class="fas fa-print"></i> 
                        ${this.currentLanguage === 'ar' ? 'طباعة' : 'Print'}
                    </button>
                </div>
            </div>

            <!-- التقارير الرئيسية -->
            <div class="reports-grid-main">
                <!-- تقرير العقارات -->
                <div class="report-card-main">
                    <h3><i class="fas fa-building"></i> ${this.currentLanguage === 'ar' ? 'تقرير العقارات' : 'Properties Report'}</h3>
                    <div class="report-stats-grid">
                        <div class="report-stat-item">
                            <div class="report-stat-value">${stats.totalProperties}</div>
                            <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'إجمالي الوحدات' : 'Total Units'}</div>
                        </div>
                        <div class="report-stat-item">
                            <div class="report-stat-value">${stats.occupied}</div>
                            <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'وحدات مشغولة' : 'Occupied Units'}</div>
                        </div>
                        <div class="report-stat-item">
                            <div class="report-stat-value">${stats.vacant}</div>
                            <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'وحدات شاغرة' : 'Vacant Units'}</div>
                        </div>
                        <div class="report-stat-item">
                            <div class="report-stat-value">${stats.occupancyRate}%</div>
                            <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'معدل الإشغال' : 'Occupancy Rate'}</div>
                        </div>
                    </div>
                </div>

                <!-- تقرير المالية -->
                <div class="report-card-main">
                    <h3><i class="fas fa-money-bill-wave"></i> ${this.currentLanguage === 'ar' ? 'تقرير المالية' : 'Financial Report'}</h3>
                    <div class="report-stats-grid">
                        <div class="report-stat-item">
                            <div class="report-stat-value">${financialStats.monthlyRevenue.toLocaleString()}</div>
                            <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'إيراد الشهر' : 'Monthly Revenue'}</div>
                        </div>
                        <div class="report-stat-item">
                            <div class="report-stat-value">${financialStats.yearlyRevenue.toLocaleString()}</div>
                            <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'إيراد السنة' : 'Yearly Revenue'}</div>
                        </div>
                        <div class="report-stat-item">
                            <div class="report-stat-value">${stats.totalRevenue.toLocaleString()}</div>
                            <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}</div>
                        </div>
                        <div class="report-stat-item">
                            <div class="report-stat-value">${financialStats.latePayments}</div>
                            <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'مدفوعات متأخرة' : 'Late Payments'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- التقارير التفصيلية -->
            <div class="reports-details-grid">
                <!-- تقرير الصيانة -->
                <div class="report-detail-card">
                    <h4><i class="fas fa-tools"></i> ${this.currentLanguage === 'ar' ? 'تقرير الصيانة' : 'Maintenance Report'}</h4>
                    <div class="report-stats-grid">
                        <div class="report-stat-item">
                            <div class="report-stat-value">${maintenanceStats.total}</div>
                            <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'إجمالي الطلبات' : 'Total Requests'}</div>
                        </div>
                        <div class="report-stat-item">
                            <div class="report-stat-value">${maintenanceStats.pending}</div>
                            <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'طلبات معلقة' : 'Pending'}</div>
                        </div>
                        <div class="report-stat-item">
                            <div class="report-stat-value">${maintenanceStats.inProgress}</div>
                            <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</div>
                        </div>
                        <div class="report-stat-item">
                            <div class="report-stat-value">${maintenanceStats.completed}</div>
                            <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'مكتملة' : 'Completed'}</div>
                        </div>
                    </div>
                    <div class="report-stat-item" style="grid-column: 1 / -1; margin-top: 10px;">
                        <div class="report-stat-value">${maintenanceStats.totalCost.toLocaleString()} ${this.propertyDB.settings.currency}</div>
                        <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'إجمالي التكاليف' : 'Total Cost'}</div>
                    </div>
                </div>

                <!-- تقرير العملاء -->
                <div class="report-detail-card">
                    <h4><i class="fas fa-users"></i> ${this.currentLanguage === 'ar' ? 'تقرير العملاء' : 'Customers Report'}</h4>
                    <div class="report-stats-grid">
                        <div class="report-stat-item">
                            <div class="report-stat-value">${this.propertyDB.customers.length}</div>
                            <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'إجمالي العملاء' : 'Total Customers'}</div>
                        </div>
                        <div class="report-stat-item">
                            <div class="report-stat-value">${this.propertyDB.contracts.filter(c => c.status === 'نشط').length}</div>
                            <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'عقود نشطة' : 'Active Contracts'}</div>
                        </div>
                        <div class="report-stat-item">
                            <div class="report-stat-value">${this.propertyDB.contracts.filter(c => c.status === 'منتهي').length}</div>
                            <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'عقود منتهية' : 'Expired Contracts'}</div>
                        </div>
                        <div class="report-stat-item">
                            <div class="report-stat-value">${this.propertyDB.payments.length}</div>
                            <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'إجمالي المدفوعات' : 'Total Payments'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- مخططات التقارير -->
            <div class="reports-charts">
                <div class="report-chart-card">
                    <h4><i class="fas fa-chart-pie"></i> ${this.currentLanguage === 'ar' ? 'توزيع أنواع العقارات' : 'Property Types'}</h4>
                    <canvas id="propertyTypesChart" height="200"></canvas>
                </div>
                <div class="report-chart-card">
                    <h4><i class="fas fa-chart-bar"></i> ${this.currentLanguage === 'ar' ? 'حالات الصيانة' : 'Maintenance Status'}</h4>
                    <canvas id="maintenanceStatusChart" height="200"></canvas>
                </div>
            </div>

            <!-- أزرار التحكم -->
            <div class="report-actions">
                <button class="btn-report btn-report-primary" onclick="propertySystem.generateDetailedReport()">
                    <i class="fas fa-file-alt"></i>
                    ${this.currentLanguage === 'ar' ? 'تقرير مفصل' : 'Detailed Report'}
                </button>
                <button class="btn-report btn-report-secondary" onclick="propertySystem.exportToExcel()">
                    <i class="fas fa-file-excel"></i>
                    ${this.currentLanguage === 'ar' ? 'تصدير Excel' : 'Export Excel'}
                </button>
            </div>
        </div>
    `;

    this.initializeReportCharts();
}

// 🔥 دالة إحصائيات الصيانة
getMaintenanceStats() {
    const maintenance = this.propertyDB.maintenance;
    return {
        total: maintenance.length,
        pending: maintenance.filter(m => m.status === 'معلقة').length,
        inProgress: maintenance.filter(m => m.status === 'قيد التنفيذ').length,
        completed: maintenance.filter(m => m.status === 'مكتمل').length,
        totalCost: maintenance.reduce((sum, item) => sum + (Number(item.cost) || 0), 0)
    };
}

// 🔥 دالة مخططات التقارير
initializeReportCharts() {
    setTimeout(() => {
        // مخطط أنواع العقارات
        const propertyTypesCtx = document.getElementById('propertyTypesChart');
        if (propertyTypesCtx) {
            const types = {};
            this.propertyDB.properties.forEach(property => {
                types[property.type] = (types[property.type] || 0) + 1;
            });
            
            new Chart(propertyTypesCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(types),
                    datasets: [{
                        data: Object.values(types),
                        backgroundColor: ['#FFD700', '#FFC107', '#28a745', '#dc3545', '#17a2b8'],
                        borderWidth: 2,
                        borderColor: '#1A1A1A'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#FFFFFF' }
                        }
                    }
                }
            });
        }

        // مخطط حالات الصيانة
        const maintenanceCtx = document.getElementById('maintenanceStatusChart');
        if (maintenanceCtx) {
            const maintenanceStats = this.getMaintenanceStats();
            new Chart(maintenanceCtx, {
                type: 'bar',
                data: {
                    labels: this.currentLanguage === 'ar' ? ['معلقة', 'قيد التنفيذ', 'مكتملة'] : ['Pending', 'In Progress', 'Completed'],
                    datasets: [{
                        label: this.currentLanguage === 'ar' ? 'عدد الطلبات' : 'Requests',
                        data: [maintenanceStats.pending, maintenanceStats.inProgress, maintenanceStats.completed],
                        backgroundColor: ['#dc3545', '#FFC107', '#28a745'],
                        borderWidth: 2,
                        borderColor: '#1A1A1A'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: '#FFFFFF' },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        },
                        x: {
                            ticks: { color: '#FFFFFF' },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        }
                    }
                }
            });
        }
    }, 100);
}

// 🔥 دوال إضافية
generateDetailedReport() {
    this.showNotification(this.currentLanguage === 'ar' ? 'جاري إنشاء التقرير المفصل...' : 'Generating detailed report...');
    // يمكن إضافة منطق التقرير المفصل هنا
}

exportToExcel() {
    this.showNotification(this.currentLanguage === 'ar' ? 'جاري التصدير إلى Excel...' : 'Exporting to Excel...');
    // يمكن إضافة منطق التصدير إلى Excel هنا
}

printReport() {
    window.print();
}
    // 🔥 **دوال الإعدادات**
    loadSettings() {
    const content = document.querySelector('.main-content');
    content.innerHTML = `
        <div class="page-header">
            <h2><i class="fas fa-cogs"></i> <span data-translate="settings">${this.getTranslation('settings')}</span></h2>
            <p class="page-description">${this.currentLanguage === 'ar' ? 'إدارة إعدادات النظام والأعضاء والبيانات' : 'Manage system settings, members, and data'}</p>
        </div>

        <div class="settings-grid">
            <!-- إعدادات الشركة -->
            <div class="settings-card company-settings">
                <div class="settings-card-header">
                    <div class="settings-icon">
                        <i class="fas fa-building"></i>
                    </div>
                    <h3>${this.currentLanguage === 'ar' ? 'إعدادات الشركة' : 'Company Settings'}</h3>
                </div>
                <div class="settings-card-body">
                    <form onsubmit="propertySystem.saveCompanySettings(event)">
                        <div class="form-group">
                            <label class="form-label">
                                <i class="fas fa-signature"></i>
                                ${this.currentLanguage === 'ar' ? 'اسم الشركة' : 'Company Name'}
                            </label>
                            <input type="text" name="companyName" value="${this.propertyDB.settings.companyName}" class="modern-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">
                                <i class="fas fa-coins"></i>
                                ${this.currentLanguage === 'ar' ? 'العملة' : 'Currency'}
                            </label>
                            <select name="currency" class="modern-select" required>
                                <option value="ريال" ${this.propertyDB.settings.currency === 'ريال' ? 'selected' : ''}>🇸🇦 ريال سعودي</option>
                                <option value="دولار" ${this.propertyDB.settings.currency === 'دولار' ? 'selected' : ''}>🇺🇸 دولار أمريكي</option>
                                <option value="يورو" ${this.propertyDB.settings.currency === 'يورو' ? 'selected' : ''}>🇪🇺 يورو</option>
                                <option value="دينار" ${this.propertyDB.settings.currency === 'دينار' ? 'selected' : ''}>🇰🇼 دينار كويتي</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">
                                <i class="fas fa-percentage"></i>
                                ${this.currentLanguage === 'ar' ? 'معدل الضريبة' : 'Tax Rate'} (%)
                            </label>
                            <input type="number" name="taxRate" value="${this.propertyDB.settings.taxRate}" class="modern-input" step="0.1" min="0" max="100">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn-save">
                                <i class="fas fa-check-circle"></i>
                                ${this.currentLanguage === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- إعدادات اللغة -->
            <div class="settings-card language-settings">
                <div class="settings-card-header">
                    <div class="settings-icon">
                        <i class="fas fa-globe"></i>
                    </div>
                    <h3>${this.currentLanguage === 'ar' ? 'إعدادات اللغة' : 'Language Settings'}</h3>
                </div>
                <div class="settings-card-body">
                    <div class="language-options-grid">
                        <div class="language-option ${this.currentLanguage === 'ar' ? 'active' : ''}" onclick="propertySystem.applyLanguage('ar')">
                            <div class="language-flag">🇸🇦</div>
                            <div class="language-info">
                                <div class="language-name">العربية</div>
                                <div class="language-desc">Arabic</div>
                            </div>
                            <div class="language-check">
                                <i class="fas fa-check"></i>
                            </div>
                        </div>
                        <div class="language-option ${this.currentLanguage === 'en' ? 'active' : ''}" onclick="propertySystem.applyLanguage('en')">
                            <div class="language-flag">🇺🇸</div>
                            <div class="language-info">
                                <div class="language-name">English</div>
                                <div class="language-desc">English</div>
                            </div>
                            <div class="language-check">
                                <i class="fas fa-check"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- إدارة الأعضاء -->
            <div class="settings-card members-settings">
                <div class="settings-card-header">
                    <div class="settings-icon">
                        <i class="fas fa-users-cog"></i>
                    </div>
                    <h3>${this.currentLanguage === 'ar' ? 'إدارة الأعضاء' : 'Members Management'}</h3>
                </div>
                <div class="settings-card-body">
                    <div class="members-stats">
                        <div class="stat-item">
                            <div class="stat-number">${Object.keys(this.propertyDB.userProfiles || {}).length}</div>
                            <div class="stat-label">${this.currentLanguage === 'ar' ? 'إجمالي الأعضاء' : 'Total Members'}</div>
                        </div>
                    </div>
                    
                    <button class="btn-add-member" onclick="propertySystem.showAddMemberModal()">
                        <i class="fas fa-user-plus"></i>
                        ${this.currentLanguage === 'ar' ? 'إضافة عضو جديد' : 'Add New Member'}
                    </button>

                    <div class="members-list-section">
                        <h4>${this.currentLanguage === 'ar' ? 'قائمة الأعضاء' : 'Members List'}</h4>
                        <div class="members-list-container">
                            ${this.renderMembersList()}
                        </div>
                    </div>
                </div>
            </div>

            <!-- إدارة البيانات -->
            <div class="settings-card data-settings">
                <div class="settings-card-header">
                    <div class="settings-icon">
                        <i class="fas fa-database"></i>
                    </div>
                    <h3>${this.currentLanguage === 'ar' ? 'إدارة البيانات' : 'Data Management'}</h3>
                </div>
                <div class="settings-card-body">
                    <div class="data-actions-grid">
                        <div class="data-action-card backup-card" onclick="propertySystem.backupData()">
                            <div class="data-action-icon">
                                <i class="fas fa-download"></i>
                            </div>
                            <div class="data-action-info">
                                <h4>${this.currentLanguage === 'ar' ? 'نسخ احتياطي' : 'Backup'}</h4>
                                <p>${this.currentLanguage === 'ar' ? 'حفظ نسخة من جميع البيانات' : 'Save a copy of all data'}</p>
                            </div>
                            <div class="data-action-arrow">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>

                        <div class="data-action-card restore-card" onclick="propertySystem.showRestoreModal()">
                            <div class="data-action-icon">
                                <i class="fas fa-upload"></i>
                            </div>
                            <div class="data-action-info">
                                <h4>${this.currentLanguage === 'ar' ? 'استعادة' : 'Restore'}</h4>
                                <p>${this.currentLanguage === 'ar' ? 'استعادة البيانات من نسخة احتياطية' : 'Restore data from backup'}</p>
                            </div>
                            <div class="data-action-arrow">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>

                        <div class="data-action-card reset-card" onclick="propertySystem.resetData()">
                            <div class="data-action-icon">
                                <i class="fas fa-trash-alt"></i>
                            </div>
                            <div class="data-action-info">
                                <h4>${this.currentLanguage === 'ar' ? 'مسح البيانات' : 'Reset Data'}</h4>
                                <p>${this.currentLanguage === 'ar' ? 'حذف جميع البيانات وإعادة التعيين' : 'Delete all data and reset'}</p>
                            </div>
                            <div class="data-action-arrow">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

    saveCompanySettings(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        this.propertyDB.settings = {
            companyName: formData.get('companyName'),
            currency: formData.get('currency'),
            taxRate: parseFloat(formData.get('taxRate')) || 0
        };
        
        this.saveCurrentUserDB();
        this.showNotification(this.currentLanguage === 'ar' ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!');
    }

    backupData() {
        const dataStr = JSON.stringify(this.propertyDB, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `property_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إنشاء نسخة احتياطية بنجاح!' : 'Backup created successfully!');
    }

    showRestoreModal() {
        const restoreHTML = `
            <div class="modal-overlay" id="restoreModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-upload"></i> ${this.currentLanguage === 'ar' ? 'استعادة البيانات' : 'Restore Data'}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('restoreModal')">&times;</button>
                    </div>
                    <div class="form-group">
                        <label>${this.currentLanguage === 'ar' ? 'اختر ملف النسخة الاحتياطية' : 'Select Backup File'}:</label>
                        <input type="file" id="backupFile" accept=".json">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-primary" onclick="propertySystem.restoreData()">
                            <i class="fas fa-upload"></i> ${this.currentLanguage === 'ar' ? 'استعادة البيانات' : 'Restore Data'}
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('restoreModal')">
                            ${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(restoreHTML);
    }

    restoreData() {
        const fileInput = document.getElementById('backupFile');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showNotification(this.currentLanguage === 'ar' ? 'يرجى اختيار ملف النسخة الاحتياطية' : 'Please select a backup file', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backupData = JSON.parse(e.target.result);
                
                // التحقق من صحة البيانات
                if (backupData && typeof backupData === 'object') {
                    this.propertyDB = backupData;
                    this.saveCurrentUserDB();
                    this.closeModal('restoreModal');
                    this.showNotification(this.currentLanguage === 'ar' ? 'تم استعادة البيانات بنجاح!' : 'Data restored successfully!');
                    this.reloadCurrentPage();
                } else {
                    throw new Error('Invalid backup file');
                }
            } catch (error) {
                this.showNotification(this.currentLanguage === 'ar' ? 'ملف النسخة الاحتياطية غير صالح' : 'Invalid backup file', 'error');
            }
        };
        reader.readAsText(file);
    }

    resetData() {
        const message = this.currentLanguage === 'ar' ? 
            'هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء!' : 
            'Are you sure you want to reset all data? This action cannot be undone!';
        
        if (confirm(message)) {
            // إنشاء قاعدة بيانات جديدة للمستخدم
            this.propertyDB = this.createNewUserDB(this.propertyDB.currentUser);
            this.saveCurrentUserDB();
            this.showNotification(this.currentLanguage === 'ar' ? 'تم مسح جميع البيانات بنجاح!' : 'All data has been reset successfully!');
            this.reloadCurrentPage();
        }
    }

    // 🔥 **الدوال المساعدة**
    calculateStats() {
        const totalProperties = this.propertyDB.properties.length;
        const occupied = this.propertyDB.properties.filter(p => p.status === 'مشغولة').length;
        const vacant = this.propertyDB.properties.filter(p => p.status === 'شاغرة').length;
        const occupancyRate = totalProperties > 0 ? ((occupied / totalProperties) * 100).toFixed(1) : 0;
        const totalRevenue = this.propertyDB.payments.reduce((sum, payment) => sum + payment.amount, 0);

        return {
            totalProperties,
            occupied,
            vacant,
            occupancyRate,
            totalRevenue
        };
    }

    calculateFinancialStats() {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        
        const monthlyRevenue = this.propertyDB.payments
            .filter(payment => {
                const paymentDate = new Date(payment.date);
                return paymentDate.getFullYear() === currentYear && 
                       paymentDate.getMonth() === currentMonth;
            })
            .reduce((sum, payment) => sum + payment.amount, 0);
        
        const yearlyRevenue = this.propertyDB.payments
            .filter(payment => {
                const paymentDate = new Date(payment.date);
                return paymentDate.getFullYear() === currentYear;
            })
            .reduce((sum, payment) => sum + payment.amount, 0);
        
        const expectedRevenue = this.propertyDB.contracts
            .filter(contract => contract.status === 'نشط')
            .reduce((sum, contract) => sum + contract.rent, 0);
        
        const latePayments = this.propertyDB.contracts
            .filter(contract => contract.status === 'نشط')
            .filter(contract => {
                const hasPaymentThisMonth = this.propertyDB.payments.some(payment => {
                    const paymentDate = new Date(payment.date);
                    return payment.contractId === contract.id &&
                           paymentDate.getFullYear() === currentYear &&
                           paymentDate.getMonth() === currentMonth;
                });
                return !hasPaymentThisMonth;
            }).length;
        
        return {
            monthlyRevenue,
            yearlyRevenue,
            expectedRevenue,
            latePayments
        };
    }

    getMonthlyMaintenanceCost() {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const monthlyMaintenanceCost = this.propertyDB.maintenance
            .filter(item => {
                const itemDate = new Date(item.date);
                return itemDate.getMonth() === currentMonth && 
                       itemDate.getFullYear() === currentYear;
            })
            .reduce((sum, item) => {
                const cost = Number(item.cost) || 0;
                return sum + cost;
            }, 0);
        
        return monthlyMaintenanceCost;
    }

    getTotalMaintenanceCost() {
        const totalMaintenanceCost = this.propertyDB.maintenance
            .reduce((sum, item) => {
                const cost = Number(item.cost) || 0;
                return sum + cost;
            }, 0);
        
        return totalMaintenanceCost;
    }

    getMonthlyRevenueData() {
        const months = this.currentLanguage === 'ar' ? 
            ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'] :
            ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const currentYear = new Date().getFullYear();
        
        const monthlyRevenue = new Array(12).fill(0);
        
        this.propertyDB.payments.forEach(payment => {
            const paymentDate = new Date(payment.date);
            const paymentYear = paymentDate.getFullYear();
            const paymentMonth = paymentDate.getMonth();
            
            if (paymentYear === currentYear) {
                monthlyRevenue[paymentMonth] += payment.amount;
            }
        });
        
        if (monthlyRevenue.every(amount => amount === 0)) {
            const totalMonthlyRent = this.propertyDB.contracts
                .filter(contract => contract.status === 'نشط')
                .reduce((sum, contract) => sum + contract.rent, 0);
            
            monthlyRevenue.forEach((_, index) => {
                monthlyRevenue[index] = totalMonthlyRent * (0.8 + Math.random() * 0.4);
            });
        }
        
        return {
            labels: months.slice(0, new Date().getMonth() + 1),
            data: monthlyRevenue.slice(0, new Date().getMonth() + 1)
        };
    }

    getUnitsDistribution() {
        const types = {};
        
        this.propertyDB.properties.forEach(property => {
            if (property.type && property.type.trim() !== '') {
                types[property.type] = (types[property.type] || 0) + 1;
            }
        });
        
        return {
            labels: Object.keys(types),
            data: Object.values(types).map(value => Number(value))
        };
    }

    getCompactActivities() {
    const activities = [];
    
    // المدفوعات الحديثة
    const recentPayments = [...this.propertyDB.payments]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 4);
    
    recentPayments.forEach(payment => {
        const contract = this.propertyDB.contracts.find(c => c.id === payment.contractId);
        const property = this.propertyDB.properties.find(p => p.id === contract?.propertyId);
        const timeAgo = this.getTimeAgo(payment.date);
        
        activities.push({
            icon: 'fa-money-bill-wave',
            text: this.currentLanguage === 'ar' ? 
                `دفع ${property?.name || 'وحدة'} - ${payment.amount} ${this.propertyDB.settings.currency}` :
                `Payment ${property?.name || 'unit'} - ${payment.amount} ${this.propertyDB.settings.currency}`,
            time: timeAgo
        });
    });
    
    // العقود الجديدة
    const recentContracts = [...this.propertyDB.contracts]
        .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
        .slice(0, 2);
    
    recentContracts.forEach(contract => {
        const property = this.propertyDB.properties.find(p => p.id === contract.propertyId);
        const timeAgo = this.getTimeAgo(contract.startDate);
        
        activities.push({
            icon: 'fa-file-contract',
            text: this.currentLanguage === 'ar' ?
                `عقد جديد - ${property?.name}` :
                `New contract - ${property?.name}`,
            time: timeAgo
        });
    });
    
    if (activities.length === 0) {
        activities.push({
            icon: 'fa-info-circle',
            text: this.currentLanguage === 'ar' ? 'لا توجد نشاطات حديثة' : 'No recent activities',
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

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (this.currentLanguage === 'ar') {
            if (diffDays === 0) {
                return 'اليوم';
            } else if (diffDays === 1) {
                return 'أمس';
            } else if (diffDays < 7) {
                return `منذ ${diffDays} أيام`;
            } else if (diffDays < 30) {
                const weeks = Math.floor(diffDays / 7);
                return `منذ ${weeks} أسابيع`;
            } else {
                const months = Math.floor(diffDays / 30);
                return `منذ ${months} أشهر`;
            }
        } else {
            if (diffDays === 0) {
                return 'Today';
            } else if (diffDays === 1) {
                return 'Yesterday';
            } else if (diffDays < 7) {
                return `${diffDays} days ago`;
            } else if (diffDays < 30) {
                const weeks = Math.floor(diffDays / 7);
                return `${weeks} weeks ago`;
            } else {
                const months = Math.floor(diffDays / 30);
                return `${months} months ago`;
            }
        }
    }

    initializeCharts() {
        setTimeout(() => {
            const revenueCtx = document.getElementById('revenueChart');
            if (revenueCtx) {
                const monthlyData = this.getMonthlyRevenueData();
                
                new Chart(revenueCtx.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: monthlyData.labels,
                        datasets: [{
                            label: this.currentLanguage === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue',
                            data: monthlyData.data,
                            borderColor: '#facc15',
                            backgroundColor: 'rgba(250, 204, 21, 0.2)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                labels: { color: '#FFFFFF' }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `${propertySystem.currentLanguage === 'ar' ? 'الإيراد' : 'Revenue'}: ${context.parsed.y.toLocaleString()} ${propertySystem.propertyDB.settings.currency}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                ticks: { 
                                    color: '#FFFFFF',
                                    callback: function(value) {
                                        return Math.floor(value) + ' ' + propertySystem.propertyDB.settings.currency;
                                    }
                                },
                                grid: { color: 'rgba(255, 255, 255, 0.1)' }
                            },
                            x: {
                                ticks: { color: '#FFFFFF' },
                                grid: { color: 'rgba(255, 255, 255, 0.1)' }
                            }
                        }
                    }
                });
            }

            const unitsCtx = document.getElementById('unitsChart');
            if (unitsCtx) {
                const unitsDistribution = this.getUnitsDistribution();
                
                new Chart(unitsCtx.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: unitsDistribution.labels,
                        datasets: [{
                            label: this.currentLanguage === 'ar' ? 'عدد الوحدات' : 'Number of Units',
                            data: unitsDistribution.data,
                            backgroundColor: ['#00C851', '#ff4444', '#ffbb33', '#17a2b8', '#9D50E7'],
                            borderWidth: 2,
                            borderColor: '#2D2B55'
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `${propertySystem.currentLanguage === 'ar' ? 'العدد' : 'Count'}: ${context.parsed.y} ${propertySystem.currentLanguage === 'ar' ? 'وحدة' : 'units'}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    color: '#FFFFFF',
                                    stepSize: 1,
                                    callback: function(value) {
                                        if (Number.isInteger(value)) {
                                            return value;
                                        }
                                    }
                                },
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                }
                            },
                            x: {
                                ticks: {
                                    color: '#FFFFFF',
                                    font: {
                                        size: 12
                                    }
                                },
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                }
                            }
                        }
                    }
                });
            }
        }, 100);
    }

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

    getTranslation(key) {
        const translations = {
            'ar': {
                'username': 'اسم المستخدم',
                'password': 'كلمة المرور',
                'login': 'تسجيل الدخول',
                'switchLanguage': 'تبديل اللغة',
                'dashboard': 'الرئيسية',
                'properties': 'إدارة العقارات',
                'customers': 'إدارة العملاء',
                'contracts': 'العقود',
                'payments': 'المدفوعات',
                'maintenance': 'الصيانة',
                'reports': 'التقارير',
                'settings': 'الإعدادات',
                'logout': 'تسجيل الخروج',
                'totalUnits': 'إجمالي الوحدات',
                'occupiedUnits': 'وحدات مشغولة',
                'monthlyRevenue': 'إيرادات الشهر',
                'monthlyMaintenance': 'تكلفة الصيانة هذا الشهر',
                'yearlyRevenue': 'إيرادات السنة',
                'totalMaintenance': 'إجمالي تكاليف الصيانة',
                'latePayments': 'مدفوعات متأخرة',
                'totalCustomers': 'إجمالي العملاء',
                'recentActivities': 'النشاطات الأخيرة',
                'revenueChart': 'الإيرادات الشهرية',
                'unitsChart': 'توزيع الوحدات',
                'addProperty': 'إضافة وحدة جديدة',
                'addCustomer': 'إضافة عميل جديد',
                'addContract': 'عقد جديد',
                'addPayment': 'تسديد دفعة',
                'addMaintenance': 'طلب صيانة جديد',
                'totalRevenue': 'إجمالي الإيرادات',
                'activeContracts': 'العقود النشطة',
                'occupancyRate': 'معدل الإشغال',
                'profile': 'الملف الشخصي',
                'changePassword': 'تغيير كلمة المرور',
                'currentPassword': 'كلمة المرور الحالية',
                'newPassword': 'كلمة المرور الجديدة',
                'confirmPassword': 'تأكيد كلمة المرور',
                'savePassword': 'حفظ كلمة المرور',
                'createAccount': 'إنشاء حساب جديد'
            },
            'en': {
                'username': 'Username',
                'password': 'Password',
                'login': 'Login',
                'switchLanguage': 'Switch Language',
                'dashboard': 'Dashboard',
                'properties': 'Properties Management',
                'customers': 'Customers Management',
                'contracts': 'Contracts',
                'payments': 'Payments',
                'maintenance': 'Maintenance',
                'reports': 'Reports',
                'settings': 'Settings',
                'logout': 'Logout',
                'totalUnits': 'Total Units',
                'occupiedUnits': 'Occupied Units',
                'monthlyRevenue': 'Monthly Revenue',
                'monthlyMaintenance': 'Maintenance Cost',
                'yearlyRevenue': 'Yearly Revenue',
                'totalMaintenance': 'Total Maintenance',
                'latePayments': 'Late Payments',
                'totalCustomers': 'Total Customers',
                'recentActivities': 'Recent Activities',
                'revenueChart': 'Revenue Chart',
                'unitsChart': 'Units Distribution',
                'addProperty': 'Add New Property',
                'addCustomer': 'Add New Customer',
                'addContract': 'New Contract',
                'addPayment': 'Add Payment',
                'addMaintenance': 'New Maintenance',
                'totalRevenue': 'Total Revenue',
                'activeContracts': 'Active Contracts',
                'occupancyRate': 'Occupancy Rate',
                'profile': 'Profile',
                'changePassword': 'Change Password',
                'currentPassword': 'Current Password',
                'newPassword': 'New Password',
                'confirmPassword': 'Confirm Password',
                'savePassword': 'Save Password',
                'createAccount': 'Create New Account'
            }
        };

        return translations[this.currentLanguage][key] || key;
    }

    applyLanguage(lang) {
    this.currentLanguage = lang;
    localStorage.setItem('propertyLanguage', lang);
    
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    
    // ✅ فقط تحديث النصوص بدون أي تأثير على التخطيط
    this.updateAllTexts();
    
    this.showNotification(lang === 'ar' ? 'تم التبديل إلى العربية' : 'Switched to English');
}

    updateAllTexts() {
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            element.textContent = this.getTranslation(key);
        });

        document.querySelectorAll('.lang-btn').forEach(btn => {
            const lang = btn.getAttribute('data-lang');
            btn.textContent = lang === 'ar' ? 'العربية' : 'English';
            if (lang === this.currentLanguage) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    reloadCurrentPage() {
        if (this.currentPage) {
            this.navigateTo(this.currentPage);
        }
    }
}

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.propertySystem = new AdvancedPropertySystem();
});
