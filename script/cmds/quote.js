module.exports = {
  config: {
    name: "quote",
    version: "1.0.0",
    author: "AminulSardar",
    role: 0,
    shortDescription: "Get an inspirational quote",
    longDescription: "Sends a random inspirational or motivational quote.",
    category: "fun",
    guide: "{p}quote"
  },
  onStart: async function ({ api, event }) {
    const quotes = [
      { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
      { text: "Code is like humor. When you have to explain it, it’s bad.", author: "Cory House" },
      { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
      { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
      { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
      { text: "Failure is an option here. If things are not failing, you are not innovating enough.", author: "Elon Musk" },
      { text: "Stay hungry, stay foolish.", author: "Steve Jobs" }
    ];

    const random = quotes[Math.floor(Math.random() * quotes.length)];
    const msg = `✨ INSPIRATIONAL QUOTE
━━━━━━━━━━━━━━━━━━━━
"${random.text}"

— ${random.author}
━━━━━━━━━━━━━━━━━━━━`;

    return api.sendMessage(msg, event.threadID, event.messageID);
  },
  run: async function (params) {
    return module.exports.onStart(params);
  }
};
