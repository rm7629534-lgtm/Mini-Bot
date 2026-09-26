module.exports = {
  config: {
    name: "callad",
    aliases: ["report", "contact", "calladmin", "feedback"],
    version: "1.0.0",
    author: "AminulSardar",
    role: 0,
    shortDescription: "Contact the bot admin",
    longDescription: "Sends a direct alert message and feedback to all registered bot administrators.",
    category: "utility",
    guide: "{p}callad <your report or question>"
  },
  onStart: async function ({ api, event, args, prefix, config }) {
    const admins = (config && config.adminBot) || [];
    if (!args || args.length === 0) {
      return api.sendMessage(`❌ Please provide a message to send to the admin.\nUsage: ${prefix}callad <message>`, event.threadID, event.messageID);
    }

    if (!admins.length) {
      return api.sendMessage("❌ No admin is currently configured to receive reports.", event.threadID, event.messageID);
    }

    const reportMsg = args.join(" ");
    const alertText = `🚨 ADMIN NOTIFICATION / CALLAD
━━━━━━━━━━━━━━━━━━━━
👤 Sender UID: ${event.senderID}
🧵 Thread ID: ${event.threadID}
⏰ Timestamp: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━
💬 Message:
${reportMsg}
━━━━━━━━━━━━━━━━━━━━`;

    let sentCount = 0;
    for (const adminID of admins) {
      try {
        api.sendMessage(alertText, adminID);
        sentCount++;
      } catch (err) {
        console.error(`Failed to send callad to admin ${adminID}:`, err);
      }
    }

    return api.sendMessage(`✅ Your report has been dispatched to ${sentCount} administrator(s).`, event.threadID, event.messageID);
  },
  run: async function (params) {
    return module.exports.onStart(params);
  }
};
