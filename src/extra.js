const {SlashCommandBuilder,PermissionFlagsBits: P,ChannelType,EmbedBuilder}=require("discord.js");
const commands=[],staff=["Owner","Co-owner","Manager","Administrator","Moderator","Helper"];
const S=(n,d,r=false)=>o=>o.setName(n).setDescription(d).setRequired(r);
const U=(n,d,r=false)=>o=>o.setName(n).setDescription(d).setRequired(r);
const C=(n,d,r=false)=>o=>o.setName(n).setDescription(d).setRequired(r);
const I=(n,d,r=false,min,max)=>o=>{o.setName(n).setDescription(d).setRequired(r);if(min!==undefined)o.setMinValue(min);if(max!==undefined)o.setMaxValue(max)};
const cmd=(n,d,p)=>{const x=new SlashCommandBuilder().setName(n).setDescription(d);if(p)x.setDefaultMemberPermissions(p);return x};
const grp=(n,d,p)=>cmd(n,d,p);
const sub=(g,n,d,opts=[])=>{g.addSubcommand(x=>{x.setName(n).setDescription(d);opts.forEach(f=>f(x))});return g};

commands.push(
 cmd("warn","Warn a member.",P.ModerateMembers).addUserOption(U("user","Member.",true)).addStringOption(S("reason","Reason.")),
 cmd("warnings","View warnings.",P.ModerateMembers).addUserOption(U("user","Member.",true)),
 cmd("clearwarnings","Clear warnings.",P.ModerateMembers).addUserOption(U("user","Member.",true)),
 cmd("softban","Softban a member.",P.BanMembers).addUserOption(U("user","Member.",true)).addStringOption(S("reason","Reason.")),
 cmd("lockdown","Lock text channels.",P.ManageChannels),cmd("unlockdown","Unlock text channels.",P.ManageChannels),
 cmd("move","Move a member.",P.MoveMembers).addUserOption(U("user","Member.",true)).addChannelOption(o=>o.setName("channel").setDescription("Voice channel.").addChannelTypes(ChannelType.GuildVoice).setRequired(true))
);

let g=grp("ticket","Ticket system.");
sub(g,"open","Open a ticket.");sub(g,"panel","Post a ticket panel.",[C("channel","Channel.",true)]);sub(g,"settings","Set ticket category.",[C("category","Category.",true)]);commands.push(g);
for(const [n,d] of [["close","Close a ticket."],["claim","Claim a ticket."],["unclaim","Unclaim a ticket."],["transcript","Create a transcript."]])commands.push(cmd(n,d,P.ManageChannels));
commands.push(cmd("add","Add a member to a ticket.",P.ManageChannels).addUserOption(U("user","Member.",true)),cmd("remove","Remove a member from a ticket.",P.ManageChannels).addUserOption(U("user","Member.",true)),cmd("rename","Rename a ticket.",P.ManageChannels).addStringOption(S("name","New name.",true)));

g=grp("automod","Automod controls.",P.ManageGuild);sub(g,"enable","Enable.");sub(g,"disable","Disable.");sub(g,"status","Status.");sub(g,"config","Set blocked words.",[S("words","Comma separated.",true)]);commands.push(g);
for(const n of ["welcome","goodbye"]){g=grp(n,n+" system.",P.ManageGuild);sub(g,"config","Set channel.",[C("channel","Channel.",true)]);sub(g,"test","Test message.");commands.push(g)}
g=grp("birthday","Birthday system.");for(const [n,d,o] of [["set","Set birthday.",[S("date","MM-DD.",true)]],["remove","Remove birthday."],["view","View birthday.",[U("user","User.")]],["list","List birthdays."],["upcoming","Upcoming birthdays."],["today","Today's birthdays."],["config","Set birthday channel.",[C("channel","Channel.",true)]],["test","Test birthday."]])sub(g,n,d,o||[]);commands.push(g);
g=grp("level","Leveling system.");sub(g,"view","View level.",[U("user","User.")]);sub(g,"rank","View rank.",[U("user","User.")]);sub(g,"leaderboard","Leaderboard.");sub(g,"config","Enable or disable.",[S("enabled","true or false.",true)]);sub(g,"rewards","Set role reward.",[I("level","Level.",true,1,10000),S("role_id","Role ID.",true)]);commands.push(g);
g=grp("giveaway","Giveaway system.");sub(g,"start","Start giveaway.",[I("minutes","Duration.",true,1,10080),S("prize","Prize.",true),I("winners","Winners.",false,1,20)]);for(const n of ["end","reroll","cancel","enter"])sub(g,n,n+" giveaway.",[S("id","Giveaway ID.",true)]);sub(g,"list","List giveaways.");commands.push(g);

commands.push(cmd("suggest","Submit a suggestion.").addStringOption(S("text","Suggestion.",true)),cmd("suggestions","List suggestions."),cmd("suggestion-approve","Approve suggestion.",P.ManageMessages).addStringOption(S("id","ID.",true)),cmd("suggestion-deny","Deny suggestion.",P.ManageMessages).addStringOption(S("id","ID.",true)),cmd("suggestion-review","Review suggestion.",P.ManageMessages).addStringOption(S("id","ID.",true)));
g=grp("apply","Applications.");for(const n of ["staff","partner","creator"])sub(g,n,"Apply for "+n+".",[S("answers","Your answers.",true)]);commands.push(g);
for(const n of ["application-review","application-accept","application-deny"])commands.push(cmd(n,n.replaceAll("-"," ")+".",P.ManageGuild).addStringOption(S("id","Application ID.",true)));
commands.push(cmd("applications","List applications.",P.ManageGuild).addStringOption(S("type","Type.")));
commands.push(cmd("remind","Create reminder.").addIntegerOption(I("minutes","Minutes.",true,1,525600)).addStringOption(S("message","Message.",true)),cmd("reminders","List reminders."),cmd("reminder-delete","Delete reminder.").addStringOption(S("id","Reminder ID.",true)),cmd("afk","Set AFK.").addStringOption(S("reason","Reason.")),cmd("afk-remove","Remove AFK."),cmd("afk-list","List AFK users."));
commands.push(cmd("starboard","Configure starboard.",P.ManageGuild).addChannelOption(C("channel","Channel.",true)).addIntegerOption(I("stars","Stars.",true,1,50)),cmd("starboard-disable","Disable starboard.",P.ManageGuild),cmd("sticky","Set sticky message.",P.ManageMessages).addStringOption(S("message","Message.",true)).addChannelOption(C("channel","Channel.")),cmd("sticky-remove","Remove sticky.",P.ManageMessages).addChannelOption(C("channel","Channel.")),cmd("sticky-list","List sticky messages."));
g=grp("customcommand","Custom commands.",P.ManageGuild);sub(g,"add","Add.",[S("name","Name.",true),S("response","Response.",true)]);sub(g,"remove","Remove.",[S("name","Name.",true)]);sub(g,"list","List.");sub(g,"edit","Edit.",[S("name","Name.",true),S("response","Response.",true)]);commands.push(g);
commands.push(cmd("announce","Send announcement.",P.ManageMessages).addStringOption(S("message","Message.",true)).addChannelOption(C("channel","Channel.")),cmd("announcement-edit","Edit announcement.",P.ManageMessages).addStringOption(S("message_id","Message ID.",true)).addStringOption(S("message","New message.",true)).addChannelOption(C("channel","Channel.")),cmd("announcement-delete","Delete announcement.",P.ManageMessages).addStringOption(S("message_id","Message ID.",true)).addChannelOption(C("channel","Channel.")));
commands.push(cmd("addrole","Add role.",P.ManageRoles).addUserOption(U("user","Member.",true)).addRoleOption(o=>o.setName("role").setDescription("Role.").setRequired(true)),cmd("removerole","Remove role.",P.ManageRoles).addUserOption(U("user","Member.",true)).addRoleOption(o=>o.setName("role").setDescription("Role.").setRequired(true)));
g=grp("role","Role management.",P.ManageRoles);sub(g,"create","Create role.",[S("name","Name.",true)]);sub(g,"delete","Delete role.",[S("role_id","Role ID.",true)]);sub(g,"add","Add role.",[U("user","Member.",true),S("role_id","Role ID.",true)]);sub(g,"remove","Remove role.",[U("user","Member.",true),S("role_id","Role ID.",true)]);sub(g,"info","Role info.",[S("role_id","Role ID.",true)]);sub(g,"list","List roles.");commands.push(g);
for(const [n,d,p] of [["staffinfo","Show staff info."],["staffannounce","Staff announcement.",P.ManageGuild],["staffnotes","Staff note.",P.ManageGuild],["report","Report a member."],["reports","List reports.",P.ManageGuild],["modstats","Moderation stats.",P.ManageGuild],["stafflist","List staff."]]){
 const x=cmd(n,d,p);if(n==="staffannounce")x.addStringOption(S("message","Message.",true));if(n==="staffnotes")x.addStringOption(S("note","Note.",true));if(n==="report")x.addUserOption(U("user","Member.",true)).addStringOption(S("reason","Reason.",true));commands.push(x)
}


// Lofi voice controls
g=grp("lofi","Play lofi music in a voice channel.");
sub(g,"join","Join your current voice channel.");
sub(g,"play","Play the configured lofi stream.");
sub(g,"stop","Stop lofi music.");
sub(g,"leave","Leave the voice channel.");
commands.push(g);

 if(n==="lofi"){
  const s=i.options.getSubcommand();
  const voice=i.member?.voice?.channel;
  if(s==="join"){
   if(!voice)return out(i,"Join a voice channel first.");
   const {joinVoiceChannel}=require("@discordjs/voice");
   const connection=joinVoiceChannel({channelId:voice.id,guildId:i.guild.id,adapterCreator:i.guild.voiceAdapterCreator,selfDeaf:true});
   ctx.voiceConnections??={};ctx.voiceConnections[i.guild.id]=connection;
   return out(i,"Joined "+voice.name+".");
  }
  const connection=ctx.voiceConnections?.[i.guild.id];
  if(s==="leave"){
   if(connection){connection.destroy();delete ctx.voiceConnections[i.guild.id];}
   return out(i,"Left the voice channel.");
  }
  if(!connection)return out(i,"Use /lofi join first.");
  if(s==="stop"){
   connection.state.subscription?.unsubscribe?.();
   return out(i,"Lofi stopped.");
  }
  const url=process.env.LOFI_STREAM_URL;
  if(!url)return out(i,"Set LOFI_STREAM_URL in your Codespaces environment first.");
  try{
   const {createAudioPlayer,createAudioResource,AudioPlayerStatus,StreamType}=require("@discordjs/voice");
   const https=require("https"),ffmpeg=require("ffmpeg-static"),{spawn}=require("child_process");
   ctx.voicePlayers??={};
   let player=ctx.voicePlayers[i.guild.id];
   if(!player)player=createAudioPlayer(),ctx.voicePlayers[i.guild.id]=player;
   const proc=spawn(ffmpeg,["-hide_banner","-loglevel","error","-i",url,"-f","s16le","-ar","48000","-ac","2","pipe:1"],{stdio:["ignore","pipe","ignore"]});
   const resource=createAudioResource(proc.stdout,{inputType:StreamType.Raw});
   player.play(resource);connection.subscribe(player);
   player.once(AudioPlayerStatus.Idle,()=>{try{proc.kill()}catch{}});
   return out(i,"Lofi is now playing.");
  }catch(err){console.error("Lofi error:",err);return out(i,"Could not start the lofi stream.");}
 }

const key=(g,u)=>g.id+":"+u, opt=(i,n)=>i.options.getString(n), usr=(i,n)=>i.options.getUser(n), chan=(i,n)=>i.options.getChannel(n);
const out=(i,t)=>i.reply({content:t,ephemeral:true});
const levelData=(db,g,u)=>{const k=key(g,u);if(!db.levels[k])db.levels[k]={xp:0,level:0};return db.levels[k]};
const remind=(ctx,r)=>setTimeout(async()=>{const u=await ctx.client.users.fetch(r.user).catch(()=>null);if(u)await u.send("Reminder: "+r.message).catch(()=>{});ctx.db.reminders=ctx.db.reminders.filter(x=>x.id!==r.id);ctx.save()},Math.min(Math.max(1000,r.at-Date.now()),2147483647));
const finishGiveaway=(ctx,g)=>setTimeout(async()=>{if(g.ended)return;const a=[...g.entries],w=[];while(w.length<Math.min(g.winners,a.length)){const x=a[Math.floor(Math.random()*a.length)];if(!w.includes(x))w.push(x)}g.ended=true;g.winnerIds=w;ctx.save();const c=ctx.client.guilds.cache.get(g.guild)?.channels.cache.get(g.channel);if(c)await c.send("Giveaway ended: "+g.prize+" | Winners: "+(w.length?w.map(x=>"<@"+x+">").join(", "):"Nobody entered.")).catch(()=>{})},Math.min(Math.max(1000,g.endsAt-Date.now()),2147483647));

async function handle(i,ctx){
 const db=ctx.db,n=i.commandName;
 if(n==="warn"||n==="warnings"||n==="clearwarnings"){const u=usr(i,"user"),k=key(i.guild,u.id);db.warnings[k]??=[];if(n==="warn"){db.warnings[k].push({by:i.user.id,reason:opt(i,"reason")||"No reason",at:Date.now()});ctx.save();return out(i,"Warned "+u.tag+".")}if(n==="warnings")return out(i,db.warnings[k].map((x,j)=>"#"+(j+1)+" "+x.reason).join("\\n")||"No warnings.");db.warnings[k]=[];ctx.save();return out(i,"Warnings cleared.")}
 if(n==="softban"){const m=i.guild.members.cache.get(usr(i,"user").id);if(!m)return out(i,"Member not found.");await m.ban({reason:opt(i,"reason")||"Softban"});await i.guild.members.unban(m.id);return out(i,"Softban complete.")}
 if(n==="lockdown"||n==="unlockdown"){await i.deferReply({ephemeral:true});for(const c of i.guild.channels.cache.values())if(c.isTextBased())await c.permissionOverwrites.edit(i.guild.roles.everyone,{SendMessages:n==="lockdown"?false:null}).catch(()=>{});return i.editReply(n==="lockdown"?"Server lockdown enabled.":"Server lockdown disabled.")}
 if(n==="move"){const m=i.guild.members.cache.get(usr(i,"user").id),c=chan(i,"channel");if(!m?.voice.channel)return out(i,"Member is not in voice.");await m.voice.setChannel(c);return out(i,"Member moved.")}
 if(n==="ticket"){const s=i.options.getSubcommand();if(s==="settings"){if(!i.memberPermissions.has(P.ManageChannels))return out(i,"Manage Channels permission required.");db.config.ticketCategory=chan(i,"category").id;ctx.save();return out(i,"Ticket category saved.")}if(s==="panel"){if(!i.memberPermissions.has(P.ManageChannels))return out(i,"Manage Channels permission required.");await chan(i,"channel").send("Support Tickets: use /ticket open.");return out(i,"Panel sent.")}const e=i.guild.channels.cache.find(c=>c.topic==="ticket:"+i.user.id);if(e)return out(i,"You already have "+e);const c=await i.guild.channels.create({name:"ticket-"+i.user.username.toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,20),type:ChannelType.GuildText,parent:db.config.ticketCategory||null,topic:"ticket:"+i.user.id,permissionOverwrites:[{id:i.guild.roles.everyone.id,deny:[P.ViewChannel]},{id:i.user.id,allow:[P.ViewChannel,P.SendMessages,P.ReadMessageHistory]},{id:i.client.user.id,allow:[P.ViewChannel,P.SendMessages,P.ManageChannels]}]});await c.send("Welcome "+i.user+"! Staff will help you. Use /close when done.");return out(i,"Ticket created: "+c)}
 if(["close","add","remove","claim","unclaim","rename","transcript"].includes(n)){if(!i.channel?.topic?.startsWith("ticket:"))return out(i,"This is not a ticket.");if(n==="close"){await out(i,"Closing ticket...");setTimeout(()=>i.channel.delete().catch(()=>{}),1000);return}if(n==="add"||n==="remove"){const u=usr(i,"user");await i.channel.permissionOverwrites.edit(u.id,n==="add"?{ViewChannel:true,SendMessages:true}:{ViewChannel:false});return out(i,n==="add"?"Member added.":"Member removed.")}if(n==="claim"){db.tickets[i.channel.id]={claimedBy:i.user.id};ctx.save();return out(i,"Ticket claimed.")}if(n==="unclaim"){delete db.tickets[i.channel.id];ctx.save();return out(i,"Ticket unclaimed.")}if(n==="rename"){await i.channel.setName(opt(i,"name").toLowerCase().replace(/[^a-z0-9-]/g,"-"));return out(i,"Ticket renamed.")}const ms=await i.channel.messages.fetch({limit:100}),txt=[...ms.values()].reverse().map(m=>m.author.tag+": "+m.content).join("\\n");return i.reply({content:"Transcript",files:[{attachment:Buffer.from(txt||"Empty"),name:"transcript.txt"}],ephemeral:true})}
 if(n==="automod"){const s=i.options.getSubcommand();if(s==="enable"){db.config.automod=true;ctx.save();return out(i,"Automod enabled.")}if(s==="disable"){db.config.automod=false;ctx.save();return out(i,"Automod disabled.")}if(s==="status")return out(i,"Automod: "+(db.config.automod?"enabled":"disabled"));db.config.badWords=opt(i,"words").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);ctx.save();return out(i,"Blocked words updated.")}
 if(n==="welcome"||n==="goodbye"){const s=i.options.getSubcommand(),f=n;if(s==="config"){db.config[f]=chan(i,"channel").id;ctx.save();return out(i,"Channel saved.")}const c=i.guild.channels.cache.get(db.config[f]);if(!c)return out(i,"Configure a channel first.");await c.send(n==="welcome"?"Welcome "+i.user+" to The Hub!":"Goodbye from The Hub!");return out(i,"Test sent.")}
 if(n==="birthday"){const s=i.options.getSubcommand();if(s==="set"){const d=opt(i,"date");if(!/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(d))return out(i,"Use MM-DD.");db.birthdays[key(i.guild,i.user.id)]=d;ctx.save();return out(i,"Birthday saved.")}if(s==="remove"){delete db.birthdays[key(i.guild,i.user.id)];ctx.save();return out(i,"Birthday removed.")}if(s==="view"){const u=usr(i,"user")||i.user;return out(i,db.birthdays[key(i.guild,u.id)]||"No birthday saved.")}if(s==="config"){db.config.birthdayChannel=chan(i,"channel").id;ctx.save();return out(i,"Birthday channel saved.")}if(s==="test"){const c=i.guild.channels.cache.get(db.config.birthdayChannel);if(c)await c.send("Birthday test.");return out(i,"Test sent.")}const today=new Date().toISOString().slice(5,10),a=Object.entries(db.birthdays).filter(([k,v])=>k.startsWith(i.guild.id+":")&&(s!=="today"||v===today));return out(i,a.map(([k,v])=>"<@"+k.split(":")[1]+"> — "+v).join("\\n")||"None found.")}
 if(n==="level"){const s=i.options.getSubcommand();if(s==="view"||s==="rank"){const u=usr(i,"user")||i.user,d=levelData(db,i.guild,u.id);return out(i,u.tag+" — Level "+d.level+" — "+d.xp+" XP")}if(s==="leaderboard"){const a=Object.entries(db.levels).filter(([k])=>k.startsWith(i.guild.id+":")).sort((a,b)=>b[1].level-a[1].level||b[1].xp-a[1].xp).slice(0,10);return out(i,a.map((x,j)=>(j+1)+". <@"+x[0].split(":")[1]+"> — L"+x[1].level+" ("+x[1].xp+" XP)").join("\\n")||"No levels.")}if(s==="config"){db.config.leveling=opt(i,"enabled").toLowerCase()==="true";ctx.save();return out(i,"Leveling "+(db.config.leveling?"enabled":"disabled")+".")}const r=i.guild.roles.cache.get(opt(i,"role_id"));if(!r)return out(i,"Role not found.");db.config.levelRewards??={};db.config.levelRewards[i.options.getInteger("level",true)]=r.id;ctx.save();return out(i,"Reward saved.")}
 if(n==="giveaway"){const s=i.options.getSubcommand();if(s!=="enter"&&!i.memberPermissions.has(P.ManageGuild))return out(i,"Manage Server permission required.");if(s==="enter"){const g=db.giveaways[opt(i,"id")];if(!g||g.ended)return out(i,"Giveaway inactive.");if(!g.entries.includes(i.user.id))g.entries.push(i.user.id);ctx.save();return out(i,"Entered.")}if(s==="list")return out(i,Object.values(db.giveaways).filter(x=>x.guild===i.guild.id).map(x=>x.id+" — "+x.prize+" — "+(x.ended?"ended":"active")).join("\\n")||"No giveaways.");if(s==="start"){const g={id:Date.now().toString(36),guild:i.guild.id,channel:i.channel.id,prize:opt(i,"prize"),winners:i.options.getInteger("winners")||1,endsAt:Date.now()+i.options.getInteger("minutes",true)*60000,entries:[],ended:false};db.giveaways[g.id]=g;ctx.save();await i.channel.send("Giveaway started! Prize: "+g.prize+" | ID: "+g.id+" | Enter with /giveaway enter");finishGiveaway(ctx,g);return out(i,"Giveaway started.")}const g=db.giveaways[opt(i,"id")];if(!g)return out(i,"Giveaway not found.");if(s==="cancel"){g.ended=true;ctx.save();return out(i,"Cancelled.")}if(s==="reroll"){if(!g.entries.length)return out(i,"Nobody entered.");return out(i,"Rerolled winner: <@"+g.entries[Math.floor(Math.random()*g.entries.length))+">")}g.endsAt=Date.now();g.ended=false;ctx.save();finishGiveaway(ctx,g);return out(i,"Ending giveaway.")}
 if(n==="suggest"){const id=Date.now().toString(36);db.suggestions[id]={id,guild:i.guild.id,user:i.user.id,text:opt(i,"text"),status:"pending"};ctx.save();return out(i,"Suggestion submitted: "+id)}
 if(n==="suggestions"){const a=Object.values(db.suggestions).filter(x=>x.guild===i.guild.id);return out(i,a.slice(-10).map(x=>x.id+" — "+x.status+" — "+x.text).join("\\n")||"No suggestions.")}
 if(n.startsWith("suggestion-")){const x=db.suggestions[opt(i,"id")];if(!x)return out(i,"Suggestion not found.");if(n!=="suggestion-review")x.status=n.endsWith("approve")?"approved":"denied";ctx.save();return out(i,"Suggestion is "+x.status+".")}
 if(n==="apply"){const type=i.options.getSubcommand(),id=Date.now().toString(36);db.applications[id]={id,guild:i.guild.id,user:i.user.id,type,answers:opt(i,"answers"),status:"pending"};ctx.save();return out(i,"Application submitted: "+id)}
 if(n==="applications"){const type=opt(i,"type"),a=Object.values(db.applications).filter(x=>x.guild===i.guild.id&&(!type||x.type===type));return out(i,a.slice(-15).map(x=>x.id+" — "+x.type+" — "+x.status).join("\\n")||"No applications.")}
 if(n.startsWith("application-")){const x=db.applications[opt(i,"id")];if(!x)return out(i,"Application not found.");if(n!=="application-review")x.status=n.endsWith("accept")?"accepted":"denied";ctx.save();return out(i,"Application is "+x.status+".")}
 if(n==="remind"){const r={id:Date.now().toString(36),guild:i.guild.id,user:i.user.id,message:opt(i,"message"),at:Date.now()+i.options.getInteger("minutes",true)*60000};db.reminders.push(r);ctx.save();remind(ctx,r);return out(i,"Reminder set: "+r.id)}
 if(n==="reminders")return out(i,db.reminders.filter(x=>x.user===i.user.id).map(x=>x.id+" — "+x.message).join("\\n")||"No reminders.");
 if(n==="reminder-delete"){const id=opt(i,"id"),before=db.reminders.length;db.reminders=db.reminders.filter(x=>!(x.id===id&&x.user===i.user.id));ctx.save();return out(i,before===db.reminders.length?"Not found.":"Deleted.")}
 if(n==="afk"){db.afk[key(i.guild,i.user.id)]=opt(i,"reason")||"AFK";ctx.save();return out(i,"AFK set.")}if(n==="afk-remove"){delete db.afk[key(i.guild,i.user.id)];ctx.save();return out(i,"AFK removed.")}if(n==="afk-list"){const a=Object.entries(db.afk).filter(([k])=>k.startsWith(i.guild.id+":"));return out(i,a.map(([k,v])=>"<@"+k.split(":")[1]+"> — "+v).join("\\n")||"No AFK users.")}
 if(n==="starboard"){db.config.starboard={channel:chan(i,"channel").id,stars:i.options.getInteger("stars",true)};ctx.save();return out(i,"Starboard configured.")}if(n==="starboard-disable"){db.config.starboard=null;ctx.save();return out(i,"Starboard disabled.")}
 if(n==="sticky"){const c=chan(i,"channel")||i.channel;db.sticky[c.id]={message:opt(i,"message"),lastMessage:null};ctx.save();return out(i,"Sticky configured.")}if(n==="sticky-remove"){const c=chan(i,"channel")||i.channel;delete db.sticky[c.id];ctx.save();return out(i,"Sticky removed.")}if(n==="sticky-list")return out(i,Object.entries(db.sticky).map(([id,x])=>"<#"+id+"> — "+x.message).join("\\n")||"No sticky messages.");
 if(n==="customcommand"){const s=i.options.getSubcommand();db.customCommands[i.guild.id]??={};const c=db.customCommands[i.guild.id];if(s==="list")return out(i,Object.keys(c).join(", ")||"None.");const name=opt(i,"name").toLowerCase();if(s==="remove")delete c[name];else c[name]=opt(i,"response");ctx.save();return out(i,"Custom command saved.")}
 if(n==="announce"){const c=chan(i,"channel")||i.channel;await c.send({embeds:[new EmbedBuilder().setTitle("Announcement").setDescription(opt(i,"message")).setTimestamp()]});return out(i,"Announcement sent.")}
 if(n==="announcement-edit"){const c=chan(i,"channel")||i.channel,m=await c.messages.fetch(opt(i,"message_id"));await m.edit(opt(i,"message"));return out(i,"Edited.")}
 if(n==="announcement-delete"){const c=chan(i,"channel")||i.channel,m=await c.messages.fetch(opt(i,"message_id"));await m.delete();return out(i,"Deleted.")}
 if(n==="addrole"||n==="removerole"){const m=i.guild.members.cache.get(usr(i,"user").id),r=i.options.getRole("role");if(!m)return out(i,"Member not found.");if(n==="addrole")await m.roles.add(r);else await m.roles.remove(r);return out(i,"Role updated.")}
 if(n==="role"){const s=i.options.getSubcommand();if(s==="list")return out(i,i.guild.roles.cache.map(r=>r.name).join(", "));if(s==="create"){const r=await i.guild.roles.create({name:opt(i,"name")});return out(i,"Created "+r+".")}const r=i.guild.roles.cache.get(opt(i,"role_id"));if(!r)return out(i,"Role not found.");if(s==="delete"){await r.delete();return out(i,"Deleted.")}if(s==="info")return out(i,r.name+" — "+r.id+" — "+r.members.size+" members");const m=i.guild.members.cache.get(usr(i,"user").id);if(!m)return out(i,"Member not found.");if(s==="add")await m.roles.add(r);else await m.roles.remove(r);return out(i,"Role updated.")}
 if(n==="staffinfo")return out(i,"Staff roles: "+staff.join(", "));
 if(n==="staffannounce"){const c=i.guild.channels.cache.find(x=>x.name==="staff-announcements"&&x.isTextBased());if(!c)return out(i,"Create #staff-announcements first.");await c.send(opt(i,"message"));return out(i,"Sent.")}
 if(n==="staffnotes"){db.staffNotes??=[];db.staffNotes.push({guild:i.guild.id,user:i.user.id,note:opt(i,"note"),at:Date.now()});ctx.save();return out(i,"Note saved.")}
 if(n==="report"){db.reports??=[];db.reports.push({guild:i.guild.id,user:usr(i,"user").id,reason:opt(i,"reason"),by:i.user.id,at:Date.now()});ctx.save();return out(i,"Report submitted.")}
 if(n==="reports")return out(i,(db.reports||[]).filter(x=>x.guild===i.guild.id).slice(-20).map((x,j)=>(j+1)+". <@"+x.user+"> — "+x.reason).join("\\n")||"No reports.");
 if(n==="modstats")return out(i,"Warnings: "+Object.values(db.warnings).reduce((a,x)=>a+x.length,0)+" | Reports: "+(db.reports||[]).length);
 if(n==="stafflist")return out(i,i.guild.members.cache.filter(m=>m.roles.cache.some(r=>staff.includes(r.name))).map(m=>m.user.tag).join("\\n")||"No staff found.");
 return false;
}
function init(ctx){for(const r of ctx.db.reminders||[])if(r.at>Date.now())remind(ctx,r);for(const g of Object.values(ctx.db.giveaways||{}))if(!g.ended&&g.endsAt>Date.now())finishGiveaway(ctx,g)}
module.exports={commands,handle,init};
