const ModLog = require("./../../Modules/ModerationLogging.js");

module.exports = (bot, db, config, winston, userDocument, serverDocument, channelDocument, memberDocument, msg, suffix) => {
	if(suffix) {
		let member, reason;
		if(suffix.indexOf("|")>-1 && suffix.length>3) {
			member = bot.memberSearch(suffix.substring(0, suffix.indexOf("|")).trim(), msg.guild);
			reason = suffix.substring(suffix.indexOf("|")+1).trim();
		} else {
			member = bot.memberSearch(suffix, msg.guild);
		}

		if(member) {
			if(bot.isMuted(msg.channel, member)) {
				bot.unmuteMember(msg.channel, member, err => {
					if(err) {
						winston.error(`Failed to unmute member '${member.user.username}' in channel '${msg.channel.name}' from server '${msg.guild.name}'`, {svrid: msg.guild.name, usrid: member.id}, err);
						msg.channel.createMessage(`I couldn't unmute **@${bot.getName(msg.guild, serverDocument, member)}** in this channel 😴`);
					} else {
						msg.channel.createMessage(`**@${bot.getName(msg.guild, serverDocument, member)}** can speak in #${msg.channel.name} now 🔈`);
						ModLog.create(msg.guild, serverDocument, "Unmute", member, msg.member, reason);
					}
				});
			} else {
				msg.channel.createMessage(`**@${bot.getName(msg.guild, serverDocument, member)}** isn't muted, so I can't unmute them! 🤓`);
			}
		} else {
			msg.channel.createMessage("I couldn't find a matching member on this server.");
		}
	} else {
		msg.channel.createMessage("Huh? You're not muted! 😮");
	}
};
