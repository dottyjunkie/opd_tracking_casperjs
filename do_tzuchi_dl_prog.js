// Casper Initialization ====================================================
// OPD Tracking Module
// By balance wu
// Last Modified: 2018/08/08
// One-time Parsing: NO
// Actual Patient Number: Yes
// Usage: start casperjs --ignore-ssl-errors=true --ssl-protocol=any do_tzuchi_tpe_prog.js [OPD_Time]
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

var opd_time = {
  0: '上午',
  1: '下午',
  2: '夜間'
}
var param = {
  url: "https://app.tzuchi.com.tw/tchw/opdreg/OpdProgress.aspx?Loc=DL",
  fn_log: "tzuchi_dl.json",
  post_url: "http://localhost/opdtrack/engine_debug.php",
  hosname: "慈濟大林醫院",
  module: "tzuchi_dl",

};



var log = {
  date: "",
  datetime: "",
  records: [],
};

var logAll = [];
var debug=true;
// MAIN =====================================================================
casper.on("remote.message", function(message) {
  //this.echo("\tremote console.log: " + message);
});

casper.start().open(param.url).then(function() {
  this.echo("Entering " + param.url);
  var opd_time_input = $("#ctl00_ContentPlaceHolder1_rblPNC").find("input");
  for(var i=0; i<opd_time_input.length; i++){
    this.then(function() {
      $("#ctl00_ContentPlaceHolder1_rblPNC").find("input").eq(i).click();
    }).then(function() {
        var table = $("#ctl00_ContentPlaceHolder1_gvOpdProgress").find("tr");
        for (var i = 1; i < table.length; i++) {

          var _ampm = $("#ctl00_ContentPlaceHolder1_rblPNC").find("label").eq(i).text();
          var dep = $("#ctl00_ContentPlaceHolder1_gvOpdProgress").find("tr").eq(i).find("td").eq(0).text().replace(/\s/g,"");
          var doc_name =$("#ctl00_ContentPlaceHolder1_gvOpdProgress").find("tr").eq(i).find("td").eq(2).text().replace(/\s/g,"");
          var _p_num = $("#ctl00_ContentPlaceHolder1_gvOpdProgress").find("tr").eq(i).find("td").eq(3).text().replace(/\s/g,"")*1;

          if ((_p_num=="")||(_p_num=="0")) {

          } else {
            if(debug){
              this.echo(_ampm);
              this.echo("\t"+dep);
              this.echo("\t\t"+doc_name);
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
              num: _p_num
            });
          }
        }
    });
  }

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

function make_doPost(url, _act, _data, disp) {
  return function() {
    casper.thenOpen(url, {
      method: "post",
      data: {
        "act": _act,
        "data": JSON.stringify(_data)
      }
    }).then(function() {
      if (disp) {
        casper.echo(casper.fetchText("body"));
      }
    });
  }
}

casper.run();
