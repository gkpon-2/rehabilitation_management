/*
 * data.js
 * データモデル：旧フォーマットの日次データ移行・今日のレコードを現メニューへ同期(過去日は不変)・達成数/合計の集計
 *
 * ※ ビルド不要の素のJavaScript。各ファイルはグローバルスコープを共有し、
 *   index.html末尾で順に読み込まれます（最後に main.js が初期化を実行）。
 */

/* ====== 旧フォーマットの日次データを移行 ====== */
var LEGACY={};legacyMenu().items.forEach(function(it){LEGACY[it.id]=it;});
function isNewRec(r){return r&&typeof r==='object'&&r.menu&&r.state;}
function migrateRec(old){
  var items=[],state={},secUsed={};
  Object.keys(old).forEach(function(id){
    var v=old[id],def=LEGACY[id],mi;
    if(Array.isArray(v)){
      mi=def&&def.kind==='sets'?JSON.parse(JSON.stringify(def)):{id:id,title:(def&&def.title)||id,icon:(def&&def.icon)||'•',sectionId:(def&&def.sectionId)||'s_sets',kind:'sets',sets:v.length,count:0,unit:'回',note:'',timerKind:'none',timerSec:0,restSec:0};
      mi.sets=v.length; state[id]=v.map(Boolean);
    }else if(v&&typeof v==='object'){
      mi=def&&def.kind==='slots'?JSON.parse(JSON.stringify(def)):{id:id,title:(def&&def.title)||id,icon:(def&&def.icon)||'•',sectionId:(def&&def.sectionId)||'s_meal',kind:'slots',labels:['朝','昼','夜'],note:'',timerKind:'none',timerSec:0,restSec:0};
      if(!mi.labels)mi.labels=['朝','昼','夜'];
      state[id]=[!!v.m,!!v.n,!!v.e];
    }else return;
    items.push(mi);secUsed[mi.sectionId]=1;
  });
  var defM=legacyMenu();
  var sections=defM.sections.filter(function(s){return secUsed[s.id];});
  Object.keys(secUsed).forEach(function(sid){if(!sections.some(function(s){return s.id===sid;}))sections.push({id:sid,title:'その他'});});
  var order={};defM.items.forEach(function(it,i){order[it.id]=i;});
  items.sort(function(a,b){var oa=order[a.id]==null?999:order[a.id],ob=order[b.id]==null?999:order[b.id];return oa-ob;});
  return {menu:{sections:sections,items:items},state:state};
}
function migrateAll(){
  var changed=false;
  Object.keys(DATA).forEach(function(k){
    if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(k))return;
    if(!isNewRec(DATA[k])){DATA[k]=migrateRec(DATA[k]);changed=true;}
  });
  if(changed)saveData();
}

/* ====== 今日のレコードを現メニューに同期（状態は保持／過去日は不変） ====== */
function snapMenu(){return JSON.parse(JSON.stringify({sections:MENU.sections,items:MENU.items}));}
function ensureToday(){
  var prev=DATA[TKEY];var prevState=(prev&&prev.state)?prev.state:{};
  var state={};
  MENU.items.forEach(function(mi){
    var n=units(mi),old=prevState[mi.id],arr=new Array(n).fill(false);
    if(Array.isArray(old))for(var i=0;i<Math.min(n,old.length);i++)arr[i]=!!old[i];
    state[mi.id]=arr;
  });
  DATA[TKEY]={menu:snapMenu(),state:state};
  saveData();
}

/* ====== 集計 ====== */
function totalUnits(rec){return rec.menu.items.reduce(function(s,mi){return s+units(mi);},0);}
function doneUnits(rec){var c=0;rec.menu.items.forEach(function(mi){(rec.state[mi.id]||[]).forEach(function(b){if(b)c++;});});return c;}
function itemDone(rec,mi){var st=rec.state[mi.id]||[],n=units(mi),c=0;for(var i=0;i<n;i++)if(st[i])c++;return n>0&&c===n;}
function recComplete(rec){if(!rec||!rec.menu)return false;var t=totalUnits(rec);return t>0&&doneUnits(rec)===t;}
