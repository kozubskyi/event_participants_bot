const { getEvents } = require('../services/events-api')
const sendReply = require('../helpers/send-reply')
// const handleError = require('./handle-error')

module.exports = async function handleEvents(ctx) {
	try {
		const events = await getEvents(ctx.chat.id)

		if (!events.length) return await ctx.reply('Активних подій немає')

		events.forEach(async event => {
			const { participantsMax, participants } = event

			const notMinusParticipants = participants.filter(p => p[p.length - 1] !== '-').map((p, i) => `${i + 1}. ${p}`)

			const top = notMinusParticipants.slice(0, participantsMax ?? notMinusParticipants.length)
			for (let i = top.length; i < participantsMax; i++) {
				top.push(`${i + 1}.`)
			}
			const reserve = notMinusParticipants.slice(participantsMax ?? notMinusParticipants.length)
			const refused = participants.filter(p => p[p.length - 1] === '-')

			await sendReply(ctx, event, { top, reserve, refused })
		})
	} catch (err) {
		console.log({ err })
	}
}
