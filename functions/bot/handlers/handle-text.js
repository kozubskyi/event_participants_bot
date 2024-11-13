const { DateTime } = require('luxon')
const { getName, getDate, checkReserveDeadline, prepareParticipants, sendReply } = require('../helpers/helpers')
const { createEvent, getEvent, updateEvent, deleteEvent } = require('../services/events-api')
const sendInfoMessageToCreator = require('../helpers/send-info-message-to-creator')
// const cron = require('node-cron')
// const getCronExp = require('../helpers/get-cron-expression')
const handleError = require('./handle-error')

const checkDates = async (event, ctx) => {
	const { start, end, registrationEnd } = event
	const name = getName(ctx.from)

	const now = DateTime.now()
	const startDate = getDate(start)
	const endDate = getDate(end)
	const registrationEndDate = getDate(registrationEnd)

	if (startDate && startDate < now) {
		await ctx.replyWithHTML(`⚠️ <b>${name}</b>, старт події не може бути раніше ніж дата та час станом на зараз.`)
		return
	}

	if (endDate && endDate < now) {
		await ctx.replyWithHTML(`⚠️ <b>${name}</b>, кінець події не може бути раніше ніж дата та час станом на зараз.`)
		return
	}

	if (endDate && startDate && endDate < startDate) {
		await ctx.replyWithHTML(`⚠️ <b>${name}</b>, кінець події не може бути раніше ніж її початок.`)
		return
	}

	if (endDate && registrationEndDate && endDate < registrationEndDate) {
		await ctx.replyWithHTML(`⚠️ <b>${name}</b>, кінець події не може бути раніше ніж кінець реєстрації.`)
		return
	}

	if (registrationEnd && registrationEndDate < now) {
		await ctx.replyWithHTML(
			`⚠️ <b>${name}</b>, кінець періоду реєстрації не може бути раніше ніж дата та час станом на зараз.`
		)
		return
	}

	return true
}

module.exports = async function handleText(ctx) {
	try {
		const firstString = ctx.message.text.split('\n')[0]

		if (firstString === 'CREATE_EVENT') {
			const event = ctx.message.text
				.split('\n')
				.slice(1)
				.reduce((acc, line) => {
					const [key, value] = line.split(': ')

					if (key) acc[key] = isNaN(value) ? value.trim() : Number(value)

					return acc
				}, {})

			const { title, start, participantsMax } = event

			if (!title || !start) {
				await ctx.replyWithHTML(
					`⚠️ <b>${getName(ctx.from)}</b>, невірно введені дані, поля title та start є обов'язковими.`
				)
				return
			}

			if (!(await checkDates(event, ctx))) return

			event.chatId = ctx.chat.id
			event.chatTitle = ctx.chat.title
			event.creator = {
				name: getName(ctx.from),
				chatId: ctx.from.id,
				username: ctx.from.username,
				first_name: ctx.from.first_name,
				last_name: ctx.from.last_name,
			}

			const createdEvent = await createEvent(event)

			const top = participantsMax ? Array.from({ length: participantsMax }, (el, i) => `${i + 1}.`) : []

			await sendReply(ctx, createdEvent, { top })
			await sendInfoMessageToCreator(ctx)
		}

		if (firstString === 'UPDATE_EVENT') {
			const splitted = ctx.message.text.split('\n')
			const index = splitted.indexOf('')

			const userName = getName(ctx.from)

			if (index < 0) {
				await ctx.replyWithHTML(`⚠️ <b>${userName}</b>, не введено поля, які потрібно оновити.`)
				return
			}

			const searchedEvent = splitted.slice(1, index).reduce((acc, line) => {
				const [key, value] = line.split(': ')
				acc[key] = value
				return acc
			}, {})

			const fieldsToUpdate = splitted.slice(index + 1).reduce((acc, line) => {
				const [key, value] = line.split(': ')
				const nullValues = ['reset', 'null', null, '0', 0, '']

				acc[key] = nullValues.includes(value) ? null : value

				return acc
			}, {})

			if (!searchedEvent.title || !searchedEvent.start) {
				return await ctx.replyWithHTML(
					`⚠️ <b>${userName}</b>, невірно введено пошукові дані, поля title та start є обов'язковими.`
				)
			}

			searchedEvent.chatId = ctx.chat.id

			const event = await getEvent(searchedEvent)

			if (!event) {
				await ctx.replyWithHTML(`⚠️ <b>${userName}</b>, події <b>${searchedEvent.title}</b> немає в базі даних.`)
				return
			}

			if (!(await checkDates(event, ctx))) return

			const updatedEvent = await updateEvent(searchedEvent, fieldsToUpdate)

			const { top, reserve, refused } = prepareParticipants(updatedEvent, ctx)

			await sendReply(ctx, updatedEvent, { top, reserve, refused })
		}

		// if (!reserveDeadline) return

		// const query = {
		// 	chatId: ctx.chat.id,
		// 	title,
		// 	start,
		// 	creatorUsername: ctx.from?.username,
		// }

		// const options = { timezone: 'Europe/Kyiv' }

		// cron.schedule(
		// 	getCronExp(reserveDeadline),
		// 	async () => {
		// 		const gotEvent = await getEvent(query)

		// 		if (!gotEvent) return

		// 		let { participants, participantsMax } = gotEvent

		// 		let top = []
		// 		let reserve = []
		// 		let refused = []

		// 		participants.forEach(participant => {
		// 			const lastSymbol = participant[participant.length - 1]

		// 			lastSymbol !== '-' && lastSymbol !== '±' && top.push(participant)
		// 			lastSymbol === '-' && refused.push(participant)
		// 		})

		// 		participants = [...top, ...refused]

		// 		const updatedEvent = await updateEvent(query, { participants })

		// 		top = top.map((p, i) => `${i + 1}. ${p}`)
		// 		for (let i = top.length; i < participantsMax; i++) {
		// 			top.push(`${i + 1}.`)
		// 		}
		// 		reserve = top.splice(participantsMax || top.length)

		// 		await sendReply(ctx, updatedEvent, { top, reserve, refused })
		// 	},
		// 	options
		// )

		// cron.schedule(getCronExp(end || start), async () => await deleteEvent(query), options)
	} catch (err) {
		await handleError({ ctx, err })
	}
}
