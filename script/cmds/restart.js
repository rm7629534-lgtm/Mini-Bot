module.exports = {
  config: {
    name: "restart",
    aliases: ["reboot", "reset", "relogin"],
    version: "1.0.0",
    author: "AminulSardar",
    role: 1, // Admin only
    shortDescription: "Restart the bot instance",
    longDescription: "Reboots the bot process (Admin only).",
    category: "admin",
    guide: "{p}restart"
  },
  onStart: async function ({ api, event, config }) {
    const admins = (config && config.adminBot) || [];
    const senderID = String(event.senderID);

    if (admins.length > 0 && !admins.includes(senderID)) {
      return api.sendMessage("❌ Permission denied! This command is only available to bot administrators.", event.threadID, event.messageID);
    }

    await api.sendMessage("🔄 Reloading commands, events, and refreshing bot session...", event.threadID, event.messageID);

    try {
      if (typeof loadCommands === "function") loadCommands();
      if (typeof loadEvents === "function") loadEvents();
      if (typeof startBot === "function") {
        setTimeout(() => {
          startBot();
        }, 500);
      }
      setTimeout(() => {
        api.sendMessage(`✅ Bot reloaded successfully!\n• Commands: ${commands ? commands.size : 0} loaded\n• Events: ${events ? events.size : 0} active`, event.threadID);
      }, 1200);
    } catch (e) {
      api.sendMessage(`⚠️ Reload error: ${e.message}`, event.threadID);
    }
  },
  run: async function (params) {
    return module.exports.onStart(params);
  }
};
