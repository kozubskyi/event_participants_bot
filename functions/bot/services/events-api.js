const axios = require('axios')

axios.defaults.baseURL = process.env.TELEGRAM_DB_BASE_URL

exports.createEvent = async eventData => {
	const { data } = await axios.post('/events', eventData)
	return data
}

exports.getEvent = async query => {
	const { chatId, title, start } = query
	const { data } = await axios.get(`/events?chatId=${chatId}&title=${title}&start=${start}`)
	return data
}

exports.getEvents = async chatId => {
	const { data } = await axios.get(`/events?chatId=${chatId}`)
	return data
}

exports.updateEvent = async (query, fieldsToUpdate) => {
	const { chatId, title, start } = query
	const { data } = await axios.patch(`/events?chatId=${chatId}&title=${title}&start=${start}`, fieldsToUpdate)
	return data
}

exports.deleteEvent = async query => {
	const { chatId, title, start } = query
	const { data } = await axios.delete(`/events?chatId=${chatId}&title=${title}&start=${start}`)
	return data
}
