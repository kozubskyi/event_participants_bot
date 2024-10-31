const checkEventExistence = require('../helpers/check-event-existence')
const { deleteEvent } = require('../services/events-api')
const getName = require('../helpers/get-name')
const deleteMessage = require('../helpers/delete-message')
const { CREATOR_USERNAME } = require('../helpers/constants')
const handleError = require('./handle-error')

module.exports = async function handleFinishEvent(ctx) {
	try {
		const event = await checkEventExistence(ctx)
		if (!event) return

		const name = getName(ctx)

		if (ctx.from.username !== event.creatorUsername) {
			await ctx.replyWithHTML(
				`<b>${name}</b>, завершувати подію може тільки той, хто її створив.${
					event.creatorUsername ? ` В даному випадку це @${event.creatorUsername}.` : ''
				}`
			)
			return
		}

		const { chatId, title, start } = event

		const deletedEvent = await deleteEvent({ chatId, title, start })

		await deleteMessage(ctx)

		if (deletedEvent) await ctx.replyWithHTML(`Подія <b>${title}</b> успішно видалена.`)
	} catch (err) {
		await handleError({ ctx, err })
	}
}
