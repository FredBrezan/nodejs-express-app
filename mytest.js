
function MyTest() {
  console.log('in MyTest');
}

MyTest.prototype.toString = function() {
  return '<class MyTest>';
};

exports.isodate = Date();

exports.MyTest = MyTest;

