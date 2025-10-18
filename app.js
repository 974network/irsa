// النظام الرئيسي مع Firebase Firestore - الإصدار الكامل مع إدارة المستخدمين
class AdvancedPropertySystem {
    constructor() {
        this.currentPage = 'dashboard';
        this.currentLanguage = localStorage.getItem('propertyLanguage') || 'ar';
        this.firebaseManager = new FirebaseManager();
        this.propertyDB = null;
        this.currentUserRole = 'admin'; // دور المستخدم الحالي
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

    // 🔥 نظام الصلاحيات الجديد
    getUserPermissions() {
        const permissions = {
            'admin': {
                name: 'مدير النظام',
                permissions: ['*'], // كل الصلاحيات
                modules: ['dashboard', 'properties', 'customers', 'sales', 'contracts', 'payments', 'commissions', 'maintenance', 'inventory', 'accounts', 'invoices', 'messages', 'reports', 'settings', 'users']
            },
            'manager': {
                name: 'مدير',
                permissions: ['properties', 'customers', 'contracts', 'payments', 'maintenance', 'reports'],
                modules: ['dashboard', 'properties', 'customers', 'contracts', 'payments', 'maintenance', 'reports']
            },
            'sales': {
                name: 'موظف مبيعات',
                permissions: ['customers', 'sales', 'commissions'],
                modules: ['dashboard', 'customers', 'sales', 'commissions']
            },
            'accountant': {
                name: 'محاسب',
                permissions: ['payments', 'accounts', 'invoices'],
                modules: ['dashboard', 'payments', 'accounts', 'invoices']
            },
            'maintenance': {
                name: 'فني صيانة',
                permissions: ['maintenance', 'inventory'],
                modules: ['dashboard', 'maintenance', 'inventory']
            }
        };
        return permissions[this.currentUserRole] || permissions['sales'];
    }

    // 🔥 التحقق من الصلاحيات
    hasPermission(permission) {
        const userPermissions = this.getUserPermissions().permissions;
        return userPermissions.includes('*') || userPermissions.includes(permission);
    }

    canAccessModule(module) {
        const userModules = this.getUserPermissions().modules;
        return userModules.includes(module);
    }

    // 🔥 تحديث القائمة الجانبية حسب الصلاحيات
    setupNavigation() {
        const userPermissions = this.getUserPermissions();
        const navLinks = [
            { id: 'nav-dashboard', icon: 'fa-home', text: 'dashboard', page: 'dashboard', permission: 'dashboard' },
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

        // إضافة قسم إدارة المستخدمين للمدير فقط
        if (this.currentUserRole === 'admin') {
            navLinks.push({ id: 'nav-users', icon: 'fa-user-shield', text: 'users', page: 'users', permission: 'users' });
        }

        const navContainer = document.querySelector('.sidebar .nav-links');
        if (navContainer) {
            navContainer.innerHTML = navLinks
                .filter(link => this.canAccessModule(link.page))
                .map(link => `
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
            this.propertyDB = await this.loadUserData();
            
            // 🔥 تحديد دور المستخدم من بيانات Firebase
            const userData = await this.firebaseManager.getUserProfile(this.firebaseManager.currentUser.uid);
            this.currentUserRole = userData?.role || 'sales';
            
            const fullName = this.firebaseManager.currentUser?.displayName || 
                            (username.includes('@') ? username.split('@')[0] : username);

            this.propertyDB.currentUser = fullName;
            localStorage.setItem('propertyUser', fullName);
            localStorage.setItem('loginTime', new Date().toISOString());
            localStorage.setItem('userRole', this.currentUserRole);
            
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            this.showNotification(`مرحباً بك ${this.getUserPermissions().name}!`);
            
            this.setupUserMenu();
            this.setupNavigation(); // إعادة تحميل القائمة حسب الصلاحيات
            this.loadDashboard();
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    // 🔥 قسم إدارة المستخدمين الجديد
    async loadUsers() {
        if (!this.hasPermission('users')) {
            this.showNotification('ليس لديك صلاحية للوصول إلى هذا القسم', 'error');
            this.navigateTo('dashboard');
            return;
        }

        const content = document.querySelector('.main-content');
        const users = this.propertyDB.users || [];
        
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-user-shield"></i> <span data-translate="users">${this.getTranslation('users')}</span></h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="propertySystem.showUserForm()">
                        <i class="fas fa-plus"></i> ${this.currentLanguage === 'ar' ? 'إضافة مستخدم' : 'Add User'}
                    </button>
                </div>
            </div>

            <div class="stats-grid" style="margin-bottom: 20px;">
                <div class="stat-card">
                    <i class="fas fa-users"></i>
                    <div class="stat-value">${users.length}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-user-shield"></i>
                    <div class="stat-value">${users.filter(u => u.role === 'admin').length}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'مديرين النظام' : 'Admins'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-user-tie"></i>
                    <div class="stat-value">${users.filter(u => u.role !== 'admin').length}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'مستخدمين عاديين' : 'Regular Users'}</div>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${this.currentLanguage === 'ar' ? 'الصورة' : 'Photo'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الاسم' : 'Name'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الدور' : 'Role'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>
                                    <div class="user-avatar-small">
                                        <i class="fas fa-user-circle"></i>
                                    </div>
                                </td>
                                <td><strong>${user.fullName}</strong></td>
                                <td>${user.email}</td>
                                <td>
                                    <span class="role-badge role-${user.role}">
                                        ${this.getRoleName(user.role)}
                                    </span>
                                </td>
                                <td>
                                    <span class="status-badge status-${user.status === 'active' ? 'active' : 'inactive'}">
                                        ${user.status === 'active' ? 'نشط' : 'غير نشط'}
                                    </span>
                                </td>
                                <td>${user.createdAt}</td>
                                <td class="actions-column">
                                    <div class="action-buttons">
                                        <button class="btn btn-sm btn-edit" onclick="propertySystem.editUser('${user.id}')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-delete" onclick="propertySystem.deleteUser('${user.id}')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                        ${user.status === 'active' ? 
                                            `<button class="btn btn-sm btn-warning" onclick="propertySystem.toggleUserStatus('${user.id}', 'inactive')">
                                                <i class="fas fa-pause"></i>
                                            </button>` :
                                            `<button class="btn btn-sm btn-success" onclick="propertySystem.toggleUserStatus('${user.id}', 'active')">
                                                <i class="fas fa-play"></i>
                                            </button>`
                                        }
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getRoleName(role) {
        const roles = {
            'admin': 'مدير النظام',
            'manager': 'مدير',
            'sales': 'موظف مبيعات', 
            'accountant': 'محاسب',
            'maintenance': 'فني صيانة'
        };
        return roles[role] || role;
    }

    // 🔥 نموذج إضافة مستخدم جديد
    showUserForm(user = null) {
        const isEdit = user !== null;
        const formHTML = `
            <div class="modal-overlay" id="userModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-plus"></i> ${isEdit ? (this.currentLanguage === 'ar' ? 'تعديل المستخدم' : 'Edit User') : (this.currentLanguage === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User')}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('userModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.${isEdit ? 'updateUser' : 'addUser'}(event, ${isEdit ? `'${user.id}'` : ''})">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الاسم الكامل' : 'Full Name'}:</label>
                            <input type="text" name="fullName" value="${isEdit ? user.fullName : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'البريد الإلكتروني' : 'Email'}:</label>
                            <input type="email" name="email" value="${isEdit ? user.email : ''}" required ${isEdit ? 'readonly' : ''}>
                        </div>
                        ${!isEdit ? `
                            <div class="form-group">
                                <label>${this.currentLanguage === 'ar' ? 'كلمة المرور' : 'Password'}:</label>
                                <input type="password" name="password" required minlength="6">
                            </div>
                            <div class="form-group">
                                <label>${this.currentLanguage === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}:</label>
                                <input type="password" name="confirmPassword" required minlength="6">
                            </div>
                        ` : ''}
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'رقم الهاتف' : 'Phone'}:</label>
                            <input type="tel" name="phone" value="${isEdit ? user.phone : ''}">
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الدور' : 'Role'}:</label>
                            <select name="role" required>
                                <option value="sales" ${isEdit && user.role === 'sales' ? 'selected' : ''}>موظف مبيعات</option>
                                <option value="manager" ${isEdit && user.role === 'manager' ? 'selected' : ''}>مدير</option>
                                <option value="accountant" ${isEdit && user.role === 'accountant' ? 'selected' : ''}>محاسب</option>
                                <option value="maintenance" ${isEdit && user.role === 'maintenance' ? 'selected' : ''}>فني صيانة</option>
                                <option value="admin" ${isEdit && user.role === 'admin' ? 'selected' : ''}>مدير النظام</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}:</label>
                            <select name="status" required>
                                <option value="active" ${isEdit && user.status === 'active' ? 'selected' : ''}>نشط</option>
                                <option value="inactive" ${isEdit && user.status === 'inactive' ? 'selected' : ''}>غير نشط</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                ${isEdit ? (this.currentLanguage === 'ar' ? 'تحديث المستخدم' : 'Update User') : (this.currentLanguage === 'ar' ? 'إضافة المستخدم' : 'Add User')}
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('userModal')">
                                ${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.showModal(formHTML);
    }

    // 🔥 إضافة مستخدم جديد
    async addUser(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        if (password !== confirmPassword) {
            this.showNotification('كلمتا المرور غير متطابقتين!', 'error');
            return;
        }

        const userData = {
            fullName: formData.get('fullName'),
            phone: formData.get('phone'),
            role: formData.get('role'),
            status: formData.get('status')
        };

        const result = await this.firebaseManager.createAccount(email, password, userData);
        
        if (result.success) {
            // حفظ بيانات المستخدم في قاعدة البيانات المحلية
            const newUser = {
                id: result.user.uid,
                fullName: userData.fullName,
                email: email,
                phone: userData.phone,
                role: userData.role,
                status: userData.status,
                createdAt: new Date().toISOString().split('T')[0],
                createdBy: this.propertyDB.currentUser
            };

            if (!this.propertyDB.users) this.propertyDB.users = [];
            this.propertyDB.users.push(newUser);
            
            await this.saveUserData();
            this.closeModal('userModal');
            this.showNotification('تم إضافة المستخدم بنجاح!');
            this.loadUsers();
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    // 🔥 تعديل مستخدم
    editUser(userId) {
        const user = (this.propertyDB.users || []).find(u => u.id === userId);
        if (user) {
            this.showUserForm(user);
        }
    }

    async updateUser(event, userId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const userIndex = (this.propertyDB.users || []).findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            this.propertyDB.users[userIndex] = {
                ...this.propertyDB.users[userIndex],
                fullName: formData.get('fullName'),
                phone: formData.get('phone'),
                role: formData.get('role'),
                status: formData.get('status')
            };
            
            await this.saveUserData();
            this.closeModal('userModal');
            this.showNotification('تم تحديث بيانات المستخدم بنجاح!');
            this.loadUsers();
        }
    }

    // 🔥 حذف مستخدم
    async deleteUser(userId) {
        if (confirm(this.currentLanguage === 'ar' ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure you want to delete this user?')) {
            try {
                // حذف من Firebase Authentication
                await this.firebaseManager.deleteUser(userId);
                
                // حذف من قاعدة البيانات المحلية
                this.propertyDB.users = (this.propertyDB.users || []).filter(u => u.id !== userId);
                await this.saveUserData();
                
                this.showNotification('تم حذف المستخدم بنجاح!');
                this.loadUsers();
            } catch (error) {
                this.showNotification('فشل في حذف المستخدم', 'error');
            }
        }
    }

    // 🔥 تفعيل/تعطيل مستخدم
    async toggleUserStatus(userId, status) {
        const userIndex = (this.propertyDB.users || []).findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            this.propertyDB.users[userIndex].status = status;
            await this.saveUserData();
            this.showNotification(`تم ${status === 'active' ? 'تفعيل' : 'تعطيل'} المستخدم بنجاح!`);
            this.loadUsers();
        }
    }

    // 🔥 تحديث الدوال الأخرى لدعم الصلاحيات
    navigateTo(page) {
        if (!this.canAccessModule(page)) {
            this.showNotification('ليس لديك صلاحية للوصول إلى هذا القسم', 'error');
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
            case 'users': this.loadUsers(); break;
        }
    }

    // 🔥 تحديث واجهة المستخدم حسب الصلاحيات
    setupUserMenu() {
        const username = this.propertyDB?.currentUser || 'مستخدم';
        const userRole = this.getUserPermissions().name;
        
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
                        ${this.currentUserRole === 'admin' ? `
                            <a href="#" class="dropdown-item" onclick="propertySystem.navigateTo('users')">
                                <i class="fas fa-user-shield"></i>
                                <span data-translate="users">إدارة المستخدمين</span>
                            </a>
                        ` : ''}
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

    // 🔥 تحديث الترجمات
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
                'inventory': 'الجرد', 'accounts': 'الحسابات', 'invoices': 'الفواتير', 'messages': 'المحادثات',
                'users': 'إدارة المستخدمين'
            },
            'en': {
                'username': 'Username', 'password': 'Password', 'login': 'Login',
                'dashboard': 'Dashboard', 'properties': 'Properties Management', 'customers': 'Customers Management',
                'contracts': 'Contracts', 'payments': 'Payments', 'maintenance': 'Maintenance',
                'reports': 'Reports', 'settings': 'Settings', 'logout': 'Logout',
                'addProperty': 'Add New Property', 'addCustomer': 'Add New Customer',
                'profile': 'Profile', 'changePassword': 'Change Password',
                'createAccount': 'Create New Account', 'sales': 'Sales', 'commissions': 'Commissions',
                'inventory': 'Inventory', 'accounts': 'Accounts', 'invoices': 'Invoices', 'messages': 'Messages',
                'users': 'Users Management'
            }
        };
        return translations[this.currentLanguage][key] || key;
    }

    // باقي الدوال الموجودة سابقاً تبقى كما هي...
    // [جميع الدوال الأخرى من الكود الأصلي]
}

// 🔥 تحديث Firebase Manager
class FirebaseManager {
    // ... الدوال الموجودة سابقاً ...

    async createAccount(email, password, userData = {}) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;
            
            const userProfile = {
                username: userData.username || email.split('@')[0],
                fullName: userData.fullName || email.split('@')[0],
                email: email,
                phone: userData.phone || '',
                role: userData.role || 'sales',
                status: userData.status || 'active',
                joinDate: new Date().toISOString().split('T')[0],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: this.currentUser.uid
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

    async getUserProfile(userId) {
        try {
            const doc = await this.db.collection('users').doc(userId).get();
            if (doc.exists) {
                return doc.data();
            }
            return null;
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    async deleteUser(userId) {
        try {
            // حذف من Authentication
            await this.auth.currentUser.delete();
            
            // حذف من Firestore
            await this.db.collection('users').doc(userId).delete();
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ... باقي الدوال ...
}

// تهيئة النظام
document.addEventListener('DOMContentLoaded', () => {
    window.propertySystem = new AdvancedPropertySystem();
});
