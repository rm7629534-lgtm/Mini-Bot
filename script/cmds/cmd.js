const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// Helper to download code from URL (github raw, pastebin, hastebin, etc.)
function fetchCodeFromUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchCodeFromUrl(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: Failed to fetch file`));
      }
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", (err) => reject(err));
  });
}

module.exports = {
  config: {
    name: "cmd",
    version: "2.0.0",
    author: "AminulSardar",
    role: 1, // Admin only
    shortDescription: "Manage command scripts (install, load, unload, loadall)",
    longDescription: "Dynamically install new command scripts, hot-reload, unload from memory, or load all scripts on the fly.",
    category: "admin",
    guide: "{p}cmd install <name.js> <url / code>\n{p}cmd load <command_name>\n{p}cmd unload <command_name>\n{p}cmd loadall"
  },

  onStart: async function ({ api, event, args, prefix, commands, loadCommands, config }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const senderID = String(event.senderID);
    const admins = config.adminBot || [];

    // Admin permission validation
    if (admins.length > 0 && !admins.includes(senderID)) {
      return api.sendMessage("❌ Permission Denied! Command management is restricted to bot administrators.", threadID, messageID);
    }

    if (!args || args.length === 0) {
      return api.sendMessage(
        `🛠️ COMMAND SCRIPT CONTROLLER
━━━━━━━━━━━━━━━━━━━━
▫️ ${prefix}cmd install <filename.js> <url/code>
▫️ ${prefix}cmd load <cmd_name>
▫️ ${prefix}cmd unload <cmd_name>
▫️ ${prefix}cmd loadall
━━━━━━━━━━━━━━━━━━━━
💡 Current loaded commands: ${commands.size}`,
        threadID,
        messageID
      );
    }

    const action = args[0].toLowerCase();
    const cmdsDir = path.join(process.cwd(), "script", "cmds");

    if (!fs.existsSync(cmdsDir)) {
      fs.mkdirSync(cmdsDir, { recursive: true });
    }

    // ==========================================
    // 1. ACTION: LOAD ALL (loadall)
    // ==========================================
    if (action === "loadall" || action === "reloadall") {
      try {
        let loadedCount = 0;
        const files = fs.readdirSync(cmdsDir).filter(f => f.endsWith(".js"));
        
        for (const file of files) {
          try {
            const filePath = path.join(cmdsDir, file);
            delete require.cache[require.resolve(filePath)];
            const cmd = require(filePath);
            const name = (cmd.config && cmd.config.name) || file.replace(/\.js$/, "");
            commands.set(name.toLowerCase(), {
              ...cmd,
              fileName: file,
              config: {
                name,
                category: (cmd.config && cmd.config.category) || "general",
                role: (cmd.config && cmd.config.role) !== undefined ? cmd.config.role : 0,
                shortDescription: (cmd.config && (cmd.config.shortDescription || cmd.config.description)) || "",
                longDescription: (cmd.config && cmd.config.longDescription) || "",
                guide: (cmd.config && cmd.config.guide) || `{p}${name}`,
                author: (cmd.config && cmd.config.author) || config.authorName || "AminulSardar"
              }
            });
            loadedCount++;
          } catch (fileErr) {
            console.error(`Failed to load ${file}:`, fileErr);
          }
        }

        return api.sendMessage(
          `🔄 [LOAD ALL SUCCESSFUL]
━━━━━━━━━━━━━━━━━━━━
✅ Successfully hot-reloaded ${loadedCount} command module(s) from /script/cmds/!
📚 Active Commands in Memory: ${commands.size}`,
          threadID,
          messageID
        );
      } catch (err) {
        return api.sendMessage(`❌ Error during loadall: ${err.message}`, threadID, messageID);
      }
    }

    // ==========================================
    // 2. ACTION: LOAD SINGLE COMMAND (load)
    // ==========================================
    if (action === "load" || action === "reload") {
      if (!args[1]) {
        return api.sendMessage(`❌ Usage: ${prefix}cmd load <command_name or filename.js>`, threadID, messageID);
      }

      let targetName = args[1].trim();
      let targetFile = targetName.endsWith(".js") ? targetName : `${targetName}.js`;
      let filePath = path.join(cmdsDir, targetFile);

      // If direct filename doesn't exist, search commands in directory by config name
      if (!fs.existsSync(filePath)) {
        const found = fs.readdirSync(cmdsDir).find(f => {
          if (!f.endsWith(".js")) return false;
          try {
            const temp = require(path.join(cmdsDir, f));
            return (temp.config && temp.config.name && temp.config.name.toLowerCase() === targetName.toLowerCase());
          } catch (e) {
            return false;
          }
        });
        if (found) {
          filePath = path.join(cmdsDir, found);
          targetFile = found;
        } else {
          return api.sendMessage(`❌ File '${targetFile}' not found in /script/cmds/`, threadID, messageID);
        }
      }

      try {
        delete require.cache[require.resolve(filePath)];
        const cmd = require(filePath);
        const name = (cmd.config && cmd.config.name) || targetFile.replace(/\.js$/, "");

        commands.set(name.toLowerCase(), {
          ...cmd,
          fileName: targetFile,
          config: {
            name,
            category: (cmd.config && cmd.config.category) || "general",
            role: (cmd.config && cmd.config.role) !== undefined ? cmd.config.role : 0,
            shortDescription: (cmd.config && (cmd.config.shortDescription || cmd.config.description)) || "",
            longDescription: (cmd.config && cmd.config.longDescription) || "",
            guide: (cmd.config && cmd.config.guide) || `{p}${name}`,
            author: (cmd.config && cmd.config.author) || config.authorName || "AminulSardar"
          }
        });

        return api.sendMessage(
          `✅ Command [${name}] loaded successfully from "${targetFile}"!`,
          threadID,
          messageID
        );
      } catch (err) {
        return api.sendMessage(`❌ Failed to load command '${targetFile}': ${err.message}`, threadID, messageID);
      }
    }

    // ==========================================
    // 3. ACTION: UNLOAD COMMAND (unload)
    // ==========================================
    if (action === "unload" || action === "removemem") {
      if (!args[1]) {
        return api.sendMessage(`❌ Usage: ${prefix}cmd unload <command_name>`, threadID, messageID);
      }

      const target = args[1].toLowerCase().replace(/\.js$/, "");
      if (target === "cmd") {
        return api.sendMessage("⚠️ You cannot unload the core 'cmd' controller!", threadID, messageID);
      }

      if (!commands.has(target)) {
        return api.sendMessage(`❌ Command '${target}' is not currently loaded in memory.`, threadID, messageID);
      }

      const cmdObj = commands.get(target);
      if (cmdObj && cmdObj.fileName) {
        const filePath = path.join(cmdsDir, cmdObj.fileName);
        if (fs.existsSync(filePath)) {
          delete require.cache[require.resolve(filePath)];
        }
      }

      commands.delete(target);
      return api.sendMessage(
        `🗑️ Unloaded command [${target}] from active memory.\nRemaining loaded commands: ${commands.size}`,
        threadID,
        messageID
      );
    }

    // ==========================================
    // 4. ACTION: INSTALL COMMAND (install)
    // ==========================================
    if (action === "install" || action === "add") {
      if (!args[1]) {
        return api.sendMessage(
          `❌ Usage:
▫️ Via URL: ${prefix}cmd install <filename.js> <raw_url>
▫️ Via Code: ${prefix}cmd install <filename.js> <javascript_code>`,
          threadID,
          messageID
        );
      }

      let filename = args[1];
      if (!filename.endsWith(".js")) {
        filename += ".js";
      }

      const rawInput = args.slice(2).join(" ").trim();
      let codeContent = "";

      if (!rawInput) {
        // Check if replied to a code message
        if (event.type === "message_reply" && event.messageReply && event.messageReply.body) {
          codeContent = event.messageReply.body;
        } else {
          return api.sendMessage(
            `❌ Please provide code content, a raw URL, or reply to a message containing the code.`,
            threadID,
            messageID
          );
        }
      } else if (rawInput.startsWith("http://") || rawInput.startsWith("https://")) {
        try {
          await api.sendMessage(`⏳ Fetching code from URL: ${rawInput}...`, threadID);
          codeContent = await fetchCodeFromUrl(rawInput);
        } catch (fetchErr) {
          return api.sendMessage(`❌ Failed to fetch from URL: ${fetchErr.message}`, threadID, messageID);
        }
      } else {
        codeContent = rawInput;
      }

      const filePath = path.join(cmdsDir, filename);

      try {
        fs.writeFileSync(filePath, codeContent, "utf8");

        // Clear require cache & load immediately
        delete require.cache[require.resolve(filePath)];
        const cmd = require(filePath);
        const name = (cmd.config && cmd.config.name) || filename.replace(/\.js$/, "");

        commands.set(name.toLowerCase(), {
          ...cmd,
          fileName: filename,
          config: {
            name,
            category: (cmd.config && cmd.config.category) || "general",
            role: (cmd.config && cmd.config.role) !== undefined ? cmd.config.role : 0,
            shortDescription: (cmd.config && (cmd.config.shortDescription || cmd.config.description)) || "",
            longDescription: (cmd.config && cmd.config.longDescription) || "",
            guide: (cmd.config && cmd.config.guide) || `{p}${name}`,
            author: (cmd.config && cmd.config.author) || config.authorName || "AminulSardar"
          }
        });

        return api.sendMessage(
          `🎉 [INSTALLATION SUCCESSFUL]
━━━━━━━━━━━━━━━━━━━━
📁 Saved File: /script/cmds/${filename}
🤖 Command Name: [${name}]
⚙️ Category: ${(cmd.config && cmd.config.category) || "general"}
👑 Role: ${(cmd.config && cmd.config.role) === 1 ? "Admin" : "All Users"}
━━━━━━━━━━━━━━━━━━━━
💡 Command is now active and ready to use! Type "${prefix}${name}"`,
          threadID,
          messageID
        );
      } catch (saveErr) {
        // If require threw syntax error, remove the broken file to prevent startup crashes
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) {}
        }
        return api.sendMessage(`❌ Syntax / Installation Error: ${saveErr.message}`, threadID, messageID);
      }
    }

    // Fallback unknown subcommand
    return api.sendMessage(
      `❌ Unknown subcommand '${action}'.\nAvailable: ${prefix}cmd install, load, unload, loadall`,
      threadID,
      messageID
    );
  },

  run: async function (params) {
    return module.exports.onStart(params);
  }
};
