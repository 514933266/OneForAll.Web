<template>
  <el-container class="wxgzh-reply-page">
    <el-header class="header">
      <span class="search-box">
        <el-select v-model="searchOption.appId" placeholder="微信AppId" style="width: 260px">
          <el-option v-for="item in clients" :key="item.Id" :label="item.ClientName" :value="item.AppId"></el-option>
        </el-select>
        <el-button @click="search" type="primary" class="ofa-ml10"><font-awesome-icon fas
            icon="search"></font-awesome-icon>&nbsp;查询</el-button>
      </span>
      <span>
        <el-button v-if="permission.Add" @click="showDrawer()" type="primary">
          <font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增回复设置
        </el-button>
      </span>
    </el-header>
    <el-main class="content">
      <div class="title-box">
        <span class="title">
          微信公众号回复设置
          <span class="title-total">
            共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
          </span>
        </span>
      </div>
      <el-table v-loading="loading" :data="list" class="ofa-table">
        <el-table-column prop="ClientName" label="微信客户端名称"></el-table-column>
        <el-table-column prop="AppId" label="微信AppId"></el-table-column>
        <el-table-column prop="MsgType" label="消息类型">
          <template #default="scope">{{
            getMsgTypeStr(scope.row.MsgType)
          }}</template>
        </el-table-column>
        <el-table-column prop="ReplyType" label="回复类型">
          <template #default="scope">{{
            getReplyTypeStr(scope.row.ReplyType)
          }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" header-align="center">
          <template #default="scope">
            <el-button link v-if="permission.Update" type="primary" @click="showDrawer(scope.row)">修改</el-button>
            <el-button link v-if="permission.Delete" type="danger" @click="del(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination background layout="total, sizes, prev, pager, next, jumper" v-model:current-page="pageIndex"
        :page-sizes="[10, 20, 50, 100]" v-model:page-size="pageSize" :total="total" @size-change="pageSizeChange"
        @current-change="pageIndexChange">
      </el-pagination>
    </el-main>
  </el-container>
  <!-- 表单 -->
  <el-drawer v-model="drawerVisiable" :modal="false" :show-close="false" direction="rtl" size="600" class="ofa-drawer">
    <template #header>
      <span class="title">{{ isAdd ? '新增' : '编辑' }}回复设置</span>
    </template>
    <el-form status-icon ref="settingForm" :rules="validationRule" :model="entity" label-width="120px">
      <el-form-item label="微信客户端" prop="AppId">
        <el-select v-model="entity.AppId" placeholder="微信AppId">
          <el-option v-for="item in clients" :key="item.Id" :label="item.ClientName" :value="item.AppId"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="消息类型" prop="MsgType">
        <el-select v-model="entity.MsgType" placeholder="微信发送的消息类型">
          <el-option v-for="item in WX_GZH_MSG_TYPE" :key="item.value" :label="item.label"
            :value="item.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="回复类型" prop="ReplyType">
        <el-select v-model="entity.ReplyType" placeholder="回复用户的消息类型">
          <el-option v-for="item in WX_GZH_REPLY_TYPE" :key="item.value" :label="item.label"
            :value="item.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="Xml模板" prop="XmlContent">
        <template #label>
          <label>
            <el-tooltip class="box-item" effect="dark" content="请参考微信公众平台接口文档填写" placement="top">
              <font-awesome-icon fas icon="info-circle" class="ofa-mr4 color-warning"></font-awesome-icon>
            </el-tooltip>
            Xml模板
          </label>
        </template>
        <el-input v-model.trim="entity.XmlContent" :autosize="{ minRows: 6 }" type="textarea"
          placeholder="Xml模板"></el-input>
      </el-form-item>
      <el-form-item label="回复内容" prop="ContentJson">
        <el-input v-model.trim="entity.ContentJson" :autosize="{ minRows: 6 }" type="textarea"
          placeholder="回复内容"></el-input>
      </el-form-item>
    </el-form>
    <div class="footer">
      <el-button type="primary" @click="submit">提交</el-button>
      <el-button type="warning" @click="drawerVisiable = false">取消</el-button>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, nextTick } from 'vue'
import { FormRules, ElMessageBox, FormInstance } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import { WX_GZH_REPLY } from '@/routers/sys-router'
import { ISysWxClient } from '@/interfaces/sys/ISysWxClient'
import { ISysWxgzhReplySetting } from '@/interfaces/sys/ISysWxgzhReplySetting'
import { WX_GZH_MSG_TYPE, WX_GZH_REPLY_TYPE } from '@/consts/sys-const'
import API from '@/apis/sys-api'

const userStore = useUserStore()
const loading = ref(false) // 加载中
const drawerVisiable = ref(false)
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const searchOption = ref({
  appId: ''
}) // 搜索条件
const isAdd = ref(true) // 添加模式
const list = ref<ISysWxgzhReplySetting[]>([]) // 列表
const clients = ref<ISysWxClient[]>([]) // 登录客户端列表
const entity = ref<ISysWxgzhReplySetting>(
  Object.assign({ ClientId: '', ClientName: '', AppId: '', AppSecret: '' })
) // 实体
const settingForm = ref<FormInstance>() // 表单
const validationRule = reactive<FormRules<any>>({
  AppId: [{ required: true, message: '请先选择微信AppId', trigger: 'blur' }],
  MsgType: [
    { required: true, message: '请先选择微信发送的消息类型', trigger: 'blur' }
  ],
  ReplyType: [
    { required: true, message: '请先选择回复用户的消息类型', trigger: 'blur' }
  ]
}) // 表单验证

const permission = computed(() => {
  return userStore.getPermissions(WX_GZH_REPLY.Url) // 权限列表
})

onMounted(() => {
  get()
  getClients()
})

// 获取列表
function get() {
  loading.value = true
  API.getWxgzhReplySettings(
    pageIndex.value,
    pageSize.value,
    searchOption.value.appId
  ).then(res => {
    list.value = res.Items
    total.value = res.Items.length
    loading.value = false
  })
}

// 获取登录客户端列表
function getClients() {
  loading.value = true
  API.getWxClients().then(res => {
    clients.value = res
    total.value = res.length
    loading.value = false
  })
}

// 获取消息类型字符串
function getMsgTypeStr(type: number) {
  return WX_GZH_MSG_TYPE.find(w => w.value == type)?.label
}

// 获取回复内容字符串
function getReplyTypeStr(type: number) {
  return WX_GZH_REPLY_TYPE.find(w => w.value == type)?.label
}

// 搜索
function search() {
  pageIndex.value = 1
  nextTick(() => get())
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

// 显示添加抽屉
function showDrawer(item?: ISysWxgzhReplySetting) {
  if (item) {
    isAdd.value = false
    entity.value = item
  } else {
    isAdd.value = true
    entity.value = Object.assign({})
    nextTick(() => {
      settingForm.value?.resetFields()
    })
  }
  drawerVisiable.value = true
}

// 提交
function submit() {
  settingForm.value?.validate((valid: boolean) => {
    if (valid) {
      if (isAdd.value) {
        API.addWxgzhReplySetting(entity.value).then(res => {
          if (res.Status) get()
        })
      } else {
        API.updateWxgzhReplySetting(entity.value)
      }
    }
  })
}

// 删除
function del(item: ISysWxgzhReplySetting) {
  ElMessageBox.confirm(
    '确认要删除选中回复设置？删除后不可恢复，请谨慎操作！',
    '敏感操作提示',
    {
      type: 'warning',
      cancelButtonText: '放弃操作'
    }
  ).then(() => {
    API.delWxgzhReplySetting(item.Id).then(res => {
      if (res.Status) {
        get()
      }
    })
  })
}
</script>

<style lang="scss" scoped>
.wxgzh-reply-page {
  background: #fff;
  border-radius: 20px;
  padding: 20px;

  .header {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    height: auto;

    .search-box {
      display: flex;
      align-items: center;
      padding: 6px 4px;
    }

    .button-box {
      display: flex;
      align-items: flex-start;
    }
  }

  .title-box {
    padding: 20px 0;
  }

  .title {
    color: #303133;
    font-size: 1.75rem;
    font-weight: bold;
  }
}
</style>
