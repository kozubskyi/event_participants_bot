const { getEvents } = require('../services/events-api')
const { prepareParticipants, sendReply } = require('../helpers/helpers')
const handleError = require('./handle-error')

module.exports = async function handleEvents(ctx) {
	try {
		const events = await getEvents(ctx.chat.id)

		if (!events.length) return await ctx.reply('Активних подій немає')

		events.forEach(async event => {
			const { top, reserve, refused } = prepareParticipants(event, ctx)

			await sendReply(ctx, event, { top, reserve, refused })
		})
	} catch (err) {
		await handleError({ ctx, err })
	}
}
