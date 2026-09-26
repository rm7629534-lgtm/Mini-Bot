module.exports = {
  config: {
    name: "pending",
    aliases: ["pend", "requests", "approve"],
    version: "1.0.0",
    author: "AminulSardar",
    role: 1, // Admin only
    shortDescription: "Manage pending message requests and spam inbox",
    longDescription: "View, approve, or cancel pending message requests from users or groups trying to contact the bot.",
    category: "admin",
    guide: "{p}pending\n{p}pending accept <index or TID>\n{p}pending cancel <index or TID>\n{p}pending accept all"
  },

  onStart: async function ({ api, event, args, prefix, config, botName }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const senderID = String(event.senderID);
    const admins = config.adminBot || [];

    if (admins.length > 0 && !admins.includes(senderID)) {
      return api.sendMessage("❌ Permission Denied! Only bot administrators can manage message requests.", threadID, messageID);
    }

    const action = (args[0] || "").toLowerCase();

    if (!api || typeof api.getThreadList !== "function") {
      return api.sendMessage(
        `📬 [PENDING MESSAGE REQUESTS]
━━━━━━━━━━━━━━━━━━━━
✅ No pending message requests in queue.
💡 In live Messenger mode, this reviews spam / filtered inbox requests.`,
        threadID,
        messageID
      );
    }

    try {
      // Fetch both PENDING and OTHER queues
      api.getThreadList(50, null, ["PENDING"], (err1, pendingList) => {
        if (err1) pendingList = [];

        api.getThreadList(50, null, ["OTHER"], (err2, otherList) => {
          if (err2) otherList = [];

          const allPending = [...(pendingList || []), ...(otherList || [])];

          if (allPending.length === 0) {
            return api.sendMessage("📬 No pending message requests found in queue.", threadID, messageID);
          }

          // ACTION: ACCEPT / APPROVE
          if (action === "accept" || action === "approve" || action === "add") {
            const target = (args[1] || "").toLowerCase();
            if (!target) {
              return api.sendMessage(`❌ Usage: ${prefix}pending accept <index number / TID / all>`, threadID, messageID);
            }

            if (target === "all") {
              let acceptedCount = 0;
              for (const thread of allPending) {
                api.sendMessage(`✨ Hello! ${botName || "Mini-Bot"} has accepted your message request. Type ${prefix}help to get started!`, thread.threadID);
                acceptedCount++;
              }
              return api.sendMessage(`✅ Successfully accepted all ${acceptedCount} pending request(s)!`, threadID, messageID);
            }

            let targetThread = null;
            if (/^\d+$/.test(target) && target.length <= 3) {
              const idx = parseInt(target, 10) - 1;
              if (idx >= 0 && idx < allPending.length) {
                targetThread = allPending[idx];
              }
            } else {
              targetThread = allPending.find(t => String(t.threadID) === String(target));
            }

            if (!targetThread) {
              return api.sendMessage(`❌ Pending request for "${target}" was not found.`, threadID, messageID);
            }

            const tName = targetThread.name || `Thread ${targetThread.threadID}`;
            api.sendMessage(
              `✨ Hello! ${botName || "Mini-Bot"} has accepted your message request.\nType ${prefix}help to see commands!`,
              targetThread.threadID,
              (sendErr) => {
                if (sendErr) {
                  return api.sendMessage(`❌ Failed to send accept message: ${sendErr.message || sendErr}`, threadID, messageID);
                }
                return api.sendMessage(`✅ Successfully accepted pending request: "${tName}" (TID: ${targetThread.threadID})`, threadID, messageID);
              }
            );
            return;
          }

          // ACTION: CANCEL / REJECT
          if (action === "cancel" || action === "decline" || action === "del" || action === "reject") {
            const target = (args[1] || "").toLowerCase();
            if (!target) {
              return api.sendMessage(`❌ Usage: ${prefix}pending cancel <index number / TID>`, threadID, messageID);
            }

            let targetTID = target;
            if (/^\d+$/.test(target) && target.length <= 3) {
              const idx = parseInt(target, 10) - 1;
              if (idx >= 0 && idx < allPending.length) {
                targetTID = allPending[idx].threadID;
              }
            }

            if (typeof api.deleteThread === "function") {
              api.deleteThread(targetTID, (delErr) => {
                if (delErr) {
                  return api.sendMessage(`❌ Failed to delete thread: ${delErr.message || delErr}`, threadID, messageID);
                }
                return api.sendMessage(`🗑️ Successfully declined & deleted pending thread: ${targetTID}`, threadID, messageID);
              });
            } else {
              return api.sendMessage(`🗑️ Rejected request for TID: ${targetTID}`, threadID, messageID);
            }
            return;
          }

          // Default: List all pending requests
          let listMsg = `📬 [PENDING MESSAGE REQUESTS: ${allPending.length}]
━━━━━━━━━━━━━━━━━━━━\n`;

          allPending.forEach((item, index) => {
            const name = item.name || (item.isGroup ? "Unnamed Group" : "Direct User");
            const type = item.isGroup ? "👥 Group" : "👤 User";
            listMsg += `${index + 1}. ${type}: ${name}\n   🆔 TID: ${item.threadID} | 📩 Unread: ${item.unreadCount || 0}\n`;
          });

          listMsg += `━━━━━━━━━━━━━━━━━━━━
💡 Commands:
▫️ ${prefix}pending accept <index/TID/all>
▫️ ${prefix}pending cancel <index/TID>`;

          return api.sendMessage(listMsg, threadID, messageID);
        });
      });
    } catch (err) {
      return api.sendMessage(`❌ Error retrieving pending requests: ${err.message}`, threadID, messageID);
    }
  },

  run: async function (params) {
    return module.exports.onStart(params);
  }
};
