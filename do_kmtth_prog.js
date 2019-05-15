// Casper Initialization ====================================================
// OPD Tracking Module
// By balance wu
// Last Modified: 2018/08/08
// One-time Parsing: no
// Actual Patient Number: no (now number)
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
var debug =true;
// By Module Variables
var param = {
  url: "http://www.kmtth.org.tw/pro/opdlights_select.asp",
  fn_log: "kmtth",
  post_url: "http://localhost/opdtrack/engine_debug.php",
  hosname: "高雄市立大同醫院",
  module: "kmtth",

};
var log = {
  date:"",
  datetime:"",
  records:[],
};

var logAll = [];
// MAIN =====================================================================
casper.on("remote.message", function(message) {
  //this.echo("\tremote console.log: " + message);
});

casper.start().open(param.url).then(function() {
  this.echo("Entering " + param.url);
  this.then(function() {

      for(var i=0;i<3;i++){
        //send out

        //ampm
        var _ampm=$("[style='font-size: 16pt']").eq(i*2).text().replace(/診/,"");
        parse(i*2,_ampm)();
      }

  });
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
});;

function parse(i,_ampm) {
  return (function() {
    casper.thenOpen(param.url).then(function() {

      this.then(function(){
        $("[style='font-size: 16pt']").eq(i).click();
      }).then(function(){
        for(var j=0;j<$("[color='#FF0000']").length;j++){
          var doc_name = $("[color='#000080']").find("b").eq(2*j+1).text().replace(/\s/g,"").replace(/醫師/,"").replace(/\s/g,"").replace(/代診/,"");
          var _p_num = $("[color='#FF0000']").eq(j+1).text()*1;
          var dep = $("[color='#000080']").find("b").eq(2*j).text().replace(/診/,"").replace(/特/,"").replace(/１/,"").replace(/２/,"").replace(/2/,"").replace(/3/,"").replace(/一/,"").replace(/二/,"");


        if((doc_name=="")||(dep=="")||(_p_num=="0")){

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
