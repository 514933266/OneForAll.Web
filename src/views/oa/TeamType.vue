<template>
  <el-container class="team-type-page">
    <el-header class="header">
      <span>
        <el-input
          enterable
          v-model="searchOption.key"
          placeholder="部门类型名称"
          style="width: 260px"
        >
          <template #prefix>
            <font-awesome-icon fas icon="sitemap"></font-awesome-icon>
          </template>
        </el-input>
        <el-button @click="search" type="primary" class="search-button"
          ><font-awesome-icon fas icon="search"></font-awesome-icon
          >&nbsp;查询</el-button
        >
      </span>
      <span>
        <el-button @click="showDrawer()" type="primary">
          <font-awesome-icon fas icon="plus"></font-awesome-icon
          >&nbsp;新增部门类型
        </el-button>
      </span>
    </el-header>
    <el-main class="content">
      <div class="title-box">
        <span class="title">
          部门类型
          <span class="title-total">
            共有<el-text type="primary">&nbsp;{{ list.length }}&nbsp;</el-text
            >条数据
          </span>
        </span>
      </div>
      <el-table :data="list" class="ofa-table">
        <el-table-column type="index" width="50" align="center">
        </el-table-column>
        <el-table-column label="类型名称" prop="Name"></el-table-column>
        <el-table-column label="允许创建子级" align="center">
          <template #default="scope">{{
            scope.row.CanAddChild ? '是' : '否'
          }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <el-button link type="danger" @click="del(scope.row)">
              删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-main>
  </el-container>
  <!-- 表单 -->
  <el-drawer
    v-model="drawerVisiable"
    :modal="false"
    :show-close="false"
    direction="rtl"
    size="460"
    class="ofa-drawer"
  >
    <template #header>
      <span class="title">添加部门类型</span>
    </template>
    <el-form
      status-icon
      ref="typeForm"
      :rules="validationRule"
      :model="entity"
      class="form"
      label-width="120px"
    >
      <el-form-item label="类型名称" prop="Name">
        <el-input v-model.trim="entity.Name" placeholder="类型"></el-input>
      </el-form-item>
      <el-form-item label="允许创建子级" prop="CanAddChild">
        <el-checkbox v-model="entity.CanAddChild"></el-checkbox>
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
import { FormRules, ElMessageBox, FormInstance } from 'element-plus'
import { IOATeamType } from '@/interfaces/oa/IOATeamType'
import API from '@/apis/oa-api'

const drawerVisiable = ref(false)
const searchOption = ref({
  key: ''
}) // 搜索条件
const list = ref<IOATeamType[]>([]) // 列表
const entity = ref<IOATeamType>(
  Object.assign({ Name: '', UserName: '', Status: 1 })
) // 实体
const typeForm = ref<FormInstance>() // 表单
const validationRule = reactive<FormRules<any>>({
  Name: [
    { required: true, message: '请先填写部门类型名称' },
    { min: 2, max: 20, message: '部门类型名称长度在2~20之间' }
  ]
}) // 表单验证

onMounted(() => {
  get()
})

// 获取分页列表
function get() {
  API.getTeamTypes(searchOption.value.key).then(res => {
    list.value = res
  })
}

// 搜索
function search() {
  nextTick(() => get())
}

// 显示添加抽屉
function showDrawer() {
  entity.value = Object.assign({ Name: '', CanAddChild: true })
  drawerVisiable.value = true
}

// 提交
function submit() {
  typeForm.value?.validate((valid: boolean) => {
    if (valid) {
      API.addTeamType(entity.value).then(res => {
        if (res.Status) get()
      })
    }
  })
}

// 删除账号
function del(item: IOATeamType) {
  ElMessageBox.confirm(
    '确认要删除选中数据？删除后不可恢复，请谨慎操作！',
    '敏感操作提示',
    {
      type: 'warning',
      cancelButtonText: '放弃操作'
    }
  ).then(() => {
    API.delTeamType(item.Id).then(res => {
      if (res.Status) {
        get()
      }
    })
  })
}
</script>

<style lang="scss" scoped>
.team-type-page {
  background: #fff;
  border-radius: 20px;
  padding: 20px;
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .title-box {
    padding: 20px 0;
  }

  .title {
    color: #303133;
    font-size: 1.75rem;
    font-weight: bold;
  }
  .search-button {
    margin-left: 10px;
  }
  .user-icon-box {
    display: flex;
    align-items: center;
    .el-avatar {
      background-color: #409eff;
    }

    .user-name {
      margin-left: 10px;
    }
  }
}
</style>
