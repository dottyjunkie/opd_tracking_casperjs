
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
var branch = {
  1: '奇美醫院',
  2: '柳營奇美醫院',
  3: '佳里奇美醫院',
  4: '台南奇美分院醫院'
}
var param = {
  url: "http://www.chimei.org.tw/left/register/progress/qprogress.asp",
  fn_log: "chemei.json",
  post_url: "http://localhost/opdtrack/engine_debug.php",
  hosname: branch[casper.cli.args[0]],
  module: "chemei",

};


var log = {
  date: "",
  datetime: "",
  records: [],
};

var logAll = [];
var debug =true;
// MAIN =====================================================================
casper.on("remote.message", function(message) {
  //this.echo("\tremote console.log: " + message);
});

casper.start().open(param.url).then(function() {
  this.echo("Entering " + param.url);
  this.then(function() {
    $("option").eq(casper.cli.args[0]*1).prop("selected", "selected").change();
  }).then(function() {
    for (var i = 1; i < $("[size='2']").length; i++) {
        url_now = $("[size='2']").find("a").eq(i).attr("href");
        url_now=url_now.replace(/\./,"");
        url_now="http://www.chimei.org.tw/left/register/progress"+url_now;

        parse(url_now)();
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

function parse(url) {
  return (function() {
    casper.thenOpen(url).then(function() {

      for (var j = 1; j < $("[color='red']").length; j++) {

        var _ampm = $("tr").eq(j).find("td").eq(0).text().replace(/\s/g, "");
        var doc_name = $("[width='20%']").eq(j).text().replace(/\s/g,"").replace(/醫師/, "").replace(/()/, "");
        var _p_num = $("[color='red']").eq(j).text().replace(/\s/g,"").replace(/號/,"") ;
        var dep = $("[width='31%']").eq(j).text().replace(/\s/g,"").replace('二診','').replace('三診','').replace('四診','');
        if(debug){
          this.echo(dep);
          this.echo(doc_name);
        }


        if ((_p_num=="")||(_p_num=="系統維護中")||(_p_num=="0")) {

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
