const { checkEventExistence, prepareParticipants, sendReply } = require('../helpers/helpers')
const deleteMessage = require('../helpers/delete-message')
const handleError = require('./handle-error')

module.exports = async function handleUpdate(ctx) {
	try {
		const event = await checkEventExistence(ctx)
		if (!event) return

		await deleteMessage(ctx)

		const { top, reserve, refused } = prepareParticipants(event, ctx)

		await sendReply(ctx, event, { top, reserve, refused })
	} catch (err) {
		await handleError({ ctx, err })
	}
}
