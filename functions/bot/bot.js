require('dotenv').config()
const { Telegraf } = require('telegraf')
const handlers = require('./handlers')
const constants = require('./helpers/constants')

const bot = new Telegraf(process.env.BOT_TOKEN)

function run() {
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

<i>Дату та час вказувати в Київському часовому поясі!
* - обов'язкове поле</i>`)
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
	bot.command('events', async ctx => await handlers.handleEvents(ctx))
	bot.command('test', async ctx => await ctx.reply('Бот працює'))

	bot.on('text', async ctx => await handlers.handleText(ctx))

	bot.action(constants.PLUS, async ctx => await handlers.handlePlus(ctx))
	bot.action(constants.PLUS_MINUS, async ctx => await handlers.handlePlusMinus(ctx))
	bot.action(constants.MINUS, async ctx => await handlers.handleMinus(ctx))

	bot.action(constants.PLUS_FRIEND, async ctx => await handlers.handlePlus(ctx))
	bot.action(constants.PLUS_MINUS_FRIEND, async ctx => await handlers.handlePlusMinus(ctx))
	bot.action(constants.MINUS_FRIEND, async ctx => await handlers.handleMinus(ctx))

	bot.action(constants.UPDATE, async ctx => await handlers.handleUpdate(ctx))
	// bot.action(constants.SETTINGS, async ctx => await handlers.handleFinishEvent(ctx))
	bot.action(constants.FINISH_EVENT, async ctx => await handlers.handleFinishEvent(ctx))

	console.log('✅ The bot is configured and must work correctly')
}

run()

// bot.launch()

// Enable graceful stop
// process.once('SIGINT', () => bot.stop('SIGINT'))
// process.once('SIGTERM', () => bot.stop('SIGTERM'))

// AWS event handler syntax (https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html)
exports.handler = async event => {
	try {
		await bot.handleUpdate(JSON.parse(event.body))
		return { statusCode: 200, body: '' }
	} catch (e) {
		console.error('error in handler:', e)
		return { statusCode: 400, body: 'This endpoint is meant for bot and telegram communication' }
	}
}
