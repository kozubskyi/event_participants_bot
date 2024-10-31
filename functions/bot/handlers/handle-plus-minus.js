const checkEventExistence = require('../helpers/check-event-existence')
const { updateEvent } = require('../services/events-api')
const getName = require('../helpers/get-name')
const checkRegistrationTime = require('../helpers/check-registration-time')
const deleteMessage = require('../helpers/delete-message')
const checkReserveDeadline = require('../helpers/check-reserve-deadline')
const { PLUS_MINUS, PLUS_MINUS_FRIEND } = require('../helpers/constants')
const sendReply = require('../helpers/send-reply')
const handleError = require('./handle-error')

module.exports = async function handlePlusMinus(ctx) {
	try {
		const event = await checkEventExistence(ctx)
		if (!event) return

		if (!(await checkRegistrationTime(ctx, event))) return

		const { title, start, chatId, participantsMax, participants, reserveDeadline } = event

		const userName = getName(ctx)

		const currentParticipant = { name: userName, chatId: ctx.from.id, decision: '±' }

		const { data } = ctx.callbackQuery

		if (data === PLUS_MINUS) {
			const existingPlusIndex = participants.findIndex(
				({ name, chatId, decision }) => name === userName && chatId === ctx.from.id && decision === '+'
			)
			const existingPlusMinusIndex = participants.findIndex(
				({ name, chatId, decision }) => name === userName && chatId === ctx.from.id && decision === '±'
			)
			const existingMinusIndex = participants.findIndex(
				({ name, chatId, decision }) => name === userName && chatId === ctx.from.id && decision === '–'
			)

			if (existingPlusIndex + 1) {
				participants[existingPlusIndex].decision = '±'
			} else if (existingPlusMinusIndex + 1) {
				return await ctx.replyWithHTML(`<b>${userName}</b>, ви вже є в списку.`)
			} else if (existingMinusIndex + 1) {
				participants.splice(existingMinusIndex, 1)
				participants.push(currentParticipant)
			} else {
				participants.push(currentParticipant)
			}
		}

		let currentAddingFriend = { ...currentParticipant, name: `${userName} +1` }

		if (data === PLUS_MINUS_FRIEND) {
			const lastAddedFriend = [...participants]
				.reverse()
				.find(({ chatId, name }) => chatId === ctx.from.id && name.includes(`${userName} +`))

			if (lastAddedFriend) {
				const lastAddedFriendNumber = Number(
					lastAddedFriend.name
						.split(' ')
						.reverse()
						.find(el => el.includes('+'))
				)

				currentAddingFriend.name = !isNaN(lastAddedFriendNumber)
					? `${userName} +${lastAddedFriendNumber + 1}`
					: `${userName} +1`
			}

			participants.push(currentAddingFriend)
		}

		const updatedEvent = await updateEvent({ chatId, title, start }, { participants })

		await deleteMessage(ctx)

		let top = []
		let reserve = []
		let refused = []

		if (checkReserveDeadline(reserveDeadline)) {
			top = participants.filter(({ decision }) => decision === '+').map(({ name }, i) => `${i + 1}. ${name}`)

			let reservePlus = []
			if (top.length > participantsMax) {
				reservePlus = top.splice(participantsMax || top.length)
			} else {
				for (let i = top.length; i < participantsMax; i++) {
					top.push(`${i + 1}.`)
				}
			}

			reserve = [
				...reservePlus,
				...participants
					.filter(({ decision }) => decision === '±')
					.map((participant, i) => {
						if (
							(data === PLUS_MINUS && JSON.stringify(currentParticipant) === JSON.stringify(participant)) ||
							(data === PLUS_MINUS_FRIEND && JSON.stringify(currentAddingFriend) === JSON.stringify(participant))
						) {
							return `${top.length + reservePlus.length + i + 1}. <b>${participant.name} ±</b>`
						} else {
							return `${top.length + reservePlus.length + i + 1}. ${participant.name} ±`
						}
					}),
			]
		} else {
			const notMinusParticipants = participants
				.filter(({ decision }) => decision !== '–')
				.map((participant, i) => {
					if (
						(data === PLUS_MINUS && JSON.stringify(currentParticipant) === JSON.stringify(participant)) ||
						(data === PLUS_MINUS_FRIEND && JSON.stringify(currentAddingFriend) === JSON.stringify(participant))
					) {
						return `${i + 1}. <b>${participant.name} ±</b>`
					} else {
						return `${i + 1}. ${participant.name} ${participant.decision === '±' ? '±' : ''}`
					}
				})

			top = notMinusParticipants.slice(0, participantsMax || notMinusParticipants.length)
			for (let i = top.length; i < participantsMax; i++) {
				top.push(`${i + 1}.`)
			}
			reserve = notMinusParticipants.slice(participantsMax || notMinusParticipants.length)
		}

		refused = participants.filter(({ decision }) => decision === '–').map(({ name }) => `${name} –`)

		await sendReply(ctx, updatedEvent, { top, reserve, refused })
	} catch (err) {
		await handleError({ ctx, err })
	}
}
