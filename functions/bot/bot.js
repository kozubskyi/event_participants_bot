require('dotenv').config()
const { Telegraf, Markup } = require('telegraf')
const handlers = require('./handlers')
const constants = require('./helpers/constants')
const sendInfoMessageToCreator = require('./helpers/send-info-message-to-creator')
const handleError = require('./handlers/handle-error')
const { createEvent } = require('./services/events-api')

const bot = new Telegraf(process.env.BOT_TOKEN)

function run() {
	bot.command('test', async ctx => await ctx.reply('Бот працює'))

	bot.on('text', async ctx => await handlers.handleText(ctx))

	bot.action(constants.PLUS, async ctx => await handlers.handlePlus(ctx))
	bot.action(constants.PLUS_MINUS, async ctx => await handlers.handlePlusMinus(ctx))
	bot.action(constants.MINUS, async ctx => await handlers.handleMinus(ctx))

	bot.action(constants.PLUS_FRIEND, async ctx => await handlers.handlePlus(ctx))
	bot.action(constants.PLUS_MINUS_FRIEND, async ctx => await handlers.handlePlusMinus(ctx))
	bot.action(constants.MINUS_FRIEND, async ctx => await handlers.handleMinus(ctx))

	console.log('✅ The bot is configured and must work correctly')
}

run()

bot.launch()
