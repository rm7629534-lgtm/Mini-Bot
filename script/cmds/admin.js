const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "admin",
    version: "2.0.0",
    author: "AminulSardar",
    role: 0, // List is public, but add/remove enforces admin checks inside onStart
    shortDescription: "Manage bot administrators (list, add, remove)",
    longDescription: "View list of administrators or add/remove admins using UID, mention, or message reply.",
    category: "admin",
    guide: "{p}admin list\n{p}admin add <UID / @mention / reply>\n{p}admin remove <UID / @mention / reply>"
  },

  onStart: async function ({ api, event, args, prefix, config, botName }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const senderID = String(event.senderID);
    const subAction = (args[0] || "list").toLowerCase();

    // Ensure config.adminBot is an array
    if (!Array.isArray(config.adminBot)) {
      config.adminBot = [];
    }

    const saveConfigFile = () => {
      try {
        const configPath = path.join(process.cwd(), "miniconfig.json");
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
        return true;
      } catch (e) {
        console.error("Failed to save miniconfig.json:", e);
        return false;
      }
    };

    // Helper to extract target UIDs from args, mentions, or reply
    const getTargetUIDs = () => {
      const uids = [];

      // Check message reply
      if (event.type === "message_reply" && event.messageReply && event.messageReply.senderID) {
        uids.push(String(event.messageReply.senderID));
      }

      // Check mentions
      if (event.mentions && Object.keys(event.mentions).length > 0) {
        for (const id of Object.keys(event.mentions)) {
          if (!uids.includes(String(id))) {
            uids.push(String(id));
          }
        }
      }

      // Check remaining args for numeric UIDs
      if (args.length > 1) {
        for (let i = 1; i < args.length; i++) {
          const raw = args[i].trim();
          if (/^\d+$/.test(raw) && !uids.includes(raw)) {
            uids.push(raw);
          }
        }
      }

      return uids;
    };

    // ACTION 1: LIST ADMINS
    if (subAction === "list" || subAction === "all" || subAction === "show") {
      const admins = config.adminBot;
      if (!admins.length) {
        return api.sendMessage(
          `❌ No administrators currently configured.\nUse "${prefix}admin add <UID>" to add one.`,
          threadID,
          messageID
        );
      }

      const listStr = admins.map((id, index) => `  ${index + 1}. 🆔 ${id}`).join("\n");
      const msg = `👑 ${botName || "Mini-Bot"} — ADMINISTRATOR LIST
━━━━━━━━━━━━━━━━━━━━
${listStr}
━━━━━━━━━━━━━━━━━━━━
👥 Total Admins: ${admins.length}
⚙️ Commands: ${prefix}admin add | ${prefix}admin remove`;

      return api.sendMessage(msg, threadID, messageID);
    }

    // Check admin permissions for add / remove actions
    const isExistingAdmin = config.adminBot.includes(senderID);
    const hasAdmins = config.adminBot.length > 0;

    if (hasAdmins && !isExistingAdmin) {
      return api.sendMessage(
        "❌ Permission Denied! Only existing administrators can add or remove bot admins.",
        threadID,
        messageID
      );
    }

    // ACTION 2: ADD ADMIN
    if (subAction === "add" || subAction === "+") {
      const targetUIDs = getTargetUIDs();
      if (targetUIDs.length === 0) {
        return api.sendMessage(
          `❌ Please provide the UID, mention a user, or reply to a message.\nUsage: ${prefix}admin add <UID / @mention / reply>`,
          threadID,
          messageID
        );
      }

      const added = [];
      const already = [];

      for (const uid of targetUIDs) {
        if (config.adminBot.includes(uid)) {
          already.push(uid);
        } else {
          config.adminBot.push(uid);
          added.push(uid);
        }
      }

      if (added.length > 0) {
        saveConfigFile();
      }

      let replyMsg = `👑 [ADMIN MANAGEMENT - ADD]\n━━━━━━━━━━━━━━━━━━━━\n`;
      if (added.length > 0) {
        replyMsg += `✅ Successfully added ${added.length} administrator(s):\n${added.map(id => `  ➕ 🆔 ${id}`).join("\n")}\n`;
      }
      if (already.length > 0) {
        replyMsg += `⚠️ Already an admin:\n${already.map(id => `  ▫️ 🆔 ${id}`).join("\n")}\n`;
      }
      replyMsg += `━━━━━━━━━━━━━━━━━━━━\n👥 Total Admins: ${config.adminBot.length}`;

      return api.sendMessage(replyMsg, threadID, messageID);
    }

    // ACTION 3: REMOVE ADMIN
    if (subAction === "remove" || subAction === "del" || subAction === "delete" || subAction === "-") {
      const targetUIDs = getTargetUIDs();
      if (targetUIDs.length === 0) {
        return api.sendMessage(
          `❌ Please provide the UID, mention a user, or reply to a message.\nUsage: ${prefix}admin remove <UID / @mention / reply>`,
          threadID,
          messageID
        );
      }

      const removed = [];
      const notFound = [];

      for (const uid of targetUIDs) {
        const idx = config.adminBot.indexOf(uid);
        if (idx !== -1) {
          config.adminBot.splice(idx, 1);
          removed.push(uid);
        } else {
          notFound.push(uid);
        }
      }

      if (removed.length > 0) {
        saveConfigFile();
      }

      let replyMsg = `👑 [ADMIN MANAGEMENT - REMOVE]\n━━━━━━━━━━━━━━━━━━━━\n`;
      if (removed.length > 0) {
        replyMsg += `🗑️ Successfully removed ${removed.length} administrator(s):\n${removed.map(id => `  ➖ 🆔 ${id}`).join("\n")}\n`;
      }
      if (notFound.length > 0) {
        replyMsg += `⚠️ Not found in admin list:\n${notFound.map(id => `  ▫️ 🆔 ${id}`).join("\n")}\n`;
      }
      replyMsg += `━━━━━━━━━━━━━━━━━━━━\n👥 Remaining Admins: ${config.adminBot.length}`;

      return api.sendMessage(replyMsg, threadID, messageID);
    }

    // Default Fallback
    return api.sendMessage(
      `📖 Admin Subcommands:
━━━━━━━━━━━━━━━━━━━━
▫️ ${prefix}admin list - View all bot administrators
▫️ ${prefix}admin add <UID/@mention/reply> - Add admin
▫️ ${prefix}admin remove <UID/@mention/reply> - Remove admin`,
      threadID,
      messageID
    );
  },

  run: async function (params) {
    return module.exports.onStart(params);
  }
};
