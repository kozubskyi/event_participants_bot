module.exports = function getCronExpression(dateTimeStr) {
	const [date, time] = dateTimeStr.split(', ')
	const [day, month, year] = date.split('.')
	const [hours, minutes] = time.split(':')

	return `${minutes} ${hours} ${day} ${month} *`
}
