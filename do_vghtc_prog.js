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
  url: "http://www.vghtc.gov.tw/Doctor/opdscheduleA.jsp",
  fn_log: "vghtc.json",
  post_url: "http://localhost/opdtrack/engine_debug.php",
  hosname: "台中榮民醫院",
  module: "vghtc",

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

      for(var i=0;i<$(".contfont").find("a").length;i++){
        //send out
        parse(i)();
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

function parse(i) {
  return (function() {
    casper.thenOpen(param.url).then(function() {


      this.then(function(){
        $(".contfont").find("a").eq(i).click();
      }).then(function(){
        for(var j=2;j<$("table").eq(1).find("tr").length-1;j++){
          var doc_name = $("table").eq(1).find("tr").eq(j).find("font").eq(2).text().replace(/\s/g,"");
          var _p_num = $("table").eq(1).find("tr").eq(j).find("font").eq(4).text().replace(/\s/g,"");
          var dep = $("[style='filter: glow(color=#3F4A89,strength=3); height:0px; color:white; padding:1px']").text();
          var _ampm = $("table").eq(1).find("tr").eq(2).find("font").eq(0).text();
        if((doc_name=="")||(doc_name=="不指定醫師")||(doc_name=="門診化療室")||(dep=="")||(_p_num=="0")||(_p_num=="NA")||isNaN(_p_num)||(dep == "電腦斷層檢查報到櫃臺")){

        }
        else {
          if(debug){
            this.echo(dep);
            this.echo(doc_name);
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
