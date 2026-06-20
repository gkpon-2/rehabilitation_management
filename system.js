/*
 * system.js
 * バックアップ書き出し/復元(メニュー＋記録)・バージョン管理と自動更新チェック
 *
 * ※ ビルド不要の素のJavaScript。各ファイルはグローバルスコープを共有し、
 *   index.html末尾で順に読み込まれます（最後に main.js が初期化を実行）。
 */

/* ====== バックアップ / 復元 ====== */
function exportData(){
  try{
    var payload={__rehab:1,version:APP_VERSION,menu:MENU,data:DATA};
    var blob=new Blob([JSON.stringify(payload)],{type:'application/json'});
    var url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='rehab-backup-'+todayKey()+'.json';document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},1500);
  }catch(e){alert('書き出しに失敗しました。');}
}
function importData(e){
  var f=e.target.files&&e.target.files[0];if(!f)return;
  var r=new FileReader();
  r.onload=function(){
    try{
      var obj=JSON.parse(r.result);
      if(obj&&obj.__rehab){if(obj.menu)MENU=obj.menu;if(obj.data)DATA=obj.data;}
      else if(obj&&typeof obj==='object'&&!Array.isArray(obj)){DATA=obj;}
      else throw 0;
      saveMenu();saveData();
      alert('復元しました。画面を更新します。');location.reload();
    }catch(err){alert('このファイルは読み込めませんでした。バックアップで書き出したJSONを選んでください。');}
    finally{e.target.value='';}
  };
  r.readAsText(f);
}

/* ====== バージョン / 自動更新 ====== */
var APP_VERSION='13';
function checkUpdate(){
  (async function(){try{if('serviceWorker' in navigator){var reg=await navigator.serviceWorker.getRegistration();if(reg)await reg.update();}}catch(e){}location.reload();})();
}
var updChecking=false;
async function autoUpdateCheck(){
  if(updChecking)return;updChecking=true;
  try{
    var res=await fetch('version.json?t='+Date.now(),{cache:'no-store'});
    if(res.ok){
      var v=(await res.json()).version;
      if(v&&v!==APP_VERSION){
        var tries=+(sessionStorage.getItem('updTries')||0);
        if(tries<2){sessionStorage.setItem('updTries',tries+1);try{var reg=await navigator.serviceWorker.getRegistration();if(reg)await reg.update();}catch(e){}location.reload();return;}
      }else{sessionStorage.removeItem('updTries');}
    }
  }catch(e){}
  updChecking=false;
}
