<template>
  <div v-if="WASMReady">
    <input type="button" v-on:click="CustomFunc()" value="Press"/>
  </div>
</template>

<script>
export default {
  name: 'WASM',
  mounted () {
    this.$options.wasm.then(e => {
      /* global ExportFunction */
      ExportFunction.apply(this)
      this.WASMReady = true
    })
  },
  data () {
    return {
      WASMReady: false
    }
  }
}
</script>

<wasm lang="go">
package main

import "syscall/js"

func ExportFunction(this js.Value, args []js.Value) interface{} {
    cb:=js.FuncOf(CustomFunc) // Your go func here
    this.Set("CustomFunc",cb) // Your js compoments function name here
    return nil
}

func CustomFunc(this js.Value, args []js.Value) interface{} {
    println("CustomFunc called")
    return nil
}

func main() {
    c := make(chan struct{}, 0)
    cb := js.FuncOf(ExportFunction)
    js.Global().Set("ExportFunction", cb)
    println("Web Assembly loadded!")
    <-c
    cb.Release()
}
</wasm>