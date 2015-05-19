let Request = {
  get socket(){
    return this.ctx.req.socket;
  },
  get header(){
    return this.res._headers || {};
  },
  get headers(){
    return this.header;
  },
  get status(){
    return this.res.statusCode;
  },
  get url(){
    return this.req.url;
  },
  toJSON(){
    return {
      method:this.method,
      url:this.url,
      header: this.header
    };
  }
}

export default Request;