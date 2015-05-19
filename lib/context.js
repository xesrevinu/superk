import statuses from 'statuses'
import delegate from 'delegates';
import httpAssert from 'http-assert'
import createError from 'http-errors'

let Context = {
  inspect(){
    return this.toJSON();
  },
  toJSON(){
    return {
      request: this.request.toJSON(),
      response: this.response.toJSON(),
      app: this.app.toJSON(),
      originalUrl: this.originalUrl,
      req: '<original node req>',
      res: '<original node res>',
      socket: '<original node socket>',
    }
  },
  throw(...args){
    throw createError.apply(null,args);
  },
  onerror(err){
    if(null==err){
      return;
    }
    if(!(err instanceof Error)){
      err = new Error('non-error thrown: ' + err);
    }
    this.app.emit('error',err,this);
    if(this.headerSent || !this.writabel){
      err.headerSent = true;
      return;
    }
    this.res._headers = {};
    this.type = 'text';

    if ('ENOENT' == err.code) {
      err.status = 404;
    }

    if ('number' != typeof err.status || !statuses[err.status]) {
      err.status = 500;
    }

    let code = statuses[err.status];
    let msg = err.expose ? err.message : code;
    this.status = err.status;
    this.length = Buffer.byteLength(msg);
    this.res.send(msg);
  }
};

/**
 * method:
 * proto[name] = func
 * Context['acceptsLanguages'] = func
 * func(){
 *   this[target][name].apply(this[target],arguments)
 *   this['request']['acceptsLanguages'].apply(this['request'],arguments)
 * }
 *
 * access:
 * proto.__defineGetter__(name,function(){
 *   return this[target][name]
 * })
 * proto.__defineGetter__('querystring',function(){
 *  return this['request']['querystring']
 * })
 */

//Response aliases
delegate(Context, 'response')
  .method('attachment')
  .method('redirect')
  .method('remove')
  .method('vary')
  .method('set')
  .method('append')
  .access('status')
  .access('message')
  .access('body')
  .access('length')
  .access('type')
  .access('lastModified')
  .access('etag')
  .getter('headerSent')
  .getter('writable');

// Request aliases
delegate(Context, 'request')
  .method('acceptsLanguages')
  .method('acceptsEncodings')
  .method('acceptsCharsets')
  .method('accepts')
  .method('get')
  .method('is')
  .access('querystring')
  .access('idempotent')
  .access('socket')
  .access('search')
  .access('method')
  .access('query')
  .access('path')
  .access('url')
  .getter('href')
  .getter('subdomains')
  .getter('protocol')
  .getter('host')
  .getter('hostname')
  .getter('header')
  .getter('headers')
  .getter('secure')
  .getter('stale')
  .getter('fresh')
  .getter('ips')
  .getter('ip');

export default Context