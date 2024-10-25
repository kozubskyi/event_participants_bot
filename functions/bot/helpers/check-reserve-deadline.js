const getDate = require('./get-date')

module.exports = async function checkReserveDeadline(reserveDeadline) {
	const now = new Date()
	const kyivOffset = 3 * 60 * 60 * 1000
	const nowInKyiv = new Date(now.getTime() + kyivOffset - now.getTimezoneOffset() * 60 * 1000)
	// const nowInKyiv = new Date()

	const reserveDeadlineDate = getDate(reserveDeadline)

	return reserveDeadline && nowInKyiv > reserveDeadlineDate
}
