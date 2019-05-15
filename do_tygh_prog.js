
// OPD Tracking Module
// By Balance Wu
// Last Modified: 2018/08/08
// One-time Parsing: NO only(need 3 times)
// Actual Patient Number: Yes
// Note:



var casper = require('casper').create({
  verbose: true,
  clientScripts: ['lib/jquery-1.11.1.min.js'],
  pageSettings: {
    webSecurityEnabled: false,
    loadImages: false,
    loadPlugins: false
  },
  waitTimeout: 30000
  //logLevel: 'debug'
});
var $ = require('lib/jQasper.js').create(casper);
var fs = require('fs');

// By Module Variables
var param = {
  url: "http://tyghnetreg.tygh.mohw.gov.tw/RegMobileWeb/Home/RegRoomList",
  fn_log: "tygh.json",
  post_url: "http://localhost/opdtrack/engine_debug.php",
  hosname: "衛生福利部桃園醫院",
  module: "tygh",

};
var log = {
  date:"",
  datetime:"",
  records:[],
};
var debug = true;

var logAll = [];
// MAIN =====================================================================
casper.on("remote.message", function(message) {
  //this.echo("\tremote console.log: " + message);
});

casper.start().open(param.url).then(function() {
  this.echo("Entering " + param.url);
  this.then(function() {
    var main_dom = $("[class='ui-li-static ui-body-inherit']");
    for(var i=0;i<main_dom.length;i++){
      var doc_name = $("[class='regroom-list-dr']").eq(i).text().replace(/－針傷/,"").replace(/－內婦/,"").replace(/－內兒/,"");
      var dep = $("[class='regroom-list-dept']").eq(0).text().split("  ")[1].replace(/診/,"").replace(/一/,"").replace(/二/,"").replace(/三/,"").replace(/四/,"").replace(/五/,"").replace(/六/,"").replace(/七/,"").replace(/八/,"").replace(/九/,"");
      var _p_num = $("[class='regroom-list-no']").eq(i).text()*1;
      var _ampm = $("[class='regroom-list-dept']").eq(0).text().split("  ")[0].replace(/診/,"");

      if(debug){
        this.echo(doc_name);
        this.echo(dep);
        this.echo(_ampm);
        this.echo(_p_num);
      }

      if((doc_name=="")||(_ampm=="")||(dep=="")||(_p_num=="")){

      }
      else {
        log.records.push({
          mod: param.module,
          hos_id: null,
          hos_name: param.hosname,
          opdtime: _ampm,
          hos_grp: null,
          hos_dep: dep,
          name: doc_name,
          note: "",
          num: _p_num
        });
      }
    }

  });
  //-------- Test
  //parse_progress(ampm_dom.eq(1), dep_dom.eq(1));
  //-------
}).then(function() {
  etime = now_time();
  log.date = get_date();
  log.datetime = get_date() + " " + get_now();
  // log_now(etime);
  this.echo("\nPosting to Server...");
  make_doPost(param.post_url, "set_records", log, true)();

}).then(function(){
  this.echo("\nFinalizing...");
  make_doPost(param.post_url, "final", {module: param.module}, true)();
});



function now_time() {
  return (
    casper.evaluate(function() {
      return (new Date().toJSON().slice(0, 10));
    })
  );
}

function log_now(_name){
	fs.write("data/" + param.module + "/" + _name + param.fn_log, JSON.stringify(log.records));
}

function get_date(){
  var now = new Date();
  var y = now.getFullYear()*1;
  var m = now.getMonth()*1+1;
  var d = now.getDate()*1;
  return(conv(y) +"-" + conv(m) + "-" + conv(d));

  function conv(i){
    if (i<10){return("0" + i.toString());
    }else{return(i.toString());}
  }
}
function get_now(){
  var now = new Date();
  var h = now.getHours()*1;
  var m = now.getMinutes()*1;
  var s = now.getSeconds()*1;
  return(conv(h) +":" + conv(m) + ":" + conv(s));

  function conv(i){
    if (i<10){return("0" + i.toString());
    }else{return(i.toString());}
  }
}

function make_doPost(url, _act, _data, disp){
  return function(){
    casper.thenOpen(url, {
        method: "post",
        data: {
          "act": _act,
          "data": JSON.stringify(_data)
        }
      }
    ).then(function(){
      if (disp){
      casper.echo(casper.fetchText("body"));
      }
    });
  }
}

casper.run();
