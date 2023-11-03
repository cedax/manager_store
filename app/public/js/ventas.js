let totalAmount = 0;
let clienteID = '';

function obtenerTicketPDF(ticketId) {
    fetch(ticketId, {
        method: 'GET',
        responseType: 'blob'
    })
        .then(response => response.blob())
        .then(blob => {
            // Crear una URL para el blob
            const pdfUrl = URL.createObjectURL(blob);

            // Crear un enlace de descarga invisible
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = pdfUrl;
            a.download = ticketId.split('/').pop();

            // Adjuntar el enlace a la página y simular un clic
            document.body.appendChild(a);
            a.click();

            // Limpiar el enlace y la URL
            document.body.removeChild(a);
            URL.revokeObjectURL(pdfUrl);
        })
        .catch(error => {
            showToast('Error al obtener el PDF del ticket', 'bg-danger');
        });
}

function enviarCompraAlServidor(SentCorreo) {
    let clienteId = getCookie("clienteId");
    // Obtener la información de la compra, como la lista de productos y el total
    const cartData = getCookie("cart");
    const subtotal = parseFloat(document.getElementById('subtotal').textContent.replace('$', ''));
    const iva = parseFloat(document.getElementById('iva').textContent.replace('$', ''));
    const total = parseFloat(document.getElementById('total').textContent.replace('$', ''));

    // Crear un objeto que contenga la información de la compra
    const compraData = {
        clientId: clienteId, // ID del cliente
        productos: JSON.parse(cartData), // Lista de productos
        subtotal: subtotal,
        iva: iva,
        total: total,
        correo: SentCorreo
    };

    // Realizar una solicitud POST al servidor
    fetch('/dashboard/inventario/ventas/efectivo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(compraData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.ticket) {
                obtenerTicketPDF(data.ticket);
                if(SentCorreo){
                    showToast('Compra y envio realizados con éxito, el ticket se descargo en tu equipo', 'bg-success', 5000);
                }else {
                    showToast('Compra realizada con éxito, el ticket se descargo en tu equipo', 'bg-success', 5000);
                }
            } else {
                showToast('Error al generar el PDF de compra', 'bg-danger');
            }
        })
        .catch(error => {
            console.error('Error al enviar la compra al servidor:', error);
        });
}

function generarTicket() {
    // Llenar la tabla con los productos del carrito
    const resumenCompraBody = document.getElementById('resumenCompraBody');
    let subtotal = 0;

    resumenCompraBody.innerHTML = '';

    let cartData = getCookie("cart");
    cartData = cartData ? JSON.parse(cartData) : [];

    cartData.forEach((product) => {
        const row = document.createElement('tr');
        const productName = document.createElement('td');
        productName.textContent = product.name;
        row.appendChild(productName);
        const productPrice = document.createElement('td');
        productPrice.textContent = `$${product.price}`;
        row.appendChild(productPrice);
        resumenCompraBody.appendChild(row);
        subtotal += product.price;
    });

    // Calcular IVA y Total
    const iva = parseFloat((subtotal * 0.16).toFixed(2));
    const total = (parseFloat(subtotal) + parseFloat(iva)).toFixed(2);

    // Mostrar Subtotal, IVA y Total
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('iva').textContent = `$${iva}`;
    document.getElementById('total').textContent = `$${total}`;

    $('#paymentModal').modal('hide');
    $('#resumenCompraModal').modal('show');
}

$(document).ready(function () {
    // Cuando se haga clic en el botón "Buscar"
    $('#buscarClienteBtn').click(function (e) {
        e.preventDefault(); // Evitar que se envíe el formulario

        // Obtén los valores de los campos de búsqueda
        const nombre = $('#bnombre').val();
        const correo = $('#bcorreo').val();
        const telefono = $('#btelefono').val();

        // Envía una solicitud al servidor para buscar al cliente
        $.ajax({
            method: 'POST', // Utiliza el método adecuado (GET, POST, etc.) para tu servidor
            url: '/dashboard/usuarios/cliente/buscar', // Reemplaza con tu endpoint
            data: {
                nombre: nombre,
                correo: correo,
                numero: telefono,
            },
            success: function (resultados) {
                if (resultados.length === 0) {
                    showToast('No se encontraron resultados', 'bg-warning');
                    return;
                }

                // Limpia la lista de resultados
                $('#listaResultados').empty();

                // Muestra los resultados en el modal de resultados
                resultados.forEach(function (cliente) {
                    $('#listaResultados').append(
                        `<div class="card mt-5">
                        <div class="card-body">
                            <h5 class="card-title">${cliente.nombres} ${cliente.apellidos}</h5>
                            <p class="card-text">Correo: ${cliente.correo}</p>
                            <p class="card-text">Número: ${cliente.numero}</p>
                            <button class="btn btn-primary seleccionar-cliente mt-4" data-cliente-id="${cliente._id}">Seleccionar Cliente</button>
                        </div>
                    </div>
                    `
                    );
                });

                $('#resultadosClienteModal').modal('show');
                $('#buscarClienteModal').modal('hide');
            },
            error: function (error) {
                console.error(error);
            },
        });
    });

    // Cuando se haga clic en un botón de "Seleccionar Cliente"
    $(document).on('click', '.seleccionar-cliente', function () {
        const clienteId = $(this).data('cliente-id');
        setCookie('clienteId', clienteId, 1);
        $('#resultadosClienteModal').modal('hide');
        $('#paymentModal').modal('show');
    });
});


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

    $('#subtotal-amount').html('<b>$' + totalAmount + '</b>');
    const iva = (totalAmount * 0.16).toFixed(2);
    $('#iva-amount').html('<b>$' + iva + '</b>');
    const total = (parseFloat(totalAmount) + parseFloat(iva)).toFixed(2);
    
    $('#total-amount').html('<b>$' + total + '</b>');
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
    generarTicket();
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

    clienteID = urlParams.get('clienteRegistrado');

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

    if (successParam == '1') {
        if (urlParams.has('clienteRegistrado')) {
            showToast('Cliente registrado con éxito', 'bg-success');
            $('#paymentModal').modal('show');
        }
    }

    $('#otraFormaPago').click(function () {
        $('#paymentModal').modal('show');
        $('#resumenCompraModal').modal('hide');
    });

    $('#confirmarCompra').click(function () {
        $('#confirmarCorreoModal').modal('show');
        $('#resumenCompraModal').modal('hide');
    });

    document.getElementById('enviarCorreoSi').addEventListener('click', function () {
        $('#confirmarCorreoModal').modal('hide');
        enviarCompraAlServidor(true);
        deleteCookie('cart');
        updateCartView([]);
    });

    document.getElementById('enviarCorreoNo').addEventListener('click', function () {
        $('#confirmarCorreoModal').modal('hide');
        enviarCompraAlServidor(false);
        deleteCookie('cart');
        updateCartView([]);
    });
});