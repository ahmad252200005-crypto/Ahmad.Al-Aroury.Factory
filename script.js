// =========================================
// رابط Google Apps Script (قابل للتعديل)
// =========================================
const GOOGLE_SCRIPT_URL = new URLSearchParams(window.location.search).get('api') ||
    localStorage.getItem('cloudApiUrl') ||
    "https://script.google.com/macros/s/AKfycbw3wTv2fM9cX-_GvhT3yoYf1r8OJ6rGtF7qwcmZG7qkMOw8mHWQvwFzvGr-EKArU64N/exec";

const FACTORY_NAME = "مصنع أحمد العاروري لصناعة اكسسوارات الديكور";
const FACTORY_ADDRESS = "الاردن الزرقاء الرصيفه مقابل حجز السيارات";
const FACTORY_PHONE = "0795704514 - 0797083878";
const FACTORY_TAX_ID = "101010101"; // رقم وهمي
const FACTORY_CR_ID = "202020202"; // رقم وهمي

// =========================================
// دوال مساعدة للربط السحابي
// =========================================
function isFileProtocol() {
    return window.location.protocol === 'file:';
}

function safeParseJson(text) {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (err) {
        return null;
    }
}

function normalizeCloudData(data) {
    if (!data) return null;
    if (Array.isArray(data)) {
        return { clients: data, invoices: [], purchaseHistory: [], employeeSalaries: [] };
    }
    if (typeof data === 'object') {
        return {
            clients: Array.isArray(data.clients) ? data.clients : [],
            invoices: Array.isArray(data.invoices) ? data.invoices : [],
            purchaseHistory: Array.isArray(data.purchaseHistory) ? data.purchaseHistory : [],
            employeeSalaries: Array.isArray(data.employeeSalaries) ? data.employeeSalaries : []
            purchaseHistory: Array.isArray(data.purchaseHistory) ? data.purchaseHistory : [], // This is derived, but good to have a fallback
            employeeSalaries: Array.isArray(data.employeeSalaries) ? data.employeeSalaries : [],
            weeklyInventoryEntries: Array.isArray(data.weeklyInventoryEntries) ? data.weeklyInventoryEntries : [],
            products: Array.isArray(data.products) ? data.products : []
        };
    }
    return null;
}

// =========================================
// دوال الربط السحابي (POST / GET)
// =========================================
async function sendToCloud(payload) {
    if (isFileProtocol()) {
        console.warn("تم تخطي الربط السحابي لأن الصفحة مفتوحة من ملف محلي.");
        return false;
    }
    try {
        const formData = new FormData();
        formData.append('jsonData', JSON.stringify(payload));
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Accept': 'application/json' },
            body: formData
        });
        const text = await response.text();
        const parsed = safeParseJson(text);
        console.log("استجابة الربط السحابي:", response.status, parsed || text);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${parsed?.message || text || 'فشل الطلب'}`);
        }
        if (parsed && parsed.success === false) {
            throw new Error(parsed.message || 'فشل الحفظ في السحابة');
        }
        const normalized = normalizeCloudData(parsed && parsed.data ? parsed.data : null);
        if (normalized) {
            localStorage.setItem('clients', JSON.stringify(normalized.clients || []));
            localStorage.setItem('invoices', JSON.stringify(normalized.invoices || []));
            localStorage.setItem('purchaseHistory', JSON.stringify(normalized.purchaseHistory || []));
            localStorage.setItem('employeeSalaries', JSON.stringify(normalized.employeeSalaries || []));
            localStorage.setItem('weeklyInventoryEntries', JSON.stringify(normalized.weeklyInventoryEntries || []));
            localStorage.setItem('products', JSON.stringify(normalized.products || []));

            clients = normalized.clients || clients;
            invoices = normalized.invoices || invoices;
            purchaseHistory = normalized.purchaseHistory || purchaseHistory;
            employeeSalaries = normalized.employeeSalaries || employeeSalaries;
            weeklyInventoryEntries = normalized.weeklyInventoryEntries || weeklyInventoryEntries;
            products = normalized.products || products;
        }
        console.log("تم التحديث الفوري سحابياً!");
        return parsed || true;
    } catch (err) {
        console.error("خطأ في الربط السحابي:", err);
        return false;
    }
}

async function fetchCloudData() {
    if (isFileProtocol()) return;
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Accept': 'application/json' }
        });
        const text = await response.text();
        const parsed = safeParseJson(text);
        const normalized = normalizeCloudData(parsed && parsed.data ? parsed.data : null);
        if (normalized) {
            localStorage.setItem('clients', JSON.stringify(normalized.clients || []));
            localStorage.setItem('invoices', JSON.stringify(normalized.invoices || []));
            localStorage.setItem('purchaseHistory', JSON.stringify(normalized.purchaseHistory || []));
            localStorage.setItem('employeeSalaries', JSON.stringify(normalized.employeeSalaries || []));
            localStorage.setItem('weeklyInventoryEntries', JSON.stringify(normalized.weeklyInventoryEntries || []));
            if (normalized.products && normalized.products.length > 0) {
                localStorage.setItem('products', JSON.stringify(normalized.products));
            }

            clients = normalized.clients || [];
            invoices = normalized.invoices || [];
            purchaseHistory = normalized.purchaseHistory || [];
            employeeSalaries = normalized.employeeSalaries || [];
            weeklyInventoryEntries = normalized.weeklyInventoryEntries || [];
            if (normalized.products && normalized.products.length > 0) {
                products = normalized.products;
            }

            loadClientsList();
            loadInvoicesHistory();
            loadPurchaseHistory();
            loadEmployeeSalaries();
            loadProductSalesTotals();
            updateDashboard();
        }
    } catch (err) {
        console.error('تعذر تحميل البيانات من السحابة:', err);
    }
}

// =========================================
// اختبار الاتصال السحابي
// =========================================
window.testCloudConnection = async function() {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Accept': 'application/json' }
        });
        const text = await response.text();
        const parsed = safeParseJson(text);
        console.log('اختبار الاتصال بالسحابة:', response.status, parsed || text);
        if (response.ok) {
            showNotification('تم الاتصال بخدمة Google Apps Script بنجاح', 'success');
        } else {
            showNotification('فشل الاتصال بالخدمة. راجع صلاحيات النشر أو الرابط', 'error');
        }
    } catch (err) {
        console.error('فشل اختبار الاتصال:', err);
        showNotification('تعذر الاتصال بخدمة Google Apps Script', 'error');
    }
};

// =========================================
// جلب التقارير السحابية
// =========================================
async function fetchCloudReports() {
    if (isFileProtocol()) {
        console.warn("تم تخطي جلب التقارير السحابية لأن الصفحة مفتوحة من ملف محلي.");
        return;
    }
    try {
        console.log("جاري سحب أحدث التقارير المالية (GET)...");
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        const report = safeParseJson(text);
        console.log("تم استقبال التقرير اللحظي:", report || text);
        if (report && document.getElementById('daily-total-sales')) {
            document.getElementById('daily-total-sales').textContent = (report.totalSales || 0).toFixed(2) + " دينار";
        }
    } catch (err) {
        console.error("تعذر جلب التقارير اللحظية:", err);
    }
}

// =========================================
// كلمة المرور
// =========================================
const DELETE_PASSWORD = "12345678";
const PRODUCT_EDIT_PASSWORD = "2522005";

// =========================================
// متغيرات النظام
// =========================================
let productCount = 0;
let clients = JSON.parse(localStorage.getItem('clients')) || [];
let invoices = JSON.parse(localStorage.getItem('invoices')) || [];
let purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
let employeeSalaries = JSON.parse(localStorage.getItem('employeeSalaries')) || [];
let currentViewingClient = null;
let weeklyInventoryEntries = JSON.parse(localStorage.getItem('weeklyInventoryEntries')) || [];
let editingInvoiceId = null;
let editingInvoiceSnapshot = null;
let editingClientName = null;
let editingSalaryId = null;
let currentSalesPage = 1;
const salesPerPage = 10;
let lastSyncTimestamp = 0;
let lastAddedPaymentInfo = null;
let allPaymentsCache = [];
let autoRefreshTimer = null;
let quoteProductCount = 0;
let products = [];

// =========================================
// دوال التاريخ
// =========================================
function setDefaultDates() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    document.getElementById('invoice-date-input').value = `${year}-${month}-${day}`;
    updateDatesFromInput();
}

function updateDatesFromInput() {
    const dateInput = document.getElementById('invoice-date-input').value;
    if (dateInput) {
        const selectedDate = new Date(dateInput + 'T12:00:00');
        document.getElementById('invoice-date').textContent = selectedDate.toLocaleDateString('en-US');
        document.getElementById('hijri-date').textContent = getHijriDateFromDate(selectedDate);
    } else {
        const today = new Date();
        document.getElementById('invoice-date').textContent = today.toLocaleDateString('en-US');
        document.getElementById('hijri-date').textContent = getHijriDateFromDate(today);
    }
}

function getHijriDateFromDate(date) {
    try {
        return new Intl.DateTimeFormat('ar-TN-u-ca-islamic', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    } catch (e) {
        return 'غير متاح';
    }
}

function getHijriDate() {
    return getHijriDateFromDate(new Date());
}

// =========================================
// دوال إدارة المنتجات
// =========================================
function initializeDefaultProducts() {
    const defaultProducts = [
        { name: "زاوية", width: 4.15, length: 300, isSteel: true }, { name: "زوايا", width: 4.15, length: 300, isSteel: true },
        { name: "تركات", width: null, length: null, isSteel: false },
        { name: "امقاا", width: 9, length: 300, isSteel: true }, { name: "امقا", width: 9, length: 300, isSteel: true },
        { name: "سي شانل", width: 5.7, length: 300, isSteel: true }, { name: "سي شانل ٥.٧", width: 5.7, length: 300, isSteel: true },
        { name: "سي شانل 5.7", width: 5.7, length: 300, isSteel: true }, { name: "سي شانل ٥.٨", width: 5.8, length: 300, isSteel: true },
        { name: "سي شانل 5.8", width: 5.8, length: 300, isSteel: true },
        { name: "ستاد", width: 12, length: 300, isSteel: true }, { name: "ستاد ١٢", width: 12, length: 300, isSteel: true },
        { name: "ستاد 12", width: 12, length: 300, isSteel: true }, { name: "ستاد ١٢.٢", width: 12.2, length: 300, isSteel: true },
        { name: "ستاد 12.2", width: 12.2, length: 300, isSteel: true },
        { name: "زاويه الظل", width: null, length: null, isSteel: false },
        { name: "ألواح جبسمبورد أبيض", width: null, length: null, isSteel: false },
        { name: "ألواح جبسمبورد أخضر", width: null, length: null, isSteel: false },
        { name: "بضائع أخوة متنوعة", width: null, length: null, isSteel: false },
        { name: 'جسور', width: 20.5, length: 300, isSteel: true }
    ];
    const productMap = new Map();
    defaultProducts.forEach(p => {
        if (!productMap.has(p.name)) {
            productMap.set(p.name, p);
        }
    });
    return Array.from(productMap.values());
}

function loadProducts() {
    try {
        const storedProducts = JSON.parse(localStorage.getItem('products'));
        if (storedProducts && Array.isArray(storedProducts) && storedProducts.length > 0) {
            products = storedProducts;
        } else {
            products = initializeDefaultProducts();
            saveProducts();
        }
    } catch (e) {
        console.error("Failed to load products, initializing defaults.", e);
        products = initializeDefaultProducts();
    }
}

function saveProducts() {
async function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
    try {
        // The new Apps Script expects the whole list
        await sendToCloud({ action: 'saveProducts', products: products });
        // No need for a success message here as it's a background sync
    } catch (err) {
        showNotification('فشلت مزامنة قائمة المنتجات.', 'error');
    }
}

// =========================================
// دوال إدارة المنتجات في الفاتورة
// =========================================
function addProductRow() {
    productCount++;
    const tbody = document.getElementById('products-body');
    const row = document.createElement('tr');
    
    const cellNum = document.createElement('td');
    cellNum.textContent = productCount;
    row.appendChild(cellNum);
    
    const cellProduct = document.createElement('td');
    const productDiv = document.createElement('div');
    productDiv.className = 'product-select';
    const select = document.createElement('select');
    select.className = 'product-name';
    let options = '<option value="">اختر منتج</option>';
    products.sort((a, b) => a.name.localeCompare(b.name, 'ar')).forEach(product => {
        const widthText = product.width ? ` (${product.width} سم)` : '';
        const displayText = `${escapeHtml(product.name)}${widthText}`;
        options += `<option value="${escapeHtml(product.name)}">${displayText}</option>`;
    });
    options += '<option value="--add-new--" style="font-weight:bold; background-color:#e8f5e9;">+ إضافة أو تعديل منتج...</option>';
    select.innerHTML = options;
    const productSpan = document.createElement('span');
    productSpan.className = 'print-value';
    productSpan.style.display = 'none';
    productDiv.appendChild(select);
    productDiv.appendChild(productSpan);
    cellProduct.appendChild(productDiv);
    row.appendChild(cellProduct);
    
    const cellThick = document.createElement('td');
    const thickInput = document.createElement('input');
    thickInput.type = 'number';
    thickInput.className = 'thickness';
    thickInput.value = '0';
    thickInput.min = '0';
    thickInput.step = '0.1';
    thickInput.addEventListener('focus', function() { this.select(); });
    const thickSpan = document.createElement('span');
    thickSpan.className = 'print-value';
    thickSpan.style.display = 'none';
    thickSpan.textContent = '0';
    cellThick.appendChild(thickInput);
    cellThick.appendChild(thickSpan);
    row.appendChild(cellThick);
    
    const cellQty = document.createElement('td');
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.className = 'quantity';
    qtyInput.value = '1';
    qtyInput.min = '1';
    qtyInput.addEventListener('focus', function() { this.select(); });
    const qtySpan = document.createElement('span');
    qtySpan.className = 'print-value';
    qtySpan.style.display = 'none';
    qtySpan.textContent = '1';
    cellQty.appendChild(qtyInput);
    cellQty.appendChild(qtySpan);
    row.appendChild(cellQty);
    
    const cellPrice = document.createElement('td');
    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.className = 'price';
    priceInput.value = '0.00';
    priceInput.min = '0';
    priceInput.step = '0.01';
    priceInput.addEventListener('focus', function() { this.select(); });
    const priceSpan = document.createElement('span');
    priceSpan.className = 'print-value';
    priceSpan.style.display = 'none';
    priceSpan.textContent = '0.00';
    cellPrice.appendChild(priceInput);
    cellPrice.appendChild(priceSpan);
    row.appendChild(cellPrice);
    
    const cellDisc = document.createElement('td');
    const discInput = document.createElement('input');
    discInput.type = 'number';
    discInput.className = 'discount';
    discInput.value = '0';
    discInput.min = '0';
    discInput.max = '100';
    discInput.addEventListener('focus', function() { this.select(); });
    const discSpan = document.createElement('span');
    discSpan.className = 'print-value';
    discSpan.style.display = 'none';
    discSpan.textContent = '0';
    cellDisc.appendChild(discInput);
    cellDisc.appendChild(discSpan);
    row.appendChild(cellDisc);
    
    const cellTotal = document.createElement('td');
    cellTotal.className = 'total';
    cellTotal.textContent = '0.00';
    row.appendChild(cellTotal);
    
    const cellActions = document.createElement('td');
    cellActions.className = 'no-print';
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger remove-product';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> حذف';
    cellActions.appendChild(deleteBtn);
    row.appendChild(cellActions);
    
    tbody.appendChild(row);
    
    function updateSpanFromInput(input, span) {
        span.textContent = input.value;
    }
    
    thickInput.addEventListener('input', function() {
        thickSpan.textContent = this.value;
        calculateRowTotal(row);
        calculateTotals();
        updatePaymentBalance();
    });
    qtyInput.addEventListener('input', function() {
        qtySpan.textContent = this.value;
        calculateRowTotal(row);
        calculateTotals();
        updatePaymentBalance();
    });
    priceInput.addEventListener('input', function() {
        priceSpan.textContent = this.value;
        calculateRowTotal(row);
        calculateTotals();
        updatePaymentBalance();
    });
    discInput.addEventListener('input', function() {
        discSpan.textContent = this.value;
        calculateRowTotal(row);
        calculateTotals();
        updatePaymentBalance();
    });
    select.addEventListener('change', function() {
        productSpan.textContent = this.options[this.selectedIndex]?.text || '';
        if (this.value === '--add-new--') {
            openProductModal();
            this.value = '';
            productSpan.textContent = '';
        }
        calculateTotals();
        updatePaymentBalance();
    });
    deleteBtn.addEventListener('click', function() {
        row.remove();
        renumberRows();
        calculateTotals();
        updatePaymentBalance();
    });
    
    thickSpan.textContent = thickInput.value;
    qtySpan.textContent = qtyInput.value;
    priceSpan.textContent = priceInput.value;
    discSpan.textContent = discInput.value;
    productSpan.textContent = select.options[select.selectedIndex]?.text || '';
    calculateRowTotal(row);
}

function clearProductModalForm() {
    document.getElementById('modal-product-name').value = '';
    document.getElementById('modal-product-width').value = '';
    document.getElementById('modal-product-is-steel').checked = true;
    document.getElementById('modal-product-length').value = '300';
    document.getElementById('modal-product-name').focus();
}

function openProductModal() {
    const enteredPassword = prompt('للوصول إلى إدارة المنتجات، يرجى إدخال كلمة المرور:');
    
    if (enteredPassword !== PRODUCT_EDIT_PASSWORD) {
        if (enteredPassword !== null) {
            showNotification('كلمة المرور غير صحيحة', 'error');
        }
        return;
    }

    const modal = document.getElementById('productModal');
    clearProductModalForm();
    document.getElementById('modal-product-search').value = '';
    populateProductEditorList();
    modal.style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

function populateProductEditorList(filter = '') {
    const tableBody = document.getElementById('modal-product-list-body');
    tableBody.innerHTML = '';
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));

    if (filteredProducts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">لا توجد منتجات مطابقة للبحث.</td></tr>';
        return;
    }

    filteredProducts.sort((a, b) => a.name.localeCompare(b.name, 'ar')).forEach(product => {
        const row = tableBody.insertRow();
        
        const nameCell = row.insertCell(0);
        nameCell.textContent = product.name;

        const widthCell = row.insertCell(1);
        widthCell.textContent = product.width ? `${product.width} سم` : 'غير محدد';

        const lengthCell = row.insertCell(2);
        lengthCell.textContent = product.length ? `${product.length} سم` : 'غير محدد';

        const typeCell = row.insertCell(3);
        typeCell.textContent = product.isSteel ? 'حديدي' : 'آخر';
        typeCell.style.fontWeight = product.isSteel ? 'bold' : 'normal';
        typeCell.style.color = product.isSteel ? '#27ae60' : '#7f8c8d';


        [widthCell, lengthCell, typeCell].forEach(cell => cell.style.textAlign = 'center');

        const actionsCell = row.insertCell(4);
        actionsCell.style.textAlign = 'left';

        const editBtn = document.createElement('button');
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.className = 'btn btn-secondary';
        editBtn.title = 'تعديل المنتج';
        editBtn.onclick = () => {
            document.getElementById('modal-product-name').value = product.name;
            document.getElementById('modal-product-width').value = product.width || '';
            document.getElementById('modal-product-is-steel').checked = product.isSteel;
            document.getElementById('modal-product-length').value = product.length || '300';
            document.getElementById('modal-product-name').focus();
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.title = 'حذف المنتج';
        deleteBtn.onclick = () => {
            if (confirm(`هل أنت متأكد من حذف المنتج "${product.name}"؟`)) {
                products = products.filter(p => p.name !== product.name);
                saveProducts();
                populateProductEditorList(document.getElementById('modal-product-search').value);
                refreshAllProductDropdowns();
            }
        };
        
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
    });
}

function saveProductFromModal() {
async function saveProductFromModal() {
    const name = document.getElementById('modal-product-name').value.trim();
    const width = parseFloat(document.getElementById('modal-product-width').value) || null;
    const isSteel = document.getElementById('modal-product-is-steel').checked;
    const length = parseFloat(document.getElementById('modal-product-length').value) || 300;
    if (!name) {
        showNotification('اسم المنتج لا يمكن أن يكون فارغاً', 'error');
        return;
    }
    const existingProductIndex = products.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
    if (existingProductIndex > -1) {
        Object.assign(products[existingProductIndex], { width, length, isSteel });
    } else {
        products.push({ name, width, length, isSteel });
    }
    saveProducts();
    await saveProducts();
    showNotification('تم حفظ المنتج بنجاح', 'success');
    clearProductModalForm();
    populateProductEditorList(document.getElementById('modal-product-search').value);
    refreshAllProductDropdowns();
}

function calculateRowTotal(row) {
    const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
    const price = parseFloat(row.querySelector('.price').value) || 0;
    const discount = parseFloat(row.querySelector('.discount').value) || 0;
    const discountAmount = (price * discount) / 100;
    const priceAfterDiscount = price - discountAmount;
    const total = priceAfterDiscount * quantity;
    row.querySelector('.total').textContent = total.toFixed(2);
}

function refreshAllProductDropdowns() {
    const selects = document.querySelectorAll('.product-name');
    selects.forEach(select => {
        const currentValue = select.value;
        let options = '<option value="">اختر منتج</option>';
        products.sort((a, b) => a.name.localeCompare(b.name, 'ar')).forEach(product => {
            const widthText = product.width ? ` (${product.width} سم)` : '';
            const displayText = `${escapeHtml(product.name)}${widthText}`;
            options += `<option value="${escapeHtml(product.name)}">${displayText}</option>`;
        });
        options += '<option value="--add-new--" style="font-weight:bold; background-color:#e8f5e9;">+ إضافة أو تعديل منتج...</option>';
        select.innerHTML = options;
        
        if (products.some(p => p.name === currentValue)) {
            select.value = currentValue;
        }
    });
}

function renumberRows() {
    const rows = document.querySelectorAll('#products-body tr');
    productCount = 0;
    rows.forEach(row => {
        productCount++;
        row.cells[0].textContent = productCount;
    });
}

function calculateTotals() {
    let subtotal = 0, totalDiscount = 0, totalTax = 0, grandTotal = 0;
    const rows = document.querySelectorAll('#products-body tr');
    rows.forEach(row => {
        calculateRowTotal(row);
        const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
        const price = parseFloat(row.querySelector('.price').value) || 0;
        const discount = parseFloat(row.querySelector('.discount').value) || 0;
        const rowSubtotal = price * quantity;
        const discountAmount = (rowSubtotal * discount) / 100;
        const priceAfterDiscount = rowSubtotal - discountAmount;
        const taxRate = 16;
        const taxAmount = (priceAfterDiscount * taxRate) / (100 + taxRate);
        subtotal += rowSubtotal;
        totalDiscount += discountAmount;
        totalTax += taxAmount;
        grandTotal += priceAfterDiscount;
    });
    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('total-discount').textContent = totalDiscount.toFixed(2);
    document.getElementById('total-tax').textContent = totalTax.toFixed(2);
    document.getElementById('grand-total').textContent = grandTotal.toFixed(2);
}

// =========================================
// دوال الدفع
// =========================================
function updatePaymentBalance() {
    const grandTotal = parseFloat(document.getElementById('grand-total').textContent) || 0;
    const previousBalance = parseFloat(document.getElementById('previous-balance').textContent) || 0;
    const totalDue = grandTotal + previousBalance;
    let paidAmount = 0;
    if (document.getElementById('enable-multiple-payments').checked) {
        paidAmount = parseFloat(document.getElementById('total-paid').textContent) || 0;
    } else {
        paidAmount = parseFloat(document.getElementById('paid-amount').value) || 0;
    }
    const remainingBalance = totalDue - paidAmount;
    document.getElementById('balance-amount').textContent = Math.max(0, remainingBalance).toFixed(2);
    if (remainingBalance > 0) {
        document.getElementById('remaining-balance').style.color = '#e74c3c';
    } else {
        document.getElementById('remaining-balance').style.color = '#27ae60';
    }
}

document.querySelectorAll('input[name="payment-method"]').forEach(radio => { // تعديل: إضافة منطق التعامل مع الذمم
    radio.addEventListener('change', function() {
        document.getElementById('check-fields-single').style.display = this.value === 'check' ? 'grid' : 'none';
        const paidAmountInput = document.getElementById('paid-amount');
        const isReceivable = this.value === 'receivable';

        paidAmountInput.disabled = isReceivable;
        if (isReceivable) {
            paidAmountInput.value = '0.00';
        }
        updatePaymentBalance();
    });
});

document.getElementById('check-image-single').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const preview = document.getElementById('check-preview-single');
            preview.src = ev.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

function setupMultiplePayments() {
    // إزالة المستمعات القديمة لتجنب التكرار
    const addBtn = document.getElementById('add-payment-method');
    if (addBtn) {
        addBtn.removeEventListener('click', addPaymentMethodHandler);
        addBtn.addEventListener('click', addPaymentMethodHandler);
    }

    // إعداد الصفوف الموجودة
    document.querySelectorAll('.payment-row').forEach(row => {
        setupPaymentRow(row);
    });
}

function addPaymentMethodHandler() {
    const paymentSection = document.getElementById('multiple-payments-section');
    const addButton = document.getElementById('add-payment-method');
    const paymentRow = createPaymentRow();
    paymentSection.insertBefore(paymentRow, addButton);
    setupPaymentRow(paymentRow);
    updateMultiplePaymentsTotal();
}

function createPaymentRow() {
    const paymentRow = document.createElement('div');
    paymentRow.className = 'payment-row';
    paymentRow.innerHTML = `
        <select class="payment-method-select">
            <option value="cash">كاش</option>
            <option value="receivable">ذمم</option>
            <option value="check">شيكات</option>
            <option value="exchange">تبديل بضائع</option>
            <option value="bank">تحويل بنكي</option>
        </select>
        <input type="number" class="payment-amount" placeholder="المبلغ" min="0" step="0.01">
        <div class="check-fields-multiple" style="display:none; grid-column:span 3; background:#f0f7ff; padding:10px; border-radius:8px;">
            <div><strong>رقم الشيك:</strong> <input type="text" class="check-number" placeholder="رقم الشيك"></div>
            <div><strong>تاريخ الصرف:</strong> <input type="date" class="check-date"></div>
            <div><strong>صورة الشيك:</strong> <input type="file" class="check-image" accept="image/*"></div>
            <div><img class="check-preview" style="max-width:100px; max-height:100px; display:none;"></div>
        </div>
        <button class="btn btn-danger remove-payment"><i class="fas fa-trash"></i> حذف</button>
    `;
    return paymentRow;
}

function setupPaymentRow(row) {
    const methodSelect = row.querySelector('.payment-method-select');
    const checkFields = row.querySelector('.check-fields-multiple');
    const amountInput = row.querySelector('.payment-amount');
    const removeBtn = row.querySelector('.remove-payment');
    const checkImage = row.querySelector('.check-image');
    const checkPreview = row.querySelector('.check-preview');

    methodSelect.addEventListener('change', function() {
        checkFields.style.display = this.value === 'check' ? 'block' : 'none';
    });

    amountInput.addEventListener('input', updateMultiplePaymentsTotal);

    removeBtn.addEventListener('click', function() {
        const rows = document.querySelectorAll('.payment-row');
        if (rows.length > 1) {
            row.remove();
            updateMultiplePaymentsTotal();
        } else {
            showNotification('يجب أن تبقى طريقة دفع واحدة على الأقل', 'error');
        }
    });

    if (checkImage) {
        checkImage.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    checkPreview.src = ev.target.result;
                    checkPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function updateMultiplePaymentsTotal() {
    let total = 0;
    document.querySelectorAll('.payment-amount').forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    document.getElementById('total-paid').textContent = total.toFixed(2);
    updatePaymentBalance();
}

// =========================================
// دوال سجل المشتريات
// =========================================
function deletePurchaseHistoryByInvoiceId(invoiceId) {
    purchaseHistory = purchaseHistory.filter(p => p.invoiceId !== invoiceId);
    localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));
}

function addToPurchaseHistory(productName, thickness, quantity, price, total, clientName, invoiceId) {
    const purchase = {
        id: Date.now().toString() + Math.random(),
        date: new Date().toISOString(),
        productName,
        thickness: thickness || null,
        quantity,
        price,
        total: total,
        clientName,
        invoiceId: invoiceId
    };
    purchaseHistory.push(purchase);
    localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));
}

// =========================================
// دوال حفظ واسترجاع الفواتير
// =========================================
async function saveInvoice() {
    const clientName = document.getElementById('client-name').value.trim();
    const clientAddress = document.getElementById('client-address').value.trim();
    const clientPhone = document.getElementById('client-phone').value.trim();
    if (!clientName) {
        showNotification('يرجى إدخال اسم العميل', 'error');
        return;
    }
    const productsData = [];
    const rows = document.querySelectorAll('#products-body tr');
    rows.forEach(row => {
        const productName = row.querySelector('.product-name').value;
        const thickness = parseFloat(row.querySelector('.thickness').value) || null;
        const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
        const price = parseFloat(row.querySelector('.price').value) || 0;
        const discount = parseFloat(row.querySelector('.discount').value) || 0;
        const total = parseFloat(row.querySelector('.total').textContent) || 0;
        if (productName && quantity > 0 && price > 0) {
            productsData.push({ productName, thickness, quantity, price, discount, total });
        }
    });
    if (productsData.length === 0) {
        showNotification('يرجى إضافة منتجات إلى الفاتورة', 'error');
        return;
    }
    let paymentData = {};
    const grandTotal = parseFloat(document.getElementById('grand-total').textContent) || 0;
    const previousBalance = parseFloat(document.getElementById('previous-balance').textContent) || 0;
    const totalDue = grandTotal + previousBalance;
    if (document.getElementById('enable-multiple-payments').checked) {
        const payments = [];
        let totalPaid = 0;
        document.querySelectorAll('.payment-row').forEach(row => {
            const method = row.querySelector('.payment-method-select').value;
            const amount = parseFloat(row.querySelector('.payment-amount').value) || 0;
            if (amount > 0) {
                const checkDetails = (method === 'check') ? {
                    checkNumber: row.querySelector('.check-number')?.value || '',
                    checkDate: row.querySelector('.check-date')?.value || '',
                    checkImage: row.querySelector('.check-preview')?.src || ''
                } : null;
                payments.push({ method, amount, checkDetails });
                totalPaid += amount;
            }
        });
        paymentData = { type: 'multiple', payments, paidAmount: totalPaid, remainingBalance: totalDue - totalPaid };
    } else {
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
        const paidAmount = parseFloat(document.getElementById('paid-amount').value) || 0;
        const checkDetails = (paymentMethod === 'check') ? {
            checkNumber: document.getElementById('check-number-single').value || '',
            checkDate: document.getElementById('check-date-single').value || '',
            checkImage: document.getElementById('check-preview-single').src || ''
        } : null;
        paymentData = { type: 'single', method: paymentMethod, paidAmount, remainingBalance: totalDue - paidAmount, checkDetails };
    }
    const selectedDate = document.getElementById('invoice-date-input').value;
    const invoiceDate = selectedDate ? new Date(selectedDate + 'T12:00:00').toISOString() : new Date().toISOString();
    const invoice = {
        id: editingInvoiceId || generateInvoiceId(),
        date: invoiceDate,
        client: { name: clientName, address: clientAddress, phone: clientPhone },
        products: productsData,
        subtotal: parseFloat(document.getElementById('subtotal').textContent) || 0,
        totalDiscount: parseFloat(document.getElementById('total-discount').textContent) || 0,
        totalTax: parseFloat(document.getElementById('total-tax').textContent) || 0,
        grandTotal: grandTotal,
        payment: paymentData,
        status: paymentData.remainingBalance > 0 ? 'غير مدفوعة بالكامل' : 'مدفوعة'
    };
    let client = clients.find(c => c.name === clientName);
    const isNewClient = !client;
    if (isNewClient) {
        client = { id: Date.now().toString(), name: clientName, address: clientAddress, phone: clientPhone, balance: 0, createdAt: new Date().toISOString(), payments: [], adjustments: [] };
    } else {
        client.address = clientAddress;
        client.phone = clientPhone;
    }
    // تصحيح حساب الرصيد عند التعديل
    if (editingInvoiceId && editingInvoiceSnapshot) {
        const oldRemainingBalance = editingInvoiceSnapshot.payment?.remainingBalance || 0;
        client.balance = (client.balance || 0) - oldRemainingBalance + invoice.payment.remainingBalance;
    } else {
        client.balance = (client.balance || 0) + invoice.payment.remainingBalance;
    }
    if (isNewClient) clients.push(client);
    localStorage.setItem('clients', JSON.stringify(clients));
    if (editingInvoiceId) {
        invoices = invoices.filter(inv => inv.id !== editingInvoiceId);
        purchaseHistory = purchaseHistory.filter(p => p.invoiceId !== editingInvoiceId);
    }
    productsData.forEach(product => {
        addToPurchaseHistory(product.productName, product.thickness, product.quantity, product.price, product.total, clientName, invoice.id);
    });
    invoices.push(invoice);
    localStorage.setItem('invoices', JSON.stringify(invoices));
    try {
        await sendToCloud({ action: 'saveClient', client: client });
        if (editingInvoiceId) await sendToCloud({ action: 'deleteInvoice', invoiceId: editingInvoiceId });
        await sendToCloud({ action: 'saveInvoice', invoice: invoice });
        await fetchCloudData();
        showNotification(editingInvoiceId ? 'تم تعديل طلب البيع بنجاح' : 'تم حفظ طلب البيع بنجاح');
    } catch (err) {
        console.error('فشل مزامنة الطلب/العميل:', err);
        showNotification('تم الحفظ محليًا لكن فشلت المزامنة السحابية', 'error');
    }
    editingInvoiceId = null;
    editingInvoiceSnapshot = null;
    resetInvoiceForm();
    loadReports();
    updateDashboard();
    loadInvoicesHistory();
}

function generateInvoiceId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-4);
    return `INV-${year}${month}${day}-${time}`;
}

function editInvoice(invoiceId) {
    const invoiceIndex = invoices.findIndex(inv => inv.id === invoiceId);
    if (invoiceIndex === -1) {
        showNotification('لم يتم العثور على طلب البيع', 'error');
        return;
    }
    const invoice = invoices[invoiceIndex];
    editingInvoiceSnapshot = JSON.parse(JSON.stringify(invoice));
    document.querySelector('.tab[data-tab="invoice"]').click();
    document.getElementById('client-name').value = invoice.client.name;
    document.getElementById('client-address').value = invoice.client.address || '';
    document.getElementById('client-phone').value = invoice.client.phone || '';
    const invoiceDate = new Date(invoice.date);
    const year = invoiceDate.getFullYear();
    const month = String(invoiceDate.getMonth() + 1).padStart(2, '0');
    const day = String(invoiceDate.getDate()).padStart(2, '0');
    document.getElementById('invoice-date-input').value = `${year}-${month}-${day}`;
    updateDatesFromInput();
    document.getElementById('products-body').innerHTML = '';
    productCount = 0;
    invoice.products.forEach(product => {
        addProductRow();
        const lastRow = document.querySelector('#products-body tr:last-child');
        lastRow.querySelector('.product-name').value = product.productName;
        if (lastRow.querySelector('.thickness')) lastRow.querySelector('.thickness').value = product.thickness || 0;
        lastRow.querySelector('.quantity').value = product.quantity;
        lastRow.querySelector('.price').value = product.price;
        lastRow.querySelector('.discount').value = product.discount;
        calculateRowTotal(lastRow);
    });
    if (invoice.payment.type === 'multiple') {
        document.getElementById('enable-multiple-payments').checked = true;
        document.getElementById('multiple-payments-section').style.display = 'block';
        document.getElementById('single-payment-section').style.display = 'none';
        // إعادة بناء قسم الدفعات المتعددة
        const section = document.getElementById('multiple-payments-section');
        section.innerHTML = '';
        invoice.payment.payments.forEach(payment => {
            const row = createPaymentRow();
            // تعبئة القيم
            const methodSelect = row.querySelector('.payment-method-select');
            methodSelect.value = payment.method;
            const amountInput = row.querySelector('.payment-amount');
            amountInput.value = payment.amount;
            if (payment.method === 'check' && payment.checkDetails) {
                const checkFields = row.querySelector('.check-fields-multiple');
                checkFields.style.display = 'block';
                row.querySelector('.check-number').value = payment.checkDetails.checkNumber || '';
                row.querySelector('.check-date').value = payment.checkDetails.checkDate || '';
                if (payment.checkDetails.checkImage) {
                    const preview = row.querySelector('.check-preview');
                    preview.src = payment.checkDetails.checkImage;
                    preview.style.display = 'block';
                }
            }
            section.appendChild(row);
            setupPaymentRow(row);
        });
        // إضافة زر الإضافة
        const addBtn = document.createElement('button');
        addBtn.className = 'btn';
        addBtn.id = 'add-payment-method';
        addBtn.innerHTML = '<i class="fas fa-plus"></i> إضافة طريقة دفع أخرى';
        section.appendChild(addBtn);
        // إضافة ملخص
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'payment-summary';
        summaryDiv.innerHTML = `<strong>إجمالي المدفوع:</strong> <span id="total-paid">${invoice.payment.paidAmount.toFixed(2)}</span> دينار`;
        section.appendChild(summaryDiv);
        // ربط زر الإضافة
        addBtn.addEventListener('click', addPaymentMethodHandler);
        // تحديث المجموع
        updateMultiplePaymentsTotal();
    } else {
        document.getElementById('enable-multiple-payments').checked = false;
        document.getElementById('multiple-payments-section').style.display = 'none';
        document.getElementById('single-payment-section').style.display = 'block';
        document.querySelector(`input[name="payment-method"][value="${invoice.payment.method}"]`).checked = true;
        document.getElementById('paid-amount').value = invoice.payment.paidAmount;
        if (invoice.payment.method === 'check' && invoice.payment.checkDetails) {
            document.getElementById('check-fields-single').style.display = 'grid';
            document.getElementById('check-number-single').value = invoice.payment.checkDetails.checkNumber || '';
            document.getElementById('check-date-single').value = invoice.payment.checkDetails.checkDate || '';
            if (invoice.payment.checkDetails.checkImage) {
                document.getElementById('check-preview-single').src = invoice.payment.checkDetails.checkImage;
                document.getElementById('check-preview-single').style.display = 'block';
            }
        } else {
            document.getElementById('check-fields-single').style.display = 'none';
        }
    }
    calculateTotals();
    updatePaymentBalance();
    editingInvoiceId = invoiceId;
    showNotification('تم تحميل القيم الأصلية للطلب بنجاح');
}

function resetInvoiceForm() {
    document.getElementById('products-body').innerHTML = '';
    document.getElementById('client-name').value = '';
    document.getElementById('client-address').value = '';
    document.getElementById('client-phone').value = '';
    document.getElementById('paid-amount').value = '0.00';
    document.getElementById('client-balance-info').style.display = 'none';
    document.getElementById('subtotal').textContent = '0.00';
    document.getElementById('total-discount').textContent = '0.00';
    document.getElementById('total-tax').textContent = '0.00';
    document.getElementById('grand-total').textContent = '0.00';
    updatePaymentBalance();
    productCount = 0;
    addProductRow();
    setDefaultDates();
    document.getElementById('enable-multiple-payments').checked = false;
    document.getElementById('multiple-payments-section').style.display = 'none';
    document.getElementById('single-payment-section').style.display = 'block';
    document.getElementById('multiple-payments-section').innerHTML = `
        <div class="payment-row">
            <select class="payment-method-select">
                <option value="cash">كاش</option>
                <option value="receivable">ذمم</option>
                <option value="check">شيكات</option>
                <option value="exchange">تبديل بضائع</option>
                <option value="bank">تحويل بنكي</option>
            </select>
            <input type="number" class="payment-amount" placeholder="المبلغ" min="0" step="0.01">
            <div class="check-fields-multiple" style="display:none; grid-column:span 3; background:#f0f7ff; padding:10px; border-radius:8px;">
                <div><strong>رقم الشيك:</strong> <input type="text" class="check-number" placeholder="رقم الشيك"></div>
                <div><strong>تاريخ الصرف:</strong> <input type="date" class="check-date"></div>
                <div><strong>صورة الشيك:</strong> <input type="file" class="check-image" accept="image/*"></div>
                <div><img class="check-preview" style="max-width:100px; max-height:100px; display:none;"></div>
            </div>
            <button class="btn btn-danger remove-payment"><i class="fas fa-trash"></i> حذف</button>
        </div>
        <button class="btn" id="add-payment-method"><i class="fas fa-plus"></i> إضافة طريقة دفع أخرى</button>
        <div class="payment-summary"><strong>إجمالي المدفوع:</strong> <span id="total-paid">0.00</span> دينار</div>
    `;
    setupMultiplePayments();
}

// =========================================
// دوال العملاء
// =========================================
function updateClientBalance(clientName, balanceChange) {
    let client = clients.find(c => c.name === clientName);
    if (!client) {
        client = { id: Date.now().toString(), name: clientName, address: document.getElementById('client-address').value || '', phone: document.getElementById('client-phone').value || '', balance: balanceChange, createdAt: new Date().toISOString(), payments: [] };
        clients.push(client);
    } else {
        client.balance = (client.balance || 0) + balanceChange;
    }
    localStorage.setItem('clients', JSON.stringify(clients));
}

function autocompleteClient(searchTerm) {
    const autocompleteList = document.getElementById('client-autocomplete-list');
    autocompleteList.innerHTML = '';
    if (searchTerm.length < 2) return;
    const filteredClients = clients.filter(client => client.name.toLowerCase().includes(searchTerm.toLowerCase()));
    filteredClients.forEach(client => {
        const item = document.createElement('div');
        item.textContent = client.name;
        item.addEventListener('click', function() {
            document.getElementById('client-search').value = client.name;
            autocompleteList.innerHTML = '';
            document.getElementById('client-name').value = client.name;
            document.getElementById('client-address').value = client.address || '';
            document.getElementById('client-phone').value = client.phone || '';
            document.getElementById('previous-balance').textContent = (client.balance || 0).toFixed(2);
            document.getElementById('client-balance-info').style.display = 'block';
            updatePaymentBalance();
        });
        autocompleteList.appendChild(item);
    });
}

function searchClient() {
    const searchTerm = document.getElementById('client-search').value;
    if (!searchTerm) {
        showNotification('يرجى إدخال اسم العميل للبحث', 'error');
        return;
    }
    const client = clients.find(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (client) {
        document.getElementById('client-name').value = client.name;
        document.getElementById('client-address').value = client.address || '';
        document.getElementById('client-phone').value = client.phone || '';
        document.getElementById('previous-balance').textContent = (client.balance || 0).toFixed(2);
        document.getElementById('client-balance-info').style.display = 'block';
        updatePaymentBalance();
        showNotification('تم العثور على العميل');
    } else {
        showNotification('لم يتم العثور على العميل', 'error');
    }
}

async function saveClient() {
    const name = document.getElementById('new-client-name').value.trim();
    const address = document.getElementById('new-client-address').value.trim();
    const phone = document.getElementById('new-client-phone').value.trim();
    if (!name) {
        showNotification('يرجى إدخال اسم العميل', 'error');
        return;
    }
    const existingClient = clients.find(client => client.name === name);
    if (existingClient && existingClient.name !== editingClientName) {
        showNotification('هناك عميل مسجل بنفس الاسم', 'error');
        return;
    }
    if (editingClientName) {
        const clientToEdit = clients.find(client => client.name === editingClientName);
        if (!clientToEdit) {
            showNotification('لم يتم العثور على العميل المطلوب', 'error');
            return;
        }
        clientToEdit.name = name;
        clientToEdit.address = address;
        clientToEdit.phone = phone;
        invoices.forEach(invoice => {
            if (invoice.client && invoice.client.name === editingClientName) {
                invoice.client.name = name;
                invoice.client.address = address;
                invoice.client.phone = phone;
            }
        });
        purchaseHistory.forEach(purchase => {
            if (purchase.clientName === editingClientName) purchase.clientName = name;
        });
        localStorage.setItem('invoices', JSON.stringify(invoices));
        localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));
        localStorage.setItem('clients', JSON.stringify(clients));
        try {
            await sendToCloud({ action: 'saveClient', client: clientToEdit });
            await fetchCloudData();
            showNotification('تم تعديل العميل بنجاح');
        } catch (err) {
            console.error('فشل تعديل العميل بالسحابة:', err);
            showNotification('تم تعديل العميل محليًا لكن لم يتم الإرسال للسحابة', 'error');
        }
    } else {
        const client = { id: Date.now().toString(), name, address, phone, balance: 0, createdAt: new Date().toISOString(), payments: [], adjustments: [] };
        clients.push(client);
        localStorage.setItem('clients', JSON.stringify(clients));
        try {
            const cloudResult = await sendToCloud({ action: 'saveClient', client: client });
            if (cloudResult) await fetchCloudData();
            showNotification('تم حفظ العميل بنجاح');
        } catch (err) {
            console.error('فشل إرسال العميل للسحابة:', err);
            showNotification('تم حفظ العميل محليًا لكن لم يتم الإرسال للسحابة', 'error');
        }
    }
    editingClientName = null;
    document.getElementById('new-client-name').value = '';
    document.getElementById('new-client-address').value = '';
    document.getElementById('new-client-phone').value = '';
    loadClientsList();
    loadInvoicesHistory();
    loadPurchaseHistory();
    updateDashboard();
}

function loadClientsList() {
    const clientList = document.getElementById('client-list');
    clientList.innerHTML = '';
    if (clients.length === 0) {
        clientList.innerHTML = '<div class="client-item">لا توجد عملاء مسجلين</div>';
        return;
    }
    clients.forEach(client => {
        const item = document.createElement('div');
        item.className = 'client-item';
        const balanceClass = client.balance > 0 ? 'balance-negative' : client.balance < 0 ? 'balance-positive' : '';
        item.innerHTML = `
            <div><strong>${client.name}</strong></div>
            <div>${client.address || 'لا يوجد عنوان'}</div>
            <div>${client.phone || 'لا يوجد هاتف'}</div>
            <div class="client-financial-info ${balanceClass}">الرصيد: ${(client.balance || 0).toFixed(2)} دينار ${client.balance > 0 ? ' (مدين)' : client.balance < 0 ? ' (دائن)' : ''}</div>
            <div style="display: flex; gap: 5px; margin-top: 10px; flex-wrap: wrap;">
                <button class="btn btn-info view-client-invoices" style="flex: 1; min-width: 90px;" data-client-name="${client.name}"><i class="fas fa-eye"></i> عرض</button>
                <button class="btn btn-info financial-record" style="flex: 1; min-width: 120px;" data-client-name="${client.name}"><i class="fas fa-file-invoice-dollar"></i> السجل المالي</button>
                <button class="btn btn-warning monthly-statement" style="flex: 1; min-width: 120px;" data-client-name="${client.name}"><i class="fas fa-calendar-alt"></i> كشف حساب</button>
                <button class="btn btn-secondary edit-client" style="flex: 1; min-width: 90px;" data-client-name="${client.name}"><i class="fas fa-edit"></i> تعديل</button>
                <button class="btn btn-success add-payment-shortcut" style="flex: 1; min-width: 120px;" data-client-name="${client.name}"><i class="fas fa-money-bill-wave"></i> إضافة دفعة</button>
            </div>
        `;
        item.querySelector('.view-client-invoices').addEventListener('click', function() {
            viewClientInvoices(this.getAttribute('data-client-name'));
        });
        item.querySelector('.financial-record').addEventListener('click', function() {
            viewFinancialLedger(this.getAttribute('data-client-name'));
        });
        item.querySelector('.monthly-statement').addEventListener('click', function() {
            viewMonthlyStatement(this.getAttribute('data-client-name'));
        });
        item.querySelector('.add-payment-shortcut').addEventListener('click', function() {
            showAddPaymentForClient(this.getAttribute('data-client-name'));
        });
        item.querySelector('.edit-client').addEventListener('click', function() {
            const clientName = this.getAttribute('data-client-name');
            const clientToEdit = clients.find(client => client.name === clientName);
            if (clientToEdit) {
                document.getElementById('new-client-name').value = clientToEdit.name;
                document.getElementById('new-client-address').value = clientToEdit.address || '';
                document.getElementById('new-client-phone').value = clientToEdit.phone || '';
                editingClientName = clientToEdit.name;
                showNotification('تم تهيئة العميل للتعديل');
            }
        });
        clientList.appendChild(item);
    });
}

async function deleteSingleClient(clientName) {
    const password = prompt('يرجى إدخال كلمة المرور لحذف العميل وجميع فواتيره ودفعاته:');
    if (password !== DELETE_PASSWORD) {
        showNotification('كلمة المرور غير صحيحة', 'error');
        return;
    }
    const clientToDelete = clients.find(client => client.name === clientName);
    clients = clients.filter(client => client.name !== clientName);
    localStorage.setItem('clients', JSON.stringify(clients));
    invoices = invoices.filter(invoice => invoice.client && invoice.client.name !== clientName);
    localStorage.setItem('invoices', JSON.stringify(invoices));
    purchaseHistory = purchaseHistory.filter(purchase => purchase.clientName !== clientName);
    localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));
    loadClientsList();
    loadInvoicesHistory();
    loadPurchaseHistory();
    if (currentViewingClient === clientName) {
        document.getElementById('client-invoices-section').style.display = 'none';
        currentViewingClient = null;
    }
    try {
        const cloudResult = await sendToCloud({ action: 'deleteClient', clientName: clientName, clientId: clientToDelete ? clientToDelete.id : '' });
        if (cloudResult) await fetchCloudData();
        showNotification(`تم حذف العميل ${clientName} وجميع فواتيره ودفعاته بنجاح`);
    } catch (err) {
        console.error('فشل حذف العميل من السحابة:', err);
        showNotification('تم الحذف محليًا لكن لم يتم حذف السجل من السحابة', 'error');
    }
    updateDashboard();
}

function viewClientInvoices(clientName) {
    currentViewingClient = clientName;
    const clientInvoicesSection = document.getElementById('client-invoices-section');
    const clientInvoices = document.getElementById('client-invoices');
    const clientPayments = document.getElementById('client-payments');
    clientInvoicesSection.style.display = 'block';
    document.getElementById('current-client-name').textContent = clientName; // This is inside "طلبات العميل" so it's fine
    const client = clients.find(c => c.name === clientName);
    if (client) {
        document.getElementById('current-client-balance').textContent = (client.balance || 0).toFixed(2);
        const clientInvoicesList = invoices.filter(invoice => invoice.client.name === clientName);
        const totalPurchases = clientInvoicesList.reduce((sum, invoice) => sum + invoice.grandTotal, 0);
        document.getElementById('total-client-purchases').textContent = totalPurchases.toFixed(2);
        const totalPayments = (client.payments || []).reduce((sum, payment) => sum + payment.amount, 0);
        document.getElementById('total-client-payments').textContent = totalPayments.toFixed(2);
        displayClientPayments(client);
    }
    const clientInvoicesList = invoices.filter(invoice => invoice.client.name === clientName);
    clientInvoices.innerHTML = '';
    if (clientInvoicesList.length === 0) {
        clientInvoices.innerHTML = '<p>لا توجد طلبات بيع لهذا العميل</p>';
    } else {
        clientInvoicesList.forEach(invoice => {
            const invoiceDiv = document.createElement('div');
            invoiceDiv.className = 'invoice-item';
            let productsHTML = '';
            invoice.products.forEach(product => {
                const thicknessText = product.thickness ? ` (${product.thickness} مم)` : '';
                productsHTML += `<div style="margin: 5px 0; padding: 5px; background: #f8f9fa; border-radius: 4px;">${product.productName}${thicknessText} - ${product.quantity} × ${product.price.toFixed(2)} = ${product.total.toFixed(2)} دينار</div>`;
            });
            let paymentHTML = '';
            if (invoice.payment.type === 'multiple') {
                paymentHTML = `<div><strong>طرق الدفع:</strong></div>${invoice.payment.payments.map(payment => {
                    let checkInfo = '';
                    if (payment.method === 'check' && payment.checkDetails) {
                        checkInfo = `<br>رقم الشيك: ${payment.checkDetails.checkNumber} - تاريخ الصرف: ${payment.checkDetails.checkDate}`;
                        if (payment.checkDetails.checkImage) checkInfo += `<br><img src="${payment.checkDetails.checkImage}" style="max-width:100px; max-height:100px;">`;
                    }
                    return `<div style="margin-right: 20px;">${getPaymentMethodText(payment.method)}: ${payment.amount.toFixed(2)} دينار ${checkInfo}</div>`;
                }).join('')}`;
            } else {
                paymentHTML = `<div><strong>طريقة الدفع:</strong> ${getPaymentMethodText(invoice.payment.method)}</div><div>المبلغ المدفوع: ${invoice.payment.paidAmount.toFixed(2)} دينار</div>`;
                if (invoice.payment.method === 'check' && invoice.payment.checkDetails) {
                    paymentHTML += `<div>رقم الشيك: ${invoice.payment.checkDetails.checkNumber}</div><div>تاريخ الصرف: ${invoice.payment.checkDetails.checkDate}</div>`;
                    if (invoice.payment.checkDetails.checkImage) paymentHTML += `<div><img src="${invoice.payment.checkDetails.checkImage}" style="max-width:100px; max-height:100px;"></div>`;
                }
            }
            invoiceDiv.innerHTML = `
                <div class="invoice-header-small"><div><strong>${invoice.id}</strong></div><div>${new Date(invoice.date).toLocaleDateString('ar-EG')}</div></div>
                <div><strong>المنتجات المشتراة:</strong></div>${productsHTML}
                <div class="total-section"><div>المجموع الكلي: ${invoice.grandTotal.toFixed(2)} دينار</div>${paymentHTML}<div>المبلغ المتبقي: ${invoice.payment.remainingBalance.toFixed(2)} دينار</div><div>الحالة: ${invoice.status}</div></div>
                <button class="btn btn-secondary edit-invoice" data-invoice-id="${invoice.id}"><i class="fas fa-edit"></i> تعديل الطلب</button>
            `;
            invoiceDiv.querySelector('.edit-invoice').addEventListener('click', function() {
                editInvoice(invoice.id);
            });
            clientInvoices.appendChild(invoiceDiv);
        });
    }
}

function viewFinancialLedger(clientName) {
    const client = clients.find(c => c.name === clientName);
    if (!client) {
        showNotification('لم يتم العثور على العميل', 'error');
        return;
    }
    const clientInvoices = invoices.filter(inv => inv.client.name === clientName);
    const clientPayments = client.payments || [];
    const clientAdjustments = client.adjustments || [];
    let transactions = [];
    clientInvoices.forEach(inv => {
        transactions.push({ date: new Date(inv.date), type: 'invoice', description: `طلب بيع رقم: ${inv.id}`, debit: inv.grandTotal, credit: 0 });
    });
    clientPayments.forEach(p => {
        transactions.push({ date: new Date(p.date), type: 'payment', description: `دفعة (${getPaymentMethodText(p.method)})`, debit: 0, credit: p.amount });
        transactions.push({ date: new Date(p.date), type: 'payment', description: `دفعة (${getPaymentMethodText(p.method)})`, debit: 0, credit: p.amount, id: p.id });
    });
    // التصحيح: إزالة التكرار وإضافة id بشكل صحيح
    clientAdjustments.forEach((adj, index) => {
        if (!adj.id) adj.id = `adj_legacy_${index}`;
        transactions.push({
            date: new Date(adj.date),
            type: 'adjustment',
            description: `تسوية يدوية: ${adj.reason}`,
            debit: adj.amount > 0 ? adj.amount : 0,
            credit: adj.amount < 0 ? -adj.amount : 0,
            id: adj.id
        });
    });
    transactions.sort((a, b) => a.date - b.date);
    let runningBalance = 0;
    let ledgerHtml = `<table style="width:100%; border-collapse: collapse; font-size: 14px;"><thead><tr style="background-color: #f2f2f2;"><th style="padding: 8px; border: 1px solid #ddd;">التاريخ</th><th style="padding: 8px; border: 1px solid #ddd;">البيان</th><th style="padding: 8px; border: 1px solid #ddd;">مدين</th><th style="padding: 8px; border: 1px solid #ddd;">دائن</th><th style="padding: 8px; border: 1px solid #ddd;">الرصيد</th><th style="padding: 8px; border: 1px solid #ddd;" class="no-print">إجراءات</th></tr></thead><tbody>`;
    transactions.forEach(t => {
        runningBalance += t.debit - t.credit;
        let actionsHtml = '-';
        if (t.type === 'adjustment') {
            actionsHtml = `
                <button class="btn btn-secondary" style="padding: 2px 6px; font-size: 10px;" onclick="editLedgerAdjustment('${escapeHtml(clientName)}', '${t.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger" style="padding: 2px 6px; font-size: 10px;" onclick="deleteLedgerAdjustment('${escapeHtml(clientName)}', '${t.id}')"><i class="fas fa-trash"></i></button>
            `;
        }
        ledgerHtml += `<tr><td style="padding: 8px; border: 1px solid #ddd; text-align:center;">${t.date.toLocaleDateString('ar-EG')}</td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(t.description)}</td><td style="padding: 8px; border: 1px solid #ddd; color: #c0392b; text-align:center;">${t.debit > 0 ? t.debit.toFixed(2) : ''}</td><td style="padding: 8px; border: 1px solid #ddd; color: #27ae60; text-align:center;">${t.credit > 0 ? t.credit.toFixed(2) : ''}</td><td style="padding: 8px; border: 1px solid #ddd; text-align:center;">${runningBalance.toFixed(2)}</td><td style="padding: 8px; border: 1px solid #ddd; text-align:center;" class="no-print">${actionsHtml}</td></tr>`;
    });
    ledgerHtml += `</tbody></table>`;
    const finalBalance = runningBalance;
    document.getElementById('ledger-client-name').innerHTML = `
        السجل المالي للعميل: <strong>${escapeHtml(clientName)}</strong>
        <div style="font-size: 16px; margin-top: 10px;">
            الرصيد النهائي المحسوب: <strong class="${finalBalance > 0 ? 'balance-negative' : 'balance-positive'}">${finalBalance.toFixed(2)} دينار</strong>
            ${finalBalance > 0 ? ' (مدين)' : finalBalance < 0 ? ' (دائن)' : ''}
        </div>
        <div style="font-size: 12px; color: #777;">(الرصيد المسجل: ${client.balance.toFixed(2)})</div>
    `;
    document.getElementById('ledger-content').innerHTML = ledgerHtml;
    document.getElementById('ledgerModal').style.display = 'flex';
}

function showAddPaymentForClient(clientName) {
    currentViewingClient = clientName; // Set the client for the payment
    const modal = document.getElementById('paymentModal');
    const title = document.getElementById('payment-modal-title');
    title.innerHTML = `إضافة دفعة للعميل: <strong>${escapeHtml(clientName)}</strong>`;
    
    // Reset form fields
    document.getElementById('client-payment-amount-input').value = '0.00';
    document.getElementById('payment-method-select').value = 'cash';
    document.getElementById('client-payment-check-fields').style.display = 'none';
    document.getElementById('client-check-number').value = '';
    document.getElementById('client-check-date').value = '';
    document.getElementById('client-check-image').value = '';
    const preview = document.getElementById('client-check-preview');
    preview.src = '';
    preview.style.display = 'none';

    modal.style.display = 'flex';
}

function viewMonthlyStatement(clientName) {
    const client = clients.find(c => c.name === clientName);
    if (!client) {
        showNotification('لم يتم العثور على العميل', 'error');
        return;
    }
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const monthlyInvoices = invoices.filter(inv => {
        const invoiceDate = new Date(inv.date);
        return inv.client.name === clientName && invoiceDate >= threeMonthsAgo;
    });
    let statementHtml = '<h4>المبيعات خلال آخر 3 أشهر</h4>';
    if (monthlyInvoices.length === 0) {
        statementHtml += '<p>لا توجد مشتريات لهذا العميل في آخر 3 أشهر.</p>';
    } else {
        statementHtml += `<table style="width:100%; border-collapse: collapse; font-size: 14px;"><thead><tr style="background-color: #f2f2f2;"><th style="padding: 8px; border: 1px solid #ddd;">تاريخ الفاتورة</th><th style="padding: 8px; border: 1px solid #ddd;">رقم الفاتورة</th><th style="padding: 8px; border: 1px solid #ddd;">المنتجات</th><th style="padding: 8px; border: 1px solid #ddd;">المجموع</th></tr></thead><tbody>`;
        monthlyInvoices.sort((a, b) => new Date(b.date) - new Date(a.date));
        monthlyInvoices.forEach(inv => {
            const productsDetails = inv.products.map(p => `<div>${escapeHtml(p.productName)} (الكمية: ${p.quantity}, السعر: ${p.price.toFixed(2)})</div>`).join('');
            statementHtml += `<tr><td style="padding: 8px; border: 1px solid #ddd; text-align:center;">${new Date(inv.date).toLocaleDateString('ar-EG')}</td><td style="padding: 8px; border: 1px solid #ddd; text-align:center;">${escapeHtml(inv.id)}</td><td style="padding: 8px; border: 1px solid #ddd;">${productsDetails}</td><td style="padding: 8px; border: 1px solid #ddd; text-align:center;">${inv.grandTotal.toFixed(2)}</td></tr>`;
        });
        statementHtml += `</tbody></table>`;
    }
    const finalBalance = client.balance || 0;
    document.getElementById('ledger-client-name').innerHTML = `
        كشف حساب شهري للعميل: <strong>${escapeHtml(clientName)}</strong>
        <div style="font-size: 16px; margin-top: 10px;">
            الرصيد الإجمالي المتبقي: <strong class="${finalBalance > 0 ? 'balance-negative' : 'balance-positive'}">${finalBalance.toFixed(2)} دينار</strong>
            ${finalBalance > 0 ? ' (مدين)' : finalBalance < 0 ? ' (دائن)' : ''}
        </div>
    `;
    document.getElementById('ledger-content').innerHTML = statementHtml;
    document.getElementById('ledgerModal').style.display = 'flex';
}

function displayClientPayments(client) {
    const clientPayments = document.getElementById('client-payments');
    clientPayments.innerHTML = '';
    if (!client.payments || client.payments.length === 0) {
        clientPayments.innerHTML = '<p>لا توجد دفعات مسجلة</p>';
        return;
    }
    client.payments.forEach(payment => {
        const paymentDiv = document.createElement('div');
        paymentDiv.className = 'invoice-item';
        let checkInfoHTML = '';
        if (payment.method === 'check' && payment.checkDetails) {
            checkInfoHTML += `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">`;
            checkInfoHTML += `<div><strong>رقم الشيك:</strong> ${payment.checkDetails.checkNumber || 'غير محدد'}</div>`;
            checkInfoHTML += `<div><strong>تاريخ الصرف:</strong> ${payment.checkDetails.checkDate || 'غير محدد'}</div>`;
            if (payment.checkDetails.checkImage && payment.checkDetails.checkImage.startsWith('data:image')) {
                checkInfoHTML += `<div><img src="${payment.checkDetails.checkImage}" style="max-width:100px; max-height:100px; margin-top:5px; border-radius:4px; border: 1px solid #ddd;"></div>`;
            }
            checkInfoHTML += `</div>`;
        }
        paymentDiv.innerHTML = `
            <div class="invoice-header-small"><strong>${new Date(payment.date).toLocaleDateString('ar-EG')}</strong></div>
            <div><strong>المبلغ:</strong> ${payment.amount.toFixed(2)} دينار</div>
            <div><strong>طريقة الدفع:</strong> ${getPaymentMethodText(payment.method)}</div>
            ${checkInfoHTML}
        `;
        clientPayments.appendChild(paymentDiv);
    });
}

async function addPayment() {
    const amount = parseFloat(document.getElementById('client-payment-amount-input').value) || 0;
    const method = document.getElementById('payment-method-select').value;
    if (amount <= 0) {
        showNotification('يرجى إدخال مبلغ صحيح', 'error');
        return;
    }
    if (!currentViewingClient) {
        showNotification('لم يتم تحديد عميل', 'error');
        return;
    }
    const clientIndex = clients.findIndex(c => c.name === currentViewingClient);
    if (clientIndex === -1) {
        showNotification('لم يتم العثور على العميل', 'error');
        return;
    }
    const client = clients[clientIndex];
    let checkDetails = null;
    if (method === 'check') {
        const checkNumber = document.getElementById('client-check-number').value;
        const checkDate = document.getElementById('client-check-date').value;
        const checkImagePreview = document.getElementById('client-check-preview');
        const checkImage = checkImagePreview.style.display !== 'none' ? checkImagePreview.src : '';
        checkDetails = { checkNumber, checkDate, checkImage };
    }
    const payment = { id: Date.now().toString(), date: new Date().toISOString(), amount: amount, method: method, checkDetails: checkDetails };
    if (!client.payments) client.payments = [];
    client.payments.push(payment);
    client.balance = (client.balance || 0) - amount;
    localStorage.setItem('clients', JSON.stringify(clients));
    try {
        await sendToCloud({ action: 'saveClient', client: client });
        showNotification('تم إضافة الدفعة ومزامنتها بنجاح');
        lastAddedPaymentInfo = { clientName: currentViewingClient, payment: payment };
        document.getElementById('receiptOptionsModal').style.display = 'flex';
    } catch (err) {
        console.error('فشل مزامنة الدفعة:', err);
        showNotification('تم حفظ الدفعة محلياً، لكن فشلت المزامنة السحابية', 'error');
    }
    // Close modal
    document.getElementById('paymentModal').style.display = 'none';
    // Refresh the client list to show the new balance
    loadClientsList();
    // If the detailed view for this client is open, refresh it too
    if (document.getElementById('client-invoices-section').style.display === 'block' && document.getElementById('current-client-name').textContent === currentViewingClient) {
        viewClientInvoices(currentViewingClient);
    }
    document.getElementById('client-payment-amount-input').value = '0.00';
    document.getElementById('client-payment-check-fields').style.display = 'none';
    document.getElementById('client-check-number').value = '';
    document.getElementById('client-check-date').value = '';
    document.getElementById('client-check-image').value = '';
    document.getElementById('client-check-preview').style.display = 'none';
}

function filterClients(searchTerm) {
    const clientItems = document.querySelectorAll('.client-item');
    clientItems.forEach(item => {
        const clientName = item.querySelector('strong').textContent;
        item.style.display = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ? 'block' : 'none';
    });
}

function getPaymentMethodText(method) {
    const map = { 'cash': 'كاش', 'check': 'شيكات', 'exchange': 'تبديل بضائع', 'bank': 'تحويل بنكي', 'receivable': 'ذمم', 'manual': 'تسوية يدوية' };
    return map[method] || method;
}

/**
 * Converts a number to its Arabic text representation.
 * @param {number} number The number to convert.
 * @returns {string} The Arabic text representation.
 */
function numberToArabicWords(number) {
    const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
    const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const hundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
    const thousands = ['', 'ألف', 'ألفان', 'آلاف', 'آلاف'];

    let num = Math.floor(number);
    let remainder = Math.round((number - num) * 100);

    if (num === 0) {
        return 'صفر';
    }

    let words = [];

    function convertLessThanOneThousand(n) {
        let tempWords = [];
        if (n >= 100) {
            tempWords.push(hundreds[Math.floor(n / 100)]);
            n %= 100;
        }
        if (n > 0) {
            if (tempWords.length > 0) tempWords.push('و');
            if (n >= 10 && n < 20) {
                tempWords.push(teens[n - 10]);
            } else {
                if (n >= 20) {
                    tempWords.push(tens[Math.floor(n / 10)]);
                    if (n % 10 > 0) tempWords.push('و');
                    n %= 10;
                }
                if (n > 0) {
                    tempWords.push(ones[n]);
                }
            }
        }
        return tempWords.join(' ');
    }

    if (num >= 1000) {
        const thousandPart = Math.floor(num / 1000);
        if (thousandPart === 1) words.push(thousands[1]);
        else if (thousandPart === 2) words.push(thousands[2]);
        else if (thousandPart >= 3 && thousandPart <= 10) words.push(convertLessThanOneThousand(thousandPart) + ' ' + thousands[3]);
        else words.push(convertLessThanOneThousand(thousandPart) + ' ' + thousands[1]);
        num %= 1000;
    }

    if (num > 0) {
        if (words.length > 0) words.push('و');
        words.push(convertLessThanOneThousand(num));
    }

    let result = words.join(' ');
    result += ' دينار' + (remainder > 0 ? ` و ${convertLessThanOneThousand(remainder)} قرشاً` : '') + ' فقط لا غير';

    return result.replace(/\s+/g, ' ').trim();
}

// =========================================
// دوال سجل الفواتير
// =========================================
function searchInvoicesHistory() {
    const searchTerm = document.getElementById('history-client-search').value;
    if (!searchTerm) { loadInvoicesHistory(); return; }
    const filteredInvoices = invoices.filter(invoice => invoice.client.name.toLowerCase().includes(searchTerm.toLowerCase()));
    displayInvoicesHistory(filteredInvoices);
}

function loadInvoicesHistory() {
    displayInvoicesHistory(invoices);
}

function displayInvoicesHistory(invoicesList) {
    const invoicesHistory = document.getElementById('invoices-history');
    invoicesHistory.innerHTML = '';
    if (invoicesList.length === 0) {
        invoicesHistory.innerHTML = '<p>لا توجد طلبات بيع مسجلة</p>';
        return;
    }
    invoicesList.sort((a, b) => new Date(b.date) - new Date(a.date));
    invoicesList.forEach(invoice => {
        const invoiceDiv = document.createElement('div');
        invoiceDiv.className = 'invoice-item';
        let productsHTML = '';
        invoice.products.forEach(product => {
            const thicknessText = product.thickness ? ` (${product.thickness} مم)` : '';
            productsHTML += `<div style="margin: 5px 0; padding: 5px; background: #f8f9fa; border-radius: 4px;">${product.productName}${thicknessText} - ${product.quantity} × ${product.price.toFixed(2)} = ${product.total.toFixed(2)} دينار</div>`;
        });
        let paymentDetails = '';
        if (invoice.payment.type === 'multiple') {
            paymentDetails = '<div><strong>طرق الدفع:</strong></div>';
            invoice.payment.payments.forEach(p => {
                paymentDetails += `<div style="margin-right:20px;">${getPaymentMethodText(p.method)}: ${p.amount.toFixed(2)} دينار`;
                if (p.method === 'check' && p.checkDetails) {
                    paymentDetails += `<br> رقم الشيك: ${p.checkDetails.checkNumber || ''} - تاريخ الصرف: ${p.checkDetails.checkDate || ''}`;
                    if (p.checkDetails.checkImage) paymentDetails += ` <br> <img src="${p.checkDetails.checkImage}" style="max-width:100px; max-height:100px;" class="check-image-print">`;
                }
                paymentDetails += '</div>';
            });
        } else {
            paymentDetails = `<div><strong>طريقة الدفع:</strong> ${getPaymentMethodText(invoice.payment.method)} - المبلغ المدفوع: ${invoice.payment.paidAmount.toFixed(2)} دينار`;
            if (invoice.payment.method === 'check' && invoice.payment.checkDetails) {
                paymentDetails += `<br> رقم الشيك: ${invoice.payment.checkDetails.checkNumber || ''} - تاريخ الصرف: ${invoice.payment.checkDetails.checkDate || ''}`;
                if (invoice.payment.checkDetails.checkImage) paymentDetails += `<br> <img src="${invoice.payment.checkDetails.checkImage}" style="max-width:100px; max-height:100px;" class="check-image-print">`;
            }
            paymentDetails += '</div>';
        }
        invoiceDiv.innerHTML = `
            <div class="invoice-header-small"><div><strong>${invoice.id}</strong></div><div>${new Date(invoice.date).toLocaleDateString('ar-EG')}</div></div>
            <div><strong>العميل:</strong> ${invoice.client.name}</div>
            <div><strong>المنتجات المشتراة:</strong></div>${productsHTML}
            <div class="total-section"><div>المجموع الكلي: ${invoice.grandTotal.toFixed(2)} دينار</div>${paymentDetails}<div>المبلغ المتبقي: ${invoice.payment.remainingBalance.toFixed(2)} دينار</div><div>الحالة: ${invoice.status}</div></div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
                <button class="btn btn-success print-invoice-history" data-invoice-id="${invoice.id}"><i class="fas fa-print"></i> طباعة الطلب</button>
                <button class="btn btn-secondary edit-invoice" data-invoice-id="${invoice.id}"><i class="fas fa-edit"></i> تعديل الطلب</button>
                <button class="btn export-pdf" data-invoice-id="${invoice.id}" style="background: linear-gradient(to bottom, #e74c3c, #c0392b);"><i class="fas fa-file-pdf"></i> تصدير PDF</button>
                <button class="btn btn-danger delete-invoice" data-invoice-id="${invoice.id}"><i class="fas fa-trash"></i> حذف الطلب</button>
            </div>
        `;
        invoiceDiv.querySelector('.print-invoice-history').addEventListener('click', function() {
            printInvoiceRecord(invoice);
        });
        invoiceDiv.querySelector('.edit-invoice').addEventListener('click', function() {
            editInvoice(invoice.id);
        });
        invoiceDiv.querySelector('.export-pdf').addEventListener('click', function() {
            exportInvoiceAsPDF(invoice.id);
        });
        invoiceDiv.querySelector('.delete-invoice').addEventListener('click', function() {
            deleteInvoice(invoice.id);
        });
        invoicesHistory.appendChild(invoiceDiv);
    });
}

function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getPrintStyles() {
    return `
        @page { size: A4; margin: 10mm; }
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; padding: 0; color: #333; background: #f0f2f5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .print-page { width: 100%; max-width: 210mm; min-height: 280mm; padding: 10mm; margin: 10px auto; box-sizing: border-box; background: #fff; position: relative; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.07; z-index: 1; pointer-events: none; width: 60%; }
        .header { display: flex; justify-content: center; align-items: center; gap: 20px; border-bottom: 2px solid #888; padding-bottom: 15px; margin-bottom: 10px; }
        .header-text { text-align: center; flex-grow: 1; }
        .header-info { text-align: right; }
        .header h1 { margin: 0; font-size: 22pt; color: #2c3e50; font-weight: bold; }
        .header h2 { margin: 5px 0 0; font-size: 13pt; color: #555; }
        .document-title { text-align: center; margin: 30px 0 25px 0; }
        .document-title h3 { font-size: 18pt; font-weight: bold; color: #34495e; display: inline-block; padding-bottom: 5px; border-bottom: 1px solid #ccc; margin: 0; }
        .card { border: 1px solid #eee; border-radius: 8px; padding: 15px; margin: 15px 0; page-break-inside: avoid; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 10pt; }
        .info-grid .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dotted #ddd; }
        .info-grid .row:last-child { border-bottom: none; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9pt; }
        th, td { border: 1px solid #ccc; padding: 7px; text-align: right; }
        th { background: #f2f2f2; color: #333; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .totals-table .label { text-align: right; font-weight: bold; }
        .totals-table .value { text-align: left; }
        .report-summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; page-break-inside: avoid; }
        .summary-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; text-align: center; background-color: #f9f9f9; }
        .summary-card h4 { margin: 0 0 10px 0; font-size: 11pt; color: #333; font-weight: bold; }
        .summary-card .value { font-size: 14pt; font-weight: bold; color: #3498db; }
        .summary-card .sub-value { font-size: 9pt; color: #777; margin-top: 5px; }
        .grand-total-row { font-weight: bold; font-size: 11pt; background-color: #e9ecef; }
        .signature-section { display: flex; justify-content: space-around; margin-top: 60px; padding-top: 20px; page-break-inside: avoid; }
        .signature-box { text-align: center; font-size: 11pt; color: #555; }
        .signature-line { border-top: 1px solid #888; width: 200px; margin-top: 40px; }
        .print-footer { margin-top: 20px; font-size: 9pt; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px; page-break-before: auto; }
        
        /* Modern Invoice Styles */
        .modern-invoice {
            font-size: 10pt;
            color: #333;
        }
        .modern-invoice .header {
            background: #f8f9fa;
            color: #2c3e50;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
            border-bottom: 5px solid #3498db;
        }
        .modern-invoice .header h1, .modern-invoice .header h2 {
            color: #2c3e50;
            margin: 0;
        }
        .modern-invoice .header h1 {
            font-size: 20pt;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .modern-invoice .header .document-title-print {
            font-size: 16pt;
            font-weight: bold;
            color: #3498db;
        }
        
        .modern-invoice .factory-details, .modern-invoice .factory-ids {
            font-size: 10pt;
            color: #555;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .modern-invoice .factory-details span, .modern-invoice .factory-ids span {
            display: block;
        }

        .modern-invoice .invoice-meta {
            display: flex;
            justify-content: space-between;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #eee;
        }
        .modern-invoice .invoice-meta div { line-height: 1.8; }
        .modern-invoice .invoice-meta strong { color: #2c3e50; }
        
        .modern-invoice .document-title { display: none; }
        
        .modern-invoice table {
            border-collapse: separate;
            border-spacing: 0;
            margin-top: 0;
            font-size: 10pt;
        }
        .modern-invoice th, .modern-invoice td {
            border: none;
            padding: 12px 15px;
            text-align: right;
            border-bottom: 1px solid #eee;
        }
        .modern-invoice th {
            background: #3498db;
            color: white;
            font-weight: bold;
        }
        .modern-invoice th:first-child { border-radius: 0 5px 5px 0; }
        .modern-invoice th:last-child { border-radius: 5px 0 0 5px; }
        
        .modern-invoice .invoice-body { display: flex; gap: 20px; margin-top: 20px; page-break-inside: avoid; }
        .modern-invoice .invoice-main { flex-grow: 1; }
        .modern-invoice .invoice-aside { width: 250px; flex-shrink: 0; }
        .modern-invoice .totals-card { background: #f8f9fa; border-radius: 8px; padding: 20px; border: 1px solid #eee; }
        .modern-invoice .totals-card h3 { margin-top: 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .modern-invoice .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 10pt; }
        .modern-invoice .totals-row.grand-total { font-size: 14pt; font-weight: bold; color: #3498db; border-top: 2px solid #3498db; margin-top: 10px; padding-top: 10px; }
        .modern-invoice .totals-row.balance { font-size: 12pt; font-weight: bold; color: #c0392b; background: #fff3cd; padding: 10px; border-radius: 5px; margin-top: 5px; }
        .modern-invoice .signature-section { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
        .modern-invoice .print-footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 9pt;
            color: #777;
        }
        .modern-invoice .print-footer p { margin: 5px 0; }

        @media print { body { background: #fff; } .print-page { padding: 0; margin: 0; box-shadow: none; min-height: 0; } }
    `;
}

function buildOfficialHeader(documentTitle) {
    // For sales orders, the title is handled inside buildInvoicePrintBody
    if (documentTitle.trim() === 'طلب بيع') {
        return `
        <div class="header">
            <h1>${FACTORY_NAME}</h1>
            <div class="factory-details" style="margin-bottom: 0;">
                <span>${FACTORY_ADDRESS}</span>
                <span>الهاتف: ${FACTORY_PHONE}</span>
            </div>
        </div>
        `;
    }
    // For other reports, keep the title in the main header
    return `
    <div class="header">
        <h1>${FACTORY_NAME}</h1>
        <div class="factory-details">
            <span>${FACTORY_ADDRESS}</span>
            <span>الهاتف: ${FACTORY_PHONE}</span>
        </div>
        <h2 class="document-title-print">${escapeHtml(documentTitle)}</h2>
    </div>
    `;
}

function openProfessionalPrintWindow(title, bodyHtml) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showNotification('لم يتم فتح نافذة الطباعة', 'error');
        return null;
    }
    printWindow.document.write(`
        <html dir="rtl">
        <head><title>${escapeHtml(title)}</title>
        <style>
            ${getPrintStyles()}
        </style>
        </head>
        <body>${bodyHtml}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    return printWindow;
}

function buildInvoicePrintBody(invoice) {
    const productsRows = (invoice.products || []).map(product => {
        return `<tr>
            <td>${escapeHtml(product.productName || '')}</td>
            <td style="text-align:center;">${(product.quantity || 0).toFixed(2)}</td>
            <td style="text-align:center;">${(product.price || 0).toFixed(2)}</td>
            <td style="text-align:center;">${(product.total || 0).toFixed(2)}</td>
        </tr>`;
    }).join('');

    let paymentContent = '';
    if (invoice.payment?.type === 'multiple') {
        paymentContent = (invoice.payment.payments || []).map(p => `
            <div class="totals-row">
                <span>${escapeHtml(getPaymentMethodText(p.method))}</span>
                <span>${(p.amount || 0).toFixed(2)} دينار</span>
            </div>
        `).join('');
    } else {
        paymentContent = `
            <div class="totals-row">
                <span>طريقة الدفع</span>
                <span>${escapeHtml(getPaymentMethodText(invoice.payment?.method || ''))}</span>
            </div>
            <div class="totals-row">
                <span>المبلغ المدفوع</span>
                <span>${(invoice.payment?.paidAmount || 0).toFixed(2)} دينار</span>
            </div>
        `;
    }

    return `
    <div class="print-page modern-invoice">
        ${buildOfficialHeader('طلب بيع')}

        <div class="invoice-meta">
            <div>
                <strong>إلى:</strong> ${escapeHtml(invoice.client?.name || '')}<br>
                <strong>العنوان:</strong> ${escapeHtml(invoice.client?.address || 'غير محدد')}<br>
                <strong>الهاتف:</strong> ${escapeHtml(invoice.client?.phone || 'غير محدد')}
            </div>
            <div style="text-align: left;">
                <h3 class="document-title-print">طلب بيع</h3>
                <strong>رقم الطلب:</strong> ${escapeHtml(invoice.id || 'طلب جديد')}<br>
                <strong>تاريخ الفاتورة:</strong> ${escapeHtml(new Date(invoice.date).toLocaleDateString('ar-EG'))}<br>
                <strong>الحالة:</strong> ${escapeHtml(invoice.status)}
            </div>
        </div>

        <div class="invoice-body">
            <div class="invoice-main">
                <table><thead><tr><th style="width:40%;">المنتج</th><th style="text-align:center;">الكمية</th><th style="text-align:center;">السعر</th><th style="text-align:center;">المجموع</th></tr></thead><tbody>${productsRows}</tbody></table>
            </div>
            <div class="invoice-aside">
                <div class="totals-card">
                    <h3>ملخص الطلب</h3>
                    <div class="totals-row"><span>المجموع الفرعي</span><span>${(invoice.subtotal || 0).toFixed(2)} دينار</span></div>
                    <div class="totals-row"><span>الخصم</span><span>${(invoice.totalDiscount || 0).toFixed(2)} دينار</span></div>
                    <div class="totals-row grand-total"><span>المجموع الكلي</span><span>${(invoice.grandTotal || 0).toFixed(2)} دينار</span></div>
                    ${paymentContent}
                    <div class="totals-row balance"><span>المبلغ المتبقي</span><span>${(invoice.payment?.remainingBalance || 0).toFixed(2)} دينار</span></div>
                </div>
            </div>
        </div>
        
        <div class="signature-section"><div class="signature-box">توقيع المستلم<div class="signature-line"></div></div><div class="signature-box">توقيع الإدارة<div class="signature-line"></div></div></div>
        
        <div class="print-footer">
            <p>نشكر لكم ثقتكم بنا ونتطلع لخدمتكم مرة أخرى.</p>
            <p>هذا المستند صدر من نظام إدارة المصنع | تاريخ الطباعة: ${new Date().toLocaleString('ar-EG')}</p>
        </div>
    </div>`;
}

function printInvoiceRecord(invoice) {
    const bodyHtml = buildInvoicePrintBody(invoice);
    openProfessionalPrintWindow(`طلب بيع ${invoice.id}`, bodyHtml);
}

// =========================================
// دوال عروض الأسعار
// =========================================

function setupQuoteTab() {
    resetQuoteForm();
}

function resetQuoteForm() {
    document.getElementById('quote-products-body').innerHTML = '';
    document.getElementById('quote-client-name').value = '';
    document.getElementById('quote-client-address').value = '';
    document.getElementById('quote-client-phone').value = '';
    document.getElementById('quote-subtotal').textContent = '0.00';
    document.getElementById('quote-total-discount').textContent = '0.00';
    document.getElementById('quote-grand-total').textContent = '0.00';
    quoteProductCount = 0;
    addQuoteProductRow();
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    document.getElementById('quote-date-input').value = `${year}-${month}-${day}`;
    updateQuoteDatesFromInput();
}

function updateQuoteDatesFromInput() {
    const dateInput = document.getElementById('quote-date-input').value;
    const quoteNumberSpan = document.getElementById('quote-number');
    const date = dateInput ? new Date(dateInput + 'T12:00:00') : new Date();
    
    document.getElementById('quote-date').textContent = date.toLocaleDateString('en-US');
    document.getElementById('quote-hijri-date').textContent = getHijriDateFromDate(date);
    quoteNumberSpan.textContent = `Q-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(Date.now()).slice(-4)}`;
}

function addQuoteProductRow() {
    quoteProductCount++;
    const tbody = document.getElementById('quote-products-body');
    const row = document.createElement('tr');
    
    // This is a simplified version of addProductRow, without print-value spans as they are not needed for a simple quote tool
    row.innerHTML = `
        <td>${quoteProductCount}</td>
        <td><select class="product-name"></select></td>
        <td><input type="number" class="thickness" value="0" min="0" step="0.1"></td>
        <td><input type="number" class="quantity" value="1" min="1"></td>
        <td><input type="number" class="price" value="0.00" min="0" step="0.01"></td>
        <td><input type="number" class="discount" value="0" min="0" max="100"></td>
        <td class="total">0.00</td>
        <td class="no-print"><button class="btn btn-danger remove-product"><i class="fas fa-trash"></i></button></td>
    `;

    const select = row.querySelector('.product-name');
    let options = '<option value="">اختر منتج</option>';
    products.sort((a, b) => a.name.localeCompare(b.name, 'ar')).forEach(product => {
        const widthText = product.width ? ` (${product.width} سم)` : '';
        options += `<option value="${escapeHtml(product.name)}">${escapeHtml(product.name)}${widthText}</option>`;
    });
    options += '<option value="--add-new--" style="font-weight:bold; background-color:#e8f5e9;">+ إضافة أو تعديل منتج...</option>';
    select.innerHTML = options;

    tbody.appendChild(row);

    const calculateAndRefresh = () => {
        const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
        const price = parseFloat(row.querySelector('.price').value) || 0;
        const discount = parseFloat(row.querySelector('.discount').value) || 0;
        const discountAmount = (price * discount) / 100;
        const priceAfterDiscount = price - discountAmount;
        const total = priceAfterDiscount * quantity;
        row.querySelector('.total').textContent = total.toFixed(2);
        calculateQuoteTotals();
    };

    row.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', calculateAndRefresh);
        input.addEventListener('focus', function() { this.select(); });
    });

    select.addEventListener('change', function() {
        if (this.value === '--add-new--') {
            openProductModal();
            this.value = '';
        }
    });

    row.querySelector('.remove-product').addEventListener('click', () => {
        row.remove();
        // Renumber rows
        quoteProductCount = 0;
        document.querySelectorAll('#quote-products-body tr').forEach(r => {
            quoteProductCount++;
            r.cells[0].textContent = quoteProductCount;
        });
        calculateQuoteTotals();
    });
}

function calculateQuoteTotals() {
    let subtotal = 0, totalDiscount = 0;
    document.querySelectorAll('#quote-products-body tr').forEach(row => {
        const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
        const price = parseFloat(row.querySelector('.price').value) || 0;
        const discount = parseFloat(row.querySelector('.discount').value) || 0;
        const rowSubtotal = price * quantity;
        const discountAmount = (rowSubtotal * discount) / 100;
        subtotal += rowSubtotal;
        totalDiscount += discountAmount;
    });
    const grandTotal = subtotal - totalDiscount;

    document.getElementById('quote-subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('quote-total-discount').textContent = totalDiscount.toFixed(2);
    document.getElementById('quote-grand-total').textContent = grandTotal.toFixed(2);
}

function getCurrentQuoteFromForm() {
    return {
        id: document.getElementById('quote-number').textContent,
        date: new Date(document.getElementById('quote-date-input').value + 'T12:00:00').toISOString(),
        client: {
            name: document.getElementById('quote-client-name').value || '',
            address: document.getElementById('quote-client-address').value || '',
            phone: document.getElementById('quote-client-phone').value || ''
        },
        products: Array.from(document.querySelectorAll('#quote-products-body tr')).map(row => ({
            productName: row.querySelector('.product-name')?.value || '',
            thickness: row.querySelector('.thickness')?.value || 0,
            quantity: parseFloat(row.querySelector('.quantity')?.value) || 0,
            price: parseFloat(row.querySelector('.price')?.value) || 0,
            total: parseFloat(row.querySelector('.total')?.textContent) || 0
        })).filter(item => item.productName),
        subtotal: parseFloat(document.getElementById('quote-subtotal').textContent) || 0,
        totalDiscount: parseFloat(document.getElementById('quote-total-discount').textContent) || 0,
        grandTotal: parseFloat(document.getElementById('quote-grand-total').textContent) || 0,
    };
}

function buildQuotePrintBody(quote) {
    const productsRows = (quote.products || []).map(product => `
        <tr>
            <td>${escapeHtml(product.productName || '')}</td>
            <td style="text-align:center;">${(product.quantity || 0).toFixed(2)}</td>
            <td style="text-align:center;">${(product.price || 0).toFixed(2)}</td>
            <td style="text-align:center;">${(product.total || 0).toFixed(2)}</td>
        </tr>`).join('');

    return `
    <div class="print-page modern-invoice">
        ${buildOfficialHeader('عرض سعر')}
        <div class="invoice-meta">
            <div>
                <strong>إلى:</strong> ${escapeHtml(quote.client?.name || '')}<br>
                <strong>العنوان:</strong> ${escapeHtml(quote.client?.address || 'غير محدد')}<br>
                <strong>الهاتف:</strong> ${escapeHtml(quote.client?.phone || 'غير محدد')}
            </div>
            <div style="text-align: left;">
                <h3 class="document-title-print">عرض سعر</h3>
                <strong>رقم العرض:</strong> ${escapeHtml(quote.id)}<br>
                <strong>تاريخ العرض:</strong> ${escapeHtml(new Date(quote.date).toLocaleDateString('ar-EG'))}<br>
            </div>
        </div>
        <div class="invoice-body">
            <div class="invoice-main">
                <table><thead><tr><th style="width:40%;">المنتج</th><th style="text-align:center;">الكمية</th><th style="text-align:center;">السعر</th><th style="text-align:center;">المجموع</th></tr></thead><tbody>${productsRows}</tbody></table>
            </div>
            <div class="invoice-aside">
                <div class="totals-card">
                    <h3>ملخص عرض السعر</h3>
                    <div class="totals-row"><span>المجموع الفرعي</span><span>${(quote.subtotal || 0).toFixed(2)} دينار</span></div>
                    <div class="totals-row"><span>الخصم</span><span>${(quote.totalDiscount || 0).toFixed(2)} دينار</span></div>
                    <div class="totals-row grand-total"><span>المجموع الكلي</span><span>${(quote.grandTotal || 0).toFixed(2)} دينار</span></div>
                </div>
            </div>
        </div>
        <div class="print-footer">
            <p>هذا عرض سعر صالح لمدة 7 أيام من تاريخه.</p>
            <p>هذا المستند صدر من نظام إدارة المصنع | تاريخ الطباعة: ${new Date().toLocaleString('ar-EG')}</p>
        </div>
    </div>`;
}

function printCurrentQuote() {
    const quote = getCurrentQuoteFromForm();
    if (!quote.client.name || quote.products.length === 0) {
        showNotification('يرجى تعبئة بيانات عرض السعر أولاً (العميل والمنتجات)', 'error');
        return;
    }
    const bodyHtml = buildQuotePrintBody(quote);
    openProfessionalPrintWindow(`عرض سعر ${quote.id}`, bodyHtml);
}

function exportQuoteAsPDF() {
    const quote = getCurrentQuoteFromForm();
    if (!quote.client.name || quote.products.length === 0) {
        showNotification('يرجى تعبئة بيانات عرض السعر أولاً (العميل والمنتجات)', 'error');
        return;
    }
    showNotification('جاري تجهيز ملف PDF...', 'success');
    const printContainer = document.createElement('div');
    printContainer.style.position = 'absolute';
    printContainer.style.left = '-9999px';
    document.body.appendChild(printContainer);
    const bodyHtml = buildQuotePrintBody(quote);
    printContainer.innerHTML = `<style>${getPrintStyles()}</style>${bodyHtml}`;
    const quoteElement = printContainer.querySelector('.print-page');
    html2canvas(quoteElement, { scale: 3, useCORS: true, logging: false }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const PDF_MARGIN = 15;
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const printableWidth = pdfWidth - (PDF_MARGIN * 2);
        const printableHeight = pdfHeight - (PDF_MARGIN * 2);
        const ratio = canvas.width / canvas.height;
        let imgWidth = printableWidth;
        let imgHeight = imgWidth / ratio;
        if (imgHeight > printableHeight) {
            imgHeight = printableHeight;
            imgWidth = imgHeight * ratio;
        }
        const xOffset = PDF_MARGIN + (printableWidth - imgWidth) / 2;
        const yOffset = PDF_MARGIN + (printableHeight - imgHeight) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
        pdf.save(`عرض-سعر-${quote.id}.pdf`);
        document.body.removeChild(printContainer);
        showNotification('تم تحميل عرض السعر كملف PDF بنجاح.');
    }).catch(err => {
        console.error("خطأ في إنشاء PDF:", err);
        showNotification('حدث خطأ أثناء إنشاء ملف PDF', 'error');
        document.body.removeChild(printContainer);
    });
}

function getCurrentInvoiceFromForm() {
    const invoiceId = editingInvoiceId || `INV-${new Date().toLocaleDateString('en-GB').replace(/\//g, '')}-${String(Date.now()).slice(-4)}`;
    const invoiceDate = document.getElementById('invoice-date-input').value;
    
    let paymentData;
    const grandTotal = parseFloat(document.getElementById('grand-total').textContent) || 0;
    const previousBalance = parseFloat(document.getElementById('previous-balance').textContent) || 0;
    const totalDue = grandTotal + previousBalance;

    if (document.getElementById('enable-multiple-payments').checked) {
        const payments = Array.from(document.querySelectorAll('.payment-row')).map(row => {
            const method = row.querySelector('.payment-method-select').value;
            const amount = parseFloat(row.querySelector('.payment-amount').value) || 0;
            const checkDetails = (method === 'check') ? {
                checkNumber: row.querySelector('.check-number')?.value || '',
                checkDate: row.querySelector('.check-date')?.value || '',
                checkImage: row.querySelector('.check-preview')?.src || ''
            } : null;
            return { method, amount, checkDetails };
        });
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        paymentData = { type: 'multiple', payments, paidAmount: totalPaid, remainingBalance: totalDue - totalPaid };
    } else {
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
        const paidAmount = parseFloat(document.getElementById('paid-amount').value) || 0;
        const checkDetails = (paymentMethod === 'check') ? {
            checkNumber: document.getElementById('check-number-single').value || '',
            checkDate: document.getElementById('check-date-single').value || '',
            checkImage: document.getElementById('check-preview-single').src || ''
        } : null;
        paymentData = { type: 'single', method: paymentMethod, paidAmount, remainingBalance: totalDue - paidAmount, checkDetails };
    }

    const invoice = {
        id: invoiceId,
        date: invoiceDate ? new Date(invoiceDate + 'T12:00:00').toISOString() : new Date().toISOString(),
        client: { name: document.getElementById('client-name').value || '', address: document.getElementById('client-address').value || '', phone: document.getElementById('client-phone').value || '' },
        products: Array.from(document.querySelectorAll('#products-body tr')).map(row => ({ productName: row.querySelector('.product-name')?.value || '', thickness: row.querySelector('.thickness')?.value || 0, quantity: parseFloat(row.querySelector('.quantity')?.value) || 0, price: parseFloat(row.querySelector('.price')?.value) || 0, total: parseFloat(row.querySelector('.total')?.textContent) || 0 })).filter(item => item.productName),
        subtotal: parseFloat(document.getElementById('subtotal').textContent) || 0,
        totalDiscount: parseFloat(document.getElementById('total-discount').textContent) || 0,
        totalTax: parseFloat(document.getElementById('total-tax').textContent) || 0,
        grandTotal: grandTotal,
        payment: paymentData,
        status: paymentData.remainingBalance > 0 ? 'غير مدفوعة بالكامل' : 'مدفوعة'
    };
    return invoice;
}

function printCurrentInvoiceFromForm() {
    const invoice = getCurrentInvoiceFromForm();
    const bodyHtml = buildInvoicePrintBody(invoice);
    openProfessionalPrintWindow(`فاتورة ${invoice.id}`, bodyHtml);
}

function exportCurrentInvoiceAsPDF() {
    const { jsPDF } = window.jspdf;
    const invoice = getCurrentInvoiceFromForm();
    if (!invoice.client.name || invoice.products.length === 0) {
        showNotification('يرجى تعبئة بيانات طلب البيع أولاً (العميل والمنتجات)', 'error');
        return;
    }
    showNotification('جاري تجهيز ملف PDF...', 'success');
    const printContainer = document.createElement('div');
    printContainer.style.position = 'absolute';
    printContainer.style.left = '-9999px';
    document.body.appendChild(printContainer);
    const bodyHtml = buildInvoicePrintBody(invoice);
    printContainer.innerHTML = `<style>${getPrintStyles()}</style>${bodyHtml}`;
    const invoiceElement = printContainer.querySelector('.print-page');
    html2canvas(invoiceElement, { scale: 3, useCORS: true, logging: false }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const PDF_MARGIN = 15;
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const printableWidth = pdfWidth - (PDF_MARGIN * 2);
        const printableHeight = pdfHeight - (PDF_MARGIN * 2);
        const ratio = canvas.width / canvas.height;
        let imgWidth = printableWidth;
        let imgHeight = imgWidth / ratio;
        if (imgHeight > printableHeight) {
            imgHeight = printableHeight;
            imgWidth = imgHeight * ratio;
        }
        const xOffset = PDF_MARGIN + (printableWidth - imgWidth) / 2;
        const yOffset = PDF_MARGIN + (printableHeight - imgHeight) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
        pdf.save(`طلب-بيع-${invoice.id}.pdf`);
        document.body.removeChild(printContainer);
        showNotification('تم تحميل طلب البيع كملف PDF بنجاح.');
    }).catch(err => {
        console.error("خطأ في إنشاء PDF:", err);
        showNotification('حدث خطأ أثناء إنشاء ملف PDF', 'error');
        document.body.removeChild(printContainer);
    });
}

async function deleteInvoice(invoiceId) {
    const password = prompt('يرجى إدخال كلمة المرور لحذف طلب البيع:');
    if (password !== DELETE_PASSWORD) {
        showNotification('كلمة المرور غير صحيحة', 'error');
        return;
    }
    invoices = invoices.filter(inv => inv.id !== invoiceId);
    localStorage.setItem('invoices', JSON.stringify(invoices));
    purchaseHistory = purchaseHistory.filter(p => p.invoiceId !== invoiceId);
    localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));
    try {
        await sendToCloud({ action: 'deleteInvoice', invoiceId: invoiceId });
        await fetchCloudData();
        showNotification('تم حذف طلب البيع بنجاح');
    } catch (err) {
        console.error('فشل حذف طلب البيع من السحابة:', err);
        showNotification('تم حذف طلب البيع محليًا لكن لم يتم حذفه من السحابة', 'error');
    }
    loadInvoicesHistory();
    updateDashboard();
}

function exportInvoiceAsPDF(invoiceId) {
    const { jsPDF } = window.jspdf;
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
        showNotification('لم يتم العثور على طلب البيع', 'error');
        return;
    }
    showNotification('جاري تجهيز ملف PDF...', 'success');
    const printContainer = document.createElement('div');
    printContainer.style.position = 'absolute';
    printContainer.style.left = '-9999px';
    document.body.appendChild(printContainer);
    
    const bodyHtml = buildInvoicePrintBody(invoice);
    printContainer.innerHTML = `<style>${getPrintStyles()}</style>${bodyHtml}`;
    
    const invoiceElement = printContainer.querySelector('.print-page');
    
    html2canvas(invoiceElement, { scale: 3, useCORS: true, logging: false }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const PDF_MARGIN = 15;
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const printableWidth = pdfWidth - (PDF_MARGIN * 2);
        const printableHeight = pdfHeight - (PDF_MARGIN * 2);
        const ratio = canvas.width / canvas.height;
        let imgWidth = printableWidth;
        let imgHeight = imgWidth / ratio;
        if (imgHeight > printableHeight) {
            imgHeight = printableHeight;
            imgWidth = imgHeight * ratio;
        }
        const xOffset = PDF_MARGIN + (printableWidth - imgWidth) / 2;
        const yOffset = PDF_MARGIN + (printableHeight - imgHeight) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
        pdf.save(`طلب-بيع-${invoice.id}.pdf`);
        document.body.removeChild(printContainer);
        showNotification('تم تحميل طلب البيع كملف PDF بنجاح.');
    }).catch(err => {
        console.error("خطأ في إنشاء PDF:", err);
        showNotification('حدث خطأ أثناء إنشاء ملف PDF', 'error');
        document.body.removeChild(printContainer);
    });
}

// =========================================
// دوال سجل المشتريات
// =========================================
function searchPurchaseHistory() {
    const searchTerm = document.getElementById('purchase-client-search').value;
    if (!searchTerm) { loadPurchaseHistory(); return; }
    const filteredPurchases = purchaseHistory.filter(purchase => purchase.clientName.toLowerCase().includes(searchTerm.toLowerCase()));
    displayPurchaseHistory(filteredPurchases);
}

function loadPurchaseHistory() {
    displayPurchaseHistory(purchaseHistory);
    loadSteelThicknessPurchases();
    loadProductSalesTotals();
}

function displayPurchaseHistory(purchasesList) {
    const purchaseHistoryDiv = document.getElementById('purchase-history');
    purchaseHistoryDiv.innerHTML = '';
    if (purchasesList.length === 0) {
        purchaseHistoryDiv.innerHTML = '<p>لا توجد مشتريات مسجلة</p>';
        return;
    }
    purchasesList.sort((a, b) => new Date(b.date) - new Date(a.date));
    purchasesList.forEach(purchase => {
        const thicknessText = purchase.thickness ? ` (${purchase.thickness} مم)` : '';
        const purchaseDiv = document.createElement('div');
        purchaseDiv.className = 'invoice-item';
        purchaseDiv.innerHTML = `
            <div class="invoice-header-small"><div><strong>${purchase.clientName}</strong></div><div>${new Date(purchase.date).toLocaleDateString('ar-EG')}</div></div>
            <div><strong>المنتج:</strong> ${purchase.productName}${thicknessText}</div>
            <div><strong>الكمية:</strong> ${purchase.quantity}</div>
            <div><strong>السعر:</strong> ${purchase.price.toFixed(2)} دينار</div>
            <div class="total-section"><div>المجموع: ${purchase.total.toFixed(2)} دينار</div></div>
        `;
        purchaseHistoryDiv.appendChild(purchaseDiv);
    });
}

function loadSteelThicknessPurchases() {
    const steelThicknessPurchases = document.getElementById('steel-thickness-purchases');
    if (purchaseHistory.length === 0) {
        steelThicknessPurchases.innerHTML = '<p>لا توجد مشتريات مسجلة</p>';
        return;
    }
    const thicknessTotals = {};
    purchaseHistory.forEach(purchase => {
        const thickness = purchase.thickness;
        if (thickness !== null && thickness !== undefined) {
            const key = `${thickness} مم`;
            if (!thicknessTotals[key]) thicknessTotals[key] = { quantity: 0, total: 0 };
            thicknessTotals[key].quantity += purchase.quantity;
            thicknessTotals[key].total += purchase.total;
        }
    });
    let html = '<table><thead><tr><th>السماكة</th><th>الكمية الإجمالية</th><th>القيمة الإجمالية</th></tr></thead><tbody>';
    for (const key in thicknessTotals) {
        html += `<tr><td>${key}</td><td>${thicknessTotals[key].quantity}</td><td>${thicknessTotals[key].total.toFixed(2)} دينار</td></tr>`;
    }
    html += '</tbody></table>';
    steelThicknessPurchases.innerHTML = html;
}

function loadProductSalesTotals() {
    const productSalesDiv = document.getElementById('product-sales-totals');
    if (purchaseHistory.length === 0) {
        productSalesDiv.innerHTML = '<p>لا توجد مشتريات مسجلة</p>';
        return;
    }
    const productTotals = {};
    purchaseHistory.forEach(purchase => {
        const productName = purchase.productName;
        if (!productTotals[productName]) productTotals[productName] = { quantity: 0, total: 0 };
        productTotals[productName].quantity += purchase.quantity;
        productTotals[productName].total += purchase.total;
    });
    let html = '<table><thead><tr><th>المنتج</th><th>الكمية الإجمالية المباعة</th><th>إجمالي المبيعات</th></tr></thead><tbody>';
    const sortedProducts = Object.keys(productTotals).sort((a, b) => productTotals[b].quantity - productTotals[a].quantity);
    sortedProducts.forEach(productName => {
        html += `<tr><td>${productName}</td><td>${productTotals[productName].quantity}</td><td>${productTotals[productName].total.toFixed(2)} دينار</td></tr>`;
    });
    html += '</tbody></table>';
    productSalesDiv.innerHTML = html;
}

// =========================================
// دوال الإشعارات
// =========================================
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification';
    if (type === 'error') notification.classList.add('error');
    notification.style.display = 'block';
    setTimeout(() => { notification.style.display = 'none'; }, 3000);
}

// =========================================
// دوال لوحة التحكم
// =========================================
function updateDashboard() {
    document.getElementById('dashboard-invoices').textContent = invoices.length;
    document.getElementById('dashboard-clients').textContent = clients.length;
    document.getElementById('dashboard-purchases').textContent = purchaseHistory.length;
    document.getElementById('total-clients').textContent = clients.length;
    document.getElementById('total-invoices').textContent = invoices.length;
    document.getElementById('total-purchases').textContent = purchaseHistory.length;
}

async function refreshFromStorage() {
    try {
        const storedClients = JSON.parse(localStorage.getItem('clients')) || [];
        const storedInvoices = JSON.parse(localStorage.getItem('invoices')) || [];
        const storedPurchases = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
        const storedSalaries = JSON.parse(localStorage.getItem('employeeSalaries')) || [];
        if (JSON.stringify(storedClients) !== JSON.stringify(clients) ||
            JSON.stringify(storedInvoices) !== JSON.stringify(invoices) ||
            JSON.stringify(storedPurchases) !== JSON.stringify(purchaseHistory) ||
            JSON.stringify(storedSalaries) !== JSON.stringify(employeeSalaries)) {
            clients = storedClients;
            invoices = storedInvoices;
            purchaseHistory = storedPurchases;
            employeeSalaries = storedSalaries;
            loadClientsList();
            loadInvoicesHistory();
            loadPurchaseHistory();
            loadEmployeeSalaries();
            loadProductSalesTotals();
            updateDashboard();
            lastSyncTimestamp = Date.now();
        }
    } catch (err) {
        console.error('فشل التحديث التلقائي:', err);
    }
}

function startAutoRefresh() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    autoRefreshTimer = setInterval(() => { fetchCloudData(); }, 5000);
}

// =========================================
// دوال كشوف العمال
// =========================================
function calculateSalary() {
    const basicSalary = parseFloat(document.getElementById('employee-salary').value) || 0;
    const overtime = parseFloat(document.getElementById('employee-overtime').value) || 0;
    const deductions = parseFloat(document.getElementById('employee-deductions').value) || 0;
    const netSalary = basicSalary + overtime - deductions;
    document.getElementById('basic-salary').textContent = basicSalary.toFixed(2);
    document.getElementById('overtime-amount').textContent = overtime.toFixed(2);
    document.getElementById('deductions-amount').textContent = deductions.toFixed(2);
    document.getElementById('net-salary').textContent = netSalary.toFixed(2);
    document.getElementById('salary-result').style.display = 'block';
}

function buildSalaryPrintBody(salary) {
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const month = salary.month || '1';
    const monthLabel = monthNames[parseInt(month, 10) - 1] || month;
    const basicSalary = Number(salary.basicSalary ?? 0);
    const overtime = Number(salary.overtime ?? 0);
    const deductions = Number(salary.deductions ?? 0);
    const netSalary = Number(salary.netSalary ?? (basicSalary + overtime - deductions));
    return `
    <div class="print-page modern-invoice">
        ${buildOfficialHeader('كشف راتب الموظف')}
        <div class="card"><div class="info-grid"><div><div class="row"><span><strong>اسم الموظف:</strong></span><span>${escapeHtml(salary.employeeName || 'غير محدد')}</span></div><div class="row"><span><strong>رقم الهوية:</strong></span><span>${escapeHtml(salary.employeeId || 'غير محدد')}</span></div></div><div><div class="row"><span><strong>المسمى الوظيفي:</strong></span><span>${escapeHtml(salary.employeePosition || 'غير محدد')}</span></div><div class="row"><span><strong>الشهر:</strong></span><span>${escapeHtml(`${monthLabel} ${salary.year || new Date().getFullYear()}`)}</span></div></div></div></div>
        <div class="card"><table class="totals-table"><thead><tr><th>البند</th><th>المبلغ (دينار)</th></tr></thead><tbody><tr><td class="label">الراتب الأساسي</td><td class="value">${basicSalary.toFixed(2)}</td></tr><tr><td class="label">الإضافي</td><td class="value">${overtime.toFixed(2)}</td></tr><tr><td class="label">الخصومات</td><td class="value">${deductions.toFixed(2)}</td></tr><tr class="grand-total-row"><td class="label">صافي الراتب</td><td class="value">${netSalary.toFixed(2)}</td></tr></tbody></table></div>
        <div class="signature-section"><div class="signature-box">توقيع الموظف<div class="signature-line"></div></div><div class="signature-box">توقيع الإدارة<div class="signature-line"></div></div></div>
        <div class="print-footer">تم إنشاء هذا المستند بواسطة نظام إدارة المصنع | تاريخ الطباعة: ${new Date().toLocaleString('ar-EG')}</div>
    </div>`;
}

function printSalary() {
    const employeeName = document.getElementById('employee-name').value || 'غير محدد';
    const employeeId = document.getElementById('employee-id').value || 'غير محدد';
    const employeePosition = document.getElementById('employee-position').value || 'غير محدد';
    const month = document.getElementById('employee-month').value || '1';
    const year = document.getElementById('employee-year').value || new Date().getFullYear();
    const basicSalary = parseFloat(document.getElementById('employee-salary').value) || 0;
    const overtime = parseFloat(document.getElementById('employee-overtime').value) || 0;
    const deductions = parseFloat(document.getElementById('employee-deductions').value) || 0;
    const netSalary = basicSalary + overtime - deductions;
    const salary = { employeeName, employeeId, employeePosition, month, year, basicSalary, overtime, deductions, netSalary };
    const bodyHtml = buildSalaryPrintBody(salary);
    openProfessionalPrintWindow(`كشف راتب - ${employeeName}`, bodyHtml);
}

async function saveSalary() {
    const employeeName = document.getElementById('employee-name').value.trim();
    const employeeId = document.getElementById('employee-id').value.trim();
    const employeePosition = document.getElementById('employee-position').value.trim();
    const month = document.getElementById('employee-month').value;
    const year = document.getElementById('employee-year').value;
    const basicSalary = parseFloat(document.getElementById('employee-salary').value) || 0;
    const overtime = parseFloat(document.getElementById('employee-overtime').value) || 0;
    const deductions = parseFloat(document.getElementById('employee-deductions').value) || 0;
    const netSalary = basicSalary + overtime - deductions;
    if (!employeeName) {
        showNotification('يرجى إدخال اسم الموظف', 'error');
        return;
    }
    const salaryRecord = { id: editingSalaryId || Date.now().toString(), employeeName, employeeId, employeePosition, month, year, basicSalary, overtime, deductions, netSalary, date: new Date().toISOString() };
    if (editingSalaryId) {
        const index = employeeSalaries.findIndex(s => s.id === editingSalaryId);
        if (index !== -1) employeeSalaries[index] = salaryRecord;
    } else {
        employeeSalaries.push(salaryRecord);
    }
    localStorage.setItem('employeeSalaries', JSON.stringify(employeeSalaries));
    try {
        await sendToCloud({ action: 'saveSalary', salary: salaryRecord });
        showNotification(editingSalaryId ? 'تم تعديل كشف الراتب بنجاح' : 'تم حفظ كشف الراتب بنجاح');
    } catch (err) {
        console.error('فشل إرسال كشف الراتب للسحابة:', err);
        showNotification('تم حفظ كشف الراتب محليًا لكن لم يتم الإرسال للسحابة', 'error');
    }
    editingSalaryId = null;
    document.getElementById('employee-name').value = '';
    document.getElementById('employee-id').value = '';
    document.getElementById('employee-position').value = '';
    document.getElementById('employee-salary').value = '0.00';
    document.getElementById('employee-overtime').value = '0.00';
    document.getElementById('employee-deductions').value = '0.00';
    document.getElementById('employee-month').value = '1';
    document.getElementById('employee-year').value = new Date().getFullYear();
    document.getElementById('salary-result').style.display = 'none';
    loadEmployeeSalaries();
}

function editSalary(salaryId) {
    const salary = employeeSalaries.find(s => s.id === salaryId);
    if (!salary) return;
    document.querySelector('.tab[data-tab="employees"]').click();
    document.getElementById('employee-name').value = salary.employeeName || '';
    document.getElementById('employee-id').value = salary.employeeId || '';
    document.getElementById('employee-position').value = salary.employeePosition || '';
    document.getElementById('employee-month').value = salary.month || '1';
    document.getElementById('employee-year').value = salary.year || new Date().getFullYear();
    document.getElementById('employee-salary').value = salary.basicSalary || '0.00';
    document.getElementById('employee-overtime').value = salary.overtime || '0.00';
    document.getElementById('employee-deductions').value = salary.deductions || '0.00';
    calculateSalary();
    editingSalaryId = salaryId;
    showNotification('تم تهيئة كشف الراتب للتعديل');
}

function loadEmployeeSalaries() {
    const savedSalaries = document.getElementById('saved-salaries');
    savedSalaries.innerHTML = '';
    if (employeeSalaries.length === 0) {
        savedSalaries.innerHTML = '<p>لا توجد كشوف رواتب محفوظة</p>';
        return;
    }
    employeeSalaries.forEach(salary => {
        const salaryDiv = document.createElement('div');
        salaryDiv.className = 'invoice-item';
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        salaryDiv.innerHTML = `
            <div class="invoice-header-small"><div><strong>${salary.employeeName}</strong></div><div>${monthNames[parseInt(salary.month) - 1]} ${salary.year}</div></div>
            <div class="client-details"><div><strong>رقم الهوية:</strong> ${salary.employeeId || 'غير محدد'}</div><div><strong>المسمى الوظيفي:</strong> ${salary.employeePosition || 'غير محدد'}</div></div>
            <div class="total-section"><div>الراتب الأساسي: ${salary.basicSalary.toFixed(2)} دينار</div><div>الإضافي: ${salary.overtime.toFixed(2)} دينار</div><div>الخصومات: ${salary.deductions.toFixed(2)} دينار</div><div class="grand-total">صافي الراتب: ${salary.netSalary.toFixed(2)} دينار</div></div>
            <div class="actions">
                <button class="btn btn-success print-salary-item" data-id="${salary.id}"><i class="fas fa-print"></i> طباعة</button>
                <button class="btn btn-secondary edit-salary" data-id="${salary.id}"><i class="fas fa-edit"></i> تعديل</button>
                <button class="btn btn-danger delete-salary" data-id="${salary.id}"><i class="fas fa-trash"></i> حذف</button>
            </div>
        `;
        salaryDiv.querySelector('.print-salary-item').addEventListener('click', function() {
            printSalaryItem(salary.id);
        });
        salaryDiv.querySelector('.edit-salary').addEventListener('click', function() {
            editSalary(salary.id);
        });
        salaryDiv.querySelector('.delete-salary').addEventListener('click', function() {
            deleteSalary(salary.id);
        });
        savedSalaries.appendChild(salaryDiv);
    });
}

function printSalaryItem(salaryId) {
    const salary = employeeSalaries.find(s => s.id === salaryId);
    if (!salary) return;
    const bodyHtml = buildSalaryPrintBody(salary);
    openProfessionalPrintWindow(`كشف راتب - ${salary.employeeName}`, bodyHtml);
}

async function deleteSalary(salaryId) {
    if (!confirm('هل أنت متأكد من حذف كشف الراتب هذا؟')) return;
    employeeSalaries = employeeSalaries.filter(s => s.id !== salaryId);
    localStorage.setItem('employeeSalaries', JSON.stringify(employeeSalaries));
    try {
        await sendToCloud({ action: 'deleteSalary', salaryId: salaryId });
        showNotification('تم حذف كشف الراتب بنجاح');
    } catch (err) {
        console.error('فشل حذف كشف الراتب من السحابة:', err);
        showNotification('تم الحذف محلياً، لكن فشلت المزامنة السحابية', 'error');
    }
    loadEmployeeSalaries();
}

// =========================================
// دوال آلة حاسبة الأسعار
// =========================================
function setupCalculator() {
    setupCalculatorInputs();
}

function setupCalculatorInputs() {
    const calculationType = document.getElementById('calculation-type').value;
    const inputFields = document.getElementById('input-fields');
    inputFields.innerHTML = '';
    if (calculationType === '1') {
        inputFields.innerHTML = `<div><strong>عرض الشريحة (سم):</strong> <input type="number" id="sheet-width" placeholder="أدخل عرض الشريحة" step="0.1" min="0.1"></div><div><strong>السماكة (مم):</strong> <input type="number" id="sheet-thickness" placeholder="أدخل السماكة" step="0.1" min="0.1"></div>`;
    } else if (calculationType === '2') {
        inputFields.innerHTML = `<div><strong>عرض الشريحة (سم):</strong> <input type="number" id="sheet-width" placeholder="أدخل عرض الشريحة" step="0.1" min="0.1"></div><div><strong>الوزن (كجم):</strong> <input type="number" id="sheet-weight" placeholder="أدخل الوزن" step="0.1" min="0.1"></div>`;
    } else if (calculationType === '3') {
        inputFields.innerHTML = `<div><strong>السماكة (مم):</strong> <input type="number" id="sheet-thickness" placeholder="أدخل السماكة" step="0.1" min="0.1"></div><div><strong>الوزن (كجم):</strong> <input type="number" id="sheet-weight" placeholder="أدخل الوزن" step="0.1" min="0.1"></div>`;
    }
}

function calculateSteel() {
    const calculationType = document.getElementById('calculation-type').value;
    let resultHTML = '';
    const CONVERSION_FACTOR = 0.2355;
    if (calculationType === '1') {
        const width = parseFloat(document.getElementById('sheet-width').value);
        const thickness = parseFloat(document.getElementById('sheet-thickness').value);
        if (!width || !thickness || width <= 0 || thickness <= 0) {
            showNotification('يرجى إدخال قيم موجبة وصحيحة للعرض والسماكة', 'error');
            return;
        }
        const weight = width * thickness * CONVERSION_FACTOR;
        resultHTML = `<p><strong>الوزن المحسوب:</strong> <span style="font-weight: bold; color: #2c3e50;">${weight.toFixed(3)} كجم</span></p><hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;"><p style="color: #7f8c8d;">بناءً على:</p><p><strong>عرض الشريحة:</strong> ${width} سم</p><p><strong>السماكة:</strong> ${thickness} مم</p>`;
    } else if (calculationType === '2') {
        const width = parseFloat(document.getElementById('sheet-width').value);
        const weight = parseFloat(document.getElementById('sheet-weight').value);
        if (!width || !weight || width <= 0 || weight <= 0) {
            showNotification('يرجى إدخال قيم موجبة وصحيحة للعرض والوزن', 'error');
            return;
        }
        const thickness = weight / (width * CONVERSION_FACTOR);
        resultHTML = `<p><strong>السماكة المحسوبة:</strong> <span style="font-weight: bold; color: #2c3e50;">${thickness.toFixed(3)} مم</span></p><hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;"><p style="color: #7f8c8d;">بناءً على:</p><p><strong>عرض الشريحة:</strong> ${width} سم</p><p><strong>الوزن:</strong> ${weight} كجم</p>`;
    } else if (calculationType === '3') {
        const thickness = parseFloat(document.getElementById('sheet-thickness').value);
        const weight = parseFloat(document.getElementById('sheet-weight').value);
        if (!thickness || !weight || thickness <= 0 || weight <= 0) {
            showNotification('يرجى إدخال قيم موجبة وصحيحة للسماكة والوزن', 'error');
            return;
        }
        const width = weight / (thickness * CONVERSION_FACTOR);
        resultHTML = `<p><strong>عرض الشريحة المحسوب:</strong> <span style="font-weight: bold; color: #2c3e50;">${width.toFixed(2)} سم</span></p><hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;"><p style="color: #7f8c8d;">بناءً على:</p><p><strong>السماكة:</strong> ${thickness} مم</p><p><strong>الوزن:</strong> ${weight} كجم</p>`;
    }
    document.getElementById('result-details').innerHTML = resultHTML;
    document.getElementById('calculator-result').style.display = 'block';
}

function resetCalculator() {
    document.getElementById('input-fields').innerHTML = '';
    document.getElementById('calculator-result').style.display = 'none';
    setupCalculatorInputs();
}

// =========================================
// دوال التقارير
// =========================================
function calculatePaymentBreakdown(invoicesList) {
    const totals = { cash: 0, check: 0, bank: 0 };
    invoicesList.forEach(invoice => {
        if (!invoice.payment) return;

        const processPayment = (method, amount) => {
            if (method === 'cash') totals.cash += amount;
            else if (method === 'check') totals.check += amount;
            else if (method === 'bank') totals.bank += amount;
        };

        if (invoice.payment.type === 'single') {
            processPayment(invoice.payment.method, invoice.payment.paidAmount || 0);
        } else if (invoice.payment.type === 'multiple') {
            (invoice.payment.payments || []).forEach(p => {
                processPayment(p.method, p.amount || 0);
            });
        }
    });
    return totals;
}

function calculateWeightFromInvoices(invoicesList) {
    const STEEL_DENSITY_FACTOR = 0.000785;
    let totalWeight = 0;
    invoicesList.forEach(invoice => {
        if (invoice.products && Array.isArray(invoice.products)) {
            invoice.products.forEach(product => {
                const productDefinition = products.find(p => p.name === product.productName);
                if (productDefinition && productDefinition.isSteel && productDefinition.width) {
                    const width = productDefinition.width;
                    const length = productDefinition.length || 300;
                    const thickness = parseFloat(product.thickness);
                    const quantity = parseInt(product.quantity, 10);
                    if (!isNaN(thickness) && !isNaN(quantity) && thickness > 0) {
                        const lineWeight = width * length * thickness * STEEL_DENSITY_FACTOR * quantity;
                        totalWeight += lineWeight;
                    }
                }
            });
        }
    });
    return totalWeight;
}

function loadReports() {
    loadDailyReport();
    loadWeeklyReport();
    loadMonthlyReport();
    loadAnnualReport();
    updateOutputWeightReport();
}

function loadDailyReport() {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const dailyInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate >= todayStart && invoiceDate < todayEnd;
    });
    const totalSales = dailyInvoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0);
    const totalProducts = dailyInvoices.reduce((sum, invoice) => sum + invoice.products.length, 0);
    const totalUnits = dailyInvoices.reduce((sum, invoice) => sum + invoice.products.reduce((prodSum, product) => prodSum + product.quantity, 0), 0);
    const uniqueCustomers = [...new Set(dailyInvoices.map(invoice => invoice.client.name))].length;
    const avgInvoice = dailyInvoices.length > 0 ? totalSales / dailyInvoices.length : 0;
    const totalWeight = calculateWeightFromInvoices(dailyInvoices);
    const paymentBreakdown = calculatePaymentBreakdown(dailyInvoices);
    document.getElementById('daily-total-sales').textContent = totalSales.toFixed(2) + ' دينار';
    document.getElementById('daily-invoices-count').textContent = dailyInvoices.length + ' طلب بيع';
    document.getElementById('daily-products-sold').textContent = totalProducts + ' منتج';
    document.getElementById('daily-units-sold').textContent = totalUnits + ' وحدة';
    document.getElementById('daily-avg-invoice').textContent = avgInvoice.toFixed(2) + ' دينار';
    document.getElementById('daily-customers-count').textContent = uniqueCustomers + ' عميل';
    document.getElementById('daily-total-weight').textContent = totalWeight.toFixed(2) + ' كجم';
    document.getElementById('daily-cash-received').textContent = paymentBreakdown.cash.toFixed(2) + ' دينار';
    document.getElementById('daily-checks-received').textContent = paymentBreakdown.check.toFixed(2) + ' دينار';
    document.getElementById('daily-bank-received').textContent = paymentBreakdown.bank.toFixed(2) + ' دينار';
    displaySalesDetails('daily', dailyInvoices);
}

function loadWeeklyReport() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    const weeklyInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate >= startOfWeek && invoiceDate < endOfWeek;
    });
    const totalSales = weeklyInvoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0);
    const totalProducts = weeklyInvoices.reduce((sum, invoice) => sum + invoice.products.length, 0);
    const totalUnits = weeklyInvoices.reduce((sum, invoice) => sum + invoice.products.reduce((prodSum, product) => prodSum + product.quantity, 0), 0);
    const uniqueCustomers = [...new Set(weeklyInvoices.map(invoice => invoice.client.name))].length;
    const avgDaily = weeklyInvoices.length > 0 ? totalSales / 7 : 0;
    const totalWeight = calculateWeightFromInvoices(weeklyInvoices);
    const paymentBreakdown = calculatePaymentBreakdown(weeklyInvoices);
    document.getElementById('weekly-total-sales').textContent = totalSales.toFixed(2) + ' دينار';
    document.getElementById('weekly-invoices-count').textContent = weeklyInvoices.length + ' طلب بيع';
    document.getElementById('weekly-products-sold').textContent = totalProducts + ' منتج';
    document.getElementById('weekly-units-sold').textContent = totalUnits + ' وحدة';
    document.getElementById('weekly-avg-daily').textContent = avgDaily.toFixed(2) + ' دينار';
    document.getElementById('weekly-customers-count').textContent = uniqueCustomers + ' عميل';
    document.getElementById('weekly-total-weight').textContent = totalWeight.toFixed(2) + ' كجم';
    document.getElementById('weekly-cash-received').textContent = paymentBreakdown.cash.toFixed(2) + ' دينار';
    document.getElementById('weekly-checks-received').textContent = paymentBreakdown.check.toFixed(2) + ' دينار';
    document.getElementById('weekly-bank-received').textContent = paymentBreakdown.bank.toFixed(2) + ' دينار';
    displaySalesDetails('weekly', weeklyInvoices);
}

function loadMonthlyReport() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthlyInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate >= startOfMonth && invoiceDate <= endOfMonth;
    });
    const totalSales = monthlyInvoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0);
    const totalProducts = monthlyInvoices.reduce((sum, invoice) => sum + invoice.products.length, 0);
    const totalUnits = monthlyInvoices.reduce((sum, invoice) => sum + invoice.products.reduce((prodSum, product) => prodSum + product.quantity, 0), 0);
    const uniqueCustomers = [...new Set(monthlyInvoices.map(invoice => invoice.client.name))].length;
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const avgDaily = monthlyInvoices.length > 0 ? totalSales / daysInMonth : 0;
    const totalWeight = calculateWeightFromInvoices(monthlyInvoices);
    const paymentBreakdown = calculatePaymentBreakdown(monthlyInvoices);
    document.getElementById('monthly-total-sales').textContent = totalSales.toFixed(2) + ' دينار';
    document.getElementById('monthly-invoices-count').textContent = monthlyInvoices.length + ' طلب بيع';
    document.getElementById('monthly-products-sold').textContent = totalProducts + ' منتج';
    document.getElementById('monthly-units-sold').textContent = totalUnits + ' وحدة';
    document.getElementById('monthly-avg-daily').textContent = avgDaily.toFixed(2) + ' دينار';
    document.getElementById('monthly-customers-count').textContent = uniqueCustomers + ' عميل';
    document.getElementById('monthly-total-weight').textContent = totalWeight.toFixed(2) + ' كجم';
    document.getElementById('monthly-cash-received').textContent = paymentBreakdown.cash.toFixed(2) + ' دينار';
    document.getElementById('monthly-checks-received').textContent = paymentBreakdown.check.toFixed(2) + ' دينار';
    document.getElementById('monthly-bank-received').textContent = paymentBreakdown.bank.toFixed(2) + ' دينار';
    displaySalesDetails('monthly', monthlyInvoices);
}

function loadAnnualReport() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);
    const annualInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate >= startOfYear && invoiceDate <= endOfYear;
    });
    const totalSales = annualInvoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0);
    const totalInvoices = annualInvoices.length;
    const uniqueCustomers = [...new Set(annualInvoices.map(invoice => invoice.client.name))].length;
    const monthlyAvg = totalSales / 12;
    const monthlySales = {};
    for (let i = 0; i < 12; i++) monthlySales[i] = 0;
    annualInvoices.forEach(invoice => {
        const month = new Date(invoice.date).getMonth();
        monthlySales[month] += invoice.grandTotal;
    });
    let bestMonth = 0, bestMonthSales = 0;
    for (let i = 0; i < 12; i++) {
        if (monthlySales[i] > bestMonthSales) {
            bestMonthSales = monthlySales[i];
            bestMonth = i;
        }
    }
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const totalWeight = calculateWeightFromInvoices(annualInvoices);
    const paymentBreakdown = calculatePaymentBreakdown(annualInvoices);
    document.getElementById('annual-total-sales').textContent = totalSales.toFixed(2) + ' دينار';
    document.getElementById('annual-invoices-count').textContent = totalInvoices + ' طلب بيع';
    document.getElementById('best-month-sales').textContent = bestMonthSales.toFixed(2) + ' دينار';
    document.getElementById('best-month-name').textContent = monthNames[bestMonth];
    document.getElementById('monthly-avg-sales').textContent = monthlyAvg.toFixed(2) + ' دينار';
    document.getElementById('annual-customers-count').textContent = uniqueCustomers + ' عميل';
    document.getElementById('annual-total-weight').textContent = totalWeight.toFixed(2) + ' كجم';
    document.getElementById('annual-cash-received').textContent = paymentBreakdown.cash.toFixed(2) + ' دينار';
    document.getElementById('annual-checks-received').textContent = paymentBreakdown.check.toFixed(2) + ' دينار';
    document.getElementById('annual-bank-received').textContent = paymentBreakdown.bank.toFixed(2) + ' دينار';
    const monthlyChart = document.getElementById('monthly-chart');
    monthlyChart.innerHTML = '';
    const maxSales = Math.max(...Object.values(monthlySales));
    for (let i = 0; i < 12; i++) {
        const monthBar = document.createElement('div');
        monthBar.className = 'month-bar';
        const height = maxSales > 0 ? (monthlySales[i] / maxSales) * 100 : 0;
        monthBar.innerHTML = `<div class="month-value">${monthlySales[i].toFixed(2)} دينار</div><div class="bar" style="height: ${height}%;"></div><div class="month-name">${monthNames[i]}</div>`;
        monthlyChart.appendChild(monthBar);
    }
    displaySalesDetails('annual', annualInvoices);
}

function displaySalesDetails(reportType, invoicesList) {
    const containerId = `${reportType}-sales-details`;
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    if (invoicesList.length === 0) {
        container.innerHTML = '<p>لا توجد مبيعات في هذه الفترة</p>';
        return;
    }
    const totalPages = Math.ceil(invoicesList.length / salesPerPage);
    const startIndex = (currentSalesPage - 1) * salesPerPage;
    const endIndex = startIndex + salesPerPage;
    const currentPageInvoices = invoicesList.slice(startIndex, endIndex);
    let tableHTML = `<table class="sales-details-table"><thead><tr><th>رقم الطلب</th><th>التاريخ</th><th>اسم العميل</th><th>اسم المنتج</th><th>السماكة (مم)</th><th>الكمية</th><th>سعر الوحدة</th><th>المجموع</th></tr></thead><tbody>`;
    currentPageInvoices.forEach(invoice => {
        invoice.products.forEach(product => {
            const thicknessText = product.thickness ? product.thickness : '-';
            tableHTML += `<tr><td>${invoice.id}</td><td>${new Date(invoice.date).toLocaleDateString('ar-EG')}</td><td>${invoice.client.name}</td><td>${product.productName}</td><td>${thicknessText}</td><td>${product.quantity}</td><td>${product.price.toFixed(2)} دينار</td><td>${product.total.toFixed(2)} دينار</td></tr>`;
        });
    });
    tableHTML += '</tbody></table>';
    if (totalPages > 1) {
        let paginationHTML = '<div class="pagination">';
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `<button class="${i === currentSalesPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        paginationHTML += '</div>';
        tableHTML += paginationHTML;
        container.innerHTML = tableHTML;
        container.querySelectorAll('.pagination button').forEach(button => {
            button.addEventListener('click', function() {
                currentSalesPage = parseInt(this.getAttribute('data-page'));
                displaySalesDetails(reportType, invoicesList);
            });
        });
    } else {
        container.innerHTML = tableHTML;
    }
}

function buildReportPrintBody(reportType) {
    const reportTitle = getReportTitle(reportType);
    let summaryCardsHTML = '';
    let detailsTableHTML = '';
    const reportContentEl = document.getElementById(`${reportType}-report`);
    let invoicesList = []; // تعريف المصفوفة مسبقاً

    if (reportContentEl) {
        const summaryCards = reportContentEl.querySelectorAll('.summary-card, .annual-card');
        if (summaryCards.length > 0) {
            summaryCardsHTML += '<div class="report-summary">';
            summaryCards.forEach(card => {
                const title = card.querySelector('h4')?.textContent || '';
                const value = card.querySelector('.value')?.textContent || '';
                const subValue = card.querySelector('.sub-value')?.textContent || '';
                summaryCardsHTML += `<div class="summary-card"><h4>${escapeHtml(title)}</h4><div class="value">${escapeHtml(value)}</div>${subValue ? `<div class="sub-value">${escapeHtml(subValue)}</div>` : ''}</div>`;
            });
            summaryCardsHTML += '</div>';
        }
        const today = new Date();
        if (reportType === 'daily') {
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
            invoicesList = invoices.filter(invoice => new Date(invoice.date) >= todayStart && new Date(invoice.date) < todayEnd);
        } else if (reportType === 'weekly') {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);
            invoicesList = invoices.filter(invoice => new Date(invoice.date) >= startOfWeek && new Date(invoice.date) < endOfWeek);
        } else if (reportType === 'monthly') {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            invoicesList = invoices.filter(invoice => new Date(invoice.date) >= startOfMonth && new Date(invoice.date) <= endOfMonth);
        } else if (reportType === 'annual') {
            const currentYear = today.getFullYear();
            const startOfYear = new Date(currentYear, 0, 1);
            const endOfYear = new Date(currentYear, 11, 31);
            invoicesList = invoices.filter(invoice => new Date(invoice.date) >= startOfYear && new Date(invoice.date) <= endOfYear);
        }
        if (invoicesList.length > 0) {
            detailsTableHTML = `<div class="sales-details"><h4>تفاصيل المبيعات</h4><table class="sales-details-table"><thead><tr><th>رقم الطلب</th><th>التاريخ</th><th>العميل</th><th>المنتج</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr></thead><tbody>`;
            invoicesList.forEach(invoice => {
                invoice.products.forEach(product => {
                    detailsTableHTML += `<tr><td>${escapeHtml(invoice.id)}</td><td>${new Date(invoice.date).toLocaleDateString('ar-EG')}</td><td>${escapeHtml(invoice.client.name)}</td><td>${escapeHtml(product.productName)} ${product.thickness ? `(${product.thickness} مم)` : ''}</td><td style="text-align:center;">${product.quantity}</td><td style="text-align:center;">${product.price.toFixed(2)}</td><td style="text-align:center;">${product.total.toFixed(2)}</td></tr>`;
                });
            });
            detailsTableHTML += '</tbody></table></div>';
        }
        const monthlyChart = reportContentEl.querySelector('.monthly-chart');
        if (reportType === 'annual' && monthlyChart) {
            let chartHTML = '<h4>ملخص المبيعات الشهرية</h4><table><thead><tr><th>الشهر</th><th>إجمالي المبيعات</th></tr></thead><tbody>';
            const monthBars = monthlyChart.querySelectorAll('.month-bar');
            monthBars.forEach(bar => {
                const monthName = bar.querySelector('.month-name').textContent;
                const monthValue = bar.querySelector('.month-value').textContent;
                chartHTML += `<tr><td>${monthName}</td><td>${monthValue}</td></tr>`;
            });
            chartHTML += '</tbody></table>';
            detailsTableHTML = chartHTML + detailsTableHTML;
        }
    }
    return `
    <div class="print-page modern-invoice">
        ${buildOfficialHeader(reportTitle)}
        <div class="card">${summaryCardsHTML}</div>
        <div class="card">${detailsTableHTML || '<p>لا توجد بيانات لعرضها في هذه الفترة.</p>'}</div>
        <div class="print-footer">تم إنشاء هذا المستند بواسطة نظام إدارة المصنع | تاريخ الطباعة: ${new Date().toLocaleString('ar-EG')}</div>
    </div>`;
}

function printReport(reportType) {
    const reportTitle = getReportTitle(reportType);
    const bodyHtml = buildReportPrintBody(reportType);
    openProfessionalPrintWindow(reportTitle, bodyHtml);
}

/**
 * يحسب بيانات الوزن الخام للمنتجات الحديدية المباعة.
 * @returns {{totalWeights: object, grandTotalWeight: number}}
 */
function getOutputWeightData() {
    const STEEL_DENSITY_FACTOR = 0.000785;
    const invoices = JSON.parse(localStorage.getItem('invoices')) || [];
    const totalWeights = {};
    let grandTotalWeight = 0;
    invoices.forEach(invoice => {
        if (invoice.products && Array.isArray(invoice.products)) {
            invoice.products.forEach(product => {
                const productName = product.productName;
                const productDefinition = products.find(p => p.name === productName);
                if (productDefinition && productDefinition.isSteel && productDefinition.width) {
                    const width = productDefinition.width;
                    const length = productDefinition.length || 300;
                    const thickness = parseFloat(product.thickness);
                    const quantity = parseInt(product.quantity, 10);
                    if (!isNaN(thickness) && !isNaN(quantity) && thickness > 0) {
                        const totalLineWeight = width * length * thickness * STEEL_DENSITY_FACTOR * quantity;
                        if (totalWeights[productName]) {
                            totalWeights[productName] += totalLineWeight;
                        } else {
                            totalWeights[productName] = totalLineWeight;
                        }
                        grandTotalWeight += totalLineWeight;
                    }
                }
            });
        }
    });
    return { totalWeights, grandTotalWeight };
}

function updateOutputWeightReport() {
    const { totalWeights, grandTotalWeight } = getOutputWeightData();
    const tableBody = document.getElementById('output-weight-body');
    const totalCell = document.getElementById('output-weight-total');
    tableBody.innerHTML = ''; 
    if (Object.keys(totalWeights).length === 0) {
        tableBody.innerHTML = '<tr><td colspan="2">لا توجد بيانات مبيعات للمنتجات الحديدية ذات الأوزان المعروفة.</td></tr>';
        totalCell.textContent = '0.00 كجم';
        return;
    }
    for (const productName in totalWeights) {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = productName;
        row.insertCell(1).textContent = `${totalWeights[productName].toFixed(2)} كجم`;
    }
    totalCell.textContent = `${grandTotalWeight.toFixed(2)} كجم`;
}

function printOutputWeightReport() {
    const { totalWeights, grandTotalWeight } = getOutputWeightData();
    if (Object.keys(totalWeights).length === 0) {
        showNotification('لا توجد بيانات لطباعتها', 'error');
        return;
    }
    let tableRows = '';
    for (const productName in totalWeights) {
        const weightInTons = totalWeights[productName] / 1000;
        tableRows += `<tr><td>${escapeHtml(productName)}</td><td style="text-align:center;">${weightInTons.toFixed(4)}</td></tr>`;
    }
    const grandTotalInTons = grandTotalWeight / 1000;
    const tableHtml = `
        <table>
            <thead><tr><th>اسم المنتج</th><th style="text-align:center;">إجمالي الوزن المباع (طن)</th></tr></thead>
            <tbody>${tableRows}</tbody>
            <tfoot>
                <tr class="grand-total-row">
                    <td><strong>الإجمالي الكلي</strong></td>
                    <td style="text-align:center;"><strong>${grandTotalInTons.toFixed(4)}</strong></td>
                </tr>
            </tfoot>
        </table>`;
    const bodyHtml = `
        <div class="print-page modern-invoice">
            ${buildOfficialHeader('تقرير وزن المخرجات من المصنع')}
            <div class="card">${tableHtml}</div>
            <div class="print-footer">تم إنشاء هذا المستند بواسطة نظام إدارة المصنع | تاريخ الطباعة: ${new Date().toLocaleString('ar-EG')}</div>
        </div>`;
    openProfessionalPrintWindow('تقرير وزن المخرجات', bodyHtml);
}

function getReportTitle(reportType) {
    const map = { 'daily': 'تقرير المبيعات اليومي', 'weekly': 'تقرير المبيعات الأسبوعي', 'monthly': 'تقرير المبيعات الشهري', 'annual': 'تقرير المبيعات السنوي' };
    return map[reportType] || 'تقرير';
}

function printElementContent(elementId, title) {
    const element = document.getElementById(elementId);
    if (!element) {
        showNotification('العنصر المراد طباعته غير موجود', 'error');
        return;
    }
    const contentHtml = element.innerHTML;
    const bodyHtml = `
    <div class="print-page modern-invoice">
        ${buildOfficialHeader(title)}
        <div class="card">${contentHtml}</div>
        <div class="print-footer">تم إنشاء هذا المستند بواسطة نظام إدارة المصنع | تاريخ الطباعة: ${new Date().toLocaleString('ar-EG')}</div>
    </div>`;
    openProfessionalPrintWindow(title, bodyHtml);
}

// =========================================
// دوال دفتر الذمم
// =========================================
function loadLedger() {
    const debtorsListContainer = document.getElementById('debtors-list-container');
    const totalBalanceSpan = document.getElementById('total-debtors-balance');
    const debtors = clients.filter(c => c.balance > 0);
    if (debtors.length === 0) {
        debtorsListContainer.innerHTML = '<div class="client-item">لا يوجد عملاء عليهم ذمم حالياً.</div>';
        totalBalanceSpan.textContent = '0.00';
        return;
    }
    debtors.sort((a, b) => b.balance - a.balance);
    let totalDebt = 0;
    let listHtml = '';
    debtors.forEach(client => {
        totalDebt += client.balance;
        listHtml += `
            <div class="client-item">
                <div><strong>${escapeHtml(client.name)}</strong></div>
                <div>الهاتف: ${escapeHtml(client.phone || 'غير متوفر')}</div>
                <div class="client-financial-info balance-negative" style="font-size: 1.1em;">الرصيد المستحق: ${client.balance.toFixed(2)} دينار</div>
                <div style="display: flex; gap: 5px; margin-top: 10px;">
                    <button class="btn btn-info financial-record" data-client-name="${escapeHtml(client.name)}"><i class="fas fa-file-invoice-dollar"></i> عرض السجل المالي</button>
                </div>
            </div>
        `;
    });
    debtorsListContainer.innerHTML = listHtml;
    totalBalanceSpan.textContent = totalDebt.toFixed(2);
    debtorsListContainer.querySelectorAll('.financial-record').forEach(button => {
        button.addEventListener('click', function() {
            viewFinancialLedger(this.getAttribute('data-client-name'));
        });
    });
}

async function addLedgerEntry() {
    const clientName = document.getElementById('ledger-client-search').value.trim();
    const amount = parseFloat(document.getElementById('ledger-amount').value);
    const reason = document.getElementById('ledger-reason').value.trim();
    if (!clientName) {
        showNotification('يجب اختيار عميل', 'error');
        return;
    }
    if (isNaN(amount) || amount === 0) {
        showNotification('يجب إدخال مبلغ صحيح (غير صفري)', 'error');
        return;
    }
    if (!reason) {
        showNotification('يجب إدخال السبب أو البيان', 'error');
        return;
    }
    const client = clients.find(c => c.name === clientName);
    if (!client) {
        showNotification('العميل غير موجود في السجلات', 'error');
        return;
    }
    if (!Array.isArray(client.adjustments)) client.adjustments = [];
    client.adjustments.push({ id: `adj-${Date.now()}`, date: new Date().toISOString(), amount: amount, reason: reason });
    client.balance = (client.balance || 0) + amount;
    localStorage.setItem('clients', JSON.stringify(clients));
    try {
        await sendToCloud({ action: 'saveClient', client: client });
        showNotification('تم حفظ الإدخال ومزامنة البيانات بنجاح');
        // Ask to print receipt if it's a payment (negative amount)
        if (amount < 0) { // It's a payment
            const paymentForReceipt = {
                date: new Date().toISOString(),
                amount: -amount, // make it positive
                method: 'manual', // Special method for ledger entry
            };
            lastAddedPaymentInfo = { clientName: client.name, payment: paymentForReceipt };
            document.getElementById('receiptOptionsModal').style.display = 'flex';
        }
    } catch (err) {
        console.error('فشل مزامنة إدخال الذمة:', err);
        showNotification('تم الحفظ محلياً، ولكن فشلت المزامنة السحابية', 'error');
    }
    loadLedger();
    loadClientsList();
    updateDashboard();
    document.getElementById('ledger-client-search').value = '';
    document.getElementById('ledger-amount').value = '';
    document.getElementById('ledger-reason').value = '';
}

async function editLedgerAdjustment(clientName, adjustmentId) {
    const enteredPassword = prompt('لتعديل هذا الإدخال، يرجى إدخال كلمة المرور:', '');
    if (enteredPassword !== PRODUCT_EDIT_PASSWORD) {
        if (enteredPassword !== null) showNotification('كلمة المرور غير صحيحة', 'error');
        return;
    }

    const client = clients.find(c => c.name === clientName);
    if (!client || !client.adjustments) return;

    const adjustment = client.adjustments.find(adj => adj.id === adjustmentId);
    if (!adjustment) {
        showNotification('لم يتم العثور على الإدخال المطلوب للتعديل.', 'error');
        return;
    }

    const newAmountStr = prompt('أدخل المبلغ الجديد (موجب للدين، سالب للتسديد):', adjustment.amount);
    if (newAmountStr === null) return;

    const newReason = prompt('أدخل السبب الجديد:', adjustment.reason);
    if (newReason === null) return;

    const newAmount = parseFloat(newAmountStr);

    if (isNaN(newAmount) || newReason.trim() === '') {
        showNotification('البيانات المدخلة غير صالحة. يرجى إدخال مبلغ صحيح وسبب.', 'error');
        return;
    }

    const oldAmount = adjustment.amount;

    client.balance = (client.balance - oldAmount) + newAmount;

    adjustment.amount = newAmount;
    adjustment.reason = newReason.trim();
    
    localStorage.setItem('clients', JSON.stringify(clients));
    try {
        await sendToCloud({ action: 'saveClient', client: client });
        showNotification('تم تعديل الإدخال وتحديث الرصيد بنجاح.');
    } catch (err) {
        console.error('فشل مزامنة تعديل الإدخال:', err);
        showNotification('تم التعديل محلياً، لكن فشلت المزامنة.', 'error');
    }

    viewFinancialLedger(clientName);
    loadLedger();
    loadClientsList();
    updateDashboard();
}

async function deleteLedgerAdjustment(clientName, adjustmentId) {
    const enteredPassword = prompt('لحذف هذا الإدخال، يرجى إدخال كلمة المرور:', '');
    if (enteredPassword !== PRODUCT_EDIT_PASSWORD) {
        if (enteredPassword !== null) showNotification('كلمة المرور غير صحيحة', 'error');
        return;
    }

    if (!confirm('هل أنت متأكد من حذف هذا الإدخال نهائياً؟')) return;

    const client = clients.find(c => c.name === clientName);
    if (!client || !client.adjustments) return;

    const adjustmentIndex = client.adjustments.findIndex(adj => adj.id === adjustmentId);
    if (adjustmentIndex === -1) {
        showNotification('لم يتم العثور على الإدخال المطلوب للحذف.', 'error');
        return;
    }

    const adjustmentToDelete = client.adjustments[adjustmentIndex];
    client.balance -= adjustmentToDelete.amount;
    client.adjustments.splice(adjustmentIndex, 1);

    localStorage.setItem('clients', JSON.stringify(clients));
    try {
        await sendToCloud({ action: 'saveClient', client: client });
        showNotification('تم حذف الإدخال وتحديث الرصيد بنجاح.');
    } catch (err) {
        console.error('فشل مزامنة حذف الإدخال:', err);
        showNotification('تم الحذف محلياً، لكن فشلت المزامنة.', 'error');
    }

    viewFinancialLedger(clientName);
    loadLedger();
    loadClientsList();
    updateDashboard();
}

function printDebtorsList() {
    const debtors = clients.filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance);
    if (debtors.length === 0) {
        showNotification('لا يوجد بيانات لطباعتها', 'error');
        return;
    }
    let totalDebt = 0;
    const rows = debtors.map(client => {
        totalDebt += client.balance;
        return `<tr><td>${escapeHtml(client.name)}</td><td>${escapeHtml(client.phone || '-')}</td><td style="text-align:center; font-weight: bold;">${client.balance.toFixed(2)}</td></tr>`;
    }).join('');
    const tableHtml = `<table><thead><tr><th>اسم العميل</th><th>الهاتف</th><th style="text-align:center;">المبلغ المستحق (دينار)</th></tr></thead><tbody>${rows}</tbody><tfoot><tr class="grand-total-row"><td colspan="2" style="text-align: right;"><strong>الإجمالي</strong></td><td style="text-align:center;"><strong>${totalDebt.toFixed(2)}</strong></td></tr></tfoot></table>`;
    const bodyHtml = `
    <div class="print-page modern-invoice">
        ${buildOfficialHeader('قائمة الذمم على العملاء')}
        <div class="card">${tableHtml}</div>
        <div class="print-footer">تم إنشاء هذا المستند بواسطة نظام إدارة المصنع | تاريخ الطباعة: ${new Date().toLocaleString('ar-EG')}</div>
    </div>`;
    openProfessionalPrintWindow('قائمة الذمم على العملاء', bodyHtml);
}

// =========================================
// دوال الجرد الأسبوعي
// =========================================
/**
 * Returns the start and end date of the week for a given date.
 * @param {Date} date The date to get the week for.
 * @returns {{startOfWeek: Date, endOfWeek: Date}}
 */
function getWeekBoundaries(date) {
    const d = new Date(date);
    const day = d.getDay(); // Sunday = 0, Saturday = 6
    const diffToSunday = d.getDate() - day;
    const startOfWeek = new Date(d.setDate(diffToSunday));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return { startOfWeek, endOfWeek };
}

function saveInventoryEntries() {
    localStorage.setItem('weeklyInventoryEntries', JSON.stringify(weeklyInventoryEntries));
}

function addInventoryEntry() {
async function addInventoryEntry() {
    const type = document.getElementById('inventory-entry-type').value;
    const itemName = document.getElementById('inventory-item-name').value.trim();
    const quantity = parseFloat(document.getElementById('inventory-item-quantity').value);
    const unit = document.getElementById('inventory-item-unit').value.trim();

    if (!itemName || isNaN(quantity) || !unit) {
        showNotification('يرجى تعبئة جميع حقول حركة المخزون.', 'error');
        return;
    }

    const newEntry = {
        id: `inv_entry_${Date.now()}`,
        date: new Date().toISOString(),
        type,
        itemName,
        quantity,
        unit
    };

    weeklyInventoryEntries.push(newEntry);
    saveInventoryEntries();
    showNotification('تمت إضافة الحركة بنجاح', 'success');
    try {
        await sendToCloud({ action: 'saveInventoryEntry', entry: newEntry });
        showNotification('تمت إضافة الحركة ومزامنتها بنجاح', 'success');
    } catch (err) {
        showNotification('تمت إضافة الحركة محلياً، لكن فشلت المزامنة', 'error');
    }
    
    document.getElementById('inventory-item-name').value = '';
    document.getElementById('inventory-item-quantity').value = '';
    document.getElementById('inventory-item-unit').value = '';

    loadWeeklyInventorySection(); // Refresh the view
}

function deleteInventoryEntry(entryId) {
async function deleteInventoryEntry(entryId) {
    if (confirm('هل أنت متأكد من حذف هذه الحركة؟')) {
        weeklyInventoryEntries = weeklyInventoryEntries.filter(entry => entry.id !== entryId);
        saveInventoryEntries();
        showNotification('تم حذف الحركة', 'success');
        try {
            await sendToCloud({ action: 'deleteInventoryEntry', entryId: entryId });
            showNotification('تم حذف الحركة ومزامنتها بنجاح', 'success');
        } catch (err) {
            showNotification('تم حذف الحركة محلياً، لكن فشلت المزامنة', 'error');
        }
        loadWeeklyInventorySection(); // Refresh the view
    }
}

function displayWeeklyManualEntries(entriesForWeek) {
    const listContainer = document.getElementById('weekly-manual-entries-list');
    listContainer.innerHTML = '';

    if (entriesForWeek.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #777;">لا توجد حركات يدوية مسجلة لهذا الأسبوع.</p>';
        return;
    }

    const typeLabels = { opening: 'رصيد أول المدة', incoming: 'بضاعة واردة', scrap: 'سكراب' };

    let entriesHtml = '<table><thead><tr><th>التاريخ</th><th>النوع</th><th>المادة</th><th>الكمية</th><th>الوحدة</th><th>إجراء</th></tr></thead><tbody>';
    entriesForWeek.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(entry => {
        entriesHtml += `<tr><td>${new Date(entry.date).toLocaleDateString('ar-EG')}</td><td>${typeLabels[entry.type] || entry.type}</td><td>${escapeHtml(entry.itemName)}</td><td>${entry.quantity.toFixed(2)}</td><td>${escapeHtml(entry.unit)}</td><td><button class="btn btn-danger" style="padding: 2px 6px; font-size: 10px;" onclick="deleteInventoryEntry('${entry.id}')"><i class="fas fa-trash"></i></button></td></tr>`;
    });
    entriesHtml += '</tbody></table>';
    listContainer.innerHTML = entriesHtml;
}

function generateAndDisplayWeeklyInventoryReport() {
    const { startOfWeek, endOfWeek } = getWeekBoundaries(new Date());
    const entriesForWeek = weeklyInventoryEntries.filter(e => new Date(e.date) >= startOfWeek && new Date(e.date) <= endOfWeek);
    const invoicesForWeek = invoices.filter(i => new Date(i.date) >= startOfWeek && new Date(i.date) <= endOfWeek);
    const outgoingIronWeight = calculateWeightFromInvoices(invoicesForWeek);
    const inventoryData = {};

    entriesForWeek.forEach(entry => {
        const key = `${entry.itemName}_${entry.unit}`;
        if (!inventoryData[key]) inventoryData[key] = { itemName: entry.itemName, unit: entry.unit, opening: 0, incoming: 0, outgoing: 0, scrap: 0 };
        if (entry.type === 'opening') inventoryData[key].opening += entry.quantity;
        if (entry.type === 'incoming') inventoryData[key].incoming += entry.quantity;
        if (entry.type === 'scrap') inventoryData[key].scrap += entry.quantity;
    });

    const ironKey = 'حديد_كجم';
    if (!inventoryData[ironKey] && outgoingIronWeight > 0) inventoryData[ironKey] = { itemName: 'حديد', unit: 'كجم', opening: 0, incoming: 0, outgoing: 0, scrap: 0 };
    if (inventoryData[ironKey]) inventoryData[ironKey].outgoing = outgoingIronWeight;

    const reportBody = document.getElementById('weekly-inventory-report-body');
    reportBody.innerHTML = '';
    if (Object.keys(inventoryData).length === 0) {
        reportBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">لا توجد بيانات لعرض تقرير الجرد. يرجى إضافة حركات يدوية أولاً.</td></tr>';
        return;
    }
    Object.values(inventoryData).forEach(item => {
        const closingBalance = item.opening + item.incoming - item.outgoing - item.scrap;
        reportBody.innerHTML += `<tr><td>${escapeHtml(item.itemName)}</td><td>${escapeHtml(item.unit)}</td><td>${item.opening.toFixed(2)}</td><td>${item.incoming.toFixed(2)}</td><td>${item.outgoing.toFixed(2)}</td><td>${item.scrap.toFixed(2)}</td><td style="font-weight: bold;">${closingBalance.toFixed(2)}</td></tr>`;
    });
}

function loadWeeklyInventorySection() {
    const { startOfWeek, endOfWeek } = getWeekBoundaries(new Date());
    const entriesForWeek = weeklyInventoryEntries.filter(e => new Date(e.date) >= startOfWeek && new Date(e.date) <= endOfWeek);
    displayWeeklyManualEntries(entriesForWeek);
    generateAndDisplayWeeklyInventoryReport();
    generateAndDisplayFactoryInventoryReport();
}

function printInventoryReport() {
    const reportContainer = document.getElementById('weekly-inventory-report-container').innerHTML;
    const { startOfWeek, endOfWeek } = getWeekBoundaries(new Date());
    const title = `تقرير الجرد الأسبوعي (من ${startOfWeek.toLocaleDateString('ar-EG')} إلى ${endOfWeek.toLocaleDateString('ar-EG')})`;
    const bodyHtml = `<div class="print-page modern-invoice">${buildOfficialHeader(title)}<div class="card">${reportContainer}</div><div class="print-footer">تم إنشاء هذا المستند بواسطة نظام إدارة المصنع | تاريخ الطباعة: ${new Date().toLocaleString('ar-EG')}</div></div>`;
    openProfessionalPrintWindow(title, bodyHtml);
}

function generateAndDisplayFactoryInventoryReport() {
    const allInvoices = invoices; // All invoices
    const allEntries = weeklyInventoryEntries; // All manual entries

    const outgoingIronWeight = calculateWeightFromInvoices(allInvoices);
    const inventoryData = {};

    // Process all manual entries
    allEntries.forEach(entry => {
        const key = `${entry.itemName}_${entry.unit}`;
        if (!inventoryData[key]) {
            inventoryData[key] = { 
                itemName: entry.itemName, 
                unit: entry.unit, 
                opening: 0, 
                incoming: 0, 
                outgoing: 0, 
                scrap: 0 
            };
        }
        if (entry.type === 'opening') inventoryData[key].opening += entry.quantity;
        if (entry.type === 'incoming') inventoryData[key].incoming += entry.quantity;
        if (entry.type === 'scrap') inventoryData[key].scrap += entry.quantity;
    });

    // Add outgoing iron from sales
    const ironKey = 'حديد_كجم';
    if (!inventoryData[ironKey] && outgoingIronWeight > 0) {
        inventoryData[ironKey] = { itemName: 'حديد', unit: 'كجم', opening: 0, incoming: 0, outgoing: 0, scrap: 0 };
    }
    if (inventoryData[ironKey]) {
        inventoryData[ironKey].outgoing = outgoingIronWeight;
    }

    const reportBody = document.getElementById('factory-inventory-report-body');
    reportBody.innerHTML = '';
    if (Object.keys(inventoryData).length === 0) {
        reportBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">لا توجد بيانات لعرض الجرد النهائي.</td></tr>';
        return;
    }

    Object.values(inventoryData).forEach(item => {
        const closingBalance = item.opening + item.incoming - item.outgoing - item.scrap;
        reportBody.innerHTML += `<tr><td>${escapeHtml(item.itemName)}</td><td>${escapeHtml(item.unit)}</td><td>${item.opening.toFixed(2)}</td><td>${item.incoming.toFixed(2)}</td><td>${item.outgoing.toFixed(2)}</td><td>${item.scrap.toFixed(2)}</td><td style="font-weight: bold; color: ${closingBalance >= 0 ? '#2c3e50' : '#e74c3c'};">${closingBalance.toFixed(2)}</td></tr>`;
    });
}

function printFactoryInventoryReport() {
    const reportContainer = document.getElementById('factory-inventory-report-container').innerHTML;
    const title = `الجرد النهائي للمصنع`;
    const bodyHtml = `<div class="print-page modern-invoice">${buildOfficialHeader(title)}<div class="card">${reportContainer}</div><div class="print-footer">تم إنشاء هذا المستند بواسطة نظام إدارة المصنع | تاريخ الطباعة: ${new Date().toLocaleString('ar-EG')}</div></div>`;
    openProfessionalPrintWindow(title, bodyHtml);
}

function buildPaymentReceiptBody(clientName, payment) {
    const title = 'إيصال استلام مبلغ';
    const amountInWords = numberToArabicWords(payment.amount);

    return `
    <div class="print-page modern-invoice">
        ${buildOfficialHeader(title)}
        <div class="card" style="margin-top: 30px; padding: 30px; font-size: 12pt; line-height: 2;">
            <div class="info-grid" style="grid-template-columns: 1fr; gap: 20px;">
                <div class="row"><span><strong>التاريخ:</strong></span><span>${new Date(payment.date).toLocaleDateString('ar-EG')}</span></div>
                <div class="row"><span><strong>استلمنا من السيد/السادة:</strong></span><span>${escapeHtml(clientName)}</span></div>
                <div class="row"><span><strong>مبلغاً وقدره:</strong></span><span style="font-weight: bold;">${escapeHtml(amountInWords)}</span></div>
                <div class="row"><span><strong>وذلك عن طريق:</strong></span><span>${escapeHtml(getPaymentMethodText(payment.method))}</span></div>
                ${payment.method === 'check' && payment.checkDetails ? `
                <div class="row">
                    <span><strong>تفاصيل الشيك:</strong></span>
                    <span>رقم ${escapeHtml(payment.checkDetails.checkNumber)} تاريخ ${escapeHtml(payment.checkDetails.checkDate)}</span>
                </div>
                ` : ''}
            </div>
        </div>
        <div class="signature-section" style="margin-top: 80px;"><div class="signature-box">المستلم<div class="signature-line"></div></div></div>
        <div class="print-footer"><p>هذا الإيصال بمثابة سند قبض للمبلغ المذكور أعلاه.</p></div>
    </div>
    `;
}

function printPaymentReceipt(clientName, payment) {
    const title = 'إيصال استلام مبلغ';
    const bodyHtml = buildPaymentReceiptBody(clientName, payment);
    openProfessionalPrintWindow(title, bodyHtml);
}

function exportPaymentReceiptAsPDF(clientName, payment) {
    const { jsPDF } = window.jspdf;
    showNotification('جاري تجهيز ملف PDF للإيصال...', 'success');

    const printContainer = document.createElement('div');
    printContainer.style.position = 'absolute';
    printContainer.style.left = '-9999px';
    document.body.appendChild(printContainer);

    const bodyHtml = buildPaymentReceiptBody(clientName, payment);
    printContainer.innerHTML = `<style>${getPrintStyles()}</style>${bodyHtml}`;
    
    const receiptElement = printContainer.querySelector('.print-page');
    
    html2canvas(receiptElement, { scale: 3, useCORS: true, logging: false }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        
        const PDF_MARGIN = 15;
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const printableWidth = pdfWidth - (PDF_MARGIN * 2);
        const printableHeight = pdfHeight - (PDF_MARGIN * 2);
        
        const ratio = canvas.width / canvas.height;
        let imgWidth = printableWidth;
        let imgHeight = imgWidth / ratio;
        
        if (imgHeight > printableHeight) {
            imgHeight = printableHeight;
            imgWidth = imgHeight * ratio;
        }
        
        const xOffset = PDF_MARGIN + (printableWidth - imgWidth) / 2;
        const yOffset = PDF_MARGIN + (printableHeight - imgHeight) / 2;
        
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
        pdf.save(`إيصال-استلام-${clientName}-${new Date(payment.date).toLocaleDateString('en-CA')}.pdf`);
        
        document.body.removeChild(printContainer);
        showNotification('تم تحميل الإيصال كملف PDF بنجاح.');
    }).catch(err => {
        console.error("خطأ في إنشاء PDF للإيصال:", err);
        showNotification('حدث خطأ أثناء إنشاء ملف PDF', 'error');
        document.body.removeChild(printContainer);
    });
}

function getAllPayments() {
    const allPayments = [];
    clients.forEach(client => {
        if (client.payments && Array.isArray(client.payments)) {
            client.payments.forEach(p => {
                allPayments.push({
                    clientName: client.name,
                    date: p.date,
                    amount: p.amount,
                    method: p.method,
                    details: p.method === 'check' && p.checkDetails ? `شيك رقم: ${p.checkDetails.checkNumber}` : 'دفعة عادية'
                });
            });
        }
        if (client.adjustments && Array.isArray(client.adjustments)) {
            client.adjustments.forEach(adj => {
                if (adj.amount < 0) {
                    allPayments.push({
                        clientName: client.name,
                        date: adj.date,
                        amount: -adj.amount,
                        method: 'manual',
                        details: adj.reason || 'تسوية يدوية'
                    });
                }
            });
        }
    });
    allPayments.sort((a, b) => new Date(b.date) - new Date(a.date));
    return allPayments;
}

function displayAllPayments(filteredPayments) {
    const tbody = document.getElementById('payments-log-body');
    const totalAmountEl = document.getElementById('total-payments-log-amount');
    tbody.innerHTML = '';
    if (filteredPayments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">لا توجد دفعات مطابقة لمعايير البحث.</td></tr>';
        totalAmountEl.textContent = '0.00';
        return;
    }
    let totalAmount = 0;
    filteredPayments.forEach(p => {
        totalAmount += p.amount;
        const row = tbody.insertRow();
        row.innerHTML = `<td>${new Date(p.date).toLocaleDateString('ar-EG')}</td><td>${escapeHtml(p.clientName)}</td><td>${p.amount.toFixed(2)}</td><td>${getPaymentMethodText(p.method)}</td><td>${escapeHtml(p.details)}</td>`;
    });
    totalAmountEl.textContent = totalAmount.toFixed(2);
}

function loadPaymentsLog() {
    allPaymentsCache = getAllPayments();
    displayAllPayments(allPaymentsCache);
    document.getElementById('payments-log-client-search').value = '';
    document.getElementById('payments-log-method-filter').value = '';
    document.getElementById('payments-log-date-from').value = '';
    document.getElementById('payments-log-date-to').value = '';
}

function applyPaymentsLogFilter() {
    const clientSearch = document.getElementById('payments-log-client-search').value.toLowerCase();
    const methodFilter = document.getElementById('payments-log-method-filter').value;
    const dateFrom = document.getElementById('payments-log-date-from').value;
    const dateTo = document.getElementById('payments-log-date-to').value;
    let filtered = allPaymentsCache;
    if (clientSearch) {
        filtered = filtered.filter(p => p.clientName.toLowerCase().includes(clientSearch));
    }
    if (methodFilter) {
        filtered = filtered.filter(p => p.method === methodFilter);
    }
    if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        filtered = filtered.filter(p => new Date(p.date) >= from);
    }
    if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter(p => new Date(p.date) <= to);
    }
    displayAllPayments(filtered);
}

function printPaymentsLog() {
    const tableContainer = document.getElementById('payments-log-container').innerHTML;
    const totalAmount = document.getElementById('total-payments-log-amount').textContent;
    const title = 'سجل الدفعات العام';
    const bodyHtml = `
    <div class="print-page modern-invoice">
        ${buildOfficialHeader(title)}
        <div class="card">${tableContainer}</div>
        <div class="card" style="text-align: center; font-size: 16px; margin-top: 20px;">
            <strong>إجمالي الدفعات المعروضة: ${totalAmount} دينار</strong>
        </div>
        <div class="print-footer">تم إنشاء هذا المستند بواسطة نظام إدارة المصنع | تاريخ الطباعة: ${new Date().toLocaleString('ar-EG')}</div>
    </div>`;
    openProfessionalPrintWindow(title, bodyHtml);
}

// =========================================
// ربط الأحداث (Event Listeners)
// =========================================
document.getElementById('print-output-weight-report').addEventListener('click', printOutputWeightReport);
document.getElementById('print-thickness-summary').addEventListener('click', () => printElementContent('steel-thickness-purchases', 'ملخص المبيعات حسب السماكة'));
document.getElementById('print-products-summary').addEventListener('click', () => printElementContent('product-sales-totals', 'ملخص المبيعات حسب المنتج'));
document.getElementById('update-date-btn').addEventListener('click', updateDatesFromInput);
document.getElementById('add-product').addEventListener('click', addProductRow);
document.getElementById('calculate-totals').addEventListener('click', function() { calculateTotals(); updatePaymentBalance(); });
document.getElementById('print-invoice').addEventListener('click', function() {
    updateDatesFromInput();
    document.getElementById('print-time').textContent = `وقت الطباعة: ${new Date().toLocaleTimeString('ar-EG')}`;
    printCurrentInvoiceFromForm();
});
document.getElementById('export-current-invoice-pdf').addEventListener('click', exportCurrentInvoiceAsPDF);
document.getElementById('save-invoice').addEventListener('click', saveInvoice);
document.getElementById('reset-invoice').addEventListener('click', function() { if (confirm('هل أنت متأكد من إعادة تعيين طلب البيع؟ سيتم حذف جميع البيانات.')) resetInvoiceForm(); });
document.getElementById('save-client').addEventListener('click', saveClient);
document.getElementById('clear-all-clients').addEventListener('click', function() {
    document.getElementById('deleteModal').style.display = 'flex';
    document.getElementById('passwordInput').value = '';
});
document.getElementById('confirmDelete').addEventListener('click', async function() {
    const password = document.getElementById('passwordInput').value;
    if (password === DELETE_PASSWORD) {
        clients = [];
        localStorage.setItem('clients', JSON.stringify(clients));
        loadClientsList();
        document.getElementById('deleteModal').style.display = 'none';
        document.getElementById('passwordInput').value = '';
        try {
            const cloudResult = await sendToCloud({ action: 'clearAllClients' });
            if (cloudResult) await fetchCloudData();
            showNotification('تم مسح جميع العملاء بنجاح');
        } catch (err) {
            console.error('فشل مسح العملاء من السحابة:', err);
            showNotification('تم مسح العملاء محليًا لكن لم يتم حذفهم من السحابة', 'error');
        }
        updateDashboard();
    } else {
        showNotification('كلمة المرور غير صحيحة', 'error');
    }
});
document.getElementById('cancelDelete').addEventListener('click', function() {
    document.getElementById('deleteModal').style.display = 'none';
    document.getElementById('passwordInput').value = '';
});
document.getElementById('clear-all-invoices').addEventListener('click', async function() {
    if (confirm('هل أنت متأكد من مسح جميع طلبات البيع؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        const password = prompt('يرجى إدخال كلمة المرور للمتابعة:');
        if (password === DELETE_PASSWORD) {
            invoices = [];
            localStorage.setItem('invoices', JSON.stringify(invoices));
            loadInvoicesHistory();
            try {
                const cloudResult = await sendToCloud({ action: 'clearAllInvoices' });
                if (cloudResult) await fetchCloudData();
                showNotification('تم مسح جميع طلبات البيع بنجاح');
            } catch (err) {
                console.error('فشل مسح طلبات البيع من السحابة:', err);
                showNotification('تم مسح طلبات البيع محليًا لكن لم يتم حذفها من السحابة', 'error');
            }
            updateDashboard();
        } else {
            showNotification('كلمة المرور غير صحيحة', 'error');
        }
    }
});
document.getElementById('clear-all-purchases').addEventListener('click', async function() {
    if (confirm('هل أنت متأكد من مسح جميع سجل المبيعات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        const password = prompt('يرجى إدخال كلمة المرور للمتابعة:');
        if (password === DELETE_PASSWORD) {
            purchaseHistory = [];
            localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));
            loadPurchaseHistory();
            loadSteelThicknessPurchases();
            loadProductSalesTotals();
            try {
                const cloudResult = await sendToCloud({ action: 'clearAllPurchases' });
                if (cloudResult) await fetchCloudData();
                showNotification('تم مسح جميع المبيعات بنجاح');
            } catch (err) {
                console.error('فشل مسح المبيعات من السحابة:', err);
                showNotification('تم مسح المبيعات محليًا لكن لم يتم حذفها من السحابة', 'error');
            }
            updateDashboard();
        } else {
            showNotification('كلمة المرور غير صحيحة', 'error');
        }
    }
});
document.getElementById('search-client-btn').addEventListener('click', searchClient);
document.getElementById('client-search').addEventListener('input', function() { autocompleteClient(this.value); });
document.getElementById('filter-clients').addEventListener('input', function() { filterClients(this.value); });
document.getElementById('search-history-btn').addEventListener('click', searchInvoicesHistory);
document.getElementById('search-purchase-btn').addEventListener('click', searchPurchaseHistory);
document.getElementById('add-payment').addEventListener('click', addPayment);
document.getElementById('cancel-payment').addEventListener('click', function() { document.getElementById('paymentModal').style.display = 'none'; });
document.getElementById('payment-method-select').addEventListener('change', function() {
    document.getElementById('client-payment-check-fields').style.display = this.value === 'check' ? 'grid' : 'none';
});
document.getElementById('client-check-image').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const preview = document.getElementById('client-check-preview');
            preview.src = ev.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});
document.getElementById('set-full-payment').addEventListener('click', function() {
    document.getElementById('paid-amount').value = (parseFloat(document.getElementById('grand-total').textContent) || 0).toFixed(2);
    updatePaymentBalance();
});
document.getElementById('paid-amount').addEventListener('input', updatePaymentBalance);
document.getElementById('enable-multiple-payments').addEventListener('change', function() {
    if (this.checked) {
        document.getElementById('multiple-payments-section').style.display = 'block';
        document.getElementById('single-payment-section').style.display = 'none';
    } else {
        document.getElementById('multiple-payments-section').style.display = 'none';
        document.getElementById('single-payment-section').style.display = 'block';
    }
    updatePaymentBalance();
});
document.getElementById('calculate-salary').addEventListener('click', calculateSalary);
document.getElementById('print-salary').addEventListener('click', printSalary);
document.getElementById('save-salary').addEventListener('click', saveSalary);
document.getElementById('calculation-type').addEventListener('change', setupCalculatorInputs);
document.getElementById('calculate-steel').addEventListener('click', calculateSteel);
document.getElementById('reset-calculator').addEventListener('click', resetCalculator);
document.getElementById('print-daily-report').addEventListener('click', () => printReport('daily'));
document.getElementById('print-weekly-report').addEventListener('click', () => printReport('weekly'));
document.getElementById('print-monthly-report').addEventListener('click', () => printReport('monthly'));
document.getElementById('print-annual-report').addEventListener('click', () => printReport('annual'));
document.getElementById('add-ledger-entry').addEventListener('click', addLedgerEntry);
document.getElementById('print-debtors-list').addEventListener('click', printDebtorsList);
document.getElementById('add-inventory-entry').addEventListener('click', addInventoryEntry);
document.getElementById('print-inventory-report').addEventListener('click', printInventoryReport);
document.getElementById('print-factory-inventory-report').addEventListener('click', printFactoryInventoryReport);
document.getElementById('apply-payments-log-filter').addEventListener('click', applyPaymentsLogFilter);
document.getElementById('reset-payments-log-filter').addEventListener('click', loadPaymentsLog);
document.getElementById('print-payments-log').addEventListener('click', printPaymentsLog);
document.getElementById('update-quote-date-btn').addEventListener('click', updateQuoteDatesFromInput);
document.getElementById('add-quote-product').addEventListener('click', addQuoteProductRow);
document.getElementById('calculate-quote-totals').addEventListener('click', calculateQuoteTotals);
document.getElementById('print-quote').addEventListener('click', printCurrentQuote);
document.getElementById('export-current-quote-pdf').addEventListener('click', exportQuoteAsPDF);
document.getElementById('reset-quote').addEventListener('click', resetQuoteForm);
document.getElementById('ledger-client-search').addEventListener('input', function() {
    const searchTerm = this.value;
    if (searchTerm.length < 1) {
        document.getElementById('ledger-client-autocomplete-list').innerHTML = '';
        return;
    }
    const listElement = document.getElementById('ledger-client-autocomplete-list');
    listElement.innerHTML = '';
    if (searchTerm.length < 1) return;
    const filteredClients = clients.filter(client => client.name.toLowerCase().includes(searchTerm.toLowerCase()));
    filteredClients.forEach(client => {
        const item = document.createElement('div');
        item.textContent = client.name;
        item.addEventListener('click', function() {
            document.getElementById('ledger-client-search').value = client.name;
            listElement.innerHTML = '';
        });
        listElement.appendChild(item);
    });
});
document.getElementById('closeLedger').addEventListener('click', function() {
    document.getElementById('ledgerModal').style.display = 'none';
});
document.getElementById('save-product-modal').addEventListener('click', saveProductFromModal);
document.getElementById('cancel-product-modal').addEventListener('click', closeProductModal);
document.getElementById('clear-product-modal-form').addEventListener('click', clearProductModalForm);
document.getElementById('modal-product-search').addEventListener('input', function() { populateProductEditorList(this.value); });
document.getElementById('printReceiptOptionBtn').addEventListener('click', function() {
    if (lastAddedPaymentInfo) {
        printPaymentReceipt(lastAddedPaymentInfo.clientName, lastAddedPaymentInfo.payment);
    }
    document.getElementById('receiptOptionsModal').style.display = 'none';
});
document.getElementById('pdfReceiptOptionBtn').addEventListener('click', function() {
    if (lastAddedPaymentInfo) {
        exportPaymentReceiptAsPDF(lastAddedPaymentInfo.clientName, lastAddedPaymentInfo.payment);
    }
    document.getElementById('receiptOptionsModal').style.display = 'none';
});
document.getElementById('closeReceiptOptionsModal').addEventListener('click', function() {
    document.getElementById('receiptOptionsModal').style.display = 'none';
});

document.getElementById('printLedger').addEventListener('click', function() {
    const clientName = document.getElementById('ledger-client-name').querySelector('strong').textContent;
    const ledgerContent = document.getElementById('ledger-content').innerHTML;
    const finalBalance = document.getElementById('ledger-client-name').querySelector('div').innerHTML;
    const cleanLedgerContent = ledgerContent.replace(/style="[^"]*"/g, '');
    const printBody = `
        <div class="header"><div class="header-text"><h1>مصنع أحمد العاروري</h1><h2>كشف حساب العميل: ${escapeHtml(clientName)}</h2><div class="sub-title">تاريخ الطباعة: ${escapeHtml(new Date().toLocaleDateString('ar-EG'))}</div></div></div>
        <div class="card">${cleanLedgerContent}</div>
        <div class="card" style="text-align: center; font-size: 16px; margin-top: 20px;">${finalBalance}</div>
        <div class="footer">تمت الطباعة من نظام إدارة المصنع</div>
    `;
    openProfessionalPrintWindow(`كشف حساب - ${clientName}`, printBody);
});

// =========================================
// إعداد التبويبات
// =========================================
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        document.getElementById(this.getAttribute('data-tab') + '-tab').classList.add('active');
        if (this.getAttribute('data-tab') === 'clients') loadClientsList();
        else if (this.getAttribute('data-tab') === 'history') loadInvoicesHistory();
        else if (this.getAttribute('data-tab') === 'purchases') loadPurchaseHistory();
        else if (this.getAttribute('data-tab') === 'employees') loadEmployeeSalaries();
        else if (this.getAttribute('data-tab') === 'calculator') setupCalculator();
        else if (this.getAttribute('data-tab') === 'reports') { loadReports(); fetchCloudReports(); }
        else if (this.getAttribute('data-tab') === 'ledger') loadLedger();
        else if (this.getAttribute('data-tab') === 'inventory') loadWeeklyInventorySection();
        else if (this.getAttribute('data-tab') === 'payments-log') loadPaymentsLog();
        else if (this.getAttribute('data-tab') === 'quote') setupQuoteTab();
        updateDashboard();
    });
});

document.querySelectorAll('.report-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.report-content').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        document.getElementById(this.getAttribute('data-report') + '-report').classList.add('active');
        currentSalesPage = 1;
        if (this.getAttribute('data-report') === 'daily') loadDailyReport();
        else if (this.getAttribute('data-report') === 'weekly') loadWeeklyReport();
        else if (this.getAttribute('data-report') === 'monthly') loadMonthlyReport();
        else if (this.getAttribute('data-report') === 'annual') loadAnnualReport();
    });
});

// =========================================
// بدء التشغيل
// =========================================
window.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    setDefaultDates();
    addProductRow();
    loadClientsList();
    loadInvoicesHistory();
    setupMultiplePayments();
    loadReports();
    setupCalculator();
    updateDashboard();
    startAutoRefresh();
    fetchCloudData();
    window.deleteInventoryEntry = deleteInventoryEntry;
});