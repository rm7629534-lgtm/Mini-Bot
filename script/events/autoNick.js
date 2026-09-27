module.exports = {
  config: {
    name: "autoNick",
    eventType: ["log:subscribe"],
    version: "1.0.0",
    author: "AminulSardar",
    description: "Automatically sets bot nickname in group when joined"
  },
  onStart: async function ({ api, event, botID, botName, config }) {
    if (!config || !config.autoSetNickname) return;
    if (event.logMessageType !== "log:subscribe") return;

    const participants = event.logMessageData && event.logMessageData.addedParticipants;
    if (!participants) return;

    const botWasAdded = participants.some(
      user => String(user.userFbId) === String(botID)
    );

    if (botWasAdded && event.threadID && typeof api.changeNickname === "function") {
      try {
        const promiseOrReq = api.changeNickname(
          botName || "Mini-Bot",
          event.threadID,
          botID,
          (err) => {
            if (err) {
              // Silently ignore permission limitations
            } else {
              console.log(`✅ Set nickname to "${botName}" in thread ${event.threadID}`);
            }
          }
        );
        if (promiseOrReq && typeof promiseOrReq.catch === "function") {
          promiseOrReq.catch(() => {});
        }
      } catch (e) {
        // Safe failover
      }
    }
  },
  run: async function (params) {
    return module.exports.onStart(params);
  }
};
