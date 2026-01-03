// ===========================================
// تأثير السحر الأسود - Magic Cursor Effect
// ملف منفصل: magic-effect.js
// ===========================================

(function() {
    'use strict';
    
    // انتظر تحميل الصفحة
    document.addEventListener('DOMContentLoaded', function() {
        
        // إنشاء المؤشر السحري
        const magicCursor = document.createElement('div');
        magicCursor.className = 'magic-cursor';
        magicCursor.id = 'magicCursor';
        document.body.appendChild(magicCursor);
        
        // متغيرات التحكم
        let mouseX = 0;
        let mouseY = 0;
        let cursorX = 0;
        let cursorY = 0;
        let isActive = false;
        
        // تحديث موقع المؤشر بسلاسة
        function updateCursor() {
            cursorX += (mouseX - cursorX) * 0.1;
            cursorY += (mouseY - cursorY) * 0.1;
            
            magicCursor.style.left = cursorX + 'px';
            magicCursor.style.top = cursorY + 'px';
            
            requestAnimationFrame(updateCursor);
        }
        
        // بدء الأنيميشن
        updateCursor();
        
        // ========== أحداث الماوس ==========
        
        // حركة الماوس
        document.addEventListener('mousemove', function(e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            if (!isActive) {
                magicCursor.classList.add('active');
                isActive = true;
            }
        });
        
        // النقر بالماوس
        document.addEventListener('mousedown', function() {
            magicCursor.classList.add('click');
            
            // إنشاء تأثير النبضة
            createPulseEffect(mouseX, mouseY);
        });
        
        document.addEventListener('mouseup', function() {
            magicCursor.classList.remove('click');
        });
        
        // مغادرة النافذة
        document.addEventListener('mouseleave', function() {
            magicCursor.classList.remove('active');
            isActive = false;
        });
        
        // ========== أحداث اللمس ==========
        
        // اللمس على الجوال
        document.addEventListener('touchstart', function(e) {
            e.preventDefault();
            const touch = e.touches[0];
            mouseX = touch.clientX;
            mouseY = touch.clientY;
            
            magicCursor.classList.add('active');
            magicCursor.classList.add('click');
            isActive = true;
            
            // تأثير النبضة
            createPulseEffect(mouseX, mouseY);
        });
        
        // حركة اللمس
        document.addEventListener('touchmove', function(e) {
            e.preventDefault();
            const touch = e.touches[0];
            mouseX = touch.clientX;
            mouseY = touch.clientY;
        });
        
        // نهاية اللمس
        document.addEventListener('touchend', function() {
            magicCursor.classList.remove('active');
            magicCursor.classList.remove('click');
            isActive = false;
        });
        
        // ========== وظائف المساعدة ==========
        
        // إنشاء تأثير النبضة
        function createPulseEffect(x, y) {
            const pulse = document.createElement('div');
            pulse.className = 'magic-pulse';
            pulse.style.left = x + 'px';
            pulse.style.top = y + 'px';
            document.body.appendChild(pulse);
            
            setTimeout(() => {
                pulse.remove();
            }, 600);
        }
        
        // إنشاء تأثير الذيل (اختياري)
        let lastTrailTime = 0;
        document.addEventListener('mousemove', function(e) {
            const now = Date.now();
            if (now - lastTrailTime > 50) { // كل 50 مللي ثانية
                createTrailEffect(e.clientX, e.clientY);
                lastTrailTime = now;
            }
        });
        
        function createTrailEffect(x, y) {
            const trail = document.createElement('div');
            trail.className = 'magic-trail';
            trail.style.left = x + 'px';
            trail.style.top = y + 'px';
            document.body.appendChild(trail);
            
            setTimeout(() => {
                trail.remove();
            }, 400);
        }
        
        // ========== تأثيرات على العناصر ==========
        
        // إضافة تأثير على الروابط والأزرار
        setTimeout(function() {
            const interactiveElements = document.querySelectorAll(
                'a, button, .link-item, .social-link, .play-btn'
            );
            
            interactiveElements.forEach(el => {
                el.classList.add('magic-hover');
                
                el.addEventListener('mouseenter', function() {
                    magicCursor.style.transform = 'translate(-50%, -50%) scale(1.3)';
                    magicCursor.style.opacity = '1';
                });
                
                el.addEventListener('mouseleave', function() {
                    magicCursor.style.transform = 'translate(-50%, -50%) scale(1)';
                    magicCursor.style.opacity = '0.8';
                });
            });
        }, 1000);
        
        // ========== تنظيف الذاكرة ==========
        
        // منع تسرب الذاكرة
        window.addEventListener('beforeunload', function() {
            magicCursor.remove();
        });
        
        // رسالة نجاح
        console.log('🎩 تأثير السحر الأسود جاهز!');
    });
    
})();