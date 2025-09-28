const { checkEventExistence, prepareParticipants, sendReply } = require('../helpers/helpers')
const deleteMessage = require('../helpers/delete-message')
const handleError = require('./handle-error')

module.exports = async function handleUpdate(ctx) {
	try {
		const event = await checkEventExistence(ctx)
		if (!event) return

		await deleteMessage(ctx)

		await sendReply(ctx, event)
	} catch (err) {
		await handleError({ ctx, err })
	}
}
