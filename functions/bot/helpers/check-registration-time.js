const { DateTime } = require('luxon')
const getDate = require('./get-date')
const getName = require('./get-name')

module.exports = async function checkRegistrationTime(ctx, event) {
	const { registrationStart, registrationEnd } = event

	const now = DateTime.now()

	if (registrationStart) {
		const registrationStartDate = getDate(registrationStart)

		if (now < registrationStartDate) {
			await ctx.replyWithHTML(`<b>${getName(ctx)}</b>, період реєстрації ще не розпочався.`)
			return false
		}
	}

	if (registrationEnd) {
		const registrationEndDate = getDate(registrationEnd)

		if (now > registrationEndDate) {
			await ctx.replyWithHTML(`<b>${getName(ctx)}</b>, період реєстрації вже закінчився.`)
			return false
		}
	}

	return true
}
