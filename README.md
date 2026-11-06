# Visor CSV con Web Workers

Página simple que carga un archivo CSV y lo muestra en una tabla HTML.
El parseo se hace en un Web Worker (js/worker.js) para no bloquear la interfaz.

## Estructura
- index.html       -> página principal
- css/styles.css   -> estilos
- js/main.js       -> interfaz (hilo principal)
- js/worker.js     -> Web Worker que parsea el CSV
- ejemplo/empleados.csv -> archivo de prueba

## Cómo probar (Ubuntu)
    cd visor-csv
    python3 -m http.server 8000
Abrir http://localhost:8000 en el navegador y seleccionar un CSV.

Nota: los Web Workers no funcionan abriendo index.html con doble clic (file://),
por eso se necesita el servidor local.
