<template>
  <el-container class="website-api-page">
    <el-header class="header">
      <span></span>
      <span>
        <el-button v-if="permission.Add" @click="showDrawer()" type="primary">
          <font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增Api</el-button>
      </span>
    </el-header>
    <el-main class="content">
      <div class="title-box">
        <span class="title">
          【{{ entity?.Name }}】域名权限列表
          <span class="title-total">
            共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
          </span>
        </span>
      </div>
      <el-table v-loading="loading" :data="list" class="ofa-table">
        <el-table-column prop="Name" label="名称"> </el-table-column>
        <el-table-column prop="Code" label="模块代码"> </el-table-column>
        <el-table-column prop="Host" label="请求域名"> </el-table-column>
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
      <span class="title">{{ isAdd ? '新增' : '编辑' }}站点Api</span>
    </template>
    <el-form status-icon ref="apiForm" :rules="validationRule" :model="apiEntity" label-width="120px">
      <el-alert show-icon title="操作提示" type="warning" style="margin-bottom: 20px">
        <ul class="tips">
          <li>本功能仅限开发人员使用，可对租户域名进行授权</li>
          <li>配置后对应的域名将会请求配置的Api地址</li>
          <li>菜单的代码与前端的API.KEY需要一致</li>
        </ul>
      </el-alert>
      <el-form-item label="Api名称" prop="Name">
        <el-select filterable remote :model-value="apiEntity.Name" :remote-method="getTreeMenus" @change="selectMenu"
          placeholder="请输入菜单名称后选择">
          <el-option v-for="item in menus" :key="item.Id" :label="item.Name" :value="item.Id">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="模块代码" prop="Code">
        <el-input v-model="apiEntity.Code" placeholder="请输入菜单代码">
        </el-input>
      </el-form-item>
      <el-form-item label="请求域名" prop="Host">
        <el-input v-model="apiEntity.Host" placeholder="请输入Api域名"></el-input>
      </el-form-item>
    </el-form>
    <div class="footer">
      <el-button type="primary" @click="submit">提交</el-button>
      <el-button type="warning" @click="drawerVisiable = false">取消</el-button>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, reactive, nextTick, onActivated } from 'vue'
import { FormRules, ElMessageBox, FormInstance } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import { WEBSITE } from '@/routers/sys-router'
import API from '@/apis/sys-api'
import { ISysWebsite, ISysWebsiteApi } from '@/interfaces/sys/ISysWebsite'
import { ISysMenuTree } from '@/interfaces/sys/ISysMenuTree'
import { GUID } from '@/consts/const'

const userStore = useUserStore()
const loading = ref(false) // 加载中
const drawerVisiable = ref(false)
const isAdd = ref(true) // 添加模式
const total = ref(0) // 总数据量
const list = ref<ISysWebsiteApi[]>([]) // 用户列表
const menus = ref<ISysMenuTree[]>([]) // 菜单列表
const entity = ref<ISysWebsite>() // 实体
const apiEntity = ref<ISysWebsiteApi>(
  Object.assign({ Id: GUID, Name: '', Host: '', Code: '' })
) // Api实体
const apiForm = ref<FormInstance>() // 表单
const validationRule = reactive<FormRules<any>>({
  Name: [
    { required: true, message: '请先填写Api设置名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在2到20个字符', trigger: 'blur' }
  ],
  Host: [
    { required: true, message: '请先填写Api域名', trigger: 'blur' },
    { min: 2, max: 200, message: '长度在2到200个字符', trigger: 'blur' }
  ],
  Code: [
    { required: true, message: '请先填写Api代码', trigger: 'blur' },
    { min: 2, max: 30, message: '长度在2到30个字符', trigger: 'blur' }
  ]
}) // 表单验证

const websiteId = computed(() => {
  return entity.value?.Id ?? ''
}) // 角色id

const permission = computed(() => {
  return userStore.getPermissions(WEBSITE.Url) // 权限列表
})

onActivated(() => {
  entity.value = history.state.params
  if (websiteId.value) {
    get()
  }
})

// 获取列表
function get() {
  loading.value = true
  API.getWebsiteApis(websiteId.value).then(res => {
    total.value = res.length
    list.value = res
    loading.value = false
  })
}

// 获取菜单
function getTreeMenus(key: string) {
  API.getTreeMenus(false, undefined, key).then(res => {
    menus.value = res
  })
}

// 选中菜单
function selectMenu(id: string) {
  const item = menus.value.find(w => w.Id === id)
  if (item) {
    apiEntity.value.Code = item.Code
    apiEntity.value.Name = item.Name
    apiEntity.value.Host = item.ApiUrl
  }
}

// 显示添加抽屉
function showDrawer(item?: ISysWebsiteApi) {
  if (item) {
    isAdd.value = false
    apiEntity.value = item
  } else {
    isAdd.value = true
    apiEntity.value = Object.assign({})
    nextTick(() => {
      apiForm.value?.resetFields()
    })
  }
  drawerVisiable.value = true
}

// 提交
function submit() {
  apiForm.value?.validate((valid: boolean) => {
    if (valid) {
      if (isAdd.value) {
        API.addWebsiteApi(websiteId.value, apiEntity.value).then(res => {
          if (res.Status) get()
        })
      } else {
        API.updateWebsiteApi(websiteId.value, apiEntity.value)
      }
    }
  })
}

// 删除
function del(item: ISysWebsiteApi) {
  ElMessageBox.confirm(
    '确认要删除选中站点Api？删除后不可恢复，请谨慎操作！',
    '敏感操作提示',
    {
      type: 'warning',
      cancelButtonText: '放弃操作'
    }
  ).then(() => {
    API.delWebsiteApi(websiteId.value, item.Id).then(res => {
      if (res.Status) get()
    })
  })
}
</script>

<style lang="scss" scoped>
.website-api-page {
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
