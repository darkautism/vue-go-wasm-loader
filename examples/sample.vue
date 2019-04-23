<template>
  <div>
  </div>
</template>

<script>
export default {
  name: 'WASM'
}
</script>

<wasm lang="go">
package main

func main() {
    println("Hello World!")
}
</wasm>
