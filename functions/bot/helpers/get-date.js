module.exports = function getDate(dateTimeStr) {
	if (!dateTimeStr) return

	const [date, time] = dateTimeStr.split(', ')
	const [day, month, year] = date.split('.')
	const [hours, minutes] = time.split(':')

	return new Date(year, month - 1, day, hours, minutes)
}
