const { CREATOR_CHAT_ID } = require('./constants')

module.exports = async function sendInfoMessageToCreator(ctx, reply, ...others) {
	const chatId = ctx.chat?.id
	const type = ctx.chat?.type
	const title = ctx.chat?.title
	const firstName = ctx.from?.first_name
	const lastName = ctx.from?.last_name
	const username = ctx.from?.username
	const userChatId = ctx.from?.id
	const text = ctx.message?.text
	const btnValue = ctx.callbackQuery?.data

	let creatorReply = `
Chat: ${type} ${title ? `"${title}" ` : ''}${chatId}

Користувач ${firstName} ${lastName} <${username}> ${userChatId}`
	if (text && text[0] === '/') {
		creatorReply = `${creatorReply} натиснув команду ${text}`
	} else if (reply === 'splitVariant') {
		creatorReply = `${creatorReply} обрав варіант розподілу: ${btnValue}`
	} else if (reply === 'teamsQuantity') {
		creatorReply = `${creatorReply} обрав кількість команд: ${btnValue[0]}`
	} else if (reply === 'playersList') {
		creatorReply = `
${creatorReply} відправив список гравців:

${text}`
	} else if (reply === 'transfers') {
		creatorReply = `${creatorReply} натиснув кнопку Трансфери`
	} else if (reply === 'transfer') {
		creatorReply = `
${creatorReply} зробив трансфер:

${others[0]}`
	} else if (reply === 'finishTransfers') {
		creatorReply = `
${creatorReply} підтвердив трансфери:

${others[0]}`
	} else {
		creatorReply = `
${creatorReply} поділив свої команди:
${reply}`
	}

	chatId !== CREATOR_CHAT_ID && (await ctx.telegram.sendMessage(CREATOR_CHAT_ID, creatorReply))
}
