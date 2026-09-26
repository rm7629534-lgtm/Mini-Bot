const fs = require("fs");
const path = require("path");

const dbPath = path.join(process.cwd(), "Fca_Database", "economy.json");

function getEconomyDB() {
  try {
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify({}, null, 2), "utf8");
      return {};
    }
    const raw = fs.readFileSync(dbPath, "utf8");
    return JSON.parse(raw || "{}");
  } catch (e) {
    return {};
  }
}

module.exports = {
  config: {
    name: "balance",
    version: "1.0.0",
    author: "AminulSardar",
    role: 0,
    shortDescription: "Check user balance and economy status",
    longDescription: "View wallet coins, bank savings, and economy ranking of yourself or another user.",
    category: "economy",
    guide: "{p}balance [@mention / reply / UID]"
  },

  onStart: async function ({ api, event, args, prefix, botName }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    let targetID = String(event.senderID);
    let targetName = "You";

    // Check message reply
    if (event.type === "message_reply" && event.messageReply && event.messageReply.senderID) {
      targetID = String(event.messageReply.senderID);
      targetName = "User";
    }
    // Check mentions
    else if (event.mentions && Object.keys(event.mentions).length > 0) {
      const firstEntry = Object.entries(event.mentions)[0];
      targetID = String(firstEntry[0]);
      targetName = firstEntry[1].replace("@", "");
    }
    // Check UID argument
    else if (args && args[0] && /^\d+$/.test(args[0])) {
      targetID = args[0];
      targetName = `User (${targetID})`;
    }

    const db = getEconomyDB();
    const userData = db[targetID] || { money: 0, bank: 0, dailyStreak: 0, lastDaily: 0 };

    const money = Number(userData.money || 0).toLocaleString();
    const bank = Number(userData.bank || 0).toLocaleString();
    const total = (Number(userData.money || 0) + Number(userData.bank || 0)).toLocaleString();
    const streak = userData.dailyStreak || 0;

    // Calculate leaderboard rank
    const allUsers = Object.entries(db).map(([id, data]) => ({
      id,
      total: (Number(data.money || 0) + Number(data.bank || 0))
    })).sort((a, b) => b.total - a.total);

    const rankIndex = allUsers.findIndex(u => u.id === targetID);
    const rankStr = rankIndex !== -1 ? `#${rankIndex + 1}` : "Unranked";

    const response = `💰 ${botName || "Mini-Bot"} ECONOMY BALANCE
━━━━━━━━━━━━━━━━━━━━
👤 Account: ${targetName}
🆔 UID: ${targetID}

💵 Wallet Cash: $${money}
🏦 Bank Savings: $${bank}
💎 Net Worth: $${total}
🔥 Daily Streak: ${streak} day(s)
🏆 Global Rank: ${rankStr}
━━━━━━━━━━━━━━━━━━━━
💡 Use ${prefix}daily to claim your free reward!`;

    return api.sendMessage(response, threadID, messageID);
  },

  run: async function (params) {
    return module.exports.onStart(params);
  }
};
