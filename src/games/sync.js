import {normalizeAnswer} from '../core/session.js';

const choiceRounds=[
 ['休日の朝にしたいこと',['二度寝','散歩','カフェ','ゲーム']],['無人島に1つ持っていくなら',['ナイフ','スマホ','水','友達']],['テンションが上がる食べ物',['焼肉','寿司','ラーメン','ケーキ']],['旅行で一番大事なのは',['景色','食事','ホテル','一緒に行く人']],['動物になるなら',['猫','犬','鳥','イルカ']],['急に100万円もらったら',['旅行','貯金','買い物','投資']],['最強の夜食',['ラーメン','おにぎり','アイス','ポテチ']],['超能力を1つ選ぶなら',['瞬間移動','透明化','時間停止','心を読む']],['夏といえば',['海','花火','祭り','かき氷']],['冬といえば',['雪','鍋','こたつ','クリスマス']],['一番落ち着く場所',['家','カフェ','公園','お風呂']],['突然3連休なら',['旅行','寝る','遊ぶ','片付け']],['プレゼントでもらって嬉しい',['食べ物','現金','旅行','ガジェット']],['映画館で食べるなら',['ポップコーン','チュロス','アイス','何も食べない']],['朝ごはんといえば',['パン','ご飯','卵','食べない']],['つい見てしまう動画',['動物','料理','ゲーム','旅行']]
];
const freePrompts=['赤い食べ物といえば？','日本の観光地といえば？','コンビニのおにぎりの具といえば？','人気の動物といえば？','丸いものといえば？','夏の食べ物といえば？','学校にあるものといえば？','冷蔵庫に入っているものといえば？','子どもが好きな食べ物といえば？','雨の日に使うものといえば？','お祭りといえば？','東京といえば？','朝に飲むものといえば？','黄色いものといえば？','速いものといえば？','高い買い物といえば？'];

const promptPool=[
  ...choiceRounds.map(([q,a],i)=>Object.freeze({id:`choice-${i}`,type:'choice',q,a:Object.freeze([...a])})),
  ...freePrompts.map((q,i)=>Object.freeze({id:`free-${i}`,type:'free',q}))
];

export const SYNC_MODES=Object.freeze([
  Object.freeze({id:'crowd',label:'CROWD',description:'みんなと同じ答えを狙う'}),
  Object.freeze({id:'read',label:'READ',description:'指定された1人の答えを読む'})
]);

function pickIndex(length,rng=Math.random){return Math.min(length-1,Math.floor(rng()*length))}

export function nextSyncMode(previousId=null,rng=Math.random){
  const candidates=previousId?SYNC_MODES.filter(mode=>mode.id!==previousId):SYNC_MODES;
  return candidates[pickIndex(candidates.length,rng)];
}

export function nextSyncPrompt(previousId=null,rng=Math.random){
  const candidates=previousId?promptPool.filter(prompt=>prompt.id!==previousId):promptPool;
  return candidates[pickIndex(candidates.length,rng)];
}

export function nextSyncTarget(playerCount,previousTarget=null,rng=Math.random){
  if(!Number.isInteger(playerCount)||playerCount<2)throw new RangeError('Sync requires at least 2 players');
  const all=Array.from({length:playerCount},(_,i)=>i);
  const candidates=previousTarget==null?all:all.filter(i=>i!==previousTarget);
  return candidates[pickIndex(candidates.length,rng)];
}

export function resolveSyncRound(answers,{mode='crowd',targetIndex=null}={}){
  const counts={};
  answers.forEach(answer=>counts[answer.key]=(counts[answer.key]||0)+1);

  if(mode==='crowd'){
    const scores=answers.map(answer=>counts[answer.key]>=2?counts[answer.key]-1:0);
    return{scores,counts,targetKey:null,matchedPredictors:[]};
  }

  if(mode!=='read')throw new Error(`Unknown Sync mode: ${mode}`);
  if(!Number.isInteger(targetIndex)||targetIndex<0||targetIndex>=answers.length)throw new RangeError('Invalid Sync target');

  const targetKey=answers[targetIndex].key;
  const matchedPredictors=[];
  const scores=answers.map((answer,index)=>{
    if(index===targetIndex)return 0;
    if(answer.key!==targetKey)return 0;
    matchedPredictors.push(index);
    return 1;
  });
  scores[targetIndex]=Math.min(2,matchedPredictors.length);
  return{scores,counts,targetKey,matchedPredictors};
}

export const syncGame={
  id:'sync',title:'シンクロ+',emoji:'🎯',description:'みんなに合わせるCROWDと、1人を読むREADが交互に来るグループ読みゲーム。',tags:['2〜8人','読み合い'],
  mount(ctx){
    const life={destroyed:false,holdTimer:null,lastMode:null,lastPrompt:null,lastTarget:null};
    startRound(ctx,life);
    return()=>{life.destroyed=true;clearTimeout(life.holdTimer)};
  }
};

function startRound(ctx,life){
  if(life.destroyed)return;
  const mode=nextSyncMode(life.lastMode);
  const prompt=nextSyncPrompt(life.lastPrompt);
  const targetIndex=mode.id==='read'?nextSyncTarget(ctx.session.players.length,life.lastTarget):null;
  life.lastMode=mode.id;life.lastPrompt=prompt.id;if(targetIndex!=null)life.lastTarget=targetIndex;
  pass(ctx,{mode,prompt,targetIndex,player:0,answers:[]},life);
}

function pass(ctx,state,life){
  if(life.destroyed)return;
  ctx.renderScorebar(state.player);
  const name=ctx.session.players[state.player];
  const targetName=state.targetIndex==null?null:ctx.session.players[state.targetIndex];
  const modeNote=state.mode.id==='crowd'?'全員と同じ答えを狙うラウンド。':`${ctx.esc(targetName)}さんの答えを読むラウンド。`;
  ctx.root.innerHTML=`<div class="pass-card"><div class="eyebrow">${state.mode.label} SYNC</div><div class="prompt">${ctx.esc(name)}さんへ</div><div class="sub">${modeNote}<br>他の人は画面を見ないでください。</div><button class="btn primary" id="reveal">長押しして回答</button></div><div class="rules">全員が回答し終わるまで、前の人の答えは表示されません。</div>`;
  const button=ctx.root.querySelector('#reveal');
  button.onpointerdown=()=>{life.holdTimer=setTimeout(()=>showQuestion(ctx,state,life),450)};
  button.onpointerup=button.onpointerleave=()=>clearTimeout(life.holdTimer);
}

function playerInstruction(ctx,state){
  if(state.mode.id==='crowd')return'自分の好みより、みんなと被りそうな答えを狙う。';
  const targetName=ctx.session.players[state.targetIndex];
  if(state.player===state.targetIndex)return'あなたが今回の基準。自分なら本当に選ぶ答えを選ぶ。';
  return`${ctx.esc(targetName)}さんなら選びそうな答えを予想する。`;
}

function showQuestion(ctx,state,life){
  if(life.destroyed)return;
  const r=state.prompt,instruction=playerInstruction(ctx,state);
  if(r.type==='choice'){
    ctx.root.innerHTML=`<div class="eyebrow">${state.mode.label} · SECRET CHOICE</div><div class="prompt">${r.q}</div><div class="sub">${instruction}</div><div class="choice-grid">${r.a.map((a,i)=>`<button class="choice" data-answer="${i}">${a}</button>`).join('')}</div>`;
    ctx.root.querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=>submit(ctx,state,{key:`c${button.dataset.answer}`,label:r.a[+button.dataset.answer]},life));
  }else{
    ctx.root.innerHTML=`<div class="eyebrow">${state.mode.label} · FREE SYNC</div><div class="prompt">${r.q}</div><div class="sub">${instruction}</div><div class="stack" style="margin-top:18px"><input id="freeAnswer" maxlength="24" autocomplete="off" placeholder="答えを入力"><button class="btn primary" id="submitAnswer">決定</button></div>`;
    const input=ctx.root.querySelector('#freeAnswer');input.focus();
    ctx.root.querySelector('#submitAnswer').onclick=()=>{const label=input.value.trim();if(!label)return ctx.toast('答えを入力してください');submit(ctx,state,{key:normalizeAnswer(label),label},life)};
  }
}

function submit(ctx,state,answer,life){
  if(life.destroyed)return;
  state.answers.push(answer);state.player++;
  if(state.player<ctx.session.players.length)pass(ctx,state,life);else reveal(ctx,state,life);
}

function reveal(ctx,state,life){
  if(life.destroyed)return;
  const result=resolveSyncRound(state.answers,{mode:state.mode.id,targetIndex:state.targetIndex});
  result.scores.forEach((score,index)=>{if(score>0)ctx.session.addScore(index,score)});
  ctx.renderScorebar();
  const targetName=state.targetIndex==null?null:ctx.session.players[state.targetIndex];
  const targetAnswer=state.targetIndex==null?null:state.answers[state.targetIndex];
  const summary=state.mode.id==='crowd'
    ?'同じ答えの人数が多いほど高得点。'
    :`${ctx.esc(targetName)}さんの答えは「${ctx.esc(targetAnswer.label)}」。当てた人は＋1、基準役は当てられた人数に応じて最大＋2。`;
  ctx.root.innerHTML=`<div class="eyebrow">${state.mode.label} · REVEAL</div><div class="prompt">答え合わせ！</div><div class="sub" style="text-align:center">${summary}</div><div class="result-list">${ctx.session.players.map((name,index)=>{const answer=state.answers[index],score=result.scores[index],target=state.targetIndex===index?' · TARGET':'';return`<div class="result-row"><span>${ctx.esc(name)}${target}</span><span>${ctx.esc(answer.label)} ${score>0?`＋${score}`:'±0'}</span></div>`}).join('')}</div><button class="btn primary" style="width:100%;margin-top:18px" id="next">次へ</button>`;
  ctx.root.querySelector('#next').onclick=()=>ctx.completeRound(()=>startRound(ctx,life));
}
