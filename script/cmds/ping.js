module.exports = {
  config: {
    name: "ping",
    aliases: ["speed", "ms", "latency"],
    version: "1.0.0",
    author: "AminulSardar",
    role: 0,
    shortDescription: "Check bot latency",
    longDescription: "Measures the round-trip response time of the bot server.",
    category: "system",
    guide: "{p}ping"
  },
  onStart: async function ({ api, event, message, botName }) {
    const start = Date.now();
    const latency = Date.now() - start;
    return api.sendMessage(
      `🏓 Pong!
━━━━━━━━━━━━━━━━
🤖 ${botName || "Mini-Bot"}
⚡ Latency: ${latency}ms
🟢 Status: Online & Healthy
━━━━━━━━━━━━━━━━`,
      event.threadID,
      event.messageID
    );
  },
  run: async function (params) {
    return module.exports.onStart(params);
  }
};
