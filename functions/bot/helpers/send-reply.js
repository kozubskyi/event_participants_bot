const { Markup } = require('telegraf')
const getHeader = require('./get-header')
const {
	PLUS_BUTTON,
	PLUS_MINUS_BUTTON,
	MINUS_BUTTON,
	PLUS_FRIEND_BUTTON,
	PLUS_MINUS_FRIEND_BUTTON,
	MINUS_FRIEND_BUTTON,
	UPDATE_BUTTON,
	SETTINGS_BUTTON,
	FINISH_EVENT_BUTTON,
} = require('./buttons')
const getDate = require('./get-date')

module.exports = async function sendReply(ctx, event, { top = [], reserve = [], refused = [] }) {
	const reply = `
${getHeader(event)}

${top.length ? `${top.join('\n')}\n\n` : ''}${reserve.length ? `Резерв:\n${reserve.join('\n')}\n\n` : ''}${
		refused.length ? refused.join(', ') : ''
	}
`

	let buttons = Markup.inlineKeyboard([
		[PLUS_BUTTON, PLUS_MINUS_BUTTON, MINUS_BUTTON],
		[PLUS_FRIEND_BUTTON, PLUS_MINUS_FRIEND_BUTTON, MINUS_FRIEND_BUTTON],
		[UPDATE_BUTTON],
		[FINISH_EVENT_BUTTON],
	])

	await ctx.replyWithHTML(reply, buttons)
}
