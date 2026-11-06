// Hilo principal: maneja la interfaz y delega el parseo al Web Worker.
const inputArchivo = document.getElementById('archivo');
const nombreArchivo = document.getElementById('nombreArchivo');
const estado = document.getElementById('estado');
const thead = document.querySelector('#tabla thead');
const tbody = document.querySelector('#tabla tbody');

let worker = null;

function mostrarEstado(texto, clase = '') {
  estado.textContent = texto;
  estado.className = 'estado ' + clase;
}

function limpiarTabla() {
  thead.innerHTML = '';
  tbody.innerHTML = '';
}

function dibujarEncabezado(columnas) {
  const tr = document.createElement('tr');
  columnas.forEach(texto => {
    const th = document.createElement('th');
    th.textContent = texto;
    tr.appendChild(th);
  });
  thead.appendChild(tr);
}

function agregarFilas(filas) {
  const fragmento = document.createDocumentFragment();
  filas.forEach(fila => {
    const tr = document.createElement('tr');
    fila.forEach(valor => {
      const td = document.createElement('td');
      td.textContent = valor;
      tr.appendChild(td);
    });
    fragmento.appendChild(tr);
  });
  tbody.appendChild(fragmento);
}

inputArchivo.addEventListener('change', () => {
  const archivo = inputArchivo.files[0];
  if (!archivo) return;

  nombreArchivo.textContent = archivo.name;
  limpiarTabla();
  mostrarEstado('Procesando archivo...');

  // Si había un worker anterior en ejecución, se descarta
  if (worker) worker.terminate();
  worker = new Worker('js/worker.js');

  worker.onmessage = (e) => {
    const msg = e.data;
    switch (msg.tipo) {
      case 'encabezado':
        dibujarEncabezado(msg.columnas);
        break;
      case 'filas':
        agregarFilas(msg.filas);
        break;
      case 'fin':
        mostrarEstado(`Listo: ${msg.totalFilas} filas cargadas.`, 'ok');
        worker.terminate();
        worker = null;
        break;
      case 'error':
        mostrarEstado('Error: ' + msg.mensaje, 'error');
        break;
    }
  };

  worker.onerror = (err) => {
    mostrarEstado('Error en el worker: ' + err.message, 'error');
  };

  // Se envía el archivo al worker
  worker.postMessage(archivo);
});
