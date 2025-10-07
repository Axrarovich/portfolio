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
const addBtn = document.getElementById("addBtn");

// Kategoriya modal elementlari
const categoryList = document.getElementById("categoryList");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const categoryModal = document.getElementById("categoryModal");
const saveCategoryBtn = document.getElementById("saveCategoryBtn");
const cancelCategoryBtn = document.getElementById("cancelCategoryBtn");
const newCategoryName = document.getElementById("newCategoryName");

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
        div.innerHTML = `
            <h3>${p.name}</h3>
            <p>${p.info}</p>
            <p>$${p.price}</p>
            <p>Kategoriya: ${p.category}</p>
            <button onclick="updateCart(${p.id}, 'remove')">-</button>
            <span>${p.quantity}</span>
            <button onclick="updateCart(${p.id}, 'add')">+</button>
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

        // dropdownga qo'shish
        const li = document.createElement("li");
        li.textContent = c;
        li.onclick = () => {
            newCategoryInput.value = c;
            categoryList.style.display = "none";
        };
        categoryList.appendChild(li);
    });
}

// ======= RENDER CART =======
function renderCart() {
    cartItems.innerHTML = "";
    const cart = products.filter(p => p.quantity > 0);

    cart.forEach(p => {
        const div = document.createElement("div");
        div.className = "cartItem";
        div.innerHTML = `
            <span>${p.name} (${p.category}) - ${p.quantity} ta - $${p.price}</span>
            <button onclick="updateCart(${p.id}, 'remove')">-</button>
            <button onclick="updateCart(${p.id}, 'add')">+</button>
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
    await fetch("/api/cart", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ id, action })
    });
    fetchProducts();
}

// ======= ADD NEW PRODUCT =======
addBtn.addEventListener("click", async () => {
    if (!newName.value || !newPrice.value || !newCategoryInput.value) {
        return alert("Mahsulot nomi, narxi va kategoriyasi to‘ldirilishi kerak!");
    }
    const newProduct = {
        name: newName.value,
        price: Number(newPrice.value),
        category: newCategoryInput.value,
        info: newInfo.value
    };
    await fetch("/api/products", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(newProduct)
    });
    newName.value = "";
    newPrice.value = "";
    newInfo.value = "";
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
        !categoryList.contains(e.target) &&
        e.target !== addCategoryBtn) {
        categoryList.style.display = "none";
    }
});

// ======= CATEGORY MODAL =======
addCategoryBtn.addEventListener("click", () => {
    newCategoryName.value = "";
    categoryModal.style.display = "flex";
});

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

// ======= INIT =======
fetchProducts();
