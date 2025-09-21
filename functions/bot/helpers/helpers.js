const { Markup } = require('telegraf')
const { DateTime } = require('luxon')
const { getEvent } = require('../services/events-api')
const { PLUS_FRIEND } = require('./constants')
const {
	PLUS_BUTTON,
	PLUS_MINUS_BUTTON,
	MINUS_BUTTON,
	PLUS_FRIEND_BUTTON,
	// PLUS_MINUS_FRIEND_BUTTON,
	MINUS_FRIEND_BUTTON,
	UPDATE_BUTTON,
	SETTINGS_BUTTON,
	// FINISH_EVENT_BUTTON,
} = require('./buttons')
const deleteMessage = require('./delete-message')

const getName = user => {
	const { first_name, last_name, username, name } = user
	return last_name || first_name || username || name
}

const getDate = dateTimeStr => {
	return dateTimeStr ? DateTime.fromFormat(dateTimeStr, 'dd.MM.yyyy, HH:mm', { zone: 'Europe/Kyiv' }) : null
}

const checkEventExistence = async ctx => {
	const splitted = ctx.callbackQuery.message.text.split('\n')
	const title = splitted[0]

	const event = await getEvent({
		chatId: ctx.chat.id,
		title,
		start: splitted.find(el => el.includes('Початок:')).replace('Початок: ', ''),
	})

	if (!event) {
		await deleteMessage(ctx)
		await ctx.replyWithHTML(`<b>${getName(ctx.from)}</b>, подія <b>${title}</b> вже не актуальна.`)
		return false
	}

	return event
}

const checkRegistrationTime = async (ctx, event) => {
	const { registrationStart, registrationEnd } = event

	const now = DateTime.now()

	if (registrationStart) {
		const registrationStartDate = getDate(registrationStart)

		if (now < registrationStartDate) {
			await ctx.replyWithHTML(`<b>${getName(ctx.from)}</b>, період реєстрації ще не розпочався.`)
			return false
		}
	}

	if (registrationEnd) {
		const registrationEndDate = getDate(registrationEnd)

		if (now > registrationEndDate) {
			await ctx.replyWithHTML(`<b>${getName(ctx.from)}</b>, період реєстрації вже закінчився.`)
			return false
		}
	}

	return true
}

const checkReserveDeadline = reserveDeadline => {
	const now = DateTime.now()
	const reserveDeadlineDate = getDate(reserveDeadline)

	return reserveDeadline && now > reserveDeadlineDate
}

const addFriend = (ctx, participants) => {
	const { id, username, first_name, last_name } = ctx.from
	const userName = getName(ctx.from)

	const decisions = {
		[PLUS_FRIEND]: '+',
		// [PLUS_MINUS_FRIEND]: '±',
	}

	const currentAddingFriend = {
		name: `${userName} +1`,
		chatId: id,
		username: null,
		first_name: null,
		last_name: null,
		decision: decisions[ctx.callbackQuery.data],
	}

	const lastAddedFriend = [...participants].findLast(
		({ chatId, name }) => chatId === id && name.includes(`${userName} +`)
	)

	if (lastAddedFriend) {
		const lastAddedFriendNumber = Number(lastAddedFriend.name.split(' ').findLast(el => el.includes('+')))

		currentAddingFriend.name = !isNaN(lastAddedFriendNumber)
			? `${userName} +${lastAddedFriendNumber + 1}`
			: `${userName} +1`
	}

	participants.push(currentAddingFriend)

	return participants
}

const prepareParticipants = (event, ctx) => {
	const { reserveDeadline, participantsMax, participantsMin, participants } = event

	let top = []
	let reserve = []
	let refused = []

	if (checkReserveDeadline(reserveDeadline)) {
		top = participants.filter(({ decision }) => decision === '+').map(({ name }, i) => `${i + 1}. ${name}`)
		// .map(({ chatId, name }, i) => `${i + 1}. <a href="tg://user?id=${chatId}">${name}</a>`)

		let reservePlus = []
		if (participantsMax && top.length > participantsMax) {
			reservePlus = top.splice(participantsMax || top.length)
		} else {
			if (participantsMax) {
				for (let i = top.length; i < participantsMax; i++) {
					top.push(`${i + 1}.`)
				}
			} else if (participantsMin) {
				for (let i = top.length; i < participantsMin; i++) {
					top.push(`${i + 1}.`)
				}
			}
		}

		reserve = [
			...reservePlus,
			...participants
				.filter(({ decision }) => decision === '±')
				.map(({ name }, i) => `${top.length + reservePlus.length + i + 1}. ${name} ±`),
			// .map(
			// 	({ chatId, name }, i) =>
			// 		`${top.length + reservePlus.length + i + 1}. <a href="tg://user?id=${chatId}">${name}</a> ±`
			// ),
		]
	} else {
		const notMinusParticipants = participants
			.filter(({ decision }) => decision !== '–')
			.map(({ name, decision }, i) => `${i + 1}. ${name} ${decision === '±' ? '±' : ''}`)
		// .map(
		// 	({ chatId, name, decision }, i) =>
		// 		`${i + 1}. <a href="tg://user?id=${chatId}">${name}</a> ${decision === '±' ? '±' : ''}`
		// )

		top = notMinusParticipants.slice(0, participantsMax || notMinusParticipants.length)
		if (participantsMax) {
			for (let i = top.length; i < participantsMax; i++) {
				top.push(`${i + 1}.`)
			}
		} else if (participantsMin) {
			for (let i = top.length; i < participantsMin; i++) {
				top.push(`${i + 1}.`)
			}
		}
		reserve = notMinusParticipants.slice(participantsMax || notMinusParticipants.length)
	}

	refused = participants.filter(({ decision }) => decision === '–').map(({ name }) => `${name} –`)
	// .map(({ chatId, name }) => `<a href="tg://user?id=${chatId}">${name}</a> –`)

	return { top, reserve, refused }
}

const getHeader = updatedEvent => {
	const {
		title,
		description,
		location,
		start,
		end,
		registrationStart,
		registrationEnd,
		reserveDeadline,
		participantsMin,
		participantsMax,
	} = updatedEvent

	return `
<b>${title}</b>
${description ? `Опис: ${description}\n` : ''}${location ? `Локація: ${location}\n` : ''}Початок: ${start}${
		end ? `\nКінець: ${end}` : ''
	}${registrationStart ? `\nПочаток реєстрації: ${registrationStart}` : ''}${
		reserveDeadline ? `\nРезерв до: ${reserveDeadline}` : ''
	}${registrationEnd ? `\nКінець реєстрації: ${registrationEnd}` : ''}${
		participantsMin ? `\nМінімум учасників: ${participantsMin}` : ''
	}${participantsMax ? `\nМаксимум учасників: ${participantsMax}` : ''}`
}

const sendReply = async (ctx, event, { top = [], reserve = [], refused = [] }) => {
	const reply = `
${getHeader(event)}

${top.length ? `${top.join('\n')}\n\n` : ''}${reserve.length ? `Резерв:\n${reserve.join('\n')}\n\n` : ''}${
		refused.length ? refused.join(', ') : ''
	}
`

	const buttons = Markup.inlineKeyboard([
		[PLUS_BUTTON, PLUS_MINUS_BUTTON, MINUS_BUTTON],
		// [PLUS_FRIEND_BUTTON, PLUS_MINUS_FRIEND_BUTTON, MINUS_FRIEND_BUTTON],
		[PLUS_FRIEND_BUTTON, MINUS_FRIEND_BUTTON],
		[UPDATE_BUTTON],
		// [FINISH_EVENT_BUTTON],
	])

	await ctx.replyWithHTML(reply, buttons)
}

module.exports = {
	getName,
	getDate,
	checkEventExistence,
	checkRegistrationTime,
	checkReserveDeadline,
	addFriend,
	prepareParticipants,
	sendReply,
}
