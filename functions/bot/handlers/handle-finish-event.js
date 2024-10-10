const { getEvent, deleteEvent } = require('../services/events-api')
const getFullName = require('../helpers/get-full-name')
const deleteMessage = require('../helpers/delete-message')
const { CREATOR_USERNAME } = require('../helpers/constants')
// const handleError = require('./handle-error')

module.exports = async function handleFinishEvent(ctx) {
	try {
		const splitted = ctx.callbackQuery.message.text.split('\n')

		const title = splitted[0]

		const query = {
			chatId: ctx.chat.id,
			title,
			start: splitted[1].replace('Початок: ', ''),
		}

		const event = await getEvent(query)

		const fullName = getFullName(ctx)

		if (!event) {
			await deleteMessage(ctx)
			// await ctx.replyWithHTML(`<b>${fullName}</b>, подія "${title}" вже не актуальна.`)
			return
		}

		// if (ctx.from.username !== event.creatorUsername /*&& ctx.from.username !== CREATOR_USERNAME*/) {
		if (ctx.from.username !== event.creatorUsername) {
			await ctx.replyWithHTML(
				`<b>${fullName}</b>, завершувати подію може тільки той, хто її створив. В даному випадку це @${event.creatorUsername}.`
			)
			return
		}

		await deleteEvent(query)
		await deleteMessage(ctx)
	} catch (err) {
		console.log({ err })
	}
}
