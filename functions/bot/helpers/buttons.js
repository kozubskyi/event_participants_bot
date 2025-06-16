const { Markup } = require('telegraf')
const {
	PLUS,
	PLUS_MINUS,
	MINUS,
	PLUS_FRIEND,
	// PLUS_MINUS_FRIEND,
	MINUS_FRIEND,
	UPDATE,
	SETTINGS,
	FINISH_EVENT,
} = require('./constants')

const buttons = Object.freeze({
	PLUS_BUTTON: Markup.button.callback(PLUS, PLUS),
	PLUS_MINUS_BUTTON: Markup.button.callback(PLUS_MINUS, PLUS_MINUS),
	MINUS_BUTTON: Markup.button.callback(MINUS, MINUS),

	PLUS_FRIEND_BUTTON: Markup.button.callback(PLUS_FRIEND, PLUS_FRIEND),
	// PLUS_MINUS_FRIEND_BUTTON: Markup.button.callback(PLUS_MINUS_FRIEND, PLUS_MINUS_FRIEND),
	MINUS_FRIEND_BUTTON: Markup.button.callback(MINUS_FRIEND, MINUS_FRIEND),

	UPDATE_BUTTON: Markup.button.callback(UPDATE, UPDATE),
	SETTINGS_BUTTON: Markup.button.callback(SETTINGS, SETTINGS),
	FINISH_EVENT_BUTTON: Markup.button.callback(FINISH_EVENT, FINISH_EVENT),
})

module.exports = buttons
