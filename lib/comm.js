// Communication Utilities
var require = patchRequire(require);

function make_doPost(url, _act,_data, disp){
	return function(){
		casper.thenOpen(url, {
				method: 'post',
				data: {
					"act": _act,
					"data": JSON.stringify(_data)
				}
			}
		).then(function(){
			if (disp){
			casper.echo(this.fetchText('body'));
			}
		});
	}
}
exports.make_doPost = make_doPost;
