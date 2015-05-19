import co from 'co';
import _ from 'lodash';
import http from 'http';
import debug from 'debug';
import assert from 'assert';
import Stream from 'stream';
import Cookies from 'cookies';
import accepts from 'accepts';
import statuses from 'statuses';
import compose from 'koa-compose';
import onFinished from 'on-finished';
import compose_es7 from 'composition';
import context from './context';
import request from './request';
import response from './response';
import {
  EventEmitter
}
from 'events';

debug('superk:applicatioin')

export default () => {
  if (!(this instanceof Application)) {
    return new Application;
  }
}

//对es6语法不是很熟悉的请学习一趟再来,虽然我也不懂,哈哈
//这里继承自event
class Application extends EventEmitter {
  constructor() {
    super()
    //这些基础的就不需要说了吧
    this.env = process.env.NODE_ENV || 'development';
    this.subdomainOffset = 2;
    //中间件数组
    this.middleware = [];
    // 上下文 object
    this.context = Object.create(context);
    // request对象
    this.request = Object.create(request);
    // response对象
    this.response = Object.create(response);
  }
  toJSON() {
    /**
     * 只返回subdomainOffset,env两项
     */
    return _.pick(this, [
      'subdomainOffset',
      'env'
    ])
  }
  inspect() {
    return this.toJSON()
  }
  listen(...args) {
    debug('listen');
    let server = http.createServer(this.callback());
    /**
     * 返还一个httpServer对象
     */
    return server.listen.apply(server, args)
  }
  use(fn) {
    // 如果没启用es7 async函数特性就对函数进行Generator检查
    if (!this.experimental) {
      assert(fn && 'GeneratorFunction' == fn.constructor.name, 'app.use() requires a generator function');
    }
    debug('use %s', fn._name || fn.name || '-');
    // push到中间件数组
    this.middleware.push(fn);
    // 链式调用
    return this;
  }
  callback() {
    // 将respond中间件放到middleware里的第一位,为啥呢,下面接着说
    let mw = [respond].concat(this.middleware);
    /**
     * 判断是否启动es7 async函数这块不是很明白?看不懂..
     * compose是将所有中间件全部执行了?
    */
    let fn = this.experimental ? compose_es7(mw) : co.wrap(compose(mw));
    if (!this.listeners('error').length) {
      this.on('error', this.onerror);
    }
    return (req, res) => {
      // 默认404
      res.statusCode = 404;
      // 最重要的创建执行上下文,将req,res对象传进去
      /* return一个context对象
        { request: { method: undefined, url: '/', header: {} },
          response: { status: undefined, message: undefined, header: {} },
          app: { subdomainOffset: 2, env: 'development' },
          originalUrl: '/',
          req: '<original node req>',
          res: '<original node res>',
          socket: '<original node socket>'
        }
      */
      let ctx = this.createContext(req, res);

      // 这里不懂 `Execute a callback when a request closes, finishes, or errors.` 介绍是这样介绍的,反正我不懂
      onFinished(res, ctx.onerror);
      /*
       *看了看实现这里的fn是个function(next){}
       *以middleware个数来循环,倒着执行,因为是i--,先app.use的先执行
       *这里我不懂 哈哈 我慢慢理解试试看 咱们以composition为例,具体代码看node_modules/composition/index.js实现
       *应该是将中间件数组里的每个函数执行,call改变this,这就是你中间件里能访问到this.redirect,this.url的原因,
       *fn的this就是ctx这里记一下
       *每个中间件的参数next
      */
      fn.call(ctx).catch(ctx.onerror);
    }
  }
  createContext(req, res) {
    let context = Object.create(this.context);
    let request = context.request = Object.create(this.request);
    let response = context.response = Object.create(this.response);
    context.app = request.app = response.app = this;
    context.req = request.req = response.req = req;
    context.res = request.res = response.res = res;
    request.ctx = response.ctx = context;
    request.response = response;
    response.request = request;
    context.onerror = context.onerror.bind(context);
    context.originalUrl = request.originalUrl = req.url;
    context.cookies = new Cookies(req, res, this.keys);
    context.accept = request.accept = accepts(req);
    context.state = {};
    return context;
  }
  onerror(err) {
    assert(err instanceof Error, 'non-error thrown: ' + err);
    if (404 === error.status) return;
    if ('test' === this.env) return;
    let msg = err.stack || err.toString();
    msg.replace(/^/gm, '  ');
    console.error(`\n ${msg} \n`);
  }
}

async function respond(next) {
  await next;

  if (this.respond === false) {
    return
  }
  let res = this;
  if (res.headersSent || !this.writable) {
    return;
  }
  let body = this.body;
  let code = this.status;

  if (statuses.empty[code]) {
    this.body = null;
    return res.end();
  }
  if ('HEAD' == this.method) {
    if (isJSON(body)) this.length = Buffer.byteLength(JSON.stringify(body));
    return res.end();
  }
  if (null == body) {
    this.type = 'text';
    body = this.message || String(code);
    this.length = Buffer.byteLength(body);
    return res.end(body);
  }
  if (Buffer.isBuffer(body)) return res.end(body);
  if ('string' == typeof body) return res.end(body);
  if (body instanceof Stream) return body.pipe(res);

  body = JSON.stringify(body);
  this.length = Buffer.byteLength(body);
  res.end(body);
}