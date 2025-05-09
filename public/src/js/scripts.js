const swapButton = document.getElementById('swap-button'),
backButton = document.getElementById('back-button');

const loginForm = document.getElementById('login-form'),
registerForm = document.getElementById('register-form'), 
formTitle = document.getElementById('form-title');

if(swapButton){
    swapButton.addEventListener('click', () => {
        loginForm.classList.toggle('hidden');
        registerForm.classList.toggle('hidden');
    
        if (loginForm.classList.contains('hidden')) {
            formTitle.textContent = 'Crear Cuenta';
            swapButton.textContent = '¿Ya tienes cuenta? ¡Inicia sesión!';
        } else {
            formTitle.textContent = 'Iniciar Sesión';
            swapButton.textContent = '¿No tienes cuenta? ¡Crea una!';
        }
    });
}

if(backButton){
    backButton.addEventListener('click', ()=>{
        location.href='/';
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Confirmación antes de eliminar
    const deleteForms = document.querySelectorAll(".delete-form");
    deleteForms.forEach(form => {
      form.addEventListener("submit", function (fr) {
            fr.preventDefault();
    
            Swal.fire({
                title: "¿Estás seguro?",
                text: "¡Esta acción no se puede deshacer!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Sí, eliminar",
                cancelButtonText: "Cancelar"
            }).then((result) => {
                if (result.isConfirmed) {
                    form.submit();
                }
            });
        });
    });

    // Alerta después de agregar película
    const urlParamsAdd = new URLSearchParams(window.location.search);
    if (urlParamsAdd.get('agregada') === '1') {
        Swal.fire({
            title: "¡Película agregada!",
            text: "Se agregó correctamente al catálogo.",
            icon: "success",
            confirmButtonText: "Aceptar"
        });
        const url = new URL(window.location);
        url.searchParams.delete('agregada');
        window.history.replaceState({}, document.title, url.pathname);
    }

    // Alerta depúes de editar una película
    const urlParamUpdt = new URLSearchParams(window.location.search);
    if(urlParamUpdt.get('editada')=== '1'){
        Swal.fire({
            title: "¡Película editada!",
            text: "Se guardaron cambios correctamente.",
            icon: "success",
            confirmButtonText: "Aceptar"
        });
        const url = new URL(window.location);
        url.searchParams.delete('editada');
        window.history.replaceState({}, document.title, url.pathname);
    }

    // Alerta después de eliminar una película
    const urlParamsDel = new URLSearchParams(window.location.search);
    if (urlParamsDel.get('eliminada') === '1') {
        Swal.fire({
            title: "¡Película eliminada!",
            text: "Borrada exitosamente del catálogo.",
            icon: "success",
            confirmButtonText: "Aceptar"
        });
        const url = new URL(window.location);
        url.searchParams.delete('eliminada');
        window.history.replaceState({}, document.title, url.pathname);
    }

    // Alerta al registrar usuarios
    const urlParamsReg = new URLSearchParams(window.location.search);
    if (urlParamsReg.get('registrado') === '1') {
        Swal.fire({
            title: "¡Usuario dado de alta!",
            text: "Ya puedes usarlo para iniciar sesión.",
            icon: "success",
            confirmButtonText: "Aceptar"
        });
        const url = new URL(window.location);
        url.searchParams.delete('registrado');
        window.history.replaceState({}, document.title, url.pathname);
    }

    // Alert en caso de errores
    const urlParamsErr = new URLSearchParams(window.location.search);
    if (urlParamsErr.get('error') === '1') {
        Swal.fire({
            title: "¡Error!",
            text: "Ocurrió un problema al procesar la solicitud.",
            icon: "error",
            confirmButtonText: "Aceptar"
        });
        const url = new URL(window.location);
        url.searchParams.delete('error');
        window.history.replaceState({}, document.title, url.pathname);
    } else if( urlParamsErr.get('error') === 'notFound'){
        Swal.fire({
            title: "¡Error!",
            text: "La película no existe o su ID no es valido.",
            icon: "error",
            confirmButtonText: "Aceptar"
        });
        const url = new URL(window.location);
        url.searchParams.delete('error');
        window.history.replaceState({}, document.title, url.pathname);
    }

    // Resaltar coincidencias y limpiar URL
    const urlParams = new URLSearchParams(window.location.search);
    const termino = urlParams.get('q');

    if (termino) {
        const url = new URL(window.location);
        url.searchParams.delete('q');
        window.history.replaceState({}, document.title, url.pathname);

        const textoResaltar = termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${textoResaltar})`, 'gi');
        const contenedores = document.querySelectorAll('.movie-content');

        contenedores.forEach(contenedor => {
            const treeWalker = document.createTreeWalker(
                contenedor,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: node => {
                        // No resaltar si el nodo es solo espacios o si su padre es <strong>, <b>, <h2>
                        const parent = node.parentNode;
                        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
                        if (['STRONG', 'B'].includes(parent.nodeName)) return NodeFilter.FILTER_REJECT;
                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
            );
            const nodesToReplace = [];
            let node;
            while ((node = treeWalker.nextNode())) {
                if (regex.test(node.textContent)) {
                    nodesToReplace.push(node);
                }
            }
            nodesToReplace.forEach(node => {
                const span = document.createElement('span');
                span.innerHTML = node.textContent.replace(regex, '<span class="highlight">$1</span>');
                node.parentNode.replaceChild(span, node);
            });
        });
    }

    const inputFile = document.getElementById('imagenInput');
    const inputText = document.getElementById('nombreImagen');
  
    if (!inputFile || !inputText) return;
  
    inputFile.addEventListener('change', async () => {
        const file = inputFile.files[0];
        if (!file) return;
        const nombreLimpio = sanitizarNombre(file.name);
        inputText.value = nombreLimpio;
        const ruta = `/src/img/${nombreLimpio}.jpg`;
    
        try {
            const existe = await imagenExiste(ruta);
            if (existe) {
                Swal.fire({
                    title: 'Imagen ya existe',
                    text: 'Se encontró una imagen con ese nombre. Puedes usarla si corresponde a la película.',
                    imageUrl: ruta,
                    imageWidth: 250,
                    imageHeight: 300,
                    imageAlt: 'Vista previa'
                });
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Imagen no disponible',
                    text: 'No existe una imagen con ese nombre. Asegúrate de subirla manualmente.',
                    footer: '<a href="/cargar" target="_blank">Ir a menú de cargar imagenes</a>'
                });
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo verificar la imagen. Revisa tu conexión.',
                confirmButtonText: 'Aceptar'
            });
        }
    });
});

const form = document.getElementById('buscador');
const input = document.getElementById('inputBusqueda');

if(form){
    form.addEventListener('submit', (e) => {
        if (!input.value.trim()) {
          e.preventDefault(); 
        }
      });
}

function sanitizarNombre(nombre) {
    return nombre
        .replace(/\.[^/.]+$/, '')                      // quitar extensión
        .normalize("NFD").replace(/[\u0300-\u036f]/g, '') // quitar tildes
        .replace(/[<>:"\/\\|?*\x00-\x1F]/g, '')         // caracteres peligrosos
        .replace(/\s+/g, '_')                           // espacios a _
        .replace(/[^a-zA-Z0-9_]/g, '_')                 // limpiar símbolos
        .toLowerCase()
        .slice(0, 50);
}
  
async function imagenExiste(url) {
    try {
        const res = await fetch(url, { method: 'HEAD' });
        return res.ok;
    } catch {
        return false;
    }
}
