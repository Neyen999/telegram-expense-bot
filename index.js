const TelegramBot = require('node-telegram-bot-api');
const Database = require('better-sqlite3');
const natural = require('natural');
const speech = require('@google-cloud/speech');
const { processMessage } = require('./src/natural_processing')

// const commands = ["START", "SAVE_EXPENSE", "CONSULT_EXPENSE", "ADD_INITIAL_BALANCE"];

// Configuración del bot
const TOKEN = '7467651942:AAG2O5Z383NCDxQVc3XlWGn88eBdzXq4TA8';
const bot = new TelegramBot(TOKEN, {polling: true});

// Conexión a la base de datos
const db = new Database('expenses.db');

// Crear tabla si no existe
db.exec(`CREATE TABLE IF NOT EXISTS transactions
         (chat_id INTEGER, date TEXT, type TEXT, amount REAL, description TEXT)`);

// Función para guardar transacción
function saveTransaction(chatId, amount, type, description) {
    const stmt = db.prepare('INSERT INTO transactions (chat_id, date, type, amount, description) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(chatId, new Date().toISOString(), type, amount, description);
    return info.changes > 0;
}

// Manejador de mensajes de texto
bot.on('text', (msg) => {
  if (!hasInteracted(msg.chat.id)) {
    bot.sendMessage(msg.chat.id, 
        "¡Bienvenido a NeyExpensesTracker! 🎉\n\n" +
        "Este es tu primer mensaje. Aquí tienes una guía rápida:\n\n" +
        "1️⃣ Registrar gastos e ingresos:\n" +
        "   Simplemente escribe, por ejemplo:\n" +
        "   'Gasté 20 en comida' o 'Ingresé 100 de salario'\n\n" +
        "2️⃣ Comandos disponibles:\n" +
        "   /gastos - Ver lista de tus gastos\n" +
        "   /balance - Consultar tu balance actual\n\n" +
        "   /ayuda - Ayuda\n\n" +
        "¡Empieza a registrar tus finanzas ahora! 💰"
    );
}
    if (msg.text.startsWith('/')) return; // Ignorar comandos

    const { amount, type, description } = processMessage(msg.text);

    console.log("VALORESSS");
    console.log(amount + ' ' + type + ' ' + description)
    if (amount && type) {
        saveTransaction(msg.chat.id, amount, type, description);
        bot.sendMessage(msg.chat.id, `Registrado: ${type} de ${amount} para ${description}`);
    } else {
        bot.sendMessage(msg.chat.id, "No pude entender completamente tu mensaje. Por favor, intenta de nuevo.");
    }
});

// Manejador de mensajes de voz
bot.on('voice', (msg) => {
    bot.sendMessage(msg.chat.id, "Procesamiento de voz aún no implementado.");
});

// Manejador de comando /balance
bot.onText(/\/balance/, (msg) => {
    const balance = calculateBalance(msg.chat.id);
    bot.sendMessage(msg.chat.id, `Tu balance actual es: ${balance}`);
});

// Nuevo manejador de comando /gastos
bot.onText(/\/gastos/, (msg) => {
    const expenses = getExpenses(msg.chat.id);
    if (expenses.length === 0) {
        bot.sendMessage(msg.chat.id, "No tienes gastos registrados.");
    } else {
        let message = "Tus gastos registrados son:\n\n";
        expenses.forEach((expense, index) => {
            message += `${index + 1}. ${expense.amount} - ${expense.description} (${expense.date})\n`;
        });
        bot.sendMessage(msg.chat.id, message);
    }
});

bot.onText(/\/(ayuda)/, (msg) => {
  bot.sendMessage(msg.chat.id, 
      "Guía de NeyExpensesTracker 📚\n\n" +
      "Registrar transacciones:\n" +
      "Escribe naturalmente, por ejemplo:\n" +
      "'Gasté 20 en comida' o 'Ingresé 100 de salario'\n\n" +
      "Comandos disponibles:\n" +
      "/gastos - Ver lista de tus gastos\n" +
      "/balance - Consultar tu balance actual\n" +
      "/ayuda - Mostrar este mensaje de ayuda\n\n" +
      "¿Necesitas más ayuda? ¡No dudes en preguntar!"
  );
});

function calculateBalance(chatId) {
    const stmt = db.prepare(`
        SELECT 
            SUM(CASE WHEN type = 'ingreso' THEN amount ELSE -amount END) as balance
        FROM transactions
        WHERE chat_id = ?
    `);
    const result = stmt.get(chatId);
    return result.balance || 0;
}

function getExpenses(chatId) {
    const stmt = db.prepare(`
        SELECT date, amount, description
        FROM transactions
        WHERE chat_id = ? AND type = 'gasto'
        ORDER BY date DESC
    `);
    return stmt.all(chatId);
}

function hasInteracted(chatId) {
  try {
      const stmt = db.prepare(`
          SELECT COUNT(*) as count
          FROM transactions
          WHERE chat_id = ?
      `);
      const result = stmt.get(chatId);
      return result.count > 0;
  } catch (error) {
      console.error('Error checking interaction:', error.message);
      return false; // Asumimos que no ha interactuado si hay un error
  }
}

console.log('Bot is running...');