const fca = require("abir-fca");
const fs = require("fs");
const path = require("path");
const http = require("http");
const logger = require("./utils/logger");

// ==========================================
// CONFIGURATION & LOGGING
// ==========================================
const PORT = process.env.PORT || 3000;
const logsBuffer = [];
const MAX_LOGS = 150;

logger.setLogBuffer(logsBuffer);
global.logger = logger;

function addLog(message, type = "info") {
  const entry = {
    timestamp: Date.now(),
    message: String(message),
    type: type.toLowerCase()
  };
  logsBuffer.push(entry);
  if (logsBuffer.length > MAX_LOGS) {
    logsBuffer.shift();
  }
}

// Intercept standard console logs to also pipe to dashboard buffer with proper typing
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = function (...args) {
  originalConsoleLog.apply(console, args);
  const msg = args.map(a => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
  let detectedType = "info";
  if (msg.includes("✅") || msg.toLowerCase().includes("success") || msg.toLowerCase().includes("succes")) detectedType = "success";
  else if (msg.includes("👑") || msg.toLowerCase().includes("master") || msg.toLowerCase().includes("admin")) detectedType = "master";
  else if (msg.includes("⚠️") || msg.toLowerCase().includes("warn")) detectedType = "warn";
  else if (msg.includes("❌") || msg.toLowerCase().includes("error") || msg.toLowerCase().includes("fail")) detectedType = "error";
  addLog(msg, detectedType);
};

console.error = function (...args) {
  originalConsoleError.apply(console, args);
  addLog(args.map(a => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "), "error");
};

console.warn = function (...args) {
  originalConsoleWarn.apply(console, args);
  addLog(args.map(a => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "), "warn");
};

// Global exception & promise rejection handlers
process.on("unhandledRejection", (reason) => {
  const reasonStr = reason instanceof Error ? reason.message : String(reason);
  if (!reasonStr.includes("MQTT client is not initialized") && !reasonStr.includes("MQTT keep alive")) {
    logger.warn(`Unhandled Promise: ${reasonStr}`, "SYSTEM");
  }
});

process.on("uncaughtException", (err) => {
  const errStr = err instanceof Error ? err.message : String(err);
  logger.error(`Uncaught Exception: ${errStr}`, "SYSTEM");
});

let config = {
  nickNameBot: "Goat-Bot-V2",
  prefix: "/",
  adminBot: ["100084729184712"],
  autoSetNickname: true,
  authorName: "AminulSardar",
  authorEmail: "aminulsardar69@gmail.com",
  authorFB: "https://facebook.com/aminulsardar69",
  timeZone: "Asia/Dhaka"
};

function loadConfig() {
  try {
    if (fs.existsSync("./miniconfig.json")) {
      const raw = fs.readFileSync("./miniconfig.json", "utf8");
      config = { ...config, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error("❌ Failed to parse miniconfig.json:", err.message);
  }
}
loadConfig();

const startTime = Date.now();
let activeBotID = "Not Logged In";
let botApi = null;

// ==========================================
// COMMAND & EVENT LOADERS
// ==========================================
const commands = new Map();
const aliases = new Map();
const events = new Map();

function loadCommands() {
  commands.clear();
  aliases.clear();
  const cmdsDir = path.join(__dirname, "script", "cmds");
  if (!fs.existsSync(cmdsDir)) {
    fs.mkdirSync(cmdsDir, { recursive: true });
  }

  const files = fs.readdirSync(cmdsDir).filter(f => f.endsWith(".js"));
  for (const file of files) {
    try {
      const filePath = path.join(cmdsDir, file);
      delete require.cache[require.resolve(filePath)];
      const cmd = require(filePath);
      const name = (cmd.config && cmd.config.name) || file.replace(/\.js$/, "");
      const rawAliases = (cmd.config && (cmd.config.aliases || cmd.config.alias)) || [];
      const aliasesList = Array.isArray(rawAliases) ? rawAliases : [rawAliases].filter(Boolean);

      const cmdObj = {
        ...cmd,
        fileName: file,
        config: {
          name,
          aliases: aliasesList,
          hasPrefix: cmd.config?.hasPrefix !== false,
          nonPrefix: !!cmd.config?.nonPrefix,
          category: (cmd.config && cmd.config.category) || "general",
          role: (cmd.config && cmd.config.role) !== undefined ? cmd.config.role : 0,
          shortDescription: (cmd.config && (cmd.config.shortDescription || cmd.config.description)) || "",
          longDescription: (cmd.config && cmd.config.longDescription) || "",
          guide: (cmd.config && cmd.config.guide) || `{p}${name}`,
          author: (cmd.config && (cmd.config.author || cmd.config.credits)) || config.authorName || "AminulSardar"
        }
      };

      commands.set(name.toLowerCase(), cmdObj);

      for (const al of aliasesList) {
        if (typeof al === "string" && al.trim()) {
          aliases.set(al.trim().toLowerCase(), name.toLowerCase());
        }
      }

      logger.success(`Loaded Command: [${name}] (Aliases: ${aliasesList.join(", ") || "none"})`, "COMMAND");
    } catch (err) {
      logger.error(`Failed to load command ${file}: ${err.message}`, "LOADER");
    }
  }
}

function loadEvents() {
  events.clear();
  const dir = path.join(__dirname, "script", "events");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return;
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));
  for (const file of files) {
    try {
      const filePath = path.join(dir, file);
      delete require.cache[require.resolve(filePath)];
      const evt = require(filePath);
      const name = (evt.config && evt.config.name) || file.replace(/\.js$/, "");
      events.set(name, {
        ...evt,
        fileName: file,
        dir: "script/events",
        config: {
          name,
          eventType: (evt.config && evt.config.eventType) || ["all"],
          description: (evt.config && evt.config.description) || "",
          author: (evt.config && evt.config.author) || config.authorName || "AminulSardar"
        }
      });
      logger.info(`Loaded Event: [${name}] from script/events/`, "EVENT");
    } catch (err) {
      logger.error(`Failed to load event ${file}: ${err.message}`, "LOADER");
    }
  }
}

// Initial load
loadCommands();
loadEvents();

// Format uptime string
function formatUptime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// ==========================================
// COMMAND EXECUTION HANDLER
// ==========================================
async function executeCommand({ commandName, args, event, api, sendReply }) {
  const norm = commandName.toLowerCase();
  const resolvedName = aliases.get(norm) || norm;
  const cmd = commands.get(resolvedName);
  if (!cmd) {
    return false;
  }

  const role = (cmd.config && cmd.config.role) || 0;
  const admins = config.adminBot || [];
  const senderID = String(event.senderID || "");
  const isSenderAdmin = admins.includes(senderID);

  // Global AdminOnly mode check
  if (config.adminOnly && !isSenderAdmin && resolvedName !== "adminonly") {
    sendReply(`🔒 Bot is currently in Admin-Only mode. Only administrators can use commands.`);
    return true;
  }

  // Role check: 1 = Admin, 2 = Owner
  if (role >= 1 && admins.length > 0 && !isSenderAdmin) {
    sendReply(`❌ Permission Denied! Command '${commandName}' requires administrator privileges.`);
    return true;
  }

  const context = {
    api,
    event,
    args,
    message: args.join(" "),
    prefix: config.prefix || "/",
    commands,
    aliases,
    events,
    config,
    loadCommands,
    loadEvents,
    startBot,
    botName: config.nickNameBot || "Mini-Bot",
    authorName: config.authorName || "AminulSardar",
    startTime,
    botID: activeBotID,
    logger
  };

  try {
    if (typeof cmd.onStart === "function") {
      await cmd.onStart(context);
    } else if (typeof cmd.run === "function") {
      await cmd.run(context);
    } else if (typeof cmd.execute === "function") {
      await cmd.execute(context);
    }
    return true;
  } catch (err) {
    console.error(`❌ Error executing command [${commandName}]:`, err);
    sendReply(`⚠️ An error occurred while executing ${commandName}: ${err.message}`);
    return true;
  }
}

// ==========================================
// HTTP PUBLIC SERVER & REST APIS
// ==========================================
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Set standard CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  // --- API: Bot Status ---
  if (req.method === "GET" && pathname === "/api/status") {
    const mem = process.memoryUsage();
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({
        online: true,
        botName: config.nickNameBot || "Mini-Bot",
        prefix: config.prefix || "/",
        port: PORT,
        uptime: formatUptime(Date.now() - startTime),
        rawUptime: Date.now() - startTime,
        memory: {
          heapUsedMB: (mem.heapUsed / 1024 / 1024).toFixed(2),
          heapTotalMB: (mem.heapTotal / 1024 / 1024).toFixed(2),
          rssMB: (mem.rss / 1024 / 1024).toFixed(2)
        },
        commandsCount: commands.size,
        eventsCount: events.size,
        admins: config.adminBot || [],
        authorName: config.authorName || "AminulSardar",
        botID: activeBotID
      })
    );
  }

  // --- API: Commands Catalog ---
  if (req.method === "GET" && pathname === "/api/commands") {
    const list = Array.from(commands.values()).map(c => ({
      name: c.config.name,
      file: c.fileName,
      config: c.config
    }));
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(list));
  }

  // --- API: Events Catalog ---
  if (req.method === "GET" && pathname === "/api/events") {
    const list = Array.from(events.values()).map(e => ({
      name: e.config.name,
      file: `${e.dir}/${e.fileName}`,
      config: e.config
    }));
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(list));
  }

  // --- API: Get Config ---
  if (req.method === "GET" && pathname === "/api/config") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(config, null, 2));
  }

  // --- API: Update Config ---
  if (req.method === "POST" && pathname === "/api/config") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      try {
        const newCfg = JSON.parse(body);
        config = { ...config, ...newCfg };
        fs.writeFileSync("./miniconfig.json", JSON.stringify(config, null, 2), "utf8");
        console.log("⚙️ miniconfig.json updated via Dashboard.");
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: true, config }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // --- API: AppState Check ---
  if (req.method === "GET" && pathname === "/api/appstate") {
    try {
      let content = "";
      let count = 0;
      if (fs.existsSync("./appState.json")) {
        content = fs.readFileSync("./appState.json", "utf8");
        const parsed = JSON.parse(content || "[]");
        count = Array.isArray(parsed) ? parsed.length : 0;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ configured: count > 0, count, content }));
    } catch (e) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ configured: false, count: 0, content: "" }));
    }
  }

  // --- API: AppState Save & Auto-Restart Bot ---
  if (req.method === "POST" && pathname === "/api/appstate") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      try {
        const { appState } = JSON.parse(body);
        const parsed = JSON.parse(appState || "[]");
        fs.writeFileSync("./appState.json", JSON.stringify(parsed, null, 2), "utf8");
        logger.master(`appState.json updated (${parsed.length} cookies). Triggering bot restart & reconnection...`, "AUTH");
        
        // Auto restart bot with new cookies
        setTimeout(() => {
          startBot();
        }, 300);

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ 
          success: true, 
          count: parsed.length,
          message: "AppState saved! Bot is restarting & going online..." 
        }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // --- API: Manual Bot Restart ---
  if (req.method === "POST" && pathname === "/api/bot/restart") {
    logger.master("Manual bot restart requested from Dashboard.", "MASTER");
    startBot();
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ success: true, message: "Bot restart initiated" }));
  }

  // --- API: Manual Bot Stop ---
  if (req.method === "POST" && pathname === "/api/bot/stop") {
    if (botApi) {
      try {
        if (typeof botApi.stopListening === "function") {
          botApi.stopListening();
        }
      } catch (e) {}
      botApi = null;
    }
    activeBotID = null;
    isConnecting = false;
    logger.warn("🛑 Bot engine was stopped manually via Dashboard.", "AUTH");
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ success: true, message: "Bot engine stopped successfully" }));
  }

  // --- API: Logs ---
  if (req.method === "GET" && pathname === "/api/logs") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(logsBuffer));
  }

  if (req.method === "POST" && pathname === "/api/logs/clear") {
    logsBuffer.length = 0;
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ success: true }));
  }

  // --- API: Command Simulator / Runner ---
  if (req.method === "POST" && pathname === "/api/execute") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", async () => {
      try {
        const { message, senderID = "100084729184712", threadID = "894729104820194" } = JSON.parse(body);
        const prefix = config.prefix || "/";
        let capturedReply = null;

        const mockApi = {
          sendMessage: (msg, tid, mid) => {
            capturedReply = typeof msg === "object" ? (msg.body || JSON.stringify(msg)) : String(msg);
            return Promise.resolve({ messageID: "mock_mid_" + Date.now() });
          },
          getCurrentUserID: () => activeBotID || "100000000000000",
          changeNickname: (nick, tid, uid, cb) => {
            if (cb) cb(null);
          }
        };

        const trimmed = (message || "").trim();
        let cmdName = "";
        let args = [];
        let isPrefixed = false;

        if (trimmed.startsWith(prefix)) {
          const parts = trimmed.slice(prefix.length).trim().split(/\s+/);
          cmdName = parts[0] || "";
          args = parts.slice(1);
          isPrefixed = true;
        } else {
          const parts = trimmed.split(/\s+/);
          const firstWord = (parts[0] || "").toLowerCase();
          
          // Check if matches non-prefix command or special trigger
          if (firstWord === "prefix" || firstWord === "bot" || firstWord === "বট") {
            cmdName = firstWord === "বট" ? "bot" : firstWord;
            args = parts.slice(1);
          } else {
            // Check loaded commands with hasPrefix === false or nonPrefix === true
            const candidate = commands.get(firstWord);
            if (candidate && (candidate.config?.hasPrefix === false || candidate.config?.nonPrefix === true)) {
              cmdName = firstWord;
              args = parts.slice(1);
            }
          }
        }

        if (cmdName) {
          const executed = await executeCommand({
            commandName: cmdName,
            args,
            event: {
              type: "message",
              body: trimmed,
              senderID,
              threadID,
              messageID: "sim_" + Date.now()
            },
            api: mockApi,
            sendReply: msg => (capturedReply = msg)
          });

          if (!executed && isPrefixed) {
            capturedReply = `Command "${cmdName}" does not exist, type help to see all available commands`;
          }
        } else {
          capturedReply = `🤖 [Echo]: Received "${trimmed}". Use ${prefix}help to view commands.`;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({
          success: true,
          reply: capturedReply,
          botName: config.nickNameBot || "Mini-Bot"
        }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // --- Serve public/index.html & Static Files ---
  let filePath = path.join(__dirname, "public", pathname === "/" ? "index.html" : pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, "public", "index.html");
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      ".html": "text/html; charset=utf-8",
      ".js": "application/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon"
    };
    const contentType = mimeTypes[ext] || "text/plain";
    res.writeHead(200, { "Content-Type": contentType });
    return res.end(fs.readFileSync(filePath));
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Public server running on http://0.0.0.0:${PORT}`);
});

// ==========================================
// START FACEBOOK BOT ENGINE
// ==========================================
let isConnecting = false;
let reconnectTimer = null;

function stringifyError(err) {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error) {
    return err.message || err.toString();
  }
  if (typeof err === "object") {
    if (err.error && typeof err.error === "object") {
      return JSON.stringify(err.error);
    }
    if (err.message) return String(err.message);
    if (err.error) return String(err.error);
    if (err.type || err.code || err.reason) {
      return `Type: ${err.type || "N/A"}, Code: ${err.code || "N/A"}, Reason: ${err.reason || err.description || "N/A"}`;
    }
    try {
      const json = JSON.stringify(err);
      return json === "{}" ? "MQTT Connection Glitch / Socket Reset" : json;
    } catch (e) {
      return String(err);
    }
  }
  return String(err);
}

function startBot() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  // Reload commands & events on each restart
  try {
    loadCommands();
    loadEvents();
  } catch (e) {
    logger.warn(`Reload loader warning: ${e.message}`, "LOADER");
  }

  if (isConnecting) {
    logger.warn("Bot is already in the process of logging in...", "LOGIN");
    return;
  }
  isConnecting = true;

  // Cleanup old session if active
  if (botApi) {
    try {
      if (typeof botApi.stopListening === "function") {
        botApi.stopListening();
      }
    } catch (e) {}
    botApi = null;
  }
  activeBotID = null;

  let appState = [];

  try {
    if (fs.existsSync("./appState.json")) {
      const raw = fs.readFileSync("./appState.json", "utf8").trim();
      appState = raw ? JSON.parse(raw) : [];
    }
  } catch (err) {
    logger.warn(`appState.json is invalid or empty JSON (${err.message}). Ready for input via Dashboard.`, "AUTH");
    appState = [];
  }

  if (!Array.isArray(appState) || appState.length === 0) {
    logger.warn("appState.json is currently empty. Web dashboard is live & waiting for login credentials.", "AUTH");
    isConnecting = false;
    return;
  }

  // Safety login timeout to prevent stuck connecting state
  const loginSafetyTimeout = setTimeout(() => {
    if (isConnecting) {
      isConnecting = false;
      logger.warn("Login attempt took more than 20s. Resetting connection state for retry.", "LOGIN");
    }
  }, 20000);

  logger.info(`Starting Facebook login using ${appState.length} session cookies...`, "LOGIN");
  fca.login(
    {
      appState: appState
    },
    (err, api) => {
      clearTimeout(loginSafetyTimeout);
      isConnecting = false;
      if (err) {
        const errMsg = stringifyError(err);
        logger.error(`Facebook Login Failed: ${errMsg}`, "LOGIN");
        return;
      }

      botApi = api;
      activeBotID = api.getCurrentUserID();

      // Automatically sync latest cookies to keep session alive across future restarts
      try {
        if (typeof api.getAppState === "function") {
          const freshCookies = api.getAppState();
          if (Array.isArray(freshCookies) && freshCookies.length > 0) {
            fs.writeFileSync("./appState.json", JSON.stringify(freshCookies, null, 2), "utf8");
          }
        }
      } catch (e) {}

      logger.master(`Bot Connected: ${config.nickNameBot} (UID: ${activeBotID})`, "MASTER");
      logger.success(`Bot Engine is now ONLINE & Active!`, "SUCCESS");
      logger.info(`Owner: ${config.authorName} | Prefix: ${config.prefix} | TimeZone: ${config.timeZone}`, "CONFIG");

      api.setOptions({
        listenEvents: true,
        selfListen: false,
        autoMarkRead: false,
        forceLogin: true
      });

      // Listen MQTT Events (Auto-nickname is handled upon group join events in script/events/autoNick.js)
      api.listenMqtt(async (listenErr, event) => {
        if (listenErr) {
          const formattedErr = stringifyError(listenErr);
          
          // Filter harmless MQTT keep-alive / retry noise if present
          if (typeof formattedErr === "string" && formattedErr.includes("MQTT keep alive timeout")) {
            logger.warn(`MQTT keep-alive ping: ${formattedErr}`, "MQTT");
            return;
          }

          logger.error(`Listen MQTT Error: ${formattedErr}`, "LISTEN");

          // If connection dropped or socket destroyed, schedule auto reconnect
          const isDisconnect = /disconnect|closed|socket|token|reset|timeout|destroy|network|econnreset/i.test(formattedErr);
          if (isDisconnect && !reconnectTimer) {
            logger.warn("MQTT socket disconnected. Auto-reconnecting in 6 seconds...", "RECONNECT");
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              startBot();
            }, 6000);
          }
          return;
        }

        if (!event) return;

        // Log Chat Messages
        if (event.type === "message" || event.type === "message_reply") {
          const msgContent = event.body || (event.attachments && event.attachments.length ? `[${event.attachments.length} Attachment(s)]` : "[Empty Message]");
          const tag = event.type === "message_reply" ? "REPLY_MSG" : "INCOMING_MSG";
          logger.chat(`[Thread: ${event.threadID}] [User: ${event.senderID}] 💬 "${msgContent}"`, tag);
        } else if (event.logMessageType) {
          logger.info(`[Chat Event: ${event.logMessageType}] Thread: ${event.threadID} | Author: ${event.author || event.senderID || "System"}`, "EVENT");
        }

        // Dispatch to event handlers
        for (const [evtName, evtModule] of events.entries()) {
          try {
            const types = (evtModule.config && evtModule.config.eventType) || ["all"];
            if (types.includes("all") || (event.logMessageType && types.includes(event.logMessageType))) {
              const evtContext = {
                api,
                event,
                botID: activeBotID,
                botName: config.nickNameBot,
                prefix: config.prefix,
                authorName: config.authorName,
                config,
                logger
              };
              if (typeof evtModule.onStart === "function") {
                await evtModule.onStart(evtContext);
              } else if (typeof evtModule.run === "function") {
                await evtModule.run(evtContext);
              }
            }
          } catch (eventErr) {
            logger.error(`Event error in [${evtName}]: ${eventErr.message}`, "EVENT");
          }
        }

        // Handle Messages
        if (event.type !== "message" && event.type !== "message_reply") return;
        if (!event.body) return;

        const body = event.body.trim();
        const prefix = config.prefix || "/";

        let cmdName = "";
        let args = [];
        let isPrefixed = false;

        if (body.startsWith(prefix)) {
          const parts = body.slice(prefix.length).trim().split(/\s+/);
          cmdName = parts[0] || "";
          args = parts.slice(1);
          isPrefixed = true;
        } else {
          const parts = body.split(/\s+/);
          const firstWord = (parts[0] || "").toLowerCase();
          
          if (firstWord === "prefix" || firstWord === "bot" || firstWord === "বট") {
            cmdName = firstWord === "বট" ? "bot" : firstWord;
            args = parts.slice(1);
          } else {
            const candidate = commands.get(firstWord);
            if (candidate && (candidate.config?.hasPrefix === false || candidate.config?.nonPrefix === true)) {
              cmdName = firstWord;
              args = parts.slice(1);
            }
          }
        }

        if (cmdName) {
          logger.master(`Executing [${cmdName}] with args: [${args.join(" ")}] by UID: ${event.senderID}`, "CMD");
          const executed = await executeCommand({
            commandName: cmdName,
            args,
            event,
            api,
            sendReply: (msg, cb) => {
              const preview = typeof msg === "string" ? msg : (msg && msg.body ? msg.body : "[Attachment/Object]");
              logger.success(`[Bot Sent] -> "${preview.length > 80 ? preview.substring(0, 80) + "..." : preview}"`, "SENT");
              return api.sendMessage(msg, event.threadID, cb || event.messageID);
            }
          });

          if (!executed && isPrefixed) {
            api.sendMessage(`Command "${cmdName}" does not exist, type ${prefix}help to see all available commands`, event.threadID, event.messageID);
          }
        }
      });
    }
  );
}

// Start bot
startBot();
