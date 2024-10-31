const { DateTime } = require('luxon')
const getDate = require('./get-date')

module.exports = function checkReserveDeadline(reserveDeadline) {
	const now = DateTime.now()
	const reserveDeadlineDate = getDate(reserveDeadline)

	return reserveDeadline && now > reserveDeadlineDate
}
