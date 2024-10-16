const { Markup } = require('telegraf')
const getHeader = require('./get-header')
const formatDate = require('./format-date')
const {
	PLUS_BUTTON,
	MINUS_BUTTON,
	PLUS_FRIEND_BUTTON,
	MINUS_FRIEND_BUTTON,
	FINISH_EVENT_BUTTON,
	KEYBOARD,
} = require('./buttons')

module.exports = async function sendReply(ctx, event, preparedParticipants) {
	const { reserveDeadline } = event
	const { top, reserve, refused } = preparedParticipants

	const reply = `
${getHeader(event)}

${top.length ? `${top.join('\n')}\n\n` : ''}${reserve.length ? `Резерв:\n${reserve.join('\n')}\n\n` : ''}${
		refused.length ? refused.join('\n') : ''
	}
`

	let buttons = KEYBOARD

	if (reserveDeadline) {
		const nowLocaleString = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })
		const now = new Date(formatDate(nowLocaleString))
		const deadline = new Date(formatDate(event.reserveDeadline))

		if (now > deadline) {
			buttons = Markup.inlineKeyboard([
				[PLUS_BUTTON, MINUS_BUTTON],
				[PLUS_FRIEND_BUTTON, MINUS_FRIEND_BUTTON],
				// [FINISH_EVENT_BUTTON],
			])
		}
	}

	await ctx.replyWithHTML(reply, buttons)
}
