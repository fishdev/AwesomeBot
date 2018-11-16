const Lotteries = require("./../../Modules/Lotteries.js");
const moment = require("moment");

module.exports = (bot, db, config, winston, userDocument, serverDocument, channelDocument, memberDocument, msg, suffix, commandData) => {
	const showNotStarted = () => {
		msg.channel.createMessage(`There isn't an AwesomePoints lottery going on rn. Use \`${bot.getCommandPrefix(msg.guild, serverDocument)}${commandData.name} start\` to start one.`);
	};
	
	if(suffix) {
		switch(suffix.toLowerCase()) {
			case "start":
				if(channelDocument.lottery.isOngoing) {
					const participantCount = channelDocument.lottery.participant_ids.filter((elem, i, self) => {
						return i==self.indexOf(elem);
					}).length;
					msg.channel.createMessage(`There's already a lottery going on in this channel, with ${participantCount} ${participantCount==1 ? "person" : "people"} currently enrolled. 👍 Wait for it to end before starting a new one.`);
				} else {
					Lotteries.start(db, msg.guild, serverDocument, msg.author, msg.channel, channelDocument);
					msg.channel.createMessage(`AwesomePoints lottery started! 🌟 Anyone can use \`${bot.getCommandPrefix(msg.guild, serverDocument)}${commandData.name} enroll\` for a chance to win! 🤑 The winner will be announced ${moment(channelDocument.lottery.expiry_timestamp).fromNow()}`);
				}
				break;
			case "enroll":
				if(channelDocument.lottery.isOngoing) {
					const ticketPrice = Math.floor(channelDocument.lottery.participant_ids.length * Lotteries.multiplier);
					if(userDocument.points>=ticketPrice) {
						const userTicketCount = channelDocument.lottery.participant_ids.reduce((n, usrid) => {
							return n + (usrid==msg.author.id);
						}, 0);
						if(userTicketCount>5) {
							msg.channel.createMessage(`You can't buy more than 5 lottery tickets ${msg.author.mention}.`);
						} else {
							userDocument.points -= ticketPrice;
							userDocument.save(err => {
								if(err) {
									winston.error("Failed to save user data for lottery ticket purchase", {usrid: msg.author.id}, err);
								}
								channelDocument.lottery.participant_ids.push(msg.author.id);
								serverDocument.save(err => {
									if(err) {
										winston.error("Failed to save server data for points lottery", {svrid: msg.guild.id}, err);
									}
									msg.channel.createMessage(`Thank you for purchasing an AwesomePoints™ lottery ticket ${msg.author.mention}! 🎟 That cost you ${ticketPrice} point${ticketPrice==1 ? "" : "s"} - no refunds. The winner will be announced ${moment(channelDocument.lottery.expiry_timestamp).fromNow()}.`);
								});
							});
						}
					} else {
						msg.channel.createMessage(`${msg.author.mention} You're not rich enough to participate in the 1%-only lottery 😔`);
					}
				} else {
					showNotStarted();
				}
				break;
			case "end":
			case ".":
				if(channelDocument.lottery.isOngoing) {
					if(channelDocument.lottery.creator_id==msg.author.id || bot.getUserBotAdmin(msg.guild, serverDocument, msg.member)>=1) {
						const winner = Lotteries.end(db, msg.guild, serverDocument, msg.channel, channelDocument);
						if(!winner) {
							msg.channel.createMessage("Lottery ended. No one won, though ");
						}
					}
				} else {
					showNotStarted();
				}
				break;
			default:
				winston.warn(`Invalid parameters '${suffix}' provided for ${commandData.name} command`, {svrid: msg.guild.id, chid: msg.channel.id, usrid: msg.author.id});
				msg.channel.createMessage(`${msg.author.mention} Wut. 😱 The syntax for this command is \`${bot.getCommandPrefix(msg.guild, serverDocument)}${commandData.name} ${commandData.usage}\``);
				break;
		}
	} else {
		if(channelDocument.lottery.isOngoing) {
			const creator = msg.guild.members.get(channelDocument.lottery.creator_id);
			const participantCount = channelDocument.lottery.participant_ids.filter((elem, i, self) => {
				return i==self.indexOf(elem);
			}).length;
			msg.channel.createMessage(`AwesomePoints lottery started by @${creator ? bot.getName(msg.guild, serverDocument, creator) : "invalid-user"}. 💸 ${participantCount} ${participantCount==1 ? "person" : "people"} currently enrolled. The winner will be announced ${moment(channelDocument.lottery.expiry_timestamp).fromNow()}.`);
		} else {
			showNotStarted();
		}
	}
};
