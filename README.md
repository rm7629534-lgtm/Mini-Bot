# 🤖 Mini-Bot — Modular Facebook Messenger Bot & Web Dashboard

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Messenger_Engine-abir--fca-0084FF?style=for-the-badge&logo=messenger&logoColor=white" alt="abir-fca" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/Dashboard-TailwindCSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
</p>

A modular Facebook Messenger Bot framework powered by Node.js and `abir-fca`, featuring an interactive web management dashboard, real-time telemetry logs, dynamic command/event loaders, instant session restart/stop controls, and AppState authentication.

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [📂 Project Structure](#-project-structure)
- [⚡ Quick Start & Installation](#-quick-start--installation)
- [🔑 Facebook AppState Authentication](#-facebook-appstate-authentication)
- [⚙️ Configuration (`miniconfig.json`)](#️-configuration-miniconfigjson)
- [🖥️ Web Management Dashboard](#️-web-management-dashboard)
- [📜 Built-in Commands Reference](#-built-in-commands-reference)
- [⚡ Event Listeners Reference](#-event-listeners-reference)
- [🧩 Creating Custom Commands & Events](#-creating-custom-commands--events)
- [🔌 REST API Documentation](#-rest-api-documentation)
- [🚀 Production Deployment Guides](#-production-deployment-guides)
  - [Deploy with PM2](#deploy-with-pm2)
  - [Deploy on Render / Railway / Cloud](#deploy-on-render--railway--cloud)
  - [Deploy with Docker](#deploy-with-docker)
- [🛡️ Account Security & Best Practices](#️-account-security--best-practices)
- [👨‍💻 Author & Credits](#-author--credits)

---

## ✨ Features

- **🌐 Modern Web Dashboard**: Responsive dark-themed UI built with Tailwind CSS to manage bot status, commands, events, config, and AppState cookies.
- **🔌 Instant Reconnect & Stop Controls**: One-click **Start**, **Restart**, and **Stop** buttons in both UI and REST API without killing the web server.
- **📡 Real-Time Telemetry & Chat Logs**: Live color-coded log stream inspecting every incoming message, group event, command execution, and bot reply.
- **🧩 Hot-Reloadable Modular Commands**: Easily add, edit, or reload command scripts on the fly inside `/script/cmds/`.
- **⚡ Smart Event Handlers**: Auto-welcomes new group members (`joinNoti`), announces leaves/kicks (`leaveNoti`), and auto-sets bot nicknames (`autoNick`).
- **🛡️ Multi-Tier Permission System**: Role-based access control (Admin only / Public) with configurable admin UID list.
- **💰 Economy System**: Built-in balance tracking and daily coin rewards (`/daily`, `/balance`) stored in JSON database.
- **🤖 Built-in AI & Utility Commands**: AI query integration, weather lookup, system info, uptime counter, notification broadcaster, and thread inspector.

---

## 📂 Project Structure

```
Mini-Bot/
├── 📁 Fca_Database/          # Local JSON database storage (e.g. economy balances)
├── 📁 public/
│   └── 📄 index.html         # High-tech Web Management Dashboard UI
├── 📁 script/
│   ├── 📁 cmds/              # Modular command scripts (*.js)
│   │   ├── admin.js          # Admin management (add/remove/list)
│   │   ├── adminonly.js      # Toggle admin-only mode
│   │   ├── ai.js             # AI answer generator
│   │   ├── balance.js        # User wallet & bank balance
│   │   ├── bio.js            # Bot profile bio changer
│   │   ├── bot.js            # Bot info & statistics
│   │   ├── callad.js         # Contact bot admins report
│   │   ├── cmd.js            # Dynamic script loader / reloader
│   │   ├── daily.js          # Daily coins reward claim
│   │   ├── help.js           # Command list & usage guide
│   │   ├── info.js           # Bot & author profile card
│   │   ├── listbox.js        # List all connected groups
│   │   ├── pending.js        # Approve/check pending message requests
│   │   ├── ping.js           # Latency check
│   │   ├── prefix.js         # Prefix query
│   │   ├── quote.js          # Inspirational quotes
│   │   ├── restart.js        # Remote bot restart command
│   │   ├── say.js            # Text-to-speech / echo
│   │   ├── sendnoti.js       # Broadcast announcements to all groups
│   │   ├── tid.js            # Group Thread ID fetcher
│   │   ├── uid.js            # Facebook User ID fetcher
│   │   ├── uptime.js         # System runtime counter
│   │   ├── weather.js        # Real-time weather lookup
│   │   └── welcome.js        # Welcome system manager
│   └── 📁 events/            # Auto event listeners (*.js)
│       ├── autoNick.js       # Auto-sets bot nickname in groups
│       ├── joinNoti.js       # Welcome notification on member join
│       └── leaveNoti.js      # Farewell notification on member leave
├── 📁 utils/
│   └── 📄 logger.js          # ANSI terminal & buffer telemetry logger
├── 📄 appState.json          # Facebook session cookies (JSON)
├── 📄 fca-config.json        # FCA underlying configuration
├── 📄 miniconfig.json        # Core bot configuration (name, prefix, admins)
├── 📄 index.js               # Main HTTP server & bot engine orchestrator
├── 📄 package.json           # Dependencies & runtime scripts
└── 📄 README.md              # Project documentation
```

---

## ⚡ Quick Start & Installation

### 1. Prerequisites
- **Node.js**: Version `18.0.0` or higher (`node -v`)
- **npm** or **bun** / **yarn**

### 2. Clone Repository
```bash
git clone https://github.com/rm7629534-lgtm/Mini-Bot.git
cd Mini-Bot
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Application
```bash
npm start
```
Once started, the server will output:
```
🌐 Public server running on http://0.0.0.0:3000
```
Open `http://localhost:3000` in your browser to access the Web Dashboard.

---

## 🔑 Facebook AppState Authentication

The bot authenticates with Facebook via session cookies (`appState.json`).

### Step-by-Step Guide:
1. Use a Chromium extension such as **C3C-FbState**, **c_user / xs Cookie Exporter**, or **EditThisCookie** on your desktop browser.
2. Log into the Facebook account intended for the bot (recommend using an alternate account).
3. Export the cookies in **JSON** format. The exported JSON will resemble:
   ```json
   [
     {
       "key": "c_user",
       "value": "100084729184712",
       "domain": "facebook.com",
       "path": "/"
     },
     {
       "key": "xs",
       "value": "24%3A...",
       "domain": "facebook.com",
       "path": "/"
     }
   ]
   ```
4. Open the Web Dashboard at `http://localhost:3000`.
5. Navigate to the **AppState Auth** tab.
6. Paste your JSON into the textarea and click **Save & Connect Bot**.
7. The bot will automatically save `appState.json`, authenticate with Facebook, and go **ONLINE** immediately!

---

## ⚙️ Configuration (`miniconfig.json`)

You can edit settings directly via the **Settings (⚙️)** modal in the Web Dashboard or in `miniconfig.json`:

```json
{
  "nickNameBot": "mini-Bot",
  "prefix": "/",
  "adminBot": [
    "100071880593545"
  ],
  "autoSetNickname": true,
  "authorName": "AminulSardar",
  "authorFB": "https://www.facebook.com/profile.php?id=100071880593545",
  "authorEmail": "aminulsardar69@gmail.com",
  "timeZone": "Asia/Dhaka"
}
```

| Property | Description | Default |
| :--- | :--- | :--- |
| `nickNameBot` | Display name of the bot | `"mini-Bot"` |
| `prefix` | Symbol required before commands | `"/"` |
| `adminBot` | Array of Facebook User IDs with Super Admin rights | `["..."]` |
| `autoSetNickname` | Automatically set bot's nickname when added to groups | `true` |
| `authorName` | Developer / Owner Name | `"AminulSardar"` |
| `timeZone` | Timezone for logs and dates | `"Asia/Dhaka"` |

---

## 🖥️ Web Management Dashboard

The built-in web dashboard at `http://localhost:3000` provides full control:

1. **📊 Live Telemetry Cards**:
   - Bot Status (`Online` / `Offline` / `Standby`)
   - Active Port, Uptime counter & Heap Memory usage
   - Count of loaded commands & event handlers
   - Configured prefix and Admin count

2. **📜 Commands Manager**:
   - Search commands by name or description
   - Category filtering (`System`, `Economy`, `Utility`, `Admin`, `Fun`, `AI`)
   - One-click **Copy Command** syntax button

3. **⚡ Event Listeners**:
   - Visual catalog of active listeners and subscribed event triggers

4. **🔑 AppState Auth Manager**:
   - Live cookie status banner
   - Paste, update, and validate session cookies
   - **Stop Bot** & **Restart Bot** controls

5. **📡 Live Logs & Message Inspector**:
   - Real-time log streaming with instant color badges
   - Category filters: `All`, `💬 MESSAGES`, `👑 MASTER/CMD`, `✅ SUCCESS/SENT`, `❌ ERROR`, `ℹ️ INFO`, `⚠️ WARN`
   - One-click **Clear Logs**

---

## 📜 Built-in Commands Reference

| Command | Category | Role | Guide | Description |
| :--- | :--- | :--- | :--- | :--- |
| `help` | System | Public | `/help [command]` | Displays interactive command list or detailed guide |
| `ping` | System | Public | `/ping` | Measures bot response speed and network latency |
| `uptime` | System | Public | `/uptime` | Shows how long the bot server has been running |
| `info` | System | Public | `/info` | Displays bot specifications and author contacts |
| `prefix` | System | Public | `prefix` or `/prefix` | Shows the active command prefix |
| `bot` | System | Public | `bot` or `/bot` | Displays bot status and active statistics |
| `cmd` | Admin | Admin | `/cmd [load/loadall/unload]` | Hot-reloads or loads new command scripts |
| `admin` | Admin | Admin | `/admin [add/remove/list]` | Manages authorized bot administrator UIDs |
| `adminonly` | Admin | Admin | `/adminonly [on/off]` | Restricts bot usage exclusively to admins |
| `sendnoti` | Admin | Admin | `/sendnoti [message]` | Broadcasts announcement to all connected groups |
| `listbox` | Admin | Admin | `/listbox` | Lists all group chats the bot is currently in |
| `pending` | Admin | Admin | `/pending` | Views and approves pending message requests |
| `restart` | Admin | Admin | `/restart` | Restarts the bot engine remotely via chat |
| `bio` | Admin | Admin | `/bio [text]` | Changes the bot account's Facebook bio |
| `balance` | Economy | Public | `/balance` | Checks your current wallet and bank balance |
| `daily` | Economy | Public | `/daily` | Claims daily coin bonus reward |
| `ai` | AI | Public | `/ai [prompt]` | Ask questions to the AI intelligence engine |
| `weather` | Utility | Public | `/weather [city]` | Real-time weather and temperature forecast |
| `uid` | Utility | Public | `/uid` or `/uid @mention` | Fetches your or tagged user's Facebook UID |
| `tid` | Utility | Public | `/tid` | Retrieves the current group Thread ID |
| `welcome` | Utility | Admin | `/welcome [on/off/test]` | Toggles or tests welcome join notifications |
| `say` | Fun | Public | `/say [text]` | Echoes text message back to chat |
| `quote` | Fun | Public | `/quote` | Returns a random inspiring quote |
| `callad` | Utility | Public | `/callad [message]` | Sends feedback/report message directly to admins |

---

## ⚡ Event Listeners Reference

Located inside `/script/events/`:

- **`joinNoti.js`**: Listens to `log:subscribe`. Welcomes new members, mentions their names, and displays group member counts.
- **`leaveNoti.js`**: Listens to `log:unsubscribe`. Announces when a member leaves or gets kicked.
- **`autoNick.js`**: Listens to bot additions and automatically configures its own group nickname.

---

## 🧩 Creating Custom Commands & Events

### Creating a Command (`/script/cmds/mycommand.js`):
```javascript
module.exports = {
  config: {
    name: "mycommand",
    version: "1.0.0",
    hasPrefix: true,
    role: 0, // 0 = Public, 1 = Admin only
    credits: "Your Name",
    description: "Sample custom command",
    category: "utility",
    guide: "{p}mycommand [arg]"
  },

  onStart: async function ({ api, event, args, sendReply, config }) {
    const input = args.join(" ");
    if (!input) {
      return sendReply("⚠️ Please provide some input!");
    }
    return sendReply(`🎉 You typed: ${input}`);
  }
};
```

### Creating an Event (`/script/events/myEvent.js`):
```javascript
module.exports = {
  config: {
    name: "myEvent",
    version: "1.0.0",
    eventType: ["log:subscribe"], // Event types to listen to
    description: "Custom event trigger"
  },

  onStart: async function ({ api, event, botID, config }) {
    console.log("Event triggered in thread:", event.threadID);
  }
};
```

---

## 🔌 REST API Documentation

The server exposes built-in HTTP REST endpoints:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/status` | `GET` | Returns system health, online status, bot UID, memory usage, and counts |
| `/api/commands` | `GET` | Returns list of all loaded commands and their config metadata |
| `/api/events` | `GET` | Returns list of all active event listeners |
| `/api/appstate` | `GET` | Checks if `appState.json` is configured and returns cookie count |
| `/api/appstate` | `POST` | Updates `appState.json` and automatically restarts bot connection |
| `/api/config` | `GET` | Retrieves `miniconfig.json` contents |
| `/api/config` | `POST` | Updates `miniconfig.json` settings |
| `/api/bot/restart`| `POST` | Triggers a live bot engine reconnect |
| `/api/bot/stop` | `POST` | Safely disconnects the bot engine and sets it offline |
| `/api/logs` | `GET` | Returns the recent 250 buffered telemetry logs |
| `/api/logs/clear`| `POST` | Clears the log buffer |

---

## 🚀 Production Deployment Guides

### Deploy with PM2

[PM2](https://pm2.keymetrics.io/) ensures the bot stays running 24/7 and restarts automatically on crash or reboot.

```bash
# Install PM2 globally
npm install -g pm2

# Start Mini-Bot
pm2 start index.js --name "mini-bot"

# View live logs
pm2 logs mini-bot

# Save process list for auto-boot
pm2 save
pm2 startup
```

### Deploy on Render / Railway / Cloud

1. Push your repository to GitHub.
2. Link your repository in **Render** or **Railway**.
3. Configure build & start commands:
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
4. Set environment variable (optional):
   - `PORT`: `3000` (or leave default assigned by provider)
5. Open the deployed URL and configure your AppState via the Web Dashboard!

### Deploy with Docker

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

Build and run:
```bash
docker build -t mini-bot .
docker run -d -p 3000:3000 --name mini-bot-app mini-bot
```

---

## 🛡️ Account Security & Best Practices

1. **Use Dedicated Bot Accounts**: Never use your primary personal Facebook account for automated bots.
2. **Avoid Excessive Spam**: Do not broadcast messages to hundreds of groups at once to avoid spam checkpoints.
3. **2-Factor Authentication (2FA)**: Keep 2FA enabled on the bot account.
4. **Keep AppState Private**: Never commit `appState.json` with active session tokens to public repositories.

---

## 👨‍💻 Author & Credits

- **Developer**: [Aminul Sardar](https://www.facebook.com/profile.php?id=100071880593545)
- **Engine**: [abir-fca](https://www.npmjs.com/package/abir-fca)
- **Repository**: [GitHub — Mini-Bot](https://github.com/rm7629534-lgtm/Mini-Bot)
- **License**: [MIT License](LICENSE)

<p align="center">Made with ❤️ by Aminul Sardar</p>
