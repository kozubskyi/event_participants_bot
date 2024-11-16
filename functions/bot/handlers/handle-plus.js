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
		const event = await checkEventExistence(ctx)
		if (!event) return
		if (!(await checkRegistrationTime(ctx, event))) return

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

		await deleteMessage(ctx)

		// let top = []
		// let reserve = []
		// let refused = []

		// if (checkReserveDeadline(reserveDeadline)) {
		// 	top = participants
		// 		.filter(({ decision }) => decision === '+')
		// 		.map((participant, i) => {
		// 			// if (
		// 			// 	(data === PLUS && JSON.stringify(currentParticipant) === JSON.stringify(participant)) ||
		// 			// 	(data === PLUS_FRIEND && JSON.stringify(currentAddingFriend) === JSON.stringify(participant))
		// 			// ) {
		// 			// 	return `${i + 1}. <b>${participant.name}</b>`
		// 			// } else {
		// 			return `${i + 1}. ${participant.name}`
		// 			// }
		// 		})

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
		// 		.map((participant, i) => {
		// 			// if (
		// 			// 	(data === PLUS && JSON.stringify(currentParticipant) === JSON.stringify(participant)) ||
		// 			// 	(data === PLUS_FRIEND && JSON.stringify(currentAddingFriend) === JSON.stringify(participant))
		// 			// ) {
		// 			// 	return `${i + 1}. <b>${participant.name}</b>`
		// 			// } else {
		// 			return `${i + 1}. ${participant.name} ${participant.decision === '±' ? '±' : ''}`
		// 			// }
		// 		})

		// 	top = notMinusParticipants.slice(0, participantsMax || notMinusParticipants.length)
		// 	for (let i = top.length; i < participantsMax; i++) {
		// 		top.push(`${i + 1}.`)
		// 	}
		// 	reserve = notMinusParticipants.slice(participantsMax || notMinusParticipants.length)
		// }

		// refused = participants.filter(({ decision }) => decision === '–').map(({ name }) => `${name} –`)

		const { top, reserve, refused } = prepareParticipants(updatedEvent, ctx)

		await sendReply(ctx, updatedEvent, { top, reserve, refused })
	} catch (err) {
		await handleError({ ctx, err })
	}
}
