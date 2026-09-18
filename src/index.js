require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ChannelType,
  EmbedBuilder
} = require("discord.js");

const token = process.env.DISCORD_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !guildId) {
  console.error("Missing DISCORD_TOKEN or DISCORD_GUILD_ID.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Check bot latency."),
  new SlashCommandBuilder().setName("help").setDescription("Show bot commands."),
  new SlashCommandBuilder()
    .setName("msg").setDescription("Send a message as The Hub bot.")
    .addChannelOption(o => o.setName("channel").setDescription("Channel to send it in.").setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("Message to send.").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("create-channel").setDescription("Create a text channel.")
    .addStringOption(o => o.setName("name").setDescription("Channel name.").setRequired(true))
    .addChannelOption(o => o.setName("category").setDescription("Optional category.").addChannelTypes(ChannelType.GuildCategory))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder()
    .setName("delete-channel").setDescription("Delete a channel.")
    .addChannelOption(o => o.setName("channel").setDescription("Channel to delete.").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder()
    .setName("rename-channel").setDescription("Rename the current channel.")
    .addStringOption(o => o.setName("name").setDescription("New channel name.").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder()
    .setName("clear").setDescription("Delete recent messages.")
    .addIntegerOption(o => o.setName("amount").setDescription("1-100 messages.").setRequired(true).setMinValue(1).setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  new SlashCommandBuilder()
    .setName("slowmode").setDescription("Set channel slowmode.")
    .addIntegerOption(o => o.setName("seconds").setDescription("0-21600 seconds.").setRequired(true).setMinValue(0).setMaxValue(21600))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder().setName("lock").setDescription("Lock the current channel.").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder().setName("unlock").setDescription("Unlock the current channel.").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
].map(command => command.toJSON());

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(token);
  await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: commands });
  console.log("Slash commands registered.");
}

client.once("ready", async () => {
  console.log("Logged in as " + client.user.tag);
  try {
    await registerCommands();
  } catch (error) {
    console.error("Command registration failed:", error);
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (interaction.commandName === "ping") {
      return interaction.reply({ content: "Pong! " + client.ws.ping + "ms", ephemeral: true });
    }

    if (interaction.commandName === "help") {
      const embed = new EmbedBuilder()
        .setTitle("The Hub Bot")
        .setDescription("Current commands")
        .addFields(
          { name: "Utility", value: "/ping\n/help" },
          { name: "Staff", value: "/msg\n/create-channel\n/delete-channel\n/rename-channel\n/clear\n/slowmode\n/lock\n/unlock" }
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.commandName === "msg") {
      const channel = interaction.options.getChannel("channel", true);
      const message = interaction.options.getString("message", true);
      if (!channel.isTextBased() || !channel.send) {
        return interaction.reply({ content: "That channel cannot receive messages.", ephemeral: true });
      }
      await channel.send({ content: message, allowedMentions: { parse: [] } });
      return interaction.reply({ content: "Message sent.", ephemeral: true });
    }

    if (interaction.commandName === "create-channel") {
      const rawName = interaction.options.getString("name", true);
      const name = rawName.toLowerCase().replace(/[^a-z0-9-_]/g, "-").slice(0, 100);
      const category = interaction.options.getChannel("category");
      const channel = await interaction.guild.channels.create({
        name,
        type: ChannelType.GuildText,
        parent: category ? category.id : null
      });
      return interaction.reply({ content: "Created " + channel.toString() + ".", ephemeral: true });
    }

    if (interaction.commandName === "delete-channel") {
      const channel = interaction.options.getChannel("channel", true);
      await channel.delete("Deleted by The Hub staff");
      return;
    }

    if (interaction.commandName === "rename-channel") {
      const rawName = interaction.options.getString("name", true);
      const name = rawName.toLowerCase().replace(/[^a-z0-9-_]/g, "-").slice(0, 100);
      await interaction.channel.setName(name);
      return interaction.reply({ content: "Renamed channel to " + name + ".", ephemeral: true });
    }

    if (interaction.commandName === "clear") {
      const amount = interaction.options.getInteger("amount", true);
      const deleted = await interaction.channel.bulkDelete(amount, true);
      return interaction.reply({ content: "Deleted " + deleted.size + " messages.", ephemeral: true });
    }

    if (interaction.commandName === "slowmode") {
      const seconds = interaction.options.getInteger("seconds", true);
      await interaction.channel.setRateLimitPerUser(seconds);
      return interaction.reply({ content: "Slowmode set to " + seconds + " seconds.", ephemeral: true });
    }

    if (interaction.commandName === "lock" || interaction.commandName === "unlock") {
      const locked = interaction.commandName === "lock";
      await interaction.channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        { SendMessages: locked ? false : null }
      );
      return interaction.reply({ content: locked ? "Channel locked." : "Channel unlocked.", ephemeral: true });
    }
  } catch (error) {
    console.error(error);
    const response = { content: "Something went wrong. Check bot permissions and logs.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(response).catch(() => {});
    } else {
      await interaction.reply(response).catch(() => {});
    }
  }
});

client.login(token);