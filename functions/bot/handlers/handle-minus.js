const checkEventExistence = require('../helpers/check-event-existence')
const { updateEvent } = require('../services/events-api')
const getName = require('../helpers/get-name')
const checkRegistrationTime = require('../helpers/check-registration-time')
const deleteMessage = require('../helpers/delete-message')
const checkReserveDeadline = require('../helpers/check-reserve-deadline')
const { MINUS, MINUS_FRIEND } = require('../helpers/constants')
const sendReply = require('../helpers/send-reply')
const handleError = require('./handle-error')

module.exports = async function handleMinus(ctx) {
	try {
		const event = await checkEventExistence(ctx)
		if (!event) return

		if (!(await checkRegistrationTime(ctx, event))) return

		const { title, start, chatId, participantsMax, participants, reserveDeadline } = event

		const userName = getName(ctx)

		const currentParticipant = { name: userName, chatId, decision: '–' }

		const { data } = ctx.callbackQuery

		if (data === MINUS) {
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
				participants.splice(existingPlusIndex, 1)
			} else if (existingPlusMinusIndex + 1) {
				participants.splice(existingPlusMinusIndex, 1)
			} else if (existingMinusIndex + 1) {
				return await ctx.replyWithHTML(`<b>${userName}</b>, ви вже є в списку.`)
			}
			participants.push(currentParticipant)
		}

		if (data === MINUS_FRIEND) {
			const reversedRemovingFriendIndex = [...participants]
				.reverse()
				.findIndex(({ chatId, name }) => chatId === ctx.from.id && name.includes(`${userName} +`))

			if (reversedRemovingFriendIndex + 1) {
				const removingFriendIndex = participants.length - reversedRemovingFriendIndex - 1

				participants.splice(removingFriendIndex, 1)
			} else {
				return
			}
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
					.map(({ name }, i) => `${top.length + reservePlus.length + i + 1}. ${name} ±`),
			]
		} else {
			const notMinusParticipants = participants
				.filter(({ decision }) => decision !== '–')
				.map(({ name, decision }, i) => `${i + 1}. ${name} ${decision === '±' ? '±' : ''}`)

			top = notMinusParticipants.slice(0, participantsMax || notMinusParticipants.length)
			for (let i = top.length; i < participantsMax; i++) {
				top.push(`${i + 1}.`)
			}

			reserve = notMinusParticipants.slice(participantsMax || notMinusParticipants.length)
		}

		refused = participants
			.filter(({ decision }) => decision === '–')
			.map((participant, i) => {
				if (data === MINUS && JSON.stringify(currentParticipant) === JSON.stringify(participant)) {
					return `<b>${participant.name} –</b>`
				} else {
					return `${participant.name} –`
				}
			})

		await sendReply(ctx, updatedEvent, { top, reserve, refused })
	} catch (err) {
		await handleError({ ctx, err })
	}
}
