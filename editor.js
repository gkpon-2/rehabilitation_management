/*
 * editor.js
 * 編集モード：項目/セクションの一覧描画・追加/編集/削除・セクション並べ替え・iOS風スムーズドラッグ(セクション内)
 *
 * ※ ビルド不要の素のJavaScript。各ファイルはグローバルスコープを共有し、
 *   index.html末尾で順に読み込まれます（最後に main.js が初期化を実行）。
 */

/* ====== 編集モード ====== */
var editing=false;
function toggleEdit(){
  editing=!editing;
  document.getElementById('editBtn').classList.toggle('on',editing);
  document.getElementById('editBtn').textContent=editing?'✓ 編集を終わる':'✎ 項目を編集';
  document.getElementById('footBox').style.display=editing?'none':'';
  if(editing){ if(!MENU.sections.length){MENU.sections.push({id:uid('sec_'),title:'メニュー'});saveMenu();} renderEdit(); }
  else{ saveMenu(); ensureToday(); renderToday(); }
}
function renderEdit(){
  var html='';
  MENU.sections.forEach(function(sec,si){
    html+='<div class="sec-edit" data-sec="'+sec.id+'">'
      +'<div class="sec-ord"><button class="ordb" data-secup="'+sec.id+'"'+(si===0?' disabled':'')+'>▲</button><button class="ordb" data-secdown="'+sec.id+'"'+(si===MENU.sections.length-1?' disabled':'')+'>▼</button></div>'
      +'<input value="'+esc(sec.title)+'" data-sectitle="'+sec.id+'"/>'
      +'<button class="sdel" data-secdel="'+sec.id+'">削除</button></div>';
    html+='<div class="eitems" data-sec="'+sec.id+'">';
    MENU.items.filter(function(m){return m.sectionId===sec.id;}).forEach(function(mi){html+=erowHTML(mi);});
    html+='</div>';
    html+='<button class="add-item-btn" data-additem="'+sec.id+'">＋ この欄に項目を追加</button>';
  });
  html+='<button class="add-sec-btn" data-addsec="1">＋ セクションを追加</button>';
  html+='<div class="edit-tip">右側の <b>≡</b> を押しながら上下にドラッグで並べ替え。<br>別のセクションへ移すときは ✎ →「セクション」で変更できます。<br>変更は<b>今日から</b>反映され、前日までの達成率は変わりません。</div>';
  listEl.innerHTML=html;
  bindEdit();
}
function erowHTML(mi){
  return '<div class="erow" data-item="'+mi.id+'">'
    +'<button class="minus" data-del="'+mi.id+'" aria-label="削除">−</button>'
    +'<span class="ei">'+esc(mi.icon||'•')+'</span>'
    +'<div class="et"><div class="nm">'+esc(mi.title)+'</div><div class="fq">'+esc(freqText(mi))+'</div></div>'
    +'<button class="ebtn" data-edit="'+mi.id+'">✎</button>'
    +'<span class="handle" data-handle="'+mi.id+'" aria-label="並べ替え">≡</span>'
    +'</div>';
}
function bindEdit(){
  listEl.querySelectorAll('[data-sectitle]').forEach(function(inp){inp.onchange=function(){var s=MENU.sections.find(function(x){return x.id===inp.dataset.sectitle;});if(s){s.title=inp.value.trim()||'(無題)';saveMenu();}};});
  listEl.querySelectorAll('[data-secdel]').forEach(function(b){b.onclick=function(){delSection(b.dataset.secdel);};});
  listEl.querySelectorAll('[data-secup]').forEach(function(b){b.onclick=function(){moveSection(b.dataset.secup,-1);};});
  listEl.querySelectorAll('[data-secdown]').forEach(function(b){b.onclick=function(){moveSection(b.dataset.secdown,1);};});
  listEl.querySelectorAll('[data-additem]').forEach(function(b){b.onclick=function(){openModal(null,b.dataset.additem);};});
  listEl.querySelectorAll('[data-addsec]').forEach(function(b){b.onclick=function(){MENU.sections.push({id:uid('sec_'),title:'新しいセクション'});saveMenu();renderEdit();};});
  listEl.querySelectorAll('[data-edit]').forEach(function(b){b.onclick=function(){var mi=MENU.items.find(function(x){return x.id===b.dataset.edit;});openModal(mi,mi.sectionId);};});
  listEl.querySelectorAll('[data-del]').forEach(function(b){b.onclick=function(){var mi=MENU.items.find(function(x){return x.id===b.dataset.del;});if(mi&&confirm('「'+mi.title+'」を削除しますか？（今日から反映されます）')){MENU.items=MENU.items.filter(function(x){return x.id!==b.dataset.del;});saveMenu();renderEdit();}};});
  listEl.querySelectorAll('[data-handle]').forEach(function(h){h.addEventListener('pointerdown',function(ev){dragStart(h.dataset.handle,ev);});});
}
function delSection(secId){
  var its=MENU.items.filter(function(m){return m.sectionId===secId;});
  var msg=its.length?('このセクション内の '+its.length+' 項目も削除されます。よろしいですか？'):'このセクションを削除しますか？';
  if(!confirm(msg))return;
  MENU.items=MENU.items.filter(function(m){return m.sectionId!==secId;});
  MENU.sections=MENU.sections.filter(function(s){return s.id!==secId;});
  saveMenu();renderEdit();
}
function moveSection(id,dir){
  var i=MENU.sections.findIndex(function(s){return s.id===id;});if(i<0)return;
  var j=i+dir;if(j<0||j>=MENU.sections.length)return;
  var t=MENU.sections[i];MENU.sections[i]=MENU.sections[j];MENU.sections[j]=t;
  saveMenu();renderEdit();
}

/* ---- 並べ替え（セクション内・iOS風スムーズドラッグ） ---- */
var DG=null;
function dragStart(id,ev){
  ev.preventDefault();
  var row=listEl.querySelector('.erow[data-item="'+id+'"]');if(!row)return;
  var container=row.parentNode;
  var rows=Array.prototype.slice.call(container.querySelectorAll('.erow'));
  var rects=rows.map(function(r){return r.getBoundingClientRect();});
  var idx=rows.indexOf(row);
  var step=rows.length>1?(idx<rows.length-1?rects[idx+1].top-rects[idx].top:rects[idx].top-rects[idx-1].top):rects[idx].height+9;
  DG={id:id,container:container,rows:rows,rects:rects,idx:idx,target:idx,startY:ev.clientY,step:step};
  rows.forEach(function(r){r.style.transition='transform .18s cubic-bezier(.2,.8,.2,1)';});
  row.classList.add('lifting');row.style.transition='none';
  try{ev.target.setPointerCapture&&ev.target.setPointerCapture(ev.pointerId);}catch(e){}
  document.addEventListener('pointermove',dragMove);
  document.addEventListener('pointerup',dragEnd);
  document.addEventListener('pointercancel',dragEnd);
}
function dragMove(ev){
  if(!DG)return;
  var dy=ev.clientY-DG.startY;
  DG.rows[DG.idx].style.transform='translateY('+dy+'px) scale(1.03)';
  var center=DG.rects[DG.idx].top+DG.rects[DG.idx].height/2+dy;
  var target=0,i;
  for(i=0;i<DG.rows.length;i++){if(i===DG.idx)continue;var c=DG.rects[i].top+DG.rects[i].height/2;if(c<center)target++;}
  DG.target=target;
  for(i=0;i<DG.rows.length;i++){
    if(i===DG.idx)continue;
    var shift=0;
    if(DG.idx<target){if(i>DG.idx&&i<=target)shift=-DG.step;}
    else if(DG.idx>target){if(i>=target&&i<DG.idx)shift=DG.step;}
    DG.rows[i].style.transform=shift?('translateY('+shift+'px)'):'';
  }
}
function dragEnd(){
  if(!DG)return;
  document.removeEventListener('pointermove',dragMove);
  document.removeEventListener('pointerup',dragEnd);
  document.removeEventListener('pointercancel',dragEnd);
  var secId=DG.container.dataset.sec,idx=DG.idx,target=DG.target;
  if(target!==idx){
    var secItems=MENU.items.filter(function(m){return m.sectionId===secId;});
    var moved=secItems.splice(idx,1)[0];
    secItems.splice(target,0,moved);
    var q=secItems.slice();
    MENU.items=MENU.items.map(function(m){return m.sectionId===secId?q.shift():m;});
    saveMenu();
    if(navigator.vibrate)navigator.vibrate(15);
  }
  DG=null;
  renderEdit();
}
