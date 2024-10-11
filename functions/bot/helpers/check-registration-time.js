const formatDate = require('./format-date')
const getFullName = require('./get-full-name')

module.exports = async function checkRegistrationTime(ctx, event) {
	const { registrationStart, registrationEnd, start } = event

	const nowLocaleString = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })
	const now = new Date(formatDate(nowLocaleString))

	if (registrationStart) {
		const registrationStartDate = new Date(formatDate(registrationStart))

		if (now < registrationStartDate) {
			await ctx.replyWithHTML(`<b>${getFullName(ctx)}</b>, період реєстрації ще не розпочався.`)
			return false
		}
	}

	if (registrationEnd) {
		const registrationEndDate = new Date(formatDate(registrationEnd))

		if (now > registrationEndDate) {
			await ctx.replyWithHTML(`<b>${getFullName(ctx)}</b>, період реєстрації вже закінчився.`)
			return false
		}
	}
	// else {
	// 	const startDate = new Date(formatDate(start))

	// 	if (now > startDate) {
	// 		await ctx.replyWithHTML(`<b>${getFullName(ctx)}</b>, подія вже розпочалася, тому реєстрація закрита.`)
	// 		return false
	// 	}
	// }

	return true
}
