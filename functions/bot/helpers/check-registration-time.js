const getFullName = require('./get-full-name')

module.exports = async function checkRegistrationTime(ctx, event) {
	const { registrationStart, registrationEnd, start } = event

	const now = new Date()
	const kyivOffset = 3 * 60 * 60 * 1000 // 3 часа в миллисекундах
	const nowInKyiv = new Date(now.getTime() + kyivOffset - now.getTimezoneOffset() * 60 * 1000)

	if (registrationStart) {
		const [date, time] = registrationStart.split(', ')
		const [day, month, year] = date.split('.')
		const [hours, minutes] = time.split(':')

		const registrationStartDate = new Date(year, month - 1, day, hours, minutes)

		if (nowInKyiv < registrationStartDate) {
			await ctx.replyWithHTML(`<b>${getFullName(ctx)}</b>, період реєстрації ще не розпочався.`)
			return false
		}
	}

	if (registrationEnd) {
		const [date, time] = registrationEnd.split(', ')
		const [day, month, year] = date.split('.')
		const [hours, minutes] = time.split(':')

		const registrationEndDate = new Date(year, month - 1, day, hours, minutes)

		if (nowInKyiv > registrationEndDate) {
			await ctx.replyWithHTML(`<b>${getFullName(ctx)}</b>, період реєстрації вже закінчився.`)
			return false
		}
	}

	return true
}
