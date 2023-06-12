<template>
  <el-cascader :props="props" ref="tree" v-model="treePath" :options="tree" :placeholder="placeholder"
    @change="changeSelectedNode" :size="size">
    <template slot-scope="{ data }">
      <span>{{ data.Name }}</span><label v-if="data.ShortName">（{{data.ShortName}}）</label>
    </template>
  </el-cascader>
</template>

<script>
import API from '../apis/base-api'

export default {
  name: 'AreaCascader',
  props: {
    placeholder: {
      type: String,
      default: '请选择地区'
    },
    value: {
      type: String
    },
    // 是否显示根节点
    showRoot: {
      type: Boolean,
      default: false
    },
    // 详情参考element-ui
    size: {
      type: String,
      default: 'mini'
    },
    // 根节点名称，只在showRoot为true时有效
    rootName: {
      type: String,
      default: '根节点'
    }
  },
  data () {
    return {
      tree: [], // 地区树
      treePath: [''], // 选中的地区路径(代码)
      code: '', // 地区代码
      address: '', // 地区地址
      rootItem: {
        Id: 0,
        value: '',
        label: '根节点'
      },
      props: {
        lazy: true,
        checkStrictly: true,
        lazyLoad: this.getAreaChildren
      }
    }
  },
  watch: {
    value (newValue) {
      if (this.code !== newValue) {
        this.code = newValue
        this.setSelectedNode()
      }
    },
    code (newValue) {
      this.$emit('input', newValue)
    }
  },
  methods: {
    init () {
      this.code = this.value
      this.getProvinces()
      this.getTreeNode()
    },
    getProvinces () {
      this.axios.get(API.AREA.PROVINCE)
        .then(response => {
          this.setProvinces(response)
        })
    },
    setProvinces (data) {
      const list = []
      data.forEach(e => {
        const node = this.convert(e)
        list.push(node)
      })
      if (this.showRoot) {
        this.rootItem.Name = this.rootName
        list.unshift(this.rootItem)
      }
      this.tree = list
    },
    getAreaChildren (node, resolve) {
      if (!node.data) return false
      const nodes = []
      const url = API.AREA.CHILDREN.replace(/{id}/, node.data.Id)
      this.axios.get(url).then(response => {
        response.forEach(e => {
          const node = this.convert(e)
          nodes.push(node)
        })
        resolve(nodes)
      })
    },
    convert (data) {
      let node = {
        ...data,
        value: data.Code,
        label: data.Name,
        id: data.Id
      }
      if (node.Children && node.Children.length > 0) {
        const children = []
        node.Children.forEach(e => {
          const child = this.convert(e)
          children.push(child)
        })
        node = { ...node, children: children }
      }
      return node
    },
    getTreeNode () {
      if (this.code) {
        this.axios.get(API.AREA.TREE.replace(/{code}/, this.code))
          .then(response => {
            this.setTreeNode(response)
          })
      }
    },
    setTreeNode (data) {
      if (data) {
        const node = this.convert(data)
        this.cover(node)
      }
      this.setTreePath()
    },
    cover (data) {
      const index = this.tree.findIndex(w => w.Id === data.Id)
      if (index > -1) {
        this.$set(this.tree, index, data)
      } else {
        this.tree.push(data)
      }
    },
    setTreePath () {
      if (this.code && this.code.length % 2 === 0) {
        const treePath = []
        for (let i = 2; i <= this.code.length; i += 2) {
          const str = this.code.substring(0, i)
          treePath.push(str)
        }
        this.treePath = treePath
      } else {
        this.treePath = ['']
      }
    },
    setSelectedNode () {
      this.getTreeNode().then(response => {
        this.setTreeNode(response)
      })
    },
    changeSelectedNode () {
      const node = this.$refs.tree.getCheckedNodes()
      this.code = node[0].value
      this.$emit('change', node[0])
    }
  },
  created () {
    this.init()
  }
}
</script>
