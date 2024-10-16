const { Markup } = require('telegraf')
const { PLUS, PLUS_MINUS, MINUS, PLUS_FRIEND, PLUS_MINUS_FRIEND, MINUS_FRIEND, FINISH_EVENT } = require('./constants')

const buttons = Object.freeze({
	PLUS_BUTTON: Markup.button.callback(PLUS, PLUS),
	PLUS_MINUS_BUTTON: Markup.button.callback(PLUS_MINUS, PLUS_MINUS),
	MINUS_BUTTON: Markup.button.callback(MINUS, MINUS),

	PLUS_FRIEND_BUTTON: Markup.button.callback(PLUS_FRIEND, PLUS_FRIEND),
	PLUS_MINUS_FRIEND_BUTTON: Markup.button.callback(PLUS_MINUS_FRIEND, PLUS_MINUS_FRIEND),
	MINUS_FRIEND_BUTTON: Markup.button.callback(MINUS_FRIEND, MINUS_FRIEND),

	FINISH_EVENT_BUTTON: Markup.button.callback(FINISH_EVENT, FINISH_EVENT),

	KEYBOARD: Markup.inlineKeyboard([
		[
			Markup.button.callback(PLUS, PLUS),
			Markup.button.callback(PLUS_MINUS, PLUS_MINUS),
			Markup.button.callback(MINUS, MINUS),
		],
		[
			Markup.button.callback(PLUS_FRIEND, PLUS_FRIEND),
			Markup.button.callback(PLUS_MINUS_FRIEND, PLUS_MINUS_FRIEND),
			Markup.button.callback(MINUS_FRIEND, MINUS_FRIEND),
		],
		// [Markup.button.callback(FINISH_EVENT, FINISH_EVENT)],
	]),
})

module.exports = buttons
