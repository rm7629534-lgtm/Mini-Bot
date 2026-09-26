module.exports = {
  config: {
    name: "sendnoti",
    version: "1.0.0",
    author: "AminulSardar",
    role: 1, // Admin only
    shortDescription: "Broadcast an announcement notification to all connected groups",
    longDescription: "Sends a global broadcast announcement from bot admins to all active group chats with delivery statistics.",
    category: "admin",
    guide: "{p}sendnoti <announcement message>\n(Or reply to a message with {p}sendnoti)"
  },

  onStart: async function ({ api, event, args, prefix, config, botName, authorName }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const senderID = String(event.senderID);
    const admins = config.adminBot || [];

    // Admin validation check
    if (admins.length > 0 && !admins.includes(senderID)) {
      return api.sendMessage(
        "❌ Permission Denied! Only bot administrators can broadcast global notifications.",
        threadID,
        messageID
      );
    }

    let notiMessage = args.join(" ").trim();

    // Check if replied to a message
    if (!notiMessage && event.type === "message_reply" && event.messageReply && event.messageReply.body) {
      notiMessage = event.messageReply.body;
    }

    if (!notiMessage) {
      return api.sendMessage(
        `📢 [BROADCAST NOTIFICATION CONTROLLER]
━━━━━━━━━━━━━━━━━━━━
▫️ Direct Message: ${prefix}sendnoti <your announcement text>
▫️ Message Reply: Reply to any message with "${prefix}sendnoti"
━━━━━━━━━━━━━━━━━━━━
⚠️ This will send the notification to ALL groups the bot is currently in.`,
        threadID,
        messageID
      );
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const dateStr = now.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

    const broadcastTemplate = `📢 ━━━ [ BOT ANNOUNCEMENT ] ━━━ 📢
${notiMessage}
━━━━━━━━━━━━━━━━━━━━
👑 Sent By: Administrator (${senderID})
🤖 Bot: ${botName || "Mini-Bot"}
⏰ Time: ${timeStr} | 📅 Date: ${dateStr}`;

    // Simulation / Web Sandbox fallback
    if (!api || typeof api.getThreadList !== "function") {
      return api.sendMessage(
        `📢 [BROADCAST SIMULATION PREVIEW]
━━━━━━━━━━━━━━━━━━━━
${broadcastTemplate}
━━━━━━━━━━━━━━━━━━━━
✅ In live Messenger mode, this would be delivered to all connected group threads.`,
        threadID,
        messageID
      );
    }

    await api.sendMessage(`⏳ Broadcasting notification to all active groups... Please wait.`, threadID);

    api.getThreadList(100, null, ["INBOX"], async (err, list) => {
      if (err) {
        return api.sendMessage(`❌ Failed to retrieve group list for broadcast: ${err.message || err}`, threadID, messageID);
      }

      const groups = (list || []).filter(item => item.isGroup);

      if (groups.length === 0) {
        return api.sendMessage("❌ No active group threads found to broadcast.", threadID, messageID);
      }

      let successCount = 0;
      let failCount = 0;

      for (const group of groups) {
        try {
          await new Promise((resolve) => {
            api.sendMessage(broadcastTemplate, group.threadID, (sendErr) => {
              if (sendErr) {
                failCount++;
              } else {
                successCount++;
              }
              // Small delay to prevent spam triggers
              setTimeout(resolve, 350);
            });
          });
        } catch (e) {
          failCount++;
        }
      }

      const report = `📢 [BROADCAST REPORT]
━━━━━━━━━━━━━━━━━━━━
✅ Successfully Delivered: ${successCount} group(s)
${failCount > 0 ? `❌ Failed to Deliver: ${failCount} group(s)\n` : ""}👥 Total Target Groups: ${groups.length}
━━━━━━━━━━━━━━━━━━━━
✨ Broadcast completed!`;

      return api.sendMessage(report, threadID, messageID);
    });
  },

  run: async function (params) {
    return module.exports.onStart(params);
  }
};
