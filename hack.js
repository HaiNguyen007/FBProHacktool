const vm=require("vm");
const ws=require("ws");
const fs=require("fs");
const util=require("util");
const path=require("path");
const EventEmitter = require("events");

class FakeWS extends EventEmitter {
  /**
   * Create a new `WebSocket`.
   *
   * @param {(String|url.Url|url.URL)} address The URL to which to connect
   * @param {(String|String[])} protocols The subprotocols
   * @param {Object} options Connection options
   */
  constructor(address, protocols, options) {
    super();
    console.log("[FBPro Hacktool/UnNetworkedWS] Address: %s",address);
    let that=this;
    setTimeout(()=>{
	that.emit("open");
	console.log("[FBPro Hacktool/UnNetworkedWS] Emitted \"open\"");
    },500);
  }

  get CONNECTING() {
    return false;
  }
  get CLOSING() {
    return false;
  }
  get CLOSED() {
    return false;
  }
  get OPEN() {
    return true;
  }

  get binaryType() {
    return "nodebuffer";
  }
  set binaryType(type) {}
  get bufferedAmount() {
    return 0;
  }

  get extensions() {
    return "";
  }
  setSocket(socket, head, maxPayload) {}

  emitClose() {
    this.emit("close",0,"Connection closed");
    return;
  }
  close(code, data) {
    return;
  }

  /**
   * Send a ping.
   *
   * @param {*} data The data to send
   * @param {Boolean} mask Indicates whether or not to mask `data`
   * @param {Function} cb Callback which is executed when the ping is sent
   * @public
   */
  ping(data, mask, cb) {
    this.emit("pong","");
  }

  pong(data, mask, cb) {}

  send(data, options, cb) {
    console.log("[FBPro Hacktool/UnNetworkedWS] send(): "+data);
    let parsed=JSON.parse(data);
    console.log("[FBPro Hacktool/UnNetworkedWS] header: "+parsed.header);
    switch(parsed.header){
	case "checkMD5":
		console.log("[FBPro Hacktool/UnNetworkedWS] Emit message: %s","{\"warrant\":true}");
		this.emit("message","{\"warrant\":true}");
		break;
	case "checkUser":
		let jso={login:true,userName:parsed.user};
		console.log("[FBPro Hacktool/UnNetworkedWS] Emit message: %s",JSON.stringify(jso));
		this.emit("message",JSON.stringify(jso));
		break;
	default:
		console.log("[FBPro Hacktool/UnNetworkedWS] Unknown header,ignoring,");
		break;
    }
  }

  terminate() {
    
  }
}

process.on("uncaughtException",(err)=>{
	console.error("\n[FBPro Hacktool|Fatal] uncaughtException trapped");
	console.error(err);
	process.exit(1);
});

function sandboxget(){
return {require:function(req){
console.log("[FBPro Hacktool|Trace] Require module:%s",req);
if(req.charAt(0)==".")return vmrequire(req);
if(req=="ws"){
let rws=FakeWS;
rws.Server=ws.Server;
return rws;
}
return require(req);
},
console:console,
fs:fs,
os:require("os"),
process:process,
module:{},
setTimeout:setTimeout,
setInterval:setInterval
};
}
function vmrequire(req){
	if(req.charAt(req.length-3)!=".")req+=".js";
	let newbox=sandboxget();
	let tried=[];
	let fc=null;
	try{fc=fs.readFileSync(req);}catch(t){try{fc=fs.readFileSync(path.join("./core/",req));}catch(t){}}
	for(let i of module.children){
		if(fc!=null)break;
		if(tried.indexOf(i.path)!=-1)continue;
		tried+=i.path;
		try{fc=fs.readFileSync(path.join(i.path,req));}catch(t){}
	}
	vm.runInNewContext(fc,newbox);
	return newbox.module.exports;
}
const newbox=sandboxget();
vm.runInNewContext(fs.readFileSync("Main.js"),newbox);