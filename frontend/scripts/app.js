(() => {
    const CART_KEY = 'mobis_cart_v1';

    // Mahsulotlar ma'lumotlarini shu yerga joylashtiramiz
    const productsData = [
      {
        "id": 1,
        "name": "Stol",
        "price": 350000,
        "category": "Mebel",
        "info": "Yog'ochdan tayyorlangan stol, 120x60 sm.",
        "image": "logo/mobis_logo.jpg"
      },
      {
              "id": 1,
              "name": "Stol",
              "price": 350000,
              "category": "Mebel",
              "info": "Yog'ochdan tayyorlangan stol, 120x60 sm.",
              "image": "logo/mobis_logo.jpg"
            },{
                      "id": 1,
                      "name": "Stol",
                      "price": 350000,
                      "category": "Mebel",
                      "info": "Yog'ochdan tayyorlangan stol, 120x60 sm.",
                      "image": "logo/mobis_logo.jpg"
                    },{
                              "id": 1,
                              "name": "Stol",
                              "price": 350000,
                              "category": "Mebel",
                              "info": "Yog'ochdan tayyorlangan stol, 120x60 sm.",
                              "image": "logo/mobis_logo.jpg"
                            },
      {
        "id": 2,
        "name": "Kreslo",
        "price": 280000,
        "category": "Mebel",
        "info": "Qulay yumshoq kreslo, maksimal qulaylik.",
        "image": "logo/mobis_logo.jpg"
      },
      {
        "id": 3,
        "name": "Lampochka",
        "price": 15000,
        "category": "Elektr jihozlar",
        "info": "LED lampochka 9W, issiq yorug'lik.",
        "image": "logo/mobis_logo.jpg"
      }
    ];

    // DOM
    const productListEl = document.getElementById('productList');
    const categoryFilterEl = document.getElementById('categoryFilter');
    const searchInputEl = document.getElementById('searchInput');
    const cartBtn = document.getElementById('cartBtn');
    const cartModal = document.getElementById('cartModal');
    const cartItemsEl = document.getElementById('cartItems');
    const cartTotalEl = document.getElementById('cartTotal');
    const closeCartBtn = document.getElementById('closeCart');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const cartBadge = document.getElementById('cartBadge');

    let products = [];
    let categories = new Set();
    let cart = JSON.parse(localStorage.getItem(CART_KEY) || '{}');

    function saveCart() {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        renderCartBadge();
    }

    function renderCartBadge() {
        const totalQty = Object.values(cart).reduce((s, q) => s + q, 0);
        if (totalQty > 0) {
            cartBadge.style.display = 'inline-block';
            cartBadge.textContent = totalQty;
        } else {
            cartBadge.style.display = 'none';
        }
    }

    // Ma'lumotlarni yuklash funksiyasini o'zgartiramiz
    function initializeApp() {
        products = productsData;
        products.forEach(p => categories.add(p.category));
        populateCategoryOptions();
        renderProducts();
        renderCartBadge();
    }

    function populateCategoryOptions() {
        categoryFilterEl.innerHTML = '<option value="">Barchasi</option>';
        Array.from(categories).sort().forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            categoryFilterEl.appendChild(opt);
        });
    }

    function renderProducts() {
        const q = searchInputEl.value.trim().toLowerCase();
        const cat = categoryFilterEl.value;
        productListEl.innerHTML = '';

        const filtered = products.filter(p => {
            const matchQ = !q || (p.name && p.name.toLowerCase().includes(q)) || (p.info && p.info.toLowerCase().includes(q));
            const matchCat = !cat || p.category === cat;
            return matchQ && matchCat;
        });

        if (filtered.length === 0) {
            productListEl.innerHTML = `<p style="text-align:center; color:gray; width:100%;">Mahsulot topilmadi</p>`;
            return;
        }

        filtered.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product';
            card.style.position = 'relative';

            const qty = cart[p.id] || 0;

            card.innerHTML = `
                <img src="${p.image}" alt="${p.name}" class="thumb">
                <div class="content">
                    <span class="pi-name" title="${escapeHtml(p.name)}">${p.name}</span>
                    <span class="pi-price">${formatCurrency(p.price)} so‘m</span>
                    <span class="pi-cat">${p.category}</span>
                    <span class="pi-info">${p.info || ''}</span>
                </div>
                <span class="arrow">➜</span>
            `;

            const qtyWrap = document.createElement('div');
            qtyWrap.className = 'product-qty-controls';
            qtyWrap.style.position = 'absolute';
            qtyWrap.style.right = '12px';
            qtyWrap.style.top = '12px';
            qtyWrap.style.display = 'flex';
            qtyWrap.style.alignItems = 'center';
            qtyWrap.style.gap = '6px';
            qtyWrap.innerHTML = `
                <button class="btn-minus" aria-label="Kamaytir">−</button>
                <span class="prod-qty" style="min-width:26px; text-align:center; font-weight:600;">${qty}</span>
                <button class="btn-plus" aria-label="Ko'paytir">+</button>
            `;
            card.appendChild(qtyWrap);

            const btnPlus = qtyWrap.querySelector('.btn-plus');
            const btnMinus = qtyWrap.querySelector('.btn-minus');
            const qtyEl = qtyWrap.querySelector('.prod-qty');

            btnPlus.addEventListener('click', () => {
                const current = cart[p.id] || 0;
                cart[p.id] = current + 1;
                qtyEl.textContent = cart[p.id];
                saveCart();
                if (cartModal.style.display === 'flex') renderCartItems();
            });

            btnMinus.addEventListener('click', () => {
                const current = cart[p.id] || 0;
                if (current > 1) {
                    cart[p.id] = current - 1;
                } else {
                    delete cart[p.id];
                }
                qtyEl.textContent = cart[p.id] || 0;
                saveCart();
                if (cartModal.style.display === 'flex') renderCartItems();
            });

            productListEl.appendChild(card);
        });
    }

    function renderCartItems() {
        cartItemsEl.innerHTML = '';
        const ids = Object.keys(cart).map(id => parseInt(id, 10));
        if (ids.length === 0) {
            cartItemsEl.innerHTML = `<p style="color:gray; padding:8px;">Savat bo'sh</p>`;
            cartTotalEl.textContent = '0';
            return;
        }

        let total = 0;
        ids.forEach(id => {
            const product = products.find(p => p.id === id);
            if (!product) return;
            const qty = cart[id] || 0;
            total += product.price * qty;

            const item = document.createElement('div');
            item.className = 'cartItem';
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            item.style.padding = '8px 0';

            item.innerHTML = `
                <div class="cart-info">
                    <img src="${product.image}" alt="${product.name}" style="width:56px;height:56px;object-fit:cover;border-radius:8px;margin-right:10px;">
                    <div style="min-width:0;">
                        <div class="cart-name" style="font-weight:600;">${product.name}</div>
                        <div class="cart-desc" style="font-size:12px;color:#556368;">${product.category} · ${formatCurrency(product.price)} so‘m</div>
                    </div>
                </div>
                <div class="cart-controls">
                    <button class="cart-minus">−</button>
                    <span class="cart-qty" style="min-width:28px; text-align:center; font-weight:600;">${qty}</span>
                    <button class="cart-plus">+</button>
                </div>
            `;

            item.querySelector('.cart-plus').addEventListener('click', () => {
                cart[id] = (cart[id] || 0) + 1;
                saveCart();
                renderCartItems();
                updateProductQtyDisplay(id);
            });
            item.querySelector('.cart-minus').addEventListener('click', () => {
                if ((cart[id] || 0) > 1) {
                    cart[id] = cart[id] - 1;
                } else {
                    delete cart[id];
                }
                saveCart();
                renderCartItems();
                updateProductQtyDisplay(id);
            });

            cartItemsEl.appendChild(item);
        });

        cartTotalEl.textContent = formatCurrency(total);
    }

    function updateProductQtyDisplay(productId) {
        const cards = document.querySelectorAll('.product');
        cards.forEach(card => {
            const nameEl = card.querySelector('.pi-name');
            if (!nameEl) return;
            const prodName = nameEl.textContent;
            const p = products.find(x => x.name === prodName);
            if (p && p.id === productId) {
                const qtySpan = card.querySelector('.prod-qty');
                if (qtySpan) qtySpan.textContent = cart[productId] || 0;
            }
        });
        renderCartBadge();
    }

    cartBtn.addEventListener('click', () => {
        cartModal.style.display = 'flex';
        cartModal.style.justifyContent = 'center';
        cartModal.style.alignItems = 'center';
        renderCartItems();
    });
    closeCartBtn.addEventListener('click', () => {
        cartModal.style.display = 'none';
    });
    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) cartModal.style.display = 'none';
    });

    searchInputEl.addEventListener('input', debounce(() => renderProducts(), 220));
    categoryFilterEl.addEventListener('change', () => renderProducts());

    checkoutBtn.addEventListener('click', () => {
        alert('Buyurtma faqat front-end demo sifatida ishlaydi.');
    });

    function formatCurrency(num) {
        if (typeof num !== 'number') num = Number(num) || 0;
        return num.toLocaleString('en-US');
    }

    function debounce(fn, wait) {
        let t;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/[&<>"']/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
    }

    // Ilovani ishga tushirish
    initializeApp();

})();
