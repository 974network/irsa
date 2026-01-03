<script>
// اختبار بسيط للمؤشر السحري
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 بدء اختبار المؤشر السحري...');
    
    // إنشاء عنصر اختبار
    const testDiv = document.createElement('div');
    testDiv.id = 'cursorTest';
    testDiv.style.cssText = `
        position: fixed;
        width: 50px;
        height: 50px;
        background: red;
        border-radius: 50%;
        z-index: 99999;
        top: 10px;
        right: 10px;
    `;
    document.body.appendChild(testDiv);
    
    console.log('✅ عنصر الاختبار تم إنشاؤه');
    
    // اختبار الماوس
    document.addEventListener('mousemove', function(e) {
        console.log('📍 موقع الماوس:', e.clientX, e.clientY);
        testDiv.style.background = 'green';
    });
    
    setTimeout(() => {
        testDiv.style.background = 'blue';
        console.log('🎯 الاختبار مكتمل - إذا رأيت مربع أزرق، فالجافاسكريبت يعمل');
    }, 1000);
});
</script>
