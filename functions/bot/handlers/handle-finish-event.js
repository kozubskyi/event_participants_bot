const { getName, checkEventExistence } = require('../helpers/helpers')
const { deleteEvent } = require('../services/events-api')
const deleteMessage = require('../helpers/delete-message')
const handleError = require('./handle-error')

module.exports = async function handleFinishEvent(ctx) {
	try {
		const event = await checkEventExistence(ctx)
		if (!event) return

		const name = getName(ctx.from)

		if (ctx.from.id !== event.creator.chatId) {
			const { username } = event.creator

			await ctx.replyWithHTML(
				`<b>${name}</b>, завершувати подію може тільки той, хто її створив.${
					username ? ` В даному випадку це @${username}.` : ''
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
