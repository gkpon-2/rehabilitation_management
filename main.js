/*
 * main.js
 * 初期化：日付表示・インストール案内・状態読込(MENU/DATA)・移行と同期・初回描画・前面復帰/日付変更の監視・Service Worker登録
 *
 * ※ ビルド不要の素のJavaScript。各ファイルはグローバルスコープを共有し、
 *   index.html末尾で順に読み込まれます（最後に main.js が初期化を実行）。
 */

/* ====== 初期化 ====== */
function setDateLine(){var d=new Date(),w=['日','月','火','水','木','金','土'][d.getDay()];document.getElementById('dateLine').textContent=(d.getMonth()+1)+'月'+d.getDate()+'日（'+w+'）';}
function dismissHint(){document.getElementById('installHint').style.display='none';localStorage.setItem('hideHint','1');}
(function(){var standalone=window.navigator.standalone||window.matchMedia('(display-mode: standalone)').matches;var isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);if(isIOS&&!standalone&&!localStorage.getItem('hideHint')){document.getElementById('installHint').style.display='flex';}})();

var MENU=loadMenu()||defaultMenu();saveMenu();
var DATA=loadData();
var TKEY=todayKey();
migrateAll();
ensureToday();

setDateLine();
document.getElementById('appVer').textContent=APP_VERSION;
wasComplete=(function(){var rec=DATA[TKEY];return totalUnits(rec)>0&&doneUnits(rec)===totalUnits(rec);})();
renderToday();

autoUpdateCheck();
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'){if(todayKey()!==TKEY){location.reload();return;}autoUpdateCheck();}});
setInterval(function(){if(todayKey()!==TKEY)location.reload();},60000);

if('serviceWorker' in navigator){
  var reloaded=false;
  navigator.serviceWorker.addEventListener('controllerchange',function(){if(reloaded)return;reloaded=true;location.reload();});
  window.addEventListener('load',async function(){
    try{
      var reg=await navigator.serviceWorker.register('sw.js',{updateViaCache:'none'});
      reg.update();
      if(reg.waiting)reg.waiting.postMessage('skipWaiting');
      reg.addEventListener('updatefound',function(){var nw=reg.installing;if(!nw)return;nw.addEventListener('statechange',function(){if(nw.state==='installed'&&navigator.serviceWorker.controller){nw.postMessage('skipWaiting');}});});
    }catch(e){}
  });
}
