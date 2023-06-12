<template>
<div>
  <js v-for="item in jss" :key="item.id" :src="item" @callback="addcompleteCount"></js>
  <css v-for="item in csss" :key="item.id" :href="item" @callback="addcompleteCount"></css>
</div>
</template>

<script>
export default {
  name: 'OfaRemoteMoudleLoader',
  props: {
    // 菜单id
    id: { Type: String },
    // 需要加载的外部url
    jss: { type: Array },
    csss: { type: Array }
  },
  data () {
    return {
      completeCount: 0 // 加载完成数量
    }
  },
  watch: {
    completeCount (newValue) {
      if (newValue >= (this.jss.length + this.csss.length)) {
        this.$emit('callback', this.id)
      }
    }
  },
  methods: {
    addcompleteCount () {
      this.completeCount++
    }
  },
  mounted () {
    const body = document.querySelector('body')
    body.append(this.$el)
  },
  components: {
    js: {
      props: {
        src: {
          type: String,
          required: true
        }
      },
      render (createElement) {
        const self = this
        return createElement('script', {
          attrs: {
            type: 'text/javascript',
            src: `${this.src}?_tt=${new Date().getTime()}`
          },
          on: {
            load () {
              self.$emit('callback')
            }
          }
        })
      }
    },
    css: {
      props: {
        href: {
          type: String,
          required: true
        }
      },
      render (createElement) {
        const self = this
        return createElement('link', {
          attrs: {
            type: 'text/css',
            rel: 'stylesheet',
            href: `${this.href}?_tt=${new Date().getTime()}`
          },
          on: {
            load () {
              self.$emit('callback')
            }
          }
        })
      }
    }
  }
}
</script>
