module.exports = function formatDate(dateString) {
	if (typeof dateString !== 'string') return null

	const month = dateString.slice(3, 6)
	const day = dateString.slice(0, 3)
	const yearAndTime = dateString.slice(6)

	return `${month}${day}${yearAndTime}`
}
