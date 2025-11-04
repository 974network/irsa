// رابط السكربت المحدث
const scriptURL = "https://script.google.com/macros/s/AKfycbwGzvJ315D5-TMGmI5tzfCNmO0fVKwc9GRDCa343XlpT8ddvzwzZOMIYqTrcCtvsEo-/exec";

document.addEventListener('DOMContentLoaded', function() {
    // متغيرات عامة
    let currentStep = 1;
    const totalSteps = 7;
    let uploadedFiles = [];
    let uploadedOldFiles = [];
    const maxFiles = 6;
    
    // عناصر DOM
    const welcomeScreen = document.getElementById('welcomeScreen');
    const mainContainer = document.getElementById('mainContainer');
    const startBtn = document.getElementById('startBtn');
    const progress = document.getElementById('progress');
    const progressText = document.getElementById('progress-text');
    const stepIndicators = document.getElementById('step-indicators');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const form = document.getElementById('clientForm');
    const loading = document.getElementById('loading');
    const successMessage = document.getElementById('successMessage');
    const continueBtn = document.getElementById('continueBtn');
    
    // تهيئة المؤشرات
    function initStepIndicators() {
        for (let i = 1; i <= totalSteps; i++) {
            const indicator = document.createElement('div');
            indicator.classList.add('step-indicator');
            if (i === 1) indicator.classList.add('active');
            stepIndicators.appendChild(indicator);
        }
    }
    
    // تحديث المؤشرات
    function updateStepIndicators() {
        const indicators = document.querySelectorAll('.step-indicator');
        indicators.forEach((indicator, index) => {
            if (index < currentStep) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }
    
    // تحديث التقدم
    function updateProgress() {
        const progressPercent = (currentStep / totalSteps) * 100;
        progress.style.width = `${progressPercent}%`;
        progressText.textContent = `السؤال ${currentStep} من ${totalSteps}`;
    }
    
    // الانتقال بين الخطوات
    function goToStep(step) {
        document.querySelectorAll('.form-step').forEach(el => {
            el.classList.remove('active');
        });
        
        document.getElementById(`step-${step}`).classList.add('active');
        currentStep = step;
        
        updateProgress();
        updateStepIndicators();
        
        // إظهار/إخفاء الأزرار
        prevBtn.style.display = step === 1 ? 'none' : 'flex';
        nextBtn.style.display = step === totalSteps ? 'none' : 'flex';
        submitBtn.style.display = step === totalSteps ? 'flex' : 'none';
    }
    
    // التحقق من صحة الخطوة الحالية
    function validateStep(step) {
        let isValid = true;
        const errorElement = document.getElementById(`error-${step}`);
        
        // إخفاء رسالة الخطأ
        errorElement.style.display = 'none';
        
        switch(step) {
            case 1:
                const brandName = document.querySelector('input[name="brand_name"]').value.trim();
                if (!brandName) {
                    errorElement.textContent = 'يرجى إدخال اسم العلامة التجارية';
                    errorElement.style.display = 'block';
                    isValid = false;
                }
                break;
                
            case 2:
                const businessField = document.querySelector('input[name="business_field"]').value.trim();
                if (!businessField) {
                    errorElement.textContent = 'يرجى إدخال مجال العمل';
                    errorElement.style.display = 'block';
                    isValid = false;
                }
                break;
                
            case 3:
                const logoType = document.querySelector('input[name="logo_type"]:checked');
                if (!logoType) {
                    errorElement.textContent = 'يرجى اختيار نوع الشعار';
                    errorElement.style.display = 'block';
                    isValid = false;
                } else if (logoType.value === 'شيء آخر') {
                    const customInput = document.querySelector('input[name="logo_type_custom"]').value.trim();
                    if (!customInput) {
                        errorElement.textContent = 'يرجى إدخال التفضيل الآخر';
                        errorElement.style.display = 'block';
                        isValid = false;
                    }
                }
                break;
                
            case 4:
                const colors = document.querySelector('textarea[name="colors"]').value.trim();
                if (!colors) {
                    errorElement.textContent = 'يرجى وصف الألوان المفضلة';
                    errorElement.style.display = 'block';
                    isValid = false;
                }
                break;
                
            case 6:
                const feeling = document.querySelector('textarea[name="feeling"]').value.trim();
                if (!feeling) {
                    errorElement.textContent = 'يرجى وصف المشاعر والقيم التي تريد توصيلها';
                    errorElement.style.display = 'block';
                    isValid = false;
                }
                break;
        }
        
        return isValid;
    }
    
    // الانتقال للخطوة التالية
    function nextStep() {
        if (validateStep(currentStep)) {
            if (currentStep < totalSteps) {
                goToStep(currentStep + 1);
            }
        }
    }
    
    // الانتقال للخطوة السابقة
    function prevStep() {
        if (currentStep > 1) {
            goToStep(currentStep - 1);
        }
    }
    
    // إدارة تحديد الخيارات
    function initOptionSelection() {
        document.querySelectorAll('.option-card').forEach(card => {
            card.addEventListener('click', function() {
                const radio = this.querySelector('input[type="radio"]');
                if (radio) {
                    // إلغاء تحديد جميع الخيارات في نفس المجموعة
                    const groupName = radio.name;
                    document.querySelectorAll(`.option-card input[name="${groupName}"]`).forEach(otherRadio => {
                        otherRadio.closest('.option-card').classList.remove('selected');
                    });
                    
                    // تحديد الخيار الحالي
                    radio.checked = true;
                    this.classList.add('selected');
                    
                    // تشغيل حدث التغيير
                    radio.dispatchEvent(new Event('change'));
                }
            });
        });
    }
    
    // إظهار/إخفاء الحقل المخصص لنوع الشعار
    document.getElementById('other-logo-type').addEventListener('click', function() {
        const customInput = document.getElementById('logo-type-custom');
        customInput.style.display = 'block';
    });
    
    document.querySelectorAll('input[name="logo_type"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const customInput = document.getElementById('logo-type-custom');
            if (this.value === 'شيء آخر') {
                customInput.style.display = 'block';
            } else {
                customInput.style.display = 'none';
            }
        });
    });
    
    // إدارة رفع الملفات للشعارات
    const fileUpload = document.getElementById('file-upload');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const addMoreFilesBtn = document.getElementById('add-more-files');
    const fileCounter = document.getElementById('file-counter');
    
    fileUpload.addEventListener('click', () => fileInput.click());
    addMoreFilesBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', handleFileUpload);
    
    function handleFileUpload(e) {
        const files = Array.from(e.target.files);
        
        // التحقق من عدد الملفات
        if (uploadedFiles.length + files.length > maxFiles) {
            alert(`يمكنك رفع ${maxFiles} ملفات كحد أقصى`);
            return;
        }
        
        // إضافة الملفات الجديدة
        files.forEach(file => {
            if (uploadedFiles.length < maxFiles) {
                uploadedFiles.push(file);
                addFileToList(file, fileList, uploadedFiles, fileCounter, 'files');
            }
        });
        
        // تحديث العداد
        updateFileCounter(uploadedFiles, fileCounter);
        
        // إعادة تعيين حقل الرفع
        fileInput.value = '';
    }
    
    // إدارة رفع الملفات للشعارات القديمة
    const oldFileUpload = document.getElementById('old-file-upload');
    const oldFileInput = document.getElementById('old-file-input');
    const oldFileList = document.getElementById('old-file-list');
    const addMoreOldFilesBtn = document.getElementById('add-more-old-files');
    const oldFileCounter = document.getElementById('old-file-counter');
    
    oldFileUpload.addEventListener('click', () => oldFileInput.click());
    addMoreOldFilesBtn.addEventListener('click', () => oldFileInput.click());
    
    oldFileInput.addEventListener('change', handleOldFileUpload);
    
    function handleOldFileUpload(e) {
        const files = Array.from(e.target.files);
        
        // التحقق من عدد الملفات
        if (uploadedOldFiles.length + files.length > maxFiles) {
            alert(`يمكنك رفع ${maxFiles} ملفات كحد أقصى`);
            return;
        }
        
        // إضافة الملفات الجديدة
        files.forEach(file => {
            if (uploadedOldFiles.length < maxFiles) {
                uploadedOldFiles.push(file);
                addFileToList(file, oldFileList, uploadedOldFiles, oldFileCounter, 'old-files');
            }
        });
        
        // تحديث العداد
        updateFileCounter(uploadedOldFiles, oldFileCounter);
        
        // إعادة تعيين حقل الرفع
        oldFileInput.value = '';
    }
    
    // إضافة ملف إلى القائمة
    function addFileToList(file, listElement, filesArray, counterElement, type) {
        const fileItem = document.createElement('div');
        fileItem.classList.add('file-item');
        
        const fileNumber = filesArray.length;
        
        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-number">${fileNumber}</div>
                <div>
                    <div>${file.name}</div>
                    <div style="font-size: 0.8rem; color: rgba(255,255,255,0.6);">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button type="button" class="remove-file" data-index="${fileNumber - 1}" data-type="${type}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        listElement.appendChild(fileItem);
        
        // إضافة حدث إزالة الملف
        const removeBtn = fileItem.querySelector('.remove-file');
        removeBtn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            filesArray.splice(index, 1);
            listElement.removeChild(fileItem);
            updateFileListNumbers(listElement, type);
            updateFileCounter(filesArray, counterElement);
        });
    }
    
    // تحديث أرقام الملفات في القائمة
    function updateFileListNumbers(listElement, type) {
        const fileItems = listElement.querySelectorAll('.file-item');
        fileItems.forEach((item, index) => {
            const fileNumber = item.querySelector('.file-number');
            fileNumber.textContent = index + 1;
            
            const removeBtn = item.querySelector('.remove-file');
            removeBtn.setAttribute('data-index', index);
        });
        
        // تحديث المصفوفة المناسبة
        if (type === 'files') {
            uploadedFiles = Array.from(fileItems).map((item, index) => {
                return uploadedFiles[index];
            });
        } else if (type === 'old-files') {
            uploadedOldFiles = Array.from(fileItems).map((item, index) => {
                return uploadedOldFiles[index];
            });
        }
    }
    
    // تحديث عداد الملفات
    function updateFileCounter(filesArray, counterElement) {
        counterElement.textContent = `${filesArray.length}/${maxFiles} ملفات مرفوعة`;
    }
    
    // تنسيق حجم الملف
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // إدارة إضافة الروابط
    const addLinkBtn = document.getElementById('add-link-btn');
    const linksContainer = document.getElementById('links-container');
    
    addLinkBtn.addEventListener('click', function() {
        const linkInputs = linksContainer.querySelectorAll('.link-input');
        if (linkInputs.length < maxFiles) {
            addLinkInput(linksContainer, 'logo_links[]');
        } else {
            alert(`يمكنك إضافة ${maxFiles} روابط كحد أقصى`);
        }
    });
    
    // إدارة إضافة الروابط للشعارات القديمة
    const addOldLinkBtn = document.getElementById('add-old-link-btn');
    const oldLinksContainer = document.getElementById('old-links-container');
    
    addOldLinkBtn.addEventListener('click', function() {
        const linkInputs = oldLinksContainer.querySelectorAll('.link-input');
        if (linkInputs.length < maxFiles) {
            addLinkInput(oldLinksContainer, 'old_logo_links[]');
        } else {
            alert(`يمكنك إضافة ${maxFiles} روابط كحد أقصى`);
        }
    });
    
    // إضافة حقل رابط جديد
    function addLinkInput(container, name) {
        const linkInputContainer = document.createElement('div');
        linkInputContainer.classList.add('link-input-container');
        linkInputContainer.style.display = 'flex';
        linkInputContainer.style.alignItems = 'center';
        
        linkInputContainer.innerHTML = `
            <input type="url" class="link-input" name="${name}" placeholder="أدخل رابط الشعار" style="flex: 1;" />
            <button type="button" class="remove-link">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(linkInputContainer);
        
        // إضافة حدث إزالة الرابط
        const removeBtn = linkInputContainer.querySelector('.remove-link');
        removeBtn.addEventListener('click', function() {
            container.removeChild(linkInputContainer);
        });
    }
    
    // حل مشكلة Enter في الجوال
    document.querySelectorAll('.text-input, .textarea-input').forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                nextStep();
            }
        });
    });
    
    // أحداث الأزرار
    startBtn.addEventListener('click', function() {
        welcomeScreen.style.animation = 'fadeOut 0.8s ease forwards';
        setTimeout(() => {
            welcomeScreen.style.display = 'none';
            mainContainer.classList.add('show');
        }, 800);
    });
    
    nextBtn.addEventListener('click', nextStep);
    prevBtn.addEventListener('click', prevStep);
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // التحقق من صحة الخطوة الأخيرة
        if (validateStep(currentStep)) {
            // إظهار شاشة التحميل
            form.style.display = 'none';
            loading.style.display = 'block';
            
            try {
                // جمع البيانات
                const formData = new FormData();
                
                // إضافة جميع البيانات إلى formData
                const formElements = document.querySelectorAll('input, textarea');
                formElements.forEach(element => {
                    if (element.type === 'radio') {
                        if (element.checked) {
                            formData.append(element.name, element.value);
                        }
                    } else if (element.type !== 'file' && element.name) {
                        if (element.name.endsWith('[]')) {
                            // معالجة المدخلات المتعددة (الروابط)
                            if (element.value.trim() !== '') {
                                formData.append(element.name, element.value);
                            }
                        } else {
                            formData.append(element.name, element.value);
                        }
                    }
                });
                
                // إضافة ملفات الشعارات
                for (let i = 0; i < uploadedFiles.length; i++) {
                    const file = uploadedFiles[i];
                    const base64 = await fileToBase64(file);
                    formData.append(`file_base64_${i}`, base64);
                    formData.append(`file_name_${i}`, file.name);
                    formData.append(`file_type_${i}`, file.type);
                }
                formData.append('file_count', uploadedFiles.length);
                
                // إضافة ملفات الشعارات القديمة
                for (let i = 0; i < uploadedOldFiles.length; i++) {
                    const file = uploadedOldFiles[i];
                    const base64 = await fileToBase64(file);
                    formData.append(`old_file_base64_${i}`, base64);
                    formData.append(`old_file_name_${i}`, file.name);
                    formData.append(`old_file_type_${i}`, file.type);
                }
                formData.append('old_file_count', uploadedOldFiles.length);
                
                // إرسال البيانات إلى Google Apps Script
                const response = await fetch(scriptURL, {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                // إخفاء التحميل وإظهار النجاح
                loading.style.display = 'none';
                successMessage.style.display = 'block';
                
            } catch (error) {
                // في حالة الخطأ
                loading.style.display = 'none';
                alert('حدث خطأ في الإرسال: ' + error.message);
                form.style.display = 'block';
            }
        }
    });
    
    // دالة تحويل الملف إلى base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    continueBtn.addEventListener('click', function() {
        // إعادة تعيين النموذج
        form.reset();
        uploadedFiles = [];
        uploadedOldFiles = [];
        fileList.innerHTML = '';
        oldFileList.innerHTML = '';
        updateFileCounter(uploadedFiles, fileCounter);
        updateFileCounter(uploadedOldFiles, oldFileCounter);
        
        // إعادة إلى البداية
        successMessage.style.display = 'none';
        form.style.display = 'block';
        goToStep(1);
        
        // إظهار شاشة الترحيب مرة أخرى
        welcomeScreen.style.display = 'flex';
        welcomeScreen.style.animation = 'none';
        setTimeout(() => {
            welcomeScreen.style.animation = 'fadeIn 0.8s ease forwards';
        }, 10);
        
        mainContainer.classList.remove('show');
    });
    
    // تهيئة التطبيق
    initStepIndicators();
    initOptionSelection();
    updateProgress();
});
