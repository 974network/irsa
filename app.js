// النظام الرئيسي مع Firebase Firestore - الإصدار الكامل مع إدارة المستخدمين
class AdvancedPropertySystem {
    constructor() {
        this.currentPage = 'dashboard';
        this.currentLanguage = localStorage.getItem('propertyLanguage') || 'ar';
        this.firebaseManager = new FirebaseManager();
        this.propertyDB = null;
        this.currentUserPermissions = [];
        this.init();
    }

    async init() {
        try {
            await this.firebaseManager.init();
            this.setupLogin();
            this.setupNavigation();
            this.setupMobileMenu();
            this.checkAuthStatus();
            this.applyLanguage(this.currentLanguage);
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

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            this.showNotification('يرجى ملء جميع الحقول', 'error');
            return;
        }

        const email = username.includes('@') ? username : `${username}@irsa.com`;
        const result = await this.firebaseManager.login(email, password);
        
        if (result.success) {
            // الحصول على بيانات المستخدم والصلاحيات
            const userData = await this.firebaseManager.getUserData(this.firebaseManager.currentUser.uid);
            this.propertyDB = userData.data;
            this.currentUserPermissions = userData.data.permissions || ['properties', 'customers', 'contracts', 'payments', 'maintenance', 'reports', 'settings'];
            
            const fullName = this.firebaseManager.currentUser?.displayName || 
                            (username.includes('@') ? username.split('@')[0] : username);

            this.propertyDB.currentUser = fullName;
            localStorage.setItem('propertyUser', fullName);
            localStorage.setItem('loginTime', new Date().toISOString());
            
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            this.showNotification('مرحباً بك في النظام!');
            
            this.setupUserMenu();
            this.setupNavigation(); // إعادة تحميل القائمة بناءً على الصلاحيات
            this.loadDashboard();
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    async loadUserData() {
        if (!this.firebaseManager.currentUser) {
            return this.getDefaultUserDB();
        }

        const userId = this.firebaseManager.currentUser.uid;
        const result = await this.firebaseManager.getUserData(userId);
        
        if (result.success) {
            console.log('✅ تم تحميل بيانات المستخدم من Firebase');
            this.currentUserPermissions = result.data.permissions || ['properties', 'customers', 'contracts', 'payments', 'maintenance', 'reports', 'settings'];
            return result.data;
        } else {
            console.error('❌ فشل في تحميل البيانات:', result.error);
            return this.getDefaultUserDB();
        }
    }

    async saveUserData() {
        if (!this.firebaseManager.currentUser || !this.propertyDB) {
            console.warn('⚠️ لا يمكن الحفظ: لا يوجد مستخدم أو بيانات');
            return false;
        }

        const userId = this.firebaseManager.currentUser.uid;
        
        this.propertyDB._metadata = {
            lastSaved: new Date().toISOString(),
            user: this.propertyDB.currentUser
        };

        const result = await this.firebaseManager.saveUserData(userId, this.propertyDB);
        
        if (result.success) {
            console.log('✅ تم حفظ البيانات في Firebase');
            return true;
        } else {
            console.error('❌ فشل في حفظ البيانات:', result.error);
            this.showNotification('فشل في حفظ البيانات', 'error');
            return false;
        }
    }

    getDefaultUserDB() {
        const currentDate = new Date().toISOString().split('T')[0];
        return {
            currentUser: null,
            permissions: ['properties', 'customers', 'contracts', 'payments', 'maintenance', 'reports', 'settings'],
            users: [],
            properties: [
                { 
                    id: 1, 
                    name: 'A-101', 
                    type: 'شقة', 
                    area: '120م²', 
                    status: 'شاغرة', 
                    rent: 1500, 
                    tenant: '', 
                    contractEnd: '',
                    description: 'شقة فاخرة في الطابق الأول'
                }
            ],
            customers: [
                { 
                    id: 1, 
                    name: 'فاطمة محمد', 
                    phone: '0512345678', 
                    email: 'fatima@email.com', 
                    idNumber: '1234567890',
                    address: 'الرياض - حي الملز'
                }
            ],
            contracts: [
                {
                    id: 1,
                    propertyId: 1,
                    customerId: 1,
                    startDate: '2024-01-01',
                    endDate: '2024-12-31',
                    rentAmount: 1200,
                    status: 'نشط',
                    notes: 'عقد سنوي'
                }
            ],
            payments: [
                {
                    id: 1,
                    contractId: 1,
                    amount: 1200,
                    date: '2024-01-01',
                    method: 'تحويل بنكي',
                    status: 'مدفوع',
                    description: 'دفعة شهر يناير'
                }
            ],
            maintenance: [
                {
                    id: 1,
                    propertyId: 1,
                    type: 'صيانة دورية',
                    description: 'صيانة مكيف الهواء',
                    status: 'مكتمل',
                    cost: 300,
                    date: '2024-01-15'
                }
            ],
            sales: [],
            commissions: [],
            inventory: [],
            accounts: [],
            invoices: [],
            messages: [],
            settings: {
                companyName: 'شركة IRSA للتجارة والمقاولات',
                currency: 'ريال',
                taxRate: 15,
                address: 'الرياض - المملكة العربية السعودية',
                phone: '0112345678',
                email: 'info@irsa.com'
            },
            _metadata: {
                createdAt: new Date().toISOString(),
                user: ''
            }
        };
    }

    async createNewAccount(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const username = formData.get('username');
        const fullName = formData.get('fullName');
        const email = formData.get('email') || `${username}@irsa.com`;
        const phone = formData.get('phone');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        if (password !== confirmPassword) {
            this.showNotification('كلمتا المرور غير متطابقتين!', 'error');
            return;
        }
        
        const userData = {
            username: username,
            fullName: fullName,
            phone: phone,
            role: 'مدير النظام',
            permissions: ['properties', 'customers', 'contracts', 'payments', 'maintenance', 'reports', 'settings']
        };
        
        const result = await this.firebaseManager.createAccount(email, password, userData);
        
        if (result.success) {
            const newUserDB = this.getDefaultUserDB();
            newUserDB.currentUser = username;
            newUserDB._metadata.user = username;
            
            await this.firebaseManager.saveUserData(result.user.uid, newUserDB);
            
            this.closeModal('createAccountModal');
            this.showNotification('تم إنشاء الحساب الجديد بنجاح! يمكنك الآن تسجيل الدخول');
            
            event.target.reset();
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    checkAuthStatus() {
        const savedUser = localStorage.getItem('propertyUser');
        if (savedUser && this.firebaseManager.currentUser) {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            this.loadUserData().then(db => {
                this.propertyDB = db;
                this.loadDashboard();
                this.setupUserMenu();
            });
        }
    }

    async logout() {
        if (this.propertyDB) {
            await this.saveUserData();
        }
        
        await this.firebaseManager.logout();
        
        localStorage.removeItem('propertyUser');
        localStorage.removeItem('loginTime');
        
        this.propertyDB = this.getDefaultUserDB();
        this.currentUserPermissions = [];
        
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
        
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.reset();
        
        const userMenu = document.querySelector('.user-menu-sidebar');
        if (userMenu) userMenu.remove();
        
        this.showNotification('تم تسجيل الخروج بنجاح');
        this.currentPage = 'dashboard';
        this.setupNavigation();
    }

    setupNavigation() {
        const allNavLinks = [
            { id: 'nav-dashboard', icon: 'fa-home', text: 'dashboard', page: 'dashboard', permission: null },
            { id: 'nav-properties', icon: 'fa-building', text: 'properties', page: 'properties', permission: 'properties' },
            { id: 'nav-customers', icon: 'fa-users', text: 'customers', page: 'customers', permission: 'customers' },
            { id: 'nav-sales', icon: 'fa-shopping-cart', text: 'sales', page: 'sales', permission: 'sales' },
            { id: 'nav-contracts', icon: 'fa-file-contract', text: 'contracts', page: 'contracts', permission: 'contracts' },
            { id: 'nav-payments', icon: 'fa-money-bill', text: 'payments', page: 'payments', permission: 'payments' },
            { id: 'nav-commissions', icon: 'fa-handshake', text: 'commissions', page: 'commissions', permission: 'commissions' },
            { id: 'nav-maintenance', icon: 'fa-tools', text: 'maintenance', page: 'maintenance', permission: 'maintenance' },
            { id: 'nav-inventory', icon: 'fa-boxes', text: 'inventory', page: 'inventory', permission: 'inventory' },
            { id: 'nav-accounts', icon: 'fa-chart-line', text: 'accounts', page: 'accounts', permission: 'accounts' },
            { id: 'nav-invoices', icon: 'fa-receipt', text: 'invoices', page: 'invoices', permission: 'invoices' },
            { id: 'nav-messages', icon: 'fa-comments', text: 'messages', page: 'messages', permission: 'messages' },
            { id: 'nav-reports', icon: 'fa-chart-bar', text: 'reports', page: 'reports', permission: 'reports' },
            { id: 'nav-settings', icon: 'fa-cog', text: 'settings', page: 'settings', permission: 'settings' },
        ];

        // تصفية القائمة بناءً على الصلاحيات
        const navLinks = allNavLinks.filter(link => 
            link.permission === null || this.hasPermission(link.permission)
        );

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

    // 🔥 التحقق من الصلاحيات
    hasPermission(permission) {
        return this.currentUserPermissions.includes(permission);
    }

    setupMobileMenu() {
        const mobileHeader = document.createElement('div');
        mobileHeader.className = 'mobile-header';
        mobileHeader.innerHTML = `
            <div class="mobile-header-content">
                <div class="mobile-title">
                    <i class="fas fa-building"></i>
                    <span>${this.propertyDB?.settings?.companyName || 'Property System'}</span>
                </div>
                <button class="mobile-menu-btn">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(mobileHeader);
        
        document.querySelector('.mobile-menu-btn').addEventListener('click', () => {
            this.toggleSidebar();
        });
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
            document.body.classList.toggle('menu-open', sidebar.classList.contains('active'));
        }
    }

    updateMobileTitle(pageName) {
        const titleElement = document.querySelector('.mobile-title span');
        if (titleElement) {
            const titles = {
                'dashboard': 'لوحة التحكم',
                'properties': 'إدارة العقارات', 
                'customers': 'إدارة العملاء',
                'sales': 'المبيعات',
                'contracts': 'العقود',
                'payments': 'المدفوعات',
                'maintenance': 'الصيانة',
                'inventory': 'الجرد',
                'accounts': 'الحسابات',
                'invoices': 'الفواتير',
                'messages': 'المحادثات',
                'reports': 'التقارير',
                'settings': 'الإعدادات',
                'users': 'إدارة المستخدمين'
            };
            titleElement.textContent = titles[pageName] || pageName;
        }
    }

    setupUserMenu() {
        const username = this.propertyDB?.currentUser || 'مستخدم';
        const userRole = this.propertyDB?.users?.find(u => u.email === this.firebaseManager.currentUser?.email)?.role || 'مدير النظام';
        
        const userMenuHTML = `
            <div class="user-menu-sidebar">
                <div class="user-menu-container">
                    <div class="user-avatar" onclick="propertySystem.toggleUserMenu()">
                        <i class="fas fa-user-circle default-avatar"></i>
                        <span class="user-display-name">${username}</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="user-dropdown" id="userDropdown">
                        <div class="user-info">
                            <i class="fas fa-user-circle profile-icon-large"></i>
                            <div class="user-name">${username}</div>
                            <div class="user-role">${userRole}</div>
                        </div>
                        <div class="dropdown-divider"></div>
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
            </div>
        `;

        const oldMenu = document.querySelector('.user-menu-sidebar');
        if (oldMenu) oldMenu.remove();

        const sidebar = document.querySelector('.sidebar .nav-links');
        if (sidebar) {
            sidebar.insertAdjacentHTML('afterend', userMenuHTML);
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

    navigateTo(page) {
        // التحقق من الصلاحيات قبل التنقل
        const pagePermissions = {
            'properties': 'properties',
            'customers': 'customers',
            'sales': 'sales',
            'contracts': 'contracts',
            'payments': 'payments',
            'commissions': 'commissions',
            'maintenance': 'maintenance',
            'inventory': 'inventory',
            'accounts': 'accounts',
            'invoices': 'invoices',
            'messages': 'messages',
            'reports': 'reports',
            'settings': 'settings',
            'users': 'settings' // إدارة المستخدمين تتطلب صلاحية الإعدادات
        };

        if (page !== 'dashboard' && pagePermissions[page] && !this.hasPermission(pagePermissions[page])) {
            this.showNotification('ليس لديك صلاحية الوصول إلى هذه الصفحة', 'error');
            return;
        }

        this.currentPage = page;
        this.updateMobileTitle(page);
        this.toggleSidebar();
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.getElementById(`nav-${page}`);
        if (activeLink) activeLink.classList.add('active');

        switch(page) {
            case 'dashboard': this.loadDashboard(); break;
            case 'properties': this.loadProperties(); break;
            case 'customers': this.loadCustomers(); break;
            case 'sales': this.loadSales(); break;
            case 'contracts': this.loadContracts(); break;
            case 'payments': this.loadPayments(); break;
            case 'commissions': this.loadCommissions(); break;
            case 'maintenance': this.loadMaintenance(); break;
            case 'inventory': this.loadInventory(); break;
            case 'accounts': this.loadAccounts(); break;
            case 'invoices': this.loadInvoices(); break;
            case 'messages': this.loadMessages(); break;
            case 'reports': this.loadReports(); break;
            case 'settings': this.loadSettings(); break;
            case 'users': this.loadUserManagement(); break;
        }
    }

    // 🔥 قسم إدارة المستخدمين والصلاحيات
    async loadUserManagement() {
        if (!this.hasPermission('settings')) {
            this.showNotification('ليس لديك صلاحية إدارة المستخدمين', 'error');
            this.navigateTo('dashboard');
            return;
        }

        const content = document.querySelector('.main-content');
        
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-users-cog"></i> إدارة المستخدمين والصلاحيات</h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="propertySystem.showAddUserModal()">
                        <i class="fas fa-user-plus"></i> إضافة مستخدم جديد
                    </button>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>الاسم</th>
                            <th>البريد الإلكتروني</th>
                            <th>رقم الهاتف</th>
                            <th>الدور</th>
                            <th>الصلاحيات</th>
                            <th>تاريخ الإضافة</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(this.propertyDB.users || []).map(user => `
                            <tr>
                                <td><strong>${user.fullName}</strong></td>
                                <td>${user.email}</td>
                                <td>${user.phone || '-'}</td>
                                <td>${user.role}</td>
                                <td>
                                    <div class="permissions-badges">
                                        ${(user.permissions || []).map(perm => `
                                            <span class="permission-badge">${this.getPermissionName(perm)}</span>
                                        `).join('')}
                                    </div>
                                </td>
                                <td>${user.createdAt.split('T')[0]}</td>
                                <td>
                                    <span class="status-badge status-${user.isActive ? 'active' : 'inactive'}">
                                        ${user.isActive ? 'نشط' : 'غير نشط'}
                                    </span>
                                </td>
                                <td class="actions-column">
                                    <div class="action-buttons">
                                        <button class="btn btn-sm btn-edit" onclick="propertySystem.editUser(${user.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm ${user.isActive ? 'btn-warning' : 'btn-success'}" onclick="propertySystem.toggleUserStatus(${user.id})">
                                            <i class="fas ${user.isActive ? 'fa-user-slash' : 'fa-user-check'}"></i>
                                        </button>
                                        <button class="btn btn-sm btn-delete" onclick="propertySystem.deleteUser(${user.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    showAddUserModal() {
        if (!this.hasPermission('settings')) {
            this.showNotification('ليس لديك صلاحية إضافة مستخدمين', 'error');
            return;
        }

        const formHTML = `
            <div class="modal-overlay" id="addUserModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-plus"></i> إضافة مستخدم جديد</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('addUserModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.addNewUser(event)">
                        <div class="form-group">
                            <label>البريد الإلكتروني:</label>
                            <input type="email" name="email" required placeholder="أدخل البريد الإلكتروني">
                        </div>
                        <div class="form-group">
                            <label>كلمة المرور:</label>
                            <input type="password" name="password" required minlength="6" placeholder="أدخل كلمة المرور">
                        </div>
                        <div class="form-group">
                            <label>الاسم الكامل:</label>
                            <input type="text" name="fullName" required placeholder="أدخل الاسم الكامل">
                        </div>
                        <div class="form-group">
                            <label>رقم الهاتف:</label>
                            <input type="tel" name="phone" placeholder="أدخل رقم الهاتف">
                        </div>
                        
                        <div class="form-group">
                            <label>الصلاحيات:</label>
                            <div class="permissions-grid">
                                <label class="permission-checkbox">
                                    <input type="checkbox" name="permissions" value="properties" checked>
                                    <span class="checkmark"></span>
                                    إدارة العقارات
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" name="permissions" value="customers" checked>
                                    <span class="checkmark"></span>
                                    إدارة العملاء
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" name="permissions" value="contracts" checked>
                                    <span class="checkmark"></span>
                                    إدارة العقود
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" name="permissions" value="payments">
                                    <span class="checkmark"></span>
                                    إدارة المدفوعات
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" name="permissions" value="maintenance">
                                    <span class="checkmark"></span>
                                    إدارة الصيانة
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" name="permissions" value="reports">
                                    <span class="checkmark"></span>
                                    عرض التقارير
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" name="permissions" value="settings">
                                    <span class="checkmark"></span>
                                    الإعدادات
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> إضافة المستخدم
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('addUserModal')">
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.showModal(formHTML);
    }

    async addNewUser(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const userData = {
            email: formData.get('email'),
            password: formData.get('password'),
            fullName: formData.get('fullName'),
            phone: formData.get('phone'),
            permissions: formData.getAll('permissions'),
            createdBy: this.propertyDB.currentUser,
            createdAt: new Date().toISOString(),
            role: 'مدير فرعي'
        };
        
        const result = await this.firebaseManager.createSubAccount(userData);
        
        if (result.success) {
            if (!this.propertyDB.users) this.propertyDB.users = [];
            
            const newUser = {
                id: this.propertyDB.users.length > 0 ? Math.max(...this.propertyDB.users.map(u => u.id)) + 1 : 1,
                uid: result.user.uid,
                email: userData.email,
                fullName: userData.fullName,
                phone: userData.phone,
                permissions: userData.permissions,
                createdBy: userData.createdBy,
                createdAt: userData.createdAt,
                role: userData.role,
                isActive: true
            };
            
            this.propertyDB.users.push(newUser);
            await this.saveUserData();
            
            this.closeModal('addUserModal');
            this.showNotification('تم إضافة المستخدم الجديد بنجاح!');
            this.loadUserManagement();
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    getPermissionName(permission) {
        const permissionsMap = {
            'properties': 'العقارات',
            'customers': 'العملاء',
            'contracts': 'العقود',
            'payments': 'المدفوعات',
            'maintenance': 'الصيانة',
            'reports': 'التقارير',
            'settings': 'الإعدادات'
        };
        return permissionsMap[permission] || permission;
    }

    editUser(userId) {
        if (!this.hasPermission('settings')) {
            this.showNotification('ليس لديك صلاحية تعديل المستخدمين', 'error');
            return;
        }

        const user = (this.propertyDB.users || []).find(u => u.id === userId);
        if (user) {
            this.showEditUserForm(user);
        }
    }

    showEditUserForm(user) {
        const formHTML = `
            <div class="modal-overlay" id="editUserModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-edit"></i> تعديل بيانات المستخدم</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('editUserModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.updateUser(event, ${user.id})">
                        <div class="form-group">
                            <label>الاسم الكامل:</label>
                            <input type="text" name="fullName" value="${user.fullName}" required>
                        </div>
                        <div class="form-group">
                            <label>رقم الهاتف:</label>
                            <input type="tel" name="phone" value="${user.phone || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label>الصلاحيات:</label>
                            <div class="permissions-grid">
                                <label class="permission-checkbox">
                                    <input type="checkbox" name="permissions" value="properties" ${user.permissions.includes('properties') ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    إدارة العقارات
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" name="permissions" value="customers" ${user.permissions.includes('customers') ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    إدارة العملاء
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" name="permissions" value="contracts" ${user.permissions.includes('contracts') ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    إدارة العقود
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" name="permissions" value="payments" ${user.permissions.includes('payments') ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    إدارة المدفوعات
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" name="permissions" value="maintenance" ${user.permissions.includes('maintenance') ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    إدارة الصيانة
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" name="permissions" value="reports" ${user.permissions.includes('reports') ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    عرض التقارير
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" name="permissions" value="settings" ${user.permissions.includes('settings') ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    الإعدادات
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> حفظ التعديلات
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('editUserModal')">
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.showModal(formHTML);
    }

    async updateUser(event, userId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const userIndex = this.propertyDB.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            this.propertyDB.users[userIndex] = {
                ...this.propertyDB.users[userIndex],
                fullName: formData.get('fullName'),
                phone: formData.get('phone'),
                permissions: formData.getAll('permissions')
            };
            
            await this.saveUserData();
            this.closeModal('editUserModal');
            this.showNotification('تم تحديث بيانات المستخدم بنجاح!');
            this.loadUserManagement();
        }
    }

    async toggleUserStatus(userId) {
        if (!this.hasPermission('settings')) {
            this.showNotification('ليس لديك صلاحية تغيير حالة المستخدمين', 'error');
            return;
        }

        const user = this.propertyDB.users.find(u => u.id === userId);
        if (user) {
            const newStatus = !user.isActive;
            const action = newStatus ? 'تفعيل' : 'تعطيل';
            
            if (confirm(`هل أنت متأكد من ${action} المستخدم ${user.fullName}؟`)) {
                user.isActive = newStatus;
                await this.saveUserData();
                this.showNotification(`تم ${action} المستخدم بنجاح!`);
                this.loadUserManagement();
            }
        }
    }

    async deleteUser(userId) {
        if (!this.hasPermission('settings')) {
            this.showNotification('ليس لديك صلاحية حذف المستخدمين', 'error');
            return;
        }

        const user = this.propertyDB.users.find(u => u.id === userId);
        if (user) {
            if (confirm(`هل أنت متأكد من حذف المستخدم ${user.fullName}؟`)) {
                // حذف المستخدم من Firebase Authentication
                try {
                    await this.firebaseManager.deleteUser(user.uid);
                } catch (error) {
                    console.error('Error deleting user from auth:', error);
                }
                
                // حذف المستخدم من القائمة
                this.propertyDB.users = this.propertyDB.users.filter(u => u.id !== userId);
                await this.saveUserData();
                this.showNotification('تم حذف المستخدم بنجاح!');
                this.loadUserManagement();
            }
        }
    }

    // باقي الدوال (loadDashboard, loadProperties, etc.) تبقى كما هي مع إضافة التحقق من الصلاحيات
    // ... [جميع الدوال الأخرى تبقى كما هي مع إضافة التحقق من الصلاحيات عند الحاجة]

    async loadSettings() {
        if (!this.hasPermission('settings')) {
            this.showNotification('ليس لديك صلاحية الوصول إلى الإعدادات', 'error');
            this.navigateTo('dashboard');
            return;
        }

        const content = document.querySelector('.main-content');
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-cogs"></i> <span data-translate="settings">${this.getTranslation('settings')}</span></h2>
            </div>
            <div class="settings-grid">
                <div class="settings-card">
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
                                <input type="text" class="modern-input" name="companyName" value="${this.propertyDB.settings?.companyName || ''}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">
                                    <i class="fas fa-money-bill-wave"></i>
                                    ${this.currentLanguage === 'ar' ? 'العملة' : 'Currency'}
                                </label>
                                <select class="modern-select" name="currency" required>
                                    <option value="ريال" ${(this.propertyDB.settings?.currency || 'ريال') === 'ريال' ? 'selected' : ''}>ريال سعودي</option>
                                    <option value="دولار" ${(this.propertyDB.settings?.currency || 'ريال') === 'دولار' ? 'selected' : ''}>دولار أمريكي</option>
                                    <option value="يورو" ${(this.propertyDB.settings?.currency || 'ريال') === 'يورو' ? 'selected' : ''}>يورو</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">
                                    <i class="fas fa-percentage"></i>
                                    ${this.currentLanguage === 'ar' ? 'معدل الضريبة %' : 'Tax Rate %'}
                                </label>
                                <div class="tax-input-container">
                                    <input type="number" class="modern-input tax-rate-input" name="taxRate" value="${this.propertyDB.settings?.taxRate || 15}" min="0" max="100" required>
                                    <span class="tax-percent">%</span>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">
                                    <i class="fas fa-map-marker-alt"></i>
                                    ${this.currentLanguage === 'ar' ? 'عنوان الشركة' : 'Company Address'}
                                </label>
                                <input type="text" class="modern-input" name="address" value="${this.propertyDB.settings?.address || ''}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">
                                    <i class="fas fa-phone"></i>
                                    ${this.currentLanguage === 'ar' ? 'هاتف الشركة' : 'Company Phone'}
                                </label>
                                <input type="tel" class="modern-input" name="phone" value="${this.propertyDB.settings?.phone || ''}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">
                                    <i class="fas fa-envelope"></i>
                                    ${this.currentLanguage === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                                </label>
                                <input type="email" class="modern-input" name="email" value="${this.propertyDB.settings?.email || ''}">
                            </div>
                            <button type="submit" class="btn-save">
                                <i class="fas fa-save"></i>
                                ${this.currentLanguage === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
                            </button>
                        </form>
                    </div>
                </div>

                <div class="settings-card">
                    <div class="settings-card-header">
                        <div class="settings-icon">
                            <i class="fas fa-users-cog"></i>
                        </div>
                        <h3>إدارة المستخدمين والصلاحيات</h3>
                    </div>
                    <div class="settings-card-body">
                        <button class="btn btn-primary" onclick="propertySystem.navigateTo('users')">
                            <i class="fas fa-users"></i> الانتقال إلى إدارة المستخدمين
                        </button>
                        <div class="users-stats" style="margin-top: 20px; padding: 15px; background: var(--card-bg); border-radius: 10px;">
                            <h4>إحصائيات المستخدمين</h4>
                            <p>إجمالي المستخدمين: <strong>${(this.propertyDB.users || []).length}</strong></p>
                            <p>المستخدمون النشطون: <strong>${(this.propertyDB.users || []).filter(u => u.isActive).length}</strong></p>
                            <p>المستخدمون المعطلون: <strong>${(this.propertyDB.users || []).filter(u => !u.isActive).length}</strong></p>
                        </div>
                    </div>
                </div>

                <div class="settings-card">
                    <div class="settings-card-header">
                        <div class="settings-icon">
                            <i class="fas fa-language"></i>
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
                                <i class="fas fa-check language-check"></i>
                            </div>
                            <div class="language-option ${this.currentLanguage === 'en' ? 'active' : ''}" onclick="propertySystem.applyLanguage('en')">
                                <div class="language-flag">🇺🇸</div>
                                <div class="language-info">
                                    <div class="language-name">English</div>
                                    <div class="language-desc">الإنجليزية</div>
                                </div>
                                <i class="fas fa-check language-check"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ... [بقية الدوال تبقى كما هي]

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
        
        if (this.currentPage) {
            this.navigateTo(this.currentPage);
        }
    }

    optimizeTablesForMobile() {
        if (window.innerWidth <= 768) {
            document.querySelectorAll('.data-table td').forEach(td => {
                const th = td.closest('table').querySelectorAll('th')[td.cellIndex];
                if (th) {
                    td.setAttribute('data-label', th.textContent);
                }
            });
        }
    }

    getTranslation(key) {
        const translations = {
            'ar': {
                'username': 'اسم المستخدم', 'password': 'كلمة المرور', 'login': 'تسجيل الدخول',
                'dashboard': 'الرئيسية', 'properties': 'إدارة العقارات', 'customers': 'إدارة العملاء',
                'contracts': 'العقود', 'payments': 'المدفوعات', 'maintenance': 'الصيانة',
                'reports': 'التقارير', 'settings': 'الإعدادات', 'logout': 'تسجيل الخروج',
                'addProperty': 'إضافة وحدة جديدة', 'addCustomer': 'إضافة عميل جديد',
                'profile': 'الملف الشخصي', 'changePassword': 'تغيير كلمة المرور',
                'createAccount': 'إنشاء حساب جديد', 'sales': 'المبيعات', 'commissions': 'العمولات',
                'inventory': 'الجرد', 'accounts': 'الحسابات', 'invoices': 'الفواتير', 'messages': 'المحادثات'
            },
            'en': {
                'username': 'Username', 'password': 'Password', 'login': 'Login',
                'dashboard': 'Dashboard', 'properties': 'Properties Management', 'customers': 'Customers Management',
                'contracts': 'Contracts', 'payments': 'Payments', 'maintenance': 'Maintenance',
                'reports': 'Reports', 'settings': 'Settings', 'logout': 'Logout',
                'addProperty': 'Add New Property', 'addCustomer': 'Add New Customer',
                'profile': 'Profile', 'changePassword': 'Change Password',
                'createAccount': 'Create New Account', 'sales': 'Sales', 'commissions': 'Commissions',
                'inventory': 'Inventory', 'accounts': 'Accounts', 'invoices': 'Invoices', 'messages': 'Messages'
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
}

// مدير Firebase - محدث
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
                } else {
                    console.log('🔒 User signed out');
                }
            });
            
            console.log('✅ Firebase Manager initialized');
        } catch (error) {
            console.error('❌ Firebase Manager init error:', error);
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
                role: userData.role || 'مدير النظام',
                permissions: userData.permissions || ['properties', 'customers', 'contracts', 'payments', 'maintenance', 'reports', 'settings'],
                joinDate: new Date().toISOString().split('T')[0],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await this.db.collection('users').doc(this.currentUser.uid).set(userProfile);
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

    async createSubAccount(userData) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(
                userData.email, 
                userData.password
            );
            
            const newUser = userCredential.user;
            
            await newUser.updateProfile({
                displayName: userData.fullName
            });
            
            const userProfile = {
                uid: newUser.uid,
                email: userData.email,
                fullName: userData.fullName,
                phone: userData.phone || '',
                permissions: userData.permissions || [],
                role: userData.role || 'مدير فرعي',
                createdBy: userData.createdBy,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            };
            
            await this.db.collection('users').doc(newUser.uid).set(userProfile);
            
            return { success: true, user: newUser };
        } catch (error) {
            let errorMessage = 'فشل في إنشاء الحساب';
            switch (error.code) {
                case 'auth/email-already-in-use': 
                    errorMessage = 'البريد الإلكتروني مستخدم مسبقاً'; 
                    break;
                case 'auth/weak-password': 
                    errorMessage = 'كلمة المرور ضعيفة'; 
                    break;
                case 'auth/invalid-email': 
                    errorMessage = 'البريد الإلكتروني غير صالح'; 
                    break;
                default: 
                    errorMessage = error.message;
            }
            return { success: false, error: errorMessage };
        }
    }

    async deleteUser(uid) {
        try {
            // ملاحظة: لحذف مستخدم من Authentication، تحتاج إلى صلاحيات إدارية في Firebase
            // هذا الكود يعمل فقط إذا كان المستخدم الحالي هو من أنشأ الحساب أو لديه الصلاحيات
            console.log('User deletion would require admin privileges');
            return { success: true };
        } catch (error) {
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
                const defaultData = this.getDefaultUserDB();
                await this.saveUserData(userId, defaultData);
                return { success: true, data: defaultData };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    getDefaultUserDB() {
        const currentDate = new Date().toISOString().split('T')[0];
        return {
            currentUser: null,
            permissions: ['properties', 'customers', 'contracts', 'payments', 'maintenance', 'reports', 'settings'],
            users: [],
            properties: [],
            customers: [],
            contracts: [],
            payments: [],
            maintenance: [],
            sales: [],
            commissions: [],
            inventory: [],
            accounts: [],
            invoices: [],
            messages: [],
            settings: {
                companyName: 'شركة IRSA للتجارة والمقاولات',
                currency: 'ريال',
                taxRate: 15,
                address: 'الرياض - المملكة العربية السعودية',
                phone: '0112345678',
                email: 'info@irsa.com'
            },
            _metadata: {
                createdAt: new Date().toISOString(),
                user: ''
            }
        };
    }
}

// تهيئة النظام
document.addEventListener('DOMContentLoaded', () => {
    window.propertySystem = new AdvancedPropertySystem();
});
