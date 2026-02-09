# Finanzas Personales

Una aplicación web completa para gestionar tus finanzas personales. Registra ingresos y gastos, visualiza tendencias con gráficos interactivos y filtra tus transacciones por fecha o categoría.

## Características

- 📊 **Gráficos interactivos** - Visualiza gastos por categoría (pie chart) y flujo mensual de ingresos/gastos (bar chart)
- 📝 **CRUD completo** - Crea, lee, actualiza y elimina transacciones fácilmente
- 🔍 **Filtrado avanzado** - Filtra por rango de fechas y categoría
- 📱 **Responsive** - Funciona perfectamente en desktop y móvil
- 🌙 **Modo oscuro** - Alterna entre modo claro y oscuro (con persistencia)
- 📄 **Paginación** - Navega por tus transacciones de forma eficiente
- 💾 **Persistencia** - Los datos se guardan en SQLite automáticamente

## Requisitos

- Python 3.8+
- pip (gestor de paquetes de Python)

## Instalación

1. **Clonar o descargar el proyecto**

   ```bash
   cd ProyectoFinanzas
   ```

2. **Instalar dependencias del backend**

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Ejecutar el servidor**

   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

4. **Abrir la aplicación**
   - Accede a `http://localhost:8000/static/` en tu navegador
   - O ajusta la IP en `frontend/app.js` si ejecutas desde otra máquina

## Estructura del Proyecto

```
ProyectoFinanzas/
├── backend/
│   ├── database.py      # Configuración de SQLite
│   ├── models.py        # Modelos de datos (Transaction)
│   ├── main.py          # API FastAPI + rutas
│   └── requirements.txt  # Dependencias de Python
├── frontend/
│   ├── index.html       # Estructura HTML
│   ├── styles.css       # Estilos (incluye dark mode)
│   └── app.js           # Lógica de frontend
├── data/
│   └── finances.db      # Base de datos SQLite (se crea automáticamente)
└── README.md            # Este archivo
```

## API Endpoints

| Método | Endpoint             | Descripción                     |
| ------ | -------------------- | ------------------------------- |
| GET    | `/transactions`      | Obtiene todas las transacciones |
| POST   | `/transactions`      | Crea una nueva transacción      |
| PUT    | `/transactions/{id}` | Actualiza una transacción       |
| DELETE | `/transactions/{id}` | Elimina una transacción         |

## Formato de Datos

### Transacción

```json
{
  "id": 1,
  "date": "2025-02-09",
  "amount": 50.0,
  "type": "expense", // "expense" o "income"
  "category": "Alimentación",
  "description": "Supermercado"
}
```

## Características de la UI

- **Panel lateral** - Abre con el botón `+` para añadir o editar transacciones
- **Tabla de transacciones** - Visualiza todos tus registros con acciones (Editar/Eliminar)
- **Dashboard** - Resumen de ingresos, gastos y balance
- **Gráficos** - Distribución de gastos y flujo mensual
- **Filtros** - Por rango de fechas y categoria
- **Modo oscuro** - Click en el icono 🌙/☀️ en la esquina superior derecha

## Notas de Desarrollo

- La fronted está servida estáticamente desde `/static` por FastAPI
- Los datos se formatean como `dd/mm/yy` en la UI pero se almacenan en ISO (`YYYY-MM-DD`)
- Las cantidades se muestran en euros (€) con formato localizado para español
- El modo oscuro se persiste en `localStorage`

## Deployment (Producción)

Para desplegar en producción:

1. Ejecuta con un servidor UWSGI o Gunicorn:

   ```bash
   gunicorn -w 4 backend.main:app --bind 0.0.0.0:8000
   ```

2. Configura un reverse proxy (nginx/Apache) con TLS
3. Registra un dominio y apunta el DNS
4. Considera usar herramientas como ngrok o Cloudflare Tunnel para acceso remoto durante desarrollo

## Licencia

Proyecto personal - Libre para usar y modificar.
