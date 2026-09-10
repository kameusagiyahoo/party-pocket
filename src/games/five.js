const pools={
 easy:['赤いものを3つ','動物を3つ','飲み物を3つ','スポーツを3つ','果物を3つ','家にある電化製品を3つ','コンビニで買えるものを3つ','旅行に持っていくものを3つ','朝にすることを3つ','冷たい食べ物を3つ','駅にあるものを3つ','丸いものを3つ','青いものを3つ','学校にあるものを3つ','乗り物を3つ','野菜を3つ','海にあるものを3つ','冬に使うものを3つ'],
 normal:['「か」から始まる言葉を3つ','5文字以上の食べ物を3つ','スマホでできることを3つ','雨の日にしたいことを3つ','1000円以内で買えるものを3つ','黄色い食べ物を3つ','旅行先でやることを3つ','子どもが好きそうなものを3つ','冷蔵庫にありそうなものを3つ','寝る前にすることを3つ','映画のジャンルを3つ','プレゼント候補を3つ','東京にあるものを3つ','音が大きいものを3つ','柔らかいものを3つ','四角いものを3つ','夏に使うものを3つ','仕事で使うものを3つ'],
 hard:['「ん」で終わる言葉を3つ','ひらがな4文字の食べ物を3つ','同じ色のものを4つ','3文字の動物を3つ','カタカナの食べ物を4つ','「た」から始まる5文字以上の言葉を3つ','海外の都市を4つ','家にある白いものを4つ','音が出るものを4つ','コンビニにないものを4つ','丸くない食べ物を4つ','水に浮くものを4つ']
};

export const FIVE_DIFFICULTIES=Object.freeze({
 easy:Object.freeze({seconds:7,label:'EASY'}),
 normal:Object.freeze({seconds:5,label:'NORMAL'}),
 hard:Object.freeze({seconds:4,label:'HARD'})
});

export const FIVE_RISKS=Object.freeze({
 safe:Object.freeze({id:'safe',label:'SAFE',secondsDelta:0,points:1,description:'通常時間で確実に狙う'}),
 rush:Object.freeze({id:'rush',label:'RUSH',secondsDelta:-1,points:2,description:'1秒短縮。成功なら2点'})
});

function pick(a){return a[Math.floor(Math.random()*a.length)]}

export function fiveChallengeConfig(difficulty,risk='safe'){
 const base=FIVE_DIFFICULTIES[difficulty];
 const mode=FIVE_RISKS[risk];
 if(!base)throw new Error(`unknown five-second difficulty: ${difficulty}`);
 if(!mode)throw new Error(`unknown five-second risk: ${risk}`);
 return Object.freeze({difficulty,risk,seconds:Math.max(1,base.seconds+mode.secondsDelta),points:mode.points,label:mode.label});
}

export function resolveFiveChallenge(ok,risk='safe'){
 const mode=FIVE_RISKS[risk];
 if(!mode)throw new Error(`unknown five-second risk: ${risk}`);
 return ok?mode.points:0;
}

export const fiveGame={
 id:'five',title:'5秒チャレンジ+',emoji:'⚡️',description:'お題を見てSAFEかRUSHを選ぶ。1秒削れば成功時2点の瞬発力勝負。',tags:['2〜8人','瞬発力'],
 mount(ctx){const life={destroyed:false,timer:null};chooseDifficulty(ctx,life);return()=>{life.destroyed=true;clearInterval(life.timer)}}
};

function chooseDifficulty(ctx,life){
  if(life.destroyed)return;if(ctx.session.mode==='party')return startSet(ctx,Math.random()<.35?'hard':'normal',life);
  ctx.renderScorebar();ctx.root.innerHTML=`<div class="eyebrow">DIFFICULTY</div><div class="prompt">難易度を選ぶ</div><div class="stack"><button class="btn green" data-d="easy">EASY · 7秒</button><button class="btn yellow" data-d="normal">NORMAL · 5秒</button><button class="btn pink" data-d="hard">HARD · 4秒</button></div><div class="rules">各お題でSAFEかRUSHを選択。RUSHは1秒短い代わりに成功で2点。</div>`;
  ctx.root.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>startSet(ctx,b.dataset.d,life));
}
function startSet(ctx,difficulty,life){if(life.destroyed)return;const state={difficulty,turn:0,used:new Set(),history:[]};nextChallenge(ctx,state,life)}
function nextChallenge(ctx,state,life){
  if(life.destroyed)return;clearInterval(life.timer);const available=pools[state.difficulty].filter(x=>!state.used.has(x));if(!available.length)state.used.clear();
  state.prompt=pick(pools[state.difficulty].filter(x=>!state.used.has(x)));state.used.add(state.prompt);renderReady(ctx,state,life);
}
function historyHtml(ctx,state){
  if(!state.history.length)return'';
  return`<div class="result-list" style="margin-top:16px">${state.history.map(item=>`<div class="result-row"><span>${ctx.esc(item.name)}</span><span>${item.risk.toUpperCase()} ${item.ok?'成功':'失敗'} ${item.points?`＋${item.points}`:'±0'}</span></div>`).join('')}</div>`;
}
function renderReady(ctx,state,life){
  if(life.destroyed)return;ctx.renderScorebar(state.turn);const base=FIVE_DIFFICULTIES[state.difficulty],name=ctx.session.players[state.turn],safe=fiveChallengeConfig(state.difficulty,'safe'),rush=fiveChallengeConfig(state.difficulty,'rush');
  ctx.root.innerHTML=`<div class="eyebrow">${base.label} · CHOOSE YOUR RISK</div><div class="turn-name">${ctx.esc(name)} の挑戦</div><div class="prompt">${state.prompt}</div><div class="sub">お題を見てから、確実に1点か、1秒削って2点かを選ぶ。</div><div class="choice-grid" style="margin-top:18px"><button class="choice" data-risk="safe">🛡 SAFE<br><small>${safe.seconds}秒 · 成功＋1</small></button><button class="choice" data-risk="rush">⚡ RUSH<br><small>${rush.seconds}秒 · 成功＋2</small></button></div>${historyHtml(ctx,state)}<div class="rules">前の人の挑戦結果も公開。自分ならどこまで攻めるか判断する。</div>`;
  ctx.root.querySelectorAll('[data-risk]').forEach(button=>button.onclick=()=>runTimer(ctx,state,button.dataset.risk,life));
}
function runTimer(ctx,state,risk,life){
  if(life.destroyed)return;const config=fiveChallengeConfig(state.difficulty,risk),started=performance.now(),duration=config.seconds;state.risk=risk;state.points=config.points;
  ctx.root.innerHTML=`<div class="eyebrow">${config.label} · GO!</div><div class="prompt">${state.prompt}</div><div class="timer" id="timer">${duration.toFixed(1)}</div><div class="sub" style="text-align:center">${risk==='rush'?'成功なら＋2！':'成功なら＋1'}</div>`;
  life.timer=setInterval(()=>{if(life.destroyed)return clearInterval(life.timer);const left=Math.max(0,duration-(performance.now()-started)/1000),el=ctx.root.querySelector('#timer');if(el)el.textContent=left.toFixed(1);if(left<=0){clearInterval(life.timer);judge(ctx,state,life)}},50);
}
function judge(ctx,state,life){
  if(life.destroyed)return;navigator.vibrate?.([80,50,80]);const points=FIVE_RISKS[state.risk].points;
  ctx.root.innerHTML=`<div class="eyebrow">TIME UP · ${state.risk.toUpperCase()}</div><div class="prompt">できた？</div><div class="sub">全員で判定。厳密さより勢いを優先。</div><div class="choice-grid"><button class="btn green" id="ok">成功 ＋${points}</button><button class="btn pink" id="ng">失敗</button></div>`;
  ctx.root.querySelector('#ok').onclick=()=>finishTurn(ctx,state,true,life);ctx.root.querySelector('#ng').onclick=()=>finishTurn(ctx,state,false,life);
}
function finishTurn(ctx,state,ok,life){
  if(life.destroyed)return;const points=resolveFiveChallenge(ok,state.risk);if(points)ctx.session.addScore(state.turn,points);
  state.history.push({name:ctx.session.players[state.turn],risk:state.risk,ok,points});state.turn++;
  if(state.turn<ctx.session.players.length)nextChallenge(ctx,state,life);else ctx.completeRound(()=>startSet(ctx,state.difficulty,life));
}
