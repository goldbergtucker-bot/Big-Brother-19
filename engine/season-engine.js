/* BIG BROTHER 19 — CUSTOM SEASON ENGINE */
(function(){
  const C=()=>window.Competitions, R=()=>window.RelEngine;
  const living=s=>s.houseguests.filter(h=>h.active);
  const hg=(s,id)=>s.houseguests.find(h=>h.id===id);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const shuffle=a=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;};
  const displayName=h=>String(h?.displayName||h?.firstName||`${h?.firstName||''} ${h?.lastName||''}`).trim();
  const ordinal=n=>{const v=n%100;return `${n}${v>=11&&v<=13?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th')}`;};
  function rel(s,a,b){return s.relationships?.[a.id]?.[b.id]||{friendship:50,trust:50,loyalty:50,respect:50,rivalry:0,attraction:0};}
  function bond(s,a,b){const r=rel(s,a,b);return (r.friendship*.30+r.trust*.25+r.loyalty*.15+r.respect*.20+r.attraction*.10-r.rivalry*.35);}
  function ally(s,a,b){return (s.alliances||[]).some(x=>x.active!==false&&x.memberIds.includes(a.id)&&x.memberIds.includes(b.id));}
  function snapshot(s){return {phase:s.phase,week:s.week,currentHOH:s.currentHOH,originalHOH:s.originalHOH,secretHOH:s.secretHOH,dethronedHOH:s.dethronedHOH,nominees:[...s.nominees],intendedTarget:s.intendedTarget,targetHistory:[...(s.targetHistory||[])],backdoorTargetId:s.backdoorTargetId||null,backdoorPlanActive:!!s.backdoorPlanActive,povPlayers:[...s.povPlayers],vetoWinners:[...s.vetoWinners],evictionVotes:[...(s.evictionVotes||[])],evicted:[...s.evicted],jury:[...s.jury],powers:(s.powers||[]).map(x=>({...x})),temptations:[...(s.temptations||[])],firstTemptation:s.firstTemptation?{...s.firstTemptation}:null,treeOfTemptation:s.treeOfTemptation?{...s.treeOfTemptation}:null,battleBack:s.battleBack?JSON.parse(JSON.stringify(s.battleBack)):null,houseguests:s.houseguests.map(h=>({id:h.id,slot:h.slot,firstName:h.firstName,lastName:h.lastName,portraitUrl:h.portraitUrl,gender:h.gender,active:h.active,safe:h.safe,nominated:h.nominated,juryMember:h.juryMember,evicted:h.evicted,placement:h.placement}))};}
  function eventData(s,e){const d={...(e.data||{})};if(e.type==='eviction'){d.votes=e.votes||s.evictionVotes||[];d.voteCounts=e.voteCounts||{};d.evictedVoteCount=e.evictedVoteCount;d.stayVoteCount=e.stayVoteCount;d.tieBreakVoteId=e.tieBreakVoteId||null;}if(e.type==='veto-ceremony'){d.vetoUsed=!!e.vetoUsed;d.savedId=e.savedId||null;d.replacementId=e.replacementId||null;d.finalNomineeIds=[...s.nominees];}return d;}
  function log(s,e){const r={id:s.history.length+1,...e};r.snapshot=snapshot(s);r.data=eventData(s,r);s.history.push(r);}
  function ensureState(s){s.targetHistory=s.targetHistory||[];s.powers=s.powers||[];s.temptations=s.temptations||[];s.jury=s.jury||[];s.evicted=s.evicted||[];s.nominees=s.nominees||[];s.povPlayers=s.povPlayers||[];s.vetoWinners=s.vetoWinners||[];s.evictionVotes=s.evictionVotes||[];s.alliances=s.alliances||[];}
  function resetFlags(s){s.houseguests.forEach(h=>{h.safe=false;h.nominated=false;});}
  function chooseFirstTemptation(s){
    const players=living(s);
    const scored=players.map(h=>{
      const risk=(h.ratings?.general||50)*.18+(h.ratings?.strategic||50)*.18+(h.ratings?.social||50)*.08+(h.ratings?.physical||50)*.08+Math.random()*58;
      return {h,score:risk};
    }).sort((a,b)=>b.score-a.score);
    const winner=scored[0].h;
    s.firstTemptation={winnerId:winner.id,amount:25000,guaranteedTaken:true};
    // The actual BB19 consequence was that the money-taker had to throw the first HOH.
    winner.mustThrowFirstHOH=true;
    log(s,{week:1,phase:'premiere',type:'temptation-25000',winnerId:winner.id,participants:players.map(p=>p.id),title:'Garden of Temptation — $25,000',lines:[`${displayName(winner)} was the first houseguest to press the button and takes $25,000.`,`The $25,000 temptation was guaranteed to be taken; the race determined who pressed first.`,`As the personal consequence, ${displayName(winner)} must throw the first HOH competition.`]});
    return winner;
  }
  function runHitTheRoad(s){
    const pool=living(s);
    const comp=C().runCompetition(pool,{week:1,type:'hit-the-road'});
    const winner=comp.winner;winner.firstSafety=true;winner.safe=true;
    log(s,{week:1,phase:'premiere',type:'hit-the-road',winnerId:winner.id,participants:pool.map(p=>p.id),competition:comp,title:`Hit the Road — ${comp.label}`,lines:[`${displayName(winner)} wins Hit the Road and earns premiere safety.`]});
    return winner;
  }
  function runFirstHOH(s){
    let pool=living(s).filter(h=>!h.mustThrowFirstHOH);
    if(pool.length<2)pool=living(s).filter(h=>!h.mustThrowFirstHOH);
    const comp=C().runCompetition(pool,{week:1,type:'hoh'});
    const winner=comp.winner;s.currentHOH=winner.id;s.originalHOH=winner.id;
    log(s,{week:1,phase:'premiere',type:'hoh',winnerId:winner.id,participants:pool.map(p=>p.id),competition:comp,title:`Head of Household — ${comp.label}`,lines:[`${displayName(winner)} wins the first HOH.`]});
    return winner;
  }
  function runDenOfTemptation(s,week){
    const eligible=living(s).filter(h=>!h.denUsed);if(!eligible.length)return null;
    // Simulate America's choice as a strategic/social prominence selection, but keep the temptation itself probabilistic.
    const chosen=eligible.sort((a,b)=>((b.ratings?.social||50)+(b.ratings?.general||50)+Math.random()*25)-((a.ratings?.social||50)+(a.ratings?.general||50)+Math.random()*25))[0];
    chosen.denUsed=true;
    const cfg=window.BB19_CONFIG.denOfTemptation.temptations[week-1];
    let accepted=true;
    let power=null;
    if(accepted){
      if(cfg.id==='pendant'){
        power={type:'pendant',ownerId:chosen.id,wonWeek:week,expiresWeek:week+2,used:false};chosen.pendantUntil=week+2;
        const cursePool=living(s).filter(h=>h.id!==chosen.id);const cursed=shuffle(cursePool)[0];if(cursed){cursed.nominationCurseUntil=week+2;power.cursedId=cursed.id;}
      } else if(cfg.id==='ring'){
        power={type:'ring',ownerId:chosen.id,wonWeek:week,expiresWeek:week,used:false};
        const curse=shuffle(living(s).filter(h=>h.id!==chosen.id)).slice(0,3).map(h=>h.id);power.curseIds=curse;
      } else {
        power={type:'halting-hex',ownerId:chosen.id,wonWeek:week,expiresWeek:week+3,used:false};s.temptationCompetitionUnlocked=true;
      }
      s.powers.push(power);
    }
    log(s,{week,phase:'temptation',type:'den-of-temptation',winnerId:chosen.id,temptationId:cfg.id,temptationName:cfg.name,powerId:power?.type||null,cursedId:power?.cursedId||null,curseIds:power?.curseIds||[],title:`Den of Temptation — ${cfg.name}`,lines:[`${displayName(chosen)} is selected to enter the Den of Temptation.`,`${displayName(chosen)} accepts the ${cfg.name}.`,power?.cursedId?`${displayName(hg(s,power.cursedId))} receives the nomination curse.`:power?.curseIds?.length?`${power.curseIds.map(id=>displayName(hg(s,id))).join(', ')} receive the Ve-Toad curse.`:`The Temptation Competition is unleashed for Weeks 5–7.`]});
    return chosen;
  }
  function runNominations(s,week){
    const hoh=hg(s,s.currentHOH);let pool=living(s).filter(h=>h.id!==hoh.id&&!h.safe&&!((h.pendantUntil||0)>=week));
    // Nomination curse: one cursed HG must volunteer as a third nominee over the first three weeks.
    const cursed=pool.find(h=>(h.nominationCurseUntil||0)>=week&&!h.usedNominationCurse);
    const nominees=R().pickNominees(s,hoh,pool,2).filter(Boolean);
    let final=[...new Map(nominees.map(h=>[h.id,h])).values()];
    while(final.length<2){const x=shuffle(pool.filter(h=>!final.some(n=>n.id===h.id)))[0];if(!x)break;final.push(x);}
    if(cursed&&!final.some(h=>h.id===cursed.id)){final.push(cursed);cursed.usedNominationCurse=true;}
    s.nominees=final.map(h=>h.id);final.forEach(h=>h.nominated=true);
    const targetPlan=R().planBackdoor(s,hoh,final);
    s.backdoorPlanActive=!!targetPlan.use;s.backdoorTargetId=targetPlan.target?.id||null;
    s.intendedTarget=targetPlan.use?targetPlan.target.id:(final[0]?.id||null);
    s.targetHistory=[];if(targetPlan.use)s.targetHistory.push({name:displayName(targetPlan.target),reason:targetPlan.reason});
    log(s,{week,phase:'standard',type:'nominations',hohId:hoh.id,nomineeIds:s.nominees,backdoorTargetId:s.backdoorTargetId,intendedTarget:s.intendedTarget,backdoorPlanActive:s.backdoorPlanActive,title:'Nominations',lines:[`${displayName(hoh)} nominates ${final.map(displayName).join(' and ')} for eviction.`,targetPlan.use?`${displayName(hoh)} secretly plans to backdoor ${displayName(targetPlan.target)} (${targetPlan.reason}).`:`${displayName(hoh)} does not establish a backdoor plan this week.`]});
  }
  function runTemptationCompetition(s,week){
    if(!s.temptationCompetitionUnlocked||week<5||week>7)return null;
    const hoh=hg(s,s.currentHOH);const eligible=living(s).filter(h=>h.id!==hoh.id&&!h.safe&&!((h.pendantUntil||0)>=week));
    const entrants=eligible.filter(h=>{const risk=(h.ratings?.strategic||50)*.35+(h.ratings?.physical||50)*.20+(h.ratings?.general||50)*.15+Math.random()*45;return risk>=60;});
    if(entrants.length<3)entrants.push(...shuffle(eligible.filter(h=>!entrants.includes(h))).slice(0,Math.min(3-entrants.length,eligible.length)));
    if(!entrants.length)return null;
    const comp=C().runCompetition(entrants,{week,type:'temptation'});const ranking=comp.ranking||[];const loserId=ranking[ranking.length-1]?.id;const winner=comp.winner;winner.safe=true;
    let third=null;if(loserId){const loser=hg(s,loserId);if(loser&&loser.id!==winner.id){loser.nominated=true;loser.temtpNominee=true;third=loser;if(!s.nominees.includes(loser.id))s.nominees.push(loser.id);}}
    log(s,{week,phase:'temptation',type:'temptation-competition',winnerId:winner.id,participants:entrants.map(h=>h.id),loserId:third?.id||null,competition:comp,title:`Temptation Competition — ${comp.label}`,lines:[`${displayName(winner)} wins the Temptation Competition and is immune for the week.`,third?`${displayName(third)} finishes last and becomes the third nominee.`:`No third nominee is created.`]});
    return {winner,third};
  }
  function selectPOVPlayers(s,week){
    const hoh=hg(s,s.currentHOH);const nominees=s.nominees.map(id=>hg(s,id)).filter(Boolean);let pool=living(s).filter(h=>h.id!==hoh.id&&!nominees.some(n=>n.id===h.id));
    const ring=s.powers.find(p=>p.type==='ring'&&!p.used&&p.ownerId&&p.expiresWeek>=week);if(ring&&Math.random()<0.55){ring.used=true;const owner=hg(s,ring.ownerId);if(owner&&!nominees.some(n=>n.id===owner.id)){const replace=shuffle(pool)[0];if(replace){pool=pool.filter(x=>x.id!==replace.id);pool.push(owner);log(s,{week,phase:'temptation',type:'ring-replacement',winnerId:owner.id,replacedId:replace.id,title:'Ring of Replacement',lines:[`${displayName(owner)} uses the Ring of Replacement and takes ${displayName(replace)}'s POV spot.`]});}}}
    const selected=shuffle(pool).slice(0,Math.min(4,pool.length));const participants=[hoh,...nominees,...selected].filter((h,i,a)=>a.findIndex(x=>x.id===h.id)===i);
    s.povPlayers=participants.map(h=>h.id);
    log(s,{week,phase:'standard',type:'pov-players',hohId:hoh.id,nomineeIds:[...s.nominees],povPlayers:s.povPlayers,title:'Power of Veto — Picked Players',lines:[`The Power of Veto players are ${participants.map(displayName).join(', ')}.`]});
    return participants;
  }
  function runPOV(s,week,participants){const comp=C().runCompetition(participants,{week,type:'pov'});const winner=comp.winner;s.vetoWinners=[winner.id];log(s,{week,phase:'standard',type:'pov',winnerId:winner.id,participants:participants.map(h=>h.id),competition:comp,title:`Power of Veto — ${comp.label}`,lines:[`${displayName(winner)} wins the Power of Veto.`]});return {winner,comp};}
  function chooseVetoUse(s,week,winner){
    const nominees=s.nominees.map(id=>hg(s,id)).filter(Boolean);const hoh=hg(s,s.currentHOH);if(nominees.some(n=>n.id===winner.id))return {use:true,saveId:winner.id,reason:'self-save'};
    // Critical BB19 behavior: a HOH may use the veto on a pawn to execute a planned backdoor.
    if(winner.id===hoh.id&&s.backdoorPlanActive&&s.backdoorTargetId&&hg(s,s.backdoorTargetId)?.active)return {use:true,saveId:nominees.slice().sort((a,b)=>{const ra=rel(s,hoh,a),rb=rel(s,hoh,b);return (rb.trust+rb.loyalty)-(ra.trust+ra.loyalty);})[0]?.id||nominees[0]?.id,reason:'execute-backdoor'};
    return R().decideVetoUse(s,winner,hoh,nominees);
  }
  function applyVeto(s,week,winner){
    const hoh=hg(s,s.currentHOH),nominees=s.nominees.map(id=>hg(s,id)).filter(Boolean);const decision=chooseVetoUse(s,week,winner);let replacement=null;
    if(decision.use){const saved=hg(s,decision.saveId);if(saved&&nominees.some(n=>n.id===saved.id)){
      saved.nominated=false;s.nominees=s.nominees.filter(id=>id!==saved.id);
      let pool=living(s).filter(p=>p.id!==hoh.id&&!p.safe&&!s.nominees.includes(p.id)&&p.id!==saved.id&&p.id!==winner.id&&!((p.pendantUntil||0)>=week));
      // Never allow the veto holder to become the replacement nominee.
      replacement=s.backdoorPlanActive&&s.backdoorTargetId&&pool.some(p=>p.id===s.backdoorTargetId)?hg(s,s.backdoorTargetId):R().pickReplacement(s,hoh,pool,[]);
      if(replacement){replacement.nominated=true;s.nominees.push(replacement.id);if(replacement.id===s.backdoorTargetId)s.targetHistory.push({name:displayName(replacement),reason:'backdoor replacement'});}
      if(s.backdoorTargetId&&replacement?.id===s.backdoorTargetId){s.intendedTarget=s.backdoorTargetId;}
      log(s,{week,phase:'standard',type:'veto-ceremony',hohId:hoh.id,winnerId:winner.id,savedId:saved.id,replacementId:replacement?.id||null,vetoUsed:true,title:'Veto Ceremony',vetoUsed:true,lines:[`${displayName(winner)} uses the Power of Veto on ${displayName(saved)}.`,replacement?`${displayName(hoh)} names ${displayName(replacement)} as the replacement nominee.`:`No replacement nominee is required.`]});
      return;
    }}
    log(s,{week,phase:'standard',type:'veto-ceremony',hohId:hoh.id,winnerId:winner.id,vetoUsed:false,savedId:null,replacementId:null,title:'Veto Ceremony',lines:[`${displayName(winner)} does not use the Power of Veto.`]});
  }
  function treeOfTemptation(s,week){
    if(week<8||week>10)return null;
    const eligible=living(s).filter(h=>!h.treeUsed);if(!eligible.length)return null;
    // Each week has a chance that nobody takes an apple, matching the actual uncertainty of the twist.
    if(Math.random()<0.28){log(s,{week,phase:'temptation',type:'tree-of-temptation',title:'Tree of Temptation',lines:['The Tree of Temptation is available, but nobody takes an apple this week.']});return null;}
    const picker=eligible.sort((a,b)=>((b.ratings?.risk||50)+(b.ratings?.strategic||50)+Math.random()*50)-((a.ratings?.risk||50)+(a.ratings?.strategic||50)+Math.random()*50))[0];picker.treeUsed=true;
    const remaining=window.BB19_CONFIG.treeOfTemptation.powers.filter(p=>!s.temptations.some(t=>t.powerId===p.id));if(!remaining.length)return null;
    const power=shuffle(remaining)[0];s.temptations.push({powerId:power.id,pickerId:picker.id,week,used:false});s.treeOfTemptation={pickerId:picker.id,powerId:power.id,week};
    if(power.id==='save-friend'){const target=shuffle(living(s).filter(h=>h.id!==picker.id))[0];if(target){target.safe=true;log(s,{week,phase:'temptation',type:'tree-power',winnerId:picker.id,targetId:target.id,powerId:power.id,title:`Tree of Temptation — ${power.name}`,lines:[`${displayName(picker)} receives ${power.name} and grants immunity to ${displayName(target)} for the week.`]});return power;}}
    if(power.id==='second-veto'){s.powers.push({type:'second-veto',ownerId:picker.id,wonWeek:week,expiresWeek:week,used:false});}
    if(power.id==='no-next-hoh'){picker.noNextHOH=true;}
    if(power.id==='bounty'){picker.bounty=5000;}
    if(power.id==='eliminate-two-votes'){picker.eliminateTwoVotes=true;}
    log(s,{week,phase:'temptation',type:'tree-power',winnerId:picker.id,powerId:power.id,title:`Tree of Temptation — ${power.name}`,lines:[`${displayName(picker)} takes an apple and receives ${power.name}.`,power.description]});
    return power;
  }
  function eviction(s,week,cycle=1){
    const noms=s.nominees.map(id=>hg(s,id)).filter(h=>h?.active);if(noms.length<2)return null;
    let voters=living(s).filter(h=>!noms.some(n=>n.id===h.id));
    const eliminateOwner=s.houseguests.find(h=>h.eliminateTwoVotes&&h.active);
    if(eliminateOwner){const removed=shuffle(voters).slice(0,Math.min(2,voters.length));voters=voters.filter(v=>!removed.some(o=>o.id===v.id));eliminateOwner.eliminateTwoVotes=false;log(s,{week,phase:'temptation',type:'tree-vote-power',winnerId:eliminateOwner.id,title:'Tree of Temptation — Two Votes Eliminated',lines:[`${displayName(eliminateOwner)}'s power removes two eviction votes from the ceremony.`]});}
    const votes=[];const counts={};noms.forEach(n=>counts[n.id]=0);
    voters.forEach(v=>{
      const scored=noms.map(n=>{const r=rel(s,v,n);let score=bond(s,v,n)+Number(r.friendship||50)*.10+Number(r.trust||50)*.08+Number(r.loyalty||50)*.06-Number(r.rivalry||0)*.22;if(n.id===s.intendedTarget)score-=24;if(n.id===s.backdoorTargetId)score-=32;if(ally(s,v,n))score+=14;score+=Math.random()*22-11;return {n,score};}).sort((a,b)=>a.score-b.score);
      const target=scored[0].n.id;counts[target]++;votes.push({voterId:v.id,targetId:target});
    });
    const ordered=noms.slice().sort((a,b)=>counts[b.id]-counts[a.id]);
    let evictedId=ordered[0].id,tieBreakVoteId=null;
    const top=ordered.filter(n=>counts[n.id]===counts[ordered[0].id]);
    if(top.length>1){const hoh=hg(s,s.currentHOH);evictedId=R().decideTieBreak(s,hoh,top[0],top[1]);tieBreakVoteId=evictedId;}
    const ev=hg(s,evictedId);ev.active=false;ev.evicted=true;ev.placement=living(s).length+1;s.evicted.push(ev.id);if(ev.placement<=window.BB19_CONFIG.juryThresholdPlacement&&!s.jury.includes(ev.id)){ev.juryMember=true;s.jury.push(ev.id);}
    const countText=Object.entries(counts).map(([id,n])=>`${displayName(hg(s,id))}: ${n}`).join(' • ');
    log(s,{week,phase:cycle>1?'double-eviction':'standard',type:'eviction',evictedId:ev.id,nomineeIds:noms.map(n=>n.id),votes,voteCounts:counts,evictedVoteCount:counts[ev.id],tieBreakVoteId,title:'Eviction',lines:[tieBreakVoteId?`${displayName(ev)} is evicted after a tie-breaker.`:`${displayName(ev)} is evicted.`,noms.length===2?`By a vote of ${counts[noms[0].id]} to ${counts[noms[1].id]}, ${displayName(ev)} is evicted.`:`Vote count: ${countText}`,ev.juryMember?`${displayName(ev)} joins the jury.`:`${displayName(ev)} finishes in ${ordinal(ev.placement)} place.`]});
    s.nominees=[];s.povPlayers=[];s.vetoWinners=[];s.evictionVotes=[];s.backdoorPlanActive=false;s.backdoorTargetId=null;s.intendedTarget=null;return ev;
  }
  function battleBack(s){
    const eligible=s.evicted.map(id=>hg(s,id)).filter(h=>h).slice(0,4);if(eligible.length<4)return;
    let round1=C().runCompetition(eligible,{week:4,type:'battleback-1'});const ranking=round1.ranking;const finalists=ranking.slice(0,2).map(x=>hg(s,x.id));log(s,{week:4,phase:'battle-back',type:'battleback-1',participants:eligible.map(h=>h.id),advancers:finalists.map(h=>h.id),competition:round1,title:'Battle Back Showdown — Round 1',lines:[`${finalists.map(displayName).join(' and ')} advance to Round 2.`]});
    const round2=C().runCompetition(finalists,{week:4,type:'battleback-2'});const challenger=round2.winner;const loser=finalists.find(h=>h.id!==challenger.id);log(s,{week:4,phase:'battle-back',type:'battleback-2',participants:finalists.map(h=>h.id),winnerId:challenger.id,competition:round2,title:'Battle Back Showdown — Round 2',lines:[`${displayName(challenger)} advances to the final Battle Back round.`,`${displayName(loser)} is eliminated from the Battle Back.`]});
    const active=living(s);const houseChallenger=C().runCompetition(active,{week:4,type:'battleback-3'}).winner;const final=C().runCompetition([challenger,houseChallenger],{week:4,type:'battleback-3'});log(s,{week:4,phase:'battle-back',type:'battleback-3',participants:[challenger.id,houseChallenger.id],winnerId:final.winner.id,competition:final,title:'Battle Back Showdown — Final Round',lines:[`${displayName(final.winner)} wins the final Battle Back round.`]});
    if(final.winner.id===challenger.id){challenger.active=true;challenger.evicted=false;challenger.placement=null;challenger.juryMember=false;s.jury=s.jury.filter(id=>id!==challenger.id);s.evicted=s.evicted.filter(id=>id!==challenger.id);log(s,{week:4,phase:'battle-back',type:'battleback-return',winnerId:challenger.id,title:'Battle Back — Return to the Game',lines:[`${displayName(challenger)} returns to the game.`]});return challenger;}
    return null;
  }
  function runCycle(s,week,cycle=1){
    s.week=week;s.phase=cycle>1?'double-eviction':'in-season';resetFlags(s);
    let hoh;
    const prev=hg(s,s.currentHOH);
    let pool=living(s).filter(h=>h.id!==prev?.id&&!h.noNextHOH);
    const comp=C().runCompetition(pool,{week,type:cycle>1?'hoh-de':'hoh'});hoh=comp.winner;s.currentHOH=hoh.id;s.originalHOH=hoh.id;hoh.noNextHOH=false;
    log(s,{week,phase:cycle>1?'double-eviction':'standard',type:cycle>1?'hoh-de':'hoh',winnerId:hoh.id,participants:pool.map(p=>p.id),competition:comp,title:`Head of Household — ${comp.label}`,lines:[`${displayName(hoh)} wins HOH.`]});
    if(week<=3)runDenOfTemptation(s,week);
    if(week>=8&&week<=10)treeOfTemptation(s,week);
    runNominations(s,week);
    const temptation=runTemptationCompetition(s,week);
    // A Save-a-Friend apple, Pendant or Temptation Competition immunity can make a nominee immune.
    s.nominees=s.nominees.filter(id=>{const h=hg(s,id);if(h?.safe||((h?.pendantUntil||0)>=week)){h.nominated=false;return false;}return true;});
    while(s.nominees.length<2){const candidate=shuffle(living(s).filter(h=>h.id!==hoh.id&&!h.safe&&!s.nominees.includes(h.id)&&!((h.pendantUntil||0)>=week)))[0];if(!candidate)break;candidate.nominated=true;s.nominees.push(candidate.id);}
    if(temptation?.third&&s.nominees.includes(temptation.third.id)){}
    const povPlayers=selectPOVPlayers(s,week);const veto=runPOV(s,week,povPlayers);applyVeto(s,week,veto.winner);
    // If a Halting Hex holder is a nominee and chooses to activate it, cancel the eviction.
    const hex=s.powers.find(p=>p.type==='halting-hex'&&!p.used&&p.ownerId&&p.expiresWeek>=week);if(hex&&s.nominees.includes(hex.ownerId)&&Math.random()<0.55){hex.used=true;log(s,{week,phase:'temptation',type:'halting-hex',winnerId:hex.ownerId,title:'Halting Hex — Eviction Cancelled',lines:[`${displayName(hg(s,hex.ownerId))} activates the Halting Hex and cancels the eviction.`,`The nominees remain in the game and the week advances.`]});s.nominees=[];s.povPlayers=[];s.vetoWinners=[];s.backdoorPlanActive=false;s.backdoorTargetId=null;return;}
    const ev=eviction(s,week,cycle);if(ev?.bounty){ }
    if(s.evicted.length===4&&!s.battleBackPlayed){s.battleBackPlayed=true;battleBack(s);}
    if(week===10&&cycle===1&&living(s).length>3)runCycle(s,week,2);
  }
  function runPremiere(s){
    s.week=1;s.phase='premiere';resetFlags(s);const money=chooseFirstTemptation(s);runHitTheRoad(s);const hoh=runFirstHOH(s);runNominations(s,1);const players=selectPOVPlayers(s,1);const veto=runPOV(s,1,players);applyVeto(s,1,veto.winner);eviction(s,1,1);
  }
  function runFinale(s){
    s.week='Final';s.phase='finale';const three=living(s);if(three.length!==3)return;
    const p1=C().runCompetition(three,{week:14,type:'final-hoh-1'});log(s,{week:'Final',phase:'finale',type:'final3-part1',winnerId:p1.winner.id,participants:three.map(p=>p.id),competition:p1,title:`Final HOH Part 1 — ${p1.label}`,lines:[`${displayName(p1.winner)} wins Part 1.`]});
    const rem=three.filter(p=>p.id!==p1.winner.id);const p2=C().runCompetition(rem,{week:14,type:'final-hoh-2'});log(s,{week:'Final',phase:'finale',type:'final3-part2',winnerId:p2.winner.id,participants:rem.map(p=>p.id),competition:p2,title:`Final HOH Part 2 — ${p2.label}`,lines:[`${displayName(p2.winner)} wins Part 2.`]});
    const p3=C().runCompetition([p1.winner,p2.winner],{week:14,type:'final-hoh-3'});const finalHoh=p3.winner;const other=three.filter(p=>p.id!==finalHoh.id);const chosen=R().decideFinalTwoPick(s,finalHoh,other);const third=other.find(p=>p.id!==chosen.id);log(s,{week:'Final',phase:'finale',type:'final3-part3',winnerId:finalHoh.id,participants:[p1.winner.id,p2.winner.id],competition:p3,title:`Final HOH Part 3 — ${p3.label}`,lines:[`${displayName(finalHoh)} wins Part 3 and becomes the final HOH.`]});
    third.active=false;third.evicted=true;third.placement=3;third.juryMember=true;if(!s.jury.includes(third.id))s.jury.push(third.id);s.evicted.push(third.id);s.currentHOH=finalHoh.id;log(s,{week:'Final',phase:'finale',type:'final-decision',hohId:finalHoh.id,thirdPlaceId:third.id,finalistIds:[finalHoh.id,chosen.id],title:"Final HOH's Decision",lines:[`${displayName(finalHoh)} takes ${displayName(chosen)} to the Final 2 and evicts ${displayName(third)}.`]});
    const finalists=[finalHoh,chosen],jurors=s.jury.map(id=>hg(s,id)).filter(Boolean),tally={[finalists[0].id]:0,[finalists[1].id]:0};s._juryVotes=[];jurors.forEach(j=>{const vote=R().decideJuryVote(s,j,finalists[0],finalists[1]);tally[vote]++;s._juryVotes.push({voterId:j.id,targetId:vote});});log(s,{week:'Final',phase:'finale',type:'jury-vote',votes:s._juryVotes,finalistIds:finalists.map(p=>p.id),title:'The Jury Votes',lines:s._juryVotes.map(v=>`${displayName(hg(s,v.voterId))} votes for ${displayName(hg(s,v.targetId))}.`)});
    const winnerId=tally[finalists[0].id]>=tally[finalists[1].id]?finalists[0].id:finalists[1].id;const runnerId=winnerId===finalists[0].id?finalists[1].id:finalists[0].id;hg(s,winnerId).placement=1;hg(s,runnerId).placement=2;hg(s,winnerId).active=false;hg(s,runnerId).active=false;
    const afpCandidates=s.houseguests.slice();const scores=afpCandidates.map(h=>({id:h.id,score:(h.ratings?.social||50)*.45+(h.ratings?.general||50)*.2+Math.random()*15})).sort((a,b)=>b.score-a.score);const afpId=scores[0]?.id||winnerId;
    s.finale={winnerId,runnerUpId:runnerId,thirdPlaceId:third.id,finalHohId:finalHoh.id,votes:tally,jurySize:jurors.length,prize:750000,runnerUpPrize:75000,americasFavoritePrize:50000,americasFavoriteId:afpId};s.phase='complete';log(s,{week:'Final',phase:'finale',type:'winner',winnerId,runnerUpId:runnerId,thirdPlaceId:third.id,finalistIds:[winnerId,runnerId],afpId,title:`${displayName(hg(s,winnerId))} Wins Big Brother!`,lines:[`By a vote of ${tally[winnerId]}-${tally[runnerId]}, ${displayName(hg(s,winnerId))} wins Big Brother.`,`${displayName(hg(s,runnerId))} finishes as the Runner-Up.`,`America's Favorite Player: ${displayName(hg(s,afpId))}.`]});
  }
  function simulateSeason(s,config){
    ensureState(s);s.history=[];s.jury=[];s.evicted=[];s.nominees=[];s.povPlayers=[];s.vetoWinners=[];s.currentHOH=null;s.originalHOH=null;s.finale=null;s.backdoorPlanActive=false;s.backdoorTargetId=null;s.intendedTarget=null;s.targetHistory=[];s.powers=[];s.temptations=[];s.firstTemptation=null;s.treeOfTemptation=null;s.battleBack=null;s.battleBackPlayed=false;s.temptationCompetitionUnlocked=false;s.houseguests.forEach(h=>{h.active=true;h.safe=false;h.nominated=false;h.juryMember=false;h.evicted=false;h.placement=null;h.mustThrowFirstHOH=false;h.denUsed=false;h.treeUsed=false;h.pendantUntil=0;h.nominationCurseUntil=0;h.usedNominationCurse=false;h.noNextHOH=false;h.bounty=0;h.eliminateTwoVotes=false;});
    runPremiere(s);let week=2,guard=0;while(living(s).length>3&&week<=18&&guard<24){runCycle(s,week,1);week++;guard++;}runFinale(s);if(window.LiveFeeds?.addToSeason)window.LiveFeeds.addToSeason(s);return s;
  }
  window.SeasonEngine={simulateSeason,displayName,ordinal};
})();
