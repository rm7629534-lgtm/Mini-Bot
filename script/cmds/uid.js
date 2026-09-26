module.exports = {
  config: {
    name: "uid",
    version: "1.0.0",
    author: "AminulSardar",
    role: 0,
    shortDescription: "Get Facebook User ID",
    longDescription: "Returns the User ID of the sender or tagged/replied user.",
    category: "utility",
    guide: "{p}uid [@mention/reply]"
  },
  onStart: async function ({ api, event }) {
    const threadID = event.threadID;
    const messageID = event.messageID;

    // Check if replied to a message
    if (event.type === "message_reply" && event.messageReply) {
      const targetUID = event.messageReply.senderID;
      return api.sendMessage(`🆔 Replied User UID: ${targetUID}`, threadID, messageID);
    }

    // Check mentions
    if (event.mentions && Object.keys(event.mentions).length > 0) {
      const mentions = Object.entries(event.mentions);
      const text = mentions.map(([id, name]) => `👤 ${name.replace("@", "")}: ${id}`).join("\n");
      return api.sendMessage(`🆔 Mentioned Users:\n${text}`, threadID, messageID);
    }

    // Default sender UID
    return api.sendMessage(`🆔 Your User ID (UID): ${event.senderID}`, threadID, messageID);
  },
  run: async function (params) {
    return module.exports.onStart(params);
  }
};
