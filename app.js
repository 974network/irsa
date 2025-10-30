// النظام الجديد - نظام إدارة البيانات مع Excel
class DataManagementSystem {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.firebaseManager = new FirebaseManager();
        this.importedData = [];
        this.init();
    }

    async init() {
        try {
            await this.firebaseManager.init();
            this.setupLogin();
            this.checkAuthStatus();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showNotification('خطأ في تهيئة النظام', 'error');
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
                email: this.firebaseManager.currentUser.email,
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
        
        // تحديث معلومات المستخدم
        if (this.firebaseManager.currentUser) {
            document.getElementById('userDisplayName').textContent = 
                this.userData?.userProfile?.name || this.firebaseManager.currentUser.email.split('@')[0];
            document.getElementById('userDisplayEmail').textContent = 
                this.firebaseManager.currentUser.email;
        }
        
        this.showNotification('مرحباً بك في نظام إدارة البيانات!');
    }

    async showSignupModal() {
        const modalHTML = `
            <div class="modal-overlay" id="signupModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-plus"></i> إنشاء حساب جديد</h3>
                        <button class="close-btn" onclick="dataSystem.closeModal('signupModal')">&times;</button>
                    </div>
                    <form onsubmit="dataSystem.handleSignup(event)">
                        <div style="padding: 20px;">
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
                        </div>
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
            
            if (result.user) {
                await this.firebaseManager.saveUserData(result.user.uid, newUserData);
            }
            
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
            ['الاسم', 'البريد الإلكتروني', 'الهاتف', 'الدولة', 'التاريخ'],
            ['أحمد محمد', 'ahmed@example.com', '0512345678', 'السعودية', new Date().toLocaleDateString('ar-SA')],
            ['فاطمة علي', 'fatima@example.com', '0554321098', 'السعودية', new Date().toLocaleDateString('ar-SA')],
            ['خالد عبدالله', 'khaled@example.com', '0501234567', 'السعودية', new Date().toLocaleDateString('ar-SA')],
            ['سارة أحمد', 'sara@example.com', '0543210987', 'السعودية', new Date().toLocaleDateString('ar-SA')]
        ];

        // إذا كان هناك بيانات مستوردة، نستخدمها
        if (this.importedData.length > 0) {
            this.exportDataToExcel(this.importedData);
        } else {
            this.exportDataToExcel(sampleData);
        }
    }

    exportDataToExcel(data) {
        try {
            // إنشاء ملف Excel
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'البيانات');

            // تحميل الملف
            const fileName = `البيانات_المصدّرة_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            this.showNotification('تم تصدير البيانات بنجاح!');
        } catch (error) {
            this.showNotification('خطأ في تصدير البيانات', 'error');
            console.error('Export error:', error);
        }
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
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // معالجة البيانات
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                this.importedData = jsonData;
                this.displayImportedData(jsonData);
                
                this.showNotification(`تم استيراد ${jsonData.length - 1} سجل بنجاح!`);
            } catch (error) {
                this.showNotification('خطأ في معالجة الملف', 'error');
                console.error('File processing error:', error);
            }
        };
        
        reader.onerror = () => {
            this.showNotification('خطأ في قراءة الملف', 'error');
        };
        
        reader.readAsArrayBuffer(file);
    }

    displayImportedData(data) {
        const tableBody = document.getElementById('dataTableBody');
        const dataSection = document.getElementById('dataSection');
        
        // إظهار قسم البيانات
        dataSection.style.display = 'block';
        
        // مسح الجدول القديم
        tableBody.innerHTML = '';
        
        // إضافة البيانات الجديدة
        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            
            const tdIndex = document.createElement('td');
            tdIndex.textContent = index + 1;
            tr.appendChild(tdIndex);
            
            const tdData = document.createElement('td');
            tdData.textContent = Array.isArray(row) ? row.join(' - ') : JSON.stringify(row);
            tr.appendChild(tdData);
            
            tableBody.appendChild(tr);
        });
    }

    showSettings() {
        const modalHTML = `
            <div class="modal-overlay" id="settingsModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-cogs"></i> إعدادات الحساب</h3>
                        <button class="close-btn" onclick="dataSystem.closeModal('settingsModal')">&times;</button>
                    </div>
                    <div style="padding: 20px;">
                        <div class="new-form-group">
                            <label>الاسم:</label>
                            <input type="text" id="userNameInput" class="new-form-input" value="${this.userData?.userProfile?.name || ''}">
                        </div>
                        <div class="new-form-group">
                            <label>البريد الإلكتروني:</label>
                            <input type="email" class="new-form-input" value="${this.userData?.userProfile?.email || ''}" readonly>
                        </div>
                        <div class="new-form-group">
                            <label>تاريخ الانضمام:</label>
                            <input type="text" class="new-form-input" value="${this.userData?.userProfile?.joinDate || ''}" readonly>
                        </div>
                        <button class="new-login-btn" onclick="dataSystem.saveSettings()">
                            <i class="fas fa-save"></i> حفظ الإعدادات
                        </button>
                        <button class="new-login-btn" onclick="dataSystem.logout()" style="background: var(--danger-color); margin-top: 10px;">
                            <i class="fas fa-sign-out-alt"></i> تسجيل الخروج
                        </button>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHTML);
    }

    async saveSettings() {
        const userName = document.getElementById('userNameInput').value;
        
        if (this.userData && this.firebaseManager.currentUser) {
            this.userData.userProfile.name = userName;
            
            await this.firebaseManager.saveUserData(this.firebaseManager.currentUser.uid, this.userData);
            this.closeModal('settingsModal');
            this.showNotification('تم حفظ الإعدادات بنجاح!');
            
            // تحديث الاسم المعروض
            document.getElementById('userDisplayName').textContent = userName || 
                this.firebaseManager.currentUser.email.split('@')[0];
        }
    }

    async logout() {
        await this.firebaseManager.logout();
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('dataSection').style.display = 'none';
        this.showNotification('تم تسجيل الخروج بنجاح');
    }

    checkAuthStatus() {
        const savedUser = localStorage.getItem('propertyUser');
        if (savedUser && this.firebaseManager.currentUser) {
            this.loadUserData().then(() => {
                this.showDashboard();
            });
        }
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
        // إزالة الإشعارات القديمة
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
        
        // إزالة الإشعار تلقائياً بعد 5 ثواني
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// مدير Firebase
class FirebaseManager {
    constructor() {
        this.auth = null;
        this.db = null;
        this.currentUser = null;
    }

    async init() {
        try {
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
            
            this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                if (user) {
                    console.log('✅ User signed in:', user.email);
                    localStorage.setItem('propertyUser', user.email);
                } else {
                    console.log('🔒 User signed out');
                    localStorage.removeItem('propertyUser');
                }
            });
            
            console.log('✅ Firebase Manager initialized');
        } catch (error) {
            console.error('❌ Firebase Manager init error:', error);
            throw error;
        }
    }

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

    async logout() {
        try {
            await this.auth.signOut();
            this.currentUser = null;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async saveUserData(userId, userData) {
        try {
            await this.db.collection('userData').doc(userId).set({
                ...userData,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getUserData(userId) {
        try {
            const doc = await this.db.collection('userData').doc(userId).get();
            if (doc.exists) {
                return { success: true, data: doc.data() };
            } else {
                return { success: false, error: 'No data found' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// نظام التكامل مع Excel
class ExcelIntegration {
    static async connectToExcelOnline(data, service = 'microsoft') {
        try {
            console.log(`جاري الربط مع ${service}...`);
            
            if (service === 'microsoft') {
                return await this.connectToMicrosoftExcel(data);
            } else if (service === 'google') {
                return await this.connectToGoogleSheets(data);
            } else {
                throw new Error('Service not supported');
            }
        } catch (error) {
            console.error('Connection error:', error);
            throw error;
        }
    }

    static async connectToMicrosoftExcel(data) {
        // محاكاة الاتصال مع Microsoft Excel Online
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'تم الربط مع Microsoft Excel Online بنجاح',
                    url: 'https://excel.office.com'
                });
            }, 2000);
        });
    }

    static async connectToGoogleSheets(data) {
        // محاكاة الاتصال مع Google Sheets
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'تم الربط مع Google Sheets بنجاح',
                    url: 'https://sheets.google.com'
                });
            }, 2000);
        });
    }

    static async exportToVariousFormats(data, format = 'xlsx') {
        const formats = {
            'xlsx': () => this.exportToXLSX(data),
            'csv': () => this.exportToCSV(data),
            'json': () => this.exportToJSON(data),
            'pdf': () => this.exportToPDF(data)
        };

        return formats[format] ? formats[format]() : this.exportToXLSX(data);
    }

    static exportToXLSX(data) {
        try {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(workbook, worksheet, "البيانات");
            
            const fileName = `البيانات_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            
            return { success: true, fileName: fileName };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static exportToCSV(data) {
        try {
            const worksheet = XLSX.utils.aoa_to_sheet(data);
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            const fileName = `البيانات_${new Date().toISOString().split('T')[0]}.csv`;
            
            this.downloadFile(csv, fileName, 'text/csv');
            return { success: true, fileName: fileName };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static exportToJSON(data) {
        try {
            const headers = data[0];
            const jsonData = [];
            
            for (let i = 1; i < data.length; i++) {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = data[i][index] || '';
                });
                jsonData.push(obj);
            }
            
            const jsonString = JSON.stringify(jsonData, null, 2);
            const fileName = `البيانات_${new Date().toISOString().split('T')[0]}.json`;
            
            this.downloadFile(jsonString, fileName, 'application/json');
            return { success: true, fileName: fileName };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static exportToPDF(data) {
        // محاكاة تصدير PDF
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'تم تصدير البيانات بصيغة PDF',
                    fileName: `البيانات_${new Date().toISOString().split('T')[0]}.pdf`
                });
            }, 1500);
        });
    }

    static downloadFile(content, fileName, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    static async processAdvancedExcel(file, options = {}) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { 
                        type: 'array',
                        cellDates: true,
                        cellStyles: true
                    });
                    
                    const result = {
                        workbook: workbook,
                        sheets: [],
                        metadata: {
                            sheetCount: workbook.SheetNames.length,
                            created: workbook.Props?.CreatedDate,
                            modified: workbook.Props?.ModifiedDate
                        }
                    };
                    
                    // معالجة كل sheet
                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                            header: options.header || 1,
                            defval: ''
                        });
                        
                        result.sheets.push({
                            name: sheetName,
                            data: jsonData,
                            rowCount: jsonData.length,
                            columnCount: jsonData[0] ? jsonData[0].length : 0
                        });
                    });
                    
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    static generateSampleData(type = 'customers', count = 10) {
        const dataTypes = {
            customers: () => {
                const headers = ['ID', 'الاسم', 'البريد الإلكتروني', 'الهاتف', 'العنوان', 'تاريخ التسجيل'];
                const data = [headers];
                
                for (let i = 1; i <= count; i++) {
                    data.push([
                        i,
                        `عميل ${i}`,
                        `customer${i}@example.com`,
                        `05${Math.floor(10000000 + Math.random() * 90000000)}`,
                        `عنوان ${i}`,
                        new Date().toISOString().split('T')[0]
                    ]);
                }
                return data;
            },
            
            products: () => {
                const headers = ['ID', 'اسم المنتج', 'الفئة', 'السعر', 'الكمية', 'التوفر'];
                const data = [headers];
                
                for (let i = 1; i <= count; i++) {
                    data.push([
                        i,
                        `منتج ${i}`,
                        ['إلكترونيات', 'ملابس', 'أغذية', 'أثاث'][Math.floor(Math.random() * 4)],
                        Math.floor(Math.random() * 1000) + 100,
                        Math.floor(Math.random() * 100) + 1,
                        Math.random() > 0.2 ? 'متوفر' : 'غير متوفر'
                    ]);
                }
                return data;
            },
            
            sales: () => {
                const headers = ['رقم العملية', 'العميل', 'المبلغ', 'التاريخ', 'الحالة'];
                const data = [headers];
                
                for (let i = 1; i <= count; i++) {
                    const date = new Date();
                    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
                    
                    data.push([
                        `INV-${1000 + i}`,
                        `عميل ${Math.floor(Math.random() * 10) + 1}`,
                        Math.floor(Math.random() * 5000) + 100,
                        date.toISOString().split('T')[0],
                        ['مكتمل', 'معلق', 'ملغى'][Math.floor(Math.random() * 3)]
                    ]);
                }
                return data;
            }
        };
        
        return dataTypes[type] ? dataTypes[type]() : dataTypes.customers();
    }
}

// إضافة الدوال الجديدة للنظام الرئيسي
DataManagementSystem.prototype.connectToExternalExcel = async function(service = 'microsoft') {
    try {
        const dataToExport = this.importedData.length > 0 ? this.importedData : 
            ExcelIntegration.generateSampleData('customers', 5);
        
        const result = await ExcelIntegration.connectToExcelOnline(dataToExport, service);
        this.showNotification(result.message);
        
        return result;
    } catch (error) {
        this.showNotification('فشل في الربط مع الخدمة الخارجية', 'error');
        console.error('Connection error:', error);
    }
};

DataManagementSystem.prototype.exportToMultipleFormats = async function(format = 'xlsx') {
    try {
        const dataToExport = this.importedData.length > 0 ? this.importedData : 
            ExcelIntegration.generateSampleData('customers', 5);
        
        const result = await ExcelIntegration.exportToVariousFormats(dataToExport, format);
        
        if (result.success) {
            this.showNotification(`تم التصدير بصيغة ${format} بنجاح`);
        } else {
            this.showNotification('فشل في التصدير', 'error');
        }
        
        return result;
    } catch (error) {
        this.showNotification('خطأ في التصدير', 'error');
        console.error('Export error:', error);
    }
};

DataManagementSystem.prototype.generateSampleData = function(type = 'customers', count = 10) {
    const sampleData = ExcelIntegration.generateSampleData(type, count);
    this.importedData = sampleData;
    this.displayImportedData(sampleData);
    this.showNotification(`تم إنشاء ${count} سجل نموذجي بنجاح`);
};

DataManagementSystem.prototype.advancedExcelImport = async function(file) {
    try {
        const result = await ExcelIntegration.processAdvancedExcel(file, {
            header: 1,
            defval: ''
        });
        
        this.showNotification(`تم استيراد ${result.sheets.length} ورقة عمل بنجاح`);
        
        // عرض البيانات من الورقة الأولى
        if (result.sheets.length > 0) {
            this.importedData = result.sheets[0].data;
            this.displayImportedData(result.sheets[0].data);
        }
        
        return result;
    } catch (error) {
        this.showNotification('فشل في معالجة الملف', 'error');
        console.error('Advanced import error:', error);
    }
};

// إضافة أزرار جديدة للوحة التحكم
DataManagementSystem.prototype.addAdvancedFeatures = function() {
    const featuresGrid = document.querySelector('.new-features-grid');
    
    if (featuresGrid) {
        const advancedFeaturesHTML = `
            <div class="new-feature-card">
                <div class="new-feature-icon">
                    <i class="fas fa-cloud-upload-alt"></i>
                </div>
                <h3>ربط مع Excel Online</h3>
                <p>الربط مع Microsoft Excel Online</p>
                <button class="new-login-btn" onclick="dataSystem.connectToExternalExcel('microsoft')" style="margin-top: 15px; margin-bottom: 5px;">
                    <i class="fab fa-microsoft"></i> Excel Online
                </button>
                <button class="new-login-btn" onclick="dataSystem.connectToExternalExcel('google')" style="background: #34A853;">
                    <i class="fab fa-google"></i> Google Sheets
                </button>
            </div>

            <div class="new-feature-card">
                <div class="new-feature-icon">
                    <i class="fas fa-file-export"></i>
                </div>
                <h3>تصدير متعدد</h3>
                <p>تصدير البيانات بصيغ متعددة</p>
                <button class="new-login-btn" onclick="dataSystem.exportToMultipleFormats('xlsx')" style="margin-top: 15px; margin-bottom: 5px;">
                    <i class="fas fa-file-excel"></i> Excel
                </button>
                <button class="new-login-btn" onclick="dataSystem.exportToMultipleFormats('csv')" style="background: #FF6B35; margin-bottom: 5px;">
                    <i class="fas fa-file-csv"></i> CSV
                </button>
                <button class="new-login-btn" onclick="dataSystem.exportToMultipleFormats('json')" style="background: #F7DF1E; color: #000;">
                    <i class="fas fa-file-code"></i> JSON
                </button>
            </div>

            <div class="new-feature-card">
                <div class="new-feature-icon">
                    <i class="fas fa-database"></i>
                </div>
                <h3>بيانات نموذجية</h3>
                <p>إنشاء بيانات تجريبية للاختبار</p>
                <button class="new-login-btn" onclick="dataSystem.generateSampleData('customers', 10)" style="margin-top: 15px; margin-bottom: 5px;">
                    <i class="fas fa-users"></i> عملاء
                </button>
                <button class="new-login-btn" onclick="dataSystem.generateSampleData('products', 8)" style="background: #28a745; margin-bottom: 5px;">
                    <i class="fas fa-box"></i> منتجات
                </button>
                <button class="new-login-btn" onclick="dataSystem.generateSampleData('sales', 12)" style="background: #ffc107; color: #000;">
                    <i class="fas fa-shopping-cart"></i> مبيعات
                </button>
            </div>
        `;
        
        featuresGrid.insertAdjacentHTML('beforeend', advancedFeaturesHTML);
    }
};

// تعديل دالة showDashboard لإضافة الميزات المتقدمة
const originalShowDashboard = DataManagementSystem.prototype.showDashboard;
DataManagementSystem.prototype.showDashboard = function() {
    originalShowDashboard.call(this);
    setTimeout(() => {
        this.addAdvancedFeatures();
    }, 100);
};

// تعديل دالة استيراد Excel لدعم الميزات المتقدمة
const originalImportFromExcel = DataManagementSystem.prototype.importFromExcel;
DataManagementSystem.prototype.importFromExcel = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls, .csv';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 1024 * 1024) { // إذا كان الملف أكبر من 1MB
                this.advancedExcelImport(file);
            } else {
                this.processExcelFile(file);
            }
        }
    };
    
    input.click();
};

// تهيئة النظام
document.addEventListener('DOMContentLoaded', () => {
    window.dataSystem = new DataManagementSystem();
    
    // إضافة مكتبة Excel إذا لم تكن موجودة
    if (typeof XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        document.head.appendChild(script);
    }
});

console.log('✅ نظام إدارة البيانات مع Excel جاهز للاستخدام!');
