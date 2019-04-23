const fs = require('fs');
const loaderUtils = require('loader-utils');
const child_process = require('child_process');
const hashDigest = require('loader-utils/lib/getHashDigest');

module.exports = function (content, map) {
  const options = loaderUtils.getOptions(this) || {};
  if (options.lang !== 'go') {
    return content
  }
  // go wasm load scripts
  let goroot = child_process.execSync('go env GOROOT').toString().trim()
  if (!fs.existsSync(`${goroot}/misc/wasm/wasm_exec.js`) ){
    throw new Error(`File ${goroot}/misc/wasm/wasm_exec.js cannot found, please check go is installed and GOPATH & GOROOT is set`)
  }

  // real content compile
  let name = hashDigest(content)
  let fd = fs.openSync(`/tmp/${name}.go`,'w+')
  fs.writeSync(fd, content)
  fs.closeSync(fd)
  child_process.execSync(`GOARCH=wasm GOOS=js go build -o /tmp/${name}.wasm /tmp/${name}.go`)
  const wasm = fs.readFileSync(`/tmp/${name}.wasm`);
  const wasm_url = loaderUtils.interpolateName(this, 'wasm/[hash].wasm', {
    content: wasm
  })
  if (options.emitFile === undefined || options.emitFile) {
    this.emitFile(wasm_url, wasm)
  }

  // Clean files
  fs.unlinkSync(`/tmp/${name}.wasm`)
  fs.unlinkSync(`/tmp/${name}.go`)  

  this.callback(
    null,
    `export default function (Component) {
      if (typeof Go === 'undefined'){require('${goroot}/misc/wasm/wasm_exec.js')}
      const go = new Go();
      Component.options.go = go;
      Component.options.wasm = new Promise(function(resolve, reject) {
        WebAssembly.instantiateStreaming(fetch('${wasm_url}'), go.importObject).then(
          result => {
            go.run(result.instance)
            resolve(result)
          }
        )
      });
    }`,
    map
  )
}