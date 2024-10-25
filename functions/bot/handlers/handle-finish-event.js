const { getEvent, deleteEvent } = require('../services/events-api')
const getFullName = require('../helpers/get-full-name')
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

		const fullName = getFullName(ctx)

		if (!event) {
			await deleteMessage(ctx)
			await ctx.replyWithHTML(`<b>${fullName}</b>, подія "${title}" вже не актуальна.`)
			return
		}

		if (ctx.from.username !== event.creatorUsername) {
			await ctx.replyWithHTML(
				`<b>${fullName}</b>, завершувати подію може тільки той, хто її створив. В даному випадку це @${event.creatorUsername}.`
			)
			return
		}

		await deleteEvent(credentials)
		await deleteMessage(ctx)
	} catch (err) {
		await handleError({ ctx, err })
	}
}
