
// OPD Tracking Module
// By Balance Wu
// Last Modified: 2018/08/08
// One-time Parsing: NO only(need 3 times)
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
  url: "http://www.ccgh.com.tw/html/webapprogress.aspx?pagetype=3&otherkind=5&pageno=0",
  fn_log: "ccgh.json",
  post_url: "http://localhost/opdtrack/engine_debug.php",
  hosname: "澄清綜合醫院中港分院",
  module: "ccgh",

};
var log = {
  date:"",
  datetime:"",
  records:[],
};
var debug = true;

var logAll = [];
// MAIN =====================================================================
casper.on("remote.message", function(message) {
  //this.echo("\tremote console.log: " + message);
});

casper.start().open(param.url).then(function() {
  this.echo("Entering " + param.url);
  this.then(function() {
    var main_dom = $(".tableapPResult").find("tr");
    for(var i=2;i<main_dom.length;i++){
      var doc_name = main_dom.eq(i).find("td").eq(2).text().replace(/\s/g,"").replace(/\d+/g,'').replace(/[\@\#\$\%\^\&\*\(\)\{\}\:\"\L\<\>\?\[\]]/g,"").replace(/【上午診】/,"").replace(/【下午診】/,"");
      var dep = main_dom.eq(i).find("td").eq(1).text().replace(/\s/g,"") ;
      var _p_num =main_dom.eq(i).find(".over").text().replace(/\s/g,"").replace(/人/,"")*1;
      var _ampm = $("#ctl00_ContentPlaceHolder_main_kind_time_title").text().replace(/\d+/g,'').replace(/】:/, "").replace(/【/, "").replace(/診:/, "").replace(/[/]/g, "");

      if(debug){
        this.echo("++++");
        this.echo(doc_name);
        this.echo(dep);
        this.echo(_ampm);
        this.echo(_p_num);
        this.echo("++++");
      }

      if((doc_name=="")||(doc_name=="兒科疫苗")||(doc_name=="兒科醫師")||(_ampm=="")||(dep=="")||(_p_num=="")){

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
  //-------- Test
  //parse_progress(ampm_dom.eq(1), dep_dom.eq(1));
  //-------
}).then(function() {
  etime = now_time();
  log.date = get_date();
  log.datetime = get_date() + " " + get_now();
  // log_now(etime);
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
