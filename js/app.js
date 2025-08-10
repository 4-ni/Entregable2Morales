// ------------------------- Datos -------------------------
const STORAGE_KEYS = {
  productos: 'productos',
  carrito:   'carrito',
  ordenes:   'ordenes',
};

// Catálogo inicial
const CATALOGO_INICIAL = [
  { id: 'p1', nombre: 'Café', precio: 1200 },
  { id: 'p2', nombre: 'Pan',  precio: 800  },
  { id: 'p3', nombre: 'Leche', precio: 1100 },
  { id: 'p4', nombre: 'Huevos (12)', precio: 3200 },
];

// --------------------- Utilidades básicas ----------------
function $(id){ return document.getElementById(id); }
function clp(n){
  return new Intl.NumberFormat('es-CL',{ style:'currency', currency:'CLP', maximumFractionDigits:0 }).format(n);
}
function leerLS(key, fallback){
  const v = localStorage.getItem(key);
  return v ? JSON.parse(v) : fallback;
}
function escribirLS(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}
function msg(texto){
  const el = $('msg');
  el.textContent = texto;
  el.classList.add('show');
  setTimeout(()=> el.classList.remove('show'), 1500);
}

// ------------------------- Estado ------------------------
let productos = leerLS(STORAGE_KEYS.productos, CATALOGO_INICIAL);
let carrito   = leerLS(STORAGE_KEYS.carrito, []);
let ordenes   = leerLS(STORAGE_KEYS.ordenes, []);
let filtro    = "";

// ----------------------- Renderizado ---------------------
function renderProductos(){
  const ul = $('listaProductos');
  ul.innerHTML = '';

  const visibles = productos.filter(p => p.nombre.toLowerCase().includes(filtro));
  visibles.forEach(p => {
    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `
      <span><strong>${p.nombre}</strong></span>
      <span class="precio">${clp(p.precio)}</span>
      <button class="btn">Agregar</button>
    `;
    li.querySelector('button').addEventListener('click', () => {
      agregarAlCarrito(p.id);
      renderCarrito();
      msg('Agregado al carrito');
    });
    ul.appendChild(li);
  });
}

function renderCarrito(){
  const tbody = $('cuerpoCarrito');
  const vacio = $('carritoVacio');
  const tabla = $('tablaCarrito');

  tbody.innerHTML = '';
  let total = 0;

  carrito.forEach(item => {
    const p = productos.find(x => x.id === item.productoId);
    if(!p) return;
    const subtotal = p.precio * item.cant;
    total += subtotal;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.nombre}</td>
      <td><input type="number" min="1" value="${item.cant}" style="width:60px"></td>
      <td class="der">${clp(p.precio)}</td>
      <td class="der">${clp(subtotal)}</td>
      <td class="der"><button class="btn rojo">Quitar</button></td>
    `;

    // Cambiar cantidad (simple)
    tr.querySelector('input').addEventListener('change', (e)=>{
      const v = parseInt(e.target.value, 10);
      cambiarCantidad(item.productoId, (Number.isNaN(v) || v < 1) ? 1 : v);
      renderCarrito();
    });

    // Quitar ítem
    tr.querySelector('button').addEventListener('click', ()=>{
      quitarDelCarrito(item.productoId);
      renderCarrito();
      msg('Producto quitado');
    });

    tbody.appendChild(tr);
  });

  $('totalCarrito').textContent = clp(total);
  const hayItems = carrito.length > 0;
  vacio.hidden = hayItems;
  tabla.hidden = !hayItems;
}

function renderOrdenes(){
  const ul = $('listaOrdenes');
  ul.innerHTML = '';
  ordenes.forEach(o=>{
    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `
      <div><strong>Orden #${o.id}</strong> — ${new Date(o.cuando).toLocaleString()}</div>
      <div>Total: <strong>${clp(o.total)}</strong></div>
    `;
    ul.appendChild(li);
  });
}

// ----------------------- Lógica --------------------------
function agregarAlCarrito(id){
  const item = carrito.find(x => x.productoId === id);
  if (item) item.cant += 1;
  else carrito.push({ productoId: id, cant: 1 });
  escribirLS(STORAGE_KEYS.carrito, carrito);
}

function cambiarCantidad(id, cant){
  const item = carrito.find(x => x.productoId === id);
  if (item) item.cant = cant;
  escribirLS(STORAGE_KEYS.carrito, carrito);
}

function quitarDelCarrito(id){
  carrito = carrito.filter(x => x.productoId !== id);
  escribirLS(STORAGE_KEYS.carrito, carrito);
}

function vaciarCarrito(){
  carrito = [];
  escribirLS(STORAGE_KEYS.carrito, carrito);
}

function totalCarrito(){
  let t = 0;
  for (const it of carrito){
    const p = productos.find(x => x.id === it.productoId);
    if (p) t += p.precio * it.cant;
  }
  return t;
}

function comprar(){
  if (carrito.length === 0){ msg('El carrito está vacío'); return; }

  const ultimoId = ordenes.length ? ordenes[ordenes.length - 1].id : 0;
  const nueva = {
    id: ultimoId + 1,
    total: totalCarrito(),
    cuando: Date.now(),
    items: carrito.slice()
  };

  ordenes.push(nueva);
  escribirLS(STORAGE_KEYS.ordenes, ordenes);
  vaciarCarrito();
  renderCarrito();
  renderOrdenes();
  msg('Compra simulada ✅');
}

// ---------------------- Eventos DOM ----------------------
window.addEventListener('DOMContentLoaded', () => {
  // Filtro
  $('filtro').addEventListener('input', (e)=>{
    filtro = (e.target.value || '').toLowerCase();
    renderProductos();
  });

  // Form agregar producto
  $('formProducto').addEventListener('submit', (e)=>{
    e.preventDefault();
    const nombre = $('nombreProducto').value.trim();
    const precio = parseInt($('precioProducto').value, 10);

    if (!nombre){ msg('Falta el nombre'); return; }
    if (!Number.isFinite(precio) || precio <= 0){ msg('Precio inválido'); return; }

    const id = 'p' + Math.random().toString(36).slice(2,8);
    productos.push({ id, nombre, precio });
    escribirLS(STORAGE_KEYS.productos, productos);

    e.target.reset();
    renderProductos();
    msg('Producto agregado');
  });

  // Botones carrito
  $('btnVaciar').addEventListener('click', ()=> { vaciarCarrito(); renderCarrito(); msg('Carrito vacío'); });
  $('btnComprar').addEventListener('click', comprar);

  // Primer render
  renderProductos();
  renderCarrito();
  renderOrdenes();
});