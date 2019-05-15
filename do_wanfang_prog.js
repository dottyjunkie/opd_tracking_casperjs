// Casper Initialization ====================================================
// OPD Tracking Module
// By balance wu
// Last Modified: 2018/08/08
// One-time Parsing: no
// Actual Patient Number: no
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
  url: "http://www.wanfang.gov.tw/p3_register_visits.aspx",
  fn_log: "do_wanfang_prog.json",
  post_url: "http://localhost/opdtrack/engine_debug.php",
  hosname: "臺北市立萬芳醫院",
  module: "wanfang",
};
var log = {
  date:"",
  datetime:"",
  records:[],
};

var logAll = [];
var debug=true;
// MAIN =====================================================================
casper.on("remote.message", function(message) {
  //this.echo("\tremote console.log: " + message);
});

casper.start().open(param.url).then(function() {
  this.echo("Entering " + param.url);
  clear_timeout();
  this.then(function() {

    for(var i=0;i<$(".p3_tab_bottom").find(".p3_tab_h2").length;i++){

      var doc_name=$(".p3_tab_bottom").find(".p3_tab_h2").eq(i).find(".p3_tab_text2").eq(3).text();
      var _ampm=$(".p3_tab_bottom").find(".p3_tab_h2").eq(i).find(".p3_tab_text2").eq(0).text().replace("診","");
      var dep=$(".p3_tab_bottom").find(".p3_tab_h2").eq(i).find(".p3_tab_text2").eq(1).text();
      var _p_num=$(".p3_tab_bottom").find(".p3_tab_h2").eq(i).find(".p3_tab_text2").eq(4).text().replace("(過號)","")*1;

      if(debug){
        this.echo(dep);
        this.echo(doc_name);
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
          num: _p_num*1
        });
      }
    }
    for(var j=0;j<$(".p3_tab_bottom").find(".p3_tab_h4").length;j++){
      var doc_name=$(".p3_tab_bottom").find(".p3_tab_h4").eq(j).find(".p3_tab_text2").eq(3).text();
      var _ampm=$(".p3_tab_bottom").find(".p3_tab_h4").eq(j).find(".p3_tab_text2").eq(0).text().replace("診","");
      var dep=$(".p3_tab_bottom").find(".p3_tab_h4").eq(j).find(".p3_tab_text2").eq(1).text();
      var _p_num=$(".p3_tab_bottom").find(".p3_tab_h4").eq(j).find(".p3_tab_text2").eq(4).text().replace("(過號)","")*1;
      if((doc_name=="")||(_ampm=="")||(dep=="")||(_p_num=="")){

      }
      else {
        if(debug){
          this.echo(dep);
          this.echo(doc_name);
          this.echo(_p_num);
        }
        log.records.push({
          mod: param.module,
          hos_id: null,
          hos_name: param.hosname,
          opdtime: _ampm,
          hos_grp: null,
          hos_dep: dep,
          name: doc_name,
          note: "",
          num: _p_num*1
        });
      }
    }
    //this.echo(log.records);
  });
  //-------- Test
  //parse_progress(ampm_dom.eq(1), dep_dom.eq(1));
  //-------
}).then(function() {
  etime = now_time();
  log.date = get_date();
  log.datetime = get_date() + " " + get_now();
  //log_now(etime);
  this.echo("\nPosting to Server...");
  make_doPost(param.post_url, "set_records", log, true)();

}).then(function(){
  this.echo("\nFinalizing...");
  make_doPost(param.post_url, "final", {module: param.module}, true)();
});

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

function clear_timeout(){
  casper.evaluate(function(){
    var ix = setTimeout(function(){},0);
    for (var i=0;i<=ix;i++){
      clearTimeout(i);
    }
  });
}

casper.run();
