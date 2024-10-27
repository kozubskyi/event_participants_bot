module.exports = async function deleteMessage(ctx) {
	const { message_id } = ctx.callbackQuery.message

	if (message_id) await ctx.telegram.deleteMessage(ctx.chat.id, message_id)
}
