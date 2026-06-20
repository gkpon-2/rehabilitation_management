/*
 * calendar.js
 * タブ切替・カレンダー(月表示と色分け)・日別詳細の表示
 *
 * ※ ビルド不要の素のJavaScript。各ファイルはグローバルスコープを共有し、
 *   index.html末尾で順に読み込まれます（最後に main.js が初期化を実行）。
 */

/* ====== タブ ====== */
function switchView(v){
  var today=v==='today';
  document.getElementById('viewToday').classList.toggle('on',today);
  document.getElementById('viewHist').classList.toggle('on',!today);
  document.getElementById('tabToday').classList.toggle('on',today);
  document.getElementById('tabHist').classList.toggle('on',!today);
  if(!today){if(editing)toggleEdit();renderCalendar();}
}

/* ====== カレンダー ====== */
var calY,calM;
function renderCalendar(){
  var now=new Date();
  if(calY===undefined){calY=now.getFullYear();calM=now.getMonth();}
  document.getElementById('monthTitle').textContent=calY+'年 '+(calM+1)+'月';
  var first=new Date(calY,calM,1).getDay(),days=new Date(calY,calM+1,0).getDate(),tKey=todayKey(),html='';
  for(var i=0;i<first;i++)html+='<div class="cell empty"></div>';
  var fullCnt=0,anyCnt=0,sumDone=0,sumTotal=0;
  for(var dn=1;dn<=days;dn++){
    var k=calY+'-'+pad2(calM+1)+'-'+pad2(dn),rec=DATA[k];
    var total=rec?totalUnits(rec):0,done=rec?doneUnits(rec):0;
    var isFull=total>0&&done===total;
    var isFuture=new Date(calY,calM,dn)>new Date(now.getFullYear(),now.getMonth(),now.getDate());
    var cls='cell';
    if(isFuture)cls+=' future';
    else if(isFull){cls+=' full';fullCnt++;anyCnt++;}
    else if(done>0){cls+=' partial';anyCnt++;}
    if(k===tKey)cls+=' today';
    if(!isFuture&&rec){sumDone+=done;sumTotal+=total;}
    var tap=isFuture?'':'onclick="openDay(\''+k+'\')"';
    html+='<div class="'+cls+'" '+tap+'><div class="dnum">'+dn+'</div><div class="ddot"></div></div>';
  }
  document.getElementById('calGrid').innerHTML=html;
  document.getElementById('nextM').disabled=(calY===now.getFullYear()&&calM===now.getMonth());
  document.getElementById('sumFull').textContent=fullCnt;
  document.getElementById('sumAny').textContent=anyCnt;
  document.getElementById('sumRate').textContent=(sumTotal?Math.round(sumDone/sumTotal*100):0)+'%';
}
function moveMonth(d){calM+=d;if(calM<0){calM=11;calY--;}else if(calM>11){calM=0;calY++;}renderCalendar();}

/* ====== 日別詳細 ====== */
function openDay(k){
  var rec=DATA[k],p=k.split('-').map(Number),w=['日','月','火','水','木','金','土'][new Date(p[0],p[1]-1,p[2]).getDay()];
  document.getElementById('ddTitle').textContent=p[1]+'月'+p[2]+'日（'+w+'）';
  var done=rec?doneUnits(rec):0,total=rec?totalUnits(rec):0;
  document.getElementById('ddRate').textContent='達成 '+done+' / '+total+' 項目（'+(total?Math.round(done/total*100):0)+'%）';
  var body='';
  if(!rec||done===0){body='<div class="dd-empty">この日の記録はありません</div>';}
  else{
    rec.menu.sections.forEach(function(sec){
      var its=rec.menu.items.filter(function(m){return m.sectionId===sec.id;});
      if(!its.length)return;
      its.forEach(function(mi){
        var st=rec.state[mi.id]||[],ok,val;
        if(mi.kind==='slots'){var nOn=0;mi.labels.forEach(function(_,i){if(st[i])nOn++;});ok=nOn===mi.labels.length;val=mi.labels.map(function(lb,i){return st[i]?esc(lb):'<span style="opacity:.3">'+esc(lb)+'</span>';}).join(' ');}
        else{var n=units(mi),nn=0;for(var i=0;i<n;i++)if(st[i])nn++;ok=nn===n;val=nn+' / '+n+'セット';}
        body+='<div class="dd-row"><span class="di">'+esc(mi.icon||'•')+'</span><span class="dn">'+esc(mi.title)+'</span><span class="dv '+(ok?'ok':'no')+'">'+(ok?'✓ ':'')+val+'</span></div>';
      });
    });
  }
  document.getElementById('ddBody').innerHTML=body;
  document.getElementById('dayDetail').classList.add('show');
}
function closeDay(){document.getElementById('dayDetail').classList.remove('show');}
