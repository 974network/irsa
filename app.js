// النظام الجديد - نظام إدارة البيانات مع Excel (الإصدار النهائي)
class DataManagementSystem {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.firebaseManager = new FirebaseManager();
        this.importedData = [];
        this.autoSaveInterval = null;
        this.isOnline = true;
        this.init();
    }

    async init() {
        try {
            await this.firebaseManager.init();
            this.setupLogin();
            this.setupAutoSave();
            this.setupOnlineStatus();
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

    setupAutoSave() {
        // حفظ تلقائي كل 30 ثانية
        this.autoSaveInterval = setInterval(() => {
            if (this.userData && this.firebaseManager.currentUser) {
                this.autoSave();
            }
        }, 30000);

        // حفظ عند إغلاق الصفحة
        window.addEventListener('beforeunload', () => {
            if (this.userData && this.firebaseManager.currentUser) {
                this.saveCurrentData();
            }
        });
    }

    setupOnlineStatus() {
        // مراقبة حالة الاتصال بالإنترنت
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showNotification('تم استعادة الاتصال بالإنترنت', 'info');
            this.syncData(); // مزامنة البيانات عند العودة للاتصال
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNotification('فقدان الاتصال بالإنترنت - العمل في الوضع المحلي', 'warning');
        });
    }

    async autoSave() {
        try {
            if (this.userData && this.isOnline) {
                await this.firebaseManager.saveUserData(this.userData);
                console.log('💾 Auto-saved user data to cloud');
            }
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            this.showNotification('يرجى ملء جميع الحقول', 'error');
            return;
        }

        this.showNotification('جاري تسجيل الدخول...', 'info');

        const result = await this.firebaseManager.login(email, password);
        
        if (result.success) {
            await this.loadUserData();
            this.showDashboard();
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    async loadUserData() {
        try {
            const result = await this.firebaseManager.getUserData();
            
            if (result.success) {
                this.userData = result.data;
                this.importedData = this.userData.importedData || [];
                
                console.log(`✅ Loaded user data from: ${result.source}`);
                
                // تحديث وقت آخر دخول
                this.userData.userProfile.lastLogin = new Date().toISOString();
                await this.saveCurrentData();
                
                // إذا كانت هناك بيانات مستوردة محفوظة، عرضها
                if (this.importedData.length > 0) {
                    setTimeout(() => {
                        this.displayImportedData(this.importedData);
                    }, 500);
                }
                
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Load user data error:', error);
            this.userData = this.firebaseManager.getDefaultUserData();
            return false;
        }
    }

    async saveCurrentData() {
        try {
            if (!this.userData) {
                this.userData = this.firebaseManager.getDefaultUserData();
            }

            // تحديث البيانات الحالية
            this.userData.importedData = this.importedData;
            this.userData.userProfile = this.userData.userProfile || {};
            this.userData.userProfile.name = this.userData.userProfile.name || 
                this.firebaseManager.currentUser.email.split('@')[0];
            this.userData.userProfile.email = this.firebaseManager.currentUser.email;
            this.userData.userProfile.lastActivity = new Date().toISOString();

            // تحديث البيانات الوصفية
            this.userData._metadata = this.userData._metadata || {};
            this.userData._metadata.lastUpdated = new Date().toISOString();
            this.userData._metadata.device = navigator.userAgent;

            const result = await this.firebaseManager.saveUserData(this.userData);
            
            if (result.success) {
                console.log('✅ Current data saved successfully');
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Save current data error:', error);
            // لا نعرض إشعار خطأ هنا لتجنب الإزعاج أثناء الحفظ التلقائي
            return false;
        }
    }

    showDashboard() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        
        // تحديث معلومات المستخدم
        if (this.firebaseManager.currentUser) {
            const userName = this.userData?.userProfile?.name || 
                this.firebaseManager.currentUser.email.split('@')[0];
            
            document.getElementById('userDisplayName').textContent = userName;
            document.getElementById('userDisplayEmail').textContent = 
                this.firebaseManager.currentUser.email;
        }
        
        this.showNotification('مرحباً بك في نظام إدارة البيانات!');
        
        // إضافة الميزات المتقدمة
        setTimeout(() => {
            this.addAdvancedFeatures();
            this.showDataStats();
        }, 100);
    }

    showDataStats() {
        const stats = document.createElement('div');
        stats.className = 'data-stats';
        stats.innerHTML = `
            <div style="background: white; padding: 15px; border-radius: 10px; margin: 10px 0; text-align: center;">
                <h4 style="margin-bottom: 10px;">📊 إحصائيات البيانات</h4>
                <div style="display: flex; justify-content: space-around; flex-wrap: wrap;">
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: var(--primary-color);">
                            ${this.importedData.length > 0 ? this.importedData.length - 1 : 0}
                        </div>
                        <div style="font-size: 12px; color: #666;">السجلات</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: var(--success-color);">
                            ${this.userData?.exportHistory?.length || 0}
                        </div>
                        <div style="font-size: 12px; color: #666;">عمليات التصدير</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: ${this.isOnline ? 'var(--success-color)' : 'var(--danger-color)'};">
                            ${this.isOnline ? '🟢' : '🔴'}
                        </div>
                        <div style="font-size: 12px; color: #666;">الحالة</div>
                    </div>
                </div>
            </div>
        `;
        
        const welcomeCard = document.querySelector('.new-welcome-card');
        if (welcomeCard) {
            welcomeCard.parentNode.insertBefore(stats, welcomeCard.nextSibling);
        }
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

        this.showNotification('جاري إنشاء الحساب...', 'info');

        const result = await this.firebaseManager.createAccount(email, password, userData);
        
        if (result.success) {
            this.closeModal('signupModal');
            this.showNotification('تم إنشاء الحساب بنجاح! يتم تسجيل الدخول تلقائياً.');
            
            // تسجيل الدخول تلقائياً
            setTimeout(() => {
                document.getElementById('email').value = email;
                document.getElementById('password').value = password;
                this.handleLogin();
            }, 2000);
            
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    // دالة تصدير إلى Excel - معدلة للحفظ التلقائي
    async exportToExcel() {
        // بيانات مثاليه للتصدير
        const sampleData = [
            ['الاسم', 'البريد الإلكتروني', 'الهاتف', 'الدولة', 'التاريخ'],
            ['أحمد محمد', 'ahmed@example.com', '0512345678', 'السعودية', new Date().toLocaleDateString('ar-SA')],
            ['فاطمة علي', 'fatima@example.com', '0554321098', 'السعودية', new Date().toLocaleDateString('ar-SA')],
            ['خالد عبدالله', 'khaled@example.com', '0501234567', 'السعودية', new Date().toLocaleDateString('ar-SA')],
            ['سارة أحمد', 'sara@example.com', '0543210987', 'السعودية', new Date().toLocaleDateString('ar-SA')]
        ];

        // إذا كان هناك بيانات مستوردة، نستخدمها
        const dataToExport = this.importedData.length > 0 ? this.importedData : sampleData;
        
        this.exportDataToExcel(dataToExport);
        
        // حفظ سجل التصدير
        await this.saveExportHistory(dataToExport);
    }

    async saveExportHistory(data) {
        if (!this.userData.exportHistory) {
            this.userData.exportHistory = [];
        }
        
        this.userData.exportHistory.push({
            date: new Date().toISOString(),
            recordCount: data.length - 1, // ناقص العناوين
            type: 'excel',
            fileName: `البيانات_المصدّرة_${new Date().toISOString().split('T')[0]}.xlsx`
        });
        
        await this.saveCurrentData();
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

    // دالة استيراد من Excel - معدلة للحفظ التلقائي
    async importFromExcel() {
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
        
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // معالجة البيانات
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                this.importedData = jsonData;
                this.displayImportedData(jsonData);
                
                // حفظ البيانات المستوردة تلقائياً
                await this.saveCurrentData();
                
                this.showNotification(`تم استيراد ${jsonData.length - 1} سجل بنجاح وتم الحفظ!`);
                
                // تحديث الإحصائيات
                this.showDataStats();
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
            if (Array.isArray(row)) {
                // إنشاء خلايا منفصلة لكل عمود
                row.forEach((cell, cellIndex) => {
                    if (cellIndex === 0) {
                        tdData.textContent = cell;
                    } else {
                        tdData.textContent += ` - ${cell}`;
                    }
                });
            } else {
                tdData.textContent = JSON.stringify(row);
            }
            tr.appendChild(tdData);
            
            tableBody.appendChild(tr);
        });
    }

    async showSettings() {
        const lastUpdate = await this.firebaseManager.getLastUpdate();
        const lastUpdateText = lastUpdate ? new Date(lastUpdate).toLocaleString('ar-SA') : 'غير متوفر';
        
        const modalHTML = `
            <div class="modal-overlay" id="settingsModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-cogs"></i> إعدادات الحساب والبيانات</h3>
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
                        <div class="new-form-group">
                            <label>آخر تحديث للبيانات:</label>
                            <input type="text" class="new-form-input" value="${lastUpdateText}" readonly>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin: 15px 0;">
                            <h4 style="margin-bottom: 10px;">📈 إحصائيات البيانات</h4>
                            <p>عدد السجلات المستوردة: <strong>${this.importedData.length > 0 ? this.importedData.length - 1 : 0}</strong></p>
                            <p>عدد عمليات التصدير: <strong>${this.userData?.exportHistory?.length || 0}</strong></p>
                            <p>حالة الاتصال: <strong style="color: ${this.isOnline ? 'var(--success-color)' : 'var(--danger-color)'}">${this.isOnline ? 'متصل' : 'غير متصل'}</strong></p>
                        </div>
                        
                        <button class="new-login-btn" onclick="dataSystem.saveSettings()">
                            <i class="fas fa-save"></i> حفظ الإعدادات
                        </button>
                        <button class="new-login-btn" onclick="dataSystem.syncData()" style="background: var(--info-color); margin-top: 10px;">
                            <i class="fas fa-sync"></i> مزامنة البيانات مع السحابة
                        </button>
                        <button class="new-login-btn" onclick="dataSystem.showExportHistory()" style="background: var(--warning-color); margin-top: 10px; color: #000;">
                            <i class="fas fa-history"></i> سجل التصدير
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
            
            const result = await this.saveCurrentData();
            if (result) {
                this.closeModal('settingsModal');
                this.showNotification('تم حفظ الإعدادات بنجاح!');
                
                // تحديث الاسم المعروض
                document.getElementById('userDisplayName').textContent = userName || 
                    this.firebaseManager.currentUser.email.split('@')[0];
            }
        }
    }

    async syncData() {
        this.showNotification('جاري مزامنة البيانات مع السحابة...', 'info');
        
        const result = await this.firebaseManager.syncUserData();
        if (result.success) {
            this.showNotification('تم مزامنة البيانات بنجاح!', 'success');
        } else {
            this.showNotification('فشل في المزامنة: ' + result.error, 'error');
        }
    }

    showExportHistory() {
        const exportHistory = this.userData?.exportHistory || [];
        
        let historyHTML = '';
        if (exportHistory.length > 0) {
            historyHTML = exportHistory.slice(-10).reverse().map(exportItem => `
                <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                    <div><strong>${new Date(exportItem.date).toLocaleString('ar-SA')}</strong></div>
                    <div>عدد السجلات: ${exportItem.recordCount}</div>
                    <div>النوع: ${exportItem.type}</div>
                </div>
            `).join('');
        } else {
            historyHTML = '<p style="text-align: center; color: #666;">لا توجد عمليات تصدير سابقة</p>';
        }
        
        const modalHTML = `
            <div class="modal-overlay" id="exportHistoryModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-history"></i> سجل عمليات التصدير</h3>
                        <button class="close-btn" onclick="dataSystem.closeModal('exportHistoryModal')">&times;</button>
                    </div>
                    <div style="padding: 20px; max-height: 400px; overflow-y: auto;">
                        ${historyHTML}
                    </div>
                </div>
            </div>
        `;
        
        this.showModal(modalHTML);
    }

    async logout() {
        // حفظ البيانات النهائية قبل الخروج
        await this.saveCurrentData();
        
        await this.firebaseManager.logout();
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('dataSection').style.display = 'none';
        
        // إيقاف الحفظ التلقائي
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        // مسح الحقول
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        
        this.showNotification('تم تسجيل الخروج بنجاح');
    }

    checkAuthStatus() {
        // هذه الوظيفة تعمل تلقائياً من خلال مستمع حالة Firebase
        console.log('🔍 Checking auth status...');
    }

    // ===== الميزات المتقدمة =====
    
    addAdvancedFeatures() {
        const featuresGrid = document.querySelector('.new-features-grid');
        
        if (featuresGrid) {
            const advancedFeaturesHTML = `
                <div class="new-feature-card">
                    <div class="new-feature-icon">
                        <i class="fas fa-cloud-upload-alt"></i>
                    </div>
                    <h3>ربط مع Excel Online</h3>
                    <p>الربط مع خدمات Excel السحابية</p>
                    <button class="new-login-btn" onclick="dataSystem.connectToExternalExcel('microsoft')" style="margin-top: 15px; margin-bottom: 5px;">
                        <i class="fab fa-microsoft"></i> Excel Online
                    </button>
                    <button class="new-login-btn" onclick="dataSystem.connectToExternalExcel('google')" style="background: #34A853; margin-bottom: 5px;">
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
                    <button class="new-login-btn" onclick="dataSystem.exportToMultipleFormats('json')" style="background: #F7DF1E; color: #000; margin-bottom: 5px;">
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

                <div class="new-feature-card">
                    <div class="new-feature-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h3>إدارة البيانات</h3>
                    <p>أدوات متقدمة لإدارة البيانات</p>
                    <button class="new-login-btn" onclick="dataSystem.backupData()" style="margin-top: 15px; margin-bottom: 5px; background: #17a2b8;">
                        <i class="fas fa-download"></i> نسخ احتياطي
                    </button>
                    <button class="new-login-btn" onclick="dataSystem.clearData()" style="background: #6c757d; margin-bottom: 5px;">
                        <i class="fas fa-trash"></i> مسح البيانات
                    </button>
                    <button class="new-login-btn" onclick="dataSystem.showDataInfo()" style="background: #6f42c1;">
                        <i class="fas fa-info-circle"></i> معلومات النظام
                    </button>
                </div>
            `;
            
            featuresGrid.innerHTML += advancedFeaturesHTML;
        }
    }

    // ===== الدوال المتقدمة =====

    async connectToExternalExcel(service = 'microsoft') {
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
    }

    async exportToMultipleFormats(format = 'xlsx') {
        try {
            const dataToExport = this.importedData.length > 0 ? this.importedData : 
                ExcelIntegration.generateSampleData('customers', 5);
            
            const result = await ExcelIntegration.exportToVariousFormats(dataToExport, format);
            
            if (result.success) {
                this.showNotification(`تم التصدير بصيغة ${format} بنجاح`);
                
                // حفظ في السجل
                await this.saveExportHistory(dataToExport);
            } else {
                this.showNotification('فشل في التصدير', 'error');
            }
            
            return result;
        } catch (error) {
            this.showNotification('خطأ في التصدير', 'error');
            console.error('Export error:', error);
        }
    }

    async generateSampleData(type = 'customers', count = 10) {
        const sampleData = ExcelIntegration.generateSampleData(type, count);
        this.importedData = sampleData;
        this.displayImportedData(sampleData);
        
        // حفظ البيانات تلقائياً
        await this.saveCurrentData();
        
        this.showNotification(`تم إنشاء ${count} سجل نموذجي بنجاح وتم الحفظ`);
        this.showDataStats();
    }

    async backupData() {
        try {
            const backup = {
                userData: this.userData,
                importedData: this.importedData,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            
            const backupStr = JSON.stringify(backup, null, 2);
            const blob = new Blob([backupStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `data_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showNotification('تم إنشاء نسخة احتياطية بنجاح');
        } catch (error) {
            this.showNotification('خطأ في إنشاء النسخة الاحتياطية', 'error');
        }
    }

    async clearData() {
        if (confirm('هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) {
            this.importedData = [];
            this.userData.importedData = [];
            this.userData.exportHistory = [];
            
            await this.saveCurrentData();
            
            const tableBody = document.getElementById('dataTableBody');
            if (tableBody) {
                tableBody.innerHTML = '';
            }
            
            const dataSection = document.getElementById('dataSection');
            if (dataSection) {
                dataSection.style.display = 'none';
            }
            
            this.showNotification('تم مسح جميع البيانات بنجاح');
            this.showDataStats();
        }
    }

    showDataInfo() {
        const info = {
            'المستخدم': this.userData?.userProfile?.name || 'غير محدد',
            'البريد الإلكتروني': this.userData?.userProfile?.email || 'غير محدد',
            'تاريخ الانضمام': this.userData?.userProfile?.joinDate || 'غير محدد',
            'آخر نشاط': this.userData?.userProfile?.lastActivity || 'غير محدد',
            'عدد السجلات': this.importedData.length > 0 ? this.importedData.length - 1 : 0,
            'عمليات التصدير': this.userData?.exportHistory?.length || 0,
            'حالة الاتصال': this.isOnline ? 'متصل' : 'غير متصل',
            'آخر تحديث': this.userData?._metadata?.lastUpdated || 'غير محدد'
        };
        
        const infoHTML = Object.entries(info).map(([key, value]) => `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                <span style="font-weight: bold;">${key}:</span>
                <span>${value}</span>
            </div>
        `).join('');
        
        const modalHTML = `
            <div class="modal-overlay" id="dataInfoModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-info-circle"></i> معلومات النظام والبيانات</h3>
                        <button class="close-btn" onclick="dataSystem.closeModal('dataInfoModal')">&times;</button>
                    </div>
                    <div style="padding: 20px;">
                        ${infoHTML}
                    </div>
                </div>
            </div>
        `;
        
        this.showModal(modalHTML);
    }

    // ===== الدوال المساعدة =====

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

// ===== نظام التكامل مع Excel =====

// ===== نظام التكامل مع Excel & Google Sheets =====
class ExcelIntegration {
    static async exportToXLSX(data) {
    try {
        // قبل إنشاء الملف، نجلب أحدث نسخة من Google Sheet
        const sheetId = "1dtxlQthn2b2prfXOxdEn28r5hHfGZB"; // معرّف الجدول الصحيح
        const sheetName = "Sheet1";
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
        
        const response = await fetch(url);
        const csvText = await response.text();
        const rows = csvText.split('\n').map(r => r.split(','));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, worksheet, "البيانات");

        const fileName = `البيانات_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        return { success: true, fileName };
    } catch (error) {
        console.error("❌ خطأ في التصدير من Google Sheet:", error);
        return { success: false, error: error.message };
    }
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
            }, 1500);
        });
    }

    static async connectToGoogleSheets(data) {
        // محاكاة بسيطة (يمكن حذفها إذا استخدمت syncWithGoogleSheet مباشرة)
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'تم الربط مع Google Sheets بنجاح',
                    url: 'https://sheets.google.com'
                });
            }, 1000);
        });
    }

    // ===== دالة المزامنة مع Google Sheets =====
    static async syncWithGoogleSheet(sheetId, sheetName = "Sheet1", data = []) {
        try {
            // تحويل البيانات إلى CSV
            const worksheet = XLSX.utils.aoa_to_sheet(data);
            const csv = XLSX.utils.sheet_to_csv(worksheet);

            // عنوان تطبيق Apps Script (تضعه من النشر)
            const url = "https://script.google.com/macros/s/AKfycbwNlFvEMbK-vf0IXAEoX8ITtuVs6tYweRZvW0RyO1ddus41XpjIVyxmgoCowmbWiU6yCA/exec";

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sheetId, sheetName, csv })
            });

            const result = await response.json();

            if (result.error) throw new Error(result.error);
            return { success: true, message: result.message || "تم تحديث Google Sheet بنجاح" };
        } catch (error) {
            console.error("❌ خطأ في مزامنة Google Sheet:", error);
            return { success: false, error: error.message };
        }
    }

    // ===== تصدير إلى صيغ متعددة =====
    static async exportToVariousFormats(data, format = 'xlsx') {
        const formats = {
            'xlsx': () => this.exportToXLSX(data),
            'csv': () => this.exportToCSV(data),
            'json': () => this.exportToJSON(data)
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

            return { success: true, fileName };
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
            return { success: true, fileName };
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
            return { success: true, fileName };
        } catch (error) {
            return { success: false, error: error.message };
        }
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

    // ===== بيانات نموذجية =====
    static generateSampleData(type = 'customers', count = 10) {
        const headers = ['ID', 'الاسم', 'البريد الإلكتروني', 'الهاتف', 'العنوان', 'التاريخ'];
        const data = [headers];
        for (let i = 1; i <= count; i++) {
            data.push([
                i,
                `عميل ${i}`,
                `customer${i}@example.com`,
                `05${Math.floor(10000000 + Math.random() * 90000000)}`,
                `الدوحة - قطر`,
                new Date().toLocaleDateString('ar-QA')
            ]);
        }
        return data;
    }
}


// ===== مدير Firebase - الإصدار النهائي =====

class FirebaseManager {
    constructor() {
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.isInitialized = false;
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
            
            // الانتظار حتى يتم تهيئة Firebase بالكامل
            await new Promise((resolve, reject) => {
                const unsubscribe = this.auth.onAuthStateChanged((user) => {
                    this.currentUser = user;
                    this.isInitialized = true;
                    unsubscribe();
                    resolve(user);
                }, reject);
            });
            
            console.log('✅ Firebase Manager initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Firebase Manager init error:', error);
            this.isInitialized = false;
            throw error;
        }
    }

    async login(email, password) {
        try {
            if (!this.isInitialized) {
                await this.init();
            }

            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;
            
            console.log('✅ Login successful:', this.currentUser.email);
            return { 
                success: true, 
                user: this.currentUser,
                userId: this.currentUser.uid 
            };
        } catch (error) {
            let errorMessage = 'فشل في تسجيل الدخول';
            switch (error.code) {
                case 'auth/user-not-found': errorMessage = 'المستخدم غير موجود'; break;
                case 'auth/wrong-password': errorMessage = 'كلمة المرور غير صحيحة'; break;
                case 'auth/invalid-email': errorMessage = 'البريد الإلكتروني غير صالح'; break;
                case 'auth/too-many-requests': errorMessage = 'محاولات تسجيل دخول كثيرة، حاول لاحقاً'; break;
                default: errorMessage = error.message;
            }
            console.error('❌ Login error:', error);
            return { success: false, error: errorMessage };
        }
    }

    async createAccount(email, password, userData = {}) {
        try {
            if (!this.isInitialized) {
                await this.init();
            }

            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;
            
            const userProfile = {
                username: userData.username || email.split('@')[0],
                fullName: userData.fullName || email.split('@')[0],
                email: email,
                phone: userData.phone || '',
                role: userData.role || 'مستخدم',
                joinDate: new Date().toISOString().split('T')[0],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // حفظ بيانات الملف الشخصي
            await this.db.collection('users').doc(this.currentUser.uid).set(userProfile);
            
            // إنشاء بيانات المستخدم الافتراضية
            const defaultUserData = this.getDefaultUserData();
            defaultUserData.userProfile = userProfile;
            
            await this.db.collection('userData').doc(this.currentUser.uid).set(defaultUserData);
            
            console.log('✅ Account created successfully:', this.currentUser.email);
            return { 
                success: true, 
                user: this.currentUser,
                userId: this.currentUser.uid 
            };
        } catch (error) {
            console.error('❌ Account creation error:', error);
            
            // إذا كان البريد مستخدم مسبقاً، نحاول تسجيل الدخول
            if (error.code === 'auth/email-already-in-use') {
                try {
                    console.log('🔄 Email already in use, trying to login...');
                    const loginResult = await this.login(email, password);
                    if (loginResult.success) {
                        return {
                            success: true,
                            user: loginResult.user,
                            message: 'تم تسجيل الدخول إلى الحساب الموجود'
                        };
                    }
                } catch (loginError) {
                    return { 
                        success: false, 
                        error: 'الحساب موجود لكن كلمة المرور غير صحيحة' 
                    };
                }
            }
            
            let errorMessage = 'فشل في إنشاء الحساب';
            switch (error.code) {
                case 'auth/email-already-in-use': errorMessage = 'البريد الإلكتروني مستخدم مسبقاً'; break;
                case 'auth/weak-password': errorMessage = 'كلمة المرور ضعيفة'; break;
                case 'auth/invalid-email': errorMessage = 'البريد الإلكتروني غير صالح'; break;
                default: errorMessage = error.message;
            }
            
            return { success: false, error: errorMessage };
        }
    }

    async logout() {
        try {
            await this.auth.signOut();
            this.currentUser = null;
            this.isInitialized = false;
            
            // مسح التخزين المحلي
            localStorage.removeItem('propertyUser');
            localStorage.removeItem('userData');
            
            console.log('✅ Logout successful');
            return { success: true };
        } catch (error) {
            console.error('❌ Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    async saveUserData(userData) {
        try {
            if (!this.currentUser) {
                throw new Error('No user logged in');
            }

            if (!this.isInitialized) {
                await this.init();
            }

            const userId = this.currentUser.uid;
            
            // تحديث وقت التعديل الأخير
            userData._metadata = userData._metadata || {};
            userData._metadata.lastUpdated = new Date().toISOString();
            userData._metadata.lastUpdatedBy = this.currentUser.email;
            
            // حفظ البيانات في Firestore
            await this.db.collection('userData').doc(userId).set(userData, { merge: true });
            
            // أيضًا حفظ نسخة محلية للسرعة
            localStorage.setItem(`userData_${userId}`, JSON.stringify(userData));
            
            console.log('✅ User data saved successfully for user:', userId);
            return { success: true };
        } catch (error) {
            console.error('❌ Save user data error:', error);
            
            // محاولة حفظ محلي كبديل
            try {
                if (this.currentUser) {
                    localStorage.setItem(`userData_${this.currentUser.uid}`, JSON.stringify(userData));
                    console.log('📱 Data saved locally as backup');
                    return { success: true, source: 'local' };
                }
            } catch (localError) {
                console.error('❌ Local storage error:', localError);
            }
            
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async getUserData() {
        try {
            if (!this.currentUser) {
                throw new Error('No user logged in');
            }

            if (!this.isInitialized) {
                await this.init();
            }

            const userId = this.currentUser.uid;
            
            // أولاً: التحقق من التخزين المحلي للسرعة
            const localData = localStorage.getItem(`userData_${userId}`);
            if (localData) {
                console.log('📱 Loading data from local storage');
                return { 
                    success: true, 
                    data: JSON.parse(localData),
                    source: 'local'
                };
            }
            
            // ثانياً: جلب البيانات من Firebase
            const doc = await this.db.collection('userData').doc(userId).get();
            
            if (doc.exists) {
                const data = doc.data();
                
                // حفظ نسخة محلية
                localStorage.setItem(`userData_${userId}`, JSON.stringify(data));
                
                console.log('☁️ Loading data from Firebase');
                return { 
                    success: true, 
                    data: data,
                    source: 'firebase'
                };
            } else {
                // إذا لم توجد بيانات، إنشاء بيانات افتراضية
                console.log('🆕 No data found, creating default data');
                const defaultData = this.getDefaultUserData();
                await this.saveUserData(defaultData);
                
                return { 
                    success: true, 
                    data: defaultData,
                    source: 'default'
                };
            }
        } catch (error) {
            console.error('❌ Get user data error:', error);
            
            // محاولة استخدام البيانات المحلية كبديل
            if (this.currentUser) {
                const localData = localStorage.getItem(`userData_${this.currentUser.uid}`);
                if (localData) {
                    console.log('🔄 Using local data as fallback');
                    return { 
                        success: true, 
                        data: JSON.parse(localData),
                        source: 'local_fallback'
                    };
                }
            }
            
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    getDefaultUserData() {
        const currentDate = new Date().toISOString().split('T')[0];
        return {
            userProfile: {
                name: '',
                email: this.currentUser?.email || '',
                joinDate: currentDate,
                lastLogin: new Date().toISOString()
            },
            excelFiles: [],
            importedData: [],
            exportHistory: [],
            settings: {
                defaultFormat: 'xlsx',
                autoSave: true,
                theme: 'light',
                language: 'ar'
            },
            _metadata: {
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                createdBy: this.currentUser?.email || 'system'
            }
        };
    }

    // دالة جديدة لمزامنة البيانات بين الأجهزة
    async syncUserData() {
        try {
            if (!this.currentUser) return { success: false, error: 'No user' };
            
            const userId = this.currentUser.uid;
            const localData = localStorage.getItem(`userData_${userId}`);
            
            if (localData) {
                const parsedData = JSON.parse(localData);
                
                // تحديث وقت المزامنة
                parsedData._metadata.lastSync = new Date().toISOString();
                
                // رفع البيانات المحلية إلى Firebase
                await this.db.collection('userData').doc(userId).set(parsedData, { merge: true });
                
                console.log('✅ Data synced to Firebase');
                return { success: true, message: 'تم مزامنة البيانات' };
            }
            
            return { success: false, error: 'No local data to sync' };
        } catch (error) {
            console.error('❌ Sync error:', error);
            return { success: false, error: error.message };
        }
    }

    // دالة لجلب تاريخ آخر تحديث
    async getLastUpdate() {
        try {
            if (!this.currentUser) return null;
            
            const doc = await this.db.collection('userData').doc(this.currentUser.uid).get();
            if (doc.exists) {
                const data = doc.data();
                return data._metadata?.lastUpdated || data._metadata?.createdAt;
            }
            return null;
        } catch (error) {
            console.error('❌ Get last update error:', error);
            return null;
        }
    }
}

// ===== تهيئة النظام =====

document.addEventListener('DOMContentLoaded', () => {
    window.dataSystem = new DataManagementSystem();
    console.log('🚀 نظام إدارة البيانات مع Firebase جاهز للاستخدام!');
    
    // إضافة مكتبة Excel إذا لم تكن موجودة
    if (typeof XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = () => console.log('✅ Excel library loaded');
        document.head.appendChild(script);
    }
});



