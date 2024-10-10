module.exports = async function deleteMessage(ctx) {
	await ctx.telegram.deleteMessage(ctx.chat.id, ctx.callbackQuery.message.message_id)
}
