<template>
  <el-container class="website-page">
    <el-header class="header">
      <span>
        <el-input enterable v-model="searchOption.key" placeholder="站点名称 / 域名" style="width: 260px">
          <template #prefix>
            <font-awesome-icon fas icon="globe"></font-awesome-icon>
          </template>
        </el-input>
        <el-button @click="search" type="primary" class="ofa-ml10"><font-awesome-icon fas
            icon="search"></font-awesome-icon>&nbsp;查询</el-button>
      </span>
      <span>
        <el-button v-if="permission.Add" @click="showDrawer()" type="primary">
          <font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增站点
        </el-button>
      </span>
    </el-header>
    <el-main class="content">
      <div class="title-box">
        <span class="title">
          站点列表
          <span class="title-total">
            共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
          </span>
        </span>
      </div>
      <el-table v-loading="loading" :data="list" class="ofa-table">
        <el-table-column prop="Name" label="网站名称" width="300"></el-table-column>
        <el-table-column prop="Host" label="域名" width="300"></el-table-column>
        <el-table-column prop="OAuthClientId" label="客户端id" width="200"></el-table-column>
        <el-table-column prop="OAuthClientSecret" label="客户端密码" width="200"></el-table-column>
        <el-table-column prop="OAuthClientName" label="客户端名称" width="200"></el-table-column>
        <el-table-column prop="CreateTime" label="创建时间" width="200px">
          <template #default="scope">
            {{ dayjs(scope.row.CreateTime).format('YYYY年MM月DD日 HH:mm') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" header-align="center" fixed="right">
          <template #default="scope">
            <el-button link @click="toApiPage(scope.row)" type="primary">API列表</el-button>
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
  <el-drawer v-model="drawerVisiable" :modal="false" :show-close="false" direction="rtl" size="460" class="ofa-drawer">
    <template #header>
      <span class="title">{{ isAdd ? '新增' : '编辑' }}站点</span>
    </template>
    <el-form status-icon ref="websiteForm" :rules="validationRule" :model="entity" class="form" label-width="120px">
      <el-form-item label="所属机构" prop="Name" class="row-item">
        <el-select filterable remote :remote-method="getTenants" v-model.trim="entity.Name" placeholder="请搜索后选择">
          <el-option v-for="item in tenants" :key="item.Id" :label="item.Name" :value="item.Name">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="域名" prop="Host" class="row-item">
        <el-input v-model.trim="entity.Host" placeholder="请输入应用的域名"></el-input>
      </el-form-item>
      <el-form-item label="客户端Id" prop="OAuthClientId" class="row-item">
        <el-input v-model.trim="entity.OAuthClientId" placeholder="请输入客户端Id">
        </el-input>
      </el-form-item>
      <el-form-item label="密码" prop="OAuthClientSecret" class="row-item">
        <el-input type="password" v-model.trim="entity.OAuthClientSecret" placeholder="请输入客户端密码"></el-input>
      </el-form-item>
      <el-form-item label="客户端名称" prop="OAuthClientName" class="row-item">
        <el-input v-model.trim="entity.OAuthClientName" placeholder="请输入客户端名称"></el-input>
      </el-form-item>
      <el-form-item label="授权地址" prop="OAuthUrl" class="row-item">
        <el-input v-model.trim="entity.OAuthUrl" placeholder="请输入授权地址"></el-input>
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
import dayjs from '@/untils/dayjs'
import { useUserStore } from '@/stores/userStore'
import { useBrowserStore } from '@/stores/browserStore'
import { WEBSITE, WEBSITE_API } from '@/routers/sys-router'
import API from '@/apis/sys-api'
import { ISysWebsite } from '@/interfaces/sys/ISysWebsite'
import { ISysTenant } from '@/interfaces/sys/ISysTenant'
import { GUID } from '@/consts/const'

const userStore = useUserStore()
const browserStore = useBrowserStore()
const loading = ref(false) // 加载中
const drawerVisiable = ref(false)
const total = ref(0) // 总数据量
const pageIndex = ref(1) // 页码
const pageSize = ref(10) // 页数
const searchOption = ref({
  key: ''
}) // 搜索条件
const isAdd = ref(true) // 添加模式
const list = ref<ISysWebsite[]>([]) // 用户列表
const tenants = ref<ISysTenant[]>([]) // 租户列表
const entity = ref<ISysWebsite>(
  Object.assign({
    Id: GUID,
    Name: '',
    Host: '',
    OAuthClientId: '',
    OAuthClientSecret: '',
    OAuthClientName: '',
    OAuthUrl: ''
  })
) // 实体
const websiteForm = ref<FormInstance>() // 表单
const validationRule = reactive<FormRules<any>>({
  Name: [
    { required: true, message: '请先填写网站名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在2到20个字符', trigger: 'blur' }
  ],
  Host: [
    { required: true, message: '请先填写网站域名', trigger: 'blur' },
    { min: 2, max: 200, message: '长度在2到200个字符', trigger: 'blur' }
  ],
  OAuthClientId: [
    { required: true, message: '请先填写客户端Id', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在2到20个字符', trigger: 'blur' }
  ],
  OAuthClientSecret: [
    { required: true, message: '请先填写客户端密码', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
  ],
  OAuthClientName: [
    { required: true, message: '请先填写客户端名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在2到100个字符', trigger: 'blur' }
  ],
  OAuthUrl: [
    { required: true, message: '请先填写授权Url', trigger: 'blur' },
    { min: 2, max: 1000, message: '长度在2到1000个字符', trigger: 'blur' }
  ]
}) // 表单验证

const permission = computed(() => {
  return userStore.getPermissions(WEBSITE.Url) // 权限列表
})

onMounted(() => {
  get()
})

// 获取列表
function get() {
  loading.value = true
  API.getWebsites(pageIndex.value, pageSize.value, searchOption.value.key).then(
    res => {
      total.value = res.Total
      list.value = res.Items
      loading.value = false
    }
  )
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

// 获取租户列表
function getTenants(key: string) {
  API.getPageTenants(1, 10, key).then(res => {
    tenants.value = res.Items
  })
}

// 显示添加抽屉
function showDrawer(item?: ISysWebsite) {
  if (item) {
    isAdd.value = false
    entity.value = item
  } else {
    isAdd.value = true
    entity.value = Object.assign({})
    nextTick(() => {
      websiteForm.value?.resetFields()
    })
  }
  drawerVisiable.value = true
}

// 提交
function submit() {
  websiteForm.value?.validate((valid: boolean) => {
    if (valid) {
      if (isAdd.value) {
        API.addWebsite(entity.value).then(res => {
          if (res.Status) get()
        })
      } else {
        API.updateWebsite(entity.value)
      }
    }
  })
}

// 删除
function del(item: ISysWebsite) {
  ElMessageBox.confirm(
    '确认要删除选中站点？删除后不可恢复，请谨慎操作！',
    '敏感操作提示',
    {
      type: 'warning',
      cancelButtonText: '放弃操作'
    }
  ).then(() => {
    API.delWebsite(item.Id).then(res => {
      if (res.Status) {
        get()
      }
    })
  })
}

// 跳转api页
function toApiPage(item: ISysWebsite) {
  browserStore.navigate(WEBSITE_API, item)
}
</script>

<style lang="scss" scoped>
.website-page {
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
    font-size: 1.75rem;
    font-weight: bold;
  }
}
</style>
