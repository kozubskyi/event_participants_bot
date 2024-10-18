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
	bot.command(
		'options',
		async ctx =>
			await ctx.replyWithHTML(`<b>Всі опції CREATE_EVENT:</b>

title: String *
description: String
location: String
start: DD.MM.YYYY, HH:MM *
end: DD.MM.YYYY, HH:MM
registrationStart: DD.MM.YYYY, HH:MM
reserveDeadline: DD.MM.YYYY, HH:MM
registrationEnd: DD.MM.YYYY, HH:MM
participantsMin: Number
participantsMax: Number

* - обов'язкове поле`)
	)
	bot.command(
		'example',
		async ctx =>
			await ctx.replyWithHTML(`
CREATE_EVENT
title: Футбол
description: Формат 5х5, м'яч 4-ка
location: Броварська
start: 10.10.2024, 20:30
end: 10.10.2024, 22:00
registrationStart: 10.10.2024, 09:00
reserveDeadline: 10.10.2024, 16:00
registrationEnd: 10.10.2024, 20:25
participantsMin: 10
participantsMax: 15`)
	)

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
