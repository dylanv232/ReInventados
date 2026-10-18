// Tienda pública. Lee los datos publicados en data.js (window.PRODUCTOS).

const productos = window.PRODUCTOS || [];
const categorias = window.CATEGORIAS || [];

const galeria = document.getElementById("galeria");
const galeriaHogar = document.getElementById("galeria-hogar");
const submenu = document.getElementById("submenu");
const detalle = document.getElementById("detalle");
const menuProductos = document.getElementById("menu-productos");

let categoriaActiva = "Todas";

function crearFlecha(direccion, texto) {
  const boton = document.createElement("button");
  boton.className = "deslizador__flecha deslizador__flecha--" + direccion;
  boton.textContent = texto;
  return boton;
}

function crearTarjeta(producto) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta";

  const deslizador = document.createElement("div");
  deslizador.className = "deslizador";

  const imagen = document.createElement("img");
  imagen.className = "deslizador__imagen";
  imagen.alt = producto.nombre;

  let indice = 0;
  function pintar() {
    if (producto.imagenes.length === 0) return;
    imagen.src = producto.imagenes[indice];
  }

  if (producto.imagenes.length > 1) {
    const izq = crearFlecha("izq", "\u2039");
    const der = crearFlecha("der", "\u203a");
    izq.addEventListener("click", function (e) {
      e.stopPropagation();
      indice = (indice - 1 + producto.imagenes.length) % producto.imagenes.length;
      pintar();
    });
    der.addEventListener("click", function (e) {
      e.stopPropagation();
      indice = (indice + 1) % producto.imagenes.length;
      pintar();
    });
    deslizador.appendChild(imagen);
    deslizador.appendChild(izq);
    deslizador.appendChild(der);
  } else {
    deslizador.appendChild(imagen);
  }

  pintar();

  const info = document.createElement("div");
  info.className = "tarjeta__info";
  info.innerHTML =
    '<h3 class="tarjeta__nombre">' + producto.nombre + "</h3>" +
    '<p class="tarjeta__precio">' + producto.precio + "</p>";

  if (producto.estado === "vendido") {
    const insignia = document.createElement("span");
    insignia.className = "insignia";
    insignia.textContent = "Ya tiene hogar";
    info.appendChild(insignia);
  }

  tarjeta.appendChild(deslizador);
  tarjeta.appendChild(info);
  tarjeta.addEventListener("click", function () {
    abrirDetalle(producto.id);
  });

  return tarjeta;
}

function renderSubmenu() {
  const opciones = ["Todas"].concat(categorias);
  submenu.innerHTML = "";
  opciones.forEach(function (cat) {
    const boton = document.createElement("button");
    boton.className = "submenu__boton" + (cat === categoriaActiva ? " activo" : "");
    boton.textContent = cat;
    boton.dataset.categoria = cat;
    boton.addEventListener("click", function (e) {
      e.stopPropagation();
      categoriaActiva = cat;
      renderSubmenu();
      renderGaleria(galeria, "disponible");
      mostrarVista("productos");
      menuProductos.classList.remove("abierto");
    });
    submenu.appendChild(boton);
  });
}

function renderGaleria(contenedor, estado) {
  contenedor.innerHTML = "";
  let lista = productos.filter(function (p) {
    return p.estado === estado;
  });

  if (estado === "disponible") {
    lista = lista.filter(function (p) {
      return categoriaActiva === "Todas" || p.categoria === categoriaActiva;
    });
  }

  if (lista.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "introduccion";
    vacio.textContent = estado === "vendido"
      ? "Todavía no hay diseños vendidos."
      : "Todavía no hay productos en esta categoría.";
    contenedor.appendChild(vacio);
    return;
  }

  lista.forEach(function (producto) {
    contenedor.appendChild(crearTarjeta(producto));
  });
}

function abrirDetalle(id) {
  const producto = productos.find(function (p) {
    return p.id === id;
  });
  if (!producto) return;

  detalle.innerHTML = "";

  const deslizador = document.createElement("div");
  deslizador.className = "detalle__deslizador";

  const imagen = document.createElement("img");
  imagen.className = "detalle__imagen";
  imagen.alt = producto.nombre;

  let indice = 0;
  function pintar() {
    if (producto.imagenes.length === 0) return;
    imagen.src = producto.imagenes[indice];
  }

  deslizador.appendChild(imagen);

  if (producto.imagenes.length > 1) {
    const izq = crearFlecha("izq", "\u2039");
    const der = crearFlecha("der", "\u203a");
    izq.addEventListener("click", function () {
      indice = (indice - 1 + producto.imagenes.length) % producto.imagenes.length;
      pintar();
    });
    der.addEventListener("click", function () {
      indice = (indice + 1) % producto.imagenes.length;
      pintar();
    });
    deslizador.appendChild(izq);
    deslizador.appendChild(der);
  }

  pintar();

  const ficha = document.createElement("div");
  ficha.innerHTML =
    '<span class="detalle__categoria">' + producto.categoria + "</span>" +
    '<h2 class="detalle__titulo">' + producto.nombre + "</h2>" +
    '<p class="detalle__precio">' + producto.precio + "</p>";

  if (producto.estado === "vendido") {
    const insignia = document.createElement("span");
    insignia.className = "insignia";
    insignia.textContent = "Ya tiene hogar";
    ficha.appendChild(insignia);
  }

  ficha.innerHTML +=
    '<div class="detalle__seccion"><h3>Descripción</h3><p>' + producto.descripcion + "</p></div>" +
    '<div class="detalle__seccion"><h3>Detalles</h3><p>' + producto.detalles + "</p></div>" +
    '<div class="detalle__seccion"><h3>Usos</h3><p>' + producto.usos + "</p></div>";

  detalle.appendChild(deslizador);
  detalle.appendChild(ficha);
  mostrarVista("detalle");
}

function mostrarVista(nombre) {
  document.querySelectorAll(".vista").forEach(function (v) {
    v.classList.remove("activa");
  });
  document.getElementById("vista-" + nombre).classList.add("activa");
  document.querySelectorAll(".menu__boton[data-vista]").forEach(function (b) {
    b.classList.toggle("activo", b.dataset.vista === nombre);
  });
  window.scrollTo(0, 0);
}

document.querySelectorAll(".menu__boton[data-vista]").forEach(function (boton) {
  boton.addEventListener("click", function () {
    const vista = boton.dataset.vista;
    if (vista === "productos") {
      menuProductos.classList.toggle("abierto");
    } else {
      menuProductos.classList.remove("abierto");
    }
    mostrarVista(vista);
  });
});

document.getElementById("boton-volver").addEventListener("click", function () {
  mostrarVista("productos");
});

renderSubmenu();
renderGaleria(galeria, "disponible");
renderGaleria(galeriaHogar, "vendido");
