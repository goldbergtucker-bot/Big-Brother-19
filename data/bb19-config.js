/* BIG BROTHER 19 — CUSTOM CAST CONFIGURATION */
window.BB19_CONFIG = Object.freeze({
  seasonId: "bb19-custom",
  seasonNumber: 19,
  originalYear: 2017,
  defaultCastSize: 17,
  ratingKeys: ["general","physical","mental","social","strategic"],
  relationshipKeys: ["friendship","trust","loyalty","rivalry","respect","attraction"],
  juryThresholdPlacement: 11,
  doubleEvictionWeeks: [10],
  denOfTemptation: {
    weeks: [1,2,3],
    temptations: [
      {id:"pendant", name:"Pendant of Protection", description:"Immunity from the next three evictions. The holder also creates a nomination curse."},
      {id:"ring", name:"Ring of Replacement", description:"The holder may replace one randomly selected POV player with themselves. The curse creates Ve-Toad punishments."},
      {id:"hex", name:"Halting Hex", description:"The holder can cancel one of the next four evictions. Accepting it unleashes the Temptation Competition."}
    ]
  },
  firstTemptation: {
    name:"Garden of Temptation — $25,000",
    guaranteedTaken:true,
    description:"Every houseguest is given a private button. The first houseguest to press takes $25,000. The money is always taken; the simulation determines who presses first.",
    consequence:"The winner must throw the first Head of Household competition. The house also enters the BB19 premiere safety format."
  },
  temptationCompetition: {
    startWeek:5,
    endWeek:7,
    description:"Eligible houseguests may opt in before nominations. The winner is immune for the week; the last-place finisher becomes a third nominee. The HOH cannot compete."
  },
  treeOfTemptation: {
    startWeek:8,
    endWeek:10,
    powers:[
      {id:"save-friend",name:"Save a Friend",description:"Grant immunity to another houseguest for the week."},
      {id:"second-veto",name:"Second Veto",description:"Gain an additional Power of Veto that can be used during the week."},
      {id:"eliminate-two-votes",name:"Eliminate Two Eviction Votes",description:"Remove two eligible eviction votes from the eviction ceremony."},
      {id:"bounty",name:"Bounty on Your Head",description:"A $5,000 bounty is attached to the holder; the houseguest who evicts the holder receives the bounty."},
      {id:"no-next-hoh",name:"Can't Play in Next HOH",description:"The holder is ineligible for the following HOH competition."}
    ]
  },
  battleBack: {
    afterEvictionCount:4,
    rounds:["Maze Race","Billboard Bashers","Maze Race"],
    houseChallenger:true
  },
  competitionSchedule: [
    {week:1,type:"hit-the-road",name:"Tempted by the Fruit",category:"physical",description:"The premiere safety competition. Houseguests race through a temptation-themed course to earn safety from the initial eviction."},
    {week:1,type:"hoh",name:"Hangs in the Balance",category:"physical",description:"Houseguests balance objects and complete a hanging challenge under pressure. The strongest successful run wins HOH."},
    {week:1,type:"pov",name:"Fin to Win",category:"physical",description:"Players maneuver through a fin-themed setup and complete the objective as quickly as possible to win the Power of Veto."},
    {week:2,type:"hoh",name:"Sugar Shot",category:"physical",description:"Players launch and land candy-themed shots while trying to reach the highest successful score."},
    {week:2,type:"pov",name:"Path of Least Resistance",category:"mental",description:"Players navigate a resistance-themed puzzle path, balancing speed, memory and accuracy."},
    {week:3,type:"hoh",name:"Space Cadets",category:"physical",description:"Players race through a space-themed setup while maintaining control of moving pieces."},
    {week:3,type:"pov",name:"Temple of Temptation",category:"mental",description:"Players solve a temple-themed puzzle and retrieve the correct objects in the proper order."},
    {week:4,type:"battleback-1",name:"Maze Race",category:"physical",description:"Evicted houseguests guide a ball through a rope-and-pulley maze. The first two finishers advance."},
    {week:4,type:"battleback-2",name:"Billboard Bashers",category:"physical",description:"The remaining Battle Back competitors knock down billboard targets. The winner advances to the final round."},
    {week:4,type:"battleback-3",name:"Maze Race",category:"physical",description:"The returning contender faces a house challenger in a final Maze Race for the right to re-enter the game."},
    {week:4,type:"hoh",name:"What's The Hold Up",category:"physical",description:"Players maintain a difficult hold while completing a timing-based objective. The best performance wins HOH."},
    {week:4,type:"pov",name:"BB Juicy Blast",category:"physical",description:"Players launch and land oversized fruit pieces while racing for the best result."},
    {week:5,type:"hoh",name:"Inked & Evicted",category:"mental",description:"Players answer and match tattoo-themed clues to advance through the competition."},
    {week:5,type:"temptation",name:"Bowlerina",category:"physical",description:"A bowling-and-balance Temptation Competition where the winner earns immunity and the last-place finisher becomes a third nominee."},
    {week:5,type:"pov",name:"Under the Weather",category:"physical",description:"Players work through a weather-themed obstacle and precision course to finish with the best time."},
    {week:6,type:"hoh",name:"Gravestone Golf",category:"physical",description:"Players putt themed golf balls toward targets while trying to complete the course efficiently."},
    {week:6,type:"temptation",name:"Strangest Things",category:"mental",description:"Players navigate a strange, memory-based Temptation Competition. The winner earns immunity and the last-place finisher becomes the third nominee."},
    {week:6,type:"pov",name:"OTEV the Possessed Piglet",category:"mental",description:"A classic OTEV-style elimination game in which players find answers and return before another player is eliminated."},
    {week:7,type:"hoh",name:"Hocus Focus",category:"mental",description:"Players identify and remember objects in a magic-themed memory competition."},
    {week:7,type:"temptation",name:"Where Were You?",category:"mental",description:"Players answer questions about where houseguests were during past events. The winner earns immunity and the last-place finisher becomes the third nominee."},
    {week:7,type:"pov",name:"BB Adventure Tours",category:"physical",description:"Players navigate an adventure-themed course and complete the required tasks as quickly as possible."},
    {week:8,type:"hoh",name:"Let It Slide",category:"physical",description:"Players slide objects toward scoring zones and compete for the highest successful score."},
    {week:8,type:"pov",name:"Kenya Solve It",category:"mental",description:"Players solve a themed logic puzzle and complete the arrangement before their opponents."},
    {week:9,type:"hoh",name:"Tales From Decrypt",category:"mental",description:"Players decode clues and reconstruct a sequence from information revealed during the competition."},
    {week:9,type:"pov",name:"Home Zing Home",category:"mental",description:"Players identify and arrange humorous houseguest clues in the correct order."},
    {week:10,type:"hoh",name:"Everyone's A Wiener",category:"physical",description:"Players navigate a hot-dog-themed course with balance, timing and precision elements."},
    {week:10,type:"pov",name:"Hide and Go Veto",category:"strategic",description:"Players hide their veto cards and then search the house. The last card found determines the Veto winner."},
    {week:10,type:"hoh-de",name:"Ready, Set, Woah!",category:"physical",description:"A fast Double Eviction HOH competition based on timing, movement and rapid reactions."},
    {week:10,type:"pov-de",name:"Punch, Slap, Kick",category:"physical",description:"A fast-paced Double Eviction Veto requiring speed and physical control."},
    {week:11,type:"hoh",name:"Fake News",category:"mental",description:"Players distinguish true and false Big Brother statements and build a correct sequence."},
    {week:11,type:"pov",name:"Lime Drop",category:"physical",description:"Players manipulate lime-themed pieces and complete the course with the best time."},
    {week:12,type:"hoh",name:"The Revengers",category:"mental",description:"Players answer questions about the season and its houseguests to advance through a superhero-themed competition."},
    {week:12,type:"pov",name:"BB Comics",category:"physical",description:"Players race through a comic-book challenge and identify the correct comic panels."},
    {week:13,type:"hoh",name:"What The Bleep?",category:"mental",description:"Players identify censored words and phrases from memorable moments in the season."},
    {week:13,type:"pov",name:"Back to the Veto",category:"mental",description:"Players answer questions about the season's previous events and compete for the final regular-season Veto."},
    {week:14,type:"final-hoh-1",name:"Tail of the Unicorn",category:"physical",description:"Final HOH Part 1 is an endurance challenge. The last houseguest standing wins the first round."},
    {week:14,type:"final-hoh-2",name:"Knock 'Em Down",category:"physical",description:"Final HOH Part 2 is a head-to-head physical and timing competition between the two Part 1 losers."},
    {week:14,type:"final-hoh-3",name:"The Scales Of Just Us",category:"mental",description:"Final HOH Part 3 tests knowledge of the season and determines the final HOH."}
  ],
  notes: [
    "17 custom houseguests",
    "First temptation is guaranteed to be taken; only the first presser is randomized",
    "Den of Temptation runs Weeks 1-3",
    "Temptation Competition runs Weeks 5-7",
    "Battle Back occurs after the fourth eviction",
    "Tree of Temptation runs Weeks 8-10",
    "Double Eviction occurs in Week 10",
    "Nine-person jury: 3rd through 11th place",
    "Final HOH uses Parts 1-3"
  ]
});
