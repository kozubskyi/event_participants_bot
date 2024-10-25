const { KOZUBSKYI_CHAT_ID } = process.env

const constants = Object.freeze({
	CREATOR_USERNAME: 'kozubskyi',
	CREATOR_CHAT_ID: Number(KOZUBSKYI_CHAT_ID),

	// PLUS: '➕',
	// PLUS_MINUS: '➕➖',
	// MINUS: '➖',
	PLUS: '👍 буду',
	PLUS_MINUS: '🤔 думаю',
	MINUS: '👎 не буду',

	PLUS_FRIEND: '+ за друга',
	PLUS_MINUS_FRIEND: '± за друга',
	MINUS_FRIEND: '– за друга',

	UPDATE: '🔄 Оновити',
	SETTINGS: '⚙️ Налаштування',
	FINISH_EVENT: '❌ Завершити подію',
})

module.exports = constants
