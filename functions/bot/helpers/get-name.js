module.exports = function getName(ctx) {
	const { first_name, last_name, username } = ctx.from

	return last_name || first_name || username
}
