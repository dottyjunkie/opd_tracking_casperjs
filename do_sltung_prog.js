// Casper Initialization ====================================================
// OPD Tracking Module
// By Chris Chen
// Last Modified: 2018/08/08
// One-time Parsing: Yes
// Actual Patient Number: Yes
// Note: Tung's Taichung MetroHarbor Hospital Module, with Shalu and Wuqi branch included.
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
  url: "http://rg.sltung.com.tw/division2.htm",
  fn_log: "sltong.json",
  post_url: "http://localhost/opdtrack/engine_debug.php",
  hosname: "童綜合",
  module: "sltong"
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
  if(debug){
    this.echo("Entering " + param.url);
  }
  this.echo("Now Parsing: " + param.hosname);
  this.then(function(){
    var main_dom = $(".main_content");
    var a_dom = main_dom.find('a');
    for(var i=0; i<a_dom.length-1; i++){
      if(a_dom.eq(i).text().replace(/\s/gi,"") != '口腔醫學部'){
        parse(a_dom.eq(i).text(), i)();
      }
    }
  })

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

function parse(grp, i) {
  return (function() {
    casper.thenOpen(param.url).then(function() {
      this.echo(grp);
      var main_dom = $(".main_content");
      this.then(function(){
        main_dom.find('a').eq(i).click();
      }).then(function(){
        //sl branch
        var a_dom = $("#ctl00_ContentPlaceHolder2_gvCtrl").find('tr').find('td:nth-child(5)');
        var s_dom = $("#ctl00_ContentPlaceHolder2_gvCtrl").find('tr').find('td:nth-child(4)');
        var d_dom = $("#ctl00_ContentPlaceHolder2_gvCtrl").find('tr').find('td:nth-child(3)');
        for (var j = 0; j < a_dom.length; j++) {
          if(a_dom.eq(j).text().replace(/\s/gi,"").length>0){
            if(d_dom.eq(j).text().replace(/\s/g,"").length == 0){
              var d = d_dom.eq(j-1).text().replace(/\s/g,"");
              if(d.length == 0){
                var d = d_dom.eq(j-2).text().replace(/\s/g,"");
              }
            }
            else{
               var d = d_dom.eq(j).text().replace(/\s/g,"");
            }
            parse_detail('沙鹿院區' ,a_dom.eq(j).text().replace(/\s/gi,""), grp, d, s_dom.eq(j).text().replace(/\s/g,""), a_dom.eq(j).find('a').prop('href'))();
          }
        }
        //wc branch
        var a_dom = $("#ctl00_ContentPlaceHolder2_gvCtrl0").find('tr').find('td:nth-child(5)');
        var s_dom = $("#ctl00_ContentPlaceHolder2_gvCtrl0").find('tr').find('td:nth-child(4)');
        var d_dom = $("#ctl00_ContentPlaceHolder2_gvCtrl0").find('tr').find('td:nth-child(3)');
        for (var j = 0; j < a_dom.length; j++) {
          if(a_dom.eq(j).text().replace(/\s/gi,"").length>0){
            if(d_dom.eq(j).text().replace(/\s/g,"").length == 0){
              var d = d_dom.eq(j-1).text().replace(/\s/g,"");
              if(d.length == 0){
                var d = d_dom.eq(j-2).text().replace(/\s/g,"");
              }
            }
            else{
               var d = d_dom.eq(j).text().replace(/\s/g,"");
            }
            parse_detail('梧棲院區' ,a_dom.eq(j).text().replace(/\s/gi,""), grp, d, s_dom.eq(j).text().replace(/\s/g,""), a_dom.eq(j).find('a').prop('href'))();
          }
        }
      });
    });
  })
}
function parse_detail(bch, name, grp, dep, _ampm, url) {
  return (function() {
    casper.thenOpen(url).then(function() {
      clear_timeout();
      var doc_name = name.replace(/\s/g,"").replace("(額滿) ","").replace("(約診)","").replace("(代診)","").replace("(請假)","").replace("(額滿)","");
      //this.echo("123");
      //var _ampm = $('#Label2').text().replace(/\s/g,"").split(':')[2].split('診間')[0];
      var t_dom = $('#DataList1').find('span');
      var _p_num = $('#DataList1').find('span[style="display:inline-block;color:#000000;background-color:#E6E6E6;font-size:X-Large;width:50px;"]').length + $('#DataList1').find('span[style="display:inline-block;color:#FFC080;background-color:#E6E6E6;font-size:X-Large;width:50px;"]').length;
      if(_p_num*1>0){
        if(debug){
          this.echo("\t" + dep);
          this.echo("\t\tNow Parsing: " + doc_name + " " + _p_num);
        }
        log.records.push({
          mod: param.module,
          hos_id: null,
          hos_name: param.hosname + bch,
          opdtime: _ampm,
          hos_grp: grp,
          hos_dep: dep,
          name: doc_name,
          note: "",
          num: _p_num*1
        });
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

function log_now(_name) {
  fs.write("data/do_tongh/" + _name + 'tongh.json', JSON.stringify(log.records));
  logAll = {};
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

function clear_timeout(){
  casper.evaluate(function(){
    var ix = setTimeout(function(){},0);
    for (var i=0;i<=ix;i++){
      clearTimeout(i);
    }
  });
}

casper.run();
