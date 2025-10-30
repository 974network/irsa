// نظام إدارة العقود والفواتير - النسخة المعدلة
class ContractManagementSystem {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.firebaseManager = new FirebaseManager();
        this.contracts = [];
        this.invoices = [];
        this.members = []; // تغيير من users إلى members
        this.permissions = {};
        this.isMemberLogin = false; // تغيير من isUserLogin إلى isMemberLogin
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
                await this.handleMainAccountLogin();
            });
        }
    }

    // تسجيل دخول الحساب الرئيسي (المدير)
    async handleMainAccountLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            this.showNotification('يرجى ملء جميع الحقول', 'error');
            return;
        }

        this.showNotification('جاري تسجيل الدخول...', 'info');

        const result = await this.firebaseManager.login(email, password);
        
        if (result.success) {
            await this.loadMainAccountData();
            this.isMemberLogin = false;
            this.showDashboard();
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    // تسجيل دخول العضو
    async handleMemberLogin(email, password) {
        this.showNotification('جاري تسجيل الدخول...', 'info');

        // البحث عن العضو في قائمة الأعضاء
        const member = this.members.find(m => m.email === email && m.password === password);
        
        if (member) {
            // تسجيل دخول العضو
            this.currentUser = {
                email: member.email,
                name: member.fullName,
                isMember: true
            };
            
            this.isMemberLogin = true;
            this.showDashboard();
        } else {
            this.showNotification('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
        }
    }

    async loadMainAccountData() {
        try {
            const result = await this.firebaseManager.getUserData();
            
            if (result.success) {
                this.userData = result.data;
                this.contracts = this.userData.contracts || [];
                this.invoices = this.userData.invoices || [];
                this.members = this.userData.members || []; // تغيير من users إلى members
                this.permissions = this.userData.permissions || {};
                
                console.log('📊 Loaded main account data:', {
                    contracts: this.contracts.length,
                    invoices: this.invoices.length,
                    members: this.members.length,
                    source: result.source
                });
                
                // تحديث وقت آخر دخول
                this.userData.userProfile.lastLogin = new Date().toISOString();
                await this.saveCurrentData();
                
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Load main account data error:', error);
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
            this.userData.contracts = this.contracts;
            this.userData.invoices = this.invoices;
            this.userData.members = this.members; // تغيير من users إلى members
            this.userData.permissions = this.permissions;
            
            this.userData.userProfile = this.userData.userProfile || {};
            this.userData.userProfile.name = this.userData.userProfile.name || 
                this.firebaseManager.currentUser.email.split('@')[0];
            this.userData.userProfile.email = this.firebaseManager.currentUser.email;
            this.userData.userProfile.lastActivity = new Date().toISOString();

            // تحديث البيانات الوصفية
            this.userData._metadata = this.userData._metadata || {};
            this.userData._metadata.lastUpdated = new Date().toISOString();
            this.userData._metadata.userId = this.firebaseManager.currentUser.uid;

            const result = await this.firebaseManager.saveUserData(this.userData);
            
            if (result.success) {
                console.log('💾 Main account data saved successfully');
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Save current data error:', error);
            return false;
        }
    }

    showDashboard() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        
        if (this.isMemberLogin) {
            // إذا كان دخول عضو
            document.getElementById('userDisplayName').textContent = this.currentUser.name;
            document.getElementById('userDisplayEmail').textContent = this.currentUser.email;
        } else {
            // إذا كان دخول مدير
            const userName = this.userData?.userProfile?.name || 
                this.firebaseManager.currentUser.email.split('@')[0];
            
            document.getElementById('userDisplayName').textContent = userName;
            document.getElementById('userDisplayEmail').textContent = 
                this.firebaseManager.currentUser.email;
        }
        
        this.showNotification('مرحباً بك في نظام إدارة العقود والفواتير!');
        
        this.loadDashboardData();
        this.updateStats();
        this.updatePermissionsUI();
        this.showUserStatus();
    }

    showUserStatus() {
        const userMenu = document.querySelector('.user-menu');
        // إزالة أي حالة مستخدم سابقة
        const existingStatus = userMenu.querySelector('.user-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        if (this.isMemberLogin) {
            const statusHTML = `
                <div class="user-status">
                    <div class="status-indicator"></div>
                    <div class="status-text">عضو متصل</div>
                </div>
            `;
            userMenu.insertAdjacentHTML('beforeend', statusHTML);
        }
    }

    loadDashboardData() {
        this.displayContracts();
        this.displayInvoices();
        this.displayMembers();
    }

    updateStats() {
        document.getElementById('contractsCount').textContent = this.contracts.length;
        document.getElementById('invoicesCount').textContent = this.invoices.length;
        document.getElementById('usersCount').textContent = this.members.length;
    }

    updatePermissionsUI() {
        const isMainAccount = !this.isMemberLogin;
        const userPermissions = this.isMemberLogin ? 
            (this.permissions[this.currentUser.email] || this.getDefaultMemberPermissions()) : 
            {};
        
        console.log('🔐 Updating permissions:', {
            isMainAccount: isMainAccount,
            isMemberLogin: this.isMemberLogin,
            userEmail: this.isMemberLogin ? this.currentUser.email : this.firebaseManager.currentUser.email,
            permissions: userPermissions
        });

        // إدارة الأعضاء للحساب الرئيسي فقط
        document.getElementById('usersNav').style.display = isMainAccount ? 'flex' : 'none';
        document.getElementById('manageUsersBtn').style.display = isMainAccount ? 'block' : 'none';

        // تطبيق الصلاحيات على العضو
        if (this.isMemberLogin) {
            console.log('🔒 Applying restrictions for member');
            
            // إخفاء الأقسام الممنوعة
            if (userPermissions.denyContracts) {
                document.getElementById('contractsNav').style.display = 'none';
                document.getElementById('addContractBtn').style.display = 'none';
                document.getElementById('addContractHeaderBtn').style.display = 'none';
                console.log('📋 Contracts access denied');
            }
            if (userPermissions.denyInvoices) {
                document.getElementById('invoicesNav').style.display = 'none';
                document.getElementById('addInvoiceBtn').style.display = 'none';
                document.getElementById('addInvoiceHeaderBtn').style.display = 'none';
                console.log('🧾 Invoices access denied');
            }
            if (userPermissions.denySettings) {
                document.getElementById('settingsNav').style.display = 'none';
                console.log('⚙️ Settings access denied');
            }

            // منع التعديل في الجداول
            if (userPermissions.denyEditContract) {
                document.querySelectorAll('#contractsTable .btn-edit').forEach(btn => {
                    btn.style.display = 'none';
                });
                console.log('✏️ Contract editing denied');
            }
            if (userPermissions.denyEditInvoice) {
                document.querySelectorAll('#invoicesTable .btn-edit').forEach(btn => {
                    btn.style.display = 'none';
                });
                console.log('✏️ Invoice editing denied');
            }
        }
    }

    showSection(sectionName) {
        // التحقق من الصلاحيات أولاً
        if (this.isMemberLogin) {
            const userPermissions = this.permissions[this.currentUser.email] || this.getDefaultMemberPermissions();
            
            if ((sectionName === 'contracts' && userPermissions.denyContracts) ||
                (sectionName === 'invoices' && userPermissions.denyInvoices) ||
                (sectionName === 'settings' && userPermissions.denySettings)) {
                
                this.showAccessDeniedMessage(sectionName);
                return;
            }
        }

        // إخفاء جميع الأقسام
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // إخفاء جميع عناصر القائمة
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // إظهار القسم المطلوب
        document.getElementById(sectionName + 'Section').classList.add('active');
        
        // تفعيل عنصر القائمة المناسب
        const navItem = document.querySelector(`.nav-item[onclick="contractSystem.showSection('${sectionName}')"]`);
        if (navItem) {
            navItem.classList.add('active');
        }
        
        // تحديث البيانات عند عرض القسم
        if (sectionName === 'contracts') {
            this.displayContracts();
        } else if (sectionName === 'invoices') {
            this.displayInvoices();
        } else if (sectionName === 'users') {
            this.displayMembers();
        } else if (sectionName === 'settings') {
            this.displayPermissions();
        }
    }

    showAccessDeniedMessage(sectionName) {
        const sectionNames = {
            'contracts': 'صفحة العقود',
            'invoices': 'صفحة الفواتير', 
            'settings': 'صفحة الإعدادات'
        };
        
        const sectionTitle = sectionNames[sectionName] || 'هذه الصفحة';
        
        const deniedHTML = `
            <div class="access-denied">
                <i class="fas fa-ban"></i>
                <h2>غير مسموح بالوصول</h2>
                <p>عذراً، ليس لديك صلاحية للوصول إلى ${sectionTitle}</p>
                <p>يرجى التواصل مع المدير للحصول على الصلاحيات المناسبة</p>
                <button class="btn-primary" onclick="contractSystem.showSection('dashboard')" style="margin-top: 20px;">
                    <i class="fas fa-home"></i> العودة إلى الرئيسية
                </button>
            </div>
        `;
        
        // إخفاء جميع الأقسام
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // إظهار رسالة المنع في القسم المطلوب
        const targetSection = document.getElementById(sectionName + 'Section');
        targetSection.innerHTML = deniedHTML;
        targetSection.classList.add('active');
        
        // إخفاء جميع عناصر القائمة
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        this.showNotification('غير مسموح لك بالوصول إلى هذه الصفحة', 'error');
    }

    toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        dropdown.classList.toggle('show');
    }

    // === نافذة تسجيل دخول العضو ===
    showMemberLoginModal() {
        const modalHTML = `
            <div class="modal-overlay" id="memberLoginModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-user"></i> تسجيل دخول عضو</h3>
                        <button class="close-btn" onclick="contractSystem.closeModal('memberLoginModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="memberLoginForm" onsubmit="contractSystem.handleMemberLoginForm(event)">
                            <div class="form-group">
                                <label>البريد الإلكتروني:</label>
                                <input type="email" name="email" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label>كلمة المرور:</label>
                                <input type="password" name="password" class="form-input" required>
                            </div>
                            <button type="submit" class="btn-primary" style="width: 100%;">
                                <i class="fas fa-sign-in-alt"></i> تسجيل الدخول
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHTML);
    }

    async handleMemberLoginForm(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const email = formData.get('email');
        const password = formData.get('password');
        
        await this.handleMemberLogin(email, password);
        this.closeModal('memberLoginModal');
    }

    // === عرض الملف الشخصي ===
    showProfileSection() {
        if (this.isMemberLogin) {
            this.showMemberProfile();
        } else {
            this.showAddMemberModal();
        }
    }

    showMemberProfile() {
        const modalHTML = `
            <div class="modal-overlay" id="memberProfileModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-user"></i> الملف الشخصي</h3>
                        <button class="close-btn" onclick="contractSystem.closeModal('memberProfileModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="profile-info">
                            <div class="profile-item">
                                <strong>الاسم:</strong> ${this.currentUser.name}
                            </div>
                            <div class="profile-item">
                                <strong>البريد الإلكتروني:</strong> ${this.currentUser.email}
                            </div>
                            <div class="profile-item">
                                <strong>الدور:</strong> عضو
                            </div>
                            <div class="profile-item">
                                <strong>الحالة:</strong> نشط
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHTML);
    }

    // === إدارة العقود ===
    displayContracts() {
        const tableBody = document.getElementById('contractsTableBody');
        tableBody.innerHTML = '';

        if (this.contracts.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-file-contract" style="font-size: 48px; margin-bottom: 15px; display: block; color: #ccc;"></i>
                        لا توجد عقود مضافة حتى الآن
                    </td>
                </tr>
            `;
            return;
        }

        this.contracts.forEach((contract, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${contract.contractNumber}</td>
                <td>${contract.clientName}</td>
                <td>${contract.amount} ر.ق</td>
                <td>${contract.startDate}</td>
                <td>${contract.endDate}</td>
                <td><span class="status-badge status-${contract.status}">${this.getStatusText(contract.status)}</span></td>
                <td>
                    <button class="btn-sm btn-edit" onclick="contractSystem.editContract(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-sm btn-delete" onclick="contractSystem.deleteContract(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-sm btn-view" onclick="contractSystem.viewContract(${index})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    showAddContractModal() {
        const modalHTML = `
            <div class="modal-overlay" id="addContractModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-file-contract"></i> إضافة عقد جديد</h3>
                        <button class="close-btn" onclick="contractSystem.closeModal('addContractModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="addContractForm" onsubmit="contractSystem.addContract(event)">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>رقم العقد:</label>
                                    <input type="text" name="contractNumber" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label>اسم العميل:</label>
                                    <input type="text" name="clientName" class="form-input" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>قيمة العقد:</label>
                                    <input type="number" name="amount" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label>حالة العقد:</label>
                                    <select name="status" class="form-input" required>
                                        <option value="active">نشط</option>
                                        <option value="pending">قيد الانتظار</option>
                                        <option value="completed">مكتمل</option>
                                        <option value="cancelled">ملغى</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>تاريخ البدء:</label>
                                    <input type="date" name="startDate" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label>تاريخ الانتهاء:</label>
                                    <input type="date" name="endDate" class="form-input" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>وصف العقد:</label>
                                <textarea name="description" class="form-input" rows="3"></textarea>
                            </div>
                            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 20px;">
                                <i class="fas fa-save"></i> حفظ العقد
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHTML);
    }

    async addContract(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const contract = {
            contractNumber: formData.get('contractNumber'),
            clientName: formData.get('clientName'),
            amount: formData.get('amount'),
            status: formData.get('status'),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            description: formData.get('description'),
            createdAt: new Date().toISOString(),
            createdBy: this.isMemberLogin ? this.currentUser.email : this.firebaseManager.currentUser.email
        };

        this.contracts.push(contract);
        await this.saveCurrentData();
        this.displayContracts();
        this.updateStats();
        this.closeModal('addContractModal');
        this.showNotification('تم إضافة العقد بنجاح');
    }

    editContract(index) {
        const contract = this.contracts[index];
        const modalHTML = `
            <div class="modal-overlay" id="editContractModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-edit"></i> تعديل العقد</h3>
                        <button class="close-btn" onclick="contractSystem.closeModal('editContractModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="editContractForm" onsubmit="contractSystem.updateContract(event, ${index})">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>رقم العقد:</label>
                                    <input type="text" name="contractNumber" class="form-input" value="${contract.contractNumber}" required>
                                </div>
                                <div class="form-group">
                                    <label>اسم العميل:</label>
                                    <input type="text" name="clientName" class="form-input" value="${contract.clientName}" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>قيمة العقد:</label>
                                    <input type="number" name="amount" class="form-input" value="${contract.amount}" required>
                                </div>
                                <div class="form-group">
                                    <label>حالة العقد:</label>
                                    <select name="status" class="form-input" required>
                                        <option value="active" ${contract.status === 'active' ? 'selected' : ''}>نشط</option>
                                        <option value="pending" ${contract.status === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
                                        <option value="completed" ${contract.status === 'completed' ? 'selected' : ''}>مكتمل</option>
                                        <option value="cancelled" ${contract.status === 'cancelled' ? 'selected' : ''}>ملغى</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>تاريخ البدء:</label>
                                    <input type="date" name="startDate" class="form-input" value="${contract.startDate}" required>
                                </div>
                                <div class="form-group">
                                    <label>تاريخ الانتهاء:</label>
                                    <input type="date" name="endDate" class="form-input" value="${contract.endDate}" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>وصف العقد:</label>
                                <textarea name="description" class="form-input" rows="3">${contract.description || ''}</textarea>
                            </div>
                            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 20px;">
                                <i class="fas fa-save"></i> حفظ التعديلات
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHTML);
    }

    async updateContract(event, index) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        this.contracts[index] = {
            ...this.contracts[index],
            contractNumber: formData.get('contractNumber'),
            clientName: formData.get('clientName'),
            amount: formData.get('amount'),
            status: formData.get('status'),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            description: formData.get('description'),
            updatedAt: new Date().toISOString(),
            updatedBy: this.isMemberLogin ? this.currentUser.email : this.firebaseManager.currentUser.email
        };

        await this.saveCurrentData();
        this.displayContracts();
        this.closeModal('editContractModal');
        this.showNotification('تم تعديل العقد بنجاح');
    }

    async deleteContract(index) {
        if (confirm('هل أنت متأكد من حذف هذا العقد؟')) {
            this.contracts.splice(index, 1);
            await this.saveCurrentData();
            this.displayContracts();
            this.updateStats();
            this.showNotification('تم حذف العقد بنجاح');
        }
    }

    viewContract(index) {
        const contract = this.contracts[index];
        const modalHTML = `
            <div class="modal-overlay" id="viewContractModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-eye"></i> عرض العقد</h3>
                        <button class="close-btn" onclick="contractSystem.closeModal('viewContractModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div><strong>رقم العقد:</strong> ${contract.contractNumber}</div>
                            <div><strong>اسم العميل:</strong> ${contract.clientName}</div>
                            <div><strong>قيمة العقد:</strong> ${contract.amount} ر.ق</div>
                            <div><strong>الحالة:</strong> <span class="status-badge status-${contract.status}">${this.getStatusText(contract.status)}</span></div>
                            <div><strong>تاريخ البدء:</strong> ${contract.startDate}</div>
                            <div><strong>تاريخ الانتهاء:</strong> ${contract.endDate}</div>
                        </div>
                        ${contract.description ? `<div style="margin-top: 15px;"><strong>الوصف:</strong><br>${contract.description}</div>` : ''}
                        <div style="margin-top: 15px; font-size: 12px; color: #666;">
                            <div>تم الإنشاء بواسطة: ${contract.createdBy}</div>
                            <div>تاريخ الإنشاء: ${new Date(contract.createdAt).toLocaleString('ar-SA')}</div>
                            ${contract.updatedAt ? `<div>آخر تعديل: ${new Date(contract.updatedAt).toLocaleString('ar-SA')}</div>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHTML);
    }

    // === إدارة الفواتير ===
    displayInvoices() {
        const tableBody = document.getElementById('invoicesTableBody');
        tableBody.innerHTML = '';

        if (this.invoices.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-receipt" style="font-size: 48px; margin-bottom: 15px; display: block; color: #ccc;"></i>
                        لا توجد فواتير مضافة حتى الآن
                    </td>
                </tr>
            `;
            return;
        }

        this.invoices.forEach((invoice, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${invoice.invoiceNumber}</td>
                <td>${invoice.clientName}</td>
                <td>${invoice.amount} ر.ق</td>
                <td>${invoice.issueDate}</td>
                <td>${invoice.dueDate}</td>
                <td><span class="status-badge status-${invoice.status}">${this.getStatusText(invoice.status)}</span></td>
                <td>
                    <button class="btn-sm btn-edit" onclick="contractSystem.editInvoice(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-sm btn-delete" onclick="contractSystem.deleteInvoice(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-sm btn-view" onclick="contractSystem.viewInvoice(${index})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    showAddInvoiceModal() {
        const modalHTML = `
            <div class="modal-overlay" id="addInvoiceModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-receipt"></i> إضافة فاتورة جديدة</h3>
                        <button class="close-btn" onclick="contractSystem.closeModal('addInvoiceModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="addInvoiceForm" onsubmit="contractSystem.addInvoice(event)">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>رقم الفاتورة:</label>
                                    <input type="text" name="invoiceNumber" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label>اسم العميل:</label>
                                    <input type="text" name="clientName" class="form-input" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>المبلغ:</label>
                                    <input type="number" name="amount" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label>حالة الفاتورة:</label>
                                    <select name="status" class="form-input" required>
                                        <option value="paid">مدفوعة</option>
                                        <option value="pending">قيد الانتظار</option>
                                        <option value="overdue">متأخرة</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>تاريخ الإصدار:</label>
                                    <input type="date" name="issueDate" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label>تاريخ الاستحقاق:</label>
                                    <input type="date" name="dueDate" class="form-input" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>وصف الفاتورة:</label>
                                <textarea name="description" class="form-input" rows="3"></textarea>
                            </div>
                            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 20px;">
                                <i class="fas fa-save"></i> حفظ الفاتورة
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHTML);
    }

    async addInvoice(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const invoice = {
            invoiceNumber: formData.get('invoiceNumber'),
            clientName: formData.get('clientName'),
            amount: formData.get('amount'),
            status: formData.get('status'),
            issueDate: formData.get('issueDate'),
            dueDate: formData.get('dueDate'),
            description: formData.get('description'),
            createdAt: new Date().toISOString(),
            createdBy: this.isMemberLogin ? this.currentUser.email : this.firebaseManager.currentUser.email
        };

        this.invoices.push(invoice);
        await this.saveCurrentData();
        this.displayInvoices();
        this.updateStats();
        this.closeModal('addInvoiceModal');
        this.showNotification('تم إضافة الفاتورة بنجاح');
    }

    editInvoice(index) {
        const invoice = this.invoices[index];
        const modalHTML = `
            <div class="modal-overlay" id="editInvoiceModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-edit"></i> تعديل الفاتورة</h3>
                        <button class="close-btn" onclick="contractSystem.closeModal('editInvoiceModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="editInvoiceForm" onsubmit="contractSystem.updateInvoice(event, ${index})">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>رقم الفاتورة:</label>
                                    <input type="text" name="invoiceNumber" class="form-input" value="${invoice.invoiceNumber}" required>
                                </div>
                                <div class="form-group">
                                    <label>اسم العميل:</label>
                                    <input type="text" name="clientName" class="form-input" value="${invoice.clientName}" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>المبلغ:</label>
                                    <input type="number" name="amount" class="form-input" value="${invoice.amount}" required>
                                </div>
                                <div class="form-group">
                                    <label>حالة الفاتورة:</label>
                                    <select name="status" class="form-input" required>
                                        <option value="paid" ${invoice.status === 'paid' ? 'selected' : ''}>مدفوعة</option>
                                        <option value="pending" ${invoice.status === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
                                        <option value="overdue" ${invoice.status === 'overdue' ? 'selected' : ''}>متأخرة</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>تاريخ الإصدار:</label>
                                    <input type="date" name="issueDate" class="form-input" value="${invoice.issueDate}" required>
                                </div>
                                <div class="form-group">
                                    <label>تاريخ الاستحقاق:</label>
                                    <input type="date" name="dueDate" class="form-input" value="${invoice.dueDate}" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>وصف الفاتورة:</label>
                                <textarea name="description" class="form-input" rows="3">${invoice.description || ''}</textarea>
                            </div>
                            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 20px;">
                                <i class="fas fa-save"></i> حفظ التعديلات
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHTML);
    }

    async updateInvoice(event, index) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        this.invoices[index] = {
            ...this.invoices[index],
            invoiceNumber: formData.get('invoiceNumber'),
            clientName: formData.get('clientName'),
            amount: formData.get('amount'),
            status: formData.get('status'),
            issueDate: formData.get('issueDate'),
            dueDate: formData.get('dueDate'),
            description: formData.get('description'),
            updatedAt: new Date().toISOString(),
            updatedBy: this.isMemberLogin ? this.currentUser.email : this.firebaseManager.currentUser.email
        };

        await this.saveCurrentData();
        this.displayInvoices();
        this.closeModal('editInvoiceModal');
        this.showNotification('تم تعديل الفاتورة بنجاح');
    }

    async deleteInvoice(index) {
        if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
            this.invoices.splice(index, 1);
            await this.saveCurrentData();
            this.displayInvoices();
            this.updateStats();
            this.showNotification('تم حذف الفاتورة بنجاح');
        }
    }

    viewInvoice(index) {
        const invoice = this.invoices[index];
        const modalHTML = `
            <div class="modal-overlay" id="viewInvoiceModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-eye"></i> عرض الفاتورة</h3>
                        <button class="close-btn" onclick="contractSystem.closeModal('viewInvoiceModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div><strong>رقم الفاتورة:</strong> ${invoice.invoiceNumber}</div>
                            <div><strong>اسم العميل:</strong> ${invoice.clientName}</div>
                            <div><strong>المبلغ:</strong> ${invoice.amount} ر.ق</div>
                            <div><strong>الحالة:</strong> <span class="status-badge status-${invoice.status}">${this.getStatusText(invoice.status)}</span></div>
                            <div><strong>تاريخ الإصدار:</strong> ${invoice.issueDate}</div>
                            <div><strong>تاريخ الاستحقاق:</strong> ${invoice.dueDate}</div>
                        </div>
                        ${invoice.description ? `<div style="margin-top: 15px;"><strong>الوصف:</strong><br>${invoice.description}</div>` : ''}
                        <div style="margin-top: 15px; font-size: 12px; color: #666;">
                            <div>تم الإنشاء بواسطة: ${invoice.createdBy}</div>
                            <div>تاريخ الإنشاء: ${new Date(invoice.createdAt).toLocaleString('ar-SA')}</div>
                            ${invoice.updatedAt ? `<div>آخر تعديل: ${new Date(invoice.updatedAt).toLocaleString('ar-SA')}</div>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHTML);
    }

    // === إدارة الأعضاء ===
    displayMembers() {
        const tableBody = document.getElementById('usersTableBody');
        tableBody.innerHTML = '';

        if (this.members.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-users" style="font-size: 48px; margin-bottom: 15px; display: block; color: #ccc;"></i>
                        لا توجد أعضاء مضافة حتى الآن
                    </td>
                </tr>
            `;
            return;
        }

        this.members.forEach((member, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${member.fullName}</td>
                <td>${member.email}</td>
                <td>عضو</td>
                <td>${member.joinDate}</td>
                <td><span class="status-badge status-active">نشط</span></td>
                <td>
                    <button class="btn-sm btn-edit" onclick="contractSystem.editMemberPermissions('${member.email}')">
                        <i class="fas fa-shield-alt"></i>
                    </button>
                    <button class="btn-sm btn-delete" onclick="contractSystem.deleteMember(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    showAddMemberModal() {
        const modalHTML = `
            <div class="modal-overlay" id="addMemberModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-plus"></i> إضافة عضو جديد</h3>
                        <button class="close-btn" onclick="contractSystem.closeModal('addMemberModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="addMemberForm" onsubmit="contractSystem.addMember(event)">
                            <div class="form-group">
                                <label>الاسم الكامل:</label>
                                <input type="text" name="fullName" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label>البريد الإلكتروني:</label>
                                <input type="email" name="email" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label>كلمة المرور:</label>
                                <input type="password" name="password" class="form-input" required minlength="6">
                            </div>
                            <div class="form-group">
                                <label>تأكيد كلمة المرور:</label>
                                <input type="password" name="confirmPassword" class="form-input" required minlength="6">
                            </div>
                            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 20px;">
                                <i class="fas fa-user-plus"></i> إضافة العضو
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHTML);
    }

    async addMember(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        if (password !== confirmPassword) {
            this.showNotification('كلمتا المرور غير متطابقتين!', 'error');
            return;
        }

        const memberData = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            password: password, // تخزين كلمة المرور محلياً فقط
            joinDate: new Date().toISOString().split('T')[0],
            createdBy: this.firebaseManager.currentUser.email,
            isMember: true
        };

        // إضافة العضو إلى القائمة
        this.members.push(memberData);
        
        // إنشاء صلاحيات افتراضية للعضو الجديد
        this.permissions[memberData.email] = this.getDefaultMemberPermissions();
        
        await this.saveCurrentData();
        this.displayMembers();
        this.updateStats();
        this.closeModal('addMemberModal');
        this.showNotification('تم إضافة العضو بنجاح');
    }

    async deleteMember(index) {
        if (confirm('هل أنت متأكد من حذف هذا العضو؟')) {
            const memberEmail = this.members[index].email;
            
            // حذف الصلاحيات المرتبطة بالعضو
            delete this.permissions[memberEmail];
            
            this.members.splice(index, 1);
            await this.saveCurrentData();
            this.displayMembers();
            this.updateStats();
            this.showNotification('تم حذف العضو بنجاح');
        }
    }

    editMemberPermissions(memberEmail) {
        this.showSection('settings');
    }

    // === إدارة الصلاحيات ===
    displayPermissions() {
        const permissionsList = document.getElementById('permissionsList');
        permissionsList.innerHTML = '';

        if (this.members.length === 0) {
            permissionsList.innerHTML = '<p style="text-align: center; color: #666;">لا يوجد أعضاء لعرض صلاحياتهم</p>';
            return;
        }

        this.members.forEach(member => {
            const memberPermissions = this.permissions[member.email] || this.getDefaultMemberPermissions();
            
            const permissionHTML = `
                <div class="permission-item">
                    <div class="permission-header">
                        <div class="permission-title">${member.fullName}</div>
                        <div class="user-email">${member.email}</div>
                    </div>
                    <div class="permission-users">
                        <div class="user-permission">
                            <span>منع دخول صفحة العقود</span>
                            <input type="checkbox" ${memberPermissions.denyContracts ? 'checked' : ''} 
                                onchange="contractSystem.updateMemberPermission('${member.email}', 'denyContracts', this.checked)">
                        </div>
                        <div class="user-permission">
                            <span>منع دخول صفحة الفواتير</span>
                            <input type="checkbox" ${memberPermissions.denyInvoices ? 'checked' : ''} 
                                onchange="contractSystem.updateMemberPermission('${member.email}', 'denyInvoices', this.checked)">
                        </div>
                        <div class="user-permission">
                            <span>منع تعديل العقود</span>
                            <input type="checkbox" ${memberPermissions.denyEditContract ? 'checked' : ''} 
                                onchange="contractSystem.updateMemberPermission('${member.email}', 'denyEditContract', this.checked)">
                        </div>
                        <div class="user-permission">
                            <span>منع تعديل الفواتير</span>
                            <input type="checkbox" ${memberPermissions.denyEditInvoice ? 'checked' : ''} 
                                onchange="contractSystem.updateMemberPermission('${member.email}', 'denyEditInvoice', this.checked)">
                        </div>
                        <div class="user-permission">
                            <span>منع دخول الإعدادات</span>
                            <input type="checkbox" ${memberPermissions.denySettings ? 'checked' : ''} 
                                onchange="contractSystem.updateMemberPermission('${member.email}', 'denySettings', this.checked)">
                        </div>
                    </div>
                </div>
            `;
            permissionsList.innerHTML += permissionHTML;
        });

        if (permissionsList.innerHTML === '') {
            permissionsList.innerHTML = '<p style="text-align: center; color: #666;">لا يوجد أعضاء لعرض صلاحياتهم</p>';
        }
    }

    updateMemberPermission(memberEmail, permission, value) {
        if (!this.permissions[memberEmail]) {
            this.permissions[memberEmail] = this.getDefaultMemberPermissions();
        }
        
        this.permissions[memberEmail][permission] = value;
        this.saveCurrentData();
        this.showNotification('تم تحديث الصلاحيات بنجاح');
    }

    // === دوال مساعدة ===
    getDefaultMemberPermissions() {
        return {
            denyContracts: false,
            denyInvoices: false,
            denyEditContract: false,
            denyEditInvoice: false,
            denySettings: true,
            denyAddContract: false,
            denyAddInvoice: false
        };
    }

    getStatusText(status) {
        const statusMap = {
            'active': 'نشط',
            'pending': 'قيد الانتظار',
            'completed': 'مكتمل',
            'cancelled': 'ملغى',
            'paid': 'مدفوعة',
            'overdue': 'متأخرة'
        };
        return statusMap[status] || status;
    }

    showModal(html) {
        this.closeAllModals();
        document.getElementById('modalContainer').innerHTML = html;
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.remove();
    }

    closeAllModals() {
        document.getElementById('modalContainer').innerHTML = '';
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
        
        document.getElementById('notificationContainer').appendChild(notification);
        
        // إزالة الإشعار تلقائياً بعد 5 ثواني
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    async logout() {
        if (this.isMemberLogin) {
            // تسجيل خروج العضو
            this.currentUser = null;
            this.isMemberLogin = false;
        } else {
            // تسجيل خروج المدير
            await this.firebaseManager.logout();
        }
        
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
        
        // مسح الحقول
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        
        this.showNotification('تم تسجيل الخروج بنجاح');
    }

    checkAuthStatus() {
        console.log('🔍 Checking auth status...');
    }

    exportData() {
        this.showNotification('جاري تصدير البيانات...', 'info');
    }
}

// مدير Firebase
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
            
            userData._metadata = userData._metadata || {};
            userData._metadata.lastUpdated = new Date().toISOString();
            userData._metadata.lastUpdatedBy = this.currentUser.email;
            userData._metadata.userId = userId;
            
            // حفظ البيانات في Firestore للحساب الرئيسي
            await this.db.collection('userData').doc(userId).set(userData, { merge: true });
            
            // أيضًا حفظ نسخة محلية
            localStorage.setItem(`userData_${userId}`, JSON.stringify(userData));
            
            console.log('💾 Main account data saved to Firebase');
            return { success: true };
        } catch (error) {
            console.error('❌ Save user data error:', error);
            
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
                console.log('📱 Loading data from local storage for user:', userId);
                return { 
                    success: true, 
                    data: JSON.parse(localData),
                    source: 'local'
                };
            }
            
            // ثانياً: جلب البيانات من Firebase للحساب الرئيسي
            const doc = await this.db.collection('userData').doc(userId).get();
            
            if (doc.exists) {
                const data = doc.data();
                
                // حفظ نسخة محلية
                localStorage.setItem(`userData_${userId}`, JSON.stringify(data));
                
                console.log('☁️ Loading data from Firebase for user:', userId);
                return { 
                    success: true, 
                    data: data,
                    source: 'firebase'
                };
            } else {
                // إذا لم توجد بيانات، إنشاء بيانات افتراضية للحساب الرئيسي
                console.log('🆕 No data found, creating default data for user:', userId);
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
                    console.log('🔄 Using local data as fallback for user:', this.currentUser.uid);
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
                role: 'admin',
                joinDate: currentDate,
                lastLogin: new Date().toISOString()
            },
            contracts: [],
            invoices: [],
            members: [], // تغيير من users إلى members
            permissions: {},
            settings: {
                theme: 'dark-gold',
                language: 'ar'
            },
            _metadata: {
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                createdBy: this.currentUser?.email || 'system',
                userId: this.currentUser?.uid || ''
            }
        };
    }
}

// تهيئة النظام
document.addEventListener('DOMContentLoaded', () => {
    window.contractSystem = new ContractManagementSystem();
    console.log('🚀 نظام إدارة العقود والفواتير جاهز للاستخدام!');
    
    // إضافة مكتبة Excel إذا لم تكن موجودة
    if (typeof XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = () => console.log('✅ Excel library loaded');
        document.head.appendChild(script);
    }
});
