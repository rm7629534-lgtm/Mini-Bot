module.exports = {
  config: {
    name: "help",
    aliases: ["menu", "commands", "cmds", "হেল্প"],
    version: "1.0.0",
    author: "AminulSardar",
    role: 0,
    shortDescription: "Display available commands",
    longDescription: "Shows a list of all loaded commands categorized with usage instructions.",
    category: "system",
    guide: "{p}help [command_name]"
  },
  onStart: async function ({ api, event, args, prefix, commands, aliases, botName, authorName }) {
    const threadID = event.threadID;
    const messageID = event.messageID;

    if (args && args.length > 0) {
      const inputName = args[0].toLowerCase();
      const resolvedName = (aliases && aliases.get(inputName)) || inputName;
      const cmd = commands.get(resolvedName);
      if (!cmd) {
        return api.sendMessage(`Command "${inputName}" does not exist, type ${prefix}help to see all available commands`, threadID, messageID);
      }
      const c = cmd.config || {};
      const aliasText = Array.isArray(c.aliases) && c.aliases.length > 0 ? c.aliases.join(", ") : "None";
      const msg = `📖 COMMAND DETAILS: ${c.name || resolvedName}
━━━━━━━━━━━━━━━━━━━━
📌 Description: ${c.longDescription || c.shortDescription || "No description provided."}
📁 Category: ${c.category || "general"}
👑 Permission: ${c.role === 1 ? "Admin Only" : c.role === 2 ? "Owner Only" : "Everyone"}
🏷️ Aliases: ${aliasText}
⚙️ Usage: ${(c.guide || `${prefix}${c.name}`).replace(/{p}/g, prefix)}
👤 Author: ${c.author || authorName || "AminulSardar"}
━━━━━━━━━━━━━━━━━━━━`;
      return api.sendMessage(msg, threadID, messageID);
    }

    // Group commands by category
    const categories = {};
    for (const [name, cmd] of commands.entries()) {
      const cat = (cmd.config && cmd.config.category) || "general";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(name);
    }

    let helpMsg = `📚 ${botName || "Mini-Bot"} — COMMAND MENU\n━━━━━━━━━━━━━━━━━━━━\n`;
    for (const [cat, list] of Object.entries(categories)) {
      helpMsg += `\n📁 [ ${cat.toUpperCase()} ] (${list.length})\n`;
      helpMsg += list.map(c => `  ▫️ ${prefix}${c}`).join("\n") + "\n";
    }

    helpMsg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    helpMsg += `💡 Type "${prefix}help <command>" for specific details.\n`;
    helpMsg += `⚙️ Current Prefix: ${prefix}\n`;
    helpMsg += `👤 Created by: ${authorName || "AminulSardar"}`;

    return api.sendMessage(helpMsg, threadID, messageID);
  },
  run: async function (params) {
    return module.exports.onStart(params);
  }
};
