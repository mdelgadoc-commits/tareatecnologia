// Web Worker: lee y parsea el CSV fuera del hilo principal.
// Soporta comillas dobles, comas y saltos de línea dentro de campos entre comillas.

const TAMANO_LOTE = 500; // filas enviadas por mensaje

function parsearCSV(texto, separador, alEmitirFila) {
  let campo = '';
  let fila = [];
  let entreComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];

    if (entreComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; } // comilla escapada ""
        else entreComillas = false;
      } else {
        campo += c;
      }
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === separador) {
      fila.push(campo); campo = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      fila.push(campo); campo = '';
      alEmitirFila(fila);
      fila = [];
    } else {
      campo += c;
    }
  }

  // Última fila si el archivo no termina en salto de línea
  if (campo !== '' || fila.length > 0) {
    fila.push(campo);
    alEmitirFila(fila);
  }
}

// Detecta el separador (coma o punto y coma) mirando la primera línea
function detectarSeparador(texto) {
  const primeraLinea = texto.split(/\r?\n/, 1)[0];
  const comas = (primeraLinea.match(/,/g) || []).length;
  const puntoYComa = (primeraLinea.match(/;/g) || []).length;
  return puntoYComa > comas ? ';' : ',';
}

self.onmessage = async (e) => {
  try {
    const archivo = e.data;
    let texto = await archivo.text();
    if (texto.charCodeAt(0) === 0xFEFF) texto = texto.slice(1); // quitar BOM

    if (texto.trim() === '') {
      self.postMessage({ tipo: 'error', mensaje: 'El archivo está vacío.' });
      return;
    }

    const separador = detectarSeparador(texto);
    let esPrimera = true;
    let lote = [];
    let total = 0;

    parsearCSV(texto, separador, (fila) => {
      // Ignorar líneas totalmente vacías
      if (fila.length === 1 && fila[0] === '') return;

      if (esPrimera) {
        self.postMessage({ tipo: 'encabezado', columnas: fila });
        esPrimera = false;
        return;
      }

      lote.push(fila);
      total++;
      if (lote.length >= TAMANO_LOTE) {
        self.postMessage({ tipo: 'filas', filas: lote });
        lote = [];
      }
    });

    if (lote.length > 0) self.postMessage({ tipo: 'filas', filas: lote });
    self.postMessage({ tipo: 'fin', totalFilas: total });
  } catch (err) {
    self.postMessage({ tipo: 'error', mensaje: err.message });
  }
};
