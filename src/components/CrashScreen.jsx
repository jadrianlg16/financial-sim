import { clearPersisted } from '../storage/persistence.js';

// Last-resort screen when the app itself fails to render. It cannot rely on the
// app's theme (that is rendered by App), so it carries its own inline styles.
export const CrashScreen = () => (
  <div
    role="alert"
    style={{
      fontFamily: 'system-ui, sans-serif',
      maxWidth: 560,
      margin: '80px auto',
      padding: '0 16px',
      color: '#181410',
      lineHeight: 1.6,
    }}
  >
    <h1 style={{ fontSize: 24 }}>La app no pudo iniciar</h1>
    <p>
      Suele deberse a datos guardados en este navegador por una versión anterior. Puedes borrarlos y
      volver a cargar con los valores iniciales.
    </p>
    <button
      type="button"
      onClick={() => {
        clearPersisted();
        window.location.reload();
      }}
    >
      Borrar datos guardados y recargar
    </button>
  </div>
);
