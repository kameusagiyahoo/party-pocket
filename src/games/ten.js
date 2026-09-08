const draw=()=>Math.floor(Math.random()*5)+1;

export const TEN_SIGNAL_DEFS=Object.freeze({
  safe:Object.freeze({id:'safe',label:'SAFE',detail:'1〜6'}),
  hot:Object.freeze({id:'hot',label:'HOT',detail:'7〜9'}),
  perfect:Object.freeze({id:'perfect',label:'PERFECT',detail:'10'}),
  bust:Object.freeze({id:'bust',label:'BUST',detail:'11+'})
});

export function tenPublicSignal(total,bust=false){
  if(bust||total>10)return'bust';
  if(total===10)return'perfect';
  if(total>=7)return'hot';
  return'safe';
}

export function tenTurnOrder(playerCount,startIndex=0){
  if(!Number.isInteger(playerCount)||playerCount<=0)return[];
  const raw=Number.isFinite(Number(startIndex))?Math.trunc(Number(startIndex)):0;
  const start=((raw%playerCount)+playerCount)%playerCount;
  return Array.from({length:playerCount},(_,offset)=>(start+offset)%playerCount);
}

export function resolveTenWinners(totals,bust){
  const safe=totals.map((t,i)=>bust[i]?-Infinity:t);
  const bestSafe=Math.max(...safe);
  if(bestSafe>-Infinity)return safe.map((v,i)=>v===bestSafe?i:-1).filter(i=>i>=0);
  const leastOver=Math.min(...totals);
  return totals.map((v,i)=>v===leastOver?i:-1).filter(i=>i>=0);
}

export const tenGame={
  id:'ten',title:'ギリギリ10+',emoji:'🃏',description:'合計は秘密。SAFE / HOT / PERFECT / BUSTだけを公開し、相手の攻め具合を読んで10を狙う。',tags:['2〜8人','チキンレース','読み合い'],
  mount(ctx){const life={destroyed:false,nextStarter:0};start(ctx,life);return()=>{life.destroyed=true}}
};

function start(ctx,life){
  if(life.destroyed)return;
  const count=ctx.session.players.length;
  const starter=life.nextStarter%count;
  life.nextStarter=(starter+1)%count;
  pass(ctx,{
    turn:0,
    order:tenTurnOrder(count,starter),
    totals:Array(count).fill(null),
    bust:Array(count).fill(false),
    signals:Array(count).fill(null)
  },life);
}

function publicBoard(ctx,state){
  const rows=state.signals.map((signal,index)=>{
    if(!signal)return'';
    const def=TEN_SIGNAL_DEFS[signal];
    return`<div class="result-row"><span>${ctx.esc(ctx.session.players[index])}</span><span>${def.label} · ${def.detail}</span></div>`;
  }).join('');
  return rows
    ?`<div class="eyebrow" style="margin-top:18px">PUBLIC SIGNALS</div><div class="result-list">${rows}</div>`
    :'<div class="rules">まだ公開シグナルはありません。最初のプレイヤーが基準を作ります。</div>';
}

function pass(ctx,state,life){
  if(life.destroyed)return;
  const player=state.order[state.turn];
  ctx.renderScorebar(player);
  const name=ctx.session.players[player];
  ctx.root.innerHTML=`<div class="pass-card"><div class="eyebrow">SECRET TOTAL</div><div class="prompt">${ctx.esc(name)}さんへ</div><div class="sub">正確な合計は最後まで秘密。前の人の公開シグナルを見て攻め方を決めます。</div><button class="btn primary" id="ready">自分のターンを始める</button></div>${publicBoard(ctx,state)}<div class="rules">最初に必ず1枚。SAFE=1〜6 / HOT=7〜9 / PERFECT=10 / BUST=11以上。開始プレイヤーはラウンドごとに交代します。</div>`;
  ctx.root.querySelector('#ready').onclick=()=>play(ctx,state,player,{total:0,last:null,draws:0},life);
}

function play(ctx,state,player,hand,life){
  if(life.destroyed)return;
  const busted=hand.total>10,canStop=hand.draws>0;
  ctx.root.innerHTML=`<div class="eyebrow">PUSH YOUR LUCK</div><div class="prompt">合計 ${hand.total}</div>${hand.last?`<div class="sub" style="text-align:center">今引いたカード: +${hand.last}</div>`:''}${busted?'<div class="big-number danger">BUST!</div>':`<div class="choice-grid"><button class="choice" id="draw">🎴 引く<br><small>1〜5</small></button>${canStop?'<button class="choice" id="stop">✋ 止める</button>':''}</div>`}<div class="rules">正確な合計はSHOWDOWNまで非公開。ターン終了後は結果帯だけが次のプレイヤーへ公開されます。</div>${busted?'<button class="btn primary" style="width:100%;margin-top:18px" id="done">次の人へ</button>':''}`;
  ctx.root.querySelector('#draw')?.addEventListener('click',()=>{const value=draw();play(ctx,state,player,{total:hand.total+value,last:value,draws:hand.draws+1},life)});
  ctx.root.querySelector('#stop')?.addEventListener('click',()=>finishPlayer(ctx,state,player,hand.total,false,life));
  ctx.root.querySelector('#done')?.addEventListener('click',()=>finishPlayer(ctx,state,player,hand.total,true,life));
}

function finishPlayer(ctx,state,player,total,bust,life){
  state.totals[player]=total;
  state.bust[player]=bust||total>10;
  state.signals[player]=tenPublicSignal(total,state.bust[player]);
  state.turn++;
  if(state.turn<state.order.length)return pass(ctx,state,life);
  reveal(ctx,state,life);
}

function reveal(ctx,state,life){
  const winners=resolveTenWinners(state.totals,state.bust),allBust=state.bust.every(Boolean);
  winners.forEach(i=>ctx.session.addScore(i,1));
  ctx.renderScorebar();
  ctx.root.innerHTML=`<div class="eyebrow">SHOWDOWN</div><div class="prompt">ギリギリ勝負！</div>${allBust?'<div class="sub" style="text-align:center">全員BUSTのため、10を最も少なく超えた人が勝ち。</div>':''}<div class="result-list">${ctx.session.players.map((n,i)=>{const def=TEN_SIGNAL_DEFS[state.signals[i]];return`<div class="result-row"><span>${ctx.esc(n)}</span><span>${state.totals[i]} · ${def.label} ${winners.includes(i)?'＋1':state.bust[i]?'':'±0'}</span></div>`}).join('')}</div><button class="btn primary" style="width:100%;margin-top:18px" id="next">次へ</button>`;
  ctx.root.querySelector('#next').onclick=()=>ctx.completeRound(()=>start(ctx,life));
}
