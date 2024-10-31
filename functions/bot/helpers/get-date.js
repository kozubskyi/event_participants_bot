const { DateTime } = require('luxon')

module.exports = function getDate(dateTimeStr) {
	return dateTimeStr ? DateTime.fromFormat(dateTimeStr, 'dd.MM.yyyy, HH:mm', { zone: 'Europe/Kyiv' }) : null
}
