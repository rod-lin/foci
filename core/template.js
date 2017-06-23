
exports.event_apply = (title, job) => ({
	title: `You just applied for ${title}`,
	msg: `Thank you for applying for ${title} as a ${job}. You can find further info about the application status in your profile.`
})
