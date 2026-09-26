module.exports = {
  config: {
    name: "uptime",
    aliases: ["upt", "runtime", "runtimeinfo"],
    version: "1.0.0",
    author: "AminulSardar",
    role: 0,
    shortDescription: "Check bot runtime uptime",
    longDescription: "Shows how long the bot server has been continuously active along with system memory statistics.",
    category: "system",
    guide: "{p}uptime"
  },
  onStart: async function ({ api, event, startTime, botName }) {
    const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalMem = (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2);

    return api.sendMessage(
      `⏱️ ${botName || "Mini-Bot"} UPTIME STATUS
━━━━━━━━━━━━━━━━━━━━
⏳ Runtime: ${uptimeStr}
🧠 Memory: ${memUsage} MB / ${totalMem} MB
🟢 Status: Active & Operational
⚡ Platform: Node.js ${process.version}
━━━━━━━━━━━━━━━━━━━━`,
      event.threadID,
      event.messageID
    );
  },
  run: async function (params) {
    return module.exports.onStart(params);
  }
};
