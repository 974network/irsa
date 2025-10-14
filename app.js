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
            sales: [],
            commissions: [],
            inventory: [],
            accounts: [],
            invoices: [],
            messages: [],
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
            { id: 'nav-sales', icon: 'fa-shopping-cart', text: 'sales', page: 'sales' },
            { id: 'nav-contracts', icon: 'fa-file-contract', text: 'contracts', page: 'contracts' },
            { id: 'nav-payments', icon: 'fa-money-bill', text: 'payments', page: 'payments' },
            { id: 'nav-commissions', icon: 'fa-handshake', text: 'commissions', page: 'commissions' },
            { id: 'nav-maintenance', icon: 'fa-tools', text: 'maintenance', page: 'maintenance' },
            { id: 'nav-inventory', icon: 'fa-boxes', text: 'inventory', page: 'inventory' },
            { id: 'nav-accounts', icon: 'fa-chart-line', text: 'accounts', page: 'accounts' },
            { id: 'nav-invoices', icon: 'fa-receipt', text: 'invoices', page: 'invoices' },
            { id: 'nav-messages', icon: 'fa-comments', text: 'messages', page: 'messages' },
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

    // 🔥 قسم المبيعات
    async loadSales() {
        const content = document.querySelector('.main-content');
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-shopping-cart"></i> <span data-translate="sales">${this.getTranslation('sales')}</span></h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="propertySystem.showSaleForm()">
                        <i class="fas fa-plus"></i> ${this.currentLanguage === 'ar' ? 'إضافة عملية بيع' : 'Add Sale'}
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${this.currentLanguage === 'ar' ? 'رقم العملية' : 'Sale ID'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'العميل' : 'Customer'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'المبلغ' : 'Amount'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'التاريخ' : 'Date'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.propertyDB.sales.map(sale => `
                            <tr>
                                <td>${sale.id}</td>
                                <td>${sale.customer}</td>
                                <td>${sale.amount} ${this.propertyDB.settings.currency}</td>
                                <td>${sale.date}</td>
                                <td><span class="status-badge status-${sale.status === 'مكتمل' ? 'active' : 'pending'}">${sale.status}</span></td>
                            </tr>
                        `).join('')}
                        ${this.propertyDB.sales.length === 0 ? `
                            <tr>
                                <td colspan="5" style="text-align: center; color: var(--gray-light);">
                                    ${this.currentLanguage === 'ar' ? 'لا توجد عمليات بيع' : 'No sales records'}
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        `;
    }

    showSaleForm() {
        const formHTML = `
            <div class="modal-overlay" id="saleModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-shopping-cart"></i> ${this.currentLanguage === 'ar' ? 'إضافة عملية بيع جديدة' : 'Add New Sale'}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('saleModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.addSale(event)">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'العميل' : 'Customer'}:</label>
                            <select name="customer" required>
                                <option value="">${this.currentLanguage === 'ar' ? 'اختر العميل' : 'Select Customer'}</option>
                                ${this.propertyDB.customers.map(customer => `
                                    <option value="${customer.name}">${customer.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'المبلغ' : 'Amount'}:</label>
                            <input type="number" name="amount" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'التاريخ' : 'Date'}:</label>
                            <input type="date" name="date" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}:</label>
                            <select name="status" required>
                                <option value="مكتمل">${this.currentLanguage === 'ar' ? 'مكتمل' : 'Completed'}</option>
                                <option value="معلق">${this.currentLanguage === 'ar' ? 'معلق' : 'Pending'}</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">${this.currentLanguage === 'ar' ? 'إضافة العملية' : 'Add Sale'}</button>
                    </form>
                </div>
            </div>
        `;
        this.showModal(formHTML);
    }

    async addSale(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const newSale = {
            id: this.propertyDB.sales.length > 0 ? Math.max(...this.propertyDB.sales.map(s => s.id)) + 1 : 1,
            customer: formData.get('customer'),
            amount: parseInt(formData.get('amount')),
            date: formData.get('date'),
            status: formData.get('status')
        };
        
        this.propertyDB.sales.push(newSale);
        await this.saveUserData();
        this.closeModal('saleModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة عملية البيع بنجاح!' : 'Sale added successfully!');
        this.loadSales();
    }

    // 🔥 قسم العمولات
    async loadCommissions() {
        const content = document.querySelector('.main-content');
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-handshake"></i> <span data-translate="commissions">${this.getTranslation('commissions')}</span></h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="propertySystem.showCommissionForm()">
                        <i class="fas fa-plus"></i> ${this.currentLanguage === 'ar' ? 'إضافة عمولة' : 'Add Commission'}
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${this.currentLanguage === 'ar' ? 'الوسيط' : 'Agent'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'العملية' : 'Transaction'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'نسبة العمولة' : 'Commission %'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'المبلغ' : 'Amount'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.propertyDB.commissions.map(commission => `
                            <tr>
                                <td>${commission.agent}</td>
                                <td>${commission.transaction}</td>
                                <td>${commission.percentage}%</td>
                                <td>${commission.amount} ${this.propertyDB.settings.currency}</td>
                                <td><span class="status-badge status-${commission.status === 'مدفوعة' ? 'paid' : 'pending'}">${commission.status}</span></td>
                            </tr>
                        `).join('')}
                        ${this.propertyDB.commissions.length === 0 ? `
                            <tr>
                                <td colspan="5" style="text-align: center; color: var(--gray-light);">
                                    ${this.currentLanguage === 'ar' ? 'لا توجد عمولات' : 'No commissions'}
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        `;
    }

    showCommissionForm() {
        const formHTML = `
            <div class="modal-overlay" id="commissionModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-handshake"></i> ${this.currentLanguage === 'ar' ? 'إضافة عمولة جديدة' : 'Add New Commission'}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('commissionModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.addCommission(event)">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'اسم الوسيط' : 'Agent Name'}:</label>
                            <input type="text" name="agent" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'العملية' : 'Transaction'}:</label>
                            <input type="text" name="transaction" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'نسبة العمولة %' : 'Commission %'}:</label>
                            <input type="number" name="percentage" min="1" max="100" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'المبلغ' : 'Amount'}:</label>
                            <input type="number" name="amount" required>
                        </div>
                        <button type="submit" class="btn btn-primary">${this.currentLanguage === 'ar' ? 'إضافة العمولة' : 'Add Commission'}</button>
                    </form>
                </div>
            </div>
        `;
        this.showModal(formHTML);
    }

    async addCommission(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const newCommission = {
            id: this.propertyDB.commissions.length > 0 ? Math.max(...this.propertyDB.commissions.map(c => c.id)) + 1 : 1,
            agent: formData.get('agent'),
            transaction: formData.get('transaction'),
            percentage: parseInt(formData.get('percentage')),
            amount: parseInt(formData.get('amount')),
            status: 'معلقة'
        };
        
        this.propertyDB.commissions.push(newCommission);
        await this.saveUserData();
        this.closeModal('commissionModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة العمولة بنجاح!' : 'Commission added successfully!');
        this.loadCommissions();
    }

    // 🔥 قسم الجرد
    async loadInventory() {
        const content = document.querySelector('.main-content');
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-boxes"></i> <span data-translate="inventory">${this.getTranslation('inventory')}</span></h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="propertySystem.showInventoryForm()">
                        <i class="fas fa-plus"></i> ${this.currentLanguage === 'ar' ? 'إضافة عنصر' : 'Add Item'}
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${this.currentLanguage === 'ar' ? 'اسم العنصر' : 'Item Name'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الفئة' : 'Category'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الكمية' : 'Quantity'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'السعر' : 'Price'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.propertyDB.inventory.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.category}</td>
                                <td>${item.quantity}</td>
                                <td>${item.price} ${this.propertyDB.settings.currency}</td>
                                <td><span class="status-badge status-${item.quantity > 10 ? 'active' : item.quantity > 0 ? 'warning' : 'inactive'}">${item.quantity > 10 ? 'متوفر' : item.quantity > 0 ? 'منخفض' : 'نافذ'}</span></td>
                            </tr>
                        `).join('')}
                        ${this.propertyDB.inventory.length === 0 ? `
                            <tr>
                                <td colspan="5" style="text-align: center; color: var(--gray-light);">
                                    ${this.currentLanguage === 'ar' ? 'لا توجد عناصر في المخزون' : 'No items in inventory'}
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        `;
    }

    showInventoryForm() {
        const formHTML = `
            <div class="modal-overlay" id="inventoryModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-boxes"></i> ${this.currentLanguage === 'ar' ? 'إضافة عنصر جديد' : 'Add New Item'}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('inventoryModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.addInventoryItem(event)">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'اسم العنصر' : 'Item Name'}:</label>
                            <input type="text" name="name" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الفئة' : 'Category'}:</label>
                            <select name="category" required>
                                <option value="أدوات">${this.currentLanguage === 'ar' ? 'أدوات' : 'Tools'}</option>
                                <option value="مواد بناء">${this.currentLanguage === 'ar' ? 'مواد بناء' : 'Construction Materials'}</option>
                                <option value="كهرباء">${this.currentLanguage === 'ar' ? 'كهرباء' : 'Electrical'}</option>
                                <option value="سباكة">${this.currentLanguage === 'ar' ? 'سباكة' : 'Plumbing'}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الكمية' : 'Quantity'}:</label>
                            <input type="number" name="quantity" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'السعر' : 'Price'}:</label>
                            <input type="number" name="price" required>
                        </div>
                        <button type="submit" class="btn btn-primary">${this.currentLanguage === 'ar' ? 'إضافة العنصر' : 'Add Item'}</button>
                    </form>
                </div>
            </div>
        `;
        this.showModal(formHTML);
    }

    async addInventoryItem(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const newItem = {
            id: this.propertyDB.inventory.length > 0 ? Math.max(...this.propertyDB.inventory.map(i => i.id)) + 1 : 1,
            name: formData.get('name'),
            category: formData.get('category'),
            quantity: parseInt(formData.get('quantity')),
            price: parseInt(formData.get('price'))
        };
        
        this.propertyDB.inventory.push(newItem);
        await this.saveUserData();
        this.closeModal('inventoryModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة العنصر بنجاح!' : 'Item added successfully!');
        this.loadInventory();
    }

    // 🔥 قسم الحسابات
    async loadAccounts() {
        const content = document.querySelector('.main-content');
        const stats = this.calculateFinancialStats();
        
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-chart-line"></i> <span data-translate="accounts">${this.getTranslation('accounts')}</span></h2>
            </div>
            
            <div class="stats-grid" style="margin-bottom: 30px;">
                <div class="stat-card">
                    <i class="fas fa-money-bill-wave"></i>
                    <div class="stat-value">${stats.totalRevenue.toLocaleString()}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-receipt"></i>
                    <div class="stat-value">${stats.totalExpenses.toLocaleString()}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-chart-bar"></i>
                    <div class="stat-value">${stats.netProfit.toLocaleString()}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'صافي الربح' : 'Net Profit'}</div>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${this.currentLanguage === 'ar' ? 'التاريخ' : 'Date'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الوصف' : 'Description'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'النوع' : 'Type'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'المبلغ' : 'Amount'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.propertyDB.accounts.map(account => `
                            <tr>
                                <td>${account.date}</td>
                                <td>${account.description}</td>
                                <td><span class="status-badge status-${account.type === 'إيراد' ? 'active' : 'inactive'}">${account.type}</span></td>
                                <td>${account.amount} ${this.propertyDB.settings.currency}</td>
                            </tr>
                        `).join('')}
                        ${this.propertyDB.accounts.length === 0 ? `
                            <tr>
                                <td colspan="4" style="text-align: center; color: var(--gray-light);">
                                    ${this.currentLanguage === 'ar' ? 'لا توجد حركات مالية' : 'No financial transactions'}
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        `;
    }

    calculateFinancialStats() {
        const totalRevenue = this.propertyDB.accounts
            ?.filter(a => a.type === 'إيراد')
            ?.reduce((sum, account) => sum + (account.amount || 0), 0) || 0;
            
        const totalExpenses = this.propertyDB.accounts
            ?.filter(a => a.type === 'مصروف')
            ?.reduce((sum, account) => sum + (account.amount || 0), 0) || 0;
            
        const netProfit = totalRevenue - totalExpenses;

        return { totalRevenue, totalExpenses, netProfit };
    }

    // 🔥 قسم الفواتير
    async loadInvoices() {
        const content = document.querySelector('.main-content');
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-receipt"></i> <span data-translate="invoices">${this.getTranslation('invoices')}</span></h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="propertySystem.showInvoiceForm()">
                        <i class="fas fa-plus"></i> ${this.currentLanguage === 'ar' ? 'إنشاء فاتورة' : 'Create Invoice'}
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${this.currentLanguage === 'ar' ? 'رقم الفاتورة' : 'Invoice No'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'العميل' : 'Customer'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'المبلغ' : 'Amount'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'التاريخ' : 'Date'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.propertyDB.invoices.map(invoice => `
                            <tr>
                                <td>#${invoice.id}</td>
                                <td>${invoice.customer}</td>
                                <td>${invoice.amount} ${this.propertyDB.settings.currency}</td>
                                <td>${invoice.date}</td>
                                <td><span class="status-badge status-${invoice.status === 'مدفوعة' ? 'paid' : 'pending'}">${invoice.status}</span></td>
                            </tr>
                        `).join('')}
                        ${this.propertyDB.invoices.length === 0 ? `
                            <tr>
                                <td colspan="5" style="text-align: center; color: var(--gray-light);">
                                    ${this.currentLanguage === 'ar' ? 'لا توجد فواتير' : 'No invoices'}
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        `;
    }

    showInvoiceForm() {
        const formHTML = `
            <div class="modal-overlay" id="invoiceModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-receipt"></i> ${this.currentLanguage === 'ar' ? 'إنشاء فاتورة جديدة' : 'Create New Invoice'}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('invoiceModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.addInvoice(event)">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'العميل' : 'Customer'}:</label>
                            <select name="customer" required>
                                <option value="">${this.currentLanguage === 'ar' ? 'اختر العميل' : 'Select Customer'}</option>
                                ${this.propertyDB.customers.map(customer => `
                                    <option value="${customer.name}">${customer.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'المبلغ' : 'Amount'}:</label>
                            <input type="number" name="amount" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'التاريخ' : 'Date'}:</label>
                            <input type="date" name="date" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الوصف' : 'Description'}:</label>
                            <textarea name="description" rows="3"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">${this.currentLanguage === 'ar' ? 'إنشاء الفاتورة' : 'Create Invoice'}</button>
                    </form>
                </div>
            </div>
        `;
        this.showModal(formHTML);
    }

    async addInvoice(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const newInvoice = {
            id: this.propertyDB.invoices.length > 0 ? Math.max(...this.propertyDB.invoices.map(i => i.id)) + 1 : 1,
            customer: formData.get('customer'),
            amount: parseInt(formData.get('amount')),
            date: formData.get('date'),
            description: formData.get('description'),
            status: 'معلقة'
        };
        
        this.propertyDB.invoices.push(newInvoice);
        await this.saveUserData();
        this.closeModal('invoiceModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إنشاء الفاتورة بنجاح!' : 'Invoice created successfully!');
        this.loadInvoices();
    }

    // 🔥 قسم المحادثات
    async loadMessages() {
        const content = document.querySelector('.main-content');
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-comments"></i> <span data-translate="messages">${this.getTranslation('messages')}</span></h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="propertySystem.showNewMessageForm()">
                        <i class="fas fa-plus"></i> ${this.currentLanguage === 'ar' ? 'رسالة جديدة' : 'New Message'}
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${this.currentLanguage === 'ar' ? 'المرسل' : 'Sender'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'المستلم' : 'Receiver'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الموضوع' : 'Subject'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'التاريخ' : 'Date'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.propertyDB.messages.map(message => `
                            <tr>
                                <td>${message.sender}</td>
                                <td>${message.receiver}</td>
                                <td>${message.subject}</td>
                                <td>${message.date}</td>
                                <td><span class="status-badge status-${message.status === 'مقروء' ? 'active' : 'pending'}">${message.status}</span></td>
                            </tr>
                        `).join('')}
                        ${this.propertyDB.messages.length === 0 ? `
                            <tr>
                                <td colspan="5" style="text-align: center; color: var(--gray-light);">
                                    ${this.currentLanguage === 'ar' ? 'لا توجد رسائل' : 'No messages'}
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        `;
    }

    showNewMessageForm() {
        const formHTML = `
            <div class="modal-overlay" id="messageModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-comments"></i> ${this.currentLanguage === 'ar' ? 'رسالة جديدة' : 'New Message'}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('messageModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.sendMessage(event)">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'المستلم' : 'Receiver'}:</label>
                            <input type="text" name="receiver" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الموضوع' : 'Subject'}:</label>
                            <input type="text" name="subject" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الرسالة' : 'Message'}:</label>
                            <textarea name="message" rows="5" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">${this.currentLanguage === 'ar' ? 'إرسال الرسالة' : 'Send Message'}</button>
                    </form>
                </div>
            </div>
        `;
        this.showModal(formHTML);
    }

    async sendMessage(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const newMessage = {
            id: this.propertyDB.messages.length > 0 ? Math.max(...this.propertyDB.messages.map(m => m.id)) + 1 : 1,
            sender: this.propertyDB.currentUser,
            receiver: formData.get('receiver'),
            subject: formData.get('subject'),
            message: formData.get('message'),
            date: new Date().toISOString().split('T')[0],
            status: 'غير مقروء'
        };
        
        this.propertyDB.messages.push(newMessage);
        await this.saveUserData();
        this.closeModal('messageModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إرسال الرسالة بنجاح!' : 'Message sent successfully!');
        this.loadMessages();
    }

    // 🔥 الأقسام الأساسية الموجودة سابقاً
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
            sales: [],
            commissions: [],
            inventory: [],
            accounts: [],
            invoices: [],
            messages: [],
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
