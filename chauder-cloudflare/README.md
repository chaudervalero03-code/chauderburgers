# Chauder Burgers — proyecto web

Este ZIP contiene el código fuente React/Vite organizado como proyecto para compilar.

## Importante para Cloudflare
Este proyecto **no es una carpeta estática ya compilada**. El archivo original es React/JSX, por lo que no debe publicarse con la opción “Upload your static files” como si fuera HTML listo.

Para desplegarlo con compilación automática, sube el contenido de este proyecto a un repositorio GitHub y conéctalo desde Cloudflare Workers & Pages. Configuración de build:
- Build command: `npm run build`
- Build output directory: `dist`

Nota: se intentó instalar las dependencias para generar `dist` aquí, pero la instalación no terminó dentro del tiempo disponible. Por eso no se incluye una compilación verificada.
