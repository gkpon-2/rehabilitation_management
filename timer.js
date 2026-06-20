/*
 * timer.js
 * タイマー：単発／セットごと(インターバル＋休憩)のフェーズ生成・カウントダウン・表示と色・バイブ
 *
 * ※ ビルド不要の素のJavaScript。各ファイルはグローバルスコープを共有し、
 *   index.html末尾で順に読み込まれます（最後に main.js が初期化を実行）。
 */

/* ====== タイマー ====== */
var TRING=552.92,phases=[],pIdx=0,pSec=0,tLeft=0,tInt=null,tRunning=false,tFinished=false;
function buildPhases(mi){
  if(mi.timerKind==='interval'){
    var out=[];for(var r=1;r<=mi.sets;r++){out.push({label:r+'セット目',sec:mi.timerSec,kind:'keep'});if(mi.restSec>0&&r<mi.sets)out.push({label:'休憩（つぎ'+(r+1)+'セット目）',sec:mi.restSec,kind:'rest'});}
    return out;
  }
  return [{label:fmtDur(mi.timerSec),sec:mi.timerSec,kind:'keep'}];
}
function openTimer(id){
  var mi=DATA[TKEY].menu.items.find(function(m){return m.id===id;});if(!mi)return;
  clearInterval(tInt);tRunning=false;tFinished=false;
  phases=buildPhases(mi);pIdx=0;pSec=phases[0].sec;tLeft=pSec;
  document.getElementById('tTitle').textContent=mi.title;
  document.getElementById('tToggle').textContent='スタート';
  paintTimer();document.getElementById('timerOverlay').classList.add('show');
}
function paintTimer(){
  var num=document.getElementById('tNum'),sub=document.getElementById('tSub'),ph=phases[pIdx]||{};
  if(tFinished){num.textContent='おわり！';num.classList.add('fin');sub.textContent='おつかれさまでした';}
  else{num.classList.remove('fin');num.textContent=pSec>=60?Math.floor(tLeft/60)+':'+pad2(tLeft%60):tLeft;sub.textContent=ph.label;}
  var frac=pSec?tLeft/pSec:0,ring=document.getElementById('tRing');
  ring.style.strokeDashoffset=TRING*(1-frac);
  var col='#157C64';if(ph.kind==='rest')col='#E5B53A';else if(ph.kind&&ph.kind.indexOf('下げ')>=0)col='#E8763C';
  ring.style.stroke=col;
}
function tick(){
  tLeft--;
  if(tLeft<=0){
    if(pIdx<phases.length-1){pIdx++;pSec=phases[pIdx].sec;tLeft=pSec;if(navigator.vibrate)navigator.vibrate(phases[pIdx].kind==='rest'?[110]:[220,90,220]);paintTimer();}
    else{clearInterval(tInt);tRunning=false;tFinished=true;document.getElementById('tToggle').textContent='もう一度';if(navigator.vibrate)navigator.vibrate([120,60,120,60,320]);paintTimer();}
    return;
  }
  paintTimer();
}
function toggleTimer(){
  if(tFinished){tFinished=false;pIdx=0;pSec=phases[0].sec;tLeft=pSec;paintTimer();}
  if(tRunning){tRunning=false;clearInterval(tInt);document.getElementById('tToggle').textContent='再開';return;}
  tRunning=true;document.getElementById('tToggle').textContent='一時停止';clearInterval(tInt);tInt=setInterval(tick,1000);
}
function closeTimer(){clearInterval(tInt);tRunning=false;document.getElementById('timerOverlay').classList.remove('show');}
