let Response ={
  get socket(){
    return this.ctx.req.socket;
  },
  get header(){
    return this.res._headers || {}
  },
  toJSON(){
    return {
      status:this.status,
      message:this.message,
      header: this.header
    };
  }
}
export default Response;