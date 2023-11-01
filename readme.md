Variables de entorno que deben configurarse en el archivo `.env` para la aplicación web.

# Configuración de Variables de Entorno

Este archivo `Readme.md` describe las variables de entorno necesarias para configurar y ejecutar esta aplicación web. Debes configurar estas variables en un archivo `.env` en la raíz del proyecto.

## Pasos para Configurar las Variables de Entorno

1. **MONGODB_STRING_CONN:** Esta variable debe contener la cadena de conexión a tu base de datos MongoDB. Debes proporcionar la cadena de conexión completa, que incluye el nombre de usuario, contraseña, dirección del servidor y nombre de la base de datos.

   ```plaintext
   MONGODB_STRING_CONN=mongodb+srv://<usuario>:<contraseña>@<cluster>.mongodb.net/<base-de-datos>
   ```
2. **SECRET_SESSION_KEY:** Esta variable se utiliza para establecer la clave secreta para la gestión de sesiones en tu aplicación. Debe ser una cadena secreta y única para garantizar la seguridad de las sesiones de usuario.

   ```plaintext
   SECRET_SESSION_KEY=<clave-secreta>
   ```
3. **CAPTCHA_GOOGLE_SECRET_KEY:** Esta variable se utiliza para configurar la clave secreta de Google reCAPTCHA. Debes registrarte en el servicio reCAPTCHA de Google y obtener una clave secreta para proteger tu formulario de registro. Asegurate de cambiar tambien el SITE_KEY en todos los lugares donde uses el captcha puedes buscarlo en el proyecto con el parametro *data-sitekey*.

   ```plaintext
   CAPTCHA_GOOGLE_SECRET_KEY=<clave-secreta-de-recaptcha>
   ```

## Archivo .env

Crea un archivo llamado `.env` en la raíz de tu proyecto y configura las variables de entorno de acuerdo a las especificaciones anteriores.

Ejemplo de un archivo `.env`:

```plaintext
MONGODB_STRING_CONN=mongodb+srv://usuario:contraseña@cluster.mongodb.net/base-de-datos
SECRET_SESSION_KEY=fOcaFUUEGXvqCImkmdnQnOZXdBOs514p
CAPTCHA_GOOGLE_SECRET_KEY=6Lf_E3IUAAAAALPpmwqwRYMAiW5i31S3Xw-7JOfg
```

Asegúrate de mantener este archivo `.env` en secreto y no lo compartas públicamente, ya que puede contener información confidencial.

**Nota:** Asegúrate de seguir las mejores prácticas de seguridad al manejar variables de entorno y no las incluyas en repositorios públicos ni las expongas en entornos de producción.
