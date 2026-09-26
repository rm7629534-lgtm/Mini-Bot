const fca = require("abir-fca");
const fs = require("fs");
const http = require("http");

// ==========================================
// PUBLIC SERVER
// ==========================================
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8"
  });

  res.end(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AMINUL-BOT</title>
</head>
<body style="font-family:Arial;text-align:center;padding:50px;">
  <h1>🤖 𝐀𝐌𝐈𝐍𝐔𝐋-𝐁𝐎𝐓</h1>
  <h2>🟢 Bot is Running</h2>
  <p>Bot server is online successfully.</p>
  <p>Port: ${PORT}</p>
</body>
</html>
  `);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Public server running on port ${PORT}`);
});

// ==========================================
// LOAD MINICONFIG
// ==========================================
let config;

try {
  config = JSON.parse(
    fs.readFileSync("./miniconfig.json", "utf8")
  );
} catch (err) {
  console.error("❌ miniconfig.json পাওয়া যায়নি বা JSON ভুল!");
  process.exit(1);
}

// ==========================================
// CONFIG
// ==========================================
const PREFIX = config.prefix || "/";
const ADMINS = config.adminBot || [];
const BOT_NAME = config.nickNameBot || "Goat-Bot-V2";
const AUTHOR_NAME = config.authorName || "AminulSardar";
const AUTHOR_EMAIL = config.authorEmail || "";
const AUTHOR_FB = config.authorFB || "";
const TIMEZONE = config.timeZone || "Asia/Dhaka";
const AUTO_NICKNAME = config.autoSetNickname || false;

const startTime = Date.now();

// ==========================================
// BOT RANDOM REPLIES
// ==========================================
const botReplies = [
  "Hi, I'm messenger Bot, I can help you.?🤖",
  "Use callad to contact admin!",
  "Hi, Don't disturb 🤖 🚘 Now I'm going to Feni, Bangladesh..bye",
  "Hi, 🤖 I can help you~~~~",
  "আমি এখন আমিনুল বসের সাথে বিজি আছি",
  "আমাকে আমাকে না ডেকে আমার বসকে ডাকো",
  "Hmmm sona 🖤 meye hoile kule aso ar sele hoile kule new 🫂😘",
  "Yah This Bot creator : aminulsardar",
  "হা বলো, শুনছি আমি 🤸‍♂️🫂",
  "Ato daktasen kn bujhlam na 😡",
  "Hmm jan ummah😘😘",
  "hanga korba 🙂🖤",
  "iss ato dako keno lojja lage to 🫦🙈",
  "suna tomare amar valo lage,🙈😽"
];

function getRandomReply() {
  return botReplies[
    Math.floor(Math.random() * botReplies.length)
  ];
}

// ==========================================
// FORMAT UPTIME
// ==========================================
function formatUptime(ms) {
  const totalSeconds = Math.floor(ms / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// ==========================================
// START BOT
// ==========================================
function startBot() {
  let appState;

  try {
    appState = JSON.parse(
      fs.readFileSync("./appState.json", "utf8")
    );
  } catch (err) {
    console.error("❌ appState.json পাওয়া যায়নি বা JSON ভুল!");
    return;
  }

  fca.login(
    {
      appState: appState
    },
    (err, api) => {
      if (err) {
        console.error("❌ Facebook Login Failed:");
        console.error(err);
        return;
      }

      const botID = api.getCurrentUserID();

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`🤖 ${BOT_NAME}`);
      console.log("✅ Bot Started Successfully");
      console.log(`🆔 Bot UID: ${botID}`);
      console.log(`👤 Created by ${AUTHOR_NAME}`);
      console.log(`⚙️ Prefix: ${PREFIX}`);
      console.log(`🕐 Timezone: ${TIMEZONE}`);
      console.log(`🌐 Port: ${PORT}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      api.setOptions({
        listenEvents: true,
        selfListen: false,
        autoMarkRead: false,
        autoMarkDelivery: false
      });

      // ========================================
      // AUTO NICKNAME
      // ========================================
      if (AUTO_NICKNAME) {
        try {
          api.changeNickname(
            BOT_NAME,
            null,
            botID,
            (error) => {
              if (error) {
                console.log("⚠️ Auto nickname failed.");
              } else {
                console.log(`✅ Nickname: ${BOT_NAME}`);
              }
            }
          );
        } catch (error) {
          console.log("⚠️ Nickname feature unavailable.");
        }
      }

      // ========================================
      // LISTEN EVENTS
      // ========================================
      api.listenMqtt((err, event) => {
        if (err) {
          console.error("❌ Listen Error:", err);
          return;
        }

        // ======================================
        // NEW MEMBER / BOT ADDED
        // ======================================
        if (event.logMessageType === "log:subscribe") {
          const threadID = event.threadID;

          const participants =
            event.logMessageData &&
            event.logMessageData.addedParticipants;

          if (!participants) return;

          const botWasAdded = participants.some(
            user =>
              String(user.userFbId) === String(botID)
          );

          if (botWasAdded) {
            return api.sendMessage(
              `🤖 Hello everyone!

আমি ${BOT_NAME} 🫡

আমাকে এই group-এ add করার জন্য ধন্যবাদ ❤️

━━━━━━━━━━━━━━━━
⚙️ Prefix: ${PREFIX}
📚 Help: ${PREFIX}help
🏓 Ping: ${PREFIX}ping
🆔 UID: ${PREFIX}uid
ℹ️ Info: ${PREFIX}info
━━━━━━━━━━━━━━━━

👤 Created by ${AUTHOR_NAME}`,
              threadID
            );
          }

          const names = participants
            .filter(
              user =>
                String(user.userFbId) !== String(botID)
            )
            .map(user => user.fullName)
            .filter(Boolean);

          if (names.length) {
            return api.sendMessage(
              `🎉 Welcome ${names.join(", ")}!

🤖 Welcome to the group!

⚙️ Type ${PREFIX}help to see my commands.`,
              threadID
            );
          }
        }

        // ======================================
        // MEMBER LEFT
        // ======================================
        if (event.logMessageType === "log:unsubscribe") {
          const threadID = event.threadID;

          const leftID =
            event.logMessageData &&
            event.logMessageData.leftParticipantFbId;

          if (!leftID) return;

          if (String(leftID) === String(botID)) {
            console.log(
              `❌ Bot removed from group: ${threadID}`
            );
            return;
          }

          return api.sendMessage(
            `👋 Goodbye!

A member has left the group.

🆔 UID: ${leftID}

Take care! ❤️`,
            threadID
          );
        }

        // ======================================
        // NORMAL MESSAGE
        // ======================================
        if (event.type !== "message") return;
        if (!event.body) return;

        const body = event.body.trim();
        const lower = body.toLowerCase();

        const threadID = event.threadID;
        const senderID = event.senderID;

        console.log(`📩 ${senderID}: ${body}`);

        // ======================================
        // BOT
        // ======================================
        if (lower === "bot") {
          return api.sendMessage(
            getRandomReply(),
            threadID
          );
        }

        // ======================================
        // PREFIX
        // ======================================
        if (lower === "prefix") {
          return api.sendMessage(
            `⚙️ My prefix is: ${PREFIX}`,
            threadID
          );
        }

        // ======================================
        // PING
        // ======================================
        if (lower === `${PREFIX}ping`) {
          const start = Date.now();

          return api.sendMessage(
            `🏓 Pong!

🤖 ${BOT_NAME}
⚡ Response: ${Date.now() - start}ms
🟢 Status: Online`,
            threadID
          );
        }

        // ======================================
        // HELP
        // ======================================
        if (lower === `${PREFIX}help`) {
          return api.sendMessage(
            `📚 ${BOT_NAME} — HELP

━━━━━━━━━━━━━━━━━━━━
🤖 GENERAL
━━━━━━━━━━━━━━━━━━━━

${PREFIX}ping
${PREFIX}help
${PREFIX}uid
${PREFIX}uptime
${PREFIX}info

━━━━━━━━━━━━━━━━━━━━
👑 ADMIN
━━━━━━━━━━━━━━━━━━━━

${PREFIX}admin

━━━━━━━━━━━━━━━━━━━━
💬 OTHER
━━━━━━━━━━━━━━━━━━━━

${PREFIX}say <text>

━━━━━━━━━━━━━━━━━━━━
⚡ EXTRA
━━━━━━━━━━━━━━━━━━━━

bot
prefix

━━━━━━━━━━━━━━━━━━━━
👤 Author: ${AUTHOR_NAME}`,
            threadID
          );
        }

        // ======================================
        // UID
        // ======================================
        if (lower === `${PREFIX}uid`) {
          return api.sendMessage(
            `🆔 YOUR UID

${senderID}`,
            threadID
          );
        }

        // ======================================
        // ADMIN
        // ======================================
        if (lower === `${PREFIX}admin`) {
          if (!ADMINS.length) {
            return api.sendMessage(
              "❌ No admin configured.",
              threadID
            );
          }

          const list = ADMINS
            .map((id, i) => `${i + 1}. ${id}`)
            .join("\n");

          return api.sendMessage(
            `👑 ${BOT_NAME} — ADMIN LIST

━━━━━━━━━━━━━━━━
${list}
━━━━━━━━━━━━━━━━

Total Admin: ${ADMINS.length}`,
            threadID
          );
        }

        // ======================================
        // UPTIME
        // ======================================
        if (lower === `${PREFIX}uptime`) {
          return api.sendMessage(
            `⏱️ BOT UPTIME

🤖 Bot: ${BOT_NAME}
⏳ Uptime: ${formatUptime(
              Date.now() - startTime
            )}
🟢 Status: Online`,
            threadID
          );
        }

        // ======================================
        // INFO
        // ======================================
        if (lower === `${PREFIX}info`) {
          return api.sendMessage(
            `🤖 ${BOT_NAME}

━━━━━━━━━━━━━━━━━━━━
📌 BOT INFORMATION
━━━━━━━━━━━━━━━━━━━━

🤖 Name: ${BOT_NAME}
📦 Version: 1.0.0
⚙️ Prefix: ${PREFIX}
👑 Admins: ${ADMINS.length}
🕐 Timezone: ${TIMEZONE}
🌐 Port: ${PORT}

👤 Author: ${AUTHOR_NAME}
📧 Email: ${AUTHOR_EMAIL || "Not set"}
🔗 Facebook: ${AUTHOR_FB || "Not set"}

⏱️ Uptime:
${formatUptime(Date.now() - startTime)}

━━━━━━━━━━━━━━━━━━━━`,
            threadID
          );
        }

        // ======================================
        // SAY
        // ======================================
        if (lower.startsWith(`${PREFIX}say `)) {
          const text = body
            .slice(`${PREFIX}say `.length)
            .trim();

          if (!text) {
            return api.sendMessage(
              `❌ Usage: ${PREFIX}say <text>`,
              threadID
            );
          }

          return api.sendMessage(text, threadID);
        }

        // ======================================
        // HELLO
        // ======================================
        if (
          lower === "hi" ||
          lower === "hello" ||
          lower === "hey"
        ) {
          return api.sendMessage(
            `👋 Hello!

🤖 ${BOT_NAME}

Type ${PREFIX}help to see all commands.`,
            threadID
          );
        }
      });
    }
  );
}

// ==========================================
// RUN BOT
// ==========================================
startBot();
