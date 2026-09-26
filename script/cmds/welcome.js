const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(process.cwd(), "data");
const WELCOME_DATA_FILE = path.join(DATA_DIR, "welcomeConfig.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(WELCOME_DATA_FILE)) {
    fs.writeFileSync(WELCOME_DATA_FILE, JSON.stringify({}, null, 2), "utf8");
  }
}

function getWelcomeConfig() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(WELCOME_DATA_FILE, "utf8");
    return JSON.parse(raw) || {};
  } catch (e) {
    return {};
  }
}

function saveWelcomeConfig(data) {
  ensureDataFile();
  try {
    fs.writeFileSync(WELCOME_DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to save welcome config:", e);
  }
}

module.exports = {
  config: {
    name: "welcome",
    aliases: ["wel", "welcomemode", "setwelcome"],
    version: "2.0.0",
    author: "AminulSardar",
    role: 0,
    shortDescription: "Customize, test, and manage group welcome notifications",
    longDescription: "Manage welcome greeting notifications when new members join. Customize welcome templates with placeholders {name}, {group}, {memberCount}, {time}, {date}, {prefix}.",
    category: "group",
    guide: "{p}welcome\n{p}welcome on\n{p}welcome off\n{p}welcome test\n{p}welcome set <custom message>\n{p}welcome reset"
  },

  onStart: async function ({ api, event, args, prefix, config, botName, authorName }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const senderID = String(event.senderID);
    const admins = config.adminBot || [];
    const isBotAdmin = admins.includes(senderID);

    const sub = (args[0] || "").toLowerCase();
    const welcomeConfigs = getWelcomeConfig();
    const threadConfig = welcomeConfigs[threadID] || {
      enabled: true,
      customMessage: ""
    };

    // ACTION: Turn ON
    if (sub === "on" || sub === "enable" || sub === "1") {
      threadConfig.enabled = true;
      welcomeConfigs[threadID] = threadConfig;
      saveWelcomeConfig(welcomeConfigs);
      return api.sendMessage(
        `✅ [WELCOME NOTIFICATION ENABLED]
━━━━━━━━━━━━━━━━━━━━
🎉 Welcome greetings are now active for this group!
✨ New members will receive a warm welcome message upon joining.`,
        threadID,
        messageID
      );
    }

    // ACTION: Turn OFF
    if (sub === "off" || sub === "disable" || sub === "0") {
      threadConfig.enabled = false;
      welcomeConfigs[threadID] = threadConfig;
      saveWelcomeConfig(welcomeConfigs);
      return api.sendMessage(
        `⛔ [WELCOME NOTIFICATION DISABLED]
━━━━━━━━━━━━━━━━━━━━
🔕 Welcome greetings have been turned off for this group.`,
        threadID,
        messageID
      );
    }

    // ACTION: SET CUSTOM TEMPLATE
    if (sub === "set" || sub === "custom") {
      const customText = args.slice(1).join(" ").trim();
      if (!customText) {
        return api.sendMessage(
          `❌ Please provide your custom welcome template!\n\n💡 Available Placeholders:
▫️ {name} : Member's Name (with mention)
▫️ {group} : Group Name
▫️ {memberCount} : Total Group Members
▫️ {time} : Current Time (e.g. 10:30 PM)
▫️ {date} : Current Date (e.g. 26 Sep 2026)
▫️ {prefix} : Bot Prefix
▫️ {botName} : Bot Name

👉 Example:
${prefix}welcome set 🎉 Welcome {name} to {group}! You are our #{memberCount} member. Enjoy your stay! ❤️`,
          threadID,
          messageID
        );
      }

      threadConfig.customMessage = customText;
      threadConfig.enabled = true;
      welcomeConfigs[threadID] = threadConfig;
      saveWelcomeConfig(welcomeConfigs);

      return api.sendMessage(
        `✨ [CUSTOM WELCOME TEMPLATE SAVED]
━━━━━━━━━━━━━━━━━━━━
📝 New Template:
"${customText}"
━━━━━━━━━━━━━━━━━━━━
💡 Use "${prefix}welcome test" to preview how it will appear to new members!`,
        threadID,
        messageID
      );
    }

    // ACTION: RESET TO DEFAULT
    if (sub === "reset" || sub === "default") {
      threadConfig.customMessage = "";
      threadConfig.enabled = true;
      welcomeConfigs[threadID] = threadConfig;
      saveWelcomeConfig(welcomeConfigs);

      return api.sendMessage(
        `🔄 Welcome message template has been reset to the default aesthetic design.`,
        threadID,
        messageID
      );
    }

    // ACTION: TEST PREVIEW
    if (sub === "test" || sub === "preview") {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      const dateStr = now.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
      const mockName = "New Member";
      const groupName = event.threadName || "Active Group";
      const memberCount = "100";

      let previewText = "";
      if (threadConfig.customMessage) {
        previewText = threadConfig.customMessage
          .replace(/{name}/g, mockName)
          .replace(/{group}/g, groupName)
          .replace(/{memberCount}/g, memberCount)
          .replace(/{time}/g, timeStr)
          .replace(/{date}/g, dateStr)
          .replace(/{prefix}/g, prefix)
          .replace(/{botName}/g, botName || "Mini-Bot")
          .replace(/{author}/g, authorName || "AminulSardar");
      } else {
        previewText = `╭━━━ 🌸 WELCOME TO OUR GROUP 🌸 ━━━╮
│
│ ✨ Welcome ${mockName} to ${groupName}!
│
│ 👤 Member No: #${memberCount}
│ ⏰ Joined at: ${timeStr}
│ 📅 Date: ${dateStr}
│
│ 📜 Group Rules:
│ ▫️ Be respectful to everyone
│ ▫️ No spamming or toxic behavior
│ ▫️ Feel free to interact & have fun!
│
│ 🤖 Bot Assistant: ${botName || "Mini-Bot"}
│ 💡 Type ${prefix}help for command list
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
      }

      return api.sendMessage(
        `👀 [WELCOME MESSAGE PREVIEW]
━━━━━━━━━━━━━━━━━━━━
${previewText}
━━━━━━━━━━━━━━━━━━━━
Status: ${threadConfig.enabled ? "✅ ACTIVE" : "🔕 DISABLED"}`,
        threadID,
        messageID
      );
    }

    // DEFAULT: SHOW MENU & STATUS
    const isEnabled = threadConfig.enabled !== false;
    return api.sendMessage(
      `🎉 ━━━━ [ WELCOME SYSTEM MANAGER ] ━━━━ 🎉

📊 Current Status: ${isEnabled ? "✅ ACTIVE (Enabled)" : "🔕 INACTIVE (Disabled)"}
📝 Template Mode: ${threadConfig.customMessage ? "🎨 Custom Template" : "💎 Default Aesthetic"}

━━━━━━━━━━━━━━━━━━━━
💡 CONTROL COMMANDS:
▫️ ${prefix}welcome on       - Enable welcome messages
▫️ ${prefix}welcome off      - Disable welcome messages
▫️ ${prefix}welcome test     - Preview how the welcome looks
▫️ ${prefix}welcome set <text> - Set custom welcome text
▫️ ${prefix}welcome reset    - Reset to default template

📌 Dynamic Tags for Custom Welcome:
{name}, {group}, {memberCount}, {time}, {date}, {prefix}, {botName}`,
      threadID,
      messageID
    );
  },

  run: async function (params) {
    return module.exports.onStart(params);
  }
};
