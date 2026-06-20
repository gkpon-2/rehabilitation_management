/*
 * menu.js
 * メニュー定義：項目ビルダー(mkSlots/mkSets/mkTimer)・旧既定メニュー(legacyMenu/過去日表示用)・初期メニュー(defaultMenu=空)／localStorageの読み書き(menu・data)
 *
 * ※ ビルド不要の素のJavaScript。各ファイルはグローバルスコープを共有し、
 *   index.html末尾で順に読み込まれます（最後に main.js が初期化を実行）。
 */

/* ====== 既定メニュー ====== */
function mkSlots(id,title,icon,sec,labels,opt){opt=opt||{};return {id:id,title:title,icon:icon,sectionId:sec,kind:'slots',labels:labels.slice(),note:opt.note||'',timerKind:opt.timerKind||'none',timerSec:opt.timerSec||0,restSec:0};}
function mkSets(id,title,icon,sec,sets,count,unit,opt){opt=opt||{};return {id:id,title:title,icon:icon,sectionId:sec,kind:'sets',sets:sets,count:count,unit:unit,note:opt.note||'',timerKind:opt.timerKind||'none',timerSec:opt.timerSec||0,restSec:opt.restSec||0};}
function mkTimer(id,title,icon,sec2,seconds,opt){opt=opt||{};return {id:id,title:title,icon:icon,sectionId:sec2,kind:'sets',sets:1,count:0,unit:'timer',note:opt.note||'',timerKind:'single',timerSec:seconds,restSec:0};}
function legacyMenu(){
  // 過去日（旧フォーマット）の表示用。タイトル等を読みやすく保つためだけに使う。
  var M='s_meal', S='s_sets';
  return {
    sections:[{id:M,title:'毎食後（朝・昼・夜）'},{id:S,title:'セットで行う運動'}],
    items:[
      mkSlots('stand','1分立つ','🧍',M,['朝','昼','夜'],{timerKind:'single',timerSec:60,note:'1分間'}),
      mkSlots('laps','病棟4周','♿',M,['朝','昼','夜'],{note:'車椅子で4周'}),
      mkSlots('heel','両足かかと上げ','👣',M,['朝','昼','夜'],{note:'各30回'}),
      mkSlots('crutch','松葉杖100m歩行','🩼',M,['朝','昼','夜'],{note:'100m'}),
      mkSlots('knee','膝曲げ','🦵',M,['朝','昼','夜'],{note:'20回'}),
      mkSets('ankleUD','右足首の上げ下げ','🦶',S,2,20,'回'),
      mkSets('ankleTW','右足首のタオル運動','🦶',S,10,20,'秒',{timerKind:'interval',timerSec:20,restSec:5}),
      mkSets('legDown','タオル足下げ','🦵',S,2,50,'回'),
      mkSets('rLeg','右足の足上げ運動','🦵',S,3,10,'回'),
      mkSets('lLeg','左足の足上げ運動','🦵',S,3,10,'回'),
      mkSets('push','車椅子プッシュアップ','💪',S,3,10,'回'),
      mkSets('toeGrab','足指タオル掴み','🦶',S,3,10,'回'),
      mkTimer('ball','足裏ボール転がし','🎾',S,600)
    ]
  };
}
function defaultMenu(){
  // 最初はまっさら。あなたが「編集」から項目を入れていきます。
  return { sections:[], items:[] };
}

/* ====== 保存・読み込み ====== */
var STORE_DATA='rehab-data-v1', STORE_MENU='rehab-menu-v2';
function loadMenu(){try{return JSON.parse(localStorage.getItem(STORE_MENU));}catch(e){return null;}}
function saveMenu(){try{localStorage.setItem(STORE_MENU,JSON.stringify(MENU));}catch(e){}}
function loadData(){try{return JSON.parse(localStorage.getItem(STORE_DATA))||{};}catch(e){return {};}}
function saveData(){try{localStorage.setItem(STORE_DATA,JSON.stringify(DATA));}catch(e){}}
