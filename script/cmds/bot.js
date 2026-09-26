const os = require("os");

const RANDOM_BOT_SMS = [
  "হুম বলো জানু, আমি শুনছি তো 🥰",
  "কী হলো, আমাকে ডাকলেন কেন? 🙈",
  "বলো কি সেবা করতে পারি? 🤖",
  "ডাকেন কেন বারবার, প্রেমে পড়েছেন নাকি? 😂",
  "জি বলুন, আপনার জন্য কি করতে পারি? 🫡",
  "আরে দোস্ত! কী অবস্থা? কিছু লাগবে? 😎",
  "আই এম হিয়ার! কোনো হুকুম থাকলে বলুন boss 🚀",
  "শুনছি তো! কিন্তু বেশি জ্বালালে কিন্তু অফলাইন হয়ে যাবো 😜",
  "এত মধুর সুরে কে ডাকে গো আমাকে! 😇",
  "আমি রোবট হতে পারি, কিন্তু মন আমার খাঁটি সোনার! ❤️",
  "Yes master! I am ready to serve. How can I help you today? ✨",
  "বলো প্রিয়, বটের কি ঘুম নেই নাকি? সবসময় শুধু ডাকো 😴",
  "সবাই শুধু কাজ করায়, কেউ তো একটু ভালোও বাসে না 🥺",
  "কী খবর বন্ধু? চলো একটু আড্ডা দেওয়া যাক! ☕",
  "অ্যাসিস্ট্যান্ট অনলাইন! যেকোনো কমান্ড দেখতে Type করুন: /help 📋",
  "আমাকে এতো স্মরণ করার জন্য ধন্যবাদ! কি সাহায্য দরকার বলো? 🌟",
  "কে ডাকে রে বটেরে! বলো কি লাগবে? 🔥",
  "Hi! I am here! Just say the word and I will execute! ⚡",
  "হ্যাঁ ভাই, ডাকছিলেন? নাকি ভুলে চাপ লেগে গেছে? 🤭",
  "বট বাবাজি হাজির! আপনার কি আর্জি পেশ করুন 🧙‍♂️"
];

function formatUptime(uptimeMs) {
  const totalSeconds = Math.floor(uptimeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

module.exports = {
  config: {
    name: "bot",
    version: "1.1.0",
    author: "AminulSardar",
    role: 0,
    hasPrefix: false,
    nonPrefix: true,
    shortDescription: "Random fun SMS reply on 'bot' or system specs on stats",
    longDescription: "Replies with random fun and interactive messages whenever summoned, or returns comprehensive system telemetry with stats.",
    category: "system",
    guide: "bot\n{p}bot\n{p}bot stats\n{p}bot ping"
  },

  onStart: async function ({ api, event, args, prefix, commands, events, config, botName, authorName, startTime }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const sub = (args[0] || "").toLowerCase();

    // Friendly greetings / Random SMS replies when triggered with no args or greeting
    if (!sub || sub === "hi" || sub === "hello" || sub === "hey" || sub === "sms" || sub === "random") {
      const randomIndex = Math.floor(Math.random() * RANDOM_BOT_SMS.length);
      const chosenReply = RANDOM_BOT_SMS[randomIndex];
      return api.sendMessage(chosenReply, threadID, messageID);
    }

    // Ping check
    if (sub === "ping") {
      const startPing = Date.now();
      return api.sendMessage("🏓 Measuring latency...", threadID, async (err, info) => {
        const latency = Date.now() - startPing;
        const msg = `⚡ PONG! Response Latency: ${latency}ms\n🤖 Bot Engine: Online & Responsive!`;
        if (info && info.messageID && typeof api.editMessage === "function") {
          api.editMessage(msg, info.messageID);
        } else {
          api.sendMessage(msg, threadID);
        }
      });
    }

    // System stats / specs
    if (sub === "stats" || sub === "info" || sub === "system" || sub === "spec") {
      const memUsage = process.memoryUsage();
      const ramMB = (memUsage.rss / 1024 / 1024).toFixed(1);
      const heapMB = (memUsage.heapUsed / 1024 / 1024).toFixed(1);
      const totalMemGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
      const freeMemGB = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);

      const uptimeMs = startTime ? Date.now() - startTime : process.uptime() * 1000;
      const uptimeFormatted = formatUptime(uptimeMs);

      const totalCmds = commands ? commands.size : 0;
      const totalEvts = events ? events.size : 0;
      const adminCount = (config.adminBot || []).length;
      const botID = api && typeof api.getCurrentUserID === "function" ? api.getCurrentUserID() : "100000000000000";

      const response = `🤖 ━━━━ [ ${String(botName || "MINI-BOT").toUpperCase()} SYSTEM ] ━━━━ 🤖

👑 Developer / Owner: ${authorName || config.authorName || "AminulSardar"}
🏷️ Bot Name: ${botName || "Mini-Bot"}
🆔 Bot UID: ${botID}
⚙️ System Prefix: ${prefix}
🔒 Admin-Only Mode: ${config.adminOnly ? "ENABLED" : "DISABLED"}

📊 SYSTEM & PERFORMANCE:
━━━━━━━━━━━━━━━━━━━━
⏱️ Bot Uptime: ${uptimeFormatted}
💾 RAM Usage: ${ramMB} MB (Heap: ${heapMB} MB)
🖥️ Server Memory: ${freeMemGB} GB free / ${totalMemGB} GB total
⚙️ Node Version: ${process.version}
📦 OS Platform: ${os.type()} (${os.arch()})

🧩 MODULES & FEATURES:
━━━━━━━━━━━━━━━━━━━━
⚡ Total Commands: ${totalCmds} loaded
🎉 Total Events: ${totalEvts} active
🛡️ Bot Admins: ${adminCount} assigned

💡 Type "${prefix}help" to explore all available commands!`;

      return api.sendMessage(response, threadID, messageID);
    }

    // Default fallback to random reply
    const randomIndex = Math.floor(Math.random() * RANDOM_BOT_SMS.length);
    return api.sendMessage(RANDOM_BOT_SMS[randomIndex], threadID, messageID);
  },

  run: async function (params) {
    return module.exports.onStart(params);
  }
};
