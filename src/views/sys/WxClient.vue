<template>
  <el-container class="client-page">
    <el-header class="header">
      <span> </span>
      <span>
        <el-button v-if="permission.Add" @click="showDrawer()" type="primary">
          <font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增客户端
        </el-button>
      </span>
    </el-header>
    <el-main class="content">
      <div class="title-box">
        <span class="title">
          微信客户端列表
          <span class="title-total">
            共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
          </span>
        </span>
      </div>
      <el-table v-loading="loading" :data="list" class="ofa-table">
        <el-table-column prop="ClientName" label="授权登录客户端"></el-table-column>
        <el-table-column prop="AppId" label="微信AppId"></el-table-column>
        <el-table-column prop="AppSecret" label="微信AppSecret"></el-table-column>
        <el-table-column label="操作" width="200" align="center" header-align="center">
          <template #default="scope">
            <el-button link v-if="permission.Update" type="primary" @click="showDrawer(scope.row)">修改</el-button>
            <el-button link v-if="permission.Delete" type="danger" @click="del(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-main>
  </el-container>
  <!-- 表单 -->
  <el-drawer v-model="drawerVisiable" :modal="false" :show-close="false" direction="rtl" size="460" class="ofa-drawer">
    <template #header>
      <span class="title">{{ isAdd ? '新增' : '编辑' }}客户端</span>
    </template>
    <el-form status-icon ref="clientForm" :rules="validationRule" :model="entity" label-width="120px">
      <el-form-item label="客户端Id" prop="ClientId">
        <el-select v-model="entity.ClientId" placeholder="所属授权客户端">
          <el-option v-for="item in clients" :key="item.Id" :label="item.ClientName" :value="item.Id">
            <span class="float-left">{{ item.ClientName }}</span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="客户端名称" prop="ClientName">
        <el-input v-model.trim="entity.ClientName" placeholder="客户端名称"></el-input>
      </el-form-item>
      <el-form-item label="微信AppId" prop="AppId">
        <el-input v-model.trim="entity.AppId" placeholder="微信AppId"></el-input>
      </el-form-item>
      <el-form-item label="微信AppSecret" prop="AppSecret">
        <el-input v-model.trim="entity.AppSecret" placeholder="微信AppSecret"></el-input>
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
import { WX_CLIENT } from '@/routers/sys-router'
import { ISysWxClient } from '@/interfaces/sys/ISysWxClient'
import { ISysClient } from '@/interfaces/sys/ISysClient'
import API from '@/apis/sys-api'

const userStore = useUserStore()
const loading = ref(false) // 加载中
const drawerVisiable = ref(false)
const total = ref(0) // 总数据量
const isAdd = ref(true) // 添加模式
const list = ref<ISysWxClient[]>([]) // 列表
const clients = ref<ISysClient[]>([]) // 登录客户端列表
const entity = ref<ISysWxClient>(
  Object.assign({ ClientId: '', ClientName: '', AppId: '', AppSecret: '' })
) // 实体
const clientForm = ref<FormInstance>() // 表单
const validationRule = reactive<FormRules<any>>({
  ClientId: [
    { required: true, message: '请先填写权客户端Id', trigger: 'blur' }
  ],
  AppId: [
    { required: true, message: '请先填写AppId', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在2~100之间', trigger: 'blur' }
  ],
  AppSecret: [
    { required: true, message: '请先填写AppSecret', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在2~20之间', trigger: 'blur' }
  ]
}) // 表单验证

const permission = computed(() => {
  return userStore.getPermissions(WX_CLIENT.Url) // 权限列表
})

onMounted(() => {
  get()
  getClients()
})

// 获取列表
function get() {
  loading.value = true
  API.getWxClients().then(res => {
    list.value = res
    total.value = res.length
    loading.value = false
  })
}

// 获取登录客户端列表
function getClients() {
  loading.value = true
  API.getClients().then(res => {
    clients.value = res
    total.value = res.length
    loading.value = false
  })
}

// 显示添加抽屉
function showDrawer(item?: ISysWxClient) {
  if (item) {
    isAdd.value = false
    entity.value = item
  } else {
    isAdd.value = true
    entity.value = Object.assign({})
    nextTick(() => {
      clientForm.value?.resetFields()
    })
  }
  drawerVisiable.value = true
}

// 提交
function submit() {
  clientForm.value?.validate((valid: boolean) => {
    if (valid) {
      if (isAdd.value) {
        API.addWxClient(entity.value).then(res => {
          if (res.Status) get()
        })
      } else {
        API.updateWxClient(entity.value)
      }
    }
  })
}

// 删除
function del(item: ISysWxClient) {
  ElMessageBox.confirm(
    '确认要删除选中客户端？删除后不可恢复，请谨慎操作！',
    '敏感操作提示',
    {
      type: 'warning',
      cancelButtonText: '放弃操作'
    }
  ).then(() => {
    API.delWxClient(item.Id).then(res => {
      if (res.Status) {
        get()
      }
    })
  })
}
</script>

<style lang="scss" scoped>
.client-page {
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
