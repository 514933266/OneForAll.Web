<template>
  <el-container class="message-center-page">
    <el-main>
      <el-tabs v-model="activeName" @tab-change="tabChange" type="card">
        <el-tab-pane
          v-for="tab in tabs"
          :key="tab.value"
          :name="tab.value"
          :label="tab.label"
        >
          <template #label>
            {{ tab.label }}&nbsp;<el-tag
              v-if="tab.value === 0 && totalUnRead > 0"
              type="danger"
              >{{ totalUnRead }}</el-tag
            >
          </template>
          <el-table
            v-loading="loading"
            :data="list"
            @selection-change="selectionChange"
            class="ofa-table"
          >
            <el-table-column width="50">
              <template #default="scope">{{
                scope.$index + 1 + (pageIndex - 1) * pageSize
              }}</template>
            </el-table-column>
            <el-table-column
              type="selection"
              width="55"
              align="center"
              header-align="center"
            ></el-table-column>
            <el-table-column prop="Title" label="标题">
              <template #default="scope">
                <label>{{ scope.row.Title }}</label>
                <el-tag
                  v-if="!scope.row.IsRead"
                  round
                  type="danger"
                  effect="dark"
                  class="ofa-ml10"
                  >未读</el-tag
                >
              </template>
            </el-table-column>
            <el-table-column
              show-overflow-tooltip
              prop="Content"
              label="内容"
            ></el-table-column>
            <el-table-column label="日期" width="200">
              <template #default="scope">{{
                dayjs(scope.row.CreateTime).format('YYYY年MM月DD日 HH:mm')
              }}</template>
            </el-table-column>
            <el-table-column prop="Type" label="类型" width="200">
              <template #default="scope">{{
                getTypeStr(scope.row.Type)
              }}</template>
            </el-table-column>
            <el-table-column
              label="操作"
              width="160"
              align="center"
              header-align="center"
            >
              <template #default="scope">
                <el-button link type="primary" @click="toDetailtPage(scope.row)"
                  >查看详情</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <div class="bottom">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          v-model:current-page="pageIndex"
          :page-sizes="[10, 20, 50, 100]"
          v-model:page-size="pageSize"
          :total="total"
          @size-change="pageSizeChange"
          @current-change="pageIndexChange"
        >
        </el-pagination>
        <div>
          <el-button @click="del" type="danger">删除</el-button>
          <el-button @click="read" type="success">标记已读</el-button>
          <el-button @click="readAll" type="warning">全部已读</el-button>
          <el-button @click="clear" type="danger">全部删除</el-button>
        </div>
      </div>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { dayjs, ElMessage } from 'element-plus'
import API from '@/apis/base-api'
import { ISysMessage } from '@/interfaces/base/ISysMessage'
import { MESSAGE_TYPE } from '@/consts/base-const'
import { useBrowserStore } from '@/stores/browserStore'
import { MESSAGE_CENTER_DETAIL } from '@/routers/main-router'

const browserStore = useBrowserStore()
const searchOption = ref({
  key: '', // 搜索条件（关键字）
  status: -1 // 类型：-1全部 0未读 1已读
})
const tabs = [
  { value: -1, label: '全部消息' },
  { value: 0, label: '未读消息' },
  { value: 1, label: '已读消息' }
] // 标签列表
const loading = ref(false) // 加载中
const activeName = ref(-1)
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const totalUnRead = ref(0) // 未读消息数量
const list = ref<ISysMessage[]>([])
const selectionList = ref<ISysMessage[]>([])

onMounted(() => {
  get()
  getUnReads()
})

// 标签页切换
function tabChange(name: any) {
  searchOption.value.status = parseInt(name)
  init()
}

// 初始化
function init() {
  get()
  getUnReads()
}

// 获取分页列表
function get() {
  loading.value = true
  API.getPageMessage(
    pageIndex.value,
    pageSize.value,
    searchOption.value.status,
    searchOption.value.key
  ).then(res => {
    total.value = res.Total
    list.value = res.Items
    loading.value = false
  })
}

// 获取未读数量
function getUnReads() {
  API.getMessageCount().then(res => {
    totalUnRead.value = res
  })
}

// 改变每页数量
function pageSizeChange(value: number) {
  pageSize.value = value
  nextTick(() => get())
}

// 下一页
function pageIndexChange(value: number) {
  pageIndex.value = value
  nextTick(() => get())
}

// 选择行
function selectionChange(rows: any) {
  selectionList.value = rows
}

// 设置已读
function read() {
  if (!checkHadSelection()) return false
  const ids = selectionList.value.map(s => s.Id)
  API.readMessage(ids, false).then(res => {
    if (res.Status) {
      init()
    }
  })
}

// 全部已读
function readAll() {
  API.readMessage([], false).then(res => {
    if (res.Status) {
      init()
    }
  })
}

// 删除指定消息
function del() {
  if (!checkHadSelection()) return false
  const ids = selectionList.value.map(s => s.Id)
  API.deleteMessage(ids).then(res => {
    if (res.Status) {
      init()
    }
  })
}

// 清空消息
function clear() {
  API.deleteMessage([]).then(res => {
    if (res.Status) {
      init()
    }
  })
}

// 检查是否有选择数据
function checkHadSelection() {
  if (selectionList.value.length < 1) {
    ElMessage.error('请先选择要操作数据')
    return false
  }
  return true
}

// 获取消息类型
function getTypeStr(type: number) {
  const item = MESSAGE_TYPE.find(w => w.value === type)
  return item?.label ?? '未知类型'
}

// 跳转详情
function toDetailtPage(item: ISysMessage) {
  browserStore.navigate(MESSAGE_CENTER_DETAIL, item)
}
</script>

<style type="scss" scoped>
.message-center-page {
  background: #fff;
  border-radius: 20px;

  .header {
    display: flex;
    align-items: center;
  }

  .search-box {
    display: flex;
    width: 300px;
  }
}

.bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.ofa-table {
  .el-link {
    font-size: 12px;
  }

  .is-read-row {
    color: #999;

    .el-link {
      color: #999;
      cursor: pointer;

      &:hover {
        color: #409eff;
      }
    }
  }
}
</style>
