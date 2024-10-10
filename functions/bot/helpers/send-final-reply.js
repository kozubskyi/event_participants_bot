const { Markup } = require('telegraf')
// const { resetStore } = require('../services/stores-api')
const getLineups = require('./get-lineups')
const sendInfoMessageToCreator = require('./send-info-message-to-creator')
const { TRANSFERS_BUTTON, RESPLIT_BUTTON } = require('./buttons')

module.exports = async function sendFinalReply(ctx, { splitVariant, teamsQuantity, teamsData }) {
	const reply = `✔️ <b>Поділив</b>
Варіант розподілу: ${splitVariant}
${teamsQuantity !== 1 ? `Кількість команд: ${teamsQuantity}` : ''}${getLineups(teamsData)}`

	const buttons = Markup.inlineKeyboard([teamsQuantity !== 1 ? [TRANSFERS_BUTTON] : [], [RESPLIT_BUTTON]])

	await ctx.replyWithHTML(reply, buttons)
	await sendInfoMessageToCreator(ctx, reply)
	// await resetStore(ctx)
}
