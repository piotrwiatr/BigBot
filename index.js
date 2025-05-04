import { db, isUser, getUser, updateUser } from "./db.js";
import 'dotenv/config';
import { Client } from 'discord.js-selfbot-v13';
const client = new Client();

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);
});

client.on("messageCreate", async (msg) => {
    if (msg.guildId !== "886814488228139008") {
        return;
    }

    const isRegistered = await isUser(msg.author.id)

    if (msg.content === "?register") {
        if (db.data !== null && !isRegistered) {
            const data = {
                "userId": msg.author.id,
                "lastClaim": 0,
                "lastBeg": 0,
                "balance": 0
            };

            await db.update(({users}) => users.push(data));
            msg.reply("You have been successfully registered.");
        } else msg.reply("You cannot register more than once.");
    } 
    else if (msg.content.startsWith("?flip")) {
        if (!isRegistered) {
            msg.reply("In order to gamble, you must be registered. Please register using the command ?register");
            return;
        }

        const user = await getUser(msg.author.id);
        const params = msg.content.split(" ");
        
        if (params.length !== 3) {
            msg.reply("Incorrect number of parameters.");
            return;
        }

        if (params[1] !== "heads" && params[1] !== "tails" && params[1] !== "side") {
            msg.reply("You must bet on either heads, tails, or side.");
        }

        const bettingAmount = parseInt(params[2]);

        if (bettingAmount === null || bettingAmount <= 0) {
            msg.reply("Please enter a positive value to bet on.");
            return;
        }

        if (bettingAmount > user.balance) {
            msg.reply("Insufficient funds, broke boi.");
            return;
        }

        const flipOutcome = Math.floor(Math.random() * 100);
        let result;

        if (0 <= flipOutcome && flipOutcome <= 48) {
            result = "heads";
        } else if (49 <= flipOutcome && flipOutcome <= 50) {
            result = "side";
        } else {
            result = "tails";
        }

        let winningBalance;
        if (result === params[1]) {
            if (result === "side") {
                winningBalance = 10*bettingAmount;
            } else {
                winningBalance = bettingAmount;
            }
            msg.reply(`The result was ${result} and you guessed ${params[1]}. You win ${winningBalance}`)
        } else {
            winningBalance = -1*bettingAmount;
            msg.reply(`The result was ${result} but you guessed ${params[1]}. You lost ${bettingAmount}`);
        }

        user.balance += winningBalance;
        await updateUser(user);

    }
    else if (msg.content === "?claim") {
        if (!isRegistered) {
            msg.reply("In order to claim your daily amount, you must register.");
            return;
        }

        const user = await getUser(msg.author.id);

        const msInDay = 1000 * 60 * 60 * 6;
        const currentTime = Date.now();

        if (currentTime - user.lastClaim <= msInDay) {
            msg.reply(`You cannot claim so soon. Try again in:  ${Math.floor((user.lastClaim + msInDay - currentTime) / 1000)} seconds.`);
            return;
        }

        const outcome = Math.floor(Math.random() * 100) + 1;
        let claimAmount;

        if (1 <= outcome && outcome <= 50) {
            claimAmount = 100;
        } else if (outcome <= 85) {
            claimAmount = 200;
        } else if (outcome <= 95) {
            claimAmount = 400;
        } else if (outcome <= 99) {
            claimAmount = 800;
        } else {
            claimAmount = 1600;
        }

        user.balance += claimAmount;
        user.lastClaim = currentTime;

        msg.reply(`You have successfully claimed ${claimAmount} big coins. Your balance is now ${user.balance}`);

        await updateUser(user);
    }
    else if (msg.content === "?balance" || msg.content === "?bal") {
        if (!isRegistered) {
            msg.reply("How tf would u have a balance if u aren't registered? Bozo.");
            return;
        }
        const user = await getUser(msg.author.id);
        msg.reply(`You have: ${user.balance} big coins`);
    }
    else if (msg.content === "?beg") {
        if (!isRegistered) {
            msg.reply("REGISTER OR DIE");
            return;
        }

        const user = await getUser(msg.author.id);

        const delay = 1000 * 60 * 5; // able to beg every 5 minutes
        const currentTime = Date.now();

        if (currentTime - user.lastBeg <= delay) {
            msg.reply(`You cannot claim so soon. Try again in:  ${Math.floor((user.lastBeg + delay - currentTime) / 1000)} seconds.`);
            return;
        }

        const outcome = Math.floor(Math.random() * 100) + 1;
        let begAmount;

        if (1 <= outcome && outcome <= 49) {
            begAmount = 0;
        } else if (outcome <= 98) {
            begAmount = 1;
        } else {
            begAmount = 100;
        }

        msg.reply(`You have begged and got ${begAmount}`);
        user.balance += begAmount;
        user.lastBeg = currentTime;
        await updateUser(user);
    }
    else if (msg.content === "?leaderboard") {
        await db.read();
        const users = db.data.users;
        users.toSorted((a,b) => {
            if (a.balance > b.balance) return -1;
            return 1;
        })

        let strOutput = "";
        for (let i = 0; i < Math.min(users.length, 10); i++) {
            let user = await client.users.fetch(users[i].userId).catch(console.error);
            strOutput += `${i}. ${user.username} with ${users[i].balance} big coins\n`;
        }
        msg.reply(strOutput);
    }
});

client.login(process.env.USERTOKEN);