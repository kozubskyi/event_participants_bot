const getFullName = require('./get-full-name')
const { CREATOR_CHAT_ID } = require('./constants')

module.exports = async function sendInfoMessageToCreator(ctx) {
	const chatType = ctx.chat?.type
	const chatTitle = ctx.chat?.title
	const chatId = ctx.chat?.id
	const fullName = getFullName(ctx)
	const username = ctx.from?.username
	const text = ctx.message?.text

	let creatorReply = `
Chat: ${chatType} ${chatTitle ? `"${chatTitle}" ` : ''}${chatId}
Користувач ${fullName} (@${username}) відправив наступне повідомлення і успішно створив подію:

${text}`

	chatId !== CREATOR_CHAT_ID && (await ctx.telegram.sendMessage(CREATOR_CHAT_ID, creatorReply))
}
