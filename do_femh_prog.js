// Casper Initialization ====================================================
// Casper Initialization ====================================================
// OPD Tracking Module
// By balance wu
// Last Modified: 2018/08/08
// One-time Parsing: no
// Actual Patient Number: no
// Usage: start casperjs --ignore-ssl-errors=true --ssl-protocol=any do_femh_prog.js [OPD_Time]
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
  url: "https://www.femh.org.tw/visit/visit.aspx?Action=9&MenuType=0",
  fn_log: "femh.json",
  post_url: "http://localhost/opdtrack/engine_debug.php",
  hosname: "醫療財團法人徐元智先生醫藥基金會亞東紀念醫院",
  module: "femh",

};

var opd_time = {
  0: '上午',
  1: '下午',
  2: '夜間'
}

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
  var btn_1 =$("#ctl00_FunctionContent_ctl00_RadioButtonList0").find("label");
  var btn_2 =$("[bordercolordark='#000000']").eq(1).find("label");
  this.then(function() {
    for(var i=0;i<btn_1.length;i++){
      for(var j=0; j<btn_2.length;j++){
         parse(i,j)();
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

function parse(i,j) {
  return (function() {
    casper.thenOpen(param.url).then(function() {

      var btn_1_a =$("#ctl00_FunctionContent_ctl00_RadioButtonList0").find("label");
      var btn_2_a =$("[bordercolordark='#000000']").eq(1).find("label");
      btn_1_a.eq(i).click();
      btn_2_a.eq(j).click();
      this.then(function(){
        $("#ctl00_FunctionContent_ctl00_Button1").click();
      }).then(function(){
        for(var k=0;k<$("[bgcolor='#ffffdd']").length;k++){
          //get url this page
          url=this.getCurrentUrl();
          parse_2(k,url)();
        }
      });
    });
  })
}
function parse_2(k,url) {
  return (function() {
    casper.thenOpen(url).then(function() {

      this.then(function(){
        $("[bgcolor='#ffffdd']").eq(k).find("u").click();
      }).then(function(){
        //scrap data

        var dep =$("#ctl00_FunctionContent_ctl00_Label4").text().replace(/\s/g,"") ;
        var doc_name =$("#ctl00_FunctionContent_ctl00_Label5").text().replace(/\s/g,"");
        var _ampm =$("#ctl00_FunctionContent_ctl00_Label6").text().replace(/\s/g,"");
        var _p_num=$("#ctl00_FunctionContent_ctl00_Label2").text().replace(/\s/g,"").replace(/已看診人數：/,"") ;

        if(debug){
          this.echo(dep);
          this.echo(doc_name);
        }
        if((doc_name=="")||(dep=="")||(_p_num=="")||(_p_num=="")){

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
