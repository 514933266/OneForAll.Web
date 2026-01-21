<template>
  <el-container class="job-type-page">
    <el-header class="header">
      <span>
        <el-input
          enterable
          v-model="searchOption.key"
          placeholder="职位分类名称"
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
          >&nbsp;新增职位分类</el-button
        >
      </span>
    </el-header>
    <el-main class="content">
      <div class="title-box">
        <span class="title">
          职位分类
          <span class="title-total">
            共有<el-text type="primary">&nbsp;{{ list.length }}&nbsp;</el-text
            >条数据
          </span>
        </span>
      </div>
      <el-table :data="list" class="ofa-table">
        <el-table-column type="index" width="50" align="center">
        </el-table-column>
        <el-table-column label="类别名称" prop="Name"></el-table-column>
        <el-table-column label="备注" prop="Remark"></el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="showDrawer(scope.row)"
              >修改
            </el-button>
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
      <span class="title">添加职位分类</span>
    </template>
    <el-form
      status-icon
      ref="typeFormRef"
      :rules="validationRule"
      :model="entity"
      class="form"
      label-width="120px"
    >
      <el-form-item prop="Name" label="类别名称">
        <el-input
          v-model.trim="entity.Name"
          placeholder="请输入职位分类名称"
        ></el-input>
      </el-form-item>
      <el-form-item prop="Remark" label="备注">
        <el-input
          v-model="entity.Remark"
          :rows="4"
          type="textarea"
          placeholder="请输入备注内容"
        ></el-input>
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
import { IOAJobType } from '@/interfaces/oa/IOAJobType'
import API from '@/apis/oa-api'

const drawerVisiable = ref(false)
const isAdd = ref(true) // 添加模式
const list = ref<IOAJobType[]>([]) // 列表
const entity = ref<IOAJobType>(Object.assign({})) // 实体
const searchOption = ref({
  key: ''
}) // 搜索条件
const typeFormRef = ref<FormInstance>() // 表单
const validationRule = reactive<FormRules<any>>({
  Name: [
    { required: true, message: '请先填写类别名称' },
    { min: 2, max: 20, message: '类别名称长度在2~20之间' }
  ],
  Remark: [{ min: 2, max: 500, message: '备注长度在2到500个字符以内' }]
}) // 表单验证

onMounted(() => {
  get()
})

// 获取分页列表
function get() {
  API.getJobTypes(searchOption.value.key).then(res => {
    list.value = res
  })
}

// 搜索
function search() {
  nextTick(() => get())
}

// 显示添加抽屉
function showDrawer(item?: IOAJobType) {
  if (item) {
    isAdd.value = false
    entity.value = item
  } else {
    isAdd.value = true
    entity.value = Object.assign({ Name: '', Remark: '' })
  }
  drawerVisiable.value = true
}

// 提交
function submit() {
  typeFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      if (isAdd.value) {
        API.addJobType(entity.value).then(res => {
          if (res.Status) get()
        })
      } else {
        API.updateJobType(entity.value)
      }
    }
  })
}

// 删除账号
function del(item: IOAJobType) {
  ElMessageBox.confirm(
    '确认要删除选中数据？删除后不可恢复，请谨慎操作！',
    '敏感操作提示',
    {
      type: 'warning',
      cancelButtonText: '放弃操作'
    }
  ).then(() => {
    API.delJobType(item.Id).then(res => {
      if (res.Status) {
        get()
      }
    })
  })
}
</script>

<style lang="scss" scoped>
.job-type-page {
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
}
</style>
