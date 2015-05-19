var koa = require('..');
var app = koa();
app.experimental = true;
app.use(async function middle1(next) {
  console.log('1->')
  console.log('one')
  await next
})
app.use(async function middle2(next) {
  console.log('2->')
  console.log('two')
  await next
})
app.use(async function middle3(next) {
  console.log('3->')
  console.log('three')
})
/*app.use(function *(){
  console.log(this.url)
})*/
app.listen(3000, function() {
  console.log('ok')
})