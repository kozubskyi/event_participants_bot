const { getEvent, updateEvent } = require('../services/events-api')
const getFullName = require('../helpers/get-full-name')
const deleteMessage = require('../helpers/delete-message')
const checkReserveDeadline = require('../helpers/check-reserve-deadline')
const { CREATOR_USERNAME } = require('../helpers/constants')
const sendReply = require('../helpers/send-reply')
const handleError = require('./handle-error')

module.exports = async function handleUpdate(ctx) {
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

		await deleteMessage(ctx)

		if (!event) return await ctx.replyWithHTML(`<b>${fullName}</b>, подія "${title}" вже не актуальна.`)

		let { reserveDeadline, participantsMax, participants } = event

		let top = []
		let reserve = []
		let refused = []

		if (checkReserveDeadline(reserveDeadline)) {
			top = participants
				.filter(participant => participant.decision === '+')
				.map((participant, i) => `${i + 1}. ${participant.name}`)

			let reservePlus = []
			if (top.length > participantsMax) {
				reservePlus = top.splice(participantsMax ?? top.length)
			} else {
				for (let i = top.length; i < participantsMax; i++) {
					top.push(`${i + 1}.`)
				}
			}

			reserve = [
				...reservePlus,
				...participants
					.filter(participant => participant.decision === '±')
					.map(({ name }, i) => `${top.length + reservePlus.length + i + 1}. ${name} ±`),
			]
		} else {
			const notMinusParticipants = participants
				.filter(participant => participant.decision !== '–')
				.map(({ name, decision }, i) => `${i + 1}. ${name} ${decision === '±' ? '±' : ''}`)

			top = notMinusParticipants.slice(0, participantsMax ?? notMinusParticipants.length)
			for (let i = top.length; i < participantsMax; i++) {
				top.push(`${i + 1}.`)
			}
			reserve = notMinusParticipants.slice(participantsMax ?? notMinusParticipants.length)
		}

		refused = participants.filter(participant => participant.decision === '–').map(({ name }) => `${name} –`)

		await sendReply(ctx, event, { top, reserve, refused })
	} catch (err) {
		await handleError({ ctx, err })
	}
}
