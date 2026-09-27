// ANSI Color Codes
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  
  // Tag Colors
  errorTag: "\x1b[1;97;41m", // Bright white on red background
  errorText: "\x1b[1;31m",   // Bright red
  
  masterTag: "\x1b[1;97;45m", // Bright white on magenta background
  masterText: "\x1b[1;35m",  // Bright magenta / purple
  
  successTag: "\x1b[1;97;42m", // Bright white on green background
  successText: "\x1b[1;32m",   // Bright green
  
  chatTag: "\x1b[1;97;46m",   // Bright white on cyan/teal background
  chatText: "\x1b[1;96m",     // Bright electric cyan
  
  infoTag: "\x1b[1;97;44m",   // Bright white on blue background
  infoText: "\x1b[1;36m",     // Bright cyan
  
  warnTag: "\x1b[1;97;43m",   // Bright white on yellow/amber background
  warnText: "\x1b[1;33m",     // Bright yellow
  
  time: "\x1b[90m",          // Gray
  border: "\x1b[38;5;240m"   // Dark gray
};

// Rainbow / sequential cycling colors for log highlights
const rainbowColors = [
  "\x1b[38;5;196m", // Red
  "\x1b[38;5;208m", // Orange
  "\x1b[38;5;226m", // Yellow
  "\x1b[38;5;46m",  // Green
  "\x1b[38;5;51m",  // Cyan
  "\x1b[38;5;129m", // Purple
  "\x1b[38;5;201m"  // Pink
];

let cycleIndex = 0;
function getNextCycleColor() {
  const c = rainbowColors[cycleIndex % rainbowColors.length];
  cycleIndex++;
  return c;
}

let logBufferRef = null;

function setLogBuffer(buffer) {
  logBufferRef = buffer;
}

function formatTime() {
  const d = new Date();
  return d.toLocaleTimeString("en-US", { hour12: false });
}

function formatLogMessage(message) {
  if (message === null || message === undefined) return "";
  if (typeof message === "string") return message;
  if (message instanceof Error) {
    return `${message.name}: ${message.message}${message.stack ? `\n${message.stack}` : ""}`.trim();
  }
  if (typeof message === "object") {
    try {
      if (message.error && typeof message.error === "object") {
        return JSON.stringify(message.error, null, 2);
      }
      if (message.message) return String(message.message);
      if (message.error) return String(message.error);
      const json = JSON.stringify(message, null, 2);
      return json === "{}" && typeof message.toString === "function" && message.toString() !== "[object Object]"
        ? message.toString()
        : json;
    } catch (e) {
      return String(message);
    }
  }
  return String(message);
}

function pushToBuffer(message, type = "info") {
  const formatted = formatLogMessage(message);
  if (logBufferRef && Array.isArray(logBufferRef)) {
    logBufferRef.push({
      timestamp: Date.now(),
      message: formatted,
      type: type.toLowerCase()
    });
    if (logBufferRef.length > 250) {
      logBufferRef.shift();
    }
  }
}

const logger = {
  setLogBuffer,

  chat: function (message, tag = "MSG") {
    const time = formatTime();
    const str = formatLogMessage(message);
    const consoleOutput = `${colors.time}[${time}] ${colors.chatTag} 💬 ${tag} ${colors.reset} ${colors.chatText}${str}${colors.reset}`;
    process.stdout.write(consoleOutput + "\n");
    pushToBuffer(str, "chat");
  },

  error: function (message, tag = "ERROR") {
    const time = formatTime();
    const str = formatLogMessage(message);
    const consoleOutput = `${colors.time}[${time}] ${colors.errorTag} ${tag} ${colors.reset} ${colors.errorText}${str}${colors.reset}`;
    process.stdout.write(consoleOutput + "\n");
    pushToBuffer(str, "error");
  },

  master: function (message, tag = "MASTER") {
    const time = formatTime();
    const str = formatLogMessage(message);
    const consoleOutput = `${colors.time}[${time}] ${colors.masterTag} 👑 ${tag} ${colors.reset} ${colors.masterText}${str}${colors.reset}`;
    process.stdout.write(consoleOutput + "\n");
    pushToBuffer(str, "master");
  },

  success: function (message, tag = "SUCCESS") {
    const time = formatTime();
    const str = formatLogMessage(message);
    const consoleOutput = `${colors.time}[${time}] ${colors.successTag} ✅ ${tag} ${colors.reset} ${colors.successText}${str}${colors.reset}`;
    process.stdout.write(consoleOutput + "\n");
    pushToBuffer(str, "success");
  },

  // Alias for spelling compatibility
  succes: function (message, tag = "SUCCES") {
    return logger.success(message, tag);
  },

  info: function (message, tag = "INFO") {
    const time = formatTime();
    const str = formatLogMessage(message);
    const consoleOutput = `${colors.time}[${time}] ${colors.infoTag} ℹ️ ${tag} ${colors.reset} ${colors.infoText}${str}${colors.reset}`;
    process.stdout.write(consoleOutput + "\n");
    pushToBuffer(str, "info");
  },

  warn: function (message, tag = "WARN") {
    const time = formatTime();
    const str = formatLogMessage(message);
    const consoleOutput = `${colors.time}[${time}] ${colors.warnTag} ⚠️ ${tag} ${colors.reset} ${colors.warnText}${str}${colors.reset}`;
    process.stdout.write(consoleOutput + "\n");
    pushToBuffer(str, "warn");
  },

  cycle: function (message, tag = "LOG") {
    const time = formatTime();
    const cycleColor = getNextCycleColor();
    const str = formatLogMessage(message);
    const consoleOutput = `${colors.time}[${time}] ${cycleColor}${colors.bold}[ ${tag} ]${colors.reset} ${cycleColor}${str}${colors.reset}`;
    process.stdout.write(consoleOutput + "\n");
    pushToBuffer(str, "info");
  },

  log: function (message, type = "info") {
    const t = String(type).toLowerCase();
    if (t === "chat" || t === "msg") return logger.chat(message);
    if (t === "error") return logger.error(message);
    if (t === "master") return logger.master(message);
    if (t === "success" || t === "succes") return logger.success(message);
    if (t === "warn" || t === "warning") return logger.warn(message);
    return logger.info(message);
  }
};

module.exports = logger;
