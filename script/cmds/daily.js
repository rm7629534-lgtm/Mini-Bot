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

function saveEconomyDB(data) {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to save economy DB:", e);
  }
}

module.exports = {
  config: {
    name: "daily",
    aliases: ["claim", "dailybonus", "reward"],
    version: "1.0.0",
    author: "AminulSardar",
    role: 0,
    shortDescription: "Claim your daily monetary bonus and streak",
    longDescription: "Receive daily cash rewards every 24 hours. Maintain daily streaks for higher cash multipliers!",
    category: "economy",
    guide: "{p}daily"
  },

  onStart: async function ({ api, event, prefix, botName }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const senderID = String(event.senderID);

    const db = getEconomyDB();
    if (!db[senderID]) {
      db[senderID] = { money: 0, bank: 0, dailyStreak: 0, lastDaily: 0 };
    }

    const userData = db[senderID];
    const now = Date.now();
    const COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours
    const STREAK_EXPIRY = 48 * 60 * 60 * 1000; // 48 hours to maintain streak

    const timeDiff = now - (userData.lastDaily || 0);

    // Cooldown check
    if (timeDiff < COOLDOWN) {
      const remainingMs = COOLDOWN - timeDiff;
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

      return api.sendMessage(
        `⏳ You have already claimed your daily reward!
━━━━━━━━━━━━━━━━━━━━
⏰ Please wait: ${hours}h ${minutes}m ${seconds}s
💡 Tip: Check your total wealth with "${prefix}balance"`,
        threadID,
        messageID
      );
    }

    // Streak calculation
    let currentStreak = userData.dailyStreak || 0;
    if (timeDiff > STREAK_EXPIRY) {
      currentStreak = 1; // Reset streak if missed more than 48 hours
    } else {
      currentStreak += 1;
    }

    // Base reward + streak bonus
    const baseReward = 500;
    const streakBonus = (currentStreak - 1) * 100;
    const totalReward = baseReward + streakBonus;

    userData.money = (Number(userData.money) || 0) + totalReward;
    userData.dailyStreak = currentStreak;
    userData.lastDaily = now;

    db[senderID] = userData;
    saveEconomyDB(db);

    const response = `🎁 DAILY REWARD CLAIMED!
━━━━━━━━━━━━━━━━━━━━
💵 Base Reward: +$${baseReward}
🔥 Streak Bonus (${currentStreak} days): +$${streakBonus}
🎉 Total Received: +$${totalReward}
━━━━━━━━━━━━━━━━━━━━
💰 Current Balance: $${userData.money.toLocaleString()}
⏰ Next Claim: in 24 hours
🔥 Current Streak: ${currentStreak} day(s)`;

    return api.sendMessage(response, threadID, messageID);
  },

  run: async function (params) {
    return module.exports.onStart(params);
  }
};
