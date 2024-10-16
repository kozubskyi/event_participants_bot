const { Markup } = require('telegraf')
const { createEvent, getEvent, updateEvent, deleteEvent } = require('../services/events-api')
const getHeader = require('../helpers/get-header')
const { KEYBOARD } = require('../helpers/buttons')
// const formatDate = require('../helpers/format-date')
const sendInfoMessageToCreator = require('../helpers/send-info-message-to-creator')
const sendReply = require('../helpers/send-reply')
const cron = require('node-cron')
const getCronExp = require('../helpers/get-cron-expression')
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

		const { title, start, end, reserveDeadline } = event

		if (!title || !start) return await ctx.reply(`⚠️ Невірно введені дані`)

		event.chatId = ctx.chat.id
		event.creatorUsername = ctx.from.username

		const createdEvent = await createEvent(event)

		await ctx.replyWithHTML(getHeader(createdEvent), KEYBOARD)
		await sendInfoMessageToCreator(ctx)

		if (!reserveDeadline) return

		const query = {
			chatId: ctx.chat.id,
			title,
			start,
			creatorUsername: ctx.from.username,
		}

		const reserveDeadlineCronExp = getCronExp(reserveDeadline)

		await ctx.reply(reserveDeadlineCronExp)

		cron.schedule(reserveDeadlineCronExp, async () => {
			await ctx.reply(`CRON reserveDeadline\n${new Date()}`)

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

			await sendReply(ctx, updatedEvent, { top, reserve, refused })
		})

		const deleteEventCronExp = getCronExp(end ?? start)

		await ctx.reply(`${new Date()}\n${reserveDeadlineCronExp}\n${deleteEventCronExp}`)

		cron.schedule(deleteEventCronExp, async () => {
			await ctx.reply(`CRON deleteEvent\n${new Date()}`)

			await deleteEvent(query)
		})
	} catch (err) {
		console.log({ err })
	}
}
