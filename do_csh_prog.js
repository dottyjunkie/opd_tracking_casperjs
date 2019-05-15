// Casper Initialization ====================================================
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
  url: "http://www.csh.org.tw/register/VRProgressA.aspx",
  fn_log: "csh_b.json",
  post_url: "http://localhost/opdtrack/engine_debug.php",
  hosname: "中山醫學大學附設醫院",
  module: "csh",

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

    for(var i=0;i<$("#ctl00_ContentPlaceHolder1_DataList7").find("a").length;i++){
      parse(i)();
    }

}).then(function() {
  etime = now_time();
  log.date = get_date();
  log.datetime = get_date() + " " + get_now();
  //log_now(etime);
  this.echo("\nPosting to Server...");
  make_doPost(param.post_url, "set_records", log, true)();

});

function parse(i) {
  return (function() {
    casper.thenOpen(param.url).then(function() {


      this.then(function () {
        $("#ctl00_ContentPlaceHolder1_DataList7").find("a").eq(i).click();
      }).waitFor(function(){
        return($("#ctl00_ContentPlaceHolder1_DataList3").length>0);
      }).then(function(){
        var l2 = $("#ctl00_ContentPlaceHolder1_DataList3").find("a").length;


        for(var j=0;j<l2;j++){
          parse_2(i,j)();
        }
      });
    });
  })
}
function parse_2(i,j) {
  return (function() {
    casper.thenOpen(param.url).then(function() {

      this.then(function(){
          $("#ctl00_ContentPlaceHolder1_DataList7").find("a").eq(i).click();

      }).waitFor(function(){
        return($("#ctl00_ContentPlaceHolder1_DataList3").length>0);
      }).then(function(){


          this.echo($("#ctl00_ContentPlaceHolder1_DataList3").find("a").eq(j).text());
          //check id it can be click!!
          if ($("#ctl00_ContentPlaceHolder1_DataList3").find("a").eq(j).attr('href')!=undefined) {
            this.then(function(){
                $("#ctl00_ContentPlaceHolder1_DataList3").find("a").eq(j).click();
            }).waitFor(function(){
              return($("#ctl00_ContentPlaceHolder1_Label11").length>0);
            }).then(function(){

              //scrap data


              var dep = $("#ctl00_ContentPlaceHolder1_lDivCode").text().replace(/\s/g,"");
              var doc_name = $("#ctl00_ContentPlaceHolder1_lDrName").text();
              var _ampm = $("#ctl00_ContentPlaceHolder1_lApn").text();
              var _p_num= $("#ctl00_ContentPlaceHolder1_lVisitedNum").text()*1 ;


              if(debug){
                this.echo(dep);
                this.echo(doc_name);
              }


              if((doc_name=="")||(dep=="")||(_p_num=="")||(_p_num==0)){

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
