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
		const event = await checkEventExistence(ctx)
		if (!event) return
		if (!(await checkRegistrationTime(ctx, event))) return

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
				return
			}
			participants.push(currentParticipant)
		}
		if (data === MINUS_FRIEND) {
			const index = [...participants].findLastIndex(
				({ chatId, name }) => chatId === ctx.from.id && name.includes(`${userName} +`)
			)

			if (index < 0) return

			participants.splice(index, 1)
		}

		const updatedEvent = await updateEvent({ chatId, title, start }, { participants })

		await deleteMessage(ctx)

		// let top = []
		// let reserve = []
		// let refused = []

		// if (checkReserveDeadline(reserveDeadline)) {
		// 	top = participants.filter(({ decision }) => decision === '+').map(({ name }, i) => `${i + 1}. ${name}`)

		// 	let reservePlus = []
		// 	if (top.length > participantsMax) {
		// 		reservePlus = top.splice(participantsMax || top.length)
		// 	} else {
		// 		for (let i = top.length; i < participantsMax; i++) {
		// 			top.push(`${i + 1}.`)
		// 		}
		// 	}

		// 	reserve = [
		// 		...reservePlus,
		// 		...participants
		// 			.filter(({ decision }) => decision === '±')
		// 			.map(({ name }, i) => `${top.length + reservePlus.length + i + 1}. ${name} ±`),
		// 	]
		// } else {
		// 	const notMinusParticipants = participants
		// 		.filter(({ decision }) => decision !== '–')
		// 		.map(({ name, decision }, i) => `${i + 1}. ${name} ${decision === '±' ? '±' : ''}`)

		// 	top = notMinusParticipants.slice(0, participantsMax || notMinusParticipants.length)
		// 	for (let i = top.length; i < participantsMax; i++) {
		// 		top.push(`${i + 1}.`)
		// 	}

		// 	reserve = notMinusParticipants.slice(participantsMax || notMinusParticipants.length)
		// }

		// refused = participants
		// 	.filter(({ decision }) => decision === '–')
		// 	.map((participant, i) => {
		// 		// if (data === MINUS && JSON.stringify(currentParticipant) === JSON.stringify(participant)) {
		// 		// 	return `<b>${participant.name} –</b>`
		// 		// } else {
		// 		return `${participant.name} –`
		// 		// }
		// 	})

		const { top, reserve, refused } = prepareParticipants(updatedEvent, ctx)

		await sendReply(ctx, updatedEvent, { top, reserve, refused })
	} catch (err) {
		await handleError({ ctx, err })
	}
}
