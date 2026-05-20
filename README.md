# Asistente IA — GM Ingenieros y Consultores

Interfaz interna para consumir el agente de Azure AI. Solo para uso del personal del proyecto.

---

## Requisitos

- Node.js 18 o superior
- Agente creado en Azure AI Foundry (o Azure OpenAI Assistants)

---

## Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear el archivo `.env`

Copia el archivo de ejemplo y rellena tus datos:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales reales:

```env
AZURE_AI_PROJECT_ENDPOINT=https://TU_PROYECTO.openai.azure.com/
AZURE_AI_AGENT_ID=asst_XXXXXXXXXXXXXXXXXXXXXXXX
AZURE_AI_API_KEY=tu_clave_azure_aqui
AZURE_AI_API_VERSION=2024-05-01-preview
PORT=3000
```

### ¿Dónde encuentro estos datos?

| Variable | Dónde encontrarla |
|----------|-------------------|
| `AZURE_AI_PROJECT_ENDPOINT` | Azure AI Foundry → tu proyecto → Overview → Endpoint |
| `AZURE_AI_AGENT_ID` | Azure AI Foundry → Agents → tu agente → ID del asistente |
| `AZURE_AI_API_KEY` | Azure Portal → tu recurso OpenAI → Keys and Endpoint |

---

## Ejecutar

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

Abre el navegador en: **http://localhost:3000**

---

## Estructura del proyecto

```
gm-agente/
├── public/
│   └── index.html      ← Frontend (chat)
├── server.js           ← Backend (proxy seguro a Azure AI)
├── .env                ← Credenciales (NO subir a Git)
├── .env.example        ← Plantilla de variables
├── .gitignore          ← Excluye .env y node_modules
└── package.json
```

---

## Seguridad

- Las credenciales de Azure **nunca** se exponen al navegador.
- El frontend solo habla con el servidor local (`/api/*`).
- El servidor actúa como proxy seguro hacia Azure AI.
- El archivo `.env` está excluido de Git.

---

> **Uso exclusivo del equipo interno de GM Ingenieros y Consultores.**
