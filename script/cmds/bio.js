module.exports = {
  config: {
    name: "bio",
    aliases: ["setbio", "botbio", "changebio"],
    version: "1.0.0",
    author: "AminulSardar",
    role: 1, // Admin only
    shortDescription: "Change the Facebook profile bio of the bot account",
    longDescription: "Updates the public biography (intro) of the bot Facebook profile.",
    category: "admin",
    guide: "{p}bio <new biography text>\n{p}bio clear"
  },

  onStart: async function ({ api, event, args, prefix, config, botName }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const senderID = String(event.senderID);
    const admins = config.adminBot || [];

    if (admins.length > 0 && !admins.includes(senderID)) {
      return api.sendMessage("❌ Permission Denied! Only bot administrators can update the bot bio.", threadID, messageID);
    }

    if (!args || args.length === 0) {
      return api.sendMessage(
        `📝 FACEBOOK BIO CONTROLLER
━━━━━━━━━━━━━━━━━━━━
▫️ Set Bio: ${prefix}bio <your custom bio text>
▫️ Clear Bio: ${prefix}bio clear
━━━━━━━━━━━━━━━━━━━━
💡 Updates the bot's Facebook profile intro.`,
        threadID,
        messageID
      );
    }

    let newBio = args.join(" ").trim();
    if (newBio.toLowerCase() === "clear" || newBio.toLowerCase() === "none" || newBio.toLowerCase() === "remove") {
      newBio = "";
    }

    if (newBio.length > 101) {
      return api.sendMessage("❌ Facebook bio limit is 101 characters maximum. Please shorten your text.", threadID, messageID);
    }

    if (!api || typeof api.changeBio !== "function") {
      return api.sendMessage(
        `✅ [SIMULATION] Bot bio would be set to:\n"${newBio || "(Cleared)"}"`,
        threadID,
        messageID
      );
    }

    api.changeBio(newBio, (err) => {
      if (err) {
        return api.sendMessage(`❌ Failed to update bio: ${err.message || err}`, threadID, messageID);
      }
      return api.sendMessage(
        `✨ [BIO UPDATED SUCCESSFULLY]
━━━━━━━━━━━━━━━━━━━━
📝 New Bio: "${newBio || "(Cleared)"}"
🤖 Bot UID: ${api.getCurrentUserID ? api.getCurrentUserID() : "Bot"}`,
        threadID,
        messageID
      );
    });
  },

  run: async function (params) {
    return module.exports.onStart(params);
  }
};
