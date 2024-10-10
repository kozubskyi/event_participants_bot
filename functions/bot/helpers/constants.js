const { KOZUBSKYI_CHAT_ID } = process.env

const constants = Object.freeze({
	CREATOR_USERNAME: 'kozubskyi',
	CREATOR_CHAT_ID: Number(KOZUBSKYI_CHAT_ID),

	PLUS: '➕',
	PLUS_MINUS: '➕➖',
	MINUS: '➖',
	PLUS_FRIEND: '+ 1',
	PLUS_MINUS_FRIEND: '± 1',
	MINUS_FRIEND: '- 1',
	FINISH_EVENT: '❌ Завершити подію',
})

module.exports = constants
