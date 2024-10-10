// const { resetStore } = require('../services/stores-api')
const { CREATOR_USERNAME, CREATOR_CHAT_ID } = require('../helpers/constants')

module.exports = async function handleError({ ctx, err }) {
	const chatId = ctx.chat?.id
	const type = ctx.chat?.type
	const title = ctx.chat?.title
	const firstName = ctx.from?.first_name
	const lastName = ctx.from?.last_name
	const username = ctx.from?.username
	const userChatId = ctx.from?.id
	const value = ctx.callbackQuery?.data || ctx.message?.text

	const error = err?.response?.data?.message ?? err

	// await resetStore(ctx)

	let creatorReply = `
❌ Помилка!
Chat: ${type} ${title ? `"${title}" ` : ''}${chatId}

Користувач ${firstName} ${lastName} <${username}> ${userChatId} щойно відправив повідомлення "${value}" і виникла помилка: "${error}"`

	// username !== CREATOR_USERNAME && (await ctx.reply('Виникли технічні неполадки, скоро полагоджусь і повернусь 👨‍🔧'))

	await ctx.telegram.sendMessage(CREATOR_CHAT_ID, creatorReply)
}
