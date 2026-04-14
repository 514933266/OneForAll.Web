<template>
  <el-container class="notification-config-page">
    <el-header class="header">
      <span class="search-box">
        <el-input v-model="searchOption.clientId" placeholder="客户端Id" style="width: 260px" class="ofa-mr10">
          <template #prefix>
            <font-awesome-icon fas icon="server"></font-awesome-icon>
          </template>
        </el-input>
        <el-button @click="search" type="primary"><font-awesome-icon fas
            icon="search"></font-awesome-icon>&nbsp;查询</el-button>
      </span>
      <span class="button-box">
        <el-button @click="showDrawer()" type="primary">
          <font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增客户端配置
        </el-button>
      </span>
    </el-header>
    <el-main class="content">
      <div class="title-box">
        <span class="title">
          消息通知配置列表
          <span class="title-total">
            共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
          </span>
        </span>
      </div>
      <el-table v-loading="loading" :data="list" class="ofa-table">
        <el-table-column prop="ClientId" label="客户端Id" width="200"></el-table-column>
        <el-table-column prop="Code" label="配置代码" width="200"></el-table-column>
        <el-table-column prop="NotificationType" label="通知类型" width="160" align="center" header-align="center">
          <template #default="scope">
            <el-tag>{{ getNotificationTypeStr(scope.row.NotificationType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="IsEnabled" label="状态" width="100" align="center" header-align="center">
          <template #default="scope">
            <el-tag :type="scope.row.IsEnabled ? 'success' : 'info'" effect="dark">
              {{ scope.row.IsEnabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="目标配置" width="100" align="center" header-align="center">
          <template #default="scope">
            <el-tooltip placement="top" effect="light" :show-after="200">
              <template #content>
                <pre class="target-json-tip">{{ formatJson(scope.row.TargetJson) }}</pre>
              </template>
              <font-awesome-icon fas icon="eye" class="target-json-icon"></font-awesome-icon>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column show-overflow-tooltip prop="Remark" label="备注" width="200"></el-table-column>
        <el-table-column prop="CreateTime" label="创建时间" width="180"></el-table-column>
        <el-table-column label="操作" width="140" align="center" header-align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="showDrawer(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="del(scope.row)">删除</el-button>
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
  <el-drawer v-model="drawerVisiable" :modal="false" :show-close="false" direction="rtl" size="500" class="ofa-drawer">
    <template #header>
      <span class="title">{{ isAdd ? '新增' : '编辑' }}通知配置</span>
    </template>
    <el-form status-icon ref="configForm" :rules="validationRule" :model="entity" label-width="100px">
      <el-form-item label="客户端Id" prop="ClientId">
        <el-input v-model.trim="entity.ClientId" placeholder="请输入客户端Id"></el-input>
      </el-form-item>
      <el-form-item label="配置代码" prop="Code">
        <el-input v-model.trim="entity.Code" placeholder="请输入配置代码"></el-input>
      </el-form-item>
      <el-form-item label="通知类型" prop="NotificationType">
        <el-select v-model="entity.NotificationType" placeholder="请选择通知类型">
          <el-option v-for="item in NOTIFICATION_TYPE" :key="item.value" :label="item.label"
            :value="item.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="目标配置" prop="TargetJson">
        <el-input v-model="entity.TargetJson" type="textarea" :rows="6" placeholder="请输入目标配置JSON"></el-input>
      </el-form-item>
      <el-form-item label="备注" prop="Remark">
        <el-input v-model="entity.Remark" type="textarea" :rows="3" placeholder="请输入备注"></el-input>
      </el-form-item>
      <el-form-item label="是否启用">
        <el-switch v-model="entity.IsEnabled"></el-switch>
      </el-form-item>
    </el-form>
    <div class="footer">
      <el-button type="primary" @click="submit">提交</el-button>
      <el-button type="warning" @click="drawerVisiable = false">取消</el-button>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'
import { FormRules, FormInstance, ElMessageBox } from 'element-plus'
import { IUmsNotificationConfig } from '@/interfaces/ums/IUmsNotificationConfig'
import { NOTIFICATION_TYPE } from '@/consts/ums-const'
import API from '@/apis/ums-api'

const loading = ref(false)
const drawerVisiable = ref(false)
const isAdd = ref(true)
const total = ref(0)
const pageIndex = ref(1)
const pageSize = ref(10)
const searchOption = ref({
  clientId: ''
})
const list = ref<IUmsNotificationConfig[]>([])
const entity = ref<any>({
  ClientId: '',
  Code: '',
  NotificationType: 0,
  TargetJson: '',
  Remark: '',
  IsEnabled: true
})
const configForm = ref<FormInstance>()
const validationRule = reactive<FormRules<any>>({
  ClientId: [
    { required: true, message: '请先填写客户端Id', trigger: 'blur' }
  ],
  Code: [
    { required: true, message: '请先填写配置代码', trigger: 'blur' },
    { max: 50, message: '长度不能超过50个字符', trigger: 'blur' }
  ],
  NotificationType: [
    { required: true, message: '请选择通知类型', trigger: 'change' }
  ],
  TargetJson: [
    { required: true, message: '请先填写目标配置', trigger: 'blur' }
  ],
  Remark: [
    { required: true, message: '请先填写备注', trigger: 'blur' },
    { max: 500, message: '长度不能超过500个字符', trigger: 'blur' }
  ]
})

onMounted(() => {
  get()
})

// 获取分页列表
function get() {
  loading.value = true
  API.getNotificationConfigs(
    pageIndex.value,
    pageSize.value,
    searchOption.value.clientId
  ).then(res => {
    total.value = res.Total
    list.value = res.Items
    loading.value = false
  })
}

// 获取通知类型名称
function getNotificationTypeStr(value: number) {
  return NOTIFICATION_TYPE.find(w => w.value === value)?.label ?? '未知'
}

// 格式化JSON显示
function formatJson(json: string) {
  try {
    return JSON.stringify(JSON.parse(json), null, 2)
  } catch {
    return json
  }
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

// 显示抽屉
function showDrawer(item?: IUmsNotificationConfig) {
  if (item) {
    isAdd.value = false
    entity.value = { ...item }
  } else {
    isAdd.value = true
    entity.value = {
      ClientId: '',
      Code: '',
      NotificationType: 0,
      TargetJson: '',
      Remark: '',
      IsEnabled: true
    }
  }
  nextTick(() => {
    if(isAdd.value)
      configForm.value?.resetFields()
    drawerVisiable.value = true
  })
}

// 提交
function submit() {
  configForm.value?.validate((valid: boolean) => {
    if (valid) {
      if (isAdd.value) {
        API.addNotificationConfig(entity.value).then(res => {
          if (res.Status) {
            drawerVisiable.value = false
            get()
          }
        })
      } else {
        API.updateNotificationConfig(entity.value.Id, entity.value).then(res => {
          if (res.Status) {
            drawerVisiable.value = false
            get()
          }
        })
      }
    }
  })
}

// 删除
function del(item: IUmsNotificationConfig) {
  ElMessageBox.confirm('确认要删除该配置吗？删除后不可恢复', '温馨提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(() => {
    API.deleteNotificationConfig(item.Id).then(res => {
      if (res.Status) get()
    })
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.notification-config-page {
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

  .target-json-icon {
    cursor: pointer;
    color: #409eff;
    font-size: 16px;
  }
}

.target-json-tip {
  margin: 0;
  max-width: 400px;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
  line-height: 1.6;
}
</style>
