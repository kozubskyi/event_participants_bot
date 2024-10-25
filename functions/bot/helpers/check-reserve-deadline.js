const getDate = require('./get-date')

module.exports = async function checkReserveDeadline(reserveDeadline, ctx) {
	const now = new Date()
	const kyivOffset = 3 * 60 * 60 * 1000
	const nowInKyiv = new Date(now.getTime() + kyivOffset - now.getTimezoneOffset() * 60 * 1000)
	// const nowInKyiv = new Date()

	const reserveDeadlineDate = getDate(reserveDeadline)

	await ctx.replyWithHTML(
		`${reserveDeadline && nowInKyiv > reserveDeadlineDate}\n\n${nowInKyiv}\n${reserveDeadlineDate}`
	)

	return reserveDeadline && nowInKyiv > reserveDeadlineDate
}
