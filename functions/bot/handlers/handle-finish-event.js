const { getEvent, deleteEvent } = require('../services/events-api')
const getName = require('../helpers/get-name')
const deleteMessage = require('../helpers/delete-message')
const { CREATOR_USERNAME } = require('../helpers/constants')
const handleError = require('./handle-error')

module.exports = async function handleFinishEvent(ctx) {
	try {
		const { message, data } = ctx.callbackQuery

		const splitted = message.text.split('\n')

		const title = splitted[0]
		const start = splitted.find(el => el.includes('Початок:')).replace('Початок: ', '')

		const credentials = {
			chatId: ctx.chat.id,
			title,
			start,
		}

		const event = await getEvent(credentials)

		const userName = getName(ctx)

		if (!event) {
			await deleteMessage(ctx)
			await ctx.replyWithHTML(`<b>${userName}</b>, подія "${title}" вже не актуальна.`)
			return
		}

		if (ctx.from.username !== event.creatorUsername) {
			await ctx.replyWithHTML(
				`<b>${userName}</b>, завершувати подію може тільки той, хто її створив. В даному випадку це @${event.creatorUsername}.`
			)
			return
		}

		await deleteEvent(credentials)
		await deleteMessage(ctx)
	} catch (err) {
		await handleError({ ctx, err })
	}
}
