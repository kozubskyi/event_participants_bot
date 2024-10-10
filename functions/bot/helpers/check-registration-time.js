const formatDate = require('./format-date')
const getFullName = require('./get-full-name')

module.exports = async function checkRegistrationTime(ctx, event) {
	const { registrationStart, registrationEnd } = event

	if (registrationStart) {
		const now = new Date()

		const registrationStartDate = new Date(formatDate(registrationStart))

		if (now < registrationStartDate) {
			await ctx.replyWithHTML(
				`<b>${getFullName(ctx)}</b>, реєстрація ще не розпочалася. Вона розпочнеться ${registrationStart}.`
			)
			return false
		}
	}
	
	if (registrationEnd) {
		const now = new Date()

		const registrationEndDate = new Date(formatDate(registrationEnd))

		if (now > registrationEndDate) {
			await ctx.replyWithHTML(`<b>${getFullName(ctx)}</b>, реєстрація вже закінчилася.`)
			return false
		}
	}

	return true
}
