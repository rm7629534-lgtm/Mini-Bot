const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "adminonly",
    version: "1.0.0",
    author: "AminulSardar",
    role: 1, // Admin only
    shortDescription: "Toggle admin-only mode for the bot",
    longDescription: "Enable or disable global admin-only mode. When active, only administrators can execute bot commands.",
    category: "admin",
    guide: "{p}adminonly on\n{p}adminonly off\n{p}adminonly status"
  },

  onStart: async function ({ api, event, args, prefix, config, botName }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const senderID = String(event.senderID);
    const admins = config.adminBot || [];

    // Admin permission validation
    if (admins.length > 0 && !admins.includes(senderID)) {
      return api.sendMessage(
        "❌ Permission Denied! Only bot administrators can toggle admin-only mode.",
        threadID,
        messageID
      );
    }

    const sub = (args[0] || "").toLowerCase();

    const saveConfig = () => {
      try {
        const configPath = path.join(process.cwd(), "miniconfig.json");
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
      } catch (e) {
        console.error("Failed to save config:", e);
      }
    };

    if (sub === "on" || sub === "enable" || sub === "1") {
      config.adminOnly = true;
      saveConfig();
      return api.sendMessage(
        `🔒 [ADMIN-ONLY MODE ENABLED]
━━━━━━━━━━━━━━━━━━━━
✅ Bot command execution is now restricted to administrators only.
👥 Registered Admins: ${admins.length}
💡 To disable, use "${prefix}adminonly off"`,
        threadID,
        messageID
      );
    }

    if (sub === "off" || sub === "disable" || sub === "0") {
      config.adminOnly = false;
      saveConfig();
      return api.sendMessage(
        `🔓 [ADMIN-ONLY MODE DISABLED]
━━━━━━━━━━━━━━━━━━━━
✅ All members can now use public bot commands freely!`,
        threadID,
        messageID
      );
    }

    // Status or default
    const isEnabled = !!config.adminOnly;
    return api.sendMessage(
      `🛡️ [ADMIN-ONLY STATUS]
━━━━━━━━━━━━━━━━━━━━
📊 Status: ${isEnabled ? "🔒 ENABLED (Admins Only)" : "🔓 DISABLED (Public Access)"}
━━━━━━━━━━━━━━━━━━━━
💡 Commands:
▫️ ${prefix}adminonly on - Restrict bot to admins only
▫️ ${prefix}adminonly off - Allow all users to use bot
▫️ ${prefix}adminonly status - Check current status`,
      threadID,
      messageID
    );
  },

  run: async function (params) {
    return module.exports.onStart(params);
  }
};
