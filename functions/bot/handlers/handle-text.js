const getFullName = require('../helpers/get-full-name')
const { createEvent, getEvent, updateEvent, deleteEvent } = require('../services/events-api')
const getHeader = require('../helpers/get-header')
const sendInfoMessageToCreator = require('../helpers/send-info-message-to-creator')
const sendReply = require('../helpers/send-reply')
const cron = require('node-cron')
const getCronExp = require('../helpers/get-cron-expression')
const handleError = require('./handle-error')
const getDate = require('../helpers/get-date')

module.exports = async function handleText(ctx) {
	try {
		if (ctx.message.text.slice(0, 12) !== 'CREATE_EVENT') return

		const event = ctx.message.text
			.split('\n')
			.slice(1)
			.reduce((acc, line) => {
				const [key, value] = line.split(': ')

				if (key) acc[key] = isNaN(value) ? value : Number(value)

				return acc
			}, {})

		const { title, start, end, reserveDeadline, registrationEnd, participantsMin, participantsMax } = event

		const fullName = getFullName(ctx)

		if (!title || !start) return await ctx.replyWithHTML(`⚠️ <b>${fullName}</b>, невірно введені дані`)

		const now = new Date()
		const kyivOffset = 3 * 60 * 60 * 1000
		const nowInKyiv = new Date(now.getTime() + kyivOffset - now.getTimezoneOffset() * 60 * 1000)
		// const nowInKyiv = new Date()

		const startDate = getDate(start)
		if (nowInKyiv >= startDate) {
			return await ctx.replyWithHTML(
				`⚠️ <b>${fullName}</b>, старт події не може бути раніше ніж дата та час станом на зараз.`
			)
		}

		if (end) {
			const endDate = getDate(end)
			if (nowInKyiv >= endDate) {
				return await ctx.replyWithHTML(
					`⚠️ <b>${fullName}</b>, кінець події не може бути раніше ніж дата та час станом на зараз.`
				)
			}
		}

		if (registrationEnd) {
			const registrationEndDate = getDate(registrationEnd)
			if (nowInKyiv >= registrationEndDate) {
				return await ctx.replyWithHTML(
					`⚠️ <b>${fullName}</b>, кінець періоду реєстрації не може бути раніше ніж дата та час станом на зараз.`
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
		// 		reserve = top.splice(participantsMax ?? top.length)

		// 		await sendReply(ctx, updatedEvent, { top, reserve, refused })
		// 	},
		// 	options
		// )

		// cron.schedule(getCronExp(end ?? start), async () => await deleteEvent(query), options)
	} catch (err) {
		await handleError({ ctx, err })
	}
}
