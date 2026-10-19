// Panel de administración. Se ejecuta solo en admin.html.

const CLAVE_BORRADOR = "reinventados_borrador";
const CLAVE_INVENTARIO = "reinventados_inventario";
const CLAVE_TOKEN_GITHUB = "reinventados_github_token";

const DUENO_REPO = "dylanv232";
const NOMBRE_REPO = "ReInventados";
const API_GITHUB = "https://api.github.com";

const formProducto = document.getElementById("form-producto");
const formularioTitulo = document.getElementById("formulario-titulo");
const botonGuardar = document.getElementById("boton-guardar");
const botonCancelar = document.getElementById("boton-cancelar");
const selectCategoria = document.getElementById("campo-categoria");
const bloqueCategoriaNueva = document.getElementById("categoria-nueva");
const listaAdmin = document.getElementById("lista-admin");
const miniaturas = document.getElementById("miniaturas");
const origenDatos = document.getElementById("origen-datos");
const formPublicar = document.getElementById("form-publicar");
const campoTokenGitHub = document.getElementById("github-token");
const avisoPublicar = document.getElementById("publicar-aviso");
const avisoPublicacionAuto = document.getElementById("aviso-publicacion-auto");
const campoAutoPublicacion = document.getElementById("publicacion-automatica");
const CLAVE_PUBLICACION_AUTO = "reinventados_publicacion_auto";
const RETRASO_PUBLICACION_AUTO = 10000;

const formMovimiento = document.getElementById("form-movimiento");
const selectMovProducto = document.getElementById("mov-producto");
const selectMovTipo = document.getElementById("mov-tipo");
const campoMovCantidad = document.getElementById("mov-cantidad");
const etiquetaMovCantidad = document.getElementById("mov-cantidad-etiqueta");
const cajaMovDescuento = document.getElementById("mov-descuento-caja");
const campoMovDescuento = document.getElementById("mov-descuento");
const campoMovFecha = document.getElementById("mov-fecha");
const campoMovNota = document.getElementById("mov-nota");
const listaStock = document.getElementById("lista-stock");
const listaMovimientos = document.getElementById("lista-movimientos");
const inventarioResumen = document.getElementById("inventario-resumen");

const formCosto = document.getElementById("form-costo");
const selectCostoTipo = document.getElementById("costo-tipo");
const campoCostoNombre = document.getElementById("costo-nombre");
const campoCostoFecha = document.getElementById("costo-fecha");
const campoCostoValor = document.getElementById("costo-valor");
const campoCostoPeriodo = document.getElementById("costo-periodo");
const campoCostoCantidad = document.getElementById("costo-cantidad");
const campoCostoUnitario = document.getElementById("costo-unitario");
const campoCostoTotal = document.getElementById("costo-total");
const cajaCostoValor = document.getElementById("costo-valor-caja");
const cajaCostoPeriodo = document.getElementById("costo-periodo-caja");
const cajaCostoCantidad = document.getElementById("costo-cantidad-caja");
const cajaCostoUnitario = document.getElementById("costo-unitario-caja");
const cajaCostoTotal = document.getElementById("costo-total-caja");
const botonCostoCancelar = document.getElementById("boton-costo-cancelar");
const formCostoTitulo = document.getElementById("form-costo-titulo");
const listaCostos = document.getElementById("lista-costos");

const selectDashModo = document.getElementById("dash-modo");
const selectDashAnio = document.getElementById("dash-anio");
const selectDashMes = document.getElementById("dash-mes");
const dashboardResumen = document.getElementById("dashboard-resumen");
const graficoVentas = document.getElementById("grafico-ventas");
const graficoSemana = document.getElementById("grafico-semana");
const tablaTop = document.getElementById("tabla-top");
const tablaFlujo = document.getElementById("tabla-flujo");

const MESES_LARGOS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS_CORTOS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
const SEMANA_CERO = "2026-09-21";

const state = {
  productos: [],
  categorias: [],
  inventario: { stock: {}, movimientos: [] }
};

let idEditando = null;
let imagenesActuales = [];
let idEditandoCosto = null;
let avisoAlmacenamientoMostrado = false;
let relojPublicacion = null;
let publicacionEnCurso = false;
let publicacionEnCola = false;
let avisoSinTokenMostrado = false;

function clonar(lista) {
  return JSON.parse(JSON.stringify(lista));
}

function hoyISO() {
  const f = new Date();
  const mes = String(f.getMonth() + 1).padStart(2, "0");
  const dia = String(f.getDate()).padStart(2, "0");
  return f.getFullYear() + "-" + mes + "-" + dia;
}

function fechaISO(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return fecha.getFullYear() + "-" + mes + "-" + dia;
}

function fechaLegible(iso) {
  if (!iso) return "—";
  const partes = String(iso).split("-");
  if (partes.length !== 3) return iso;
  return partes[2] + "-" + partes[1] + "-" + partes[0];
}

function precioANumero(texto) {
  if (!texto) return null;
  const limpio = String(texto).replace(/[^\d]/g, "");
  if (!limpio) return null;
  return parseInt(limpio, 10);
}

function formatoMoneda(numero) {
  if (numero === null || numero === undefined || isNaN(numero)) return "—";
  return "$" + numero.toLocaleString("es-CL");
}

function formatoSaldo(numero) {
  if (numero < 0) return "-" + formatoMoneda(-numero);
  return formatoMoneda(numero);
}

function asegurarCategorias() {
  state.productos.forEach(function (producto) {
    if (!state.categorias.includes(producto.categoria)) {
      state.categorias.push(producto.categoria);
    }
  });
}

function obtenerStock(id) {
  if (!state.inventario.stock[id]) {
    state.inventario.stock[id] = { cantidad: 0, actualizado: hoyISO() };
  }
  return state.inventario.stock[id];
}

function stockDe(id) {
  const entrada = state.inventario.stock[id];
  return entrada ? entrada.cantidad : 0;
}

function asegurarStock() {
  state.productos.forEach(function (producto) {
    if (!state.inventario.stock[producto.id]) {
      state.inventario.stock[producto.id] = {
        cantidad: producto.estado === "vendido" ? 0 : 1,
        actualizado: hoyISO()
      };
    }
  });
}

function cargar() {
  let borrador = null;
  try {
    borrador = JSON.parse(localStorage.getItem(CLAVE_BORRADOR));
  } catch (error) {
    borrador = null;
  }

  if (borrador && Array.isArray(borrador.productos)) {
    state.productos = borrador.productos;
    state.categorias = borrador.categorias || [];
    origenDatos.textContent = "Estás trabajando con un borrador guardado en este navegador. Al exportar, se publicará este borrador.";
  } else {
    state.productos = clonar(window.PRODUCTOS || []);
    state.categorias = (window.CATEGORIAS || []).slice();
    origenDatos.textContent = "Estás trabajando con los datos publicados actualmente en la web.";
  }

  let borradorInventario = null;
  try {
    borradorInventario = JSON.parse(localStorage.getItem(CLAVE_INVENTARIO));
  } catch (error) {
    borradorInventario = null;
  }

  if (borradorInventario && typeof borradorInventario === "object" && Array.isArray(borradorInventario.movimientos)) {
    state.inventario = {
      stock: borradorInventario.stock || {},
      movimientos: borradorInventario.movimientos,
      costos: Array.isArray(borradorInventario.costos) ? borradorInventario.costos : []
    };
  } else {
    const publicado = clonar(window.INVENTARIO || {});
    state.inventario = {
      stock: publicado.stock || {},
      movimientos: publicado.movimientos || [],
      costos: Array.isArray(publicado.costos) ? publicado.costos : []
    };
  }

  asegurarCategorias();
  asegurarStock();
}

function guardarBorrador() {
  try {
    localStorage.setItem(CLAVE_BORRADOR, JSON.stringify({
      productos: state.productos,
      categorias: state.categorias
    }));
  } catch (error) {
    if (!avisoAlmacenamientoMostrado) {
      avisoAlmacenamientoMostrado = true;
      alert("No se pudo autoguardar el borrador: las fotos ocupan mucho espacio en el navegador. Tu trabajo sigue en esta pestaña; usa 'Exportar web (.zip)' antes de cerrarla.");
    }
  }
  try {
    localStorage.setItem(CLAVE_INVENTARIO, JSON.stringify(state.inventario));
  } catch (error) {}
  programarPublicacionAutomatica();
}

function aplicarMovimiento(producto, tipo, cantidad, fecha, nota, descuento) {
  const entrada = obtenerStock(producto.id);
  const anterior = entrada.cantidad;
  let delta = 0;
  if (tipo === "venta" || tipo === "baja") {
    delta = -cantidad;
  } else if (tipo === "reposicion") {
    delta = cantidad;
  } else {
    delta = cantidad - anterior;
  }
  entrada.cantidad = anterior + delta;
  entrada.actualizado = fecha;
  state.inventario.movimientos.unshift({
    id: "mov-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
    productoId: producto.id,
    productoNombre: producto.nombre,
    tipo: tipo,
    cantidad: cantidad,
    delta: delta,
    fecha: fecha,
    nota: nota || "",
    precio: tipo === "venta" ? precioANumero(producto.precio) : null,
    descuento: tipo === "venta" && descuento ? descuento : 0
  });
}

function renderSelectCategorias() {
  selectCategoria.innerHTML = "";
  state.categorias.forEach(function (cat) {
    const opcion = document.createElement("option");
    opcion.value = cat;
    opcion.textContent = cat;
    selectCategoria.appendChild(opcion);
  });
  const nueva = document.createElement("option");
  nueva.value = "__nueva__";
  nueva.textContent = "+ Nueva categoría...";
  selectCategoria.appendChild(nueva);
}

function renderMiniaturas() {
  miniaturas.innerHTML = "";
  if (imagenesActuales.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "formulario__ayuda";
    vacio.textContent = "Sin fotos todavía.";
    miniaturas.appendChild(vacio);
    return;
  }
  imagenesActuales.forEach(function (src, indice) {
    const caja = document.createElement("div");
    caja.className = "miniatura";

    const img = document.createElement("img");
    img.src = src;
    img.alt = "Foto " + (indice + 1);

    const quitar = document.createElement("button");
    quitar.type = "button";
    quitar.className = "miniatura__quitar";
    quitar.textContent = "\u00d7";
    quitar.title = "Quitar foto";
    quitar.addEventListener("click", function () {
      imagenesActuales.splice(indice, 1);
      renderMiniaturas();
    });

    caja.appendChild(img);
    caja.appendChild(quitar);
    miniaturas.appendChild(caja);
  });
}

function renderLista() {
  listaAdmin.innerHTML = "";

  if (state.productos.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "introduccion";
    vacio.textContent = "No hay productos cargados todavía.";
    listaAdmin.appendChild(vacio);
    return;
  }

  state.productos.forEach(function (producto) {
    const fila = document.createElement("div");
    fila.className = "fila-admin" + (producto.estado === "vendido" ? " fila-admin--vendido" : "");

    const miniatura = document.createElement("img");
    miniatura.className = "fila-admin__miniatura";
    miniatura.alt = producto.nombre;
    miniatura.src = producto.imagenes[0] || "";

    const datos = document.createElement("div");
    datos.className = "fila-admin__datos";
    datos.innerHTML =
      "<strong>" + producto.nombre + "</strong>" +
      "<span>" + producto.categoria + " · " + producto.precio + "</span>";

    const estado = document.createElement("span");
    estado.className = "insignia" + (producto.estado === "vendido" ? " insignia--gris" : "");
    estado.textContent = producto.estado === "vendido" ? "Vendido" : "Disponible";

    const botones = document.createElement("div");
    botones.className = "fila-admin__botones";

    const botonEditar = document.createElement("button");
    botonEditar.className = "boton-secundario";
    botonEditar.textContent = "Editar";
    botonEditar.addEventListener("click", function () {
      editar(producto.id);
    });

    const botonEstado = document.createElement("button");
    botonEstado.className = "boton-secundario";
    botonEstado.textContent = producto.estado === "vendido" ? "Marcar disponible" : "Marcar como vendido";
    botonEstado.addEventListener("click", function () {
      cambiarEstado(producto.id);
    });

    const botonEliminar = document.createElement("button");
    botonEliminar.className = "boton-peligro";
    botonEliminar.textContent = "Eliminar";
    botonEliminar.addEventListener("click", function () {
      eliminarProducto(producto.id);
    });

    botones.appendChild(botonEditar);
    botones.appendChild(botonEstado);
    botones.appendChild(botonEliminar);

    fila.appendChild(miniatura);
    fila.appendChild(datos);
    fila.appendChild(estado);
    fila.appendChild(botones);
    listaAdmin.appendChild(fila);
  });
}

function limpiarFormulario() {
  formProducto.reset();
  idEditando = null;
  imagenesActuales = [];
  bloqueCategoriaNueva.hidden = true;
  formularioTitulo.textContent = "Añadir un producto";
  botonGuardar.textContent = "Guardar producto";
  botonCancelar.hidden = true;
  renderSelectCategorias();
  renderMiniaturas();
}

function editar(id) {
  const producto = state.productos.find(function (p) {
    return p.id === id;
  });
  if (!producto) return;

  idEditando = id;
  document.getElementById("campo-nombre").value = producto.nombre;
  renderSelectCategorias();
  selectCategoria.value = producto.categoria;
  document.getElementById("campo-precio").value = producto.precio === "A consultar" ? "" : producto.precio;
  document.getElementById("campo-descripcion").value = producto.descripcion || "";
  document.getElementById("campo-detalles").value = producto.detalles || "";
  document.getElementById("campo-usos").value = producto.usos || "";

  imagenesActuales = producto.imagenes.slice();
  formularioTitulo.textContent = "Editar producto";
  botonGuardar.textContent = "Guardar cambios";
  botonCancelar.hidden = false;
  renderMiniaturas();
  window.scrollTo(0, 0);
}

function cambiarEstado(id) {
  const producto = state.productos.find(function (p) {
    return p.id === id;
  });
  if (!producto) return;
  const pasaraVendido = producto.estado !== "vendido";
  producto.estado = pasaraVendido ? "vendido" : "disponible";
  if (pasaraVendido) {
    aplicarMovimiento(producto, "venta", 1, hoyISO(), "Marcado como vendido en Productos");
  } else {
    aplicarMovimiento(producto, "reposicion", 1, hoyISO(), "Vuelto a disponible en Productos");
  }
  guardarBorrador();
  renderLista();
  renderInventario();
  renderDashboard();
}

function eliminarProducto(id) {
  const producto = state.productos.find(function (p) {
    return p.id === id;
  });
  if (!producto) return;
  if (!confirm('¿Eliminar "' + producto.nombre + '" de forma permanente?')) return;
  state.productos = state.productos.filter(function (p) {
    return p.id !== id;
  });
  delete state.inventario.stock[id];
  if (idEditando === id) limpiarFormulario();
  guardarBorrador();
  renderLista();
  renderInventario();
  renderDashboard();
}

function redimensionarImagen(archivo) {
  return new Promise(function (resolve, reject) {
    const lector = new FileReader();
    lector.onload = function () {
      const img = new Image();
      img.onload = function () {
        const maxAncho = 1200;
        let ancho = img.width;
        let alto = img.height;
        if (ancho > maxAncho) {
          alto = Math.round(alto * maxAncho / ancho);
          ancho = maxAncho;
        }
        const lienzo = document.createElement("canvas");
        lienzo.width = ancho;
        lienzo.height = alto;
        const contexto = lienzo.getContext("2d");
        contexto.drawImage(img, 0, 0, ancho, alto);
        resolve(lienzo.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = lector.result;
    };
    lector.onerror = reject;
    lector.readAsDataURL(archivo);
  });
}

function crearTarjetaResumen(valor, etiqueta) {
  const caja = document.createElement("div");
  caja.className = "tarjeta-resumen";

  const v = document.createElement("span");
  v.className = "tarjeta-resumen__valor";
  v.textContent = valor;

  const e = document.createElement("span");
  e.className = "tarjeta-resumen__etiqueta";
  e.textContent = etiqueta;

  caja.appendChild(v);
  caja.appendChild(e);
  return caja;
}

function renderResumenInventario() {
  inventarioResumen.innerHTML = "";

  let unidades = 0;
  let valor = 0;
  let ultima = "";
  state.productos.forEach(function (producto) {
    const entrada = state.inventario.stock[producto.id];
    if (!entrada) return;
    unidades += entrada.cantidad;
    const precio = precioANumero(producto.precio);
    if (precio !== null) valor += precio * entrada.cantidad;
    if (entrada.actualizado > ultima) ultima = entrada.actualizado;
  });

  inventarioResumen.appendChild(crearTarjetaResumen(String(state.productos.length), "Artículos"));
  inventarioResumen.appendChild(crearTarjetaResumen(String(unidades), "Unidades en stock"));
  inventarioResumen.appendChild(crearTarjetaResumen(formatoMoneda(valor), "Valor estimado del stock"));
  inventarioResumen.appendChild(crearTarjetaResumen(fechaLegible(ultima), "Última actualización"));
}

function renderSelectProductosMov() {
  const seleccionado = selectMovProducto.value;
  selectMovProducto.innerHTML = "";
  const ordenados = state.productos.slice().sort(function (a, b) {
    if (a.categoria !== b.categoria) {
      return a.categoria.localeCompare(b.categoria, "es");
    }
    return b.nombre.localeCompare(a.nombre, "es");
  });
  ordenados.forEach(function (producto) {
    const opcion = document.createElement("option");
    opcion.value = producto.id;
    opcion.textContent = producto.nombre + " (stock: " + stockDe(producto.id) + ")";
    selectMovProducto.appendChild(opcion);
  });
  if (seleccionado && state.productos.some(function (p) { return p.id === seleccionado; })) {
    selectMovProducto.value = seleccionado;
  }
}

function renderListaStock() {
  listaStock.innerHTML = "";

  if (state.productos.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "introduccion";
    vacio.textContent = "No hay productos cargados todavía. Agrega productos en la pestaña Productos.";
    listaStock.appendChild(vacio);
    return;
  }

  state.productos.forEach(function (producto) {
    const entrada = state.inventario.stock[producto.id] || { cantidad: 0, actualizado: "" };

    const fila = document.createElement("div");
    fila.className = "fila-stock";

    const datos = document.createElement("div");
    datos.className = "fila-stock__datos";
    datos.innerHTML =
      "<strong>" + producto.nombre + "</strong>" +
      "<span>" + producto.categoria + "</span>";

    const precio = document.createElement("span");
    precio.className = "fila-stock__precio";
    precio.textContent = producto.precio;

    const insignia = document.createElement("span");
    if (entrada.cantidad <= 0) {
      insignia.className = "insignia insignia--alerta";
      insignia.textContent = "Agotado";
    } else if (entrada.cantidad === 1) {
      insignia.className = "insignia";
      insignia.textContent = "1 unidad";
    } else {
      insignia.className = "insignia";
      insignia.textContent = entrada.cantidad + " unidades";
    }

    const cantidad = document.createElement("input");
    cantidad.type = "number";
    cantidad.className = "fila-stock__cantidad";
    cantidad.min = "0";
    cantidad.step = "1";
    cantidad.value = String(entrada.cantidad);
    cantidad.title = "Cambiar stock total (registra un ajuste con fecha de hoy)";
    cantidad.addEventListener("change", function () {
      const nuevo = parseInt(cantidad.value, 10);
      if (isNaN(nuevo) || nuevo < 0) {
        cantidad.value = String(entrada.cantidad);
        return;
      }
      if (nuevo === entrada.cantidad) return;
      aplicarMovimiento(producto, "ajuste", nuevo, hoyISO(), "Ajuste desde la lista de stock");
      guardarBorrador();
      renderInventario();
      renderDashboard();
    });

    const fecha = document.createElement("span");
    fecha.className = "fila-stock__fecha";
    fecha.textContent = "Actualizado: " + fechaLegible(entrada.actualizado);

    fila.appendChild(datos);
    fila.appendChild(precio);
    fila.appendChild(insignia);
    fila.appendChild(cantidad);
    fila.appendChild(fecha);
    listaStock.appendChild(fila);
  });
}

function renderListaMovimientos() {
  listaMovimientos.innerHTML = "";

  if (state.inventario.movimientos.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "introduccion";
    vacio.textContent = "Todavía no registraste movimientos.";
    listaMovimientos.appendChild(vacio);
    return;
  }

  state.inventario.movimientos.forEach(function (mov) {
    const fila = document.createElement("div");
    fila.className = "fila-mov";

    const fecha = document.createElement("span");
    fecha.className = "fila-mov__fecha";
    fecha.textContent = fechaLegible(mov.fecha);

    const nombre = document.createElement("strong");
    nombre.textContent = mov.productoNombre;

    const insignia = document.createElement("span");
    if (mov.tipo === "venta") {
      insignia.className = "insignia insignia--venta";
      insignia.textContent = "Venta";
    } else if (mov.tipo === "baja") {
      insignia.className = "insignia insignia--baja";
      insignia.textContent = "De baja";
    } else if (mov.tipo === "reposicion") {
      insignia.className = "insignia insignia--entrada";
      insignia.textContent = "Reposición";
    } else {
      insignia.className = "insignia insignia--ajuste";
      insignia.textContent = "Ajuste";
    }

    const delta = document.createElement("span");
    delta.className = "fila-mov__delta " + (mov.delta < 0 ? "fila-mov__delta--salida" : "fila-mov__delta--entrada");
    delta.textContent = (mov.delta > 0 ? "+" : "") + mov.delta;

    const precio = document.createElement("span");
    precio.className = "fila-mov__precio";
    if (mov.tipo === "venta" && mov.precio !== null) {
      precio.textContent = formatoMoneda(mov.precio * mov.cantidad - (mov.descuento || 0));
      if (mov.descuento > 0) {
        const dto = document.createElement("span");
        dto.className = "fila-mov__descuento";
        dto.textContent = "Descuento " + formatoMoneda(mov.descuento);
        precio.appendChild(dto);
      }
    }

    const nota = document.createElement("span");
    nota.className = "fila-mov__nota";
    nota.textContent = mov.nota || "";
    nota.title = mov.nota || "";

    const botonQuitar = document.createElement("button");
    botonQuitar.className = "boton-peligro";
    botonQuitar.textContent = "Eliminar";
    botonQuitar.addEventListener("click", function () {
      eliminarMovimiento(mov.id);
    });

    fila.appendChild(fecha);
    fila.appendChild(nombre);
    fila.appendChild(insignia);
    fila.appendChild(delta);
    fila.appendChild(precio);
    fila.appendChild(nota);
    fila.appendChild(botonQuitar);
    listaMovimientos.appendChild(fila);
  });
}

function eliminarMovimiento(id) {
  const mov = state.inventario.movimientos.find(function (m) {
    return m.id === id;
  });
  if (!mov) return;
  if (!confirm("¿Eliminar este movimiento? El stock del artículo volverá al valor anterior.")) return;
  const entrada = state.inventario.stock[mov.productoId];
  if (entrada) {
    entrada.cantidad -= mov.delta;
    entrada.actualizado = hoyISO();
  }
  state.inventario.movimientos = state.inventario.movimientos.filter(function (m) {
    return m.id !== id;
  });
  guardarBorrador();
  renderInventario();
  renderDashboard();
}

function renderInventario() {
  if (document.getElementById("pestana-inventario").hidden) return;
  renderResumenInventario();
  renderSelectProductosMov();
  renderListaStock();
  renderListaMovimientos();
}

function anosDisponibles() {
  const conjunto = {};
  state.inventario.movimientos.forEach(function (mov) {
    if (mov.fecha) conjunto[mov.fecha.slice(0, 4)] = true;
  });
  conjunto[String(new Date().getFullYear())] = true;
  return Object.keys(conjunto).map(Number).sort(function (a, b) {
    return b - a;
  });
}

function renderSelectsDashboard() {
  const anios = anosDisponibles();
  const anioPrevio = selectDashAnio.value;
  selectDashAnio.innerHTML = "";
  anios.forEach(function (anio) {
    const opcion = document.createElement("option");
    opcion.value = String(anio);
    opcion.textContent = String(anio);
    selectDashAnio.appendChild(opcion);
  });
  if (anioPrevio && anios.indexOf(parseInt(anioPrevio, 10)) !== -1) {
    selectDashAnio.value = anioPrevio;
  } else {
    selectDashAnio.value = String(new Date().getFullYear());
  }

  if (selectDashMes.options.length === 0) {
    MESES_LARGOS.forEach(function (nombre, indice) {
      const opcion = document.createElement("option");
      opcion.value = String(indice);
      opcion.textContent = nombre;
      selectDashMes.appendChild(opcion);
    });
    selectDashMes.value = String(new Date().getMonth());
  }
}

function resolverPeriodo() {
  const modo = selectDashModo.value;
  if (modo === "anual") {
    const anio = selectDashAnio.value;
    if (!anio) return null;
    return { desde: anio + "-01-01", hasta: anio + "-12-31", agrupacion: "mes" };
  }
  if (modo === "mensual") {
    const anio = selectDashAnio.value;
    const mes = parseInt(selectDashMes.value, 10);
    if (!anio || isNaN(mes)) return null;
    const ultimoDia = new Date(parseInt(anio, 10), mes + 1, 0).getDate();
    const mm = String(mes + 1).padStart(2, "0");
    return {
      desde: anio + "-" + mm + "-01",
      hasta: anio + "-" + mm + "-" + String(ultimoDia).padStart(2, "0"),
      agrupacion: "dia"
    };
  }
  return null;
}

function lunesDeLaSemana(fecha) {
  const partes = fecha.split("-");
  const dia = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
  const desfase = (dia.getDay() + 6) % 7;
  dia.setDate(dia.getDate() - desfase);
  return fechaISO(dia);
}

function construirSerieSemana(desde) {
  const serie = [];
  const inicio = new Date(desde + "T00:00:00");
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
    serie.push({
      clave: fechaISO(fecha),
      etiqueta: DIAS_CORTOS[i] + " " + fecha.getDate()
    });
  }
  return serie;
}

function construirSeries(periodo) {
  const series = [];
  if (periodo.agrupacion === "dia") {
    const actual = new Date(periodo.desde + "T00:00:00");
    const hasta = new Date(periodo.hasta + "T00:00:00");
    let seguridad = 0;
    while (actual <= hasta && seguridad < 400) {
      series.push({
        clave: fechaISO(actual),
        etiqueta: String(actual.getDate())
      });
      actual.setDate(actual.getDate() + 1);
      seguridad++;
    }
  } else {
    const desde = new Date(periodo.desde + "T00:00:00");
    const hasta = new Date(periodo.hasta + "T00:00:00");
    let anio = desde.getFullYear();
    let mes = desde.getMonth();
    const anioFin = hasta.getFullYear();
    const mesFin = hasta.getMonth();
    let seguridad = 0;
    while ((anio < anioFin || (anio === anioFin && mes <= mesFin)) && seguridad < 200) {
      series.push({
        clave: anio + "-" + String(mes + 1).padStart(2, "0"),
        etiqueta: MESES_CORTOS[mes] + " " + String(anio).slice(2)
      });
      mes++;
      if (mes > 11) {
        mes = 0;
        anio++;
      }
      seguridad++;
    }
  }
  return series;
}

function alturaBarra(valor, maximo) {
  if (valor <= 0 || maximo <= 0) return 0;
  const pct = Math.round(valor / maximo * 100);
  return Math.min(Math.max(pct, 4), 92);
}

function renderGrafico(contenedor, series, mapa, tipo) {
  contenedor.innerHTML = "";

  let maximo = 0;
  let total = 0;
  series.forEach(function (periodo) {
    const datos = mapa[periodo.clave] || { ventas: 0, entradas: 0, salidas: 0 };
    if (tipo === "ventas") {
      if (datos.ventas > maximo) maximo = datos.ventas;
      total += datos.ventas;
    } else {
      if (datos.entradas > maximo) maximo = datos.entradas;
      if (datos.salidas > maximo) maximo = datos.salidas;
      total += datos.entradas + datos.salidas;
    }
  });

  if (total === 0) {
    const vacio = document.createElement("p");
    vacio.className = "introduccion";
    vacio.textContent = tipo === "ventas" ? "Sin ventas en este período." : "Sin movimientos en este período.";
    contenedor.appendChild(vacio);
    return;
  }

  const grafico = document.createElement("div");
  grafico.className = "grafico";

  if (tipo === "stock") {
    const leyenda = document.createElement("div");
    leyenda.className = "grafico__leyenda";
    leyenda.innerHTML =
      '<span class="grafico__clave grafico__clave--entrada"></span>Entradas de stock' +
      '<span class="grafico__clave grafico__clave--salida"></span>Salidas de stock';
    grafico.appendChild(leyenda);
  }

  const barras = document.createElement("div");
  barras.className = "grafico__barras";

  series.forEach(function (periodo) {
    const datos = mapa[periodo.clave] || { ventas: 0, entradas: 0, salidas: 0 };

    const columna = document.createElement("div");
    columna.className = "grafico__columna";

    const area = document.createElement("div");
    area.className = "grafico__area";

    if (tipo === "ventas") {
      const valor = document.createElement("span");
      valor.className = "grafico__valor";
      valor.textContent = datos.ventas > 0 ? formatoMoneda(datos.ventas) : "";

      const barra = document.createElement("div");
      barra.className = "grafico__barra";
      barra.style.height = alturaBarra(datos.ventas, maximo) + "%";
      barra.title = formatoMoneda(datos.ventas) + " en ventas";

      area.appendChild(valor);
      area.appendChild(barra);
    } else {
      const barraEntrada = document.createElement("div");
      barraEntrada.className = "grafico__barra grafico__barra--entrada";
      barraEntrada.style.height = alturaBarra(datos.entradas, maximo) + "%";
      barraEntrada.title = datos.entradas + " entradas";

      const barraSalida = document.createElement("div");
      barraSalida.className = "grafico__barra grafico__barra--salida";
      barraSalida.style.height = alturaBarra(datos.salidas, maximo) + "%";
      barraSalida.title = datos.salidas + " salidas";

      const par = document.createElement("div");
      par.className = "grafico__par";
      par.appendChild(barraEntrada);
      par.appendChild(barraSalida);
      area.appendChild(par);
    }

    const etiqueta = document.createElement("div");
    etiqueta.className = "grafico__etiqueta";
    etiqueta.textContent = periodo.etiqueta;

    columna.appendChild(area);
    columna.appendChild(etiqueta);
    barras.appendChild(columna);
  });

  grafico.appendChild(barras);
  contenedor.appendChild(grafico);
}

function visibilidadCamposCosto() {
  const tipo = selectCostoTipo.value;
  const esFijo = tipo === "fijo";
  cajaCostoValor.hidden = !esFijo;
  cajaCostoPeriodo.hidden = !esFijo;
  cajaCostoCantidad.hidden = esFijo;
  cajaCostoUnitario.hidden = esFijo;
  cajaCostoTotal.hidden = esFijo;
}

function recalcularCosto(origen) {
  const cantidad = parseFloat(campoCostoCantidad.value);
  const unitario = parseFloat(campoCostoUnitario.value);
  const total = parseFloat(campoCostoTotal.value);
  if (origen === "unitario" && !isNaN(cantidad) && !isNaN(unitario)) {
    campoCostoTotal.value = String(Math.round(cantidad * unitario));
  } else if (origen === "total" && !isNaN(cantidad) && cantidad > 0 && !isNaN(total)) {
    campoCostoUnitario.value = String(Math.round(total / cantidad));
  } else if (origen === "cantidad" && !isNaN(cantidad) && !isNaN(unitario)) {
    campoCostoTotal.value = String(Math.round(cantidad * unitario));
  }
}

function limpiarFormCosto() {
  idEditandoCosto = null;
  selectCostoTipo.value = "fijo";
  campoCostoNombre.value = "";
  campoCostoFecha.value = hoyISO();
  campoCostoValor.value = "";
  campoCostoPeriodo.value = "mensual";
  campoCostoCantidad.value = "";
  campoCostoUnitario.value = "";
  campoCostoTotal.value = "";
  botonCostoCancelar.hidden = true;
  formCostoTitulo.textContent = "Agregar un costo";
  visibilidadCamposCosto();
}

function guardarCosto() {
  const tipo = selectCostoTipo.value;
  const nombre = campoCostoNombre.value.trim();
  const fecha = campoCostoFecha.value;
  if (!nombre) return "Ponle un nombre al costo.";
  if (!fecha) return "Elige una fecha para el costo.";

  let datos = null;
  if (tipo === "fijo") {
    const valor = parseFloat(campoCostoValor.value);
    if (isNaN(valor) || valor < 0) return "Indica el valor del costo fijo.";
    datos = {
      tipo: "fijo",
      nombre: nombre,
      fecha: fecha,
      valor: Math.round(valor),
      periodo: campoCostoPeriodo.value
    };
  } else {
    const cantidad = parseInt(campoCostoCantidad.value, 10);
    let unitario = parseFloat(campoCostoUnitario.value);
    let total = parseFloat(campoCostoTotal.value);
    if (isNaN(cantidad) || cantidad <= 0) return "Indica la cantidad.";
    if (isNaN(unitario) && isNaN(total)) return "Coloca el valor unitario o el total; el otro se calcula solo.";
    if (isNaN(total)) total = cantidad * unitario;
    if (isNaN(unitario)) unitario = total / cantidad;
    datos = {
      tipo: tipo,
      nombre: nombre,
      fecha: fecha,
      cantidad: cantidad,
      valorUnitario: Math.round(unitario),
      total: Math.round(total)
    };
  }

  if (idEditandoCosto) {
    let encontrado = false;
    state.inventario.costos.forEach(function (costo) {
      if (costo.id === idEditandoCosto) {
        datos.id = costo.id;
        Object.keys(datos).forEach(function (clave) { costo[clave] = datos[clave]; });
        encontrado = true;
      }
    });
    if (!encontrado) datos.id = idEditandoCosto;
    if (!encontrado) state.inventario.costos.unshift(datos);
  } else {
    datos.id = "costo-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
    state.inventario.costos.unshift(datos);
  }

  guardarBorrador();
  renderCostos();
  renderDashboard();
  return null;
}

function editarCosto(id) {
  let encontrado = null;
  state.inventario.costos.forEach(function (costo) {
    if (costo.id === id) encontrado = costo;
  });
  if (!encontrado) return;
  idEditandoCosto = id;
  selectCostoTipo.value = encontrado.tipo;
  campoCostoNombre.value = encontrado.nombre;
  campoCostoFecha.value = encontrado.fecha;
  campoCostoValor.value = encontrado.tipo === "fijo" ? String(encontrado.valor) : "";
  campoCostoPeriodo.value = encontrado.tipo === "fijo" ? encontrado.periodo : "mensual";
  campoCostoCantidad.value = encontrado.tipo === "fijo" ? "" : String(encontrado.cantidad);
  campoCostoUnitario.value = encontrado.tipo === "fijo" ? "" : String(encontrado.valorUnitario);
  campoCostoTotal.value = encontrado.tipo === "fijo" ? "" : String(encontrado.total);
  botonCostoCancelar.hidden = false;
  formCostoTitulo.textContent = "Editar costo";
  visibilidadCamposCosto();
  campoCostoNombre.focus();
}

function eliminarCosto(id) {
  if (!confirm("¿Eliminar este costo?")) return;
  state.inventario.costos = state.inventario.costos.filter(function (costo) {
    return costo.id !== id;
  });
  if (idEditandoCosto === id) limpiarFormCosto();
  guardarBorrador();
  renderCostos();
  renderDashboard();
}

function renderCostos() {
  if (document.getElementById("pestana-costos").hidden) return;
  listaCostos.innerHTML = "";

  if (state.inventario.costos.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "introduccion";
    vacio.textContent = "Todavía no registraste costos.";
    listaCostos.appendChild(vacio);
    return;
  }

  const etiquetasTipo = { fijo: "Costo fijo", variable: "Costo variable", inversion: "Inversión" };
  const clasesTipo = { fijo: "insignia insignia--gris", variable: "insignia insignia--alerta", inversion: "insignia insignia--ajuste" };
  const etiquetasPeriodo = { diario: "Diario", semanal: "Semanal", mensual: "Mensual" };

  state.inventario.costos.forEach(function (costo) {
    const fila = document.createElement("div");
    fila.className = "fila-costo";

    const fecha = document.createElement("span");
    fecha.className = "fila-mov__fecha";
    fecha.textContent = fechaLegible(costo.fecha);

    const nombre = document.createElement("strong");
    nombre.textContent = costo.nombre;

    const insignia = document.createElement("span");
    insignia.className = clasesTipo[costo.tipo] || "insignia";
    insignia.textContent = etiquetasTipo[costo.tipo] || costo.tipo;

    const detalle = document.createElement("span");
    detalle.className = "fila-costo__detalle";
    if (costo.tipo === "fijo") {
      detalle.textContent = formatoMoneda(costo.valor) + " · " + (etiquetasPeriodo[costo.periodo] || costo.periodo);
    } else {
      detalle.textContent = costo.cantidad + " × " + formatoMoneda(costo.valorUnitario) + " = " + formatoMoneda(costo.total);
      detalle.title = "Total " + formatoMoneda(costo.total);
    }

    const botonEditar = document.createElement("button");
    botonEditar.className = "boton-secundario";
    botonEditar.textContent = "Editar";
    botonEditar.addEventListener("click", function () {
      editarCosto(costo.id);
    });

    const botonQuitar = document.createElement("button");
    botonQuitar.className = "boton-peligro";
    botonQuitar.textContent = "Eliminar";
    botonQuitar.addEventListener("click", function () {
      eliminarCosto(costo.id);
    });

    fila.appendChild(fecha);
    fila.appendChild(nombre);
    fila.appendChild(insignia);
    fila.appendChild(detalle);
    fila.appendChild(botonEditar);
    fila.appendChild(botonQuitar);
    listaCostos.appendChild(fila);
  });
}

function contarDias(desde, hasta) {
  function aUTC(iso) {
    return Date.UTC(
      parseInt(iso.slice(0, 4), 10),
      parseInt(iso.slice(5, 7), 10) - 1,
      parseInt(iso.slice(8, 10), 10)
    );
  }
  return Math.round((aUTC(hasta) - aUTC(desde)) / 86400000) + 1;
}

function ingresosEntre(desde, hasta) {
  let total = 0;
  state.inventario.movimientos.forEach(function (mov) {
    if (mov.tipo !== "venta") return;
    if (mov.fecha < desde || mov.fecha > hasta) return;
    total += (mov.precio !== null ? mov.precio * mov.cantidad : 0) - (mov.descuento || 0);
  });
  return total;
}

function desgloseCostosEntre(desde, hasta) {
  const desglose = { inversion: 0, fijos: 0, variables: 0 };
  const hoy = hoyISO();
  const fin = hasta < hoy ? hasta : hoy;
  if (fin < desde) return desglose;
  state.inventario.costos.forEach(function (costo) {
    if (costo.tipo === "fijo") {
      if (costo.periodo === "mensual") {
        const primero = new Date(desde + "T00:00:00");
        const ultimo = new Date(fin + "T00:00:00");
        let anio = primero.getFullYear();
        let mes = primero.getMonth();
        let seguridad = 0;
        while ((anio < ultimo.getFullYear() || (anio === ultimo.getFullYear() && mes <= ultimo.getMonth())) && seguridad < 6) {
          const ultimoDia = new Date(anio, mes + 1, 0).getDate();
          const diaCargo = Math.min(parseInt(costo.fecha.slice(8, 10), 10), ultimoDia);
          const cargo = anio + "-" + String(mes + 1).padStart(2, "0") + "-" + String(diaCargo).padStart(2, "0");
          if (cargo >= desde && cargo <= fin && cargo >= costo.fecha) desglose.fijos += costo.valor;
          mes++;
          if (mes > 11) {
            mes = 0;
            anio++;
          }
          seguridad++;
        }
      } else {
        if (costo.fecha >= desde && costo.fecha <= fin) desglose.fijos += costo.valor;
      }
    } else if (costo.tipo === "inversion") {
      if (costo.fecha >= desde && costo.fecha <= fin) desglose.inversion += costo.total;
    } else {
      if (costo.fecha >= desde && costo.fecha <= fin) desglose.variables += costo.total;
    }
  });
  return desglose;
}

function costosEntre(desde, hasta) {
  const desglose = desgloseCostosEntre(desde, hasta);
  return desglose.inversion + desglose.fijos + desglose.variables;
}

function etiquetaSemana(inicio, fin) {
  const mesInicio = MESES_CORTOS[inicio.getMonth()];
  const mesFin = MESES_CORTOS[fin.getMonth()];
  if (mesInicio === mesFin) return inicio.getDate() + "–" + fin.getDate() + " " + mesFin;
  return inicio.getDate() + " " + mesInicio + " – " + fin.getDate() + " " + mesFin;
}

function calcularFlujoSemanal() {
  const lunesActual = new Date(lunesDeLaSemana(hoyISO()) + "T00:00:00");
  let lunesBase = null;
  state.inventario.movimientos.forEach(function (mov) {
    const lunes = lunesDeLaSemana(mov.fecha);
    if (!lunesBase || lunes < lunesBase) lunesBase = lunes;
  });
  state.inventario.costos.forEach(function (costo) {
    const lunes = lunesDeLaSemana(costo.fecha);
    if (!lunesBase || lunes < lunesBase) lunesBase = lunes;
  });
  if (!lunesBase) return [];

  const ancla = lunesBase < SEMANA_CERO ? lunesBase : SEMANA_CERO;
  const semanas = [];
  const actual = new Date(ancla + "T00:00:00");
  const limite = fechaISO(lunesActual);
  let numero = 0;
  let acumulado = 0;
  let seguridad = 0;
  while (fechaISO(actual) <= limite && seguridad < 520) {
    const inicio = new Date(actual);
    const fin = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6);
    const desde = fechaISO(inicio);
    const hasta = fechaISO(fin);
    const ventas = ingresosEntre(desde, hasta);
    const desglose = desgloseCostosEntre(desde, hasta);
    const egresos = desglose.inversion + desglose.fijos + desglose.variables;
    const neto = ventas - egresos;
    const conActividad = ventas !== 0 || egresos !== 0;
    acumulado += neto;
    semanas.push({
      desde: desde,
      hasta: hasta,
      numero: numero,
      etiqueta: etiquetaSemana(inicio, fin),
      ventas: ventas,
      inversion: desglose.inversion,
      fijos: desglose.fijos,
      variables: desglose.variables,
      egresos: egresos,
      costos: egresos,
      neto: conActividad ? neto : null,
      flujo: neto,
      acumulado: acumulado
    });
    numero++;
    actual.setDate(actual.getDate() + 7);
    seguridad++;
  }
  return semanas.slice(-12);
}

function renderTablaFlujo() {
  tablaFlujo.innerHTML = "";
  const semanas = calcularFlujoSemanal();
  if (semanas.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "introduccion";
    vacio.textContent = "Sin ventas ni costos registrados todavía.";
    tablaFlujo.appendChild(vacio);
    return;
  }

  function celda(texto, clase) {
    return { texto: texto, clase: clase || "" };
  }

  function vacia() {
    return celda("—", "flujo__celda--vacio");
  }

  function monto(valor) {
    return valor ? celda(formatoMoneda(valor)) : vacia();
  }

  function saldo(valor) {
    if (valor === null) return vacia();
    if (valor < 0) return celda(formatoSaldo(valor), "flujo__neto--negativo");
    if (valor > 0) return celda(formatoSaldo(valor), "flujo__neto--positivo");
    return celda(formatoSaldo(valor));
  }

  const tabla = document.createElement("table");
  tabla.className = "tabla-top__tabla flujo__tabla";
  let cabecera = "<thead>";
  cabecera += "<tr><th class=\"flujo__label\">Rango de fecha</th>";
  semanas.forEach(function (semana) {
    cabecera += "<th>" + semana.etiqueta + "</th>";
  });
  cabecera += "</tr>";
  cabecera += "<tr><th class=\"flujo__label\">N° Semana</th>";
  semanas.forEach(function (semana) {
    cabecera += "<th>Semana " + semana.numero + "</th>";
  });
  cabecera += "</tr></thead>";
  tabla.innerHTML = cabecera;

  const cuerpo = document.createElement("tbody");
  const columnas = semanas.length + 1;

  function filaSeparadora() {
    const fila = document.createElement("tr");
    fila.className = "flujo__sep";
    const celdaUnica = document.createElement("td");
    celdaUnica.colSpan = columnas;
    fila.appendChild(celdaUnica);
    cuerpo.appendChild(fila);
  }

  function filaTitulo(texto) {
    const fila = document.createElement("tr");
    fila.className = "flujo__seccion";
    const celdaUnica = document.createElement("td");
    celdaUnica.colSpan = columnas;
    celdaUnica.textContent = texto;
    fila.appendChild(celdaUnica);
    cuerpo.appendChild(fila);
  }

  function filaDatos(etiqueta, celdas, claseFila, tono) {
    const fila = document.createElement("tr");
    if (claseFila) fila.className = claseFila;
    const primera = document.createElement("td");
    primera.className = "flujo__label";
    primera.textContent = etiqueta;
    fila.appendChild(primera);
    celdas.forEach(function (info) {
      const td = document.createElement("td");
      let clases = "tabla-top__numero";
      if (tono && info.clase.indexOf("flujo__celda--vacio") === -1) clases += " " + tono;
      if (info.clase) clases += " " + info.clase;
      td.className = clases;
      td.textContent = info.texto;
      fila.appendChild(td);
    });
    cuerpo.appendChild(fila);
  }

  filaSeparadora();
  filaTitulo("Detalle ingresos");
  filaDatos("Ingresos por ventas", semanas.map(function (semana) {
    return monto(semana.ventas);
  }), null, "flujo__ingreso");
  filaDatos("Total", semanas.map(function (semana) {
    return monto(semana.ventas);
  }), "flujo__total", "flujo__ingreso");
  filaSeparadora();
  filaTitulo("Detalle egresos");
  filaDatos("Inversión inicial", semanas.map(function (semana) {
    return monto(semana.inversion);
  }), null, "flujo__costo");
  filaDatos("Costos fijos", semanas.map(function (semana) {
    return monto(semana.fijos);
  }), null, "flujo__costo");
  filaDatos("Costos variables", semanas.map(function (semana) {
    return monto(semana.variables);
  }), null, "flujo__costo");
  filaDatos("Total", semanas.map(function (semana) {
    return monto(semana.egresos);
  }), "flujo__total", "flujo__costo");
  filaSeparadora();
  filaTitulo("Saldos");
  filaDatos("Saldo neto", semanas.map(function (semana) {
    return saldo(semana.neto);
  }), "flujo__total");
  filaDatos("Saldo acumulado", semanas.map(function (semana) {
    return saldo(semana.acumulado);
  }), "flujo__total");

  tabla.appendChild(cuerpo);
  tablaFlujo.appendChild(tabla);
}

function renderDashboard() {
  if (document.getElementById("pestana-dashboard").hidden) return;

  renderSelectsDashboard();
  dashboardResumen.innerHTML = "";

  const serieSemana = construirSerieSemana(lunesDeLaSemana(hoyISO()));
  const mapaSemana = {};
  serieSemana.forEach(function (dia) {
    mapaSemana[dia.clave] = { ventas: 0 };
  });
  state.inventario.movimientos.forEach(function (mov) {
    if (mov.tipo !== "venta") return;
    if (!mapaSemana[mov.fecha]) return;
    mapaSemana[mov.fecha].ventas += (mov.precio !== null ? mov.precio * mov.cantidad : 0) - (mov.descuento || 0);
  });
  renderGrafico(graficoSemana, serieSemana, mapaSemana, "ventas");
  renderTablaFlujo();

  const periodo = resolverPeriodo();
  if (!periodo) {
    const aviso = document.createElement("p");
    aviso.className = "introduccion";
    aviso.textContent = "Elige un año para ver los datos.";
    graficoVentas.innerHTML = "";
    graficoVentas.appendChild(aviso);
    tablaTop.innerHTML = "";
    return;
  }

  const delPeriodo = state.inventario.movimientos.filter(function (mov) {
    return mov.fecha >= periodo.desde && mov.fecha <= periodo.hasta;
  });

  let unidadesVendidas = 0;
  let ingresos = 0;
  let bajas = 0;
  const mapa = {};
  const vendidosPorProducto = {};
  const bajasPorProducto = {};

  delPeriodo.forEach(function (mov) {
    const clave = periodo.agrupacion === "dia" ? mov.fecha : mov.fecha.slice(0, 7);
    if (!mapa[clave]) mapa[clave] = { ventas: 0 };
    if (mov.tipo === "venta") {
      unidadesVendidas += mov.cantidad;
      const ingreso = (mov.precio !== null ? mov.precio * mov.cantidad : 0) - (mov.descuento || 0);
      ingresos += ingreso;
      mapa[clave].ventas += ingreso;
      vendidosPorProducto[mov.productoId] = (vendidosPorProducto[mov.productoId] || 0) + mov.cantidad;
    }
    if (mov.tipo === "baja") {
      bajas += mov.cantidad;
      bajasPorProducto[mov.productoId] = (bajasPorProducto[mov.productoId] || 0) + mov.cantidad;
    }
  });

  const deltasDesde = {};
  const deltasDespues = {};
  state.inventario.movimientos.forEach(function (mov) {
    if (mov.nota === "Carga inicial del inventario") return;
    if (mov.fecha >= periodo.desde) {
      deltasDesde[mov.productoId] = (deltasDesde[mov.productoId] || 0) + mov.delta;
    }
    if (mov.fecha > periodo.hasta) {
      deltasDespues[mov.productoId] = (deltasDespues[mov.productoId] || 0) + mov.delta;
    }
  });

  let stockActual = 0;
  let stockInicial = 0;
  state.productos.forEach(function (producto) {
    stockActual += stockDe(producto.id);
    stockInicial += stockDe(producto.id) - (deltasDesde[producto.id] || 0);
  });

  dashboardResumen.appendChild(crearTarjetaResumen(String(unidadesVendidas), "Unidades vendidas"));
  dashboardResumen.appendChild(crearTarjetaResumen(formatoMoneda(ingresos), "Ingresos estimados"));
  dashboardResumen.appendChild(crearTarjetaResumen(String(stockInicial), "Stock inicial del período"));
  dashboardResumen.appendChild(crearTarjetaResumen(String(bajas), "Bajas del período"));
  dashboardResumen.appendChild(crearTarjetaResumen(String(stockActual), "Stock actual"));

  const series = construirSeries(periodo);
  renderGrafico(graficoVentas, series, mapa, "ventas");
  renderTablaTop(vendidosPorProducto, bajasPorProducto, deltasDesde, deltasDespues);
}

function renderTablaTop(vendidosPorProducto, bajasPorProducto, deltasDesde, deltasDespues) {
  tablaTop.innerHTML = "";

  const conVentas = state.productos.filter(function (producto) {
    return (vendidosPorProducto[producto.id] || 0) > 0;
  });

  conVentas.sort(function (a, b) {
    const total = (vendidosPorProducto[b.id] || 0) - (vendidosPorProducto[a.id] || 0);
    return total !== 0 ? total : a.nombre.localeCompare(b.nombre, "es");
  });

  const top = conVentas.slice(0, 5);
  if (top.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "introduccion";
    vacio.textContent = "Sin ventas en este período.";
    tablaTop.appendChild(vacio);
    return;
  }

  const tabla = document.createElement("table");
  tabla.className = "tabla-top__tabla";

  const cabecera = document.createElement("thead");
  const filaCabecera = document.createElement("tr");
  ["Producto", "Stock inicial", "Total vendido", "Bajas", "Stock final", "Stock deseado"].forEach(function (titulo) {
    const celda = document.createElement("th");
    celda.textContent = titulo;
    filaCabecera.appendChild(celda);
  });
  cabecera.appendChild(filaCabecera);
  tabla.appendChild(cabecera);

  const cuerpo = document.createElement("tbody");
  top.forEach(function (producto) {
    const fila = document.createElement("tr");

    const nombre = document.createElement("td");
    nombre.className = "tabla-top__producto";
    nombre.textContent = producto.nombre;

    const inicial = document.createElement("td");
    inicial.className = "tabla-top__numero";
    inicial.textContent = String(stockDe(producto.id) - (deltasDesde[producto.id] || 0));

    const vendido = document.createElement("td");
    vendido.className = "tabla-top__numero tabla-top__vendido";
    vendido.textContent = String(vendidosPorProducto[producto.id] || 0);

    const baja = document.createElement("td");
    baja.className = "tabla-top__numero tabla-top__bajas";
    baja.textContent = String(bajasPorProducto[producto.id] || 0);

    const final = document.createElement("td");
    final.className = "tabla-top__numero";
    final.textContent = String(stockDe(producto.id) - (deltasDespues[producto.id] || 0));

    const deseado = document.createElement("td");
    const campo = document.createElement("input");
    campo.type = "number";
    campo.min = "0";
    campo.step = "1";
    campo.className = "tabla-top__deseado";
    const entrada = state.inventario.stock[producto.id];
    campo.value = entrada && entrada.deseado !== null && entrada.deseado !== undefined ? String(entrada.deseado) : "";
    campo.placeholder = "\u2014";
    campo.addEventListener("change", function () {
      const valor = parseInt(campo.value, 10);
      const registro = obtenerStock(producto.id);
      if (isNaN(valor) || valor < 0) {
        registro.deseado = null;
        campo.value = "";
      } else {
        registro.deseado = valor;
        campo.value = String(valor);
      }
      try {
        localStorage.setItem(CLAVE_INVENTARIO, JSON.stringify(state.inventario));
      } catch (error) {}
      programarPublicacionAutomatica();
    });
    deseado.appendChild(campo);

    fila.appendChild(nombre);
    fila.appendChild(inicial);
    fila.appendChild(vendido);
    fila.appendChild(baja);
    fila.appendChild(final);
    fila.appendChild(deseado);
    cuerpo.appendChild(fila);
  });
  tabla.appendChild(cuerpo);
  tablaTop.appendChild(tabla);
}

function actualizarVisibilidadFiltros() {
  const modo = selectDashModo.value;
  document.getElementById("dash-anio-caja").hidden = modo !== "anual";
  document.getElementById("dash-mes-caja").hidden = modo !== "mensual";
}

function mostrarPestana(nombre) {
  ["productos", "inventario", "costos", "dashboard"].forEach(function (pestana) {
    document.getElementById("pestana-" + pestana).hidden = pestana !== nombre;
  });
  document.querySelectorAll(".pestanas__boton").forEach(function (boton) {
    boton.classList.toggle("activo", boton.dataset.pestana === nombre);
  });
  if (nombre === "inventario") renderInventario();
  if (nombre === "costos") renderCostos();
  if (nombre === "dashboard") renderDashboard();
}

// --- Exportar / Importar ---

function dataUrlABytes(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i);
  }
  return bytes;
}

let tablaCrc = null;
function crc32(bytes) {
  if (!tablaCrc) {
    tablaCrc = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      tablaCrc[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = tablaCrc[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function construirZip(archivos) {
  const codificador = new TextEncoder();
  const trozos = [];
  const centrales = [];
  let offset = 0;

  archivos.forEach(function (archivo) {
    const nombreBytes = codificador.encode(archivo.nombre);
    const datos = archivo.datos;
    const crc = crc32(datos);
    const tam = datos.length;

    const local = new Uint8Array(30 + nombreBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, tam, true);
    lv.setUint32(22, tam, true);
    lv.setUint16(26, nombreBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nombreBytes, 30);

    trozos.push(local, datos);

    const central = new Uint8Array(46 + nombreBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, tam, true);
    cv.setUint32(24, tam, true);
    cv.setUint16(28, nombreBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    central.set(nombreBytes, 46);
    centrales.push(central);

    offset += local.length + datos.length;
  });

  let tamCentral = 0;
  centrales.forEach(function (c) {
    tamCentral += c.length;
  });

  const fin = new Uint8Array(22);
  const fv = new DataView(fin.buffer);
  fv.setUint32(0, 0x06054b50, true);
  fv.setUint16(4, 0, true);
  fv.setUint16(6, 0, true);
  fv.setUint16(8, centrales.length, true);
  fv.setUint16(10, centrales.length, true);
  fv.setUint32(12, tamCentral, true);
  fv.setUint32(16, offset, true);
  fv.setUint16(20, 0, true);

  return new Blob(trozos.concat(centrales, [fin]), { type: "application/zip" });
}

function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

function construirContenidoWeb() {
  const imagenesNuevas = [];

  const productosExportar = state.productos.map(function (producto) {
    const imagenes = producto.imagenes.map(function (src, indice) {
      if (src.indexOf("data:") === 0) {
        const nombre = "img/" + producto.id + "-" + (indice + 1) + ".jpg";
        imagenesNuevas.push({ ruta: nombre, dataUrl: src });
        return nombre;
      }
      return src;
    });
    return {
      id: producto.id,
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio: producto.precio,
      descripcion: producto.descripcion,
      detalles: producto.detalles,
      usos: producto.usos,
      estado: producto.estado,
      imagenes: imagenes
    };
  });

  const contenido =
    "// Generado por admin.html\n\n" +
    "window.CATEGORIAS = " + JSON.stringify(state.categorias, null, 2) + ";\n\n" +
    "window.PRODUCTOS = " + JSON.stringify(productosExportar, null, 2) + ";\n";

  const contenidoInventario =
    "// Generado por admin.html\n\n" +
    "window.INVENTARIO = " + JSON.stringify({
      stock: state.inventario.stock,
      movimientos: state.inventario.movimientos,
      costos: state.inventario.costos || []
    }, null, 2) + ";\n";

  return {
    contenido: contenido,
    contenidoInventario: contenidoInventario,
    imagenes: imagenesNuevas
  };
}

function exportar() {
  const web = construirContenidoWeb();
  const archivos = [];

  web.imagenes.forEach(function (imagen) {
    archivos.push({ nombre: imagen.ruta, datos: dataUrlABytes(imagen.dataUrl) });
  });
  archivos.push({ nombre: "data.js", datos: new TextEncoder().encode(web.contenido) });
  archivos.push({ nombre: "inventario.js", datos: new TextEncoder().encode(web.contenidoInventario) });

  descargarBlob(construirZip(archivos), "reinventados.zip");
}

async function llamarGitHub(ruta, metodo, cuerpo, token) {
  const opciones = {
    method: metodo,
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    }
  };
  if (cuerpo) opciones.body = JSON.stringify(cuerpo);
  const respuesta = await fetch(API_GITHUB + ruta, opciones);
  const datos = await respuesta.json().catch(function () { return {}; });
  if (!respuesta.ok) {
    const detalle = datos && datos.message ? datos.message : "HTTP " + respuesta.status;
    const error = new Error(detalle);
    error.estado = respuesta.status;
    throw error;
  }
  return datos;
}

async function sha1DeBlob(bytes) {
  try {
    if (!crypto.subtle) return null;
    const cabecera = new TextEncoder().encode("blob " + bytes.length + "\0");
    const completo = new Uint8Array(cabecera.length + bytes.length);
    completo.set(cabecera, 0);
    completo.set(bytes, cabecera.length);
    const digesto = await crypto.subtle.digest("SHA-1", completo);
    return Array.from(new Uint8Array(digesto)).map(function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  } catch (error) {
    return null;
  }
}

function cambiosPublicables() {
  const web = construirContenidoWeb();
  const codificador = new TextEncoder();
  const lista = [
    {
      ruta: "data.js",
      bytes: codificador.encode(web.contenido),
      subida: { content: web.contenido, encoding: "utf-8" }
    },
    {
      ruta: "inventario.js",
      bytes: codificador.encode(web.contenidoInventario),
      subida: { content: web.contenidoInventario, encoding: "utf-8" }
    }
  ];
  web.imagenes.forEach(function (imagen) {
    lista.push({
      ruta: imagen.ruta,
      bytes: dataUrlABytes(imagen.dataUrl),
      subida: { content: imagen.dataUrl.split(",")[1], encoding: "base64" }
    });
  });
  return lista;
}

function mensajeErrorPublicacion(error) {
  let mensaje = error.message;
  if (error.estado === 401) {
    mensaje = "Token inválido o expirado (401).";
  } else if (error.estado === 403) {
    mensaje = "El token no tiene permiso sobre el repositorio (403).";
  } else if (error.estado === 409) {
    mensaje = "El repositorio cambió mientras publicabas; inténtalo otra vez (409).";
  } else if (String(mensaje).indexOf("Failed to fetch") !== -1) {
    mensaje = "sin conexión a internet.";
  }
  return mensaje;
}

async function sincronizarGitHub(token, progreso) {
  function decir(texto) {
    if (progreso) progreso(texto);
  }
  decir("Revisando cambios…");
  const rutaRepo = "/repos/" + DUENO_REPO + "/" + NOMBRE_REPO;
  const arbol = await llamarGitHub(rutaRepo + "/git/trees/main?recursive=1", "GET", null, token);
  const ref = await llamarGitHub(rutaRepo + "/git/ref/heads/main", "GET", null, token);

  const existentes = {};
  arbol.tree.forEach(function (item) {
    existentes[item.path] = item.sha;
  });

  const candidatos = cambiosPublicables();
  const pendientes = [];
  for (let i = 0; i < candidatos.length; i++) {
    const candidato = candidatos[i];
    const sha = await sha1DeBlob(candidato.bytes);
    if (sha === null || sha !== existentes[candidato.ruta]) {
      pendientes.push(candidato);
    }
  }

  if (pendientes.length === 0) {
    return { estado: "sin-cambios", archivos: 0 };
  }

  decir("Subiendo " + pendientes.length + " archivo(s)…");
  const entradas = [];
  for (let j = 0; j < pendientes.length; j++) {
    const pendiente = pendientes[j];
    const blob = await llamarGitHub(rutaRepo + "/git/blobs", "POST", pendiente.subida, token);
    entradas.push({ path: pendiente.ruta, mode: "100644", type: "blob", sha: blob.sha });
  }

  const nuevoArbol = await llamarGitHub(rutaRepo + "/git/trees", "POST", {
    base_tree: arbol.sha,
    tree: entradas
  }, token);

  const commit = await llamarGitHub(rutaRepo + "/git/commits", "POST", {
    message: "Actualización desde el panel - " + new Date().toLocaleString("es-CL"),
    tree: nuevoArbol.sha,
    parents: [ref.object.sha]
  }, token);

  await llamarGitHub(rutaRepo + "/git/refs/heads/main", "PATCH", { sha: commit.sha }, token);

  return { estado: "publicado", archivos: pendientes.length };
}

async function publicarGitHub() {
  const token = campoTokenGitHub.value.trim();
  if (!token) {
    avisoPublicar.textContent = "Pega tu token de GitHub para publicar.";
    return;
  }
  localStorage.setItem(CLAVE_TOKEN_GITHUB, token);
  const resultado = await sincronizarGitHub(token, function (texto) {
    avisoPublicar.textContent = texto;
  });
  if (resultado.estado === "sin-cambios") {
    avisoPublicar.textContent = "Todo ya está publicado ✓ (no hay cambios).";
  } else {
    avisoPublicar.textContent = "Publicado ✓ (" + resultado.archivos + " archivo(s)). GitHub Pages lo mostrará en ~1 minuto.";
  }
}

function publicacionAutomaticaActiva() {
  try {
    return localStorage.getItem(CLAVE_PUBLICACION_AUTO) !== "0";
  } catch (error) {
    return true;
  }
}

function mostrarAvisoPublicacionAuto(texto, tipo) {
  avisoPublicacionAuto.textContent = texto;
  avisoPublicacionAuto.className = "aviso-publicacion-auto aviso-publicacion-auto--" + tipo;
  avisoPublicacionAuto.hidden = false;
}

function ocultarAvisoPublicacionAuto() {
  avisoPublicacionAuto.hidden = true;
}

function programarPublicacionAutomatica(silencioso) {
  if (!publicacionAutomaticaActiva()) return;
  if (relojPublicacion) clearTimeout(relojPublicacion);
  if (!silencioso) {
    mostrarAvisoPublicacionAuto("Cambios sin publicar…", "esperando");
  }
  relojPublicacion = setTimeout(publicarAutomaticamente, RETRASO_PUBLICACION_AUTO);
}

async function publicarAutomaticamente() {
  relojPublicacion = null;
  if (publicacionEnCurso) {
    publicacionEnCola = true;
    return;
  }
  const token = campoTokenGitHub.value.trim();
  if (!token) {
    if (!avisoSinTokenMostrado) {
      avisoSinTokenMostrado = true;
      mostrarAvisoPublicacionAuto("Publicación automática pausada: pega tu token en la pestaña Productos.", "error");
      setTimeout(ocultarAvisoPublicacionAuto, 8000);
    }
    return;
  }
  publicacionEnCurso = true;
  try {
    const resultado = await sincronizarGitHub(token, function (texto) {
      mostrarAvisoPublicacionAuto(texto, "esperando");
    });
    localStorage.setItem(CLAVE_TOKEN_GITHUB, token);
    if (resultado.estado === "sin-cambios") {
      ocultarAvisoPublicacionAuto();
    } else {
      mostrarAvisoPublicacionAuto("Publicado ✓ (" + resultado.archivos + " archivo(s)). GitHub Pages lo mostrará en ~1 minuto.", "ok");
      setTimeout(ocultarAvisoPublicacionAuto, 6000);
    }
  } catch (error) {
    mostrarAvisoPublicacionAuto("Error al publicar: " + mensajeErrorPublicacion(error), "error");
  } finally {
    publicacionEnCurso = false;
    if (publicacionEnCola) {
      publicacionEnCola = false;
      programarPublicacionAutomatica();
    }
  }
}

formPublicar.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  if (publicacionEnCurso) {
    avisoPublicar.textContent = "Ya se está publicando…";
    return;
  }
  document.getElementById("boton-publicar").disabled = true;
  avisoPublicar.textContent = "";
  publicacionEnCurso = true;
  try {
    await publicarGitHub();
  } catch (error) {
    avisoPublicar.textContent = "Error al publicar: " + mensajeErrorPublicacion(error);
  } finally {
    publicacionEnCurso = false;
    document.getElementById("boton-publicar").disabled = false;
    if (publicacionEnCola) {
      publicacionEnCola = false;
      programarPublicacionAutomatica();
    }
  }
});

document.getElementById("boton-olvidar-token").addEventListener("click", function () {
  localStorage.removeItem(CLAVE_TOKEN_GITHUB);
  campoTokenGitHub.value = "";
  avisoSinTokenMostrado = false;
  if (relojPublicacion) clearTimeout(relojPublicacion);
  relojPublicacion = null;
  ocultarAvisoPublicacionAuto();
  avisoPublicar.textContent = "Token olvidado.";
});

campoAutoPublicacion.checked = publicacionAutomaticaActiva();
campoAutoPublicacion.addEventListener("change", function () {
  try {
    localStorage.setItem(CLAVE_PUBLICACION_AUTO, campoAutoPublicacion.checked ? "1" : "0");
  } catch (error) {}
  if (campoAutoPublicacion.checked) {
    avisoSinTokenMostrado = false;
    programarPublicacionAutomatica(true);
  } else {
    if (relojPublicacion) clearTimeout(relojPublicacion);
    relojPublicacion = null;
    ocultarAvisoPublicacionAuto();
  }
});

document.getElementById("boton-exportar").addEventListener("click", function () {
  try {
    exportar();
  } catch (error) {
    alert("No se pudo exportar: " + error.message);
  }
});

document.getElementById("campo-importar").addEventListener("change", function (evento) {
  const archivo = evento.target.files[0];
  if (!archivo) return;
  const lector = new FileReader();
  lector.onload = function () {
    try {
      const falso = {};
      const ejecutar = new Function("window", lector.result);
      ejecutar(falso);
      state.productos = falso.PRODUCTOS || [];
      state.categorias = falso.CATEGORIAS || [];
      asegurarCategorias();
      asegurarStock();
      guardarBorrador();
      limpiarFormulario();
      renderLista();
      renderInventario();
      renderDashboard();
      origenDatos.textContent = "Has importado un data.js. Edítalo y exporta cuando termines.";
      alert("Archivo data.js importado correctamente.");
    } catch (error) {
      alert("No se pudo leer el archivo data.js.");
    }
  };
  lector.onerror = function () {
    alert("No se pudo leer el archivo.");
  };
  lector.readAsText(archivo);
  evento.target.value = "";
});

document.getElementById("boton-descartar").addEventListener("click", function () {
  if (!confirm("¿Descartar el borrador y volver a los datos publicados (data.js e inventario.js)?")) return;
  localStorage.removeItem(CLAVE_BORRADOR);
  localStorage.removeItem(CLAVE_INVENTARIO);
  state.productos = clonar(window.PRODUCTOS || []);
  state.categorias = (window.CATEGORIAS || []).slice();
  const publicado = clonar(window.INVENTARIO || {});
  state.inventario = {
    stock: publicado.stock || {},
    movimientos: publicado.movimientos || [],
    costos: Array.isArray(publicado.costos) ? publicado.costos : []
  };
  asegurarCategorias();
  asegurarStock();
  limpiarFormulario();
  limpiarFormCosto();
  renderLista();
  renderInventario();
  renderCostos();
  renderDashboard();
  origenDatos.textContent = "Estás trabajando con los datos publicados actualmente en la web.";
});

selectCategoria.addEventListener("change", function () {
  bloqueCategoriaNueva.hidden = selectCategoria.value !== "__nueva__";
});

botonCancelar.addEventListener("click", function () {
  limpiarFormulario();
});

formProducto.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const nombre = document.getElementById("campo-nombre").value.trim();
  const precio = document.getElementById("campo-precio").value.trim();
  const descripcion = document.getElementById("campo-descripcion").value.trim();
  const detalles = document.getElementById("campo-detalles").value.trim();
  const usos = document.getElementById("campo-usos").value.trim();
  const archivos = document.getElementById("campo-imagenes").files;

  let categoria = selectCategoria.value;
  if (categoria === "__nueva__") {
    categoria = document.getElementById("campo-categoria-nueva").value.trim();
    if (!categoria) {
      alert("Escribe el nombre de la nueva categoría.");
      return;
    }
    if (!state.categorias.includes(categoria)) {
      state.categorias.push(categoria);
    }
  }

  if (!nombre) {
    alert("Escribe el nombre del producto.");
    return;
  }

  if (imagenesActuales.length === 0 && archivos.length === 0) {
    alert("Agrega al menos una imagen.");
    return;
  }

  botonGuardar.disabled = true;
  botonGuardar.textContent = "Guardando...";

  for (let i = 0; i < archivos.length; i++) {
    try {
      imagenesActuales.push(await redimensionarImagen(archivos[i]));
    } catch (error) {}
  }

  if (idEditando) {
    const producto = state.productos.find(function (p) {
      return p.id === idEditando;
    });
    producto.nombre = nombre;
    producto.categoria = categoria;
    producto.precio = precio || "A consultar";
    producto.descripcion = descripcion;
    producto.detalles = detalles;
    producto.usos = usos;
    producto.imagenes = imagenesActuales.slice();
  } else {
    state.productos.push({
      id: "prod-" + Date.now(),
      nombre: nombre,
      categoria: categoria,
      precio: precio || "A consultar",
      descripcion: descripcion,
      detalles: detalles,
      usos: usos,
      estado: "disponible",
      imagenes: imagenesActuales.slice()
    });
  }

  asegurarStock();
  guardarBorrador();
  limpiarFormulario();
  renderLista();
  renderInventario();
  renderDashboard();
  botonGuardar.disabled = false;
});

document.getElementById("pestanas").addEventListener("click", function (evento) {
  const boton = evento.target.closest("[data-pestana]");
  if (!boton) return;
  mostrarPestana(boton.dataset.pestana);
});

selectMovTipo.addEventListener("change", function () {
  if (selectMovTipo.value === "ajuste") {
    etiquetaMovCantidad.textContent = "Nuevo total en stock";
    campoMovCantidad.min = "0";
  } else {
    etiquetaMovCantidad.textContent = "Cuántas unidades";
    campoMovCantidad.min = "1";
  }
  cajaMovDescuento.hidden = selectMovTipo.value !== "venta";
  if (cajaMovDescuento.hidden) campoMovDescuento.value = "";
});

formMovimiento.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const producto = state.productos.find(function (p) {
    return p.id === selectMovProducto.value;
  });
  if (!producto) {
    alert("Elige un producto.");
    return;
  }

  const tipo = selectMovTipo.value;
  const cantidad = parseInt(campoMovCantidad.value, 10);
  const fecha = campoMovFecha.value;
  const nota = campoMovNota.value.trim();

  if (!fecha) {
    alert("Elige la fecha del movimiento.");
    return;
  }

  if (tipo === "ajuste") {
    if (isNaN(cantidad) || cantidad < 0) {
      alert("Escribe el nuevo total en stock (0 o más).");
      return;
    }
  } else {
    if (isNaN(cantidad) || cantidad < 1) {
      alert("Escribe cuántas unidades (1 o más).");
      return;
    }
    if ((tipo === "venta" || tipo === "baja") && cantidad > stockDe(producto.id)) {
      alert('Solo tienes ' + stockDe(producto.id) + ' unidades de "' + producto.nombre + '". Registra primero una reposición.');
      return;
    }
  }

  let descuento = 0;
  if (tipo === "venta") {
    descuento = parseFloat(campoMovDescuento.value);
    if (isNaN(descuento)) descuento = 0;
    if (descuento < 0) {
      alert("El descuento no puede ser negativo.");
      return;
    }
    const precioVenta = precioANumero(producto.precio);
    if (precioVenta !== null && descuento > precioVenta * cantidad) {
      alert("El descuento (" + formatoMoneda(descuento) + ") no puede superar el total de la venta (" + formatoMoneda(precioVenta * cantidad) + ").");
      return;
    }
  }

  aplicarMovimiento(producto, tipo, cantidad, fecha, nota, descuento);
  guardarBorrador();
  campoMovCantidad.value = "";
  campoMovNota.value = "";
  campoMovDescuento.value = "";
  renderInventario();
  renderDashboard();
});

selectDashModo.addEventListener("change", function () {
  actualizarVisibilidadFiltros();
  renderDashboard();
});

selectDashAnio.addEventListener("change", renderDashboard);
selectDashMes.addEventListener("change", renderDashboard);

cargar();
renderSelectCategorias();
renderMiniaturas();
renderLista();
actualizarVisibilidadFiltros();
campoMovFecha.value = hoyISO();
limpiarFormCosto();
selectCostoTipo.addEventListener("change", visibilidadCamposCosto);
campoCostoUnitario.addEventListener("input", function () { recalcularCosto("unitario"); });
campoCostoTotal.addEventListener("input", function () { recalcularCosto("total"); });
campoCostoCantidad.addEventListener("input", function () { recalcularCosto("cantidad"); });
formCosto.addEventListener("submit", function (evento) {
  evento.preventDefault();
  const error = guardarCosto();
  if (error) {
    alert(error);
    return;
  }
  limpiarFormCosto();
});
botonCostoCancelar.addEventListener("click", limpiarFormCosto);
try {
  campoTokenGitHub.value = localStorage.getItem(CLAVE_TOKEN_GITHUB) || "";
} catch (error) {}
if (campoTokenGitHub.value.trim() && publicacionAutomaticaActiva()) {
  programarPublicacionAutomatica(true);
}
