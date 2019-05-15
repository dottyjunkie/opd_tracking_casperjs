// Casper Initialization ====================================================
// Casper Initialization ====================================================
// OPD Tracking Module
// By balance wu
// Last Modified: 2018/08/08
// One-time Parsing: no
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
var debug=true;

// By Module Variables
var param = {
  url: "http://reg.tph.mohw.gov.tw/WebAppTPHOSP/home/",
  fn_log: "mohw_tpe.json",
  post_url: "http://localhost/opdtrack/engine_debug.php",
  hosname: "衛生福利部臺北醫院",
  module: "mohw_tpe",

};
var opd_time = {
  0: '上午',
  1: '下午',
  2: '夜間'
}

var log = {
  date:"",
  datetime:"",
  records:[],
};

// MAIN =====================================================================
casper.on("remote.message", function(message) {
  //this.echo("\tremote console.log: " + message);
});

casper.start().open(param.url).then(function() {
  this.echo("Entering " + param.url);
  
  for(var i=0 ;i<$("div[role='main']").find('a').length-1;i++){
    var a_f = $("div[role='main']").find('a').eq(i).attr('onclick').split("'")[1].split("'")[0];
    parse(a_f)();
  }

  
  //-------- Test
  //parse_progress(ampm_dom.eq(1), dep_dom.eq(1));
  //-------
}).then(function() {
  etime = now_time();
  //log_now(etime);
  log.date = get_date();
  log.datetime = get_date() + " " + get_now();
  this.echo("\nPosting to Server...");
  make_doPost(param.post_url, "set_records", log, true)();

}).then(function(){
  this.echo("\nFinalizing...");
  make_doPost(param.post_url, "final", {module: param.module}, true)();
});

function parse(_a) {
  return (function() {
    casper.thenOpen(param.url + _a).then(function() {
      var doc_name = $('.form-row-value').eq(3).text().replace(/\s/g,"") ;
      var _p_num = $(".form-row-value").eq(5).text().replace(/\s/g,"")*1 ;
      var dep = $(".form-row-value").eq(1).text().replace(/\s/g,"") ;

      if(debug){
        this.echo(dep);
        this.echo(doc_name);
        this.echo(_p_num);
      }
      if((doc_name=="")||(dep=="")||(_p_num==0)){

      }
      else {
        log.records.push({
          mod: param.module,
          hos_id: null,
          hos_name: param.hosname,
          opdtime: opd_time[casper.cli.args[0]*1],
          hos_grp: null,
          hos_dep: dep,
          name: doc_name,
          note: "",
          num: _p_num
        });
      }

      
    });
  })
}

function now_time() {
  return (
    casper.evaluate(function() {
      return (new Date().toJSON().slice(0, 10));
    })
  );
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

casper.run();
