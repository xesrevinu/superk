import superk from '..';
let app = superk();
describe('app', function () {
  it('start', function (done) {
    /*app.use(async function (next) {
      console.log(123123)
      this.body =123123;
      //await Promise.resolve('asdf');
    });*/
    app.listen(3000,()=>{
      console.log('server listen 3000')
      done()
    })

  })
})