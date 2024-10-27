const { getEvents } = require('../services/events-api')
const checkReserveDeadline = require('../helpers/check-reserve-deadline')
const sendReply = require('../helpers/send-reply')
const handleError = require('./handle-error')

module.exports = async function handleEvents(ctx) {
	try {
		const events = await getEvents(ctx.chat.id)

		if (!events.length) return await ctx.reply('Активних подій немає')

		events.forEach(async event => {
			const { reserveDeadline, participantsMax, participants } = event

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

			refused = participants.filter(({ decision }) => decision === '–').map(({ name }) => `${name} –`)

			await sendReply(ctx, event, { top, reserve, refused })
		})
	} catch (err) {
		await handleError({ ctx, err })
	}
}
