// نظام إدارة العقود والفواتير - النسخة المحسنة
class ContractManagementSystem {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.firebaseManager = new FirebaseManager();
        this.contracts = [];
        this.invoices = [];
        this.members = [];
        this.permissions = {};
        this.isMemberLogin = false;
        this.currentMember = null;
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
            this.currentMember = null;
            this.showDashboard();
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    // تسجيل دخول العضو
    async handleMemberLogin(email, password) {
        if (!email || !password) {
            this.showNotification('يرجى ملء جميع الحقول', 'error');
            return false;
        }

        this.showNotification('جاري تسجيل الدخول...', 'info');

        try {
            // جلب بيانات الحساب الرئيسي أولاً للتحقق من الأعضاء
            const mainAccountData = await this.firebaseManager.getMainAccountData();
            
            if (!mainAccountData || !mainAccountData.members) {
                this.showNotification('لا توجد بيانات أعضاء', 'error');
                return false;
            }

            // البحث عن العضو في قائمة الأعضاء
            const member = mainAccountData.members.find(m => 
                m.email === email && m.password === password
            );
            
            if (member) {
                // تسجيل دخول العضو
                this.currentMember = member;
                this.currentUser = {
                    email: member.email,
                    name: member.fullName,
                    isMember: true
                };
                
                this.isMemberLogin = true;
                
                // تحميل بيانات العضو
                await this.loadMemberData();
                this.showDashboard();
                return true;
            } else {
                this.showNotification('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
                return false;
            }
        } catch (error) {
            console.error('Member login error:', error);
            this.showNotification('خطأ في تسجيل الدخول', 'error');
            return false;
        }
    }

    async loadMainAccountData() {
        try {
            const result = await this.firebaseManager.getUserData();
            
            if (result.success) {
                this.userData = result.data;
                this.contracts = this.userData.contracts || [];
                this.invoices = this.userData.invoices || [];
                this.members = this.userData.members || [];
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

    async loadMemberData() {
        try {
            // الأعضاء يشاهدون نفس بيانات الحساب الرئيسي ولكن مع قيود
            const result = await this.firebaseManager.getMainAccountData();
            
            if (result.success) {
                this.userData = result.data;
                this.contracts = this.userData.contracts || [];
                this.invoices = this.userData.invoices || [];
                this.members = this.userData.members || [];
                this.permissions = this.userData.permissions || {};
                
                console.log('📊 Member loaded data:', {
                    contracts: this.contracts.length,
                    invoices: this.invoices.length,
                    email: this.currentMember.email
                });
                
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Load member data error:', error);
            this.showNotification('خطأ في تحميل البيانات', 'error');
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
            this.userData.members = this.members;
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
        if (!this.isMemberLogin) {
            this.displayMembers();
        }
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
                (sectionName === 'settings' && userPermissions.denySettings) ||
                (sectionName === 'users' && this.isMemberLogin)) {
                
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
            'settings': 'صفحة الإعدادات',
            'users': 'صفحة إدارة الأعضاء'
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
                        <form id="memberLoginForm">
                            <div class="form-group">
                                <label>البريد الإلكتروني:</label>
                                <input type="email" id="memberEmail" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label>كلمة المرور:</label>
                                <input type="password" id="memberPassword" class="form-input" required>
                            </div>
                            <button type="button" class="btn-primary" style="width: 100%;" onclick="contractSystem.handleMemberLoginForm()">
                                <i class="fas fa-sign-in-alt"></i> تسجيل الدخول
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHTML);
    }

    async handleMemberLoginForm() {
        const email = document.getElementById('memberEmail').value;
        const password = document.getElementById('memberPassword').value;
        
        const success = await this.handleMemberLogin(email, password);
        if (success) {
            this.closeModal('memberLoginModal');
        }
    }

    // === عرض الملف الشخصي ===
    showProfileSection() {
        if (this.isMemberLogin) {
            this.showMemberProfile();
        } else {
            this.showMainProfile();
        }
    }

    showMemberProfile() {
        const modalHTML = `
            <div class="modal-overlay" id="memberProfileModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-user"></i> الملف الشخصي للعضو</h3>
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
                            <div class="profile-item">
                                <strong>تاريخ الانضمام:</strong> ${this.currentMember.joinDate}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHTML);
    }

    showMainProfile() {
        const modalHTML = `
            <div class="modal-overlay" id="mainProfileModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-cog"></i> الملف الشخصي للمدير</h3>
                        <button class="close-btn" onclick="contractSystem.closeModal('mainProfileModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="profile-info">
                            <div class="profile-item">
                                <strong>الاسم:</strong> ${this.userData?.userProfile?.name || ''}
                            </div>
                            <div class="profile-item">
                                <strong>البريد الإلكتروني:</strong> ${this.firebaseManager.currentUser.email}
                            </div>
                            <div class="profile-item">
                                <strong>الدور:</strong> مدير النظام
                            </div>
                            <div class="profile-item">
                                <strong>عدد العقود:</strong> ${this.contracts.length}
                            </div>
                            <div class="profile-item">
                                <strong>عدد الفواتير:</strong> ${this.invoices.length}
                            </div>
                            <div class="profile-item">
                                <strong>عدد الأعضاء:</strong> ${this.members.length}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHTML);
    }

    // === باقي دوال إدارة العقود والفواتير تبقى كما هي ===
    // ... (displayContracts, showAddContractModal, addContract, editContract, etc.)

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
                        <i class="fas fa-shield-alt"></i> الصلاحيات
                    </button>
                    <button class="btn-sm btn-delete" onclick="contractSystem.deleteMember(${index})">
                        <i class="fas fa-trash"></i> حذف
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
                        <form id="addMemberForm">
                            <div class="form-group">
                                <label>الاسم الكامل:</label>
                                <input type="text" id="memberFullName" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label>البريد الإلكتروني:</label>
                                <input type="email" id="memberEmailAdd" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label>كلمة المرور:</label>
                                <input type="password" id="memberPasswordAdd" class="form-input" required minlength="6">
                            </div>
                            <div class="form-group">
                                <label>تأكيد كلمة المرور:</label>
                                <input type="password" id="memberConfirmPassword" class="form-input" required minlength="6">
                            </div>
                            <button type="button" class="btn-primary" style="width: 100%; margin-top: 20px;" onclick="contractSystem.addMember()">
                                <i class="fas fa-user-plus"></i> إضافة العضو
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        this.showModal(modalHTML);
    }

    async addMember() {
        const fullName = document.getElementById('memberFullName').value;
        const email = document.getElementById('memberEmailAdd').value;
        const password = document.getElementById('memberPasswordAdd').value;
        const confirmPassword = document.getElementById('memberConfirmPassword').value;
        
        if (!fullName || !email || !password || !confirmPassword) {
            this.showNotification('يرجى ملء جميع الحقول', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showNotification('كلمتا المرور غير متطابقتين!', 'error');
            return;
        }

        // التحقق من عدم وجود عضو بنفس البريد الإلكتروني
        const existingMember = this.members.find(m => m.email === email);
        if (existingMember) {
            this.showNotification('هذا البريد الإلكتروني مسجل بالفعل!', 'error');
            return;
        }

        const memberData = {
            fullName: fullName,
            email: email,
            password: password,
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

    async updateMemberPermission(memberEmail, permission, value) {
        if (!this.permissions[memberEmail]) {
            this.permissions[memberEmail] = this.getDefaultMemberPermissions();
        }
        
        this.permissions[memberEmail][permission] = value;
        await this.saveCurrentData();
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
            this.currentMember = null;
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

// مدير Firebase المحسن
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
            userData._metadata.userId = userId;
            userData._metadata.userEmail = this.currentUser.email;
            
            await this.db.collection('users').doc(userId).set(userData, { merge: true });
            
            console.log('💾 Data saved to Firebase successfully');
            return { success: true };
        } catch (error) {
            console.error('❌ Save data error:', error);
            return { success: false, error: error.message };
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
            const docRef = this.db.collection('users').doc(userId);
            const doc = await docRef.get();
            
            if (doc.exists) {
                const data = doc.data();
                console.log('📥 Data loaded from Firebase');
                return { 
                    success: true, 
                    data: data,
                    source: 'firebase'
                };
            } else {
                console.log('📝 No data found, creating default data');
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
            return { success: false, error: error.message };
        }
    }

    // دالة جديدة لجلب بيانات الحساب الرئيسي (للاستخدام من قبل الأعضاء)
    async getMainAccountData() {
        try {
            if (!this.isInitialized) {
                await this.init();
            }

            // نفترض أن هناك مستند رئيسي واحد يخزن بيانات النظام
            const mainDocRef = this.db.collection('system').doc('main_account');
            const doc = await mainDocRef.get();
            
            if (doc.exists) {
                const data = doc.data();
                console.log('📥 Main account data loaded from Firebase');
                return { 
                    success: true, 
                    data: data,
                    source: 'firebase'
                };
            } else {
                console.log('📝 No main account data found');
                return { success: false, error: 'No main account data found' };
            }
        } catch (error) {
            console.error('❌ Get main account data error:', error);
            return { success: false, error: error.message };
        }
    }

    getDefaultUserData() {
        return {
            userProfile: {
                name: '',
                email: this.currentUser?.email || '',
                lastLogin: new Date().toISOString(),
                createdDate: new Date().toISOString()
            },
            contracts: [],
            invoices: [],
            members: [],
            permissions: {},
            _metadata: {
                created: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                userId: this.currentUser?.uid || '',
                userEmail: this.currentUser?.email || ''
            }
        };
    }
}

// تهيئة النظام عند تحميل الصفحة
let contractSystem;
document.addEventListener('DOMContentLoaded', function() {
    contractSystem = new ContractManagementSystem();
});
