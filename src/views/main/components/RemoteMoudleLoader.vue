<template>
  <Teleport to="body">
    <jsComponent
      crossorigin
      v-for="(item, i) in scriptUrls"
      :key="i"
      :src="item"
      @callback="addcompleteCount"
    ></jsComponent>
    <cssComponent
      v-for="(item, i) in cssUrls"
      :key="i"
      :href="item"
      @callback="addcompleteCount"
    ></cssComponent>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, defineComponent, h, defineEmits, defineExpose } from 'vue'
import axios from '@/untils/axios'

const scriptUrls = ref<string[]>([]) // js地址集合
const cssUrls = ref<string[]>([]) // css地址集合

const emit = defineEmits(['callback'])

async function loadMoudles(urls: string[]) {
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    if (checkIsMoudle(url)) {
      axios.get(url).then(html => {
        parsingHtml(url, html)
      })
    }
  }
}

// 检查是否可以远程加载
function checkIsMoudle(url: string) {
  const regx =
    /^(http|https):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/gi
  return regx.test(url)
}

function parsingHtml(url: string, html: string | any) {
  // 解析内容页中的css/js引用，并插入父页面文档底部
  const jsRegex = /<script\s+(?:[^>]*?\s+)?src=["']([^"']+)["']/gi
  const cssRegex =
    /<link\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*?\s+rel=["']stylesheet["']/gi
  let match

  while ((match = jsRegex.exec(html)) !== null) {
    if (!scriptUrls.value.includes(match[1]))
      scriptUrls.value.push(url + match[1])
  }

  while ((match = cssRegex.exec(html)) !== null) {
    if (!cssUrls.value.includes(match[1])) cssUrls.value.push(url + match[1])
  }
}

function addcompleteCount() {
  return false
}

const jsComponent = defineComponent({
  name: 'jsComponent',
  props: {
    src: {
      type: String,
      required: true
    }
  },
  setup(props: any) {
    return () =>
      h('script', {
        type: 'module',
        src: props.src,
        on: {
          load: () => {
            emit('callback')
          }
        }
      })
  }
})

const cssComponent = defineComponent({
  name: 'cssComponent',
  props: {
    href: {
      type: String,
      required: true
    }
  },
  setup(props) {
    return () =>
      h('link', {
        type: 'text/css',
        rel: 'stylesheet',
        href: props.href,
        on: {
          load: () => {
            emit('callback')
          }
        }
      })
  }
})

defineExpose({ loadMoudles })
</script>
