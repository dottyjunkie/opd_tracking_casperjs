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
  waitTimeout: 30000,
  //logLevel: 'debug'
});
var $ = require('lib/jQasper.js').create(casper);
var fs = require('fs');

// By Module Variables
var param = {
  url: "https://www6.vghtpe.gov.tw/opd/opd_inter/roomsta2.htm",
  fn_log: "vgh.json",
  post_url: "http://localhost/opdtrack/engine_debug.php",
  hosname: "臺北榮民總醫院",
  module: "vgh",

};
var log = {
  date:"",
  datetime:"",
  records:[],
};

var opd_time = {
  0: '上午',
  1: '下午',
  2: '夜間'
}

var logAll = [];
var debug=true;
// MAIN =====================================================================
casper.on("remote.message", function(message) {
  //this.echo("\tremote console.log: " + message);
});

casper.start().open(param.url).wait(1000).then(function() {
      this.echo("Entering " + param.url);
      var dom_main = $('input[type="radio"]');
      for (var i = 0; i < dom_main.length - 4; i++) {
          var _v = dom_main.eq(i).val();
          //this.echo(_v);
          var _func = dispatch(_v);
          _func();


      }
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

function dispatch(v) {
  return (function() {
    casper.then(function() {
      this.then(function() {

        $('form[name="roomstaForm"]').prop("target", "_self");
        var tgt = $('input[value="' + v + '"]');
        tgt.click();

      }).then(function() {

        var cell = $("table").find("tr");

        for (var j = 2; j < cell.length; j++) {
          var doc_name = cell.eq(j).find("center").eq(1).text().replace(/\s/g, "").replace(/排班醫師/, "").replace(/醫師請假/, "").replace(/代診:/, "");
          if (doc_name.length) {
            var _p_num = cell.eq(j).find("center").eq(2).text().replace(/Z/g, "")*1;
            var dep = $("td").eq(0).text().replace(/\s/g, "");
            if(debug){
              this.echo(dep);
              this.echo('\t'+doc_name);
              this.echo('\t\t'+_p_num);
            }
            if((_p_num>0) && (doc_name != "排班營養師") && (doc_name != "排班藥師")){
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
          }

        }


      }).then(function() {
        this.back();
      });
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
