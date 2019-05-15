// Casper Initialization ====================================================
// OPD Tracking Module
// By balance wu
// Last Modified: 2018/08/08
// One-time Parsing: No
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
  url: "http://service.hosp.ncku.edu.tw/tandem/DeptUI.aspx?type=2",
  fn_log: "ncku.json",
  post_url: "http://localhost/opdtrack/engine_debug.php",
  hosname: "國立成功大學醫學院附設醫院",
  module: "ncku",

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
  for (var i = 0; i < $("#tContent").find("a").length; i++) {
    parse(i)();
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

function parse(i) {
  return (function() {
    casper.thenOpen(param.url).then(function() {
      this.then(function(){

        $("#tContent").find("a").eq(i).click();
      }).then(function(){
        for(var j=0;j<$(".table02").find("a").length;j++){



          parse_2(j)();

        }
      });
    });
  })
}
function parse_2(j) {
  return (function() {
    casper.then(function() {

      this.then(function(){
          $(".table02").find("a").eq(j).click();
      }).waitFor(function () {
        return($("#ctl00_ctl00_MainContent_MainContent_upNumbers").text().length>0);
      }).then(function(){

        var dep =$("[style='width: 35%']").text().split("   ")[0];
        var doc_name =$("[style='width: 35%']").text().split("   ")[1];
        var _ampm = $("[style='width: 20%']").text().split("   ")[1];

        var _p_num=$("#ctl00_ctl00_MainContent_MainContent_upNumbers").text().replace(/\s/g,"").replace(/，/g,"").split("已看完診人數：")[1].split("尚未看診人數：")[0];
        if((doc_name=="")||(dep=="")||(_p_num=="")||(_p_num==0)||(doc_name=="醫師")){

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
            num: _p_num
          });
        }
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
