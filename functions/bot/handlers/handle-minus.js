const {
	checkEventExistence,
	checkRegistrationTime,
	getName,
	prepareParticipants,
	sendReply,
} = require('../helpers/helpers')
const { updateEvent } = require('../services/events-api')
const deleteMessage = require('../helpers/delete-message')
const { MINUS, MINUS_FRIEND } = require('../helpers/constants')
const handleError = require('./handle-error')

module.exports = async function handleMinus(ctx) {
	try {
		await deleteMessage(ctx)

		const event = await checkEventExistence(ctx)
		if (!event) return
		if (!(await checkRegistrationTime(ctx, event))) return await sendReply(ctx, event)

		const { title, start, chatId, participantsMax, participants, reserveDeadline } = event
		const userName = getName(ctx.from)
		const { id, username, first_name, last_name } = ctx.from

		const currentParticipant = { name: userName, chatId: id, username, first_name, last_name, decision: '–' }

		const { data } = ctx.callbackQuery

		if (data === MINUS) {
			const index = participants.findIndex(({ name, chatId }) => name === userName && chatId === id)
			const existing = participants[index]

			if (existing?.decision === '+' || existing?.decision === '±') {
				participants.splice(index, 1)
			} else if (existing?.decision === '–') {
				// await ctx.replyWithHTML(`<b>${userName}</b>, ви вже є в списку.`)
				await sendReply(ctx, event)
				return
			}
			participants.push(currentParticipant)
		}
		if (data === MINUS_FRIEND) {
			const index = [...participants].findLastIndex(
				({ chatId, name }) => chatId === ctx.from.id && name.includes(`${userName} +`)
			)

			if (index < 0) return await sendReply(ctx, event)

			participants.splice(index, 1)
		}

		const updatedEvent = await updateEvent({ chatId, title, start }, { participants })

		await sendReply(ctx, updatedEvent)
	} catch (err) {
		await handleError({ ctx, err })
	}
}
