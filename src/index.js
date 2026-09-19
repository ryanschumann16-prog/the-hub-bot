require("dotenv").config();

const {
  Client, GatewayIntentBits, REST, Routes, PermissionFlagsBits,
  SlashCommandBuilder, ChannelType, EmbedBuilder
} = require("discord.js");
const extra=require("./extra");

const token=process.env.DISCORD_TOKEN, guildId=process.env.DISCORD_GUILD_ID;
if(!token||!guildId){console.error("Missing DISCORD_TOKEN or DISCORD_GUILD_ID.");process.exit(1);}

const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent,GatewayIntentBits.GuildVoiceStates]});

const staffRoles=["Owner","Co-owner","Manager","Administrator","Moderator","Helper"];
const path=require("path"),fs=require("fs");
const dataDir=path.join(__dirname,"..","data");fs.mkdirSync(dataDir,{recursive:true});
const dataFile=path.join(dataDir,"store.json");
const defaultDb={warnings:{},birthdays:{},levels:{},reminders:[],afk:{},giveaways:{},suggestions:{},applications:{},customCommands:{},sticky:{},tickets:{},config:{automod:false,badWords:[],leveling:true}};
let db={...defaultDb};try{if(fs.existsSync(dataFile))db={...defaultDb,...JSON.parse(fs.readFileSync(dataFile,"utf8"))};}catch(e){console.error("Could not load data:",e)}
function save(){fs.writeFileSync(dataFile,JSON.stringify(db,null,2));}
globalThis.__THE_HUB_DB=db;globalThis.__THE_HUB_SAVE=save;
const voiceConnections={},voicePlayers={};

const commands=[
new SlashCommandBuilder().setName("ping").setDescription("Check bot latency."),
new SlashCommandBuilder().setName("help").setDescription("Show bot commands."),
new SlashCommandBuilder().setName("serverinfo").setDescription("Show server information."),
new SlashCommandBuilder().setName("membercount").setDescription("Show the member count."),
new SlashCommandBuilder().setName("userinfo").setDescription("Show user information.").addUserOption(o=>o.setName("user").setDescription("User to inspect.")),
new SlashCommandBuilder().setName("avatar").setDescription("Show a user's avatar.").addUserOption(o=>o.setName("user").setDescription("User.")),
new SlashCommandBuilder().setName("msg").setDescription("Send a message as The Hub bot.")
 .addChannelOption(o=>o.setName("channel").setDescription("Channel.").setRequired(true))
 .addStringOption(o=>o.setName("message").setDescription("Message.").setRequired(true))
 .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
new SlashCommandBuilder().setName("create-channel").setDescription("Create a text channel.")
 .addStringOption(o=>o.setName("name").setDescription("Channel name.").setRequired(true))
 .addChannelOption(o=>o.setName("category").setDescription("Optional category.").addChannelTypes(ChannelType.GuildCategory))
 .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
new SlashCommandBuilder().setName("delete-channel").setDescription("Delete a channel.")
 .addChannelOption(o=>o.setName("channel").setDescription("Channel.").setRequired(true))
 .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
new SlashCommandBuilder().setName("rename-channel").setDescription("Rename the current channel.")
 .addStringOption(o=>o.setName("name").setDescription("New name.").setRequired(true))
 .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
new SlashCommandBuilder().setName("clear").setDescription("Delete recent messages.")
 .addIntegerOption(o=>o.setName("amount").setDescription("1-100.").setRequired(true).setMinValue(1).setMaxValue(100))
 .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
new SlashCommandBuilder().setName("purge").setDescription("Delete recent messages.")
 .addIntegerOption(o=>o.setName("amount").setDescription("1-100.").setRequired(true).setMinValue(1).setMaxValue(100))
 .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
new SlashCommandBuilder().setName("slowmode").setDescription("Set channel slowmode.")
 .addIntegerOption(o=>o.setName("seconds").setDescription("0-21600.").setRequired(true).setMinValue(0).setMaxValue(21600))
 .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
new SlashCommandBuilder().setName("lock").setDescription("Lock the current channel.").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
new SlashCommandBuilder().setName("unlock").setDescription("Unlock the current channel.").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
new SlashCommandBuilder().setName("timeout").setDescription("Timeout a member.")
 .addUserOption(o=>o.setName("user").setDescription("Member.").setRequired(true))
 .addIntegerOption(o=>o.setName("minutes").setDescription("1-40320 minutes.").setRequired(true).setMinValue(1).setMaxValue(40320))
 .addStringOption(o=>o.setName("reason").setDescription("Reason.")),
new SlashCommandBuilder().setName("untimeout").setDescription("Remove a timeout.")
 .addUserOption(o=>o.setName("user").setDescription("Member.").setRequired(true)),
new SlashCommandBuilder().setName("kick").setDescription("Kick a member.")
 .addUserOption(o=>o.setName("user").setDescription("Member.").setRequired(true))
 .addStringOption(o=>o.setName("reason").setDescription("Reason.")),
new SlashCommandBuilder().setName("ban").setDescription("Ban a member.")
 .addUserOption(o=>o.setName("user").setDescription("Member.").setRequired(true))
 .addStringOption(o=>o.setName("reason").setDescription("Reason.")),
new SlashCommandBuilder().setName("unban").setDescription("Unban a user.")
 .addStringOption(o=>o.setName("user_id").setDescription("User ID.").setRequired(true)),
new SlashCommandBuilder().setName("nick").setDescription("Change a member nickname.")
 .addUserOption(o=>o.setName("user").setDescription("Member.").setRequired(true))
 .addStringOption(o=>o.setName("nickname").setDescription("New nickname.")),
].map(c=>c.toJSON());
const allCommands=[...commands,...extra.commands.map(c=>c.toJSON())];

async function registerCommands(){
 const rest=new REST({version:"10"}).setToken(token);
 await rest.put(Routes.applicationGuildCommands(client.user.id,guildId),{body:allCommands});
 console.log("Slash commands registered: "+allCommands.length);
 console.log("Systems loaded: tickets, automod, welcome/goodbye, birthdays, leveling, giveaways, suggestions, applications, reminders, AFK, starboard, sticky, custom commands, announcements, roles, staff tools.");
}

function memberHasStaffRole(member){
 return member.roles.cache.some(r=>staffRoles.includes(r.name));
}
function cleanName(name){
 return name.toLowerCase().replace(/[^a-z0-9-_]/g,"-").slice(0,100)||"new-channel";
}
function targetMember(interaction,user){
 return interaction.guild.members.cache.get(user.id);
}

client.once("ready",async()=>{
 console.log("Logged in as "+client.user.tag);
 try{await registerCommands();}catch(e){console.error("Command registration failed:",e);}
 try{extra.init({client,db:globalThis.__THE_HUB_DB,save:globalThis.__THE_HUB_SAVE,voiceConnections,voicePlayers});}catch(e){console.error("Extra systems init failed:",e);}
});

client.on("interactionCreate",async interaction=>{
 if(!interaction.isChatInputCommand())return;
 try{
  const n=interaction.commandName;
  if(await extra.handle(interaction,{client,db,save,voiceConnections,voicePlayers}))return;

  if(n==="ping")return interaction.reply({content:"Pong! "+client.ws.ping+"ms",ephemeral:true});

  if(n==="help"){
   const groups=[
    ["Utility","/ping /help /serverinfo /membercount /userinfo /avatar"],
    ["Channels","/create-channel /delete-channel /rename-channel /clear /purge /slowmode /lock /unlock /lockdown /unlockdown /move"],
    ["Moderation","/warn /warnings /clearwarnings /timeout /untimeout /kick /ban /unban /softban /nick"],
    ["Tickets","/ticket open /ticket panel /ticket settings /close /add /remove /claim /unclaim /rename /transcript"],
    ["Automod","/automod enable /automod disable /automod status /automod config"],
    ["Welcome & Goodbye","/welcome config /welcome test /goodbye config /goodbye test"],
    ["Birthdays","/birthday set /birthday remove /birthday view /birthday list /birthday upcoming /birthday today /birthday config /birthday test"],
    ["Leveling","/level view /level rank /level leaderboard /level config /level rewards"],
    ["Giveaways","/giveaway start /giveaway end /giveaway reroll /giveaway cancel /giveaway enter /giveaway list"],
    ["Community","/suggest /suggestions /suggestion-approve /suggestion-deny /suggestion-review /apply staff /apply partner /apply creator"],
    ["Tools","/remind /reminders /reminder-delete /afk /afk-remove /afk-list /starboard /starboard-disable /sticky /sticky-remove /sticky-list"],
    ["Management","/customcommand add /customcommand remove /customcommand list /customcommand edit /announce /announcement-edit /announcement-delete /addrole /removerole /role create /role delete /role add /role remove /role info /role list"],
    ["Staff","/staffinfo /staffannounce /staffnotes /report /reports /modstats /stafflist /msg"]
   ];
   const e=new EmbedBuilder().setTitle("The Hub Bot").setDescription("All available The Hub systems").addFields(groups.map(([name,value])=>({name,value})));
   return interaction.reply({embeds:[e],ephemeral:true});
  }

  if(n==="serverinfo"){
   const g=interaction.guild;
   const e=new EmbedBuilder().setTitle(g.name).addFields(
    {name:"Owner",value:"<@"+g.ownerId+">",inline:true},
    {name:"Members",value:String(g.memberCount),inline:true},
    {name:"Channels",value:String(g.channels.cache.size),inline:true},
    {name:"Roles",value:String(g.roles.cache.size),inline:true},
    {name:"Created",value:"<t:"+Math.floor(g.createdTimestamp/1000)+":D>",inline:true}
   );
   if(g.iconURL())e.setThumbnail(g.iconURL());
   return interaction.reply({embeds:[e],ephemeral:true});
  }

  if(n==="membercount")return interaction.reply({content:"The Hub has **"+interaction.guild.memberCount+"** members.",ephemeral:true});

  if(n==="userinfo"){
   const u=interaction.options.getUser("user")||interaction.user;
   const m=interaction.guild.members.cache.get(u.id);
   const e=new EmbedBuilder().setTitle(u.tag).setThumbnail(u.displayAvatarURL())
    .addFields(
     {name:"User ID",value:u.id,inline:true},
     {name:"Joined",value:m?"<t:"+Math.floor(m.joinedTimestamp/1000)+":F>":"Not cached",inline:true},
     {name:"Account created",value:"<t:"+Math.floor(u.createdTimestamp/1000)+":F>",inline:true}
    );
   return interaction.reply({embeds:[e],ephemeral:true});
  }

  if(n==="avatar"){
   const u=interaction.options.getUser("user")||interaction.user;
   return interaction.reply({content:u.displayAvatarURL({size:1024}),ephemeral:true});
  }

  if(n==="msg"){
   if(!memberHasStaffRole(interaction.member))return interaction.reply({content:"You need a staff role to use this command.",ephemeral:true});
   const ch=interaction.options.getChannel("channel",true), msg=interaction.options.getString("message",true);
   if(!ch.isTextBased()||!ch.send)return interaction.reply({content:"That channel cannot receive messages.",ephemeral:true});
   await ch.send({content:msg,allowedMentions:{parse:[]}}); return interaction.reply({content:"Message sent.",ephemeral:true});
  }

  if(n==="create-channel"){
   const ch=await interaction.guild.channels.create({name:cleanName(interaction.options.getString("name",true)),type:ChannelType.GuildText,parent:interaction.options.getChannel("category")?.id||null});
   return interaction.reply({content:"Created "+ch.toString()+".",ephemeral:true});
  }

  if(n==="delete-channel"){
   const ch=interaction.options.getChannel("channel",true); await ch.delete("Deleted by The Hub staff"); return;
  }

  if(n==="rename-channel"){
   const name=cleanName(interaction.options.getString("name",true)); await interaction.channel.setName(name);
   return interaction.reply({content:"Renamed channel to "+name+".",ephemeral:true});
  }

  if(n==="clear"||n==="purge"){
   const amount=interaction.options.getInteger("amount",true), deleted=await interaction.channel.bulkDelete(amount,true);
   return interaction.reply({content:"Deleted "+deleted.size+" messages.",ephemeral:true});
  }

  if(n==="slowmode"){
   const s=interaction.options.getInteger("seconds",true); await interaction.channel.setRateLimitPerUser(s);
   return interaction.reply({content:"Slowmode set to "+s+" seconds.",ephemeral:true});
  }

  if(n==="lock"||n==="unlock"){
   const locked=n==="lock";
   await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone,{SendMessages:locked?false:null});
   return interaction.reply({content:locked?"Channel locked.":"Channel unlocked.",ephemeral:true});
  }

  if(["timeout","untimeout","kick","ban","nick"].includes(n)){
   const user=interaction.options.getUser("user",true), member=targetMember(interaction,user);
   if(!member)return interaction.reply({content:"That member is not available in this server.",ephemeral:true});
   if(member.id===interaction.user.id)return interaction.reply({content:"You cannot use this action on yourself.",ephemeral:true});
   if(!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)&&!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)&&!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)&&!memberHasStaffRole(interaction.member))
    return interaction.reply({content:"You do not have permission for this moderation action.",ephemeral:true});
   if(n==="timeout"){
    const min=interaction.options.getInteger("minutes",true), reason=interaction.options.getString("reason")||"No reason provided";
    await member.timeout(min*60*1000,reason); return interaction.reply({content:"Timed out "+user.tag+" for "+min+" minutes.",ephemeral:true});
   }
   if(n==="untimeout"){await member.timeout(null,"Timeout removed");return interaction.reply({content:"Removed timeout from "+user.tag+".",ephemeral:true});}
   if(n==="kick"){await member.kick(interaction.options.getString("reason")||"No reason provided");return interaction.reply({content:"Kicked "+user.tag+".",ephemeral:true});}
   if(n==="ban"){await member.ban({reason:interaction.options.getString("reason")||"No reason provided"});return interaction.reply({content:"Banned "+user.tag+".",ephemeral:true});}
   if(n==="nick"){const nick=interaction.options.getString("nickname");await member.setNickname(nick);return interaction.reply({content:"Nickname updated.",ephemeral:true});}
  }

  if(n==="unban"){
   const id=interaction.options.getString("user_id",true);
   await interaction.guild.members.unban(id); return interaction.reply({content:"Unbanned user "+id+".",ephemeral:true});
  }
 }catch(error){
  console.error(error);
  const response={content:"Something went wrong. Check bot permissions and logs.",ephemeral:true};
  if(interaction.replied||interaction.deferred)await interaction.followUp(response).catch(()=>{});
  else await interaction.reply(response).catch(()=>{});
 }
});

client.login(token);

function joinLeaveChannel(guild,id){
 if(id)return guild.channels.cache.get(id);
 return guild.systemChannel||guild.channels.cache.find(c=>c.name==="general"&&c.isTextBased())||guild.channels.cache.find(c=>c.isTextBased()&&c.permissionsFor(client.user)?.has(PermissionFlagsBits.SendMessages));
}
client.on("guildMemberAdd",async member=>{
 const ch=joinLeaveChannel(member.guild,db.config.welcome);
 if(ch?.isTextBased())await ch.send("👋 Hi "+member+"! Welcome to **"+member.guild.name+"**!").catch(()=>{});
});
client.on("guildMemberRemove",async member=>{
 const ch=joinLeaveChannel(member.guild,db.config.goodbye);
 if(ch?.isTextBased())await ch.send("👋 Bye **"+member.user.tag+"**! We'll see you next time.").catch(()=>{});
});
client.on("messageCreate",async message=>{
 if(!message.guild||message.author.bot)return;
 const k=message.guild.id+":"+message.author.id;
 if(db.afk[k]){delete db.afk[k];save();await message.reply("Welcome back! Your AFK status was removed.").catch(()=>{});}
 for(const [key,reason] of Object.entries(db.afk))if(key.startsWith(message.guild.id+":")&&message.mentions.users.has(key.split(":")[1]))await message.reply("<@"+key.split(":")[1]+"> is AFK: "+reason).catch(()=>{});
 if(db.config.automod&&(db.config.badWords||[]).some(w=>message.content.toLowerCase().includes(w))){
  if(!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)){await message.delete().catch(()=>{});const x=await message.channel.send("Your message was removed by automod.").catch(()=>null);if(x)setTimeout(()=>x.delete().catch(()=>{}),4000);}
  return;
 }
 if(db.config.leveling!==false){
  if(!db.levels[k])db.levels[k]={xp:0,level:0};
  db.levels[k].xp+=Math.floor(Math.random()*11)+10;
  const need=100+db.levels[k].level*50;
  if(db.levels[k].xp>=need){db.levels[k].xp-=need;db.levels[k].level++;await message.channel.send("🎉 "+message.author+" reached level **"+db.levels[k].level+"**!").catch(()=>{});}
  save();
 }
 const custom=db.customCommands[message.guild.id]?.[message.content.trim().toLowerCase()];
 if(custom)await message.channel.send(custom).catch(()=>{});
 const sticky=db.sticky[message.channel.id];
 if(sticky){const x=await message.channel.send(sticky.message).catch(()=>null);if(x){sticky.lastMessage=x.id;save();}}
});
