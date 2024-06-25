<template>
  <el-cascader
    v-model="treePath"
    :props="{
      children: 'Children',
      value: 'Id',
      label: 'Name',
      checkStrictly: true
    }"
    :show-all-levels="false"
    :options="list"
    :placeholder="placeholder"
    ref="teamCascaderRef"
  ></el-cascader>
</template>

<script lang="ts" setup>
import {
  ref,
  onMounted,
  watch,
  defineModel,
  defineProps,
  defineExpose
} from 'vue'
import API from '@/apis/oa-api'
import { GUID } from '@/consts/const'
import { IOATeamTree } from '@/interfaces/oa/IOATeam'

const model = defineModel({ default: '' })
const props = defineProps({
  // 显示根节点
  showRoot: { type: Boolean, default: false },
  // 根节点的值
  rootName: { type: String, default: '根节点' },
  // 显示部门节点类型， 默认全部
  type: { type: String, default: '' },
  // 隐藏节点
  hiddenKey: { type: String, default: '' },
  // 水印
  placeholder: { type: String, default: '请选择部门' }
})
const list = ref<IOATeamTree[]>([]) // 部门列表
const treePath = ref<string[]>([]) // 选中的父级部门路径
const root = ref<IOATeamTree>(
  Object.assign({
    Id: GUID,
    ParentId: '',
    Name: props.rootName
  })
)
const teamCascaderRef = ref()

watch(
  () => treePath.value,
  newValue => {
    model.value = newValue[newValue.length - 1]
  }
)

onMounted(() => {
  get()
})
// 获取部门列表
function get() {
  API.getTeamTrees(GUID, props.type, true, 0).then(res => {
    setTree(res)
    list.value = res
    treePath.value = getTreePath(model.value)
  })
}

// 根据配置设置数据
function setTree(trees: IOATeamTree[]) {
  if (props.showRoot) {
    trees.unshift(root.value)
  }
  if (props.hiddenKey) hiddenNode(trees)
}

// 隐藏节点
function hiddenNode(trees: IOATeamTree[]) {
  const index = trees.findIndex(w => w.Id === props.hiddenKey)
  if (index > -1) {
    trees.splice(index, 1)
  } else {
    trees.forEach(e => {
      if (e.Children) hiddenNode(e.Children)
    })
  }
}

// 获取父级路径
function getTreePath(id: string) {
  if (id === '') return []
  let result = [id]
  const option = findTeam(id, list.value)
  if (option) {
    result = getTreePath(option.ParentId).concat(result)
  }
  return result
}

// 查找指定id部门
function findTeam(id: string, sources: IOATeamTree[]): IOATeamTree | undefined {
  for (let i = 0; i < sources.length; i++) {
    const e = sources[i]
    if (e.Id === id) {
      return e
    } else {
      const option = findTeam(id, e.Children)
      if (option) return option
    }
  }
  return undefined
}

// 获取选中的节点
function getCheckedNodes() {
  return teamCascaderRef.value.getCheckedNodes()
}

defineExpose({
  getCheckedNodes
})
</script>

<style lang="scss" scoped></style>
