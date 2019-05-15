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
var branch = {
  0: '台北慈濟醫院',
  2: '斗六慈濟醫院',
  3: '花蓮慈濟醫院',
  4: '台中慈濟醫院',
  5: '玉里慈濟醫院',
  6: '關山慈濟醫院'
}
var opd_time = {
  0: '上午',
  1: '下午',
  2: '夜間'
}
var param = {
  url: "https://app.tzuchi.com.tw/tchw/opdreg/opdstatus/loginstatus.aspx?DShospital=XDWSopd",
  fn_log: "tzuchi.json",
  post_url: "http://localhost/opdtrack/engine_debug.php",
  hosname: branch[casper.cli.args[0]],
  module: "tzuchi",

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
  var opd_r = $('input[name="PNC"]');
  this.then(function(){
    opd_r.eq(casper.cli.args[1]*1).click();
  }).then(function(){
    $("#HOSPITALRadio2").find("input").eq(casper.cli.args[0]*1).click();
  }).then(function() {
      var table_url = $("#DataList1");

      for (var i = 0; i < table_url.find("a").length; i++) {
        var doc_name = table_url.find("a").eq(i).text().replace(/\s/g, "").replace(/預防注射/,"");
        var dep = table_url.find('td[width="100"]').eq(i + 3).text().replace(/\s/g, "");
        var url_to = $("#DataList1").find("a").eq(i).attr("href");
        url_to = "https://app.tzuchi.com.tw/tchw/opdreg/opdstatus/" + url_to;


        var _func = parse(url_to,doc_name,dep);
        _func();
      }
});

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

function parse(url,doc_name,dep) {
  return (function() {
    casper.thenOpen(url).then(function() {
      var cell_dom = $("#mylabel1").find("td");
      var _p_num = cell_dom.eq(3).text().replace(/\D+/g, "");
      var _ampm = opd_time[casper.cli.args[1]*1];
      if(debug){
        this.echo(_ampm);
        this.echo("\t"+dep);
        this.echo("\t\t"+doc_name);
      }
      if ((_p_num=="")||(_p_num=="0")) {

      } else {
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
