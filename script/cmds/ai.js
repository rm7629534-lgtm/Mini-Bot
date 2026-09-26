module.exports = {
  config: {
    name: "ai",
    aliases: ["ask", "gpt", "gemini", "botai"],
    version: "1.0.0",
    author: "AminulSardar",
    role: 0,
    shortDescription: "Chat with AI assistant",
    longDescription: "Sends questions to the bot AI assistant.",
    category: "ai",
    guide: "{p}ai <prompt/question>"
  },
  onStart: async function ({ api, event, args, prefix, botName }) {
    if (!args || args.length === 0) {
      return api.sendMessage(`🤖 Please enter a query or question!\nExample: ${prefix}ai What is JavaScript?`, event.threadID, event.messageID);
    }

    const query = args.join(" ").toLowerCase();
    const threadID = event.threadID;
    const messageID = event.messageID;

    // Smart conversational replies
    let responseText = "";
    if (query.includes("hello") || query.includes("hi") || query.includes("hey")) {
      responseText = `Hello there! 👋 I am ${botName || "Mini-Bot"}. How can I assist you today?`;
    } else if (query.includes("who created you") || query.includes("developer") || query.includes("author") || query.includes("owner")) {
      responseText = `I was built and customized by Aminul Sardar using Node.js and abir-fca! 💻✨`;
    } else if (query.includes("time") || query.includes("date")) {
      responseText = `Current Server Time: ${new Date().toLocaleString()}`;
    } else if (query.includes("how are you")) {
      responseText = `I'm functioning at 100% capacity and ready to help! How are you doing? 😊`;
    } else {
      responseText = `🤖 [AI Assistant]:
Thank you for your question about "${args.join(" ")}".
As an automated assistant on ${botName || "Mini-Bot"}, I'm running smoothly to execute commands and group interactions. Try "${prefix}help" to explore my full command suite!`;
    }

    return api.sendMessage(responseText, threadID, messageID);
  },
  run: async function (params) {
    return module.exports.onStart(params);
  }
};
