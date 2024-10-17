module.exports = function getHeader(updatedEvent) {
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
