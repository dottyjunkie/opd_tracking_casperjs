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
  url: "https://www.tmuh.org.tw/service/allprocess",
  fn_log: "tumh.json",
  post_url: "http://localhost/opdtrack/engine_debug.php",
  hosname: "臺北醫學大學附設醫院",
  module: "tumh",

};
var log = {
  date:"",
  datetime:"",
  records:[],
};

var logAll = [];
var debug =true;
// MAIN =====================================================================
casper.on("remote.message", function(message) {
  //this.echo("\tremote console.log: " + message);
});

casper.start().open(param.url).then(function() {
  this.echo("Entering " + param.url);
  var url_dom = $("[role='tabpanel']").find("a");
  for(var i=0;i<url_dom.length;i++){
    var url = url_dom.eq(i).attr("href");
    url ="https://www.tmuh.org.tw"+ url;
    dep = url_dom.eq(i).text().replace(/\s/g,"");

    parse(url,dep)();
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

function parse(url,dep) {
  return (function() {
    casper.thenOpen(url).then(function() {

          for(var j1=0;j1<$("#allprocess_上午").find("a").length;j1++){
            var doc_name =$("#allprocess_上午").find("a").eq(j1).text().replace(/\s/g,"");
            var _p_num =$("#allprocess_上午").find("tr").find("h4").eq(j1*3+1).text();
            var _ampm ="上午";
            if(debug){
              this.echo(dep);
              this.echo(doc_name);
            }
            if((doc_name=="")||(dep=="")||(_p_num=="尚未開診")){

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
          for(var j2=0;j2<$("#allprocess_下午").find("a").length;j2++){
             doc_name =$("#allprocess_下午").find("a").eq(j2).text().replace(/\s/g,"");
             _p_num =$("#allprocess_下午").find("tr").find("h4").eq(j2*3+1).text();
             _ampm ="下午";
             if((doc_name=="")||(dep=="")||(_p_num=="尚未開診")){

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
          for(var j3=0;j3<$("#allprocess_夜間").find("a").length;j3++){
             doc_name =$("#allprocess_夜間").find("a").eq(j3).text().replace(/\s/g,"");
             _p_num =$("#allprocess_夜間").find("tr").find("h4").eq(j3*3+1).text();
             _ampm ="夜間";
             if((doc_name=="")||(dep=="") ||(_p_num=="尚未開診")){

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
