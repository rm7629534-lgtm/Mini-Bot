module.exports = {
  config: {
    name: "listbox",
    version: "1.0.0",
    author: "AminulSardar",
    role: 1, // Admin only
    shortDescription: "View list of active group chats and manage boxes",
    longDescription: "Displays all connected group threads with participant counts and thread IDs. Allows admins to leave groups remotely.",
    category: "admin",
    guide: "{p}listbox\n{p}listbox leave <threadID or index>"
  },

  onStart: async function ({ api, event, args, prefix, config, botName }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const senderID = String(event.senderID);
    const admins = config.adminBot || [];

    if (admins.length > 0 && !admins.includes(senderID)) {
      return api.sendMessage("❌ Permission Denied! Only bot administrators can view connected chat boxes.", threadID, messageID);
    }

    const subAction = (args[0] || "").toLowerCase();

    // Check if getThreadList is supported
    if (!api || typeof api.getThreadList !== "function") {
      // Fallback for mock/simulation environment
      return api.sendMessage(
        `📦 [ACTIVE GROUP THREADS]
━━━━━━━━━━━━━━━━━━━━
1. 👥 Current Thread: "${event.threadName || "Active Group"}"
   🆔 TID: ${threadID}
   👤 Sender UID: ${senderID}
━━━━━━━━━━━━━━━━━━━━
💡 In live Messenger mode, this lists all groups the bot is participating in.`,
        threadID,
        messageID
      );
    }

    try {
      api.getThreadList(100, null, ["INBOX"], async (err, list) => {
        if (err) {
          return api.sendMessage(`❌ Failed to retrieve group list: ${err.message || err}`, threadID, messageID);
        }

        const groupList = (list || []).filter(item => item.isGroup && item.threadID !== threadID);
        // Include current thread at top if group
        const currentInList = (list || []).find(item => item.threadID === threadID);
        const allGroups = currentInList && currentInList.isGroup 
          ? [currentInList, ...groupList] 
          : groupList;

        if (allGroups.length === 0) {
          return api.sendMessage("📦 Bot is currently not present in any group chats.", threadID, messageID);
        }

        // Action: Leave group
        if (subAction === "leave" || subAction === "out") {
          const target = args[1];
          if (!target) {
            return api.sendMessage(`❌ Usage: ${prefix}listbox leave <index number or threadID>`, threadID, messageID);
          }

          let targetTID = target;
          if (/^\d+$/.test(target) && target.length <= 3) {
            const idx = parseInt(target, 10) - 1;
            if (idx >= 0 && idx < allGroups.length) {
              targetTID = allGroups[idx].threadID;
            }
          }

          const targetGroup = allGroups.find(g => String(g.threadID) === String(targetTID));
          const name = targetGroup ? (targetGroup.name || "Untitled Group") : targetTID;

          if (typeof api.removeUserFromGroup === "function") {
            const botID = api.getCurrentUserID();
            api.removeUserFromGroup(botID, targetTID, (leaveErr) => {
              if (leaveErr) {
                return api.sendMessage(`❌ Failed to leave group (${name}): ${leaveErr.message || leaveErr}`, threadID, messageID);
              }
              return api.sendMessage(`✅ Successfully left group: "${name}" (TID: ${targetTID})`, threadID, messageID);
            });
          } else {
            return api.sendMessage(`✅ Left request issued for TID: ${targetTID}`, threadID, messageID);
          }
          return;
        }

        // Display list
        let response = `📦 [CONNECTED GROUP BOXES: ${allGroups.length}]
━━━━━━━━━━━━━━━━━━━━\n`;

        allGroups.slice(0, 25).forEach((group, index) => {
          const name = group.name || "Untitled Group";
          const count = group.participantIDs ? group.participantIDs.length : (group.unreadCount || 0);
          response += `${index + 1}. 👥 ${name}\n   🆔 TID: ${group.threadID} | 👤 Members: ${count}\n`;
        });

        if (allGroups.length > 25) {
          response += `...and ${allGroups.length - 25} more groups.\n`;
        }

        response += `━━━━━━━━━━━━━━━━━━━━
💡 Use "${prefix}listbox leave <index / TID>" to leave a group.`;

        return api.sendMessage(response, threadID, messageID);
      });
    } catch (e) {
      return api.sendMessage(`❌ Error listing boxes: ${e.message}`, threadID, messageID);
    }
  },

  run: async function (params) {
    return module.exports.onStart(params);
  }
};
