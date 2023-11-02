const cart = [];
let totalAmount = 0;

$.get('/dashboard/inventario/productos/json', function (data) {
    $('#productTable').DataTable({
        data: data,
        columns: [
            { data: 'nombre', title: 'Nombre' },
            { data: 'precio', title: 'Precio' },
            {
                data: null,
                title: 'Acciones',
                render: function (data, type, row) {
                    return '<button class="btn btn-success add-to-cart" data-product-id="' + row._id + '"><i class="bi bi-cart-plus"></i></button>';
                }
            }
        ]
    });
});

async function getProductInfo(productId) {
    try {
        const response = await fetch(`/dashboard/inventario/productos/json/${productId}`);
        if (!response.ok) {
            throw new Error('No se pudo obtener la información del producto');
        }

        const product = await response.json();
        return product;
    } catch (error) {
        console.error(error);
        return null;
    }
}

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const cookieName = name + "=";
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(cookieName) === 0) {
            return cookie.substring(cookieName.length, cookie.length);
        }
    }
    return "";
}

function deleteCookie(name) {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

function updateCartView(cart) {
    if (typeof cart === 'string') {
        cart = JSON.parse(cart);
    }
    const cartList = $('#cart-list');
    cartList.empty();

    totalAmount = 0;

    $.each(cart, function (index, product) {
        cartList.append(
            `<li>${product.name}  <b>$${product.price}</b></li>`
        );

        totalAmount += product.price;
    });

    $('#total-amount').html('<b>$' + totalAmount + '</b>');
}

function addToCart(productId) {
    getProductInfo(productId).then(function (productInfo) {
        if (!productInfo) {
            return;
        }

        let cartData = getCookie("cart");
        const cart = cartData ? JSON.parse(cartData) : [];

        cart.push({
            id: productInfo._id,
            name: productInfo.nombre,
            price: productInfo.precio,
        });

        document.cookie = `cart=${JSON.stringify(cart)}; expires=Thu, 31 Dec 2099 23:59:59 UTC; path=/`;

        cartData = getCookie("cart");
        updateCartView(cartData);
    }, function (error) {
        console.error(error);
    });
}

$(document).on('click', '.add-to-cart', function () {
    const productId = $(this).data('product-id');
    addToCart(productId);
});

function showToast(message, backgroundColor = 'bg-primary', delay = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${backgroundColor}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.style.marginTop = '10px';

    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">Notificación</strong>
            <small>Justo ahora</small>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body text-white">
            ${message}
        </div>
    `;

    const toastContainer = document.getElementById('toast-container');
    toastContainer.appendChild(toast);

    const toastInstance = new bootstrap.Toast(toast);

    toastInstance.show();

    setTimeout(() => {
        toastInstance.hide();
    }, delay);
}

function realizarPago() {
    const cartData = getCookie("cart");
    const cart = cartData ? JSON.parse(cartData) : [];

    if (cart.length === 0) {
        showToast('No hay productos en el carrito', 'bg-danger');
        return;
    } else {
        $('#opcionesModal').modal('show');
    }
}

$('#clear-cart-button').click(function () {
    deleteCookie('cart');
    updateCartView([]);
});

$('#opcionesModal').on('show.bs.modal', function (e) {
    $('#buscarClienteModal').modal('hide');
    $('#nuevoClienteModal').modal('hide');
});

$('#buscarClienteModal').on('show.bs.modal', function (e) {
    $('#opcionesModal').modal('hide');
    $('#nuevoClienteModal').modal('hide');
});

$('#nuevoClienteModal').on('show.bs.modal', function (e) {
    $('#opcionesModal').modal('hide');
    $('#buscarClienteModal').modal('hide');
});

$('#pagoEfectivo').click(function () {
    alert('Pago en efectivo');
});

$('#pagoTarjeta').click(function () {
    window.open(`/dashboard/inventario/ventas/pay?total=${totalAmount}`);
});

document.addEventListener('DOMContentLoaded', function () {
    let cartData = getCookie("cart");
    cartData = cartData ? JSON.parse(cartData) : [];
    if (cartData.length > 0) {
        updateCartView(cartData);
    }

    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        let results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    let errorParam = getUrlParameter('error');
    let successParam = getUrlParameter('success');

    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('cliente')) {
        const clienteData = JSON.parse(urlParams.get('cliente'));
        document.getElementById('rnombres').value = clienteData.nombres;
        document.getElementById('rapellidos').value = clienteData.apellidos;
        document.getElementById('rcorreo').value = clienteData.correo;
        document.getElementById('rnumero').value = clienteData.numero;
    }

    if (errorParam === '1') {
        $('#nuevoClienteModal').modal('show');
        showToast('El correo ya esta registrado', 'bg-danger');
    }
    if (errorParam === '2') {
        $('#nuevoClienteModal').modal('show');
        showToast('El número ya esta registrado', 'bg-danger');
    }
    if (errorParam === '3') {
        $('#nuevoClienteModal').modal('show');
        showToast('Error desconocido, contacte a soporte. Codigo: VTS01', 'bg-danger');
    }

    if (successParam === '1') {
        showToast('Cliente registrado con éxito', 'bg-success');
        $('#paymentModal').modal('show');
    }
});