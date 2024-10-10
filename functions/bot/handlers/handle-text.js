const { Markup } = require('telegraf')
const { createEvent, getEvent, updateEvent } = require('../services/events-api')
const getHeader = require('../helpers/get-header')
const { KEYBOARD } = require('../helpers/buttons')
const formatDate = require('../helpers/format-date')
// const handleError = require('./handle-error')

module.exports = async function handleText(ctx) {
	try {
		if (ctx.message.text.slice(0, 12) !== 'CREATE_EVENT') return

		const event = ctx.message.text
			.split('\n')
			.slice(1)
			.reduce((acc, line) => {
				const [key, value] = line.split(': ')

				if (!key) return acc

				acc[key] = isNaN(value) ? value : Number(value)

				return acc
			}, {})

		const { title, start, reserveDeadline } = event

		if (!title || !start) return await ctx.reply(`⚠️ Невірно введені дані`)

		event.chatId = ctx.chat.id
		event.creatorUsername = ctx.from.username

		const createdEvent = await createEvent(event)

		let reply = `${getHeader(createdEvent)}`

		await ctx.replyWithHTML(reply, KEYBOARD)

		if (!reserveDeadline) return

		const now = new Date()
		const deadline = new Date(formatDate(reserveDeadline))
		const delay = deadline - now

		if (delay <= 0) return

		setTimeout(async () => {
			const query = {
				chatId: ctx.chat.id,
				title,
				start,
			}

			const gotEvent = await getEvent(query)

			if (!gotEvent) return

			let { participants, participantsMax } = gotEvent

			let top = []
			let reserve = []
			let refused = []

			participants.forEach(participant => {
				const lastSymbol = participant[participant.length - 1]

				lastSymbol !== '-' && lastSymbol !== '±' && top.push(participant)
				lastSymbol === '-' && refused.push(participant)
			})

			participants = [...top, ...refused]

			const updatedEvent = await updateEvent(query, { participants })

			top = top.map((p, i) => `${i + 1}. ${p}`)
			reserve = top.splice(participantsMax ?? top.length)

			reply = `
${getHeader(gotEvent)}

${top.length ? `${top.join('\n')}\n\n` : ''}${reserve.length ? `Резерв:\n${reserve.join('\n')}\n\n` : ''}${
				refused.length ? refused.join('\n') : ''
			}
`

			await ctx.replyWithHTML(reply, KEYBOARD)
		}, delay)
	} catch (err) {
		console.log({ err })
	}
}
