// Casper Initialization ====================================================
// OPD Tracking Module
// By balance wu
// Last Modified: 2018/08/08
// One-time Parsing: Yes
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
  url: "https://www.scmh.org.tw/RegProgress.aspx?Kind=2",
  fn_log: "ccgh.json",
  post_url: "http://localhost/opdtrack/engine_debug.php",
  hosname: "秀傳醫療社團法人秀傳紀念醫院",
  module: "ccgh",

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
  this.then(function() {
    var tbl_dom_a =   $(".DeptTable").find('tr').find('td').find('ul').find('li');
    var tbl_dom_url = $(".DeptTable").find('tr').find('td').find('ul').find('li');

    var grp_tbls = $(".DeptTable");
    var grp_tbls_title = $(".DeptTitle");

    for (var k = 0; k < grp_tbls_title.length; k++) {
      grp = grp_tbls_title.eq(k).text();
      for (var i = 0; i < grp_tbls.length; i++) {
        var tbl = grp_tbls.eq(i);
        var as = tbl.find("a");
        for (var j = 0; j < as.length; j++) {
          var ker_bai = as.eq(j).text().replace(/\s/gi, "");
          var ker_bai_url = as.eq(j).attr("href");
          parse(ker_bai_url, ker_bai,grp ,grp)();
        }
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
  //log_now(etime);
  this.echo("\nPosting to Server...");
  make_doPost(param.post_url, "set_records", log, true)();

}).then(function(){
  this.echo("\nFinalizing...");
  make_doPost(param.post_url, "final", {module: param.module}, true)();
});

function parse(url, dep,grp) {
  return (function() {
    casper.thenOpen("https://www.scmh.org.tw/" + url).then(function() {
      var tbl_dom = $(".RegDataTable");
      for (var i = 0; i < tbl_dom.length; i++) {
        var tbl_tr = tbl_dom.eq(i).find('tr');
        var doc_name = tbl_tr.eq(1).find('td').eq(4).text().replace(/\s/g, "");
        var _ampm = tbl_tr.eq(1).find('td').eq(1).text().replace(/\s/g, "");
        var _p_num = tbl_tr.eq(1).find('td').eq(7).text().replace(/\s/g, "")*1;
        if((!_p_num) || (doc_name.indexOf('醫師')>0)){

        }
        else{
          if(debug){
            this.echo(dep);
            this.echo('\t' + doc_name);
            this.echo('\t\t' +_p_num);
          }
          log.records.push({
            mod: param.module,
            hos_id: null,
            hos_name: param.hosname,
            opdtime: _ampm,
            hos_grp: grp,
            hos_dep: dep,
            name: doc_name,
            note: "",
            num:_p_num
          });
        }

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

function log_now(_name) {
  fs.write("data/do_tmh/" + _name + 'tmh.json', JSON.stringify(log.records));
  logAll = {};
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
