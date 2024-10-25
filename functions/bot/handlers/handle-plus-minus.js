const { getEvent, updateEvent } = require('../services/events-api')
const getFullName = require('../helpers/get-full-name')
const checkRegistrationTime = require('../helpers/check-registration-time')
const deleteMessage = require('../helpers/delete-message')
const checkReserveDeadline = require('../helpers/check-reserve-deadline')
const { PLUS_MINUS, PLUS_MINUS_FRIEND } = require('../helpers/constants')
const sendReply = require('../helpers/send-reply')
const handleError = require('./handle-error')

module.exports = async function handlePlusMinus(ctx) {
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

		if (!event) {
			await deleteMessage(ctx)
			await ctx.replyWithHTML(`<b>${fullName}</b>, подія "${title}" вже не актуальна.`)
			return
		}

		if (!(await checkRegistrationTime(ctx, event))) return

		let { participantsMax, participants, reserveDeadline } = event

		const currentParticipant = { name: fullName, chatId: ctx.from.id, decision: '±' }

		if (data === PLUS_MINUS) {
			const existingPlusIndex = participants.findIndex(
				({ name, chatId, decision }) => name === fullName && chatId === ctx.from.id && decision === '+'
			)
			const existingPlusMinusIndex = participants.findIndex(
				({ name, chatId, decision }) => name === fullName && chatId === ctx.from.id && decision === '±'
			)
			const existingMinusIndex = participants.findIndex(
				({ name, chatId, decision }) => name === fullName && chatId === ctx.from.id && decision === '–'
			)

			if (existingPlusIndex + 1) {
				participants[existingPlusIndex].decision = '±'
			} else if (existingPlusMinusIndex + 1) {
				return await ctx.replyWithHTML(`<b>${fullName}</b>, ви вже є в списку.`)
			} else if (existingMinusIndex + 1) {
				participants.splice(existingMinusIndex, 1)
				participants.push(currentParticipant)
			} else {
				participants.push(currentParticipant)
			}
		}

		let currentAddingFriend = { ...currentParticipant, name: `${fullName} +1` }

		if (data === PLUS_MINUS_FRIEND) {
			const lastAddedFriend = [...participants]
				.reverse()
				.find(({ chatId, name }) => chatId === ctx.from.id && name.includes(`${fullName} +`))

			if (lastAddedFriend) {
				const lastAddedFriendNumber = Number(
					lastAddedFriend.name
						.split(' ')
						.reverse()
						.find(el => el.includes('+'))
				)

				currentAddingFriend.name = !isNaN(lastAddedFriendNumber)
					? `${fullName} +${lastAddedFriendNumber + 1}`
					: `${fullName} +1`
			}

			participants.push(currentAddingFriend)
		}

		const updatedEvent = await updateEvent(credentials, { participants })

		await deleteMessage(ctx)

		let top = []
		let reserve = []
		let refused = []

		if (await checkReserveDeadline(reserveDeadline, ctx)) {
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
				.filter(participant => participant.decision !== '–')
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

			top = notMinusParticipants.slice(0, participantsMax ?? notMinusParticipants.length)
			for (let i = top.length; i < participantsMax; i++) {
				top.push(`${i + 1}.`)
			}
			reserve = notMinusParticipants.slice(participantsMax ?? notMinusParticipants.length)
		}

		refused = participants.filter(participant => participant.decision === '–').map(({ name }) => `${name} –`)

		await sendReply(ctx, updatedEvent, { top, reserve, refused })
	} catch (err) {
		await handleError({ ctx, err })
	}
}
