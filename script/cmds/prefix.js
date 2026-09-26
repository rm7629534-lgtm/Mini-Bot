const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "prefix",
    version: "1.0.0",
    author: "AminulSardar",
    role: 0,
    hasPrefix: false,
    nonPrefix: true,
    shortDescription: "Check current bot prefix or set a new one without prefix",
    longDescription: "Displays current system prefix, ping latency, and bot status without requiring prefix. Admins can update the prefix dynamically.",
    category: "system",
    guide: "prefix\n{p}prefix set <new_symbol>"
  },

  onStart: async function ({ api, event, args, prefix, config, botName, authorName, startTime }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const senderID = String(event.senderID);
    const admins = config.adminBot || [];
    const isSenderAdmin = admins.includes(senderID);

    const sub = (args[0] || "").toLowerCase();

    // ADMIN ACTION: Change prefix
    if (sub === "set" || sub === "change") {
      if (admins.length > 0 && !isSenderAdmin) {
        return api.sendMessage("❌ Permission Denied! Only bot administrators can modify the system prefix.", threadID, messageID);
      }

      const newPrefix = (args[1] || "").trim();
      if (!newPrefix) {
        return api.sendMessage(`❌ Please specify a valid new prefix symbol!\nExample: ${prefix}prefix set !`, threadID, messageID);
      }
      if (newPrefix.length > 3) {
        return api.sendMessage("❌ Prefix length cannot exceed 3 characters.", threadID, messageID);
      }

      config.prefix = newPrefix;
      try {
        const configPath = path.join(process.cwd(), "miniconfig.json");
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
      } catch (e) {
        console.error("Failed to persist prefix:", e);
      }

      return api.sendMessage(
        `✅ [PREFIX UPDATED SUCCESSFULLY]
━━━━━━━━━━━━━━━━━━━━
⚙️ New System Prefix: "${newPrefix}"
💡 Now use: ${newPrefix}help or ${newPrefix}ping
👑 Changed by: Administrator (${senderID})`,
        threadID,
        messageID
      );
    }

    // Default: Return aesthetic prefix information
    const currentPrefix = config.prefix || "/";
    const pingStart = Date.now();

    // Calculate Uptime
    const uptimeMs = startTime ? Date.now() - startTime : process.uptime() * 1000;
    const totalSecs = Math.floor(uptimeMs / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const uptimeStr = `${hrs}h ${mins}m ${secs}s`;

    const info = `🌐 ━━━━ [ SYSTEM PREFIX INFO ] ━━━━ 🌐

⚙️ System Prefix: [ ${currentPrefix} ]
🤖 Bot Name: ${botName || "Mini-Bot"}
👑 Developer: ${authorName || config.authorName || "AminulSardar"}
⏱️ Uptime: ${uptimeStr}
📶 Status: Online & Operational 🚀

━━━━━━━━━━━━━━━━━━━━
💡 USAGE INSTRUCTIONS:
▫️ Type "${currentPrefix}help" to see all available commands.
▫️ Type "${currentPrefix}bot" for full system specifications.
▫️ Type "bot" (without prefix) for random interactive replies!

✨ To execute any command:
👉 Example: ${currentPrefix}ping | ${currentPrefix}daily | ${currentPrefix}weather Dhaka`;

    return api.sendMessage(info, threadID, messageID);
  },

  run: async function (params) {
    return module.exports.onStart(params);
  }
};
