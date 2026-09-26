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

    await api.sendMessage("🔄 Restarting bot system... Please wait a moment.", event.threadID, event.messageID);

    setTimeout(() => {
      process.exit(0);
    }, 1000);
  },
  run: async function (params) {
    return module.exports.onStart(params);
  }
};
