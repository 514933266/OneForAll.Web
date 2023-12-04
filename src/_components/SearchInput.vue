<template>
  <el-input v-model="text" :class="['search-input', enterable ? 'cursor' : '']" :placeholder="placeholder" :size="size" @change="change" @keyup.enter.native="enter">
    <font-awesome-icon slot="suffix" fas icon="search" class="search-icon" @click="enter"></font-awesome-icon>
  </el-input>
</template>

<script>
export default {
  name: 'OfaSearchInput',
  props: {
    value: { type: String, default: '' },
    // 水印
    placeholder: { type: String, default: '此处输入文本搜索' },
    // 尺寸，同element-ui
    size: { type: String, default: 'small' },
    // 是否可点击/回车查询
    enterable: { type: Boolean, default: false }
  },
  data () {
    return {
      // 文本值
      text: ''
    }
  },
  watch: {
    value (newValue) {
      this.text = newValue
    },
    text (newValue) {
      this.$emit('input', newValue)
    }
  },
  methods: {
    init () {
      this.text = this.value
    },
    change (newValue) {
      this.$emit('change', newValue)
    },
    enter (newValue) {
      if (!this.enterable) return
      this.$emit('click', newValue)
    }
  },
  created () {
    this.init()
  }
}
</script>

<style lang="scss" scoped>
.search-input {
  /deep/ .el-input__inner {
    border-radius: 20px;

    &:hover {
      border-color: #409eff;
    }
  }

  /deep/ .el-input__suffix {
    display: flex;
    align-items: center;
    right: 10px;
  }
  /deep/ .el-input__prefix {
    left: 10px;
  }
}

.search-input.cursor {
  .search-icon {
    cursor: pointer;

    &:hover {
      color: #409eff;
      transition: all 0.3s ease;
    }
  }
}
</style>
