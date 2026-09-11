export const MINORITY_MIN_PLAYERS=3;

export const MINORITY_PROMPTS=Object.freeze([
  Object.freeze({id:'weekend',q:'休日なら？',choices:['家でのんびり','外に出たい']}),
  Object.freeze({id:'travel-plan',q:'旅行なら？',choices:['計画ガチガチ','ノープラン']}),
  Object.freeze({id:'breakfast',q:'朝ごはんは？',choices:['パン','ご飯']}),
  Object.freeze({id:'outing',q:'遊ぶなら？',choices:['海','山']}),
  Object.freeze({id:'drink',q:'飲み物なら？',choices:['コーヒー','お茶']}),
  Object.freeze({id:'movie',q:'映画は？',choices:['映画館','家']}),
  Object.freeze({id:'personality',q:'性格は？',choices:['慎重派','勢い派']}),
  Object.freeze({id:'shopping',q:'買い物は？',choices:['店で見る','ネットで買う']}),
  Object.freeze({id:'transport',q:'移動は？',choices:['電車','車']}),
  Object.freeze({id:'sweets',q:'甘いものは？',choices:['好き','なくても平気']}),
  Object.freeze({id:'wake',q:'休日の起床は？',choices:['早起き','昼まで寝る']}),
  Object.freeze({id:'luggage',q:'旅行の荷物は？',choices:['少ない','多い']}),
  Object.freeze({id:'contact',q:'連絡は？',choices:['電話','メッセージ']}),
  Object.freeze({id:'restaurant',q:'食事は？',choices:['新しい店','いつもの店']}),
  Object.freeze({id:'game-style',q:'ゲームは？',choices:['協力','対戦']}),
  Object.freeze({id:'season',q:'季節は？',choices:['夏','冬']}),
  Object.freeze({id:'pet',q:'犬と猫なら？',choices:['犬','猫']}),
  Object.freeze({id:'spend',q:'お金を使うなら？',choices:['モノ','体験']}),
  Object.freeze({id:'schedule',q:'予定は？',choices:['早めに決める','当日決める']}),
  Object.freeze({id:'photo',q:'写真は？',choices:['撮る派','あまり撮らない']})
]);

function pickIndex(length,rng){return Math.min(length-1,Math.floor(rng()*length))}

export function nextMinorityPrompt(previousId=null,rng=Math.random){
  const candidates=MINORITY_PROMPTS.filter(prompt=>prompt.id!==previousId);
  return candidates[pickIndex(candidates.length,rng)];
}

export function resolveMinorityRound(answers,bonusSide){
  if(!Array.isArray(answers)||answers.length<MINORITY_MIN_PLAYERS)throw new RangeError('Minority needs at least 3 answers');
  if(bonusSide!==0&&bonusSide!==1)throw new RangeError('bonusSide must be 0 or 1');
  if(answers.some(answer=>answer!==0&&answer!==1))throw new RangeError('answers must be 0 or 1');

  const counts=[answers.filter(answer=>answer===0).length,answers.filter(answer=>answer===1).length];
  const gains=Array(answers.length).fill(0);
  let minority=null;
  let baseGain=0;
  let bonusApplied=false;

  if(counts[0]&&counts[1]&&counts[0]!==counts[1]){
    minority=counts[0]<counts[1]?0:1;
    baseGain=counts[minority]===1?3:2;
    bonusApplied=minority===bonusSide;
    const gain=baseGain+(bonusApplied?1:0);
    answers.forEach((answer,index)=>{if(answer===minority)gains[index]=gain});
  }

  return{counts,minority,gains,baseGain,bonusApplied};
}

export const minorityGame={
  id:'minority',title:'少数派+',emoji:'🌓',description:'3人以上でA/Bを秘密投票。少数側を狙い、BONUS側が少数ならさらに+1。',tags:['3〜8人','心理戦'],
  mount(ctx){
    const life={destroyed:false,hold:null,previousPromptId:null};
    if(ctx.session.players.length<MINORITY_MIN_PLAYERS)renderUnsupported(ctx);
    else start(ctx,life);
    return()=>{life.destroyed=true;clearTimeout(life.hold)};
  }
};

function renderUnsupported(ctx){
  ctx.renderScorebar();
  ctx.root.innerHTML=`<div class="eyebrow">MINORITY</div><div class="prompt">3人以上で遊べます</div><div class="sub">2人では少数派が成立しないため、このゲームは3〜8人専用です。</div>`;
}

function start(ctx,life){
  if(life.destroyed)return;
  const prompt=nextMinorityPrompt(life.previousPromptId);
  life.previousPromptId=prompt.id;
  const bonusSide=Math.random()<.5?0:1;
  pass(ctx,{prompt,bonusSide,player:0,answers:[]},life);
}

function pass(ctx,state,life){
  if(life.destroyed)return;
  ctx.renderScorebar(state.player);
  const name=ctx.session.players[state.player];
  const bonus=state.prompt.choices[state.bonusSide];
  ctx.root.innerHTML=`<div class="pass-card"><div class="eyebrow">SECRET VOTE</div><div class="prompt">${ctx.esc(name)}さんへ</div><div class="sub">他の人は画面を見ないでください。</div><button class="btn primary" id="reveal">長押しして選ぶ</button></div><div class="rules">少数側が得点。1人だけの少数派は高得点。今回は「${ctx.esc(bonus)}」側が少数派になるとさらに＋1。</div>`;
  const button=ctx.root.querySelector('#reveal');
  button.onpointerdown=()=>life.hold=setTimeout(()=>choose(ctx,state,life),350);
  button.onpointerup=button.onpointerleave=()=>clearTimeout(life.hold);
}

function choose(ctx,state,life){
  if(life.destroyed)return;
  ctx.root.innerHTML=`<div class="eyebrow">MINORITY · BONUS ${state.bonusSide===0?'A':'B'}</div><div class="prompt">${ctx.esc(state.prompt.q)}</div><div class="sub">人気が集まりすぎるとBONUS側でも多数派になる。</div><div class="choice-grid">${state.prompt.choices.map((choice,index)=>`<button class="choice" data-pick="${index}">${ctx.esc(choice)}${index===state.bonusSide?' · BONUS +1':''}</button>`).join('')}</div>`;
  ctx.root.querySelectorAll('[data-pick]').forEach(button=>button.onclick=()=>submit(ctx,state,+button.dataset.pick,life));
}

function submit(ctx,state,value,life){
  if(life.destroyed)return;
  state.answers.push(value);
  state.player++;
  if(state.player<ctx.session.players.length)return pass(ctx,state,life);
  reveal(ctx,state,life);
}

function reveal(ctx,state,life){
  if(life.destroyed)return;
  const result=resolveMinorityRound(state.answers,state.bonusSide);
  result.gains.forEach((gain,index)=>{if(gain)ctx.session.addScore(index,gain)});
  ctx.renderScorebar();
  const resultLabel=result.minority==null?'少数派なし':`${ctx.esc(state.prompt.choices[result.minority])} が少数派${result.bonusApplied?' · BONUS':''}`;
  ctx.root.innerHTML=`<div class="eyebrow">REVEAL</div><div class="prompt">${result.counts[0]} vs ${result.counts[1]}</div><div class="sub" style="text-align:center">${resultLabel}</div><div class="result-list">${ctx.session.players.map((name,index)=>`<div class="result-row"><span>${ctx.esc(name)}</span><span>${ctx.esc(state.prompt.choices[state.answers[index]])} ${result.gains[index]?`＋${result.gains[index]}`:'±0'}</span></div>`).join('')}</div><button class="btn primary" style="width:100%;margin-top:18px" id="next">次へ</button>`;
  ctx.root.querySelector('#next').onclick=()=>ctx.completeRound(()=>start(ctx,life));
}
