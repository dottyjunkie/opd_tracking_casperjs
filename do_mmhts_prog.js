// Casper Initialization ====================================================
// OPD Tracking Module
// By Chris Chen
// Last Modified: 2018/08/08
// One-time Parsing: No
// Actual Patient Number: No
// Usage: start casperjs --ignore-ssl-errors=true --ssl-protocol=any do_mmhts_prog.js [OPD_Time]
// Note: MacKay Memorial Hospital Module: Tamshui Branch

var casper = require('casper').create({
    verbose: true,
	clientScripts: ['lib/jquery-1.11.1.min.js'],
	pageSettings: {
		webSecurityEnabled: false,
		loadImages:  false,
		loadPlugins: false
	},
	waitTimeout: 300000
	//logLevel: 'debug'
});

// By Module Variables
var param = {
  url: "https://tsreg.mmh.org.tw/OpdProgress.aspx",
  fn_log: "mmh_ts.json",
  post_url: "http://localhost/opdtrack/engine_debug.php",
  hosname: "馬偕醫院淡水院區",
  module: "mmh_ts"
};

var opd_time = {
  0: '上午',
  1: '下午',
  2: '晚上'
}

var $ = require('lib/jQasper.js').create(casper);
var fs = require('fs');
var log = {
  date:"",
  datetime:"",
  records:[],
};
var debug=true;
// MAIN =====================================================================
casper.on("remote.message", function(message) {
  //this.echo("\tremote console.log: " + message);
});

casper.start().open(param.url).then(function(){
	stime = now_time();
	if(debug){
	   this.echo("Entering " + param.url);
	}
	var ampm_dom = $('#cboAp').find('option');
	var dep_dom = $('#cboDept').find('option');

	//for(var i=0; i<ampm_dom.length; i++){
	for(var j=0; j<dep_dom.length; j++){
		var _func = parse_progress(casper.cli.args[0]*1, j);
		_func();
	}
	//}



	//-------- Test
	//parse_progress(ampm_dom.eq(1), dep_dom.eq(1));
	//-------
}).then(function(){
	this.echo("Writing File...")
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

function parse_progress(i, j){
	return(function(){
		casper.then(function(){
			var dep_txt = $('#cboDept option:selected').text();
			var ampm_dom = $('#cboAp').find('option');
			var dep_dom = $('#cboDept').find('option');
				ampm_dom.eq(i).prop('selected', true);
				dep_dom.eq(j).prop('selected', true);

			this.then(function(){
				$('#btnQuery').click();
			}).then(function(){
				var table_tr = $('#tblOpdInfo').find('tr');

				for(var k=1; k<table_tr.length; k++){
					var table_td = table_tr.eq(k).find('td');
					var _time = now_time();
					var _ampm = table_td.eq(0).text().replace(/\s/g, "");
					var _dep = $('#cboDept option:selected').text().split('-')[0];
					var _name = table_td.eq(3).text().replace(/\s/g, "");
						_name = _name.substr(4);
						_name = _name.split("(")[0].replace(/健兒門診/,"").replace(/化療門診/,"").replace(/銀髮整合/,"");
					var _c_num = table_td.eq(4).text().replace(/\s/g, "").split('號')[0]*1 + table_td.eq(5).text().replace(/\s/g, "")*1;
					if(isNaN(_c_num)){ _c_num = "NA";}
					if(_name.length == 0){
						_name = "Unknown";
					}
          if((_name=="Unknown") ||(_c_num=="") || (_c_num==0) || (_c_num=="NA")|| (_dep=="健兒門診")|| (_dep=="銀髮整合") ){

                }
		          	else {
		            	log.records.push({
		  			        mod: param.module,
		  			        hos_id: null,
		  			        hos_name: param.hosname,
		  			        opdtime: _ampm,
		  			        hos_grp: null,
		  			        hos_dep: _dep,
		  			        name: _name,
		  			        note: "",
		  			        num: _c_num*1
		  			    });
					    if(debug){
							this.echo(_name + ":" + _dep + "    " + _c_num);
						}
		          	}
				}

			});
		});
	});
}

function log_now(_name){
	fs.write("data/" + param.module + "/" + _name + param.fn_log, JSON.stringify(log.records));
}
function now_time(){
	return(
	casper.evaluate(function(){
		return(new Date().toJSON().slice(0,10));
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

function rounding(v, p){
	var m = Math.pow(10,p);
	return (Math.round(v*m)/m);
}
function fetch_keys(obj){
	var arr = [];
	for (var k in obj){
		arr.push(k);
	}
	return(arr);
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
