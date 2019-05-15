// Casper Initialization ====================================================
// OPD Tracking Module
// By balance wu
// Last Modified: 2018/08/08
// One-time Parsing: Yes
// Actual Patient Number: Yes
// Usage: start casperjs --ignore-ssl-errors=true --ssl-protocol=any do_cgh_prog.js [Branch] [OPD_Time]
// First Argument: Branch
// Second Argument: OPD Time

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
var branch = {
  1: '國泰醫院總院',
  2: '國泰醫院新竹分院',
  3: '國泰醫院汐止分院',
  4: '國泰醫院內湖診所'
}

var opd_time = {
  1: '上午',
  2: '下午',
  3: '晚上'
}

// By Module Variables
var param = {
  url: "https://reg.cgh.org.tw/tw/reg/RealTimeTable.jsp",
  fn_log: "cgh.json",
  post_url: "http://localhost/opdtrack/engine_debug.php",
  hosname: branch[casper.cli.args[0]],
  module: "cgh",

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
  this.then(function() {
    var dom_t = $('.Content-text');
    dom_t.eq(0).find("option").eq(casper.cli.args[0]*1).prop("selected", "selected").change();
  }).then(function() {
    //this.echo(branch[casper.cli.args[0]] + ":" + opd_time[casper.cli.args[1]]);
    var dom_t = $('.Content-text');
    dom_t.eq(1).find("option").eq(casper.cli.args[1]*1).prop("selected", "selected").change();
  }).then(function(){
    var dom_t = $('.Content-text');
    for (var j = 1; j < dom_t.eq(2).find("option").length; j++) {
      parse(casper.cli.args[0]*1, casper.cli.args[1]*1,j)();
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
});

function parse(h,i,j) {
  return (function() {
    casper.thenOpen(param.url).then(function() {
      var dom_t_in = $("[class='Content-text']");
      ///
      this.then(function(){
        dom_t_in.eq(0).find("option").eq(h).prop("selected", "selected").change();
      }).then(function(){
        dom_t_in.eq(1).find("option").eq(i).prop("selected", "selected").change();
      }).then(function() {
        dom_t_in.eq(2).find("option").eq(j).prop("selected", "selected").change();
      }).then(function(){
        $("[style='cursor: pointer;']").click();
      }).then(function(){
          //this.capture('lol.png')
          var v_t = $('table[width="90%"]').find('td').eq(0).text().replace(/\s/g,"");
          //this.echo(v_t);
          if((v_t !== '已結束看診') && (v_t !== '停診')){
            var doc_name = $(".Table-title-04").text().split(/\s/)[4].replace('醫師','');
            //var _p_num = $("[width='70'][align='center']").eq(j+3).text().replace(/\s/g,"");
            var dep = $(".Table-title-04").text().split("　")[2].replace(/\s/g,"");
            var _ampm = $(".Table-title-04").text().split("　")[1].replace(/\s/g,"");
            var tbl_td = $('table[bgcolor="#FCFAC3"]').find('td');
            var tdt = [];
            var c_l = $('table[width="90%"]').find('td').eq(0).text().replace(/\s/g,"").split('：')[1].split('尚')[0]*1;
            for(var m=0; m<tbl_td.length; m++){
              if (tbl_td.eq(m).text().replace(/\s/g,"").length>0) {
                tdt.push(tbl_td.eq(m).text().replace(/\s/g,"")*1);
              }
            }
            if(isNaN(c_l)){
              var _p_num = 0;
            }
            else{
              var _p_num = c_l - tdt.indexOf(c_l);
            }
            if((doc_name=="")||(dep=="")||(_p_num==0)||(isNaN(_p_num))){

            }
            else {
              if(debug){
                this.echo('\t' + dep);
                this.echo('\t\t' + doc_name + ":" + _p_num);
              }
              log.records.push({
                mod: param.module,
                hos_id: null,
                hos_name: param.hosname,
                opdtime: opd_time[j],
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
    );
  }
}

casper.run();
