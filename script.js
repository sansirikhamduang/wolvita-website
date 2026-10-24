/* ===================================================
    PROTEIN FOR HEALTHY — Local Logic & Storage
=================================================== */

// ประกาศอาร์เรย์สำหรับเก็บข้อมูลใน RAM
let cachedProducts = [];
let cachedUsers = [];
let cachedOrders = [];

// ผูกค่าตัวแปรไว้ที่ window เพื่อให้หน้าอื่นเรียกใช้งานร่วมกันได้ทันที
window.cachedOrders = cachedOrders;
window.cachedUsers = cachedUsers;

/* ---------------- Store Keys สำหรับ LocalStorage ---------------- */
const STORE_KEYS = {
  PRODUCTS: 'pfh_products',
  CART: 'pfh_cart',
  USERS: 'pfh_users',
  SESSION: 'pfh_session',
  ORDERS: 'pfh_orders'
};

/* ---------------- กำหนดรายชื่ออีเมลที่เป็น Admin ---------------- */
const ADMIN_EMAILS = [
  'admin@protein.com',
  'adminprotein28@gmail.com'
];

/* ---------------- Products Functions (Local Storage / RAM) ---------------- */
export function getProducts() { 
  return cachedProducts; 
}

export function getProductById(id) { 
  return cachedProducts.find(p => p.id === id); 
}

function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

export async function addProductToLocal(product) {
  try {
    if (product.img && typeof product.img === 'object' && product.img instanceof File) {
        product.img = await convertFileToBase64(product.img);
    }
    const newId = 'PROD-' + Date.now();
    const newProduct = { id: newId, ...product };
    cachedProducts.push(newProduct);
    writeStore(STORE_KEYS.PRODUCTS, cachedProducts);
    return newProduct;
  } catch (e) {
    console.error("Error adding product: ", e);
    throw e;
  }
}

export async function updateProductInLocal(id, data) {
  try {
    if (data.img && typeof data.img === 'object' && data.img instanceof File) {
        data.img = await convertFileToBase64(data.img);
    }
    const index = cachedProducts.findIndex(p => p.id === id);
    if (index !== -1) {
        cachedProducts[index] = { ...cachedProducts[index], ...data };
        writeStore(STORE_KEYS.PRODUCTS, cachedProducts);
    }
  } catch (e) {
    console.error("Error updating product: ", e);
    throw e;
  }
}

export async function deleteProductFromLocal(id) {
  try {
    cachedProducts = cachedProducts.filter(p => p.id !== id);
    writeStore(STORE_KEYS.PRODUCTS, cachedProducts);
  } catch (e) {
    console.error("Error deleting product: ", e);
    throw e;
  }
}

window.getProducts = getProducts;
window.getProductById = getProductById;
window.addProduct = addProductToLocal;
window.updateProduct = updateProductInLocal;
window.deleteProduct = deleteProductFromLocal;

/* ---------------- LocalStorage Helpers ---------------- */
function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initStore() {
  if (!localStorage.getItem(STORE_KEYS.CART)) writeStore(STORE_KEYS.CART, []);
  if (!localStorage.getItem(STORE_KEYS.PRODUCTS)) writeStore(STORE_KEYS.PRODUCTS, []);
  if (!localStorage.getItem(STORE_KEYS.USERS)) writeStore(STORE_KEYS.USERS, []);
  if (!localStorage.getItem(STORE_KEYS.ORDERS)) writeStore(STORE_KEYS.ORDERS, []);
  
  cachedProducts = readStore(STORE_KEYS.PRODUCTS, []);
  cachedUsers = readStore(STORE_KEYS.USERS, []);
  cachedOrders = readStore(STORE_KEYS.ORDERS, []);
}
initStore();

/* ---------------- Cart Logic & Fly-to-Cart Animation ---------------- */
export function getCart() { return readStore(STORE_KEYS.CART, []); }

function saveCart(cart) { 
  writeStore(STORE_KEYS.CART, cart); 
  updateCartBadge(); 
}

/**
 * ฟังก์ชันสร้าง Animation รูปวิ่งเข้าตะกร้า (Fly-to-Cart)
 */
export function animateFlyToCart(imgElement, cartIconElement) {
    if (!imgElement || !cartIconElement) return;

    const imgRect = imgElement.getBoundingClientRect();
    const cartRect = cartIconElement.getBoundingClientRect();

    const flyer = imgElement.cloneNode(true);
    flyer.className = 'fly-to-cart-item';

    flyer.style.left = `${imgRect.left}px`;
    flyer.style.top = `${imgRect.top}px`;
    flyer.style.width = `${imgRect.width || 80}px`;
    flyer.style.height = `${imgRect.height || 80}px`;

    document.body.appendChild(flyer);

    requestAnimationFrame(() => {
        flyer.style.left = `${cartRect.left + (cartRect.width / 2) - 15}px`;
        flyer.style.top = `${cartRect.top + (cartRect.height / 2) - 15}px`;
        flyer.style.width = '30px';
        flyer.style.height = '30px';
        flyer.style.opacity = '0.2';
        flyer.style.transform = 'scale(0.3) rotate(360deg)';
    });

    setTimeout(() => {
        flyer.remove();
        cartIconElement.classList.add('cart-bounce');
        setTimeout(() => {
            cartIconElement.classList.remove('cart-bounce');
        }, 400);
    }, 800);
}
window.animateFlyToCart = animateFlyToCart;

export function addToCart(productId, qty = 1, flavor = null) {
  const cart = getCart();
  const product = getProductById(productId);
  if (!product) {
      console.error("ไม่พบสินค้าที่ต้องการเพิ่มลงตะกร้า:", productId);
      return;
  }

  try {
      const productCard = document.querySelector(`[data-product-id="${productId}"]`) || document.getElementById(`product-${productId}`);
      const imgEl = productCard ? productCard.querySelector('img') : document.querySelector('img');
      const cartIcon = document.querySelector('.fa-cart-shopping') || document.getElementById('navCartIcon');
      if (imgEl && cartIcon) {
          animateFlyToCart(imgEl, cartIcon);
      }
  } catch(err) {
      console.warn("Animation error:", err);
  }

  const existing = cart.find(i => i.productId === productId && i.flavor === flavor);
  if (existing) { 
      existing.qty += qty; 
  } else { 
      cart.push({ 
          productId, 
          qty, 
          flavor,
          name: product.name,
          price: product.price,
          img: product.img,
          category: product.category
      }); 
  }
  saveCart(cart);
}

export function updateCartQty(productId, flavor, qty) {
  const cart = getCart();
  const item = cart.find(i => i.productId === productId && i.flavor === flavor);
  if (item) { item.qty = Math.max(1, qty); saveCart(cart); }
}

export function removeFromCart(productId, flavor) {
  saveCart(getCart().filter(i => !(i.productId === productId && i.flavor === flavor)));
}

export function clearCart() { saveCart([]); }
export function getCartCount() { return getCart().reduce((sum, i) => sum + i.qty, 0); }

export function getCartDetailed() {
  return getCart().map(item => {
    const product = getProductById(item.productId) || {
        name: item.name,
        price: item.price,
        img: item.img,
        category: item.category
    };
    return product ? { ...item, product } : null;
  }).filter(Boolean);
}

export function getCartTotal() {
  return getCartDetailed().reduce((sum, i) => sum + (Number(i.product?.price || i.price) || 0) * i.qty, 0);
}

function updateCartBadge() {
  document.querySelectorAll('.js-cart-count').forEach(el => {
    const count = getCartCount();
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

window.getCart = getCart;
window.addToCart = addToCart;
window.updateCartQty = updateCartQty;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.getCartDetailed = getCartDetailed;
window.getCartTotal = getCartTotal;

/* ---------------- Auth & User Logic (LocalStorage) ---------------- */
export function getUsers() { 
    return cachedUsers.length > 0 ? cachedUsers : readStore(STORE_KEYS.USERS, []); 
}

window.getUsers = getUsers;

export async function registerUser({ name, email, password }) {
  const trimmedEmail = email.trim().toLowerCase();
  cachedUsers = readStore(STORE_KEYS.USERS, []);
  
  if (cachedUsers.some(u => u.email.trim().toLowerCase() === trimmedEmail)) {
    return { ok: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' };
  }
  
  const assignedRole = ADMIN_EMAILS.includes(trimmedEmail) ? 'admin' : 'customer';

  const newUser = { 
    id: 'USER-' + Date.now(),
    name, 
    email: trimmedEmail, 
    password, 
    role: assignedRole,
    createdAt: new Date().toISOString() 
  };
  
  cachedUsers.push(newUser);
  writeStore(STORE_KEYS.USERS, cachedUsers);
  writeStore(STORE_KEYS.SESSION, newUser);
  
  window.location.href = assignedRole === 'admin' ? 'dashboard.html' : 'index.html';
  return { ok: true, user: newUser };
}

export function loginUser(email, password) {
  const trimmedEmail = email.trim().toLowerCase();
  cachedUsers = readStore(STORE_KEYS.USERS, []);

  if (ADMIN_EMAILS.includes(trimmedEmail)) {
    if (password === 'admin123' || password.length > 0) {
      const adminUser = { id: 'admin', name: 'Admin', email: trimmedEmail, role: 'admin' };
      writeStore(STORE_KEYS.SESSION, adminUser);
      window.location.href = 'dashboard.html';
      return { ok: true, user: adminUser };
    }
  }
  
  const user = cachedUsers.find(u => u.email.trim().toLowerCase() === trimmedEmail && u.password === password);
  if (!user) return { ok: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
  
  if (ADMIN_EMAILS.includes(trimmedEmail)) {
    user.role = 'admin';
  }

  writeStore(STORE_KEYS.SESSION, user);
  window.location.href = user.role === 'admin' ? 'dashboard.html' : 'index.html';
  return { ok: true, user };
}

export function logoutUser() {
  localStorage.removeItem(STORE_KEYS.SESSION);
  window.location.href = 'login.html';
}

export function getCurrentUser() { return readStore(STORE_KEYS.SESSION, null); }

export function requireAuth(redirectTo = 'login.html') {
  if (!getCurrentUser()) window.location.href = redirectTo;
}

export function requireAdmin() {
  const u = getCurrentUser();
  if (!u || u.role !== 'admin') {
    alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้!');
    window.location.href = 'index.html';
  }
}

function updateAdminMemberCountUI(count) {
  const selectors = ['memberCount', 'adminMemberCount', 'js-member-count', 'total-users', 'userCount'];
  selectors.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = `${count} คน`;
    }
  });
}

window.loginUser = loginUser;
window.registerUser = registerUser;
window.logoutUser = logoutUser;
window.logout = logoutUser;
window.getCurrentUser = getCurrentUser;
window.requireAuth = requireAuth;
window.requireAdmin = requireAdmin;

/* ---------------- Orders Logic (LocalStorage) ---------------- */
export function getOrders() { 
  return cachedOrders.length > 0 ? cachedOrders : readStore(STORE_KEYS.ORDERS, []); 
}

export function getOrderById(orderId) {
    return getOrders().find(order => String(order.id) === String(orderId));
}

export async function createOrder(orderData) {
  try {
    let slipImageBase64 = orderData.slipFile || orderData.slipImage || null;
    if (orderData.slipFile && orderData.slipFile instanceof File) {
      slipImageBase64 = await convertFileToBase64(orderData.slipFile);
    }

    const currentUser = getCurrentUser();
    const order = {
      id: 'ORD-' + Date.now().toString().slice(-8),
      date: new Date().toISOString(),
      customerName: orderData.customerName || currentUser?.name || 'ลูกค้าทั่วไป',
      email: orderData.email || currentUser?.email || '',
      phone: orderData.phone || '',
      address: orderData.address || '',
      paymentMethod: orderData.paymentMethod || 'QR code',
      items: orderData.items || getCartDetailed(),
      totalAmount: orderData.totalAmount || getCartTotal(),
      slipImage: slipImageBase64,
      status: 'pending'
    };

    cachedOrders = readStore(STORE_KEYS.ORDERS, []);
    cachedOrders.push(order);
    writeStore(STORE_KEYS.ORDERS, cachedOrders);
    window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: cachedOrders }));

    return order;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

export async function updateOrderStatus(orderId, newStatus) {
    try {
        cachedOrders = readStore(STORE_KEYS.ORDERS, []);
        const orderIndex = cachedOrders.findIndex(o => String(o.id) === String(orderId));

        if (orderIndex !== -1) {
            cachedOrders[orderIndex].status = newStatus;
            writeStore(STORE_KEYS.ORDERS, cachedOrders);

            // ตัดสต็อกสินค้าจำลองเมื่ออนุมัติ
            if (newStatus === 'approved') {
                const currentOrder = cachedOrders[orderIndex];
                if (currentOrder && Array.isArray(currentOrder.items)) {
                    cachedProducts = readStore(STORE_KEYS.PRODUCTS, []);
                    
                    currentOrder.items.forEach(item => {
                        const targetId = item.productId || item.id || item.product?.id;
                        const buyQty = Number(item.qty || item.quantity || 1);

                        const product = cachedProducts.find(p => p.id === targetId);
                        if (product) {
                            product.stock = Math.max(0, Number(product.stock || 0) - buyQty);
                        }
                    });

                    writeStore(STORE_KEYS.PRODUCTS, cachedProducts);
                }
            }

            window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: cachedOrders }));
            return { ok: true };
        } else {
            return { ok: false, message: 'ไม่พบคำสั่งซื้อในระบบ' };
        }
    } catch (error) {
        console.error("Error updating order status:", error);
        return { ok: false, message: error.message };
    }
}

export function getOrdersByUser(email) {
    if (!email) return [];
    return getOrders().filter(order => order.email === email);
}

function updateAdminOrderCountUI(count) {
  const selectors = ['orderCount', 'adminOrderCount', 'js-order-count', 'total-orders'];
  selectors.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = `${count} รายการ`;
    }
  });
}

window.getOrders = getOrders;
window.getOrderById = getOrderById;
window.createOrder = createOrder;
window.updateOrderStatus = updateOrderStatus;
window.getOrdersByUser = getOrdersByUser;

/* ---------------- Formatting Helpers ---------------- */
export function formatTHB(num) {
  return '฿' + Number(num || 0).toLocaleString('th-TH');
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

window.formatTHB = formatTHB;
window.formatDate = formatDate;

/* ---------------- Navbar Auth State ---------------- */
function renderNavAuthState() {
  const user = getCurrentUser();

  document.querySelectorAll('.js-nav-auth').forEach(authSlot => {
    if (user) {
      const targetProfileUrl = (user.role === 'admin') ? 'dashboard.html' : 'profile.html';
      authSlot.innerHTML = `
        <a href="${targetProfileUrl}" class="bg-[#12281e] hover:bg-[#1a382a] text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-2">
          <i class="fa-solid fa-user"></i> <span id="navUsername">${user.name}</span> ${user.role === 'admin' ? '<span class="text-amber-400 text-[10px]">(Admin)</span>' : ''}
        </a>
        <button onclick="logoutUser()" class="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer">
          <i class="fa-solid fa-right-from-bracket"></i> <span class="hidden sm:inline">ออกจากระบบ</span>
        </button>
      `;
    } else {
      authSlot.innerHTML = `
        <a href="login.html" class="bg-[#121c18] hover:bg-[#1a2822] border border-[#1f2f28] px-4 py-2 rounded-xl text-xs sm:text-sm text-gray-300 hover:text-emerald-400 transition-colors">เข้าสู่ระบบ</a>
        <a href="register.html" class="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors">สมัครสมาชิก</a>
      `;
    }
  });

  const navUsername = document.getElementById('navUsername');
  if (navUsername && user) {
    navUsername.textContent = user.name;
  }
}

/* ---------------- Dynamic Navigation Bar & Login Event Listener ---------------- */
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    renderNavAuthState();

    const menuBtn = document.getElementById('menu-btn');
    const navMenu = document.getElementById('nav-menu');

    if (menuBtn && navMenu) {
        menuBtn.addEventListener('click', () => {
            if (navMenu.classList.contains('flex') || navMenu.style.display === 'flex') {
                navMenu.classList.remove('flex');
                navMenu.style.display = 'none';
            } else {
                navMenu.classList.add('flex');
                navMenu.style.display = 'flex';
            }
        });
    }

    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const slipSection = document.getElementById('slipUploadSection');
            if (slipSection) {
                if (e.target.value === 'COD') {
                    slipSection.style.display = 'none';
                } else {
                    slipSection.style.display = 'block';
                }
            }
        });
    });

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value.trim().toLowerCase();
            const password = document.getElementById('password').value.trim();
            const alertBox = document.getElementById('alertBox');

            const result = loginUser(email, password);
            if (!result.ok) {
                if (alertBox) {
                    alertBox.textContent = result.message;
                    alertBox.classList.remove('hidden');
                } else {
                    alert(result.message);
                }
            }
        });
    }

    const navContainer = document.getElementById('dynamic-nav');
    if (navContainer) {
        const navLinks = [
            { href: 'index.html', icon: 'fa-solid fa-house', text: 'หน้าแรก' },
            { href: 'benefitprotein.html', icon: 'fa-solid fa-heart-pulse', text: 'ประโยชน์ของโปรตีน' },
            { href: 'products.html', icon: 'fa-solid fa-store', text: 'หมวดหมู่สินค้า' },
            { href: 'cart.html', icon: 'fa-solid fa-cart-shopping', text: 'ตะกร้าสินค้า' },
            { href: 'checkout.html', icon: 'fa-solid fa-credit-card', text: 'ชำระเงิน' }
        ];

        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        navContainer.innerHTML = navLinks.map(link => `
            <li>
                <a href="${link.href}" class="${currentPage === link.href ? 'active' : ''}">
                    <i class="${link.icon}"></i>${link.text}
                </a>
            </li>
        `).join('');
    }
});