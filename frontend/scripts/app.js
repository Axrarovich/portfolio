// app.js
let products = [];
let categories = [];

const productList = document.getElementById("productList");
const cartItems = document.getElementById("cartItems");
const orderBtn = document.getElementById("orderBtn");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

const newName = document.getElementById("newName");
const newPrice = document.getElementById("newPrice");
const newCategoryInput = document.getElementById("newCategory");
const newInfo = document.getElementById("newInfo");
const newImageFile = document.getElementById("newImageFile");
const addBtn = document.getElementById("addBtn");

// Kategoriya modal elementlari
const categoryList = document.getElementById("categoryList");
const categoryModal = document.getElementById("categoryModal");
const saveCategoryBtn = document.getElementById("saveCategoryBtn");
const cancelCategoryBtn = document.getElementById("cancelCategoryBtn");
const newCategoryName = document.getElementById("newCategoryName");

// Mahsulot modal elementlari
const productModal = document.getElementById("productModal");
const pmImage = document.getElementById("pmImage");
const pmName = document.getElementById("pmName");
const pmInfo = document.getElementById("pmInfo");
const pmPrice = document.getElementById("pmPrice");
const pmCategory = document.getElementById("pmCategory");
const pmClose = document.getElementById("pmClose");

// ======= FETCH PRODUCTS =======
async function fetchProducts() {
    const res = await fetch("/api/products");
    const data = await res.json();
    products = data.products;
    categories = data.categories;
    renderProducts();
    renderCategories();
}

// ======= RENDER PRODUCTS =======
function renderProducts() {
    productList.innerHTML = "";
    const search = searchInput.value.toLowerCase();
    const filter = categoryFilter.value;

    products.filter(p =>
        (p.name.toLowerCase().includes(search)) &&
        (filter === "" || p.category === filter)
    ).forEach(p => {
        const div = document.createElement("div");
        div.className = "product";
        div.onclick = () => openProductWindow(p.id);
        div.innerHTML = `
            <img class="thumb" src="${p.image || 'https://via.placeholder.com/100?text=No+Image'}" alt="${p.name}" />
            <div class="content">
                <div class="pi-name">${p.name}</div>
                <div class="pi-price">$${p.price}</div>
                <div class="product-info-row">
                    <span class="pi-cat">${p.category}</span>
                    <span class="pi-info">${p.info || ''}</span>
                </div>
            </div>
            <div class="arrow">›</div>
        `;
        productList.appendChild(div);
    });
    renderCart();
}

// ======= RENDER CATEGORIES =======
function renderCategories() {
    categoryFilter.innerHTML = `<option value="">Barchasi</option>`;
    categoryList.innerHTML = "";

    categories.forEach(c => {
        // filter selectga qo'shish
        categoryFilter.innerHTML += `<option value="${c}">${c}</option>`;
        // dropdownga qo'shish (mavjud kategoriya)
        const li = document.createElement("li");
        li.textContent = c;
        li.onclick = () => {
            newCategoryInput.value = c;
            categoryList.style.display = "none";
        };
        categoryList.appendChild(li);
    });

    // oxirida: Kategoriya qo'shish
    const addLi = document.createElement('li');
    addLi.textContent = "Kategoriya qo'shish";
    addLi.className = 'add-category-option';
    addLi.onclick = () => {
        newCategoryName.value = '';
        categoryModal.style.display = 'flex';
    };
    categoryList.appendChild(addLi);
}

// ======= RENDER CART =======
function renderCart() {
    cartItems.innerHTML = "";
    const cart = products.filter(p => p.quantity > 0);

    cart.forEach(p => {
        const div = document.createElement("div");
        div.className = "cartItem";
        div.innerHTML = `
            <div class="cart-info">
                <span class="cart-name">${p.name}</span>
                <span class="cart-sep"></span>
                ${p.info ? `<span class="cart-desc">${p.info}</span><span class="cart-sep"></span>` : ``}
                <span class="cart-price">$${p.price}</span>
            </div>
            <div class="cart-controls">
                <button class="btn-minus" onclick="updateCart(${p.id}, 'remove')">-</button>
                <span class="cart-qty">${p.quantity}</span>
                <button class="btn-plus" onclick="updateCart(${p.id}, 'add')">+</button>
            </div>
        `;
        cartItems.appendChild(div);
    });

    // Buyurtma berish tugmasi faqat savatda mahsulot bo'lsa ko'rinadi
    orderBtn.style.display = cart.length > 0 ? "block" : "none";
}

async function ensureToken() {
    let token = localStorage.getItem('tg_token');
    const btn = document.getElementById('connectTelegram');
    if (!token) {
        const res = await fetch('/api/create-link-token');
        const data = await res.json();
        token = data.token;
        localStorage.setItem('tg_token', token);
        // show link to user
        btn.href = `https://t.me/Myapp_miniapp_bot?start=${token}`;
    } else {
        // hamma joyda linkni yangilash
        btn.href = `https://t.me/Myapp_miniapp_bot?start=${token}`;
    }
}
ensureToken();

orderBtn.addEventListener("click", async () => {
    const token = localStorage.getItem('tg_token');
    if (!token) return alert("Iltimos Telegram bilan bog'laning.");

    const res = await fetch("/api/order", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ token })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.message || 'Xato');
    alert("Buyurtma yuborildi!");
    fetchProducts();
});


// ======= UPDATE CART =======
async function updateCart(id, action) {
    // Optimistic UI update: immediately reflect changes without full page refresh
    const p = products.find(x => x.id === id);
    if (p) {
        const delta = action === 'add' ? 1 : -1;
        p.quantity = Math.max(0, (p.quantity || 0) + delta);
        // Update cart panel and, if open, detail view
        renderCart();
        if (selectedProductId === id) {
            renderDetailView();
        }
    }

    // Sync with server in background
    try {
        const res = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, action })
        });
        if (!res.ok) {
            // Revert optimistic change on error
            if (p) {
                const delta = action === 'add' ? -1 : 1;
                p.quantity = Math.max(0, (p.quantity || 0) + delta);
                renderCart();
                if (selectedProductId === id) {
                    renderDetailView();
                }
            }
        } else {
            // Optionally reconcile with server's authoritative value
            const serverProduct = await res.json();
            if (p && typeof serverProduct.quantity === 'number') {
                p.quantity = serverProduct.quantity;
                renderCart();
                if (selectedProductId === id) {
                    renderDetailView();
                }
            }
        }
    } catch (e) {
        // Network error: revert optimistic change
        if (p) {
            const delta = action === 'add' ? -1 : 1;
            p.quantity = Math.max(0, (p.quantity || 0) + delta);
            renderCart();
            if (selectedProductId === id) {
                renderDetailView();
            }
        }
    }
}

// ======= ADD NEW PRODUCT =======
addBtn.addEventListener("click", async () => {
    if (!newName.value || !newPrice.value || !newCategoryInput.value || !newImageFile.files || newImageFile.files.length === 0) {
        return alert("Mahsulot nomi, narxi, kategoriya va rasm majburiy!");
    }

    const formData = new FormData();
    formData.append('name', newName.value);
    formData.append('price', String(Number(newPrice.value)));
    formData.append('category', newCategoryInput.value);
    formData.append('info', newInfo.value);
    formData.append('image', newImageFile.files[0]);

    const res = await fetch("/api/products", {
        method: "POST",
        body: formData
    });
    const data = await res.json();
    if (!res.ok) {
        return alert(data.message || 'Xatolik yuz berdi');
    }
    newName.value = "";
    newPrice.value = "";
    newInfo.value = "";
    newImageFile.value = "";
    newCategoryInput.value = "";
    fetchProducts();
});

// ======= ORDER =======
orderBtn.addEventListener("click", async () => {
    await fetch("/api/order", { method: "POST" });
    fetchProducts();
});

// ======= SEARCH & FILTER =======
searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);

// ======= CATEGORY DROPDOWN =======
newCategoryInput.addEventListener("click", () => {
    if (categories.length > 0) {
        categoryList.style.display = "block";
    }
});

document.addEventListener("click", e => {
    if (!newCategoryInput.contains(e.target) &&
        !categoryList.contains(e.target)) {
        categoryList.style.display = "none";
    }
});

// ======= CATEGORY MODAL =======

saveCategoryBtn.addEventListener("click", () => {
    const cat = newCategoryName.value.trim();
    if (!cat) return alert("Kategoriya nomi bo'sh bo'lishi mumkin emas!");
    if (categories.includes(cat)) return alert("Bu kategoriya allaqachon mavjud!");

    categories.push(cat);
    newCategoryInput.value = cat;
    categoryModal.style.display = "none";
    renderCategories(); // yangi kategoriya dropdownga qo'shilsin
});

cancelCategoryBtn.addEventListener("click", () => {
    categoryModal.style.display = "none";
});

// ======= PRODUCT MODAL =======
function openProductDetails(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    pmImage.src = p.image || 'https://via.placeholder.com/300x200?text=No+Image';
    pmName.textContent = p.name;
    pmInfo.textContent = p.info || '';
    pmPrice.textContent = `Narxi: $${p.price}`;
    pmCategory.textContent = `Kategoriya: ${p.category}`;
    productModal.style.display = 'flex';
}

pmClose.addEventListener('click', () => {
    productModal.style.display = 'none';
});

productModal.addEventListener('click', (e) => {
    if (e.target === productModal) {
        productModal.style.display = 'none';
    }
});

// ======= FULLSCREEN DETAIL VIEW =======
const detailView = document.getElementById('detailView');
const dvBack = document.getElementById('dvBack');
const dvHero = document.getElementById('dvHero');
const dvList = document.getElementById('dvList');
let selectedProductId = null;

function openProductWindow(id) {
    selectedProductId = id;
    renderDetailView();
    detailView.style.display = 'block';
    // always start at top when opening
    detailView.scrollTo({ top: 0, behavior: 'instant' in document ? 'instant' : 'auto' });
}

function closeProductWindow() {
    detailView.style.display = 'none';
    selectedProductId = null;
}

dvBack.addEventListener('click', () => {
    closeProductWindow();
});

function renderDetailView() {
    const p = products.find(x => x.id === selectedProductId);
    if (!p) return;
    // Hero section (full first screen)
    dvHero.innerHTML = `
        <img src="${p.image || 'https://via.placeholder.com/600x400?text=No+Image'}" alt="${p.name}" />
        <h2 style="margin:10px 0 6px 0;">${p.name}</h2>
        <div class="price">$${p.price}</div>
        <div style="opacity:0.8;">${p.category}</div>
        <p style="text-align:center;">${p.info || ''}</p>
        <div class="detail-actions">
            <button onclick="updateCart(${p.id}, 'remove')">-</button>
            <span>${p.quantity}</span>
            <button onclick="updateCart(${p.id}, 'add')">+</button>
        </div>
    `;

    // Remaining products list
    dvList.innerHTML = '';
    products.filter(x => x.id !== p.id).forEach(item => {
        const row = document.createElement('div');
        row.className = 'detail-item';
        row.innerHTML = `
            <img src="${item.image || 'https://via.placeholder.com/100?text=No+Image'}" alt="${item.name}">
            <div style="flex:1; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <span style="font-weight:600;">${item.name}</span>
                <span style="font-size:12px;opacity:0.8;">$${item.price}</span>
                <span style="font-size:12px;opacity:0.8;">${item.category}</span>
                <span style="font-size:12px;opacity:0.8;">${item.info || ''}</span>
            </div>
        `;
        row.addEventListener('click', () => {
            // promote this item to primary
            selectedProductId = item.id;
            renderDetailView();
            detailView.scrollTo({ top: 0, behavior: 'smooth' });
        });
        dvList.appendChild(row);
    });
}

// ======= INIT =======
fetchProducts();
