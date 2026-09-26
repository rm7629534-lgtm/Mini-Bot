module.exports = {
  config: {
    name: "say",
    aliases: ["echo", "speak", "voice", "talk"],
    version: "1.0.0",
    author: "AminulSardar",
    role: 0,
    shortDescription: "Make the bot repeat a message",
    longDescription: "Echoes back whatever message text you provide.",
    category: "general",
    guide: "{p}say <text>"
  },
  onStart: async function ({ api, event, args, prefix }) {
    if (!args || args.length === 0) {
      return api.sendMessage(`❌ Usage: ${prefix}say <message>`, event.threadID, event.messageID);
    }
    const message = args.join(" ");
    return api.sendMessage(message, event.threadID);
  },
  run: async function (params) {
    return module.exports.onStart(params);
  }
};
