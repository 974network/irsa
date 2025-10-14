// النظام الرئيسي مع Firebase Firestore - الإصدار الكامل والشغال
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
        this.setupMobileMenu(); // 🔥 إضافة هذا السطر
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
                },
                { 
                    id: 2, 
                    name: 'A-102', 
                    type: 'شقة', 
                    area: '100م²', 
                    status: 'مشغولة', 
                    rent: 1200, 
                    tenant: 'أحمد خالد', 
                    contractEnd: '2024-12-31',
                    description: 'شقة مريحة في الطابق الأول'
                },
                { 
                    id: 3, 
                    name: 'B-201', 
                    type: 'فيلا', 
                    area: '200م²', 
                    status: 'شاغرة', 
                    rent: 2500, 
                    tenant: '', 
                    contractEnd: '',
                    description: 'فيلا فاخرة مع حديقة'
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
                },
                { 
                    id: 2, 
                    name: 'أحمد خالد', 
                    phone: '0554321098', 
                    email: 'ahmed@email.com', 
                    idNumber: '0987654321',
                    address: 'الرياض - حي النخيل'
                },
                { 
                    id: 3, 
                    name: 'سارة عبدالله', 
                    phone: '0501234567', 
                    email: 'sara@email.com', 
                    idNumber: '1122334455',
                    address: 'الرياض - حي العليا'
                }
            ],
            contracts: [
                {
                    id: 1,
                    propertyId: 2,
                    customerId: 2,
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
                },
                {
                    id: 2,
                    contractId: 1,
                    amount: 1200,
                    date: '2024-02-01',
                    method: 'نقدي',
                    status: 'مدفوع',
                    description: 'دفعة شهر فبراير'
                }
            ],
            maintenance: [
                {
                    id: 1,
                    propertyId: 2,
                    type: 'صيانة دورية',
                    description: 'صيانة مكيف الهواء',
                    status: 'مكتمل',
                    cost: 300,
                    date: '2024-01-15'
                },
                {
                    id: 2,
                    propertyId: 1,
                    type: 'تصليح',
                    description: 'تصليح تسرب المياه',
                    status: 'قيد التنفيذ',
                    cost: 150,
                    date: '2024-02-01'
                }
            ],
            sales: [
                {
                    id: 1,
                    customerId: 1,
                    propertyId: 1,
                    amount: 150000,
                    date: '2024-01-20',
                    status: 'مكتمل',
                    commission: 7500
                }
            ],
            commissions: [
                {
                    id: 1,
                    agent: 'محمد علي',
                    transaction: 'بيع شقة A-101',
                    percentage: 5,
                    amount: 7500,
                    status: 'مدفوعة',
                    date: '2024-01-25'
                }
            ],
            inventory: [
                {
                    id: 1,
                    name: 'مكيف سبليت',
                    category: 'كهرباء',
                    quantity: 5,
                    price: 1200,
                    minQuantity: 2
                },
                {
                    id: 2,
                    name: 'طلاء',
                    category: 'مواد بناء',
                    quantity: 15,
                    price: 80,
                    minQuantity: 5
                },
                {
                    id: 3,
                    name: 'أسلاك كهربائية',
                    category: 'كهرباء',
                    quantity: 8,
                    price: 45,
                    minQuantity: 3
                }
            ],
            accounts: [
                {
                    id: 1,
                    date: '2024-01-01',
                    description: 'إيجار شقة A-102',
                    type: 'إيراد',
                    amount: 1200
                },
                {
                    id: 2,
                    date: '2024-01-15',
                    description: 'صيانة مكيف',
                    type: 'مصروف',
                    amount: 300
                },
                {
                    id: 3,
                    date: '2024-02-01',
                    description: 'إيجار شقة A-102',
                    type: 'إيراد',
                    amount: 1200
                }
            ],
            invoices: [
                {
                    id: 1,
                    customerId: 2,
                    amount: 1200,
                    date: '2024-01-01',
                    dueDate: '2024-01-05',
                    status: 'مدفوعة',
                    description: 'فاتورة إيجار يناير'
                },
                {
                    id: 2,
                    customerId: 2,
                    amount: 1200,
                    date: '2024-02-01',
                    dueDate: '2024-02-05',
                    status: 'معلقة',
                    description: 'فاتورة إيجار فبراير'
                }
            ],
            messages: [
                {
                    id: 1,
                    sender: 'فاطمة محمد',
                    receiver: 'الإدارة',
                    subject: 'استفسار عن شقة',
                    message: 'أرغب في استئجار شقة في المبنى',
                    date: '2024-01-10',
                    status: 'مقروء'
                },
                {
                    id: 2,
                    sender: 'الإدارة',
                    receiver: 'أحمد خالد',
                    subject: 'تذكير بالدفع',
                    message: 'يرجى تسديد دفعة فبراير',
                    date: '2024-02-01',
                    status: 'غير مقروء'
                }
            ],
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
            role: 'مدير النظام'
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
    setupMobileMenu() {
    // إنشاء شريط أعلى للجوال
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
    
    // إضافة العناصر للصفحة
    document.body.appendChild(mobileHeader);
    
    // إضافة event listener للزر
    document.querySelector('.mobile-menu-btn').addEventListener('click', () => {
        this.toggleSidebar();
    });
}

// 🔥 دالة تبديل الشريط الجانبي
toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

// 🔥 تحديث عنوان الصفحة
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
            'settings': 'الإعدادات'
        };
        titleElement.textContent = titles[pageName] || pageName;
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
    
    // تحديث عنوان الجوال
    this.updateMobileTitle(page);
    
    // إغلاق الشريط الجانبي على الجوال
    if (window.innerWidth <= 768) {
        this.toggleSidebar();
    }
    
    // الكود الأصلي...
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.getElementById(`nav-${page}`);
    if (activeLink) activeLink.classList.add('active');

    // تحميل المحتوى...
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

                <!-- الإحصائيات الرئيسية -->
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
                        <div class="stat-value-compact">${this.propertyDB.customers?.length || 0}</div>
                        <div class="stat-title-compact">${this.currentLanguage === 'ar' ? 'العملاء' : 'Customers'}</div>
                    </div>
                </div>

                <!-- الإجراءات السريعة -->
                <div class="quick-actions">
                    <div class="quick-action-card" onclick="propertySystem.navigateTo('properties')">
                        <i class="fas fa-building"></i>
                        <h4>${this.currentLanguage === 'ar' ? 'إدارة العقارات' : 'Properties Management'}</h4>
                        <p>${this.currentLanguage === 'ar' ? 'عرض وإدارة جميع الوحدات' : 'View and manage all units'}</p>
                    </div>
                    <div class="quick-action-card" onclick="propertySystem.navigateTo('payments')">
                        <i class="fas fa-money-bill"></i>
                        <h4>${this.currentLanguage === 'ar' ? 'المدفوعات' : 'Payments'}</h4>
                        <p>${this.currentLanguage === 'ar' ? 'إدارة الدفعات والإيرادات' : 'Manage payments and revenue'}</p>
                    </div>
                    <div class="quick-action-card" onclick="propertySystem.navigateTo('maintenance')">
                        <i class="fas fa-tools"></i>
                        <h4>${this.currentLanguage === 'ar' ? 'الصيانة' : 'Maintenance'}</h4>
                        <p>${this.currentLanguage === 'ar' ? 'متابعة طلبات الصيانة' : 'Track maintenance requests'}</p>
                    </div>
                    <div class="quick-action-card" onclick="propertySystem.navigateTo('reports')">
                        <i class="fas fa-chart-bar"></i>
                        <h4>${this.currentLanguage === 'ar' ? 'التقارير' : 'Reports'}</h4>
                        <p>${this.currentLanguage === 'ar' ? 'عرض التقارير والإحصائيات' : 'View reports and statistics'}</p>
                    </div>
                </div>

                <!-- آخر النشاطات -->
                <div class="activities-compact">
                    <h3><i class="fas fa-clock"></i> ${this.currentLanguage === 'ar' ? 'أحدث النشاطات' : 'Recent Activities'}</h3>
                    <div class="activity-list-compact">
                        ${this.getRecentActivities()}
                    </div>
                </div>

                <!-- التقارير السريعة -->
                <div class="charts-container-compact">
                    <div class="chart-box-compact">
                        <h3><i class="fas fa-chart-pie"></i> ${this.currentLanguage === 'ar' ? 'توزيع الوحدات' : 'Units Distribution'}</h3>
                        <div style="height: 200px; display: flex; align-items: center; justify-content: center; flex-direction: column;">
                            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 20px; height: 20px; background: #28a745; border-radius: 4px;"></div>
                                    <span>${this.currentLanguage === 'ar' ? 'مشغولة' : 'Occupied'}: ${stats.occupied}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="width: 20px; height: 20px; background: #dc3545; border-radius: 4px;"></div>
                                    <span>${this.currentLanguage === 'ar' ? 'شاغرة' : 'Vacant'}: ${stats.vacant}</span>
                                </div>
                            </div>
                            <div style="width: 150px; height: 150px; border-radius: 50%; background: conic-gradient(#28a745 ${(stats.occupied/stats.totalProperties)*360}deg, #dc3545 0);"></div>
                        </div>
                    </div>
                    
                    <div class="chart-box-compact">
                        <h3><i class="fas fa-chart-line"></i> ${this.currentLanguage === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue'}</h3>
                        <div style="height: 200px; display: flex; align-items: end; justify-content: center; gap: 10px; padding: 20px;">
                            <div style="display: flex; flex-direction: column; align-items: center;">
                                <div style="width: 30px; height: ${(1200/2500)*150}px; background: var(--neon-purple); border-radius: 5px;"></div>
                                <small>يناير</small>
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: center;">
                                <div style="width: 30px; height: ${(1200/2500)*150}px; background: var(--neon-purple); border-radius: 5px;"></div>
                                <small>فبراير</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    calculateStats() {
        const totalProperties = this.propertyDB.properties?.length || 0;
        const occupied = this.propertyDB.properties?.filter(p => p.status === 'مشغولة').length || 0;
        const vacant = totalProperties - occupied;
        const totalRevenue = this.propertyDB.payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
        const pendingPayments = this.propertyDB.payments?.filter(p => p.status === 'معلقة').length || 0;

        return { totalProperties, occupied, vacant, totalRevenue, pendingPayments };
    }

    getRecentActivities() {
        const activities = [];
        
        // آخر المدفوعات
        const recentPayments = (this.propertyDB.payments || []).slice(-3).reverse();
        recentPayments.forEach(payment => {
            activities.push({
                icon: 'fa-money-bill-wave',
                text: `${this.currentLanguage === 'ar' ? 'دفعة' : 'Payment'} ${payment.amount} ${this.propertyDB.settings?.currency || 'ريال'}`,
                time: payment.date
            });
        });
        
        // آخر العقود
        const recentContracts = (this.propertyDB.contracts || []).slice(-2).reverse();
        recentContracts.forEach(contract => {
            activities.push({
                icon: 'fa-file-contract',
                text: `${this.currentLanguage === 'ar' ? 'عقد جديد' : 'New contract'}`,
                time: contract.startDate
            });
        });
        
        // آخر الصيانة
        const recentMaintenance = (this.propertyDB.maintenance || []).slice(-2).reverse();
        recentMaintenance.forEach(maintenance => {
            activities.push({
                icon: 'fa-tools',
                text: `${this.currentLanguage === 'ar' ? 'طلب صيانة' : 'Maintenance request'}`,
                time: maintenance.date
            });
        });

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

    // 🔥 قسم إدارة العقارات
    async loadProperties() {
        const content = document.querySelector('.main-content');
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-building"></i> <span data-translate="properties">${this.getTranslation('properties')}</span></h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="propertySystem.showPropertyForm()">
                        <i class="fas fa-plus"></i> ${this.currentLanguage === 'ar' ? 'إضافة وحدة' : 'Add Property'}
                    </button>
                </div>
            </div>
            
            <div class="stats-grid" style="margin-bottom: 20px;">
                <div class="stat-card">
                    <i class="fas fa-building"></i>
                    <div class="stat-value">${this.propertyDB.properties?.length || 0}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'إجمالي الوحدات' : 'Total Units'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-check-circle"></i>
                    <div class="stat-value">${(this.propertyDB.properties || []).filter(p => p.status === 'مشغولة').length}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'وحدات مشغولة' : 'Occupied Units'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-home"></i>
                    <div class="stat-value">${(this.propertyDB.properties || []).filter(p => p.status === 'شاغرة').length}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'وحدات شاغرة' : 'Vacant Units'}</div>
                </div>
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
                            <th>${this.currentLanguage === 'ar' ? 'المستأجر' : 'Tenant'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(this.propertyDB.properties || []).map(property => `
                            <tr>
                                <td><strong>${property.name}</strong></td>
                                <td>${property.type}</td>
                                <td>${property.area}</td>
                                <td>
                                    <span class="status-badge status-${property.status === 'مشغولة' ? 'occupied' : 'vacant'}">
                                        ${property.status}
                                    </span>
                                </td>
                                <td>${property.rent} ${this.propertyDB.settings?.currency || 'ريال'}</td>
                                <td>${property.tenant || '-'}</td>
                                <td class="actions-column">
                                    <div class="action-buttons">
                                        <button class="btn btn-sm btn-edit" onclick="propertySystem.editProperty(${property.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-delete" onclick="propertySystem.deleteProperty(${property.id})">
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

    showPropertyForm(property = null) {
        const isEdit = property !== null;
        const formHTML = `
            <div class="modal-overlay" id="propertyModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-building"></i> ${isEdit ? (this.currentLanguage === 'ar' ? 'تعديل الوحدة' : 'Edit Property') : (this.currentLanguage === 'ar' ? 'إضافة وحدة جديدة' : 'Add New Property')}</h3>
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
                                <option value="محل" ${isEdit && property.type === 'محل' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'محل تجاري' : 'Commercial'}</option>
                                <option value="مكتب" ${isEdit && property.type === 'مكتب' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'مكتب' : 'Office'}</option>
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
                                <option value="صيانة" ${isEdit && property.status === 'صيانة' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'تحت الصيانة' : 'Under Maintenance'}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'المستأجر' : 'Tenant'}:</label>
                            <input type="text" name="tenant" value="${isEdit ? property.tenant : ''}" placeholder="${this.currentLanguage === 'ar' ? 'اسم المستأجر' : 'Tenant name'}">
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الوصف' : 'Description'}:</label>
                            <textarea name="description" rows="3">${isEdit ? property.description : ''}</textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                ${isEdit ? (this.currentLanguage === 'ar' ? 'تحديث الوحدة' : 'Update Property') : (this.currentLanguage === 'ar' ? 'إضافة الوحدة' : 'Add Property')}
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('propertyModal')">
                                ${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                        </div>
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
            id: (this.propertyDB.properties || []).length > 0 ? Math.max(...this.propertyDB.properties.map(p => p.id)) + 1 : 1,
            name: formData.get('name'),
            type: formData.get('type'),
            area: formData.get('area'),
            rent: parseInt(formData.get('rent')),
            status: formData.get('status'),
            tenant: formData.get('tenant'),
            description: formData.get('description'),
            contractEnd: ''
        };
        
        if (!this.propertyDB.properties) this.propertyDB.properties = [];
        this.propertyDB.properties.push(newProperty);
        await this.saveUserData();
        this.closeModal('propertyModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة الوحدة العقارية بنجاح!' : 'Property added successfully!');
        this.loadProperties();
    }

    editProperty(propertyId) {
        const property = (this.propertyDB.properties || []).find(p => p.id === propertyId);
        if (property) {
            this.showPropertyForm(property);
        }
    }

    async updateProperty(event, propertyId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const propertyIndex = (this.propertyDB.properties || []).findIndex(p => p.id === propertyId);
        if (propertyIndex !== -1) {
            this.propertyDB.properties[propertyIndex] = {
                ...this.propertyDB.properties[propertyIndex],
                name: formData.get('name'),
                type: formData.get('type'),
                area: formData.get('area'),
                rent: parseInt(formData.get('rent')),
                status: formData.get('status'),
                tenant: formData.get('tenant'),
                description: formData.get('description')
            };
            
            await this.saveUserData();
            this.closeModal('propertyModal');
            this.showNotification(this.currentLanguage === 'ar' ? 'تم تحديث الوحدة العقارية بنجاح!' : 'Property updated successfully!');
            this.loadProperties();
        }
    }

    async deleteProperty(propertyId) {
        if (confirm(this.currentLanguage === 'ar' ? 'هل أنت متأكد من حذف هذه الوحدة؟' : 'Are you sure you want to delete this property?')) {
            this.propertyDB.properties = (this.propertyDB.properties || []).filter(p => p.id !== propertyId);
            await this.saveUserData();
            this.showNotification(this.currentLanguage === 'ar' ? 'تم حذف الوحدة العقارية بنجاح!' : 'Property deleted successfully!');
            this.loadProperties();
        }
    }

    // 🔥 قسم العملاء
    async loadCustomers() {
        const content = document.querySelector('.main-content');
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-users"></i> <span data-translate="customers">${this.getTranslation('customers')}</span></h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="propertySystem.showCustomerForm()">
                        <i class="fas fa-plus"></i> ${this.currentLanguage === 'ar' ? 'إضافة عميل' : 'Add Customer'}
                    </button>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${this.currentLanguage === 'ar' ? 'الاسم' : 'Name'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'رقم الهاتف' : 'Phone'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'رقم الهوية' : 'ID Number'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'العنوان' : 'Address'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(this.propertyDB.customers || []).map(customer => `
                            <tr>
                                <td><strong>${customer.name}</strong></td>
                                <td>${customer.phone}</td>
                                <td>${customer.email || '-'}</td>
                                <td>${customer.idNumber}</td>
                                <td>${customer.address || '-'}</td>
                                <td class="actions-column">
                                    <div class="action-buttons">
                                        <button class="btn btn-sm btn-edit" onclick="propertySystem.editCustomer(${customer.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-delete" onclick="propertySystem.deleteCustomer(${customer.id})">
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

    showCustomerForm(customer = null) {
        const isEdit = customer !== null;
        const formHTML = `
            <div class="modal-overlay" id="customerModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-plus"></i> ${isEdit ? (this.currentLanguage === 'ar' ? 'تعديل بيانات العميل' : 'Edit Customer') : (this.currentLanguage === 'ar' ? 'إضافة عميل جديد' : 'Add New Customer')}</h3>
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
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'العنوان' : 'Address'}:</label>
                            <textarea name="address" rows="2">${isEdit ? customer.address : ''}</textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                ${isEdit ? (this.currentLanguage === 'ar' ? 'تحديث العميل' : 'Update Customer') : (this.currentLanguage === 'ar' ? 'إضافة العميل' : 'Add Customer')}
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('customerModal')">
                                ${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                        </div>
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
            id: (this.propertyDB.customers || []).length > 0 ? Math.max(...this.propertyDB.customers.map(c => c.id)) + 1 : 1,
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            idNumber: formData.get('idNumber'),
            address: formData.get('address')
        };
        
        if (!this.propertyDB.customers) this.propertyDB.customers = [];
        this.propertyDB.customers.push(newCustomer);
        await this.saveUserData();
        this.closeModal('customerModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة العميل بنجاح!' : 'Customer added successfully!');
        this.loadCustomers();
    }

    editCustomer(customerId) {
        const customer = (this.propertyDB.customers || []).find(c => c.id === customerId);
        if (customer) {
            this.showCustomerForm(customer);
        }
    }

    async updateCustomer(event, customerId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const customerIndex = (this.propertyDB.customers || []).findIndex(c => c.id === customerId);
        if (customerIndex !== -1) {
            this.propertyDB.customers[customerIndex] = {
                ...this.propertyDB.customers[customerIndex],
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                idNumber: formData.get('idNumber'),
                address: formData.get('address')
            };
            
            await this.saveUserData();
            this.closeModal('customerModal');
            this.showNotification(this.currentLanguage === 'ar' ? 'تم تحديث بيانات العميل بنجاح!' : 'Customer updated successfully!');
            this.loadCustomers();
        }
    }

    async deleteCustomer(customerId) {
        if (confirm(this.currentLanguage === 'ar' ? 'هل أنت متأكد من حذف هذا العميل؟' : 'Are you sure you want to delete this customer?')) {
            this.propertyDB.customers = (this.propertyDB.customers || []).filter(c => c.id !== customerId);
            await this.saveUserData();
            this.showNotification(this.currentLanguage === 'ar' ? 'تم حذف العميل بنجاح!' : 'Customer deleted successfully!');
            this.loadCustomers();
        }
    }

    // 🔥 قسم المبيعات - تم إصلاحه
    async loadSales() {
        const content = document.querySelector('.main-content');
        const totalSales = (this.propertyDB.sales || []).reduce((sum, sale) => sum + (sale.amount || 0), 0);
        const totalCommissions = (this.propertyDB.sales || []).reduce((sum, sale) => sum + (sale.commission || 0), 0);
        
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-shopping-cart"></i> <span data-translate="sales">${this.getTranslation('sales')}</span></h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="propertySystem.showSaleForm()">
                        <i class="fas fa-plus"></i> ${this.currentLanguage === 'ar' ? 'إضافة عملية بيع' : 'Add Sale'}
                    </button>
                </div>
            </div>

            <div class="stats-grid" style="margin-bottom: 20px;">
                <div class="stat-card">
                    <i class="fas fa-money-bill-wave"></i>
                    <div class="stat-value">${(this.propertyDB.sales || []).length}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'إجمالي المبيعات' : 'Total Sales'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-chart-line"></i>
                    <div class="stat-value">${totalSales.toLocaleString()}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'قيمة المبيعات' : 'Sales Value'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-handshake"></i>
                    <div class="stat-value">${totalCommissions.toLocaleString()}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'إجمالي العمولات' : 'Total Commissions'}</div>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${this.currentLanguage === 'ar' ? 'رقم العملية' : 'Sale ID'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'العميل' : 'Customer'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الوحدة' : 'Property'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'المبلغ' : 'Amount'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'العمولة' : 'Commission'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'التاريخ' : 'Date'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(this.propertyDB.sales || []).map(sale => {
                            const customer = (this.propertyDB.customers || []).find(c => c.id === sale.customerId);
                            const property = (this.propertyDB.properties || []).find(p => p.id === sale.propertyId);
                            return `
                                <tr>
                                    <td>#${sale.id}</td>
                                    <td>${customer?.name || 'غير معروف'}</td>
                                    <td>${property?.name || 'غير معروف'}</td>
                                    <td>${(sale.amount || 0).toLocaleString()} ${this.propertyDB.settings?.currency || 'ريال'}</td>
                                    <td>${sale.commission ? (sale.commission || 0).toLocaleString() + ' ' + (this.propertyDB.settings?.currency || 'ريال') : '-'}</td>
                                    <td>${sale.date || ''}</td>
                                    <td>
                                        <span class="status-badge status-${sale.status === 'مكتمل' ? 'active' : 'pending'}">
                                            ${sale.status || 'معلق'}
                                        </span>
                                    </td>
                                    <td class="actions-column">
                                        <div class="action-buttons">
                                            <button class="btn btn-sm btn-edit" onclick="propertySystem.editSale(${sale.id})">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-delete" onclick="propertySystem.deleteSale(${sale.id})">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    showSaleForm(sale = null) {
        const isEdit = sale !== null;
        const formHTML = `
            <div class="modal-overlay" id="saleModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-shopping-cart"></i> ${isEdit ? (this.currentLanguage === 'ar' ? 'تعديل عملية البيع' : 'Edit Sale') : (this.currentLanguage === 'ar' ? 'إضافة عملية بيع جديدة' : 'Add New Sale')}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('saleModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.${isEdit ? 'updateSale' : 'addSale'}(event, ${isEdit ? sale.id : ''})">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'العميل' : 'Customer'}:</label>
                            <select name="customerId" required>
                                <option value="">${this.currentLanguage === 'ar' ? 'اختر العميل' : 'Select Customer'}</option>
                                ${(this.propertyDB.customers || []).map(customer => `
                                    <option value="${customer.id}" ${isEdit && sale.customerId === customer.id ? 'selected' : ''}>${customer.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الوحدة' : 'Property'}:</label>
                            <select name="propertyId" required>
                                <option value="">${this.currentLanguage === 'ar' ? 'اختر الوحدة' : 'Select Property'}</option>
                                ${(this.propertyDB.properties || []).map(property => `
                                    <option value="${property.id}" ${isEdit && sale.propertyId === property.id ? 'selected' : ''}>${property.name} - ${property.type}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'المبلغ' : 'Amount'}:</label>
                            <input type="number" name="amount" value="${isEdit ? sale.amount : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'نسبة العمولة %' : 'Commission %'}:</label>
                            <input type="number" name="commissionPercentage" min="0" max="100" value="${isEdit ? ((sale.commission / sale.amount) * 100) || 5 : 5}">
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'التاريخ' : 'Date'}:</label>
                            <input type="date" name="date" value="${isEdit ? sale.date : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}:</label>
                            <select name="status" required>
                                <option value="مكتمل" ${isEdit && sale.status === 'مكتمل' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'مكتمل' : 'Completed'}</option>
                                <option value="معلق" ${isEdit && sale.status === 'معلق' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'معلق' : 'Pending'}</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">${isEdit ? (this.currentLanguage === 'ar' ? 'تحديث العملية' : 'Update Sale') : (this.currentLanguage === 'ar' ? 'إضافة العملية' : 'Add Sale')}</button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('saleModal')">
                                ${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.showModal(formHTML);
    }

    async addSale(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const amount = parseInt(formData.get('amount'));
        const commissionPercentage = parseInt(formData.get('commissionPercentage'));
        const commission = (amount * commissionPercentage) / 100;
        
        const newSale = {
            id: (this.propertyDB.sales || []).length > 0 ? Math.max(...this.propertyDB.sales.map(s => s.id)) + 1 : 1,
            customerId: parseInt(formData.get('customerId')),
            propertyId: parseInt(formData.get('propertyId')),
            amount: amount,
            commission: commission,
            date: formData.get('date'),
            status: formData.get('status')
        };
        
        if (!this.propertyDB.sales) this.propertyDB.sales = [];
        this.propertyDB.sales.push(newSale);
        await this.saveUserData();
        this.closeModal('saleModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة عملية البيع بنجاح!' : 'Sale added successfully!');
        this.loadSales();
    }

    editSale(saleId) {
        const sale = (this.propertyDB.sales || []).find(s => s.id === saleId);
        if (sale) {
            this.showSaleForm(sale);
        }
    }

    async updateSale(event, saleId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const amount = parseInt(formData.get('amount'));
        const commissionPercentage = parseInt(formData.get('commissionPercentage'));
        const commission = (amount * commissionPercentage) / 100;
        
        const saleIndex = (this.propertyDB.sales || []).findIndex(s => s.id === saleId);
        if (saleIndex !== -1) {
            this.propertyDB.sales[saleIndex] = {
                ...this.propertyDB.sales[saleIndex],
                customerId: parseInt(formData.get('customerId')),
                propertyId: parseInt(formData.get('propertyId')),
                amount: amount,
                commission: commission,
                date: formData.get('date'),
                status: formData.get('status')
            };
            
            await this.saveUserData();
            this.closeModal('saleModal');
            this.showNotification(this.currentLanguage === 'ar' ? 'تم تحديث عملية البيع بنجاح!' : 'Sale updated successfully!');
            this.loadSales();
        }
    }

    async deleteSale(saleId) {
        if (confirm(this.currentLanguage === 'ar' ? 'هل أنت متأكد من حذف عملية البيع هذه؟' : 'Are you sure you want to delete this sale?')) {
            this.propertyDB.sales = (this.propertyDB.sales || []).filter(s => s.id !== saleId);
            await this.saveUserData();
            this.showNotification(this.currentLanguage === 'ar' ? 'تم حذف عملية البيع بنجاح!' : 'Sale deleted successfully!');
            this.loadSales();
        }
    }

    // 🔥 قسم العقود
    async loadContracts() {
        const content = document.querySelector('.main-content');
        const activeContracts = (this.propertyDB.contracts || []).filter(c => c.status === 'نشط').length;
        const expiredContracts = (this.propertyDB.contracts || []).filter(c => c.status === 'منتهي').length;
        
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-file-contract"></i> <span data-translate="contracts">${this.getTranslation('contracts')}</span></h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="propertySystem.showContractForm()">
                        <i class="fas fa-plus"></i> ${this.currentLanguage === 'ar' ? 'إضافة عقد' : 'Add Contract'}
                    </button>
                </div>
            </div>

            <div class="stats-grid" style="margin-bottom: 20px;">
                <div class="stat-card">
                    <i class="fas fa-file-contract"></i>
                    <div class="stat-value">${(this.propertyDB.contracts || []).length}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'إجمالي العقود' : 'Total Contracts'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-check-circle"></i>
                    <div class="stat-value">${activeContracts}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'عقود نشطة' : 'Active Contracts'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-times-circle"></i>
                    <div class="stat-value">${expiredContracts}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'عقود منتهية' : 'Expired Contracts'}</div>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${this.currentLanguage === 'ar' ? 'رقم العقد' : 'Contract ID'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الوحدة' : 'Property'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'المستأجر' : 'Tenant'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'تاريخ البدء' : 'Start Date'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'قيمة الإيجار' : 'Rent Amount'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(this.propertyDB.contracts || []).map(contract => {
                            const property = (this.propertyDB.properties || []).find(p => p.id === contract.propertyId);
                            const customer = (this.propertyDB.customers || []).find(c => c.id === contract.customerId);
                            return `
                                <tr>
                                    <td>#${contract.id}</td>
                                    <td>${property?.name || 'غير معروف'}</td>
                                    <td>${customer?.name || 'غير معروف'}</td>
                                    <td>${contract.startDate}</td>
                                    <td>${contract.endDate}</td>
                                    <td>${contract.rentAmount} ${this.propertyDB.settings?.currency || 'ريال'}</td>
                                    <td>
                                        <span class="status-badge status-${contract.status === 'نشط' ? 'active' : 'inactive'}">
                                            ${contract.status}
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    showContractForm() {
        const formHTML = `
            <div class="modal-overlay" id="contractModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-file-contract"></i> ${this.currentLanguage === 'ar' ? 'إضافة عقد جديد' : 'Add New Contract'}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('contractModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.addContract(event)">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الوحدة' : 'Property'}:</label>
                            <select name="propertyId" required>
                                <option value="">${this.currentLanguage === 'ar' ? 'اختر الوحدة' : 'Select Property'}</option>
                                ${(this.propertyDB.properties || []).map(property => `
                                    <option value="${property.id}">${property.name} - ${property.type}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'المستأجر' : 'Tenant'}:</label>
                            <select name="customerId" required>
                                <option value="">${this.currentLanguage === 'ar' ? 'اختر المستأجر' : 'Select Tenant'}</option>
                                ${(this.propertyDB.customers || []).map(customer => `
                                    <option value="${customer.id}">${customer.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'تاريخ البدء' : 'Start Date'}:</label>
                            <input type="date" name="startDate" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}:</label>
                            <input type="date" name="endDate" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'قيمة الإيجار' : 'Rent Amount'}:</label>
                            <input type="number" name="rentAmount" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'ملاحظات' : 'Notes'}:</label>
                            <textarea name="notes" rows="3"></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">${this.currentLanguage === 'ar' ? 'إضافة العقد' : 'Add Contract'}</button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('contractModal')">
                                ${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.showModal(formHTML);
    }

    async addContract(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const newContract = {
            id: (this.propertyDB.contracts || []).length > 0 ? Math.max(...this.propertyDB.contracts.map(c => c.id)) + 1 : 1,
            propertyId: parseInt(formData.get('propertyId')),
            customerId: parseInt(formData.get('customerId')),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            rentAmount: parseInt(formData.get('rentAmount')),
            status: 'نشط',
            notes: formData.get('notes')
        };
        
        if (!this.propertyDB.contracts) this.propertyDB.contracts = [];
        this.propertyDB.contracts.push(newContract);
        await this.saveUserData();
        this.closeModal('contractModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة العقد بنجاح!' : 'Contract added successfully!');
        this.loadContracts();
    }

    // 🔥 قسم المدفوعات
    async loadPayments() {
        const content = document.querySelector('.main-content');
        const totalPaid = (this.propertyDB.payments || []).filter(p => p.status === 'مدفوع').reduce((sum, p) => sum + p.amount, 0);
        const totalPending = (this.propertyDB.payments || []).filter(p => p.status === 'معلقة').reduce((sum, p) => sum + p.amount, 0);
        
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-money-bill"></i> <span data-translate="payments">${this.getTranslation('payments')}</span></h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="propertySystem.showPaymentForm()">
                        <i class="fas fa-plus"></i> ${this.currentLanguage === 'ar' ? 'إضافة دفعة' : 'Add Payment'}
                    </button>
                </div>
            </div>

            <div class="stats-grid" style="margin-bottom: 20px;">
                <div class="stat-card">
                    <i class="fas fa-money-bill-wave"></i>
                    <div class="stat-value">${(this.propertyDB.payments || []).length}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'إجمالي الدفعات' : 'Total Payments'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-check-circle"></i>
                    <div class="stat-value">${totalPaid.toLocaleString()}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'المدفوع' : 'Paid Amount'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-clock"></i>
                    <div class="stat-value">${totalPending.toLocaleString()}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'المعلقة' : 'Pending Amount'}</div>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${this.currentLanguage === 'ar' ? 'رقم الدفعة' : 'Payment ID'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'العقد' : 'Contract'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'المبلغ' : 'Amount'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'التاريخ' : 'Date'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الوصف' : 'Description'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(this.propertyDB.payments || []).map(payment => {
                            const contract = (this.propertyDB.contracts || []).find(c => c.id === payment.contractId);
                            return `
                                <tr>
                                    <td>#${payment.id}</td>
                                    <td>${contract ? `عقد #${contract.id}` : 'غير معروف'}</td>
                                    <td>${payment.amount} ${this.propertyDB.settings?.currency || 'ريال'}</td>
                                    <td>${payment.date}</td>
                                    <td>${payment.method}</td>
                                    <td>${payment.description}</td>
                                    <td>
                                        <span class="status-badge status-${payment.status === 'مدفوع' ? 'paid' : 'pending'}">
                                            ${payment.status}
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    showPaymentForm() {
        const formHTML = `
            <div class="modal-overlay" id="paymentModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-money-bill"></i> ${this.currentLanguage === 'ar' ? 'إضافة دفعة جديدة' : 'Add New Payment'}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('paymentModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.addPayment(event)">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'العقد' : 'Contract'}:</label>
                            <select name="contractId" required>
                                <option value="">${this.currentLanguage === 'ar' ? 'اختر العقد' : 'Select Contract'}</option>
                                ${(this.propertyDB.contracts || []).map(contract => `
                                    <option value="${contract.id}">عقد #${contract.id}</option>
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
                            <label>${this.currentLanguage === 'ar' ? 'طريقة الدفع' : 'Payment Method'}:</label>
                            <select name="method" required>
                                <option value="نقدي">${this.currentLanguage === 'ar' ? 'نقدي' : 'Cash'}</option>
                                <option value="تحويل بنكي">${this.currentLanguage === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                                <option value="شيك">${this.currentLanguage === 'ar' ? 'شيك' : 'Check'}</option>
                                <option value="بطاقة ائتمان">${this.currentLanguage === 'ar' ? 'بطاقة ائتمان' : 'Credit Card'}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الوصف' : 'Description'}:</label>
                            <input type="text" name="description" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}:</label>
                            <select name="status" required>
                                <option value="مدفوع">${this.currentLanguage === 'ar' ? 'مدفوع' : 'Paid'}</option>
                                <option value="معلقة">${this.currentLanguage === 'ar' ? 'معلقة' : 'Pending'}</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">${this.currentLanguage === 'ar' ? 'إضافة الدفعة' : 'Add Payment'}</button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('paymentModal')">
                                ${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.showModal(formHTML);
    }

    async addPayment(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const newPayment = {
            id: (this.propertyDB.payments || []).length > 0 ? Math.max(...this.propertyDB.payments.map(p => p.id)) + 1 : 1,
            contractId: parseInt(formData.get('contractId')),
            amount: parseInt(formData.get('amount')),
            date: formData.get('date'),
            method: formData.get('method'),
            description: formData.get('description'),
            status: formData.get('status')
        };
        
        if (!this.propertyDB.payments) this.propertyDB.payments = [];
        this.propertyDB.payments.push(newPayment);
        await this.saveUserData();
        this.closeModal('paymentModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة الدفعة بنجاح!' : 'Payment added successfully!');
        this.loadPayments();
    }

    // 🔥 قسم العمولات - تم إصلاحه
    async loadCommissions() {
        const content = document.querySelector('.main-content');
        const totalCommissions = (this.propertyDB.commissions || []).reduce((sum, c) => sum + (c.amount || 0), 0);
        const paidCommissions = (this.propertyDB.commissions || []).filter(c => c.status === 'مدفوعة').reduce((sum, c) => sum + (c.amount || 0), 0);
        const pendingCommissions = (this.propertyDB.commissions || []).filter(c => c.status === 'معلقة').reduce((sum, c) => sum + (c.amount || 0), 0);
        
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-handshake"></i> <span data-translate="commissions">${this.getTranslation('commissions')}</span></h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="propertySystem.showCommissionForm()">
                        <i class="fas fa-plus"></i> ${this.currentLanguage === 'ar' ? 'إضافة عمولة' : 'Add Commission'}
                    </button>
                </div>
            </div>

            <div class="stats-grid" style="margin-bottom: 20px;">
                <div class="stat-card">
                    <i class="fas fa-handshake"></i>
                    <div class="stat-value">${(this.propertyDB.commissions || []).length}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'إجمالي العمولات' : 'Total Commissions'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-check-circle"></i>
                    <div class="stat-value">${paidCommissions.toLocaleString()}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'المدفوعة' : 'Paid Commissions'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-clock"></i>
                    <div class="stat-value">${pendingCommissions.toLocaleString()}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'المعلقة' : 'Pending Commissions'}</div>
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
                            <th>${this.currentLanguage === 'ar' ? 'التاريخ' : 'Date'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(this.propertyDB.commissions || []).map(commission => `
                            <tr>
                                <td>${commission.agent}</td>
                                <td>${commission.transaction}</td>
                                <td>${commission.percentage}%</td>
                                <td>${(commission.amount || 0).toLocaleString()} ${this.propertyDB.settings?.currency || 'ريال'}</td>
                                <td>${commission.date}</td>
                                <td>
                                    <span class="status-badge status-${commission.status === 'مدفوعة' ? 'paid' : 'pending'}">
                                        ${commission.status}
                                    </span>
                                </td>
                                <td class="actions-column">
                                    <div class="action-buttons">
                                        <button class="btn btn-sm btn-edit" onclick="propertySystem.editCommission(${commission.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-delete" onclick="propertySystem.deleteCommission(${commission.id})">
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

    showCommissionForm(commission = null) {
        const isEdit = commission !== null;
        const formHTML = `
            <div class="modal-overlay" id="commissionModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-handshake"></i> ${isEdit ? (this.currentLanguage === 'ar' ? 'تعديل العمولة' : 'Edit Commission') : (this.currentLanguage === 'ar' ? 'إضافة عمولة جديدة' : 'Add New Commission')}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('commissionModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.${isEdit ? 'updateCommission' : 'addCommission'}(event, ${isEdit ? commission.id : ''})">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'اسم الوسيط' : 'Agent Name'}:</label>
                            <input type="text" name="agent" value="${isEdit ? commission.agent : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'العملية' : 'Transaction'}:</label>
                            <input type="text" name="transaction" value="${isEdit ? commission.transaction : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'نسبة العمولة %' : 'Commission %'}:</label>
                            <input type="number" name="percentage" min="1" max="100" value="${isEdit ? commission.percentage : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'المبلغ' : 'Amount'}:</label>
                            <input type="number" name="amount" value="${isEdit ? commission.amount : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'التاريخ' : 'Date'}:</label>
                            <input type="date" name="date" value="${isEdit ? commission.date : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}:</label>
                            <select name="status" required>
                                <option value="مدفوعة" ${isEdit && commission.status === 'مدفوعة' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'مدفوعة' : 'Paid'}</option>
                                <option value="معلقة" ${isEdit && commission.status === 'معلقة' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'معلقة' : 'Pending'}</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">${isEdit ? (this.currentLanguage === 'ar' ? 'تحديث العمولة' : 'Update Commission') : (this.currentLanguage === 'ar' ? 'إضافة العمولة' : 'Add Commission')}</button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('commissionModal')">
                                ${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                        </div>
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
            id: (this.propertyDB.commissions || []).length > 0 ? Math.max(...this.propertyDB.commissions.map(c => c.id)) + 1 : 1,
            agent: formData.get('agent'),
            transaction: formData.get('transaction'),
            percentage: parseInt(formData.get('percentage')),
            amount: parseInt(formData.get('amount')),
            date: formData.get('date'),
            status: formData.get('status')
        };
        
        if (!this.propertyDB.commissions) this.propertyDB.commissions = [];
        this.propertyDB.commissions.push(newCommission);
        await this.saveUserData();
        this.closeModal('commissionModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة العمولة بنجاح!' : 'Commission added successfully!');
        this.loadCommissions();
    }

    editCommission(commissionId) {
        const commission = (this.propertyDB.commissions || []).find(c => c.id === commissionId);
        if (commission) {
            this.showCommissionForm(commission);
        }
    }

    async updateCommission(event, commissionId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const commissionIndex = (this.propertyDB.commissions || []).findIndex(c => c.id === commissionId);
        if (commissionIndex !== -1) {
            this.propertyDB.commissions[commissionIndex] = {
                ...this.propertyDB.commissions[commissionIndex],
                agent: formData.get('agent'),
                transaction: formData.get('transaction'),
                percentage: parseInt(formData.get('percentage')),
                amount: parseInt(formData.get('amount')),
                date: formData.get('date'),
                status: formData.get('status')
            };
            
            await this.saveUserData();
            this.closeModal('commissionModal');
            this.showNotification(this.currentLanguage === 'ar' ? 'تم تحديث العمولة بنجاح!' : 'Commission updated successfully!');
            this.loadCommissions();
        }
    }

    async deleteCommission(commissionId) {
        if (confirm(this.currentLanguage === 'ar' ? 'هل أنت متأكد من حذف هذه العمولة؟' : 'Are you sure you want to delete this commission?')) {
            this.propertyDB.commissions = (this.propertyDB.commissions || []).filter(c => c.id !== commissionId);
            await this.saveUserData();
            this.showNotification(this.currentLanguage === 'ar' ? 'تم حذف العمولة بنجاح!' : 'Commission deleted successfully!');
            this.loadCommissions();
        }
    }

    // 🔥 قسم الصيانة
    async loadMaintenance() {
        const content = document.querySelector('.main-content');
        const completed = (this.propertyDB.maintenance || []).filter(m => m.status === 'مكتمل').length;
        const inProgress = (this.propertyDB.maintenance || []).filter(m => m.status === 'قيد التنفيذ').length;
        const pending = (this.propertyDB.maintenance || []).filter(m => m.status === 'معلقة').length;
        
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-tools"></i> <span data-translate="maintenance">${this.getTranslation('maintenance')}</span></h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="propertySystem.showMaintenanceForm()">
                        <i class="fas fa-plus"></i> ${this.currentLanguage === 'ar' ? 'إضافة طلب صيانة' : 'Add Maintenance'}
                    </button>
                </div>
            </div>

            <div class="stats-grid" style="margin-bottom: 20px;">
                <div class="stat-card">
                    <i class="fas fa-tools"></i>
                    <div class="stat-value">${(this.propertyDB.maintenance || []).length}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'إجمالي الطلبات' : 'Total Requests'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-check-circle"></i>
                    <div class="stat-value">${completed}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'مكتملة' : 'Completed'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-clock"></i>
                    <div class="stat-value">${inProgress + pending}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'قيد المعالجة' : 'In Progress'}</div>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${this.currentLanguage === 'ar' ? 'رقم الطلب' : 'Request ID'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الوحدة' : 'Property'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'نوع الصيانة' : 'Type'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الوصف' : 'Description'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'التكلفة' : 'Cost'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'التاريخ' : 'Date'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(this.propertyDB.maintenance || []).map(maintenance => {
                            const property = (this.propertyDB.properties || []).find(p => p.id === maintenance.propertyId);
                            return `
                                <tr>
                                    <td>#${maintenance.id}</td>
                                    <td>${property?.name || 'غير معروف'}</td>
                                    <td>${maintenance.type}</td>
                                    <td>${maintenance.description}</td>
                                    <td>${maintenance.cost} ${this.propertyDB.settings?.currency || 'ريال'}</td>
                                    <td>${maintenance.date}</td>
                                    <td>
                                        <span class="status-badge status-${maintenance.status === 'مكتمل' ? 'active' : maintenance.status === 'قيد التنفيذ' ? 'in-progress' : 'pending'}">
                                            ${maintenance.status}
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    showMaintenanceForm() {
        const formHTML = `
            <div class="modal-overlay" id="maintenanceModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-tools"></i> ${this.currentLanguage === 'ar' ? 'إضافة طلب صيانة جديد' : 'Add New Maintenance'}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('maintenanceModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.addMaintenance(event)">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الوحدة' : 'Property'}:</label>
                            <select name="propertyId" required>
                                <option value="">${this.currentLanguage === 'ar' ? 'اختر الوحدة' : 'Select Property'}</option>
                                ${(this.propertyDB.properties || []).map(property => `
                                    <option value="${property.id}">${property.name} - ${property.type}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'نوع الصيانة' : 'Maintenance Type'}:</label>
                            <select name="type" required>
                                <option value="صيانة دورية">${this.currentLanguage === 'ar' ? 'صيانة دورية' : 'Routine Maintenance'}</option>
                                <option value="تصليح">${this.currentLanguage === 'ar' ? 'تصليح' : 'Repair'}</option>
                                <option value="استبدال">${this.currentLanguage === 'ar' ? 'استبدال' : 'Replacement'}</option>
                                <option value="تنظيف">${this.currentLanguage === 'ar' ? 'تنظيف' : 'Cleaning'}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الوصف' : 'Description'}:</label>
                            <textarea name="description" rows="3" required></textarea>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'التكلفة' : 'Cost'}:</label>
                            <input type="number" name="cost" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'التاريخ' : 'Date'}:</label>
                            <input type="date" name="date" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}:</label>
                            <select name="status" required>
                                <option value="معلقة">${this.currentLanguage === 'ar' ? 'معلقة' : 'Pending'}</option>
                                <option value="قيد التنفيذ">${this.currentLanguage === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</option>
                                <option value="مكتمل">${this.currentLanguage === 'ar' ? 'مكتمل' : 'Completed'}</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">${this.currentLanguage === 'ar' ? 'إضافة الطلب' : 'Add Maintenance'}</button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('maintenanceModal')">
                                ${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.showModal(formHTML);
    }

    async addMaintenance(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const newMaintenance = {
            id: (this.propertyDB.maintenance || []).length > 0 ? Math.max(...this.propertyDB.maintenance.map(m => m.id)) + 1 : 1,
            propertyId: parseInt(formData.get('propertyId')),
            type: formData.get('type'),
            description: formData.get('description'),
            cost: parseInt(formData.get('cost')),
            date: formData.get('date'),
            status: formData.get('status')
        };
        
        if (!this.propertyDB.maintenance) this.propertyDB.maintenance = [];
        this.propertyDB.maintenance.push(newMaintenance);
        await this.saveUserData();
        this.closeModal('maintenanceModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة طلب الصيانة بنجاح!' : 'Maintenance added successfully!');
        this.loadMaintenance();
    }

    // 🔥 قسم الجرد - تم إصلاحه
    async loadInventory() {
        const content = document.querySelector('.main-content');
        const totalItems = (this.propertyDB.inventory || []).length;
        const lowStock = (this.propertyDB.inventory || []).filter(item => item.quantity <= item.minQuantity).length;
        const totalValue = (this.propertyDB.inventory || []).reduce((sum, item) => sum + (item.quantity * item.price), 0);
        
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-boxes"></i> <span data-translate="inventory">${this.getTranslation('inventory')}</span></h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="propertySystem.showInventoryForm()">
                        <i class="fas fa-plus"></i> ${this.currentLanguage === 'ar' ? 'إضافة عنصر' : 'Add Item'}
                    </button>
                </div>
            </div>

            <div class="stats-grid" style="margin-bottom: 20px;">
                <div class="stat-card">
                    <i class="fas fa-boxes"></i>
                    <div class="stat-value">${totalItems}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'إجمالي العناصر' : 'Total Items'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div class="stat-value">${lowStock}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'منخفضة المخزون' : 'Low Stock'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-money-bill-wave"></i>
                    <div class="stat-value">${totalValue.toLocaleString()}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'قيمة المخزون' : 'Inventory Value'}</div>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${this.currentLanguage === 'ar' ? 'اسم العنصر' : 'Item Name'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الفئة' : 'Category'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الكمية' : 'Quantity'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الحد الأدنى' : 'Min Quantity'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'السعر' : 'Price'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'القيمة' : 'Value'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(this.propertyDB.inventory || []).map(item => {
                            const totalValue = item.quantity * item.price;
                            let status = 'متوفر';
                            let statusClass = 'active';
                            
                            if (item.quantity === 0) {
                                status = 'نافذ';
                                statusClass = 'inactive';
                            } else if (item.quantity <= item.minQuantity) {
                                status = 'منخفض';
                                statusClass = 'warning';
                            }
                            
                            return `
                                <tr>
                                    <td><strong>${item.name}</strong></td>
                                    <td>${item.category}</td>
                                    <td>${item.quantity}</td>
                                    <td>${item.minQuantity}</td>
                                    <td>${item.price} ${this.propertyDB.settings?.currency || 'ريال'}</td>
                                    <td>${totalValue} ${this.propertyDB.settings?.currency || 'ريال'}</td>
                                    <td>
                                        <span class="status-badge status-${statusClass}">
                                            ${status}
                                        </span>
                                    </td>
                                    <td class="actions-column">
                                        <div class="action-buttons">
                                            <button class="btn btn-sm btn-edit" onclick="propertySystem.editInventoryItem(${item.id})">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-delete" onclick="propertySystem.deleteInventoryItem(${item.id})">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    showInventoryForm(item = null) {
        const isEdit = item !== null;
        const formHTML = `
            <div class="modal-overlay" id="inventoryModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-boxes"></i> ${isEdit ? (this.currentLanguage === 'ar' ? 'تعديل العنصر' : 'Edit Item') : (this.currentLanguage === 'ar' ? 'إضافة عنصر جديد' : 'Add New Item')}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('inventoryModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.${isEdit ? 'updateInventoryItem' : 'addInventoryItem'}(event, ${isEdit ? item.id : ''})">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'اسم العنصر' : 'Item Name'}:</label>
                            <input type="text" name="name" value="${isEdit ? item.name : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الفئة' : 'Category'}:</label>
                            <select name="category" required>
                                <option value="أدوات" ${isEdit && item.category === 'أدوات' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'أدوات' : 'Tools'}</option>
                                <option value="مواد بناء" ${isEdit && item.category === 'مواد بناء' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'مواد بناء' : 'Construction Materials'}</option>
                                <option value="كهرباء" ${isEdit && item.category === 'كهرباء' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'كهرباء' : 'Electrical'}</option>
                                <option value="سباكة" ${isEdit && item.category === 'سباكة' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'سباكة' : 'Plumbing'}</option>
                                <option value="دهانات" ${isEdit && item.category === 'دهانات' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'دهانات' : 'Paints'}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الكمية' : 'Quantity'}:</label>
                            <input type="number" name="quantity" value="${isEdit ? item.quantity : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الحد الأدنى' : 'Min Quantity'}:</label>
                            <input type="number" name="minQuantity" value="${isEdit ? item.minQuantity : 1}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'السعر' : 'Price'}:</label>
                            <input type="number" name="price" value="${isEdit ? item.price : ''}" required>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">${isEdit ? (this.currentLanguage === 'ar' ? 'تحديث العنصر' : 'Update Item') : (this.currentLanguage === 'ar' ? 'إضافة العنصر' : 'Add Item')}</button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('inventoryModal')">
                                ${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                        </div>
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
            id: (this.propertyDB.inventory || []).length > 0 ? Math.max(...this.propertyDB.inventory.map(i => i.id)) + 1 : 1,
            name: formData.get('name'),
            category: formData.get('category'),
            quantity: parseInt(formData.get('quantity')),
            minQuantity: parseInt(formData.get('minQuantity')),
            price: parseInt(formData.get('price'))
        };
        
        if (!this.propertyDB.inventory) this.propertyDB.inventory = [];
        this.propertyDB.inventory.push(newItem);
        await this.saveUserData();
        this.closeModal('inventoryModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة العنصر بنجاح!' : 'Item added successfully!');
        this.loadInventory();
    }

    editInventoryItem(itemId) {
        const item = (this.propertyDB.inventory || []).find(i => i.id === itemId);
        if (item) {
            this.showInventoryForm(item);
        }
    }

    async updateInventoryItem(event, itemId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const itemIndex = (this.propertyDB.inventory || []).findIndex(i => i.id === itemId);
        if (itemIndex !== -1) {
            this.propertyDB.inventory[itemIndex] = {
                ...this.propertyDB.inventory[itemIndex],
                name: formData.get('name'),
                category: formData.get('category'),
                quantity: parseInt(formData.get('quantity')),
                minQuantity: parseInt(formData.get('minQuantity')),
                price: parseInt(formData.get('price'))
            };
            
            await this.saveUserData();
            this.closeModal('inventoryModal');
            this.showNotification(this.currentLanguage === 'ar' ? 'تم تحديث العنصر بنجاح!' : 'Item updated successfully!');
            this.loadInventory();
        }
    }

    async deleteInventoryItem(itemId) {
        if (confirm(this.currentLanguage === 'ar' ? 'هل أنت متأكد من حذف هذا العنصر؟' : 'Are you sure you want to delete this item?')) {
            this.propertyDB.inventory = (this.propertyDB.inventory || []).filter(i => i.id !== itemId);
            await this.saveUserData();
            this.showNotification(this.currentLanguage === 'ar' ? 'تم حذف العنصر بنجاح!' : 'Item deleted successfully!');
            this.loadInventory();
        }
    }

    // 🔥 قسم الحسابات - تم إصلاحه
    async loadAccounts() {
        const content = document.querySelector('.main-content');
        const stats = this.calculateFinancialStats();
        
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-chart-line"></i> <span data-translate="accounts">${this.getTranslation('accounts')}</span></h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="propertySystem.showAccountForm()">
                        <i class="fas fa-plus"></i> ${this.currentLanguage === 'ar' ? 'إضافة حركة' : 'Add Transaction'}
                    </button>
                </div>
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
                            <th>${this.currentLanguage === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(this.propertyDB.accounts || []).map(account => `
                            <tr>
                                <td>${account.date}</td>
                                <td>${account.description}</td>
                                <td>
                                    <span class="status-badge status-${account.type === 'إيراد' ? 'active' : 'inactive'}">
                                        ${account.type}
                                    </span>
                                </td>
                                <td>${account.amount} ${this.propertyDB.settings?.currency || 'ريال'}</td>
                                <td class="actions-column">
                                    <div class="action-buttons">
                                        <button class="btn btn-sm btn-edit" onclick="propertySystem.editAccount(${account.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-delete" onclick="propertySystem.deleteAccount(${account.id})">
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

    calculateFinancialStats() {
        const totalRevenue = (this.propertyDB.accounts || [])
            .filter(a => a.type === 'إيراد')
            .reduce((sum, account) => sum + (account.amount || 0), 0);
            
        const totalExpenses = (this.propertyDB.accounts || [])
            .filter(a => a.type === 'مصروف')
            .reduce((sum, account) => sum + (account.amount || 0), 0);
            
        const netProfit = totalRevenue - totalExpenses;

        return { totalRevenue, totalExpenses, netProfit };
    }

    showAccountForm(account = null) {
        const isEdit = account !== null;
        const formHTML = `
            <div class="modal-overlay" id="accountModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-chart-line"></i> ${isEdit ? (this.currentLanguage === 'ar' ? 'تعديل الحركة' : 'Edit Transaction') : (this.currentLanguage === 'ar' ? 'إضافة حركة جديدة' : 'Add New Transaction')}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('accountModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.${isEdit ? 'updateAccount' : 'addAccount'}(event, ${isEdit ? account.id : ''})">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'التاريخ' : 'Date'}:</label>
                            <input type="date" name="date" value="${isEdit ? account.date : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الوصف' : 'Description'}:</label>
                            <input type="text" name="description" value="${isEdit ? account.description : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'النوع' : 'Type'}:</label>
                            <select name="type" required>
                                <option value="إيراد" ${isEdit && account.type === 'إيراد' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'إيراد' : 'Revenue'}</option>
                                <option value="مصروف" ${isEdit && account.type === 'مصروف' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'مصروف' : 'Expense'}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'المبلغ' : 'Amount'}:</label>
                            <input type="number" name="amount" value="${isEdit ? account.amount : ''}" required>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">${isEdit ? (this.currentLanguage === 'ar' ? 'تحديث الحركة' : 'Update Transaction') : (this.currentLanguage === 'ar' ? 'إضافة الحركة' : 'Add Transaction')}</button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('accountModal')">
                                ${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        this.showModal(formHTML);
    }

    async addAccount(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const newAccount = {
            id: (this.propertyDB.accounts || []).length > 0 ? Math.max(...this.propertyDB.accounts.map(a => a.id)) + 1 : 1,
            date: formData.get('date'),
            description: formData.get('description'),
            type: formData.get('type'),
            amount: parseInt(formData.get('amount'))
        };
        
        if (!this.propertyDB.accounts) this.propertyDB.accounts = [];
        this.propertyDB.accounts.push(newAccount);
        await this.saveUserData();
        this.closeModal('accountModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إضافة الحركة بنجاح!' : 'Transaction added successfully!');
        this.loadAccounts();
    }

    editAccount(accountId) {
        const account = (this.propertyDB.accounts || []).find(a => a.id === accountId);
        if (account) {
            this.showAccountForm(account);
        }
    }

    async updateAccount(event, accountId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const accountIndex = (this.propertyDB.accounts || []).findIndex(a => a.id === accountId);
        if (accountIndex !== -1) {
            this.propertyDB.accounts[accountIndex] = {
                ...this.propertyDB.accounts[accountIndex],
                date: formData.get('date'),
                description: formData.get('description'),
                type: formData.get('type'),
                amount: parseInt(formData.get('amount'))
            };
            
            await this.saveUserData();
            this.closeModal('accountModal');
            this.showNotification(this.currentLanguage === 'ar' ? 'تم تحديث الحركة بنجاح!' : 'Transaction updated successfully!');
            this.loadAccounts();
        }
    }

    async deleteAccount(accountId) {
        if (confirm(this.currentLanguage === 'ar' ? 'هل أنت متأكد من حذف هذه الحركة؟' : 'Are you sure you want to delete this transaction?')) {
            this.propertyDB.accounts = (this.propertyDB.accounts || []).filter(a => a.id !== accountId);
            await this.saveUserData();
            this.showNotification(this.currentLanguage === 'ar' ? 'تم حذف الحركة بنجاح!' : 'Transaction deleted successfully!');
            this.loadAccounts();
        }
    }

    // 🔥 قسم الفواتير - تم إصلاحه
    async loadInvoices() {
        const content = document.querySelector('.main-content');
        const paidInvoices = (this.propertyDB.invoices || []).filter(i => i.status === 'مدفوعة').length;
        const pendingInvoices = (this.propertyDB.invoices || []).filter(i => i.status === 'معلقة').length;
        const totalAmount = (this.propertyDB.invoices || []).reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
        
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-receipt"></i> <span data-translate="invoices">${this.getTranslation('invoices')}</span></h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="propertySystem.showInvoiceForm()">
                        <i class="fas fa-plus"></i> ${this.currentLanguage === 'ar' ? 'إنشاء فاتورة' : 'Create Invoice'}
                    </button>
                </div>
            </div>

            <div class="stats-grid" style="margin-bottom: 20px;">
                <div class="stat-card">
                    <i class="fas fa-receipt"></i>
                    <div class="stat-value">${(this.propertyDB.invoices || []).length}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'إجمالي الفواتير' : 'Total Invoices'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-check-circle"></i>
                    <div class="stat-value">${paidInvoices}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'مدفوعة' : 'Paid'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-clock"></i>
                    <div class="stat-value">${pendingInvoices}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'معلقة' : 'Pending'}</div>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${this.currentLanguage === 'ar' ? 'رقم الفاتورة' : 'Invoice No'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'العميل' : 'Customer'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'المبلغ' : 'Amount'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'تاريخ الإصدار' : 'Issue Date'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الوصف' : 'Description'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(this.propertyDB.invoices || []).map(invoice => {
                            const customer = (this.propertyDB.customers || []).find(c => c.id === invoice.customerId);
                            return `
                                <tr>
                                    <td>#${invoice.id}</td>
                                    <td>${customer?.name || 'غير معروف'}</td>
                                    <td>${(invoice.amount || 0).toLocaleString()} ${this.propertyDB.settings?.currency || 'ريال'}</td>
                                    <td>${invoice.date}</td>
                                    <td>${invoice.dueDate}</td>
                                    <td>${invoice.description}</td>
                                    <td>
                                        <span class="status-badge status-${invoice.status === 'مدفوعة' ? 'paid' : 'pending'}">
                                            ${invoice.status}
                                        </span>
                                    </td>
                                    <td class="actions-column">
                                        <div class="action-buttons">
                                            <button class="btn btn-sm btn-edit" onclick="propertySystem.editInvoice(${invoice.id})">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-delete" onclick="propertySystem.deleteInvoice(${invoice.id})">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    showInvoiceForm(invoice = null) {
        const isEdit = invoice !== null;
        const formHTML = `
            <div class="modal-overlay" id="invoiceModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-receipt"></i> ${isEdit ? (this.currentLanguage === 'ar' ? 'تعديل الفاتورة' : 'Edit Invoice') : (this.currentLanguage === 'ar' ? 'إنشاء فاتورة جديدة' : 'Create New Invoice')}</h3>
                        <button class="close-btn" onclick="propertySystem.closeModal('invoiceModal')">&times;</button>
                    </div>
                    <form onsubmit="propertySystem.${isEdit ? 'updateInvoice' : 'addInvoice'}(event, ${isEdit ? invoice.id : ''})">
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'العميل' : 'Customer'}:</label>
                            <select name="customerId" required>
                                <option value="">${this.currentLanguage === 'ar' ? 'اختر العميل' : 'Select Customer'}</option>
                                ${(this.propertyDB.customers || []).map(customer => `
                                    <option value="${customer.id}" ${isEdit && invoice.customerId === customer.id ? 'selected' : ''}>${customer.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'المبلغ' : 'Amount'}:</label>
                            <input type="number" name="amount" value="${isEdit ? invoice.amount : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'تاريخ الإصدار' : 'Issue Date'}:</label>
                            <input type="date" name="date" value="${isEdit ? invoice.date : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}:</label>
                            <input type="date" name="dueDate" value="${isEdit ? invoice.dueDate : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الوصف' : 'Description'}:</label>
                            <textarea name="description" rows="3" required>${isEdit ? invoice.description : ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}:</label>
                            <select name="status" required>
                                <option value="معلقة" ${isEdit && invoice.status === 'معلقة' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'معلقة' : 'Pending'}</option>
                                <option value="مدفوعة" ${isEdit && invoice.status === 'مدفوعة' ? 'selected' : ''}>${this.currentLanguage === 'ar' ? 'مدفوعة' : 'Paid'}</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">${isEdit ? (this.currentLanguage === 'ar' ? 'تحديث الفاتورة' : 'Update Invoice') : (this.currentLanguage === 'ar' ? 'إنشاء الفاتورة' : 'Create Invoice')}</button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('invoiceModal')">
                                ${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                        </div>
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
            id: (this.propertyDB.invoices || []).length > 0 ? Math.max(...this.propertyDB.invoices.map(i => i.id)) + 1 : 1,
            customerId: parseInt(formData.get('customerId')),
            amount: parseInt(formData.get('amount')),
            date: formData.get('date'),
            dueDate: formData.get('dueDate'),
            description: formData.get('description'),
            status: formData.get('status')
        };
        
        if (!this.propertyDB.invoices) this.propertyDB.invoices = [];
        this.propertyDB.invoices.push(newInvoice);
        await this.saveUserData();
        this.closeModal('invoiceModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إنشاء الفاتورة بنجاح!' : 'Invoice created successfully!');
        this.loadInvoices();
    }

    editInvoice(invoiceId) {
        const invoice = (this.propertyDB.invoices || []).find(i => i.id === invoiceId);
        if (invoice) {
            this.showInvoiceForm(invoice);
        }
    }

    async updateInvoice(event, invoiceId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const invoiceIndex = (this.propertyDB.invoices || []).findIndex(i => i.id === invoiceId);
        if (invoiceIndex !== -1) {
            this.propertyDB.invoices[invoiceIndex] = {
                ...this.propertyDB.invoices[invoiceIndex],
                customerId: parseInt(formData.get('customerId')),
                amount: parseInt(formData.get('amount')),
                date: formData.get('date'),
                dueDate: formData.get('dueDate'),
                description: formData.get('description'),
                status: formData.get('status')
            };
            
            await this.saveUserData();
            this.closeModal('invoiceModal');
            this.showNotification(this.currentLanguage === 'ar' ? 'تم تحديث الفاتورة بنجاح!' : 'Invoice updated successfully!');
            this.loadInvoices();
        }
    }

    async deleteInvoice(invoiceId) {
        if (confirm(this.currentLanguage === 'ar' ? 'هل أنت متأكد من حذف هذه الفاتورة؟' : 'Are you sure you want to delete this invoice?')) {
            this.propertyDB.invoices = (this.propertyDB.invoices || []).filter(i => i.id !== invoiceId);
            await this.saveUserData();
            this.showNotification(this.currentLanguage === 'ar' ? 'تم حذف الفاتورة بنجاح!' : 'Invoice deleted successfully!');
            this.loadInvoices();
        }
    }

    // 🔥 قسم المحادثات - تم إصلاحه
    async loadMessages() {
        const content = document.querySelector('.main-content');
        const unreadMessages = (this.propertyDB.messages || []).filter(m => m.status === 'غير مقروء').length;
        
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-comments"></i> <span data-translate="messages">${this.getTranslation('messages')}</span></h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="propertySystem.showNewMessageForm()">
                        <i class="fas fa-plus"></i> ${this.currentLanguage === 'ar' ? 'رسالة جديدة' : 'New Message'}
                    </button>
                </div>
            </div>

            <div class="stats-grid" style="margin-bottom: 20px;">
                <div class="stat-card">
                    <i class="fas fa-comments"></i>
                    <div class="stat-value">${(this.propertyDB.messages || []).length}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'إجمالي الرسائل' : 'Total Messages'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-envelope"></i>
                    <div class="stat-value">${unreadMessages}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'غير مقروء' : 'Unread'}</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-check-circle"></i>
                    <div class="stat-value">${(this.propertyDB.messages || []).length - unreadMessages}</div>
                    <div class="stat-title">${this.currentLanguage === 'ar' ? 'مقروء' : 'Read'}</div>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>${this.currentLanguage === 'ar' ? 'المرسل' : 'Sender'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'المستلم' : 'Receiver'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الموضوع' : 'Subject'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الرسالة' : 'Message'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'التاريخ' : 'Date'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الحالة' : 'Status'}</th>
                            <th>${this.currentLanguage === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(this.propertyDB.messages || []).map(message => `
                            <tr>
                                <td>${message.sender}</td>
                                <td>${message.receiver}</td>
                                <td>${message.subject}</td>
                                <td>${message.message.length > 50 ? message.message.substring(0, 50) + '...' : message.message}</td>
                                <td>${message.date}</td>
                                <td>
                                    <span class="status-badge status-${message.status === 'مقروء' ? 'active' : 'pending'}">
                                        ${message.status}
                                    </span>
                                </td>
                                <td class="actions-column">
                                    <div class="action-buttons">
                                        <button class="btn btn-sm btn-view" onclick="propertySystem.viewMessage(${message.id})">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-sm btn-delete" onclick="propertySystem.deleteMessage(${message.id})">
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
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">${this.currentLanguage === 'ar' ? 'إرسال الرسالة' : 'Send Message'}</button>
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('messageModal')">
                                ${this.currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                        </div>
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
            id: (this.propertyDB.messages || []).length > 0 ? Math.max(...this.propertyDB.messages.map(m => m.id)) + 1 : 1,
            sender: this.propertyDB.currentUser,
            receiver: formData.get('receiver'),
            subject: formData.get('subject'),
            message: formData.get('message'),
            date: new Date().toISOString().split('T')[0],
            status: 'غير مقروء'
        };
        
        if (!this.propertyDB.messages) this.propertyDB.messages = [];
        this.propertyDB.messages.push(newMessage);
        await this.saveUserData();
        this.closeModal('messageModal');
        this.showNotification(this.currentLanguage === 'ar' ? 'تم إرسال الرسالة بنجاح!' : 'Message sent successfully!');
        this.loadMessages();
    }

    viewMessage(messageId) {
        const message = (this.propertyDB.messages || []).find(m => m.id === messageId);
        if (message) {
            const viewHTML = `
                <div class="modal-overlay" id="viewMessageModal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3><i class="fas fa-envelope"></i> ${this.currentLanguage === 'ar' ? 'عرض الرسالة' : 'View Message'}</h3>
                            <button class="close-btn" onclick="propertySystem.closeModal('viewMessageModal')">&times;</button>
                        </div>
                        <div class="message-view">
                            <div class="message-header">
                                <div class="message-field">
                                    <strong>${this.currentLanguage === 'ar' ? 'المرسل:' : 'Sender:'}</strong>
                                    <span>${message.sender}</span>
                                </div>
                                <div class="message-field">
                                    <strong>${this.currentLanguage === 'ar' ? 'المستلم:' : 'Receiver:'}</strong>
                                    <span>${message.receiver}</span>
                                </div>
                                <div class="message-field">
                                    <strong>${this.currentLanguage === 'ar' ? 'الموضوع:' : 'Subject:'}</strong>
                                    <span>${message.subject}</span>
                                </div>
                                <div class="message-field">
                                    <strong>${this.currentLanguage === 'ar' ? 'التاريخ:' : 'Date:'}</strong>
                                    <span>${message.date}</span>
                                </div>
                            </div>
                            <div class="message-body">
                                <strong>${this.currentLanguage === 'ar' ? 'الرسالة:' : 'Message:'}</strong>
                                <div class="message-content">${message.message}</div>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="propertySystem.closeModal('viewMessageModal')">
                                ${this.currentLanguage === 'ar' ? 'إغلاق' : 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            this.showModal(viewHTML);
        }
    }

    async deleteMessage(messageId) {
        if (confirm(this.currentLanguage === 'ar' ? 'هل أنت متأكد من حذف هذه الرسالة؟' : 'Are you sure you want to delete this message?')) {
            this.propertyDB.messages = (this.propertyDB.messages || []).filter(m => m.id !== messageId);
            await this.saveUserData();
            this.showNotification(this.currentLanguage === 'ar' ? 'تم حذف الرسالة بنجاح!' : 'Message deleted successfully!');
            this.loadMessages();
        }
    }

    // 🔥 قسم التقارير
    async loadReports() {
        const content = document.querySelector('.main-content');
        const stats = this.calculateStats();
        const financialStats = this.calculateFinancialStats();
        
        content.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-chart-bar"></i> <span data-translate="reports">${this.getTranslation('reports')}</span></h2>
            </div>

            <div class="reports-dashboard">
                <!-- التقارير الرئيسية -->
                <div class="reports-grid-main">
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
                                <div class="report-stat-value">${((stats.occupied / stats.totalProperties) * 100).toFixed(1)}%</div>
                                <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'نسبة الإشغال' : 'Occupancy Rate'}</div>
                            </div>
                        </div>
                    </div>

                    <div class="report-card-main">
                        <h3><i class="fas fa-money-bill-wave"></i> ${this.currentLanguage === 'ar' ? 'تقرير المالية' : 'Financial Report'}</h3>
                        <div class="report-stats-grid">
                            <div class="report-stat-item">
                                <div class="report-stat-value">${financialStats.totalRevenue.toLocaleString()}</div>
                                <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}</div>
                            </div>
                            <div class="report-stat-item">
                                <div class="report-stat-value">${financialStats.totalExpenses.toLocaleString()}</div>
                                <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}</div>
                            </div>
                            <div class="report-stat-item">
                                <div class="report-stat-value">${financialStats.netProfit.toLocaleString()}</div>
                                <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'صافي الربح' : 'Net Profit'}</div>
                            </div>
                            <div class="report-stat-item">
                                <div class="report-stat-value">${financialStats.totalExpenses > 0 ? ((financialStats.netProfit / financialStats.totalRevenue) * 100).toFixed(1) : 0}%</div>
                                <div class="report-stat-label">${this.currentLanguage === 'ar' ? 'هامش الربح' : 'Profit Margin'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- تقارير تفصيلية -->
                <div class="reports-details-grid">
                    <div class="report-detail-card">
                        <h4><i class="fas fa-users"></i> ${this.currentLanguage === 'ar' ? 'تقرير العملاء' : 'Customers Report'}</h4>
                        <p><strong>${this.currentLanguage === 'ar' ? 'إجمالي العملاء:' : 'Total Customers:'}</strong> ${(this.propertyDB.customers || []).length}</p>
                        <p><strong>${this.currentLanguage === 'ar' ? 'عملاء نشطون:' : 'Active Customers:'}</strong> ${(this.propertyDB.contracts || []).filter(c => c.status === 'نشط').length}</p>
                    </div>

                    <div class="report-detail-card">
                        <h4><i class="fas fa-tools"></i> ${this.currentLanguage === 'ar' ? 'تقرير الصيانة' : 'Maintenance Report'}</h4>
                        <p><strong>${this.currentLanguage === 'ar' ? 'إجمالي الطلبات:' : 'Total Requests:'}</strong> ${(this.propertyDB.maintenance || []).length}</p>
                        <p><strong>${this.currentLanguage === 'ar' ? 'مكتملة:' : 'Completed:'}</strong> ${(this.propertyDB.maintenance || []).filter(m => m.status === 'مكتمل').length}</p>
                        <p><strong>${this.currentLanguage === 'ar' ? 'قيد التنفيذ:' : 'In Progress:'}</strong> ${(this.propertyDB.maintenance || []).filter(m => m.status === 'قيد التنفيذ').length}</p>
                    </div>
                </div>

                <!-- مخططات التقارير -->
                <div class="reports-charts">
                    <div class="report-chart-card">
                        <h4><i class="fas fa-chart-pie"></i> ${this.currentLanguage === 'ar' ? 'توزيع الوحدات' : 'Units Distribution'}</h4>
                        <div style="height: 200px; display: flex; align-items: center; justify-content: center;">
                            <div style="width: 150px; height: 150px; border-radius: 50%; background: conic-gradient(#28a745 ${(stats.occupied/stats.totalProperties)*360}deg, #dc3545 0);"></div>
                        </div>
                        <div style="display: flex; justify-content: center; gap: 20px; margin-top: 15px;">
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <div style="width: 15px; height: 15px; background: #28a745; border-radius: 3px;"></div>
                                <small>${this.currentLanguage === 'ar' ? 'مشغولة' : 'Occupied'}</small>
                            </div>
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <div style="width: 15px; height: 15px; background: #dc3545; border-radius: 3px;"></div>
                                <small>${this.currentLanguage === 'ar' ? 'شاغرة' : 'Vacant'}</small>
                            </div>
                        </div>
                    </div>

                    <div class="report-chart-card">
                        <h4><i class="fas fa-chart-line"></i> ${this.currentLanguage === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue'}</h4>
                        <div style="height: 200px; display: flex; align-items: end; justify-content: center; gap: 15px; padding: 20px;">
                            <div style="display: flex; flex-direction: column; align-items: center;">
                                <div style="width: 30px; height: ${(1200/2500)*150}px; background: var(--neon-purple); border-radius: 5px;"></div>
                                <small>يناير</small>
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: center;">
                                <div style="width: 30px; height: ${(1200/2500)*150}px; background: var(--neon-purple); border-radius: 5px;"></div>
                                <small>فبراير</small>
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: center;">
                                <div style="width: 30px; height: ${(800/2500)*150}px; background: var(--neon-purple); border-radius: 5px;"></div>
                                <small>مارس</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 🔥 قسم الإعدادات
    async loadSettings() {
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

    async saveCompanySettings(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        this.propertyDB.settings = {
            companyName: formData.get('companyName'),
            currency: formData.get('currency'),
            taxRate: parseInt(formData.get('taxRate')),
            address: formData.get('address'),
            phone: formData.get('phone'),
            email: formData.get('email')
        };
        
        await this.saveUserData();
        this.showNotification(this.currentLanguage === 'ar' ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!');
    }

    // 🔥 باقي الدوال المساعدة
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
        
        // إعادة تحميل الصفحة الحالية لتطبيق اللغة
        if (this.currentPage) {
            this.navigateTo(this.currentPage);
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
// 🔥 دالة لتحسين عرض الجداول على الجوال
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

// استدعاء الدالة عند تحميل كل صفحة بها جداول
loadProperties() {
    // الكود الأصلي...
    setTimeout(() => this.optimizeTablesForMobile(), 100);
}

loadCustomers() {
    // الكود الأصلي...
    setTimeout(() => this.optimizeTablesForMobile(), 100);
}

// ... وهكذا لباقي الصفحات التي تحتوي على جداول

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
        const currentDate = new Date().toISOString().split('T')[0];
        return {
            currentUser: null,
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
                },
                { 
                    id: 2, 
                    name: 'A-102', 
                    type: 'شقة', 
                    area: '100م²', 
                    status: 'مشغولة', 
                    rent: 1200, 
                    tenant: 'أحمد خالد', 
                    contractEnd: '2024-12-31',
                    description: 'شقة مريحة في الطابق الأول'
                },
                { 
                    id: 3, 
                    name: 'B-201', 
                    type: 'فيلا', 
                    area: '200م²', 
                    status: 'شاغرة', 
                    rent: 2500, 
                    tenant: '', 
                    contractEnd: '',
                    description: 'فيلا فاخرة مع حديقة'
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
                },
                { 
                    id: 2, 
                    name: 'أحمد خالد', 
                    phone: '0554321098', 
                    email: 'ahmed@email.com', 
                    idNumber: '0987654321',
                    address: 'الرياض - حي النخيل'
                },
                { 
                    id: 3, 
                    name: 'سارة عبدالله', 
                    phone: '0501234567', 
                    email: 'sara@email.com', 
                    idNumber: '1122334455',
                    address: 'الرياض - حي العليا'
                }
            ],
            contracts: [
                {
                    id: 1,
                    propertyId: 2,
                    customerId: 2,
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
                },
                {
                    id: 2,
                    contractId: 1,
                    amount: 1200,
                    date: '2024-02-01',
                    method: 'نقدي',
                    status: 'مدفوع',
                    description: 'دفعة شهر فبراير'
                }
            ],
            maintenance: [
                {
                    id: 1,
                    propertyId: 2,
                    type: 'صيانة دورية',
                    description: 'صيانة مكيف الهواء',
                    status: 'مكتمل',
                    cost: 300,
                    date: '2024-01-15'
                },
                {
                    id: 2,
                    propertyId: 1,
                    type: 'تصليح',
                    description: 'تصليح تسرب المياه',
                    status: 'قيد التنفيذ',
                    cost: 150,
                    date: '2024-02-01'
                }
            ],
            sales: [
                {
                    id: 1,
                    customerId: 1,
                    propertyId: 1,
                    amount: 150000,
                    date: '2024-01-20',
                    status: 'مكتمل',
                    commission: 7500
                }
            ],
            commissions: [
                {
                    id: 1,
                    agent: 'محمد علي',
                    transaction: 'بيع شقة A-101',
                    percentage: 5,
                    amount: 7500,
                    status: 'مدفوعة',
                    date: '2024-01-25'
                }
            ],
            inventory: [
                {
                    id: 1,
                    name: 'مكيف سبليت',
                    category: 'كهرباء',
                    quantity: 5,
                    price: 1200,
                    minQuantity: 2
                },
                {
                    id: 2,
                    name: 'طلاء',
                    category: 'مواد بناء',
                    quantity: 15,
                    price: 80,
                    minQuantity: 5
                },
                {
                    id: 3,
                    name: 'أسلاك كهربائية',
                    category: 'كهرباء',
                    quantity: 8,
                    price: 45,
                    minQuantity: 3
                }
            ],
            accounts: [
                {
                    id: 1,
                    date: '2024-01-01',
                    description: 'إيجار شقة A-102',
                    type: 'إيراد',
                    amount: 1200
                },
                {
                    id: 2,
                    date: '2024-01-15',
                    description: 'صيانة مكيف',
                    type: 'مصروف',
                    amount: 300
                },
                {
                    id: 3,
                    date: '2024-02-01',
                    description: 'إيجار شقة A-102',
                    type: 'إيراد',
                    amount: 1200
                }
            ],
            invoices: [
                {
                    id: 1,
                    customerId: 2,
                    amount: 1200,
                    date: '2024-01-01',
                    dueDate: '2024-01-05',
                    status: 'مدفوعة',
                    description: 'فاتورة إيجار يناير'
                },
                {
                    id: 2,
                    customerId: 2,
                    amount: 1200,
                    date: '2024-02-01',
                    dueDate: '2024-02-05',
                    status: 'معلقة',
                    description: 'فاتورة إيجار فبراير'
                }
            ],
            messages: [
                {
                    id: 1,
                    sender: 'فاطمة محمد',
                    receiver: 'الإدارة',
                    subject: 'استفسار عن شقة',
                    message: 'أرغب في استئجار شقة في المبنى',
                    date: '2024-01-10',
                    status: 'مقروء'
                },
                {
                    id: 2,
                    sender: 'الإدارة',
                    receiver: 'أحمد خالد',
                    subject: 'تذكير بالدفع',
                    message: 'يرجى تسديد دفعة فبراير',
                    date: '2024-02-01',
                    status: 'غير مقروء'
                }
            ],
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


