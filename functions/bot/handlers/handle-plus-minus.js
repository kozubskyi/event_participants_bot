const { Markup } = require('telegraf')
const { getEvent, updateEvent } = require('../services/events-api')
const getFullName = require('../helpers/get-full-name')
const checkRegistrationTime = require('../helpers/check-registration-time')
const formatDate = require('../helpers/format-date')
const deleteMessage = require('../helpers/delete-message')
const getHeader = require('../helpers/get-header')
const { KEYBOARD } = require('../helpers/buttons')
const { PLUS_MINUS, PLUS_MINUS_FRIEND } = require('../helpers/constants')
// const handleError = require('./handle-error')

module.exports = async function handlePlusMinus(ctx) {
	try {
		const splitted = ctx.callbackQuery.message.text.split('\n')
		splitted.splice(splitted.indexOf(' '))

		const title = splitted[0]

		const query = {
			chatId: ctx.chat.id,
			title,
			start: splitted[1].replace('Початок: ', ''),
		}

		const event = await getEvent(query)

		const fullName = getFullName(ctx)

		if (!event) {
			await deleteMessage(ctx)
			await ctx.replyWithHTML(`<b>${fullName}</b>, подія "${title}" вже не актуальна.`)
			return
		}

		let { participantsMax, participants, reserveDeadline } = event

		if (!(await checkRegistrationTime(ctx, event))) return

		if (ctx.callbackQuery.data === PLUS_MINUS) {
			const existingPlusIndex = participants.indexOf(fullName)
			const existingPlusMinusIndex = participants.indexOf(`${fullName} ±`)
			const existingMinusIndex = participants.indexOf(`${fullName} -`)

			if (existingPlusIndex + 1) {
				participants[existingPlusIndex] = `${fullName} ±`
			} else if (existingPlusMinusIndex + 1) {
				// await ctx.replyWithHTML(`<b>${fullName}</b>, ви вже є в списку.`)
				return
			} else if (existingMinusIndex + 1) {
				participants.splice(existingMinusIndex, 1)
				participants.push(`${fullName} ±`)
			} else {
				participants.push(`${fullName} ±`)
			}
		}

		let currentAddedFriend = `${fullName} +1 ±`

		if (ctx.callbackQuery.data === PLUS_MINUS_FRIEND) {
			const lastAddedFriend = [...participants].reverse().find(participant => participant.includes(`${fullName} +`))

			if (lastAddedFriend) {
				const lastAddedFriendNumber = Number(
					lastAddedFriend
						.split(' ')
						.reverse()
						.find(el => el.includes('+'))
				)

				currentAddedFriend = !isNaN(lastAddedFriendNumber)
					? `${fullName} +${lastAddedFriendNumber + 1} ±`
					: `${fullName} +1 ±`
			}

			participants.push(currentAddedFriend)
		}

		if (reserveDeadline) {
			const nowLocaleString = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })
			const now = new Date(formatDate(nowLocaleString))
			const deadline = new Date(formatDate(reserveDeadline))

			if (now > deadline) {
				await ctx.replyWithHTML(
					`<b>${fullName}</b>, період резерву місць закінчився ${reserveDeadline}. Зараз можна обирати тільки + або -.`
				)
				return
			}
		}

		const updatedEvent = await updateEvent(query, { participants })

		await deleteMessage(ctx)

		const notMinusParticipants = participants
			.filter(p => p[p.length - 1] !== '-')
			.map((p, i) => {
				if (
					(ctx.callbackQuery.data === PLUS_MINUS && p === `${fullName} ±`) ||
					(ctx.callbackQuery.data === PLUS_MINUS_FRIEND && p === currentAddedFriend)
				) {
					return `${i + 1}. <b>${p}</b>`
				} else {
					return `${i + 1}. ${p}`
				}
			})

		const top = notMinusParticipants.slice(0, participantsMax ?? notMinusParticipants.length)
		const reserve = notMinusParticipants.slice(participantsMax ?? notMinusParticipants.length)
		const refused = participants.filter(p => p[p.length - 1] === '-')

		const reply = `
${getHeader(updatedEvent)}

${top.length ? `${top.join('\n')}\n\n` : ''}${reserve.length ? `Резерв:\n${reserve.join('\n')}\n\n` : ''}${
			refused.length ? refused.join('\n') : ''
		}
`

		await ctx.replyWithHTML(reply, KEYBOARD)
	} catch (err) {
		console.log({ err })
	}
}
