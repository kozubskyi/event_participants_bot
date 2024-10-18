const { Markup } = require('telegraf')
const getHeader = require('./get-header')
const { PLUS_BUTTON, MINUS_BUTTON, PLUS_FRIEND_BUTTON, MINUS_FRIEND_BUTTON, KEYBOARD } = require('./buttons')

module.exports = async function sendReply(ctx, event, preparedParticipants) {
	const { reserveDeadline } = event
	const { top = [], reserve = [], refused = [] } = preparedParticipants

	const reply = `
${getHeader(event)}

${top.length ? `${top.join('\n')}\n\n` : ''}${reserve.length ? `Резерв:\n${reserve.join('\n')}\n\n` : ''}${
		refused.length ? refused.join('\n') : ''
	}
`

	let buttons = KEYBOARD

	if (reserveDeadline) {
		const [date, time] = reserveDeadline.split(', ')
		const [day, month, year] = date.split('.')
		const [hours, minutes] = time.split(':')

		const now = new Date()
		const kyivOffset = 3 * 60 * 60 * 1000 // 3 часа в миллисекундах
		const nowInKyiv = new Date(now.getTime() + kyivOffset - now.getTimezoneOffset() * 60 * 1000)

		const reserveDeadlineDate = new Date(year, month - 1, day, hours, minutes)

		if (nowInKyiv > reserveDeadlineDate) {
			buttons = Markup.inlineKeyboard([
				[PLUS_BUTTON, MINUS_BUTTON],
				[PLUS_FRIEND_BUTTON, MINUS_FRIEND_BUTTON],
			])
		}
	}

	await ctx.replyWithHTML(reply, buttons)
}
