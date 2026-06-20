/*
 * helpers.js
 * 共通ヘルパー：日付キー生成・ID生成・HTMLエスケープ／表示用の単位数・時間表記・頻度テキスト・タイマー有無判定
 *
 * ※ ビルド不要の素のJavaScript。各ファイルはグローバルスコープを共有し、
 *   index.html末尾で順に読み込まれます（最後に main.js が初期化を実行）。
 */

/* ====== 基本ヘルパー ====== */
function pad2(n){return String(n).padStart(2,'0');}
function keyOf(d){return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());}
function todayKey(){return keyOf(new Date());}
function uid(p){return (p||'it_')+Math.random().toString(36).slice(2,7)+Date.now().toString(36).slice(-4);}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

/* ====== 表示用ヘルパー ====== */
function units(mi){return mi.kind==='slots' ? mi.labels.length : mi.sets;}
function fmtDur(s){var m=Math.floor(s/60),x=s%60;return m?(x?m+'分'+x+'秒':m+'分'):x+'秒';}
function freqText(mi){
  var t='';
  if(mi.kind==='slots'){
    var L=mi.labels;
    if(L.length===3&&L[0]==='朝')t='朝・昼・夜';
    else if(L.length===2&&L[0]==='朝')t='朝・夜';
    else t='1日'+L.length+'回';
  }else{
    if(mi.unit==='timer')t=fmtDur(mi.timerSec);
    else{t=mi.count+mi.unit+' × '+mi.sets+'セット';if(mi.timerKind==='interval'&&mi.restSec>0)t+='（休憩'+mi.restSec+'秒）';}
  }
  if(mi.note)t+='・'+mi.note;
  return t;
}
function hasTimer(mi){return mi.timerKind&&mi.timerKind!=='none'&&mi.timerSec>0;}
