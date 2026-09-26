module.exports = {
  config: {
    name: "info",
    aliases: ["about", "developer", "owner", "author"],
    version: "1.0.0",
    author: "AminulSardar",
    role: 0,
    shortDescription: "Display system and developer info",
    longDescription: "Provides detailed system information, author contacts, and environment specs.",
    category: "system",
    guide: "{p}info"
  },
  onStart: async function ({ api, event, botName, authorName, config, startTime, prefix, commands }) {
    const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    const infoText = `🤖 ${botName || "Mini-Bot"}
━━━━━━━━━━━━━━━━━━━━
📌 SYSTEM OVERVIEW
━━━━━━━━━━━━━━━━━━━━
🤖 Bot Name: ${botName || "Mini-Bot"}
📦 Version: 1.0.0
⚙️ Prefix: ${prefix}
📚 Commands Loaded: ${commands ? commands.size : 0}
👑 Admins: ${((config && config.adminBot) || []).length}
🕐 Timezone: ${(config && config.timeZone) || "Asia/Dhaka"}
⏱️ Uptime: ${uptimeStr}

👤 DEVELOPER & CREDITS
━━━━━━━━━━━━━━━━━━━━
👤 Author: ${authorName || "AminulSardar"}
📧 Email: ${(config && config.authorEmail) || "aminulsardar69@gmail.com"}
🔗 Facebook: ${(config && config.authorFB) || "Not set"}

💡 Type ${prefix}help for command list.`;

    return api.sendMessage(infoText, event.threadID, event.messageID);
  },
  run: async function (params) {
    return module.exports.onStart(params);
  }
};
