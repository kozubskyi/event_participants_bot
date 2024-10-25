const getDate = require('./get-date')
const getFullName = require('./get-full-name')

module.exports = async function checkRegistrationTime(ctx, event) {
	const { registrationStart, registrationEnd, start } = event

	const now = new Date()
	const kyivOffset = 3 * 60 * 60 * 1000
	const nowInKyiv = new Date(now.getTime() + kyivOffset - now.getTimezoneOffset() * 60 * 1000)
	// const nowInKyiv = new Date()

	if (registrationStart) {
		const registrationStartDate = getDate(registrationStart)

		if (nowInKyiv < registrationStartDate) {
			await ctx.replyWithHTML(`<b>${getFullName(ctx)}</b>, період реєстрації ще не розпочався.`)
			return false
		}
	}

	if (registrationEnd) {
		const registrationEndDate = getDate(registrationEnd)

		if (nowInKyiv > registrationEndDate) {
			await ctx.replyWithHTML(`<b>${getFullName(ctx)}</b>, період реєстрації вже закінчився.`)
			return false
		}
	}

	return true
}
