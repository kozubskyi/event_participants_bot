module.exports = function getCronExpression(dateTimeStr /*, hoursToSubtract = 0*/) {
	const [date, time] = dateTimeStr.split(', ')
	const [day, month, year] = date.split('.')
	const [hours, minutes] = time.split(':')

	// const dateObj = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`)

	// dateObj.setHours(dateObj.getHours() - hoursToSubtract)

	// const newDay = String(dateObj.getDate()).padStart(2, '0')
	// const newMonth = String(dateObj.getMonth() + 1).padStart(2, '0')
	// const newHours = String(dateObj.getHours()).padStart(2, '0')
	// const newMinutes = String(dateObj.getMinutes()).padStart(2, '0')

	// return `${newMinutes} ${newHours} ${newDay} ${newMonth} *`

	return `${minutes} ${hours} ${day} ${month} *`
}
