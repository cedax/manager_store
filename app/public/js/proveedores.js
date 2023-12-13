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

function eliminarProveedor(idProveedor) {
    if (confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
        $.ajax({
            url: '/dashboard/otros/proveedores/eliminar/' + idProveedor, // Ruta para eliminar el proveedor
            type: 'DELETE',
            success: function(response) {
                showToast('Proveedor eliminado exitosamente', 'bg-success');
                cargarProveedores(); // Debes escribir esta función
            },
            error: function(error) {
                console.error(error); // Maneja errores si es necesario
            }
        });
    }
}

function editarProveedor(idProveedor) {
    document.cookie = `idProveedor=${idProveedor}`;

    $.ajax({
        url: '/dashboard/otros/proveedores/obtener/' + idProveedor, // Ruta para obtener detalles del proveedor
        type: 'GET',
        success: function (proveedor) {
            // Llenar el formulario en el modal con los datos del proveedor
            $('#nombreProveedorEdit').val(proveedor.nombre);
            $('#correoProveedorEdit').val(proveedor.correoElectronico);
            $('#telefonoProveedorEdit').val(proveedor.telefono);
        }
    });
};

$(document).ready(function () {
    // Manejar el evento de clic en el botón "Guardar Cambios" en el modal de edición
    $('#guardarCambiosProveedor').on('click', function () {
        const idProveedor = document.cookie.replace(/(?:(?:^|.*;\s*)idProveedor\s*\=\s*([^;]*).*$)|^.*$/, "$1");

        // Obtén los nuevos datos del proveedor desde el formulario en el modal
        const nuevoNombre = $('#nombreProveedorEdit').val();
        const nuevoCorreo = $('#correoProveedorEdit').val();
        const nuevoTelefono = $('#telefonoProveedorEdit').val();

        // Crea un objeto con los nuevos datos del proveedor
        const datosProveedor = {
            nombre: nuevoNombre,
            correoElectronico: nuevoCorreo,
            telefono: nuevoTelefono
        };

        // Realiza una solicitud PUT al servidor para guardar los cambios del proveedor
        $.ajax({
            url: '/dashboard/otros/proveedores/editar/' + idProveedor, // Ruta para editar el proveedor
            type: 'PUT',
            data: datosProveedor, // Los nuevos datos del proveedor
            success: function (response) {
                // Cierra el modal de edición
                $('#editarProveedorModal').modal('hide');
                // Actualiza la lista de proveedores si es necesario
                cargarProveedores(); // Debes escribir esta función
            },
            error: function (error) {
                console.error(error); // Maneja errores si es necesario
            }
        });
    });


    // Manejar el evento de clic en el botón "Guardar Cambios" en el modal de edición
    $('#btn-guardar-cambios').on('click', function () {
        const idProveedor = $(this).data('id'); // Obtener el ID del proveedor
        const nombreProveedor = $('#nombreProveedorEdit').val(); // Obtener el nombre editado
        const correoProveedor = $('#correoProveedorEdit').val(); // Obtener el correo editado
        const telefonoProveedor = $('#telefonoProveedorEdit').val(); // Obtener el teléfono editado

        // Lógica para enviar los cambios al servidor después de la edición
        $.ajax({
            url: '/dashboard/otros/proveedores/editar/' + idProveedor, // Ruta para editar el proveedor
            type: 'PUT',
            data: {
                nombre: nombreProveedor,
                correoElectronico: correoProveedor,
                telefono: telefonoProveedor
            },
            success: function (result) {
                if (result.success) {
                    // Actualizar la tabla o realizar alguna otra acción después de la edición
                    $('#editarProveedorModal').modal('hide'); // Cerrar el modal
                } else {
                    // Mostrar un mensaje de error en caso de que la edición falle
                    alert('Error al editar el proveedor');
                }
            }
        });
    });

    cargarProveedores();

    // Obtener referencias a los elementos del formulario y el botón "Guardar"
    const formularioProveedor = document.getElementById('agregarProveedorModal');
    const btnGuardar = formularioProveedor.querySelector('.modal-footer button.btn-primary');

    // Agregar un evento de clic al botón "Guardar"
    btnGuardar.addEventListener('click', () => {
        const nombreInput = formularioProveedor.querySelector('#nombreProveedor');
        const correoInput = formularioProveedor.querySelector('#correoProveedor');
        const telefonoInput = formularioProveedor.querySelector('#telefonoProveedor');

        // Obtener los valores de los campos del formulario
        const nombre = nombreInput.value;
        const correo = correoInput.value;
        const telefono = telefonoInput.value;

        // Validar que los campos no estén vacíos
        if (!nombre || !correo || !telefono) {
            showToast('Por favor, ingresa todos los datos', 'bg-danger');
            return;
        }

        // Crear un objeto con los datos del nuevo proveedor
        const nuevoProveedor = {
            nombre: nombre,
            correoElectronico: correo,
            telefono: telefono
        };

        // Realizar una solicitud POST al servidor para agregar el proveedor
        fetch('/dashboard/otros/proveedores/agregar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoProveedor)
        })
            .then(response => response.json())
            .then(data => {
                showToast('Proveedor agregado exitosamente', 'bg-success');
                $('#agregarProveedorModal').modal('hide');
                nombreInput.value = '';
                correoInput.value = '';
                telefonoInput.value = '';
                cargarProveedores();
            })
            .catch(error => {
                console.error('Error al agregar el proveedor:', error);
            });
    });

});

function cargarProveedores() {
    $.ajax({
        url: '/dashboard/otros/proveedores/obtener', // Ruta del endpoint para obtener proveedores
        type: 'GET',
        success: function (proveedores) {
            // Limpiar la tabla
            $('#proveedores-table tbody').empty();

            // Llenar la tabla con los datos de los proveedores
            proveedores.forEach(function (proveedor) {
                $('#proveedores-table tbody').append(`
                    <tr>
                        <td>${proveedor.nombre}</td>
                        <td>${proveedor.correoElectronico}</td>
                        <td>${proveedor.telefono}</td>
                        <td>
                            <button class="btn btn-primary btn-sm" data-bs-toggle="modal" onclick="editarProveedor('${proveedor._id}')"
                                data-bs-target="#editarProveedorModal" data-id="${proveedor._id}">Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="eliminarProveedor('${proveedor._id}')">Eliminar</button>
                        </td>
                    </tr>
                `);
            });
        }
    });
}