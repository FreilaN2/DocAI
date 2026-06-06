# Plan de Implementación — Sistema de Correos

## Objetivo

Implementar el envío de emails funcionales para recuperación de contraseña y verificación de cuenta usando **fastapi-mail + SendGrid SMTP**, con URL del frontend configurable por entorno.

## Stack elegido

| Componente | Elección | Razón |
|---|---|---|
| Librería | `fastapi-mail` | Async nativa, connection pool, Jinja2 integrado, ~5 líneas por envío |
| Proveedor | **SendGrid** (SMTP) | Plan gratis: 100 emails/día, mejor entregabilidad que SMTP propio |
| Templates | Jinja2 (inline en `fastapi-mail`) | HTML responsive con variables dinámicas |

## Dependencias

Agregar a `backend/requirements.txt`:

```txt
fastapi-mail==1.4.2
```

## Variables de entorno

Agregar a `backend/.env`:

```env
# --- SendGrid SMTP ---
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.tu_api_key_aqui
MAIL_FROM=noreply@docia.qzz.io
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_STARTTLS=True
MAIL_SSL_TLS=False

# --- URL del Frontend (para enlaces en correos) ---
FRONTEND_URL=http://localhost:5173
```

En **producción** se cambia `FRONTEND_URL=https://docia.qzz.io`.

## 1. Módulo de correo

**Archivo nuevo:** `backend/core/mail.py`

- Configuración `ConnectionConfig` de `fastapi-mail` leyendo variables de entorno
- Función `send_reset_email(email: str, token: str)`:
  - Renderiza template `reset_password.html` con `{reset_url}`
  - `reset_url = f"{FRONTEND_URL}/reset-password?token={token}"`
  - Envía vía `FastMail.send_message()`
- Función `send_verification_email(email: str, token: str)`:
  - Renderiza template `verify_email.html` con `{verify_url}`
  - `verify_url = f"{FRONTEND_URL}/verify-email?token={token}"`
  - Envía vía `FastMail.send_message()`

Importante: `FRONTEND_URL` se lee con `os.getenv("FRONTEND_URL", "http://localhost:5173")`.

## 2. Templates HTML

**Archivos nuevos:** `backend/templates/emails/`

### `reset_password.html`
- Diseño responsive, fondo claro, header con logo "DocAI"
- Encabezado: "Recuperación de contraseña"
- Texto: "Recibiste una solicitud para restablecer tu contraseña..."
- Botón CTA "Restablecer contraseña" que linkea a `{{ reset_url }}`
- Nota: "Este enlace expira en 30 minutos"
- Footer: "Si no solicitaste esto, ignora este mensaje."

### `verify_email.html`
- Mismo diseño base
- Encabezado: "Verifica tu correo electrónico"
- Texto: "Gracias por registrarte en DocAI..."
- Botón CTA "Verificar cuenta" que linkea a `{{ verify_url }}`
- Nota: "Este enlace expira en 24 horas"

## 3. Actualizar endpoints

**Archivo:** `backend/main.py`

### `POST /forgot-password` (línea 253)
```python
@app.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return {"status": "success", "message": "Si el correo existe, recibirás un enlace para restablecer tu contraseña."}

    reset_token = create_reset_token(data.email)
    await send_reset_email(data.email, reset_token)

    return {
        "status": "success",
        "message": "Revisa tu correo electrónico para restablecer tu contraseña.",
    }
```

Cambios:
- Se elimina `logger.info` del token (ya no se expone)
- Se elimina `reset_token` de la respuesta JSON
- Se agrega `await send_reset_email(data.email, reset_token)`

### `POST /send-verification` (línea 285)
```python
@app.post("/send-verification")
async def send_verification(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return {"status": "success", "message": "Si el correo existe, recibirás un enlace de verificación."}

    verify_token = create_verification_token(data.email)
    await send_verification_email(data.email, verify_token)

    return {
        "status": "success",
        "message": "Revisa tu correo electrónico para verificar tu cuenta.",
    }
```

Mismos cambios que en forgot-password.

## 4. Página "Olvidé contraseña"

**Archivo nuevo:** `frontend/src/pages/ForgotPassword.jsx`

- Layout similar a Auth.jsx (mismo diseño de card, blur background, animaciones)
- Formulario con solo campo **email**
- Validación: email válido (regex), campo requerido
- `POST /forgot-password` al backend
- Toast de éxito: "Revisa tu correo electrónico"
- Link "Volver al inicio de sesión" → `/login`
- Loading state en botón
- Manejo de errores (toast)

## 5. Página "Restablecer contraseña"

**Archivo nuevo:** `frontend/src/pages/ResetPassword.jsx`

- Obtiene `?token=` de la URL con `useSearchParams`
- Si no hay token, mostrar mensaje de error y link a `/forgot-password`
- Formulario con:
  - **Nueva contraseña** (con indicador de fortaleza, como en Auth.jsx)
  - **Confirmar contraseña**
- Validación:
  - Mínimo 8 caracteres
  - Debe incluir mayúscula, minúscula y número
  - Contraseñas coinciden
- `POST /reset-password` con `{ token, new_password }`
- Toast de éxito: "Contraseña actualizada correctamente. Redirigiendo al login..."
- Redirección a `/login` tras 2 segundos
- Loading state

## 6. Link en Auth.jsx

**Archivo:** `frontend/src/pages/Auth.jsx`

- Agregar debajo del botón de submit (solo en modo login):
  ```jsx
  <p className="text-center mt-4">
    <Link to="/forgot-password" className="text-sm text-primary-container font-bold hover:underline">
      ¿Olvidaste tu contraseña?
    </Link>
  </p>
  ```
- Importar `Link` de `react-router-dom` (ya está importado)

## 7. Rutas en App.jsx

**Archivo:** `frontend/src/App.jsx`

```jsx
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
```

## 8. (Opcional) Traducciones

Si se quiere mantener i18n, agregar keys en `frontend/src/locales/es.json` y `en.json`:

- `forgot_password.title`
- `forgot_password.subtitle`
- `forgot_password.email_label`
- `forgot_password.submit_btn`
- `forgot_password.back_to_login`
- `forgot_password.success`
- `reset_password.title`
- `reset_password.new_password_label`
- `reset_password.confirm_password_label`
- `reset_password.submit_btn`
- `reset_password.success`
- `reset_password.invalid_token`

## Orden de implementación sugerido

```
Backend: 1 → 2 → 3 → 4
Frontend: 5 → 6 → 7 → 8 → 9
Pruebas: Probar flujo completo en localhost:5173
```

## Notas importantes

- SendGrid requiere crear una **API Key** en el dashboard: Settings → API Keys → Create API Key (acceso completo o restringido a Mail Send)
- La contraseña SMTP de SendGrid es la API Key (NO el password de la cuenta)
- Si se usa Gmail en dev, usar **contraseña de aplicación** con 2FA activado
- `fastapi-mail` usa `jinja2` por defecto; los templates deben estar en `templates/emails/`
- La `FRONTEND_URL` se setea en `backend/.env` (no confundir con la variable `VITE_*` del frontend)
