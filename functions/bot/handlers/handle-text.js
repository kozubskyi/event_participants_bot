const getName = require('../helpers/get-name')
const { createEvent, getEvent, updateEvent, deleteEvent } = require('../services/events-api')
const getDate = require('../helpers/get-date')
const checkReserveDeadline = require('../helpers/check-reserve-deadline')
const sendReply = require('../helpers/send-reply')
const sendInfoMessageToCreator = require('../helpers/send-info-message-to-creator')
// const cron = require('node-cron')
// const getCronExp = require('../helpers/get-cron-expression')
const handleError = require('./handle-error')

module.exports = async function handleText(ctx) {
	try {
		const userName = getName(ctx)

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

			const { title, start, end, reserveDeadline, registrationEnd, participantsMin, participantsMax } = event

			if (!title || !start) return await ctx.replyWithHTML(`⚠️ <b>${userName}</b>, невірно введені дані.`)

			const now = new Date()
			const kyivOffset = 3 * 60 * 60 * 1000
			const nowInKyiv = new Date(now.getTime() + kyivOffset - now.getTimezoneOffset() * 60 * 1000)
			// const nowInKyiv = new Date()

			const startDate = getDate(start)
			if (nowInKyiv >= startDate) {
				return await ctx.replyWithHTML(
					`⚠️ <b>${userName}</b>, старт події не може бути раніше ніж дата та час станом на зараз.`
				)
			}

			if (end) {
				const endDate = getDate(end)
				if (nowInKyiv >= endDate) {
					return await ctx.replyWithHTML(
						`⚠️ <b>${userName}</b>, кінець події не може бути раніше ніж дата та час станом на зараз.`
					)
				}
			}

			if (registrationEnd) {
				const registrationEndDate = getDate(registrationEnd)
				if (nowInKyiv >= registrationEndDate) {
					return await ctx.replyWithHTML(
						`⚠️ <b>${userName}</b>, кінець періоду реєстрації не може бути раніше ніж дата та час станом на зараз.`
					)
				}
			}

			event.chatId = ctx.chat.id
			event.chatTitle = ctx.chat?.title
			event.creatorUsername = ctx.from?.username

			const createdEvent = await createEvent(event)

			let top = []

			if (participantsMax) {
				top = Array.from({ length: participantsMax }, (el, i) => `${i + 1}.`)
			}

			await sendReply(ctx, createdEvent, { top })
			await sendInfoMessageToCreator(ctx)
		}

		if (firstString === 'UPDATE_EVENT') {
			const splitted = ctx.message.text.split('\n')
			const index = splitted.indexOf('')

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
					`⚠️ <b>${userName}</b>, невірно введені пошукові дані, поля title та start є обов'язковими.`
				)
			}

			searchedEvent.chatId = ctx.chat.id

			const event = await getEvent(searchedEvent)

			if (!event) return await ctx.replyWithHTML(`<b>${userName}</b>, такої події немає в базі даних.`)

			const now = new Date()
			const kyivOffset = 3 * 60 * 60 * 1000
			const nowInKyiv = new Date(now.getTime() + kyivOffset - now.getTimezoneOffset() * 60 * 1000)
			// const nowInKyiv = new Date()

			const { start, end, registrationEnd } = fieldsToUpdate

			if (start) {
				const startDate = getDate(start)
				if (nowInKyiv >= startDate) {
					return await ctx.replyWithHTML(
						`⚠️ <b>${userName}</b>, старт події не може бути раніше ніж дата та час станом на зараз.`
					)
				}
			}

			if (end) {
				const endDate = getDate(end)
				if (nowInKyiv >= endDate) {
					return await ctx.replyWithHTML(
						`⚠️ <b>${userName}</b>, кінець події не може бути раніше ніж дата та час станом на зараз.`
					)
				}
			}

			if (registrationEnd) {
				const registrationEndDate = getDate(registrationEnd)
				if (nowInKyiv >= registrationEndDate) {
					return await ctx.replyWithHTML(
						`⚠️ <b>${userName}</b>, кінець періоду реєстрації не може бути раніше ніж дата та час станом на зараз.`
					)
				}
			}

			const updatedEvent = await updateEvent(searchedEvent, fieldsToUpdate)

			let { reserveDeadline, participantsMax, participants } = updatedEvent

			let top = []
			let reserve = []
			let refused = []

			if (checkReserveDeadline(reserveDeadline)) {
				top = participants.filter(({ decision }) => decision === '+').map(({ name }, i) => `${i + 1}. ${name}`)

				let reservePlus = []
				if (top.length > participantsMax) {
					reservePlus = top.splice(participantsMax || top.length)
				} else {
					for (let i = top.length; i < participantsMax; i++) {
						top.push(`${i + 1}.`)
					}
				}

				reserve = [
					...reservePlus,
					...participants
						.filter(({ decision }) => decision === '±')
						.map(({ name }, i) => `${top.length + reservePlus.length + i + 1}. ${name} ±`),
				]
			} else {
				const notMinusParticipants = participants
					.filter(({ decision }) => decision !== '–')
					.map(({ name, decision }, i) => `${i + 1}. ${name} ${decision === '±' ? '±' : ''}`)

				top = notMinusParticipants.slice(0, participantsMax || notMinusParticipants.length)
				for (let i = top.length; i < participantsMax; i++) {
					top.push(`${i + 1}.`)
				}
				reserve = notMinusParticipants.slice(participantsMax || notMinusParticipants.length)
			}

			refused = participants.filter(({ decision }) => decision === '–').map(({ name }) => `${name} –`)

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
