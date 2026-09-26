module.exports = {
  config: {
    name: "leaveNoti",
    eventType: ["log:unsubscribe"],
    version: "1.0.0",
    author: "AminulSardar",
    description: "Notification when a member leaves or gets kicked from group"
  },
  onStart: async function ({ api, event, botID }) {
    if (event.logMessageType !== "log:unsubscribe") return;

    const threadID = event.threadID;
    const leftID = event.logMessageData && event.logMessageData.leftParticipantFbId;
    if (!leftID) return;

    if (String(leftID) === String(botID)) {
      console.log(`❌ Bot was removed from group: ${threadID}`);
      return;
    }

    return api.sendMessage(
      `👋 Goodbye!

A member has left the group.

🆔 UID: ${leftID}

Take care! ❤️`,
      threadID
    );
  },
  run: async function (params) {
    return module.exports.onStart(params);
  }
};
