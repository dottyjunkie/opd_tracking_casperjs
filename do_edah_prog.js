// Casper Initialization ====================================================
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
  url: "http://www5.edah.org.tw/ProcessMainDept.aspx?Hospital=EDAH",
  fn_log: "edah.json",
  post_url: "http://localhost/opdtrack/engine_debug.php",
  hosname: "義大醫療財團法人義大醫院",
  module: "edah",

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
  $("#ContentPlaceHolder1_lnkAllDept").click();
  this.then(function() {
    var main_dom = $("#ContentPlaceHolder1_labProcess").find("table").eq(1);

    for(var i=1;i < main_dom.find("tr").length;i++){
      var _ampm = $("[color='#bf4094']").text().replace(/\s/g,"").replace(/診/g,"") ;
      var  _p_num = main_dom.find("tr").eq(i).find("td").eq(2).text().replace(/\s/g,"").replace(/請至心臟內科看診,現在看診號:/,"");
      var doc_name = main_dom.find("tr").eq(i).find("td").eq(1).text().replace(/\s/g,"").replace(/限醫師約診/,"").replace(/\(/,"").replace(/\)/,"") ;
      var dep = main_dom.find("tr").eq(i).find("td").eq(0).text().replace(/\s/g,"") ;

      if((doc_name=="")||(dep=="")||(_p_num=="已看完")||(_p_num=="停診")||(_p_num=="無訊號")||(_p_num=="請至胃腸肝膽科看診,現在看診號:已看完	")){

      }
      else {
        if(debug){
          this.echo(dep);
          this.echo(doc_name);
          this.echo(_ampm);
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
