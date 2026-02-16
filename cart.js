/**
 * Carrito de compras - Perro Melo
 * Agregar productos, cantidades y enviar pedido por WhatsApp
 */
(function() {
    const CART_KEY = 'perromelo_cart';
    const WHATSAPP_NUMBER = '573001708326';

    function getCart() {
        try {
            var raw = localStorage.getItem(CART_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function setCart(items) {
        localStorage.setItem(CART_KEY, JSON.stringify(items));
        updateFabBadge();
        updateAllItemControls();
    }

    function slug(str) {
        return String(str).toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n')
            .replace(/[^a-z0-9-]/g, '');
    }

    function parsePrice(priceEl) {
        if (!priceEl) return 0;
        var text = priceEl.textContent || '';
        var num = text.replace(/\D/g, '');
        return parseInt(num, 10) || 0;
    }

    function productId(category, name) {
        return category + '-' + slug(name);
    }

    function addToCart(id, name, price, qty) {
        qty = qty || 1;
        var cart = getCart();
        var i = cart.findIndex(function(item) { return item.id === id; });
        if (i >= 0) {
            cart[i].quantity += qty;
        } else {
            cart.push({ id: id, name: name, price: price, quantity: qty });
        }
        setCart(cart);
    }

    function removeFromCart(id) {
        setCart(getCart().filter(function(item) { return item.id !== id; }));
    }

    function setQuantity(id, qty) {
        if (qty <= 0) {
            removeFromCart(id);
            return;
        }
        var cart = getCart();
        var i = cart.findIndex(function(item) { return item.id === id; });
        if (i >= 0) {
            cart[i].quantity = qty;
            setCart(cart);
        }
    }

    function getQuantity(id) {
        var item = getCart().find(function(x) { return x.id === id; });
        return item ? item.quantity : 0;
    }

    function totalItems() {
        return getCart().reduce(function(sum, item) { return sum + item.quantity; }, 0);
    }

    function totalAmount() {
        return getCart().reduce(function(sum, item) { return sum + item.price * item.quantity; }, 0);
    }

    function formatPrice(n) {
        return '$ ' + Number(n).toLocaleString('es-CO');
    }

    function createCartControls(id, name, price) {
        var wrap = document.createElement('div');
        wrap.className = 'cart-controls';
        wrap.dataset.productId = id;

        var btnAgregar = document.createElement('button');
        btnAgregar.type = 'button';
        btnAgregar.className = 'btn-agregar';
        btnAgregar.textContent = 'Agregar';

        var controls = document.createElement('div');
        controls.className = 'cantidad-controls';
        controls.style.display = 'none';
        controls.innerHTML = '<button type="button" class="btn-menos" aria-label="Menos">−</button><span class="cantidad-num">1</span><button type="button" class="btn-mas" aria-label="Más">+</button>';

        wrap.appendChild(btnAgregar);
        wrap.appendChild(controls);
        return wrap;
    }

    function updateItemControl(wrap) {
        if (!wrap || !wrap.dataset.productId) return;
        var id = wrap.dataset.productId;
        var qty = getQuantity(id);
        var btnAgregar = wrap.querySelector('.btn-agregar');
        var cantidadControls = wrap.querySelector('.cantidad-controls');
        var numEl = wrap.querySelector('.cantidad-num');
        if (qty > 0) {
            if (btnAgregar) btnAgregar.style.display = 'none';
            if (cantidadControls) cantidadControls.style.display = 'flex';
            if (numEl) numEl.textContent = qty;
        } else {
            if (btnAgregar) btnAgregar.style.display = 'block';
            if (cantidadControls) cantidadControls.style.display = 'none';
        }
    }

    function updateAllItemControls() {
        document.querySelectorAll('.cart-controls').forEach(updateItemControl);
    }

    function updateFabBadge() {
        var badge = document.querySelector('.cart-fab .cart-badge');
        if (!badge) return;
        var n = totalItems();
        badge.textContent = n;
        badge.style.display = n > 0 ? 'flex' : 'none';
    }

    function renderModal() {
        var listEl = document.getElementById('cart-modal-list');
        var totalEl = document.getElementById('cart-modal-total');
        var btnSend = document.getElementById('cart-modal-send');
        if (!listEl || !totalEl) return;

        var cart = getCart();
        if (cart.length === 0) {
            listEl.innerHTML = '<p class="cart-empty-msg">No hay productos en tu pedido. Agrega algo del menú.</p>';
            totalEl.textContent = formatPrice(0);
            if (btnSend) btnSend.style.display = 'none';
            return;
        }
        if (btnSend) btnSend.style.display = 'block';
        listEl.innerHTML = cart.map(function(item) {
            var sub = item.price * item.quantity;
            return '<div class="cart-modal-item" data-id="' + item.id + '">' +
                '<div class="cart-modal-item-info">' +
                '<span class="cart-modal-item-name">' + escapeHtml(item.name) + '</span>' +
                '<span class="cart-modal-item-qty">' + item.quantity + ' x ' + formatPrice(item.price) + '</span>' +
                '</div>' +
                '<div class="cart-modal-item-actions">' +
                '<button type="button" class="cart-modal-btn-menos" aria-label="Menos">−</button>' +
                '<span class="cart-modal-num">' + item.quantity + '</span>' +
                '<button type="button" class="cart-modal-btn-mas" aria-label="Más">+</button>' +
                '<button type="button" class="cart-modal-btn-remove" aria-label="Quitar"><i class="fas fa-trash"></i></button>' +
                '</div>' +
                '<div class="cart-modal-item-subtotal">' + formatPrice(sub) + '</div>' +
                '</div>';
        }).join('');
        totalEl.textContent = formatPrice(totalAmount());
    }

    function escapeHtml(s) {
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    function openModal() {
        var modal = document.getElementById('cart-modal');
        if (modal) {
            renderModal();
            modal.classList.add('cart-modal-open');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal() {
        var modal = document.getElementById('cart-modal');
        if (modal) {
            modal.classList.remove('cart-modal-open');
            document.body.style.overflow = '';
        }
    }

    function emojiForProduct(id) {
        var cat = (id || '').split('-')[0];
        var emojis = {
            perros: '🌭',
            salchipapas: '🍟',
            hamburguesas: '🍔',
            picadas: '🍽️',
            alitas: '🍗',
            platano: '🍌',
            asados: '🥩',
            arepa: '🌽',
            chuzo: '🍗',
            adiciones: '➕'
        };
        return emojis[cat] || '🍴';
    }

    function sendToWhatsApp() {
        var cart = getCart();
        if (cart.length === 0) return;
        var lines = [
            '¡Hola! 👋',
            '',
            '*🛒 Mi pedido:*',
            ''
        ];
        cart.forEach(function(item) {
            var emoji = emojiForProduct(item.id);
            lines.push(emoji + ' ' + item.quantity + 'x ' + item.name + ' - ' + formatPrice(item.price));
        });
        lines.push('');
        lines.push('*💰 Total: ' + formatPrice(totalAmount()) + '*');
        lines.push('');
        lines.push('📌 _El total no incluye el servicio a domicilio._');
        var text = lines.join('\n');
        var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
        window.open(url, '_blank');
        closeModal();
    }

    function init() {
        var main = document.querySelector('.menu-content');
        var categoria = '';
        var params = new URLSearchParams(window.location.search);
        if (params.get('categoria')) categoria = params.get('categoria');

        if (main) {
        document.querySelectorAll('.menu-section .menu-item').forEach(function(item) {
            var section = item.closest('section.menu-section');
            var cat = section ? section.id : categoria;
            var nameEl = item.querySelector('.item-info h3');
            var priceEl = item.querySelector('.price');
            if (!nameEl || !priceEl) return;
            var name = nameEl.textContent.trim();
            var price = parsePrice(priceEl);
            var id = productId(cat, name);

            var actions = item.querySelector('.item-actions');
            var orderBtn = item.querySelector('.order-btn');
            if (!actions || !orderBtn) return;

            var controls = createCartControls(id, name, price);
            orderBtn.parentNode.replaceChild(controls, orderBtn);
        });

        main.addEventListener('click', function(e) {
            var target = e.target.closest('.btn-agregar');
            if (target) {
                var wrap = target.closest('.cart-controls');
                if (!wrap) return;
                var id = wrap.dataset.productId;
                var item = wrap.closest('.menu-item');
                var name = item ? (item.querySelector('.item-info h3') || {}).textContent : '';
                var priceEl = wrap.closest('.item-actions').querySelector('.price');
                var price = parsePrice(priceEl);
                addToCart(id, name.trim(), price, 1);
                e.preventDefault();
                return;
            }
            target = e.target.closest('.btn-mas');
            if (target) {
                var wrap = target.closest('.cart-controls');
                if (!wrap) return;
                var id = wrap.dataset.productId;
                var qty = getQuantity(id) + 1;
                setQuantity(id, qty);
                var numEl = wrap.querySelector('.cantidad-num');
                if (numEl) numEl.textContent = qty;
                updateFabBadge();
                e.preventDefault();
                return;
            }
            target = e.target.closest('.btn-menos');
            if (target) {
                var wrap = target.closest('.cart-controls');
                if (!wrap) return;
                var id = wrap.dataset.productId;
                var qty = getQuantity(id) - 1;
                setQuantity(id, qty);
                if (qty <= 0) {
                    updateItemControl(wrap);
                } else {
                    var numEl = wrap.querySelector('.cantidad-num');
                    if (numEl) numEl.textContent = qty;
                }
                updateFabBadge();
                e.preventDefault();
            }
        });
        }

        updateAllItemControls();
        updateFabBadge();

        var fab = document.querySelector('.cart-fab');
        if (fab) fab.addEventListener('click', openModal);

        var modal = document.getElementById('cart-modal');
        if (modal) {
            var closeBtn = modal.querySelector('.cart-modal-close');
            if (closeBtn) closeBtn.addEventListener('click', closeModal);
            modal.addEventListener('click', function(e) {
                if (e.target === modal) closeModal();
            });
            var overlay = modal.querySelector('.cart-modal-backdrop');
            if (overlay) overlay.addEventListener('click', closeModal);

            var listEl = document.getElementById('cart-modal-list');
            if (listEl) {
                listEl.addEventListener('click', function(e) {
                    var id = e.target.closest('.cart-modal-item');
                    if (!id) return;
                    id = id.dataset.id;
                    if (e.target.closest('.cart-modal-btn-mas')) {
                        var item = getCart().find(function(x) { return x.id === id; });
                        if (item) setQuantity(id, item.quantity + 1);
                        renderModal();
                        updateAllItemControls();
                        updateFabBadge();
                    } else if (e.target.closest('.cart-modal-btn-menos')) {
                        var item = getCart().find(function(x) { return x.id === id; });
                        if (item) setQuantity(id, item.quantity - 1);
                        renderModal();
                        updateAllItemControls();
                        updateFabBadge();
                    } else if (e.target.closest('.cart-modal-btn-remove')) {
                        removeFromCart(id);
                        renderModal();
                        updateAllItemControls();
                    }
                });
            }

            var btnSend = document.getElementById('cart-modal-send');
            if (btnSend) btnSend.addEventListener('click', sendToWhatsApp);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
