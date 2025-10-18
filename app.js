// النظام الرئيسي مع Firebase Firestore
class AdvancedPropertySystem {
    constructor() {
        this.currentPage = 'dashboard';
        this.currentLanguage = localStorage.getItem('propertyLanguage') || 'ar';
        this.firebaseManager = new FirebaseManager();
        this.propertyDB = null;
        this.init();
    }

    async init() {
        try {
            await this.firebaseManager.init();
            this.setupLogin();
            this.setupNavigation();
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

    // 🔥 تسجيل الدخول مع Firebase
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
            // تحميل بيانات المستخدم من Firestore
            this.propertyDB = await this.loadUserData();
            this.propertyDB.currentUser = username;
            
            localStorage.setItem('propertyUser', username);
            localStorage.setItem('loginTime', new Date().toISOString());
            
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            this.showNotification('مرحباً بك في النظام!');
            
            this.setupUserMenu();
            this.loadDashboard();
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    // 🔥 تحميل بيانات المستخدم من Firebase
    async loadUserData() {
        if (!this.firebaseManager.currentUser) {
            return this.getDefaultUserDB();
        }

        const userId = this.firebaseManager.currentUser.uid;
        const result = await this.firebaseManager.getUserData(userId);
        
        if (result.success) {
            console.log('✅ تم تحميل بيانات المستخدم من Firebase');
            return result.data;
        } else {
            console.error('❌ فشل في تحميل البيانات:', result.error);
            return this.getDefaultUserDB();
        }
    }

    // 🔥 حفظ بيانات المستخدم في Firebase
    async saveUserData() {
        if (!this.firebaseManager.currentUser || !this.propertyDB) {
            console.warn('⚠️ لا يمكن الحفظ: لا يوجد مستخدم أو بيانات');
            return false;
        }

        const userId = this.firebaseManager.currentUser.uid;
        
        // تحديث البيانات قبل الحفظ
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

    // 🔥 قاعدة بيانات افتراضية
    getDefaultUserDB() {
        return {
            currentUser: null,
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
            _metadata: {
                createdAt: new Date().toISOString(),
                user: ''
            }
        };
    }

    // 🔥 إنشاء حساب جديد
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
            role: 'مدير النظام'
        };
        
        const result = await this.firebaseManager.createAccount(email, password, userData);
        
        if (result.success) {
            // إنشاء قاعدة بيانات افتراضية للمستخدم الجديد
            const newUserDB = this.getDefaultUserDB();
            newUserDB.currentUser = username;
            newUserDB._metadata.user = username;
            
            // حفظ البيانات الافتراضية للمستخدم الجديد
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

    // 🔥 تسجيل الخروج
    async logout() {
        // حفظ البيانات قبل تسجيل الخروج
        if (this.propertyDB) {
            await this.saveUserData();
        }
        
        await this.firebaseManager.logout();
        
        localStorage.removeItem('propertyUser');
        localStorage.removeItem('loginTime');
        
        this.propertyDB = this.getDefaultUserDB();
        
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
        const username = this.propertyDB?.currentUser || 'مستخدم';
        
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
                            <div class="user-role">مدير النظام</div>
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
        this.currentPage = page;
        
        if (page === 'logout') {
            this.logout();
            return;
        }
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.getElementById(`nav-${page}`);
        if (activeLink) activeLink.classList.add('active');

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

    async loadDashboard() {
        const content = document.querySelector('.main-content');
        const stats = this.calculateStats();
        
        content.innerHTML = `
            <div class="dashboard-compact">
                <div class="dashboard-header-compact">
                    <h1 class="dashboard-title-compact">
                        <i class="fas fa-home"></i> 
                        <span data-translate="dashboard">${this.getTranslation('dashboard')}</span>
                    </h1>
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

        return { totalProperties, occupied, totalRevenue };
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

    async loadProperties() {
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

    async loadCustomers() {
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

    async loadSettings() {
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
        
        await this.saveUserData();
        this.showNotification(this.currentLanguage === 'ar' ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!');
    }

    showPropertyForm() {
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
        await this.saveUserData();
        this.closeModal('propertyModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة الوحدة العقارية بنجاح!' : 'Property added successfully!');
        this.loadProperties();
    }

    showCustomerForm() {
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
        await this.saveUserData();
        this.closeModal('customerModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة العميل بنجاح!' : 'Customer added successfully!');
        this.loadCustomers();
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
                'createAccount': 'إنشاء حساب جديد'
            },
            'en': {
                'username': 'Username', 'password': 'Password', 'login': 'Login',
                'dashboard': 'Dashboard', 'properties': 'Properties Management', 'customers': 'Customers Management',
                'contracts': 'Contracts', 'payments': 'Payments', 'maintenance': 'Maintenance',
                'reports': 'Reports', 'settings': 'Settings', 'logout': 'Logout',
                'addProperty': 'Add New Property', 'addCustomer': 'Add New Customer',
                'profile': 'Profile', 'changePassword': 'Change Password',
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
        return {
            currentUser: null,
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
