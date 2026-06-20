/*
 * today.js
 * 今日ビュー：カード描画(スロット/セット/タイマーボタン)・タップ記録・達成リング/連続日数/コンプリート演出・今日のリセット
 *
 * ※ ビルド不要の素のJavaScript。各ファイルはグローバルスコープを共有し、
 *   index.html末尾で順に読み込まれます（最後に main.js が初期化を実行）。
 */

/* ====== 今日ビュー描画 ====== */
var listEl=document.getElementById('list');
function renderToday(){
  var rec=DATA[TKEY],html='';
  if(!rec.menu.items.length){
    listEl.innerHTML='<div style="text-align:center;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:34px 22px;box-shadow:var(--shadow);">'
      +'<div style="font-size:46px;line-height:1;margin-bottom:14px;">🌱</div>'
      +'<div style="font-size:17px;font-weight:800;margin-bottom:8px;">まずはメニューを作りましょう</div>'
      +'<div style="font-size:13px;color:var(--muted);font-weight:600;line-height:1.8;margin-bottom:20px;">続けたいリハビリや運動を登録して、<br>毎日タップで記録していけます。</div>'
      +'<button onclick="if(!editing)toggleEdit();" style="border:none;background:var(--primary);color:#fff;border-radius:14px;padding:14px 26px;font-size:15px;font-weight:800;cursor:pointer;">✎ 項目を作る</button>'
      +'</div>';
    updateProgress();return;
  }
  rec.menu.sections.forEach(function(sec){
    var its=rec.menu.items.filter(function(m){return m.sectionId===sec.id;});
    if(!its.length)return;
    html+='<div class="sec"><span>'+esc(sec.title)+'</span></div>';
    its.forEach(function(mi){html+=cardHTML(rec,mi);});
  });
  var known={};rec.menu.sections.forEach(function(s){known[s.id]=1;});
  var orph=rec.menu.items.filter(function(m){return !known[m.sectionId];});
  if(orph.length){html+='<div class="sec"><span>その他</span></div>';orph.forEach(function(mi){html+=cardHTML(rec,mi);});}
  listEl.innerHTML=html;
  bindToday();updateProgress();
}
function cardHTML(rec,mi){
  var st=rec.state[mi.id]||[],done=itemDone(rec,mi),inner='';
  if(mi.kind==='slots'){
    inner='<div class="slots">'+mi.labels.map(function(lb,i){var on=!!st[i];return '<div class="slot '+(on?'on':'')+'" data-id="'+mi.id+'" data-i="'+i+'"><div class="lbl">'+esc(lb)+'</div><div class="sub">'+(on?'完了':'タップ')+'</div></div>';}).join('')+'</div>';
  }else{
    var n=units(mi),dots='';for(var i=0;i<n;i++){dots+='<div class="setdot '+(st[i]?'on':'')+'" data-id="'+mi.id+'" data-i="'+i+'">'+(i+1)+'</div>';}
    inner='<div class="sets-row">'+dots+'<span style="font-size:12.5px;color:var(--muted);font-weight:700;margin-left:2px;">'+esc(freqText(mi))+'</span></div>';
  }
  var timer='';
  if(hasTimer(mi)){var lbl=mi.timerKind==='interval'?(mi.timerSec+'秒×'+mi.sets):fmtDur(mi.timerSec);timer='<div class="timer-btn" data-timer="'+mi.id+'">⏱ タイマー（'+lbl+'）</div>';}
  return '<div class="card '+(done?'done':'')+'" id="card-'+mi.id+'"><div class="card-top"><div class="ex-icon">'+esc(mi.icon||'•')+'</div><div class="ex-meta"><div class="ex-name">'+esc(mi.title)+'</div><div class="ex-sub">'+esc(freqText(mi))+'</div></div><div class="ex-check"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg></div></div>'+inner+timer+'</div>';
}
function bindToday(){
  var rec=DATA[TKEY];
  listEl.querySelectorAll('.slot,.setdot').forEach(function(el){el.onclick=function(){var id=el.dataset.id,i=+el.dataset.i;rec.state[id]=rec.state[id]||[];rec.state[id][i]=!rec.state[id][i];saveData();commitCard(id);};});
  listEl.querySelectorAll('[data-timer]').forEach(function(el){el.onclick=function(){openTimer(el.dataset.timer);};});
}
function commitCard(id){
  var rec=DATA[TKEY],mi=rec.menu.items.find(function(m){return m.id===id;}),card=document.getElementById('card-'+id);
  if(!card||!mi)return;
  card.classList.toggle('done',itemDone(rec,mi));
  var st=rec.state[id]||[];
  card.querySelectorAll('.slot').forEach(function(s){var on=!!st[+s.dataset.i];s.classList.toggle('on',on);var sub=s.querySelector('.sub');if(sub)sub.textContent=on?'完了':'タップ';});
  card.querySelectorAll('.setdot').forEach(function(s){s.classList.toggle('on',!!st[+s.dataset.i]);});
  updateProgress();
}

/* ====== 進捗・連続・コンプリート ====== */
var RING_LEN=238.76,wasComplete=false;
function updateProgress(){
  var rec=DATA[TKEY],total=totalUnits(rec),c=doneUnits(rec),pct=total?Math.round(c/total*100):0;
  document.getElementById('ringFg').style.strokeDashoffset=RING_LEN*(1-(total?c/total:0));
  document.getElementById('ringPct').textContent=pct+'%';
  document.getElementById('doneCount').textContent=c;
  document.getElementById('totalCount').textContent=total;
  document.getElementById('ringFg').style.stroke=(total&&c===total)?'var(--accent)':'var(--primary)';
  updateStreak();
  if(total&&c===total&&!wasComplete){wasComplete=true;showComplete();}
  if(c<total)wasComplete=false;
}
function updateStreak(){
  var streak=0,dt=new Date();
  for(var i=0;i<400;i++){var k=keyOf(dt);if(recComplete(DATA[k]))streak++;else if(i>0)break;dt.setDate(dt.getDate()-1);}
  document.getElementById('streak').textContent='🔥 連続 '+streak+' 日';
}
function resetToday(){if(!confirm('今日の記録をすべて消して、最初からやり直しますか？'))return;DATA[TKEY].state={};ensureToday();wasComplete=false;renderToday();}

function showComplete(){
  var el=document.getElementById('complete');el.classList.add('show');
  if(navigator.vibrate)navigator.vibrate([60,40,60,40,120]);
  var colors=['#E5B53A','#E8763C','#157C64','#7FCBB3','#fff'];
  for(var i=0;i<40;i++){(function(i){var c=document.createElement('div');c.className='confetti';c.style.left=Math.random()*100+'%';c.style.background=colors[i%colors.length];c.style.animationDuration=(1.6+Math.random()*1.4)+'s';c.style.animationDelay=(Math.random()*.4)+'s';el.appendChild(c);setTimeout(function(){c.remove();},3600);})(i);}
}
function hideComplete(){document.getElementById('complete').classList.remove('show');}
