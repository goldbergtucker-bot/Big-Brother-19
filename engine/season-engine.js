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
  function snapshot(s){return {phase:s.phase,week:s.week,currentHOH:s.currentHOH,originalHOH:s.originalHOH,secretHOH:s.secretHOH,dethronedHOH:s.dethronedHOH,nominees:[...s.nominees],intendedTarget:s.intendedTarget,targetHistory:[...(s.targetHistory||[])],backdoorTargetId:s.backdoorTargetId||null,backdoorPlanActive:!!s.backdoorPlanActive,backdoorPlanCount:s.backdoorPlanCount||0,povPlayers:[...s.povPlayers],vetoWinners:[...s.vetoWinners],evictionVotes:[...(s.evictionVotes||[])],evicted:[...s.evicted],jury:[...s.jury],powers:(s.powers||[]).map(x=>({...x})),temptations:[...(s.temptations||[])],firstTemptation:s.firstTemptation?{...s.firstTemptation}:null,treeOfTemptation:s.treeOfTemptation?{...s.treeOfTemptation}:null,battleBack:s.battleBack?JSON.parse(JSON.stringify(s.battleBack)):null,normalEvictionCount:s.normalEvictionCount||0,finalExitOrder:[...(s.finalExitOrder||[])],houseguests:s.houseguests.map(h=>({id:h.id,slot:h.slot,firstName:h.firstName,lastName:h.lastName,portraitUrl:h.portraitUrl,gender:h.gender,active:h.active,safe:h.safe,nominated:h.nominated,juryMember:h.juryMember,evicted:h.evicted,selfEvicted:!!h.selfEvicted,friendshipBracelet:!!h.friendshipBracelet,placement:h.placement}))};}
  function eventData(s,e){
    const d={...(e.data||{})};
    // Preserve presentation fields that are stored on the history event itself.
    // Premiere events need these IDs available to the event renderer so their
    // portraits/cards can be resolved from the event snapshot.
    if(e.winnerId!=null)d.winnerId=e.winnerId;
    if(e.hohId!=null)d.hohId=e.hohId;
    if(e.evictedId!=null)d.evictedId=e.evictedId;
    if(e.runnerUpId!=null)d.runnerUpId=e.runnerUpId;
    if(e.thirdPlaceId!=null)d.thirdPlaceId=e.thirdPlaceId;
    if(e.selfEvictedId!=null)d.selfEvictedId=e.selfEvictedId;
    if(e.challengerId!=null)d.challengerId=e.challengerId;
    if(e.battleBackWinnerId!=null)d.battleBackWinnerId=e.battleBackWinnerId;
    if(e.voteRecords)d.voteRecords=[...e.voteRecords];
    if(e.entrantId!=null)d.entrantId=e.entrantId;
    if(e.recipientIds)d.recipientIds=[...e.recipientIds];
    if(e.participants)d.participants=[...e.participants];
    if(e.povPlayers)d.povPlayers=[...e.povPlayers];
    if(e.nomineeIds)d.nomineeIds=[...e.nomineeIds];
    if(e.type==='eviction-voting'){d.votes=e.votes||[];d.voteCounts=e.voteCounts||{};d.nomineeIds=[...(e.nomineeIds||s.nominees||[])];}
    if(e.type==='eviction'){d.votes=e.votes||s.evictionVotes||[];d.voteCounts=e.voteCounts||{};d.evictedVoteCount=e.evictedVoteCount;d.stayVoteCount=e.stayVoteCount;d.tieBreakVoteId=e.tieBreakVoteId||null;}
    if(e.type==='veto-ceremony'){d.vetoUsed=!!e.vetoUsed;d.savedId=e.savedId||null;d.replacementId=e.replacementId||null;d.finalNomineeIds=[...s.nominees];}
    return d;
  }
  function log(s,e){const r={id:s.history.length+1,...e};r.snapshot=snapshot(s);r.data=eventData(s,r);s.history.push(r);}
  function ensureState(s){s.targetHistory=s.targetHistory||[];s.powers=s.powers||[];s.temptations=s.temptations||[];s.jury=s.jury||[];s.evicted=s.evicted||[];s.nominees=s.nominees||[];s.povPlayers=s.povPlayers||[];s.vetoWinners=s.vetoWinners||[];s.evictionVotes=s.evictionVotes||[];s.alliances=s.alliances||[];s.finalExitOrder=s.finalExitOrder||[];}
  function resetFlags(s){s.houseguests.forEach(h=>{h.safe=false;h.nominated=false;h.thirdNominee=false;h.temtpNominee=false;});}
  function chooseFirstTemptation(s){
    // BB19 premiere format: the first 16 houseguests begin the game.
    // The $25,000 is always taken; only the first presser is randomized.
    // The editable slot 17 is then brought into the house by the temptation.
    const starters=living(s).filter(h=>h.slot!==17);
    const entrant=hg(s,"hg-17");
    const scored=starters.map(h=>({h,score:
      (h.ratings?.general||50)*.18+(h.ratings?.strategic||50)*.18+
      (h.ratings?.social||50)*.08+(h.ratings?.physical||50)*.08+
      Math.random()*58
    })).sort((a,b)=>b.score-a.score);
    const winner=scored[0].h;
    s.firstTemptation={winnerId:winner.id,amount:25000,guaranteedTaken:true};
    winner.mustThrowFirstHOH=true;

    log(s,{week:1,phase:"premiere",type:"temptation-25000",winnerId:winner.id,
      participants:starters.map(p=>p.id),title:"Garden of Temptation — $25,000",
      lines:[`${displayName(winner)} was the first houseguest to press the button and takes $25,000.`,
        "The $25,000 temptation was guaranteed to be taken; the race determined who pressed first.",
        `${displayName(winner)} must throw the first HOH competition.`]});

    if(entrant){
      entrant.active=true; entrant.safe=false; entrant.nominated=false;
      log(s,{week:1,phase:"premiere",type:"houseguest-entry",entrantId:entrant.id,
        participants:[entrant.id],title:"The 17th Houseguest Enters",
        lines:[`${displayName(entrant)} enters the Big Brother house as the 17th houseguest.`,
          "The Garden of Temptation has brought a new Houseguest into the game."]});
    }
    return winner;
  }

  function runFriendshipBracelets(s){
    // The new 17th Houseguest receives the BB19-style power to grant eight
    // Friendship Bracelets. Those eight are safe from the premiere eviction.
    const entrant=hg(s,"hg-17");
    const starters=living(s).filter(h=>h.slot!==17);
    if(!entrant || !entrant.active || starters.length<8)return null;
    const ranked=starters.map(h=>({h,score:
      bond(s,entrant,h)+Number(h.ratings?.social||50)*.12+Math.random()*28
    })).sort((a,b)=>b.score-a.score);
    const recipients=ranked.slice(0,8).map(x=>x.h);
    const protectedIds=new Set(recipients.map(h=>h.id));
    recipients.forEach(h=>{h.safe=true;h.friendshipBracelet=true;});
    const unprotected=starters.filter(h=>!protectedIds.has(h.id));
    log(s,{week:1,phase:"premiere",type:"friendship-bracelets",winnerId:entrant.id,
      recipientIds:recipients.map(h=>h.id),participants:starters.map(h=>h.id),
      title:"Friendship Bracelets — 8 Houseguests Safe",
      lines:[`${displayName(entrant)} gives Friendship Bracelets to eight Houseguests, making them safe from the opening eviction.`,
        `${recipients.map(displayName).join(", ")} receive Friendship Bracelets.`,
        `${unprotected.map(displayName).join(", ")} do not receive bracelets and must compete for safety in Hit the Road.`]});
    return {recipients,unprotected};
  }

  function runHitTheRoad(s){
    // Only the eight Houseguests without Friendship Bracelets compete.
    const eligible=living(s).filter(h=>h.slot!==17&&!h.safe);
    if(eligible.length<3)return null;
    const comp=C().runCompetition(eligible,{week:1,type:"hit-the-road"});
    const winner=comp.winner;
    winner.safe=true; winner.firstSafety=true;

    // BB19's premiere competition left three Houseguests with poisoned apples.
    // We model the uncertainty with the competition ranking rather than making
    // the three nominees fixed.
    const ranking=comp.ranking||[];
    const nomineeIds=ranking.slice(-3).map(x=>x.id);
    const nominees=nomineeIds.map(id=>hg(s,id)).filter(Boolean);
    s.nominees=nominees.map(h=>h.id);
    nominees.forEach(h=>{h.nominated=true;h.safe=false;});

    log(s,{week:1,phase:"premiere",type:"hit-the-road",winnerId:winner.id,
      participants:eligible.map(p=>p.id),nomineeIds:s.nominees,
      competition:comp,title:`Hit the Road — ${comp.label}`,
      lines:[`${displayName(winner)} wins Hit the Road and earns safety.`,
        `${nominees.map(displayName).join(", ")} receive the three poisoned apples and are nominated for the opening eviction.`,
        "The three nominees will now face the first eviction vote. The 17th Houseguest is eligible to vote."]});
    return {winner,nominees,comp};
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
    // BB19 custom rule: the 17th Houseguest is ALWAYS the Week 1 Pendant of
    // Protection recipient. Later Den of Temptation selections remain simulated.
    let chosen;
    if(week===1){
      const entrant=hg(s,"hg-17");
      chosen=(entrant&&entrant.active&&!entrant.denUsed)?entrant:null;
    }
    if(!chosen){
      chosen=eligible.sort((a,b)=>((b.ratings?.social||50)+(b.ratings?.general||50)+Math.random()*25)-((a.ratings?.social||50)+(a.ratings?.general||50)+Math.random()*25))[0];
    }
    chosen.denUsed=true;
    const cfg=window.BB19_CONFIG.denOfTemptation.temptations[week-1];
    let accepted=true;
    let power=null;
    if(accepted){
      if(cfg.id==='pendant'){
        // BB19 Week 1: the Pendant protects the holder from the next three
        // evictions, while a separate Houseguest receives the nomination curse.
        power={type:'pendant',ownerId:chosen.id,wonWeek:week,expiresWeek:week+2,used:false};
        chosen.pendantUntil=week+2;
        const cursePool=living(s).filter(h=>h.id!==chosen.id);
        const cursed=shuffle(cursePool)[0];
        if(cursed){
          cursed.nominationCurseUntil=week+3;
          cursed.usedNominationCurse=false;
          power.cursedId=cursed.id;
        }
      } else if(cfg.id==='ring'){
        // BB19 Week 2: the Ring of Replacement lets its holder replace one
        // randomly selected Veto player with themselves. Its consequence is
        // the Ve-Toad punishment applied to three other Houseguests.
        power={type:'ring',ownerId:chosen.id,wonWeek:week,expiresWeek:week,used:false};
        const curse=shuffle(living(s).filter(h=>h.id!==chosen.id)).slice(0,3).map(h=>h.id);
        power.curseIds=curse;
        curse.forEach(id=>{const h=hg(s,id);if(h)h.veToadUntil=week;});
      } else {
        // BB19 Week 3: the Halting Hex unlocks the Temptation Competition
        // for Weeks 5, 6 and 7. It does not create another curse.
        power={type:'halting-hex',ownerId:chosen.id,wonWeek:week,expiresWeek:week+3,used:false};
        s.temptationCompetitionUnlocked=true;
      }
      s.powers.push(power);
    }
    log(s,{week,phase:'temptation',type:'den-of-temptation',winnerId:chosen.id,temptationId:cfg.id,temptationName:cfg.name,powerId:power?.type||null,cursedId:power?.cursedId||null,curseIds:power?.curseIds||[],title:`Den of Temptation — ${cfg.name}`,lines:[`${displayName(chosen)} is selected to enter the Den of Temptation.`,`${displayName(chosen)} accepts the ${cfg.name}.`,power?.cursedId?`${displayName(hg(s,power.cursedId))} receives the nomination curse.`:power?.curseIds?.length?`${power.curseIds.map(id=>displayName(hg(s,id))).join(', ')} receive the Ve-Toad curse.`:`The Temptation Competition is unleashed for Weeks 5–7.`]});
    return chosen;
  }
  function runNominations(s,week){
    const hoh=hg(s,s.currentHOH);
    const existingThirdIds=(s.nominees||[]).filter(id=>hg(s,id)?.thirdNominee);
    const existingThird=existingThirdIds.map(id=>hg(s,id)).filter(Boolean)[0]||null;
    const pool=living(s).filter(h=>h.id!==hoh.id&&!h.safe&&!((h.pendantUntil||0)>=week)&&(!existingThird||h.id!==existingThird.id));

    // The HOH ALWAYS makes exactly two nominations. A third nominee created by
    // a twist is independent of the HOH's nominations and is preserved here.
    const cursed=week>=2 ? pool.find(h=>(h.nominationCurseUntil||0)>=week&&!h.usedNominationCurse) : null;
    const nominees=R().pickNominees(s,hoh,pool,2).filter(Boolean);
    let final=[...new Map(nominees.map(h=>[h.id,h])).values()];
    while(final.length<2){
      const x=shuffle(pool.filter(h=>!final.some(n=>n.id===h.id)))[0];
      if(!x)break;
      final.push(x);
    }

    let third=existingThird;
    if(!third && cursed && !final.some(h=>h.id===cursed.id)){
      third=cursed;
      third.usedNominationCurse=true;
      third.thirdNominee=true;
      third.nominatedByHOH=false;
      third.hohNominated=false;
      third.thirdNomineeSource='nomination-curse';
    }

    final.forEach(h=>{
      h.nominated=true;
      h.nominatedByHOH=true;
      h.hohNominated=true;
      h.thirdNominee=false;
    });
    if(third){
      third.nominated=true;
      third.nominatedByHOH=false;
      third.hohNominated=false;
      third.thirdNominee=true;
      s.nominees=[...final.map(h=>h.id),third.id];
    }else{
      s.nominees=final.map(h=>h.id);
    }

    const targetPlan=R().planBackdoor(s,hoh,final);
    s.backdoorPlanActive=!!targetPlan.use;
    if(s.backdoorPlanActive)s.backdoorPlanCount=(s.backdoorPlanCount||0)+1;
    s.backdoorTargetId=targetPlan.target?.id||null;
    s.intendedTarget=targetPlan.use?targetPlan.target.id:(final[0]?.id||null);
    s.targetHistory=[];
    if(targetPlan.use)s.targetHistory.push({name:displayName(targetPlan.target),reason:targetPlan.reason});

    const lines=[
      `${displayName(hoh)} nominates ${final.map(displayName).join(' and ')} for eviction.`,
      third ? `${displayName(third)} is the third nominee created by ${third.thirdNomineeSource==='temptation-competition'?'the Temptation Competition':'the Nomination Curse'}; the HOH did not nominate ${displayName(third)}.` :
        (targetPlan.use?`${displayName(hoh)} secretly plans to backdoor ${displayName(targetPlan.target)} (${targetPlan.reason}).`:`${displayName(hoh)} does not establish a backdoor plan this week.`)
    ];
    if(third && targetPlan.use) lines.push(`${displayName(hoh)} secretly plans to backdoor ${displayName(targetPlan.target)} (${targetPlan.reason}).`);
    log(s,{week,phase:'standard',type:'nominations',hohId:hoh.id,hohNomineeIds:final.map(h=>h.id),thirdNomineeId:third?.id||null,nomineeIds:s.nominees,backdoorTargetId:s.backdoorTargetId,intendedTarget:s.intendedTarget,backdoorPlanActive:s.backdoorPlanActive,title:'Nominations',lines});
  }
  function runTemptationCompetition(s,week){
    if(!s.temptationCompetitionUnlocked||week<5||week>7)return null;
    const hoh=hg(s,s.currentHOH);
    const eligible=living(s).filter(h=>h.id!==hoh.id&&!h.safe&&!h.nominated&&!h.thirdNominee&&!((h.pendantUntil||0)>=week));
    const entrants=eligible.filter(h=>{
      const risk=(h.ratings?.strategic||50)*.35+(h.ratings?.physical||50)*.20+(h.ratings?.general||50)*.15+Math.random()*45;
      return risk>=60;
    });
    if(entrants.length<3)entrants.push(...shuffle(eligible.filter(h=>!entrants.includes(h))).slice(0,Math.min(3-entrants.length,eligible.length)));
    if(!entrants.length)return null;
    const comp=C().runCompetition(entrants,{week,type:'temptation'});
    const ranking=Array.isArray(comp.ranking)?comp.ranking:[];
    const loserId=ranking.length?ranking[ranking.length-1]?.id:null;
    const winner=comp.winner;
    if(winner)winner.safe=true;
    let third=null;
    if(loserId){
      const loser=hg(s,loserId);
      if(loser&&(!winner||loser.id!==winner.id)){
        loser.nominated=true;
        loser.temtpNominee=true;
        loser.thirdNominee=true;
        loser.nominatedByHOH=false;
        loser.hohNominated=false;
        loser.thirdNomineeSource='temptation-competition';
        third=loser;
        // Preserve this third nominee until the nomination ceremony appends the HOH's two nominees.
        s.nominees=[loser.id];
      }
    }
    log(s,{week,phase:'temptation',type:'temptation-competition',winnerId:winner?.id||null,participants:entrants.map(h=>h.id),loserId:third?.id||null,thirdNomineeId:third?.id||null,competition:comp,title:`Temptation Competition — ${comp.label}`,lines:[winner?`${displayName(winner)} wins the Temptation Competition and is immune for the week.`:'The Temptation Competition is completed.',third?`${displayName(third)} finishes last and is the THIRD NOMINEE from the Temptation Competition. The HOH will still make two separate nominations.`:`No third nominee is created.`]});
    return {winner,third};
  }
  function selectPOVPlayers(s,week){
    const hoh=hg(s,s.currentHOH);
    const nominees=s.nominees.map(id=>hg(s,id)).filter(Boolean);
    let pool=living(s).filter(h=>h.id!==hoh.id&&!nominees.some(n=>n.id===h.id));
    const ring=s.powers.find(p=>p.type==='ring'&&!p.used&&p.ownerId&&p.expiresWeek>=week);
    if(ring&&Math.random()<0.55){
      ring.used=true;
      const owner=hg(s,ring.ownerId);
      if(owner&&!nominees.some(n=>n.id===owner.id)&&owner.id!==hoh.id){
        const replace=shuffle(pool)[0];
        if(replace){
          pool=pool.filter(x=>x.id!==replace.id);
          pool.push(owner);
          log(s,{week,phase:'temptation',type:'ring-replacement',winnerId:owner.id,replacedId:replace.id,title:'Ring of Replacement',lines:[`${displayName(owner)} uses the Ring of Replacement and takes ${displayName(replace)}'s POV spot.`]});
        }
      }
    }
    // Big Brother 19 has six Veto players. With a third nominee, the HOH and
    // all three nominees are already four automatic players, so only TWO more
    // Houseguests are selected. With two nominees, THREE more are selected.
    const pickedCount=nominees.length>=3?2:3;
    const selected=shuffle(pool).slice(0,Math.min(pickedCount,pool.length));
    const participants=[hoh,...nominees,...selected].filter((h,i,a)=>a.findIndex(x=>x.id===h.id)===i);
    s.povPlayers=participants.map(h=>h.id);
    log(s,{week,phase:'standard',type:'pov-players',hohId:hoh.id,nomineeIds:[...s.nominees],povPlayers:s.povPlayers,title:'Power of Veto — Picked Players',lines:[`The Power of Veto players are ${participants.map(displayName).join(', ')}.`,`Six Houseguests compete for the Power of Veto${nominees.length>=3?' (HOH + 3 nominees + 2 picked players).':' (HOH + 2 nominees + 3 picked players).'}`]});
    return participants;
  }
  function runPOV(s,week,participants){const comp=C().runCompetition(participants,{week,type:'pov'});const winner=comp.winner;s.vetoWinners=[winner.id];log(s,{week,phase:'standard',type:'pov',winnerId:winner.id,participants:participants.map(h=>h.id),competition:comp,title:`Power of Veto — ${comp.label}`,lines:[`${displayName(winner)} wins the Power of Veto.`]});return {winner,comp};}
  function chooseVetoUse(s,week,winner){
    const nominees=s.nominees.map(id=>hg(s,id)).filter(Boolean);const hoh=hg(s,s.currentHOH);if(nominees.some(n=>n.id===winner.id))return {use:true,saveId:winner.id,reason:'self-save'};
    // Critical BB19 behavior: a HOH may use the veto on a pawn to execute a planned backdoor.
    if(s.backdoorPlanActive&&s.backdoorTargetId&&hg(s,s.backdoorTargetId)?.active){
      // A planned backdoor requires the veto to open the replacement spot.
      // The HOH always understands this; a non-HOH veto winner can also choose
      // to cooperate when the winner has a strong relationship with a pawn or
      // recognizes the target as a major competition threat.
      if(winner.id===hoh.id){
        const save=nominees.slice().sort((a,b)=>{const ra=rel(s,hoh,a),rb=rel(s,hoh,b);return (rb.trust+rb.loyalty)-(ra.trust+ra.loyalty);})[0]?.id||nominees[0]?.id;
        return {use:true,saveId:save,reason:'execute-backdoor'};
      }
      const target=hg(s,s.backdoorTargetId);
      const targetThreat=(Number(target.ratings?.physical||50)+Number(target.ratings?.mental||50)+Number(target.ratings?.strategic||50))/3;
      const pawn=nominees.slice().sort((a,b)=>{const ra=rel(s,winner.id,a),rb=rel(s,winner.id,b);return (rb.trust+rb.loyalty)-(ra.trust+ra.loyalty);})[0];
      const pawnRel=Number(rel(s,winner.id,pawn.id)?.friendship||50)+Number(rel(s,winner.id,pawn.id)?.trust||50);
      const cooperation=0.58 + Math.max(0,targetThreat-65)/220 + Math.max(0,pawnRel-110)/400;
      if(Math.random()<Math.min(0.88,cooperation)) return {use:true,saveId:pawn.id,reason:'support-planned-backdoor'};
    }
    return R().decideVetoUse(s,winner,hoh,nominees);
  }
  function applyVeto(s,week,winner){
    const hoh=hg(s,s.currentHOH),nominees=s.nominees.map(id=>hg(s,id)).filter(Boolean);
    const decision=chooseVetoUse(s,week,winner);
    let replacement=null;
    if(decision.use){
      const saved=hg(s,decision.saveId);
      if(saved&&nominees.some(n=>n.id===saved.id)){
        const wasThirdNominee=!!saved.thirdNominee;
        saved.nominated=false;
        s.nominees=s.nominees.filter(id=>id!==saved.id);

        // BB19 third-nominee rule: the HOH did not nominate the third nominee,
        // so if that third nominee is removed by the Veto, there is NO replacement.
        // The two original nominees simply remain the final nominees.
        if(wasThirdNominee){
          s.nominees=s.nominees.filter(id=>{const h=hg(s,id);return h?.active;});
          log(s,{week,phase:'standard',type:'veto-ceremony',hohId:hoh.id,winnerId:winner.id,savedId:saved.id,replacementId:null,vetoUsed:true,thirdNomineeSaved:true,title:'Veto Ceremony',vetoUsed:true,lines:[`${displayName(winner)} uses the Power of Veto on the third nominee, ${displayName(saved)}.`,`Because ${displayName(saved)} was the third nominee created by a twist, the HOH does not name a replacement. The two original nominees remain on the block.`]});
          return;
        }

        let pool=living(s).filter(p=>p.id!==hoh.id&&!p.safe&&!s.nominees.includes(p.id)&&p.id!==saved.id&&p.id!==winner.id);

        // BB19 Weeks 1–3 Pendant of Protection: the HOH can genuinely attempt
        // to execute a backdoor on the Pendant holder. The ceremony shows the
        // attempt, then the Pendant protects that Houseguest and the HOH must
        // choose another eligible replacement. This mirrors the requested
        // on-screen behavior rather than silently preventing the backdoor.
        const pendantTarget = week <= 3 &&
          s.backdoorPlanActive &&
          s.backdoorTargetId &&
          hg(s, s.backdoorTargetId)?.id === s.backdoorTargetId &&
          ((hg(s, s.backdoorTargetId)?.pendantUntil || 0) >= week);

        if (pendantTarget) {
          const protectedTarget = hg(s, s.backdoorTargetId);
          pool = pool.filter(p => p.id !== protectedTarget.id && p.id !== winner.id && !((p.pendantUntil || 0) >= week));
          replacement = R().pickReplacement(s,hoh,pool,[]);
          if(replacement){
            replacement.nominated=true;
            s.nominees.push(replacement.id);
            s.targetHistory.push({name:displayName(protectedTarget),reason:'backdoor attempt blocked by Pendant of Protection'});
            s.targetHistory.push({name:displayName(replacement),reason:'replacement after Pendant protection'});
          }
          log(s,{
            week, phase:'standard', type:'veto-ceremony', hohId:hoh.id, winnerId:winner.id,
            savedId:saved.id, attemptedTargetId:protectedTarget.id, replacementId:replacement?.id||null,
            pendantActivated:true, vetoUsed:true, title:'Veto Ceremony — Pendant of Protection Activated', vetoUsed:true,
            lines:[
              `${displayName(winner)} uses the Power of Veto on ${displayName(saved)}.`,
              `${displayName(hoh)} attempts to backdoor ${displayName(protectedTarget)} as the replacement nominee.`,
              `${displayName(protectedTarget)} is protected by the Pendant of Protection and is saved from the backdoor attempt.`,
              replacement
                ? `${displayName(hoh)} names ${displayName(replacement)} as the replacement nominee after the Pendant blocks the backdoor.`
                : `${displayName(hoh)} cannot name an eligible replacement after the Pendant protection.`
            ]
          });
          return;
        }

        // Never allow the veto holder to become the replacement nominee.
        pool = pool.filter(p => p.id !== winner.id);
        replacement=s.backdoorPlanActive&&s.backdoorTargetId&&pool.some(p=>p.id===s.backdoorTargetId)?hg(s,s.backdoorTargetId):R().pickReplacement(s,hoh,pool,[]);
        if(replacement){replacement.nominated=true;s.nominees.push(replacement.id);if(replacement.id===s.backdoorTargetId)s.targetHistory.push({name:displayName(replacement),reason:'backdoor replacement'});}
        if(s.backdoorTargetId&&replacement?.id===s.backdoorTargetId){s.intendedTarget=s.backdoorTargetId;}
        log(s,{week,phase:'standard',type:'veto-ceremony',hohId:hoh.id,winnerId:winner.id,savedId:saved.id,replacementId:replacement?.id||null,vetoUsed:true,title:'Veto Ceremony',vetoUsed:true,lines:[`${displayName(winner)} uses the Power of Veto on ${displayName(saved)}.`,replacement?`${displayName(hoh)} names ${displayName(replacement)} as the replacement nominee${replacement.id===s.backdoorTargetId?' to execute the planned backdoor':''}.`:`No replacement nominee is required.`]});
        return;
      }
    }
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
  // Authoritative placement ledger. Permanent normal exits are kept in final
  // exit order. The Week 1 self-eviction permanently occupies 16th place but
  // is not a normal eviction. If a Battle Back winner returns, their previous
  // exit is removed so the remaining pre-jury players are renumbered together.
  function rebuildPlacementLedger(s){
    const walker=s.houseguests.find(h=>h.selfEvicted);
    const selfId=walker?.id||null;
    const order=[];
    (s.finalExitOrder||[]).forEach(id=>{
      if(!id || id===selfId || order.includes(id))return;
      const h=hg(s,id);
      if(h && !h.active)order.push(id);
    });
    // Clear temporary normal-eviction placements first. The self-evicted player
    // is the one permanent exception and always remains 16th.
    s.houseguests.forEach(h=>{
      if(h.id!==selfId && !h.active)h.placement=null;
      if(h.id!==selfId && h.active)h.juryMember=false;
    });
    let place=17;
    order.forEach(id=>{
      // 16th place is permanently reserved for the Week 1 self-eviction.
      if(place===16)place=15;
      const h=hg(s,id);
      if(!h)return;
      h.placement=place;
      h.juryMember=place<=window.BB19_CONFIG.juryThresholdPlacement;
      place--;
    });
    if(walker){walker.placement=16;walker.juryMember=false;}
    s.jury=s.houseguests.filter(h=>h.juryMember).sort((a,b)=>b.placement-a.placement).map(h=>h.id);
    return order;
  }
  function eviction(s,week,cycle=1){
    const noms=s.nominees.map(id=>hg(s,id)).filter(h=>h?.active);if(noms.length<2)return null;
    // The HOH never casts a regular eviction vote. The only time the HOH
    // affects the outcome is when the vote is tied and they exercise the
    // tie-breaker. Excluding the HOH here also prevents Week 1 from inheriting
    // the larger premiere voter pool and incorrectly producing 13 votes.
    const hohId=s.currentHOH;
    let voters=living(s).filter(h=>h.id!==hohId&&!noms.some(n=>n.id===h.id));

    // BB19 premiere exception: the 17th Houseguest does NOT vote in the
    // Hit the Road opening eviction because they already determined the eight
    // Friendship Bracelet recipients. They regain normal voting rights for
    // every subsequent eviction.
    if(week===1 && cycle===0){
      voters=voters.filter(v=>v.slot!==17);
    }
    const eliminateOwner=s.houseguests.find(h=>h.eliminateTwoVotes&&h.active);
    if(eliminateOwner){const removed=shuffle(voters).slice(0,Math.min(2,voters.length));voters=voters.filter(v=>!removed.some(o=>o.id===v.id));eliminateOwner.eliminateTwoVotes=false;log(s,{week,phase:'temptation',type:'tree-vote-power',winnerId:eliminateOwner.id,title:'Tree of Temptation — Two Votes Eliminated',lines:[`${displayName(eliminateOwner)}'s power removes two eviction votes from the ceremony.`]});}
    const votes=[];const counts={};noms.forEach(n=>counts[n.id]=0);
    voters.forEach(v=>{
      const scored=noms.map(n=>{const r=rel(s,v,n);let score=bond(s,v,n)+Number(r.friendship||50)*.10+Number(r.trust||50)*.08+Number(r.loyalty||50)*.06-Number(r.rivalry||0)*.22;if(n.id===s.intendedTarget)score-=24;if(n.id===s.backdoorTargetId)score-=32;if(ally(s,v,n))score+=14;score+=Math.random()*22-11;return {n,score};}).sort((a,b)=>a.score-b.score);
      const target=scored[0].n.id;counts[target]++;votes.push({voterId:v.id,targetId:target});
    });
    log(s,{week,phase:cycle>1?"double-eviction":(cycle===0?"premiere":"standard"),type:"eviction-voting",
      nomineeIds:noms.map(n=>n.id),votes,voteCounts:counts,title:"Eviction Voting",
      lines:[`${voters.length} Houseguests cast an eviction vote.`,
        `Eligible voters: ${voters.map(displayName).join(", ")}.`,
        `${week===1 && cycle===0 ? 'The 17th Houseguest does not vote in the Hit the Road opening eviction.' : 'The 17th Houseguest is eligible to vote in this eviction when active and not nominated.'}`]});
    const ordered=noms.slice().sort((a,b)=>counts[b.id]-counts[a.id]);
    let evictedId=ordered[0].id,tieBreakVoteId=null;
    const top=ordered.filter(n=>counts[n.id]===counts[ordered[0].id]);
    if(top.length>1){
      const hoh=hg(s,s.currentHOH);
      evictedId=hoh ? R().decideTieBreak(s,hoh,top[0],top[1]) : shuffle(top)[0].id;
      tieBreakVoteId=hoh ? evictedId : null;
    }
    const ev=hg(s,evictedId);ev.active=false;ev.evicted=true;
    if(!Number.isFinite(s.normalEvictionCount)) s.normalEvictionCount=0;
    s.normalEvictionCount++;
    if(!s.finalExitOrder.includes(ev.id))s.finalExitOrder.push(ev.id);
    // The ledger includes the Week 1 self-eviction as a fixed 16th-place slot,
    // while normal evictions continue through the permanent exit order.
    rebuildPlacementLedger(s);
    s.evicted.push(ev.id);
    const countText=Object.entries(counts).map(([id,n])=>`${displayName(hg(s,id))}: ${n}`).join(' • ');
    log(s,{week,phase:cycle>1?'double-eviction':(cycle===0?'premiere':'standard'),type:'eviction',evictedId:ev.id,nomineeIds:noms.map(n=>n.id),votes,voteCounts:counts,evictedVoteCount:counts[ev.id],tieBreakVoteId,title:'Eviction',lines:[tieBreakVoteId?`${displayName(ev)} is evicted after a tie-breaker.`:`${displayName(ev)} is evicted.`,noms.length===2?`By a vote of ${counts[noms[0].id]} to ${counts[noms[1].id]}, ${displayName(ev)} is evicted.`:`Vote count: ${countText}`,ev.juryMember?`${displayName(ev)} joins the jury.`:`${displayName(ev)} finishes in ${ordinal(ev.placement)} place.`]});
    s.nominees=[];s.povPlayers=[];s.vetoWinners=[];s.evictionVotes=[];s.backdoorPlanActive=false;s.backdoorTargetId=null;s.intendedTarget=null;return ev;
  }
  function battleBack(s){
    const eligible=s.evicted.map(id=>hg(s,id)).filter(h=>h).slice(0,4);
    if(eligible.length<4)return null;
    let round1=C().runCompetition(eligible,{week:4,type:'battleback-1'});
    const ranking=round1.ranking;
    const finalists=ranking.slice(0,2).map(x=>hg(s,x.id));
    log(s,{week:4,phase:'battle-back',type:'battleback-1',participants:eligible.map(h=>h.id),advancers:finalists.map(h=>h.id),competition:round1,title:'Battle Back Showdown — Round 1',lines:[`${finalists.map(displayName).join(' and ')} advance to Round 2.`]});
    let round2=C().runCompetition(finalists,{week:4,type:'battleback-2'});
    const challenger=round2.winner;
    const loser=finalists.find(h=>h.id!==challenger.id);
    log(s,{week:4,phase:'battle-back',type:'battleback-2',participants:finalists.map(h=>h.id),winnerId:challenger.id,competition:round2,title:'Battle Back Showdown — Round 2',lines:[`${displayName(challenger)} wins Round 2 and advances to the final Battle Back showdown.`,`${displayName(loser)} is eliminated from the Battle Back.`]});

    // The active Houseguests vote to choose the house challenger who will face
    // the Battle Back winner. Record every vote so the event screen can show
    // exactly who voted for whom.
    const houseCandidates=shuffle(living(s));
    if(!houseCandidates.length)return null;
    const voteRecords=[];const voteCounts={};
    houseCandidates.forEach(h=>voteCounts[h.id]=0);
    living(s).forEach(voter=>{
      const scored=houseCandidates.map(candidate=>{
        const r=rel(s,voter,candidate);
        let score=bond(s,voter,candidate)+Number(r.friendship||50)*.10+Number(r.trust||50)*.08+Number(r.loyalty||50)*.06-Number(r.rivalry||0)*.20;
        score+=Math.random()*20-10;
        return {candidate,score};
      }).sort((a,b)=>b.score-a.score);
      const target=scored[0].candidate;
      voteCounts[target.id]++;
      voteRecords.push({voterId:voter.id,targetId:target.id});
    });
    const maxVotes=Math.max(...Object.values(voteCounts));
    const tied=houseCandidates.filter(h=>voteCounts[h.id]===maxVotes);
    const houseChallenger=shuffle(tied)[0];
    log(s,{week:4,phase:'battle-back',type:'battleback-vote',participants:living(s).map(h=>h.id),candidateIds:houseCandidates.map(h=>h.id),challengerId:houseChallenger.id,voteRecords,voteCounts,title:'Battle Back Showdown — House Challenger Vote',lines:[`${displayName(houseChallenger)} is selected by the House to challenge the Battle Back winner.`,...voteRecords.map(v=>`${displayName(hg(s,v.voterId))} votes for ${displayName(hg(s,v.targetId))}.`)]});

    // The returning Battle Back winner is guaranteed to defeat the House
    // challenger. The showdown remains on the event chain, but its outcome is
    // deterministic by the requested custom rule.
    const final={category:'physical',label:'Maze Race',description:'The Battle Back winner faces the House-selected challenger in the final showdown.',name:'Maze Race',winner:challenger,ranking:[{id:challenger.id,score:100},{id:houseChallenger.id,score:0}],official:true,type:'battleback-3',week:4};
    log(s,{week:4,phase:'battle-back',type:'battleback-3',participants:[challenger.id,houseChallenger.id],winnerId:challenger.id,challengerId:houseChallenger.id,battleBackWinnerId:challenger.id,competition:final,title:'Battle Back Showdown — Final Round',lines:[`${displayName(challenger)} defeats House challenger ${displayName(houseChallenger)} in the final Battle Back showdown.`,`The Battle Back winner returns to the Big Brother house.`]});
    const returnedPlacement=challenger.placement;
    challenger.active=true;challenger.evicted=false;challenger.placement=null;challenger.juryMember=false;
    s.evicted=s.evicted.filter(id=>id!==challenger.id);
    s.finalExitOrder=s.finalExitOrder.filter(id=>id!==challenger.id);
    rebuildPlacementLedger(s);
    log(s,{week:4,phase:'battle-back',type:'battleback-return',winnerId:challenger.id,returnedPlacement:returnedPlacement||null,title:'Battle Back — Return to the Game',lines:[`${displayName(challenger)} returns to the game.`,`Their earlier eviction is removed from the final placement ledger, while the three losing Battle Back contenders retain their proper pre-jury order.`,`The Week 1 self-evicted Houseguest remains locked at 16th place.`]});
    s.battleBack={winnerId:challenger.id,challengerId:houseChallenger.id,voteRecords,voteCounts};
    return challenger;
  }
  function runFirstWeekSelfEviction(s){
    // BB19's first week also contained a self-eviction/walk. It must happen
    // before the POV so the remainder of the season starts with the correct
    // active-houseguest count. The walker is not an eviction, is not a jury
    // member. It receives the fixed custom 16th-place slot, but does not count as a normal eviction.
    const nominees=s.nominees.map(id=>hg(s,id)).filter(h=>h?.active && h.slot!==17);
    if(!nominees.length)return null;
    const walker=nominees[Math.floor(Math.random()*nominees.length)];
    walker.active=false; walker.selfEvicted=true; walker.nominated=false;
    // BB19 custom placement rule: the Week 1 self-eviction is ALWAYS 16th place.
    // It is not a normal eviction, but its fixed 16th-place slot MUST be included
    // in the placement ledger so Battle Back returns cannot collapse the pre-jury order.
    walker.placement=16;
    walker.juryMember=false;
    s.evicted=s.evicted.filter(id=>id!==walker.id);
    s.nominees=s.nominees.filter(id=>id!==walker.id);
    log(s,{week:1,phase:"standard",type:"self-eviction",selfEvictedId:walker.id,
      title:"Self-Eviction — Houseguest Walks",
      lines:[`${displayName(walker)} chooses to self-evict from the Big Brother house.`,
        `${displayName(walker)} is permanently recorded in 16th place. This walk does not count as a normal eviction and does not create a jury member.`]});

    const hoh=hg(s,s.currentHOH);
    const replacementPool=living(s).filter(h=>h.id!==hoh?.id&&!s.nominees.includes(h.id)&&h.slot!==17&&!h.safe);
    const replacement=R().pickReplacement(s,hoh,replacementPool,[]);
    if(replacement){
      replacement.nominated=true;
      s.nominees.push(replacement.id);
      log(s,{week:1,phase:"standard",type:"replacement-nomination",hohId:hoh?.id||null,
        nomineeIds:[...s.nominees],replacementId:replacement.id,title:"Replacement Nomination",
        lines:[`${displayName(hoh)} names ${displayName(replacement)} as the replacement nominee for ${displayName(walker)}.`]});
    }
    return {walker,replacement};
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
    // BB19 Weeks 5–7: the Temptation Competition is held BEFORE the nomination ceremony.
    // Its winner is safe before the HOH nominates anyone, and its last-place finisher
    // is an independent third nominee. The HOH still makes exactly two nominations.
    const temptation=runTemptationCompetition(s,week);
    runNominations(s,week);

    // A Save-a-Friend apple or Pendant can make a Houseguest immune. Never remove the
    // independent Temptation third nominee here: they are not one of the HOH's two noms.
    s.nominees=s.nominees.filter(id=>{
      const h=hg(s,id);
      if(h?.thirdNominee) return true;
      if(h?.safe||((h?.pendantUntil||0)>=week)){h.nominated=false;return false;}
      return true;
    });
    while(s.nominees.filter(id=>{const h=hg(s,id);return !h?.thirdNominee;}).length<2){
      const candidate=shuffle(living(s).filter(h=>h.id!==hoh.id&&!h.safe&&!h.thirdNominee&&!s.nominees.includes(h.id)&&!((h.pendantUntil||0)>=week)))[0];
      if(!candidate)break;
      candidate.nominated=true;
      s.nominees.push(candidate.id);
    }
    // Keep the Temptation nominee as the third nominee after the HOH's two nominations.
    const povPlayers=selectPOVPlayers(s,week);const veto=runPOV(s,week,povPlayers);applyVeto(s,week,veto.winner);
    // If a Halting Hex holder is a nominee and chooses to activate it, cancel the eviction.
    const hex=s.powers.find(p=>p.type==='halting-hex'&&!p.used&&p.ownerId&&p.expiresWeek>=week);if(hex&&s.nominees.includes(hex.ownerId)&&Math.random()<0.55){hex.used=true;log(s,{week,phase:'temptation',type:'halting-hex',winnerId:hex.ownerId,title:'Halting Hex — Eviction Cancelled',lines:[`${displayName(hg(s,hex.ownerId))} activates the Halting Hex and cancels the eviction.`,`The nominees remain in the game and the week advances.`]});s.nominees=[];s.povPlayers=[];s.vetoWinners=[];s.backdoorPlanActive=false;s.backdoorTargetId=null;return;}
    const ev=eviction(s,week,cycle);if(ev?.bounty){ }
    if(s.evicted.length===4&&!s.battleBackPlayed){s.battleBackPlayed=true;battleBack(s);}
    if(week===10&&cycle===1&&living(s).length>3)runCycle(s,week,2);
  }
  function runPremiere(s){
    s.week=1;s.phase="premiere";resetFlags(s);
    chooseFirstTemptation(s);
    runFriendshipBracelets(s);
    runHitTheRoad(s);
    // The opening three-nominee eviction occurs before the first regular HOH.
    eviction(s,1,0);

    // The regular Week 1 cycle now begins with the first HOH. This mirrors the
    // real BB19 chronology while allowing the custom slot-17 entrant to vote.
    s.phase="in-season";
    resetFlags(s);
    runFirstHOH(s);
    // Week 1 Den of Temptation is deterministic in this custom format:
    // the 17th Houseguest always receives the Pendant of Protection.
    runDenOfTemptation(s,1);
    runNominations(s,1);
    runFirstWeekSelfEviction(s);
    const players=selectPOVPlayers(s,1);
    const veto=runPOV(s,1,players);
    applyVeto(s,1,veto.winner);
    eviction(s,1,1);
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
    ensureState(s);s.history=[];s.jury=[];s.evicted=[];s.nominees=[];s.povPlayers=[];s.vetoWinners=[];s.currentHOH=null;s.originalHOH=null;s.finale=null;s.backdoorPlanActive=false;s.backdoorTargetId=null;s.backdoorPlanCount=0;s.intendedTarget=null;s.targetHistory=[];s.powers=[];s.temptations=[];s.firstTemptation=null;s.treeOfTemptation=null;s.battleBack=null;s.battleBackPlayed=false;s.normalEvictionCount=0;s.finalExitOrder=[];s.temptationCompetitionUnlocked=false;s.houseguests.forEach(h=>{h.active=h.slot!==17;h.safe=false;h.nominated=false;h.juryMember=false;h.evicted=false;h.selfEvicted=false;h.thirdNominee=false;h.temtpNominee=false;h.friendshipBracelet=false;h.placement=null;h.mustThrowFirstHOH=false;h.denUsed=false;h.treeUsed=false;h.pendantUntil=0;h.nominationCurseUntil=0;h.usedNominationCurse=false;h.noNextHOH=false;h.bounty=0;h.eliminateTwoVotes=false;});
    runPremiere(s);let week=2,guard=0;while(living(s).length>3&&week<=18&&guard<24){runCycle(s,week,1);week++;guard++;}runFinale(s);if(window.LiveFeeds?.addToSeason)window.LiveFeeds.addToSeason(s);return s;
  }
  window.SeasonEngine={simulateSeason,displayName,ordinal};
})();
