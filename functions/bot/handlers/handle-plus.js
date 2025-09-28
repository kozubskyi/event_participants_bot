const {
	checkEventExistence,
	checkRegistrationTime,
	getName,
	checkReserveDeadline,
	addFriend,
	prepareParticipants,
	sendReply,
} = require('../helpers/helpers')
const { PLUS, PLUS_FRIEND } = require('../helpers/constants')
const { updateEvent } = require('../services/events-api')
const deleteMessage = require('../helpers/delete-message')
const handleError = require('./handle-error')

module.exports = async function handlePlus(ctx) {
	try {
		await deleteMessage(ctx)

		const event = await checkEventExistence(ctx)
		if (!event) return
		if (!(await checkRegistrationTime(ctx, event))) return await sendReply(ctx, event)

		let { title, start, chatId, participantsMax, participants, reserveDeadline } = event
		const userName = getName(ctx.from)
		const { id, username, first_name, last_name } = ctx.from

		const currentParticipant = { name: userName, chatId: id, username, first_name, last_name, decision: '+' }

		const { data } = ctx.callbackQuery

		if (data === PLUS) {
			const index = participants.findIndex(({ name, chatId }) => name === userName && chatId === id)
			const existing = participants[index]

			if (checkReserveDeadline(reserveDeadline)) {
				if (existing && existing.decision === '+') {
					// await ctx.replyWithHTML(`<b>${userName}</b>, ви вже є в списку.`)
					await sendReply(ctx, event)
					return
				} else if (existing && existing.decision !== '+') {
					participants.splice(index, 1)
					participants.push(currentParticipant)
				} else {
					participants.push(currentParticipant)
				}
			} else {
				if (existing?.decision === '+') {
					// await ctx.replyWithHTML(`<b>${userName}</b>, ви вже є в списку.`)
					await sendReply(ctx, event)
					return
				} else if (existing?.decision === '±') {
					participants[index].decision = '+'
				} else if (existing?.decision === '–') {
					participants.splice(index, 1)
					participants.push(currentParticipant)
				} else {
					participants.push(currentParticipant)
				}
			}
		}
		if (data === PLUS_FRIEND) {
			participants = addFriend(ctx, participants)
		}

		const updatedEvent = await updateEvent({ chatId, title, start }, { participants })

		await sendReply(ctx, updatedEvent)
	} catch (err) {
		await handleError({ ctx, err })
	}
}
