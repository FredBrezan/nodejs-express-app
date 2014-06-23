
var sleep = require('sleep');
var mytest = require('./mytestproxy.js');

//console.log(mytest.__filename, require.cache['mytest'])

var t = new mytest.MyTest();
console.log('in main: ', mytest.isodate);
console.log('in main: ', t.toString());
sleep.sleep(5)
mytest.reload()
//mytest = require('./mytest.js');
console.log('in main: ', mytest.isodate);
