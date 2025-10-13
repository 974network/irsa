<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IRSA Trading & Contracting</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- تحديث إصدار Firebase -->
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js"></script>
    
    <style>
        /* ستايل واجهة تسجيل الدخول القديم - خلفية سوداء وإطار ذهبي */
        .login-container {
            background: #000000;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
        }

        .login-box {
            background: #1a1a1a;
            padding: 40px 30px;
            border-radius: 15px;
            border: 3px solid #d4af37;
            box-shadow: 0 0 30px rgba(212, 175, 55, 0.3);
            width: 100%;
            max-width: 400px;
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            margin: 0;
        }

        .login-header {
            text-align: center;
            margin: 0 auto 30px auto;
        }

        .login-logo {
            max-width: 150px;
            margin-bottom: 25px;
            filter: brightness(0) invert(1);
        }

        .language-switcher {
            text-align: center;
            margin: 20px auto;
            display: flex;
            justify-content: center;
            gap: 15px;
        }

        .lang-btn {
            background: transparent;
            border: 2px solid #d4af37;
            color: #d4af37;
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: all 0.3s ease;
        }

        .lang-btn:hover {
            background: #d4af37;
            color: #000;
        }

        .input-group {
            text-align: center;
            margin: 20px auto;
            display: block;
        }

        .input-group label {
            text-align: center;
            display: block;
            margin: 0 auto 10px auto;
            color: #d4af37;
            font-weight: bold;
            font-size: 14px;
        }

        .input-group input {
            text-align: center;
            margin: 0 auto;
            display: block;
            width: 100%;
            max-width: 300px;
            padding: 15px;
            border: 2px solid #d4af37;
            border-radius: 8px;
            font-size: 16px;
            background: #2a2a2a;
            color: #fff;
            transition: all 0.3s ease;
        }

        .input-group input:focus {
            border-color: #ffd700;
            background: #333;
            outline: none;
            box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
        }

        .input-group input::placeholder {
            text-align: center;
            color: #888;
        }

        .login-btn {
            text-align: center;
            margin: 25px auto 15px auto;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #d4af37;
            color: #000;
            border: none;
            padding: 15px 40px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: all 0.3s ease;
            width: 100%;
            max-width: 300px;
        }

        .login-btn:hover {
            background: #ffd700;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(212, 175, 55, 0.4);
        }

        .create-account-btn {
            text-align: center;
            margin: 10px auto;
            display: flex;
            justify-content: center;
            align-items: center;
            background: transparent;
            color: #d4af37;
            border: 2px solid #d4af37;
            padding: 12px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: all 0.3s ease;
            width: 100%;
            max-width: 300px;
        }

        .create-account-btn:hover {
            background: #d4af37;
            color: #000;
        }

        /* إلغاء أي تأثيرات للاتجاه RTL/LTR */
        [dir="ltr"] .login-box,
        [dir="rtl"] .login-box {
            left: 50%;
            right: auto;
            transform: translate(-50%, -50%);
        }

        /* منع أي تحريك من JavaScript */
        .login-container * {
            transition: none !important;
            animation: none !important;
        }

        /* تأثيرات الأيقونات */
        .input-group i {
            color: #d4af37;
            margin-left: 8px;
        }

        .login-btn i, .create-account-btn i {
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <!-- شاشة تسجيل الدخول -->
    <div id="loginPage" class="login-container">
        <div class="login-box">
            <div class="login-header">
                <img src="irsa.png" alt="لوجو IRSA" class="logo-image login-logo">
                <div class="language-switcher">
                    <button type="button" class="lang-btn" data-lang="ar">العربية</button>
                    <button type="button" class="lang-btn" data-lang="en">English</button>
                </div>
            </div>
            <form id="loginForm">
                <div class="input-group">
                    <label for="email"><i class="fas fa-envelope"></i> <span data-translate="email">البريد الإلكتروني</span></label>
                    <input type="email" id="email" placeholder="أدخل البريد الإلكتروني" required>
                </div>
                <div class="input-group">
                    <label for="password"><i class="fas fa-lock"></i> <span data-translate="password">كلمة المرور</span></label>
                    <input type="password" id="password" placeholder="أدخل كلمة المرور" required>
                </div>
                <button type="submit" class="login-btn">
                    <i class="fas fa-sign-in-alt"></i> <span data-translate="login">تسجيل الدخول</span>
                </button>
                
                <!-- زر إنشاء حساب جديد -->
                <button type="button" class="btn btn-secondary create-account-btn" onclick="propertySystem.showCreateAccountModal()">
                    <i class="fas fa-user-plus"></i> <span data-translate="createAccount">إنشاء حساب جديد</span>
                </button>
            </form>
        </div>
    </div>

    <!-- لوحة التحكم -->
    <div id="dashboard" class="dashboard" style="display: none;">
        <div class="dashboard-layout">
            <!-- الشريط الجانبي -->
            <aside class="sidebar">
                <div class="logo">
                    <img src="irsa.png" alt="لوجو IRSA" class="logo-image sidebar-logo">
                </div>
                <div class="nav-links">
                    <!-- سيتم ملؤها ديناميكياً -->
                </div>
            </aside>

            <!-- المحتوى الرئيسي -->
            <main class="main-content">
                <!-- سيتم ملؤه ديناميكياً -->
            </main>
        </div>
    </div>

    <!-- إضافة تهيئة Firebase -->
    <script>
        // تهيئة Firebase مع بيانات المشروع الخاصة بك
        const firebaseConfig = {
            apiKey: "AIzaSyBUMgt1C6gdDrtgpBcMkyHBZFDeHiDd1HI",
            authDomain: "mohanad-93df3.firebaseapp.com",
            projectId: "mohanad-93df3",
            storageBucket: "mohanad-93df3.appspot.com",
            messagingSenderId: "1057899918391",
            appId: "1:1057899918391:web:a1b2c3d4e5f6g7h8i9j0"
        };
        
        // تهيئة Firebase
        firebase.initializeApp(firebaseConfig);
    </script>
    
    <script src="app.js"></script>
</body>
</html>
