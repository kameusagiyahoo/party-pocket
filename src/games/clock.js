export const CLOCK_TARGETS=Object.freeze([3,4,5,7,10]);

export const CLOCK_RULES=Object.freeze([
  Object.freeze({id:'just',label:'JUST',description:'目標に一番近く止める',side:'any'}),
  Object.freeze({id:'no-over',label:'NO OVER',description:'目標を超えずに一番近く止める',side:'under'}),
  Object.freeze({id:'no-early',label:'NO EARLY',description:'目標より早く止めずに一番近く止める',side:'over'})
]);

const PRECISION_SECONDS=0.1;

function pickWithRng(values,rng){
  const index=Math.min(values.length-1,Math.max(0,Math.floor(rng()*values.length)));
  return values[index];
}

export function nextClockRound(previousRuleId=null,previousTarget=null,rng=Math.random){
  const rules=CLOCK_RULES.filter(rule=>rule.id!==previousRuleId);
  const targets=CLOCK_TARGETS.filter(target=>target!==previousTarget);
  return{
    rule:pickWithRng(rules,rng),
    target:pickWithRng(targets,rng)
  };
}

export function isClockAttemptEligible(time,target,rule=CLOCK_RULES[0]){
  if(rule.side==='under')return time<=target;
  if(rule.side==='over')return time>=target;
  return true;
}

export function resolveClockRound(times,target,rule=CLOCK_RULES[0]){
  const values=times.map(Number);
  const eligible=values.map(time=>isClockAttemptEligible(time,target,rule));
  const hasEligible=eligible.some(Boolean);
  const candidates=values.map((_,index)=>hasEligible?eligible[index]:true);
  const distances=values.map(time=>Math.abs(time-target));
  const best=Math.min(...distances.filter((_,index)=>candidates[index]));
  const winners=distances
    .map((distance,index)=>candidates[index]&&Math.abs(distance-best)<0.000001?index:-1)
    .filter(index=>index>=0);
  const precision=winners.filter(index=>distances[index]<=PRECISION_SECONDS+0.000001);
  return{eligible,distances,winners,precision,fallback:!hasEligible};
}

export const clockGame={
  id:'clock',title:'体内時計+',emoji:'⏱️',description:'JUST / NO OVER / NO EARLY。毎ラウンド変わる条件で指定秒数を狙う。',tags:['2〜8人','感覚'],
  mount(ctx){const life={destroyed:false,lastRule:null,lastTarget:null};start(ctx,life);return()=>{life.destroyed=true}}
};

function start(ctx,life){
  if(life.destroyed)return;
  const round=nextClockRound(life.lastRule,life.lastTarget);
  life.lastRule=round.rule.id;
  life.lastTarget=round.target;
  pass(ctx,{...round,player:0,times:[]},life);
}

function pass(ctx,state,life){
  if(life.destroyed)return;
  ctx.renderScorebar(state.player);
  const name=ctx.session.players[state.player];
  ctx.root.innerHTML=`<div class="pass-card"><div class="eyebrow">BODY CLOCK · ${state.rule.label}</div><div class="prompt">${ctx.esc(name)}さんへ</div><div class="sub">目標 <b>${state.target}.00秒</b><br>${ctx.esc(state.rule.description)}</div><button class="btn primary" id="ready">準備OK</button></div><div class="rules">START後は時間表示なし。${state.rule.id==='just'?'目標へ最も近い人が勝ち。':state.rule.id==='no-over'?'目標を超えた記録は、超えていない人がいる限り勝てません。':'目標より早い記録は、目標以上の人がいる限り勝てません。'} 誤差0.10秒以内の勝者は2点。</div>`;
  ctx.root.querySelector('#ready').onclick=()=>run(ctx,state,life);
}

function run(ctx,state,life){
  if(life.destroyed)return;
  let started=null;
  ctx.root.innerHTML=`<div class="eyebrow">${state.rule.label} · TARGET ${state.target}.00 SEC</div><div class="prompt">準備できたらスタート</div><div class="sub" style="text-align:center">${ctx.esc(state.rule.description)}</div><button class="btn primary" style="width:100%;margin-top:18px" id="startClock">START</button>`;
  ctx.root.querySelector('#startClock').onclick=()=>{
    started=performance.now();
    ctx.root.innerHTML=`<div class="eyebrow">${state.rule.label} · NO PEEK</div><div class="prompt">時間を感じて…</div><div class="big-number">•••</div><button class="btn pink" style="width:100%;margin-top:18px" id="stopClock">STOP</button>`;
    ctx.root.querySelector('#stopClock').onclick=()=>{
      const elapsed=(performance.now()-started)/1000;
      state.times.push(elapsed);
      state.player++;
      if(state.player<ctx.session.players.length)pass(ctx,state,life);
      else reveal(ctx,state,life);
    };
  };
}

function resultNote(time,state,result,index){
  if(result.winners.includes(index))return result.precision.includes(index)?'＋2 PERFECT':'＋1';
  if(result.fallback)return '';
  if(state.rule.side==='under'&&!result.eligible[index])return 'OVER';
  if(state.rule.side==='over'&&!result.eligible[index])return 'EARLY';
  return '';
}

function reveal(ctx,state,life){
  const result=resolveClockRound(state.times,state.target,state.rule);
  result.winners.forEach(index=>ctx.session.addScore(index,result.precision.includes(index)?2:1));
  ctx.renderScorebar();
  const fallback=result.fallback?'<div class="sub" style="text-align:center">条件内の記録がなかったため、今回は単純な誤差で判定しました。</div>':'';
  ctx.root.innerHTML=`<div class="eyebrow">${state.rule.label} · RESULT</div><div class="prompt">目標 ${state.target}.00秒</div><div class="sub" style="text-align:center">${ctx.esc(state.rule.description)}</div>${fallback}<div class="result-list">${ctx.session.players.map((name,index)=>`<div class="result-row"><span>${ctx.esc(name)}</span><span>${state.times[index].toFixed(2)}秒 ${resultNote(state.times[index],state,result,index)}</span></div>`).join('')}</div><button class="btn primary" style="width:100%;margin-top:18px" id="next">次へ</button>`;
  ctx.root.querySelector('#next').onclick=()=>ctx.completeRound(()=>start(ctx,life));
}
