module.exports = {
  config: {
    name: "tid",
    aliases: ["threadid", "boxid", "groupid"],
    version: "1.0.0",
    author: "AminulSardar",
    role: 0,
    shortDescription: "Get Thread ID",
    longDescription: "Returns the current Group Chat / Thread ID.",
    category: "utility",
    guide: "{p}tid"
  },
  onStart: async function ({ api, event }) {
    return api.sendMessage(
      `🧵 Current Thread ID (TID):\n${event.threadID}`,
      event.threadID,
      event.messageID
    );
  },
  run: async function (params) {
    return module.exports.onStart(params);
  }
};
