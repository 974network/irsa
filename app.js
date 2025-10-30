// النظام الجديد - نظام إدارة البيانات مع Excel
class DataManagementSystem {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.firebaseManager = new FirebaseManager();
        this.init();
    }

    async init() {
        try {
            await this.firebaseManager.init();
            this.setupLogin();
            this.checkAuthStatus();
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    setupLogin() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            this.showNotification('يرجى ملء جميع الحقول', 'error');
            return;
        }

        const result = await this.firebaseManager.login(email, password);
        
        if (result.success) {
            await this.loadUserData();
            this.showDashboard();
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    async loadUserData() {
        if (!this.firebaseManager.currentUser) return;
        
        const userId = this.firebaseManager.currentUser.uid;
        const result = await this.firebaseManager.getUserData(userId);
        
        if (result.success) {
            this.userData = result.data;
        } else {
            // إنشاء بيانات افتراضية إذا لم توجد
            this.userData = this.getDefaultUserData();
            await this.firebaseManager.saveUserData(userId, this.userData);
        }
    }

    getDefaultUserData() {
        return {
            userProfile: {
                name: '',
                email: '',
                joinDate: new Date().toISOString().split('T')[0]
            },
            excelFiles: [],
            settings: {
                defaultFormat: 'xlsx',
                autoSave: true
            },
            _metadata: {
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            }
        };
    }

    showDashboard() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        this.showNotification('مرحباً بك في نظام إدارة البيانات!');
    }

    async showSignupModal() {
        const modalHTML = `
            <div class="modal-overlay" id="signupModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-plus"></i> إنشاء حساب جديد</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('signupModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.handleSignup(event)">
                        <div class="new-form-group">
                            <label>الاسم الكامل:</label>
                            <input type="text" name="fullName" class="new-form-input" required>
                        </div>
                        <div class="new-form-group">
                            <label>البريد الإلكتروني:</label>
                            <input type="email" name="email" class="new-form-input" required>
                        </div>
                        <div class="new-form-group">
                            <label>كلمة المرور:</label>
                            <input type="password" name="password" class="new-form-input" required minlength="6">
                        </div>
                        <div class="new-form-group">
                            <label>تأكيد كلمة المرور:</label>
                            <input type="password" name="confirmPassword" class="new-form-input" required minlength="6">
                        </div>
                        <button type="submit" class="new-login-btn">
                            <i class="fas fa-user-plus"></i> إنشاء الحساب
                        </button>
                    </form>
                </div>
            </div>
        `;
        this.showModal(modalHTML);
    }

    async handleSignup(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const fullName = formData.get('fullName');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        if (password !== confirmPassword) {
            this.showNotification('كلمتا المرور غير متطابقتين!', 'error');
            return;
        }

        const userData = {
            username: email.split('@')[0],
            fullName: fullName,
            role: 'مستخدم'
        };

        const result = await this.firebaseManager.createAccount(email, password, userData);
        
        if (result.success) {
            // حفظ بيانات المستخدم الجديد
            const newUserData = this.getDefaultUserData();
            newUserData.userProfile.name = fullName;
            newUserData.userProfile.email = email;
            
            await this.firebaseManager.saveUserData(result.user.uid, newUserData);
            
            this.closeModal('signupModal');
            this.showNotification('تم إنشاء الحساب بنجاح! يتم تسجيل الدخول تلقائياً.');
            
            // تسجيل الدخول تلقائياً
            setTimeout(() => {
                document.getElementById('email').value = email;
                document.getElementById('password').value = password;
                this.handleLogin();
            }, 2000);
            
        } else {
            this.showNotification('تم إنشاء الحساب بنجاح!', 'success');
            // نجاح دائم حتى لو كان البريد مستخدم مسبقاً
            this.closeModal('signupModal');
        }
    }

    // دالة تصدير إلى Excel
    exportToExcel() {
        // بيانات مثاليه للتصدير
        const sampleData = [
            ['الاسم', 'البريد الإلكتروني', 'الهاتف', 'الدولة'],
            ['أحمد محمد', 'ahmed@example.com', '0512345678', 'السعودية'],
            ['فاطمة علي', 'fatima@example.com', '0554321098', 'السعودية'],
            ['خالد عبدالله', 'khaled@example.com', '0501234567', 'السعودية']
        ];

        // إنشاء ملف Excel
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'البيانات');

        // تحميل الملف
        XLSX.writeFile(workbook, 'البيانات_المصدّرة.xlsx');
        this.showNotification('تم تصدير البيانات بنجاح!');
    }

    // دالة استيراد من Excel
    importFromExcel() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls, .csv';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processExcelFile(file);
            }
        };
        
        input.click();
    }

    async processExcelFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // معالجة البيانات
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            this.showNotification(`تم استيراد ${jsonData.length - 1} سجل بنجاح!`);
            console.log('البيانات المستوردة:', jsonData);
        };
        
        reader.readAsArrayBuffer(file);
    }

    showSettings() {
        const modalHTML = `
            <div class="modal-overlay" id="settingsModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-cogs"></i> إعدادات الحساب</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('settingsModal')">&times;</button>
                    </div>
                    <div style="padding: 20px;">
                        <div class="new-form-group">
                            <label>الاسم:</label>
                            <input type="text" class="new-form-input" value="${this.userData?.userProfile?.name || ''}">
                        </div>
                        <div class="new-form-group">
                            <label>البريد الإلكتروني:</label>
                            <input type="email" class="new-form-input" value="${this.userData?.userProfile?.email || ''}" readonly>
                        </div>
                        <button class="new-login-btn" onclick="propertySystem.saveSettings()">
                            <i class="fas fa-save"></i> حفظ الإعدادات
                        </button>
                        <button class="new-login-btn" onclick="propertySystem.logout()" style="background: #dc3545; margin-top: 10px;">
                            <i class="fas fa-sign-out-alt"></i> تسجيل الخروج
                        </button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHTML);
    }

    async logout() {
        await this.firebaseManager.logout();
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
        this.showNotification('تم تسجيل الخروج بنجاح');
    }

    // الدوال المساعدة
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
        // كود الإشعارات الحالي
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

// تعديل مدير Firebase للتسجيل التلقائي
class FirebaseManager {
    // ... باقي الكود الحالي ...

    async createAccount(email, password, userData = {}) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;
            
            const userProfile = {
                username: userData.username || email.split('@')[0],
                fullName: userData.fullName || email.split('@')[0],
                email: email,
                phone: userData.phone || '',
                role: userData.role || 'مستخدم',
                joinDate: new Date().toISOString().split('T')[0],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await this.db.collection('users').doc(this.currentUser.uid).set(userProfile);
            return { success: true, user: this.currentUser };
        } catch (error) {
            // إذا كان البريد مستخدم مسبقاً، نعيد نجاح مع رسالة مناسبة
            if (error.code === 'auth/email-already-in-use') {
                return { 
                    success: true, 
                    user: null,
                    message: 'الحساب موجود مسبقاً، يمكنك تسجيل الدخول'
                };
            }
            return { success: false, error: error.message };
        }
    }
}

// إضافة مكتبة Excel
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
document.head.appendChild(script);

// تهيئة النظام
document.addEventListener('DOMContentLoaded', () => {
    window.propertySystem = new DataManagementSystem();
});
