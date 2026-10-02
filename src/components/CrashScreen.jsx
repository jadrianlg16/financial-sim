import { clearPersisted } from '../storage/persistence.js';

// Last-resort screen when the app itself fails to render. It uses inline styles
// rather than the app's classes; of theme.css only the global resets reach it
// (border-box sizing, no body margin), so it keeps its own 8px side margins.
export const CrashScreen = () => (
  <div
    role="alert"
    style={{
      fontFamily: 'system-ui, sans-serif',
      width: 'calc(100% - 16px)',
      maxWidth: 592,
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
