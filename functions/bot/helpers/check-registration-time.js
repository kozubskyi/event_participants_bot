const formatDate = require('./format-date')
const getFullName = require('./get-full-name')

module.exports = async function checkRegistrationTime(ctx, event) {
	const { registrationStart, registrationEnd } = event

	if (registrationStart) {
		const nowLocaleString = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })
		const now = new Date(formatDate(nowLocaleString))
		const start = new Date(formatDate(registrationStart))

		if (now < start) {
			await ctx.replyWithHTML(
				`<b>${getFullName(ctx)}</b>, реєстрація ще не розпочалася. Вона розпочнеться ${registrationStart}.`
			)
			return false
		}
	}

	if (registrationEnd) {
		const nowLocaleString = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })
		const now = new Date(formatDate(nowLocaleString))
		const end = new Date(formatDate(registrationEnd))

		if (now > end) {
			await ctx.replyWithHTML(`<b>${getFullName(ctx)}</b>, реєстрація вже закінчилася.`)
			return false
		}
	}

	return true
}
