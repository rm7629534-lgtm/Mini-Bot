const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(process.cwd(), "data");
const WELCOME_DATA_FILE = path.join(DATA_DIR, "welcomeConfig.json");

function getWelcomeConfig() {
  try {
    if (!fs.existsSync(WELCOME_DATA_FILE)) return {};
    const raw = fs.readFileSync(WELCOME_DATA_FILE, "utf8");
    return JSON.parse(raw) || {};
  } catch (e) {
    return {};
  }
}

module.exports = {
  config: {
    name: "joinNoti",
    eventType: ["log:subscribe"],
    version: "2.0.0",
    author: "AminulSardar",
    description: "Aesthetic notification and mentions when new members join or bot is added"
  },

  onStart: async function ({ api, event, botID, botName, prefix, authorName, config }) {
    if (event.logMessageType !== "log:subscribe") return;

    const threadID = event.threadID;
    const participants = event.logMessageData && event.logMessageData.addedParticipants;
    if (!participants || !Array.isArray(participants) || participants.length === 0) return;

    const welcomeConfigs = getWelcomeConfig();
    const threadConfig = welcomeConfigs[threadID] || { enabled: true, customMessage: "" };

    // Check if disabled for this group
    if (threadConfig.enabled === false) return;

    // Check if bot itself was added to the group
    const botWasAdded = participants.some(
      user => String(user.userFbId) === String(botID)
    );

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    const dateStr = now.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    const currentPrefix = prefix || config.prefix || "/";

    // 1. BOT JOIN EVENT
    if (botWasAdded) {
      const botGreeting = `╭━━━━ 🤖 [ ${String(botName || "MINI-BOT").toUpperCase()} CONNECTED ] ━━━━╮
│
│ ✨ Assalamu Alaikum / Hello Everyone!
│ 👋 Thank you so much for adding me to this group! ❤️
│
│ 👑 Developer: ${authorName || config.authorName || "AminulSardar"}
│ ⚙️ System Prefix: [ ${currentPrefix} ]
│
│ 📚 QUICK COMMAND GUIDE:
│ ▫️ ${currentPrefix}help    - View all available commands
│ ▫️ ${currentPrefix}ping    - Check latency and connection
│ ▫️ ${currentPrefix}info    - Bot specifications & details
│ ▫️ ${currentPrefix}daily   - Claim daily free coins
│ ▫️ ${currentPrefix}ai      - Chat with AI Intelligence
│ ▫️ ${currentPrefix}welcome - Configure group welcome settings
│
│ 💡 Type "bot" or "prefix" without symbol anytime!
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

      return api.sendMessage(botGreeting, threadID);
    }

    // 2. NEW MEMBERS JOIN EVENT
    const newMembers = participants.filter(user => String(user.userFbId) !== String(botID));
    if (newMembers.length === 0) return;

    // Fetch Thread Details for accurate member count and group name
    let threadName = "our wonderful group";
    let totalMembers = "100+";

    if (typeof api.getThreadInfo === "function") {
      try {
        const info = await new Promise((resolve) => {
          api.getThreadInfo(threadID, (err, data) => {
            if (err || !data) resolve(null);
            else resolve(data);
          });
        });
        if (info) {
          if (info.threadName) threadName = info.threadName;
          if (info.participantIDs) totalMembers = String(info.participantIDs.length);
        }
      } catch (e) {}
    }

    const mentions = [];
    const memberNames = [];

    newMembers.forEach((member) => {
      const name = member.fullName || "Friend";
      memberNames.push(name);
      mentions.push({
        tag: name,
        id: member.userFbId
      });
    });

    const joinedNames = memberNames.join(", ");

    // Custom template if provided
    if (threadConfig.customMessage) {
      const formatted = threadConfig.customMessage
        .replace(/{name}/g, joinedNames)
        .replace(/{group}/g, threadName)
        .replace(/{memberCount}/g, totalMembers)
        .replace(/{time}/g, timeStr)
        .replace(/{date}/g, dateStr)
        .replace(/{prefix}/g, currentPrefix)
        .replace(/{botName}/g, botName || "Mini-Bot")
        .replace(/{author}/g, authorName || "AminulSardar");

      return api.sendMessage({ body: formatted, mentions }, threadID);
    }

    // Default Aesthetic Bangla & English Welcome Message
    const defaultWelcome = `╭━━━ 🌸 WELCOME TO OUR GROUP 🌸 ━━━╮
│
│ ✨ Welcome ${joinedNames}!
│ 🏡 Group: ${threadName}
│
│ 👤 Member No: #${totalMembers}
│ ⏰ Joined at: ${timeStr}
│ 📅 Date: ${dateStr}
│
│ 📜 GROUP ETIQUETTES:
│ ▫️ সবার সাথে ভদ্র ও মার্জিত আচরণ বজায় রাখুন
│ ▫️ স্প্যাম বা অবাঞ্ছিত লিঙ্ক শেয়ার করা নিষেধ
│ ▫️ নিয়মিত আড্ডায় যুক্ত থাকুন ও উপভোগ করুন!
│
│ 🤖 Assistant: ${botName || "Mini-Bot"}
│ 💡 Type "${currentPrefix}help" to explore commands
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

    return api.sendMessage({ body: defaultWelcome, mentions }, threadID);
  },

  run: async function (params) {
    return module.exports.onStart(params);
  }
};
