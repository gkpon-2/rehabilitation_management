/*
 * modal.js
 * 項目エディタ・モーダル：頻度と「タイマー(独立)」の入力・編集時の値復元・保存処理
 *
 * ※ ビルド不要の素のJavaScript。各ファイルはグローバルスコープを共有し、
 *   index.html末尾で順に読み込まれます（最後に main.js が初期化を実行）。
 */

/* ====== 項目エディタ・モーダル ====== */
var EMOJIS=['🦶','🦵','💪','🧍','♿','🩼','👣','🎾','✊','🙆','🤸','🚶','🪑','❤️','⏱'];
var editingItem=null,modalSecId=null,pickedEmoji='';
function openModal(mi,secId){
  editingItem=mi||null;modalSecId=secId||(MENU.sections[0]&&MENU.sections[0].id);
  document.getElementById('mTitle').textContent=mi?'項目を編集':'項目を追加';
  document.getElementById('mName').value=mi?mi.title:'';
  document.getElementById('mNote').value=mi?(mi.note||''):'';
  pickedEmoji=mi?(mi.icon||''):'';
  var ep=document.getElementById('mEmoji');ep.innerHTML=EMOJIS.map(function(e){return '<button type="button" data-e="'+e+'" class="'+(e===pickedEmoji?'on':'')+'">'+e+'</button>';}).join('');
  ep.querySelectorAll('button').forEach(function(b){b.onclick=function(){pickedEmoji=b.dataset.e;ep.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x.dataset.e===pickedEmoji);});};});
  var ss=document.getElementById('mSec');ss.innerHTML=MENU.sections.map(function(s){return '<option value="'+s.id+'"'+(s.id===modalSecId?' selected':'')+'>'+esc(s.title)+'</option>';}).join('');
  // 頻度の既定値
  var type='m3', timer='none';
  // フィールド初期値
  document.getElementById('mDN').value=3;
  document.getElementById('mReps').value=10;document.getElementById('mUnit').value='回';document.getElementById('mSets').value=3;
  document.getElementById('mMin').value=1;document.getElementById('mSecOnly').value=0;
  document.getElementById('mKeep').value=20;document.getElementById('mRest').value=5;
  if(mi){
    if(mi.kind==='slots'){type=(mi.labels.length===3&&mi.labels[0]==='朝')?'m3':(mi.labels.length===2&&mi.labels[0]==='朝')?'m2':'dN';if(type==='dN')document.getElementById('mDN').value=mi.labels.length;}
    else{type='sets';document.getElementById('mReps').value=mi.count||10;document.getElementById('mUnit').value=(mi.unit==='秒'?'秒':'回');document.getElementById('mSets').value=mi.sets||3;}
    timer=mi.timerKind||'none';
    if(timer==='single'){document.getElementById('mMin').value=Math.floor((mi.timerSec||0)/60);document.getElementById('mSecOnly').value=(mi.timerSec||0)%60;}
    if(timer==='interval'){document.getElementById('mKeep').value=mi.timerSec||20;document.getElementById('mRest').value=mi.restSec||0;}
  }
  document.getElementById('mType').value=type;
  document.getElementById('mTimer').value=timer;
  updateModalFields();
  document.getElementById('itemModal').classList.add('show');
}
function updateModalFields(){
  var t=document.getElementById('mType').value, tm=document.getElementById('mTimer').value;
  document.getElementById('fDN').style.display=t==='dN'?'':'none';
  document.getElementById('fSets').style.display=t==='sets'?'':'none';
  // インターバルタイマーは「セット系」のときだけ選べる
  var opt=document.getElementById('optInterval'), sel=document.getElementById('mTimer');
  if(t==='sets'){opt.disabled=false;opt.style.display='';}
  else{opt.disabled=true;opt.style.display='none';if(sel.value==='interval'){sel.value='none';tm='none';}}
  document.getElementById('fTimerSingle').style.display=tm==='single'?'':'none';
  document.getElementById('fTimerInterval').style.display=tm==='interval'?'':'none';
}
function closeModal(){document.getElementById('itemModal').classList.remove('show');editingItem=null;}
function saveModal(){
  var title=document.getElementById('mName').value.trim();
  if(!title){alert('タイトルを入力してください。');return;}
  var t=document.getElementById('mType').value,tm=document.getElementById('mTimer').value;
  var secId=document.getElementById('mSec').value,note=document.getElementById('mNote').value.trim();
  var id=editingItem?editingItem.id:uid('it_');
  var mi={id:id,title:title,icon:pickedEmoji,sectionId:secId,note:note,timerKind:'none',timerSec:0,restSec:0};
  function num(idn,min,def){var v=parseInt(document.getElementById(idn).value,10);if(isNaN(v))v=def;if(v<min)v=min;return v;}
  // 頻度
  if(t==='m3'){mi.kind='slots';mi.labels=['朝','昼','夜'];}
  else if(t==='m2'){mi.kind='slots';mi.labels=['朝','夜'];}
  else if(t==='dN'){var n=num('mDN',1,3);mi.kind='slots';mi.labels=[];for(var i=1;i<=n;i++)mi.labels.push(String(i));}
  else{mi.kind='sets';mi.unit=document.getElementById('mUnit').value;mi.count=num('mReps',1,10);mi.sets=num('mSets',1,3);}
  // タイマー（頻度から独立）
  if(tm==='single'){mi.timerKind='single';mi.timerSec=num('mMin',0,0)*60+num('mSecOnly',0,0);if(mi.timerSec<1)mi.timerSec=1;}
  else if(tm==='interval'&&mi.kind==='sets'){mi.timerKind='interval';mi.timerSec=num('mKeep',1,20);mi.restSec=num('mRest',0,5);}
  if(editingItem){var idx=MENU.items.findIndex(function(x){return x.id===id;});MENU.items[idx]=mi;}
  else MENU.items.push(mi);
  saveMenu();closeModal();renderEdit();
}
