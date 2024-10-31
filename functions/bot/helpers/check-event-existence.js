const { getEvent } = require('../services/events-api')
const getName = require('./get-name')
const deleteMessage = require('./delete-message')

module.exports = async function checkEventExistence(ctx) {
	const splitted = ctx.callbackQuery.message.text.split('\n')
	const title = splitted[0]

	const event = await getEvent({
		chatId: ctx.chat.id,
		title,
		start: splitted.find(el => el.includes('Початок:')).replace('Початок: ', ''),
	})

	if (!event) {
		await deleteMessage(ctx)
		await ctx.replyWithHTML(`<b>${getName(ctx)}</b>, подія "${title}" вже не актуальна.`)
		return false
	}

	return event
}
