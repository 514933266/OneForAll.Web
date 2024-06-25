<template>
  <el-container class="job-page">
    <!-- 头部条 -->
    <div class="title">
      <div class="title-text">职位管理</div>
      <div>
        <el-button link @click="toJobLevelPage" type="primary"
          ><font-awesome-icon fas icon="cog"></font-awesome-icon
          >&nbsp;职级管理</el-button
        >
        <span class="right-line">|</span>
        <el-button link @click="toJobDutyPage" type="primary"
          ><font-awesome-icon fas icon="bell"></font-awesome-icon
          >&nbsp;职务管理</el-button
        >
      </div>
    </div>
    <!-- desc -->
    <div class="title-desc">
      职位管理（共<el-text type="primary">&nbsp;{{ list.length }}&nbsp;</el-text
      >条数据）
    </div>
    <!-- 内容区域 -->
    <div class="job-content">
      <div class="job-left-tab">
        <div class="tab-title">
          <span>职位类别</span>
          <el-dropdown @command="changeType">
            <div>
              <span class="ofa-mr4">切换</span>
              <font-awesome-icon fas icon="sort"></font-awesome-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="item in types"
                  :key="item.Id"
                  :command="item.Id"
                  >{{ item.Name }}</el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="tab-all">
          <el-button link @click="changeType(GUID)" type="primary"
            >全部</el-button
          >
          <el-button link @click="showTypeDialog()"
            ><font-awesome-icon fas icon="plus"></font-awesome-icon
          ></el-button>
        </div>
        <el-tree
          default-expand-all
          :highlight-current="true"
          ref="typeTreeRef"
          :data="types"
          @node-click="showTypeDialog"
          node-key="Id"
          class="ofa-tree"
        >
          <template #default="{ data }">
            <span class="tree-node">
              <span>{{ data.Name }}</span>
            </span>
          </template>
        </el-tree>
      </div>
      <div class="job-right-table">
        <div class="search-box">
          <div class="left">
            <el-input
              v-model="searchOption.key"
              placeholder="搜索职位名称"
              style="width: 200px"
            >
              <template #prefix>
                <font-awesome-icon fas icon="search"></font-awesome-icon>
              </template>
            </el-input>
            <TeamCascader
              showRoot
              v-model="searchOption.teamId"
              rootName="全部部门"
              placeholder="部门"
              class="ofa-ml10"
              style="width: 200px"
            ></TeamCascader>
            <el-select
              clearable
              v-model="searchOption.isEnabled"
              placeholder="是否启用"
              class="ofa-ml10"
              style="width: 200px"
            >
              <el-option label="已启用" :value="true"></el-option>
              <el-option label="未启用" :value="false"></el-option>
            </el-select>
            <el-button link @click="filterJobs" type="primary" class="ofa-ml10"
              >筛选</el-button
            >
          </div>
          <div>
            <el-button type="primary" @click="showDrawer()">新增职位</el-button>
          </div>
        </div>
        <el-table :data="filterList" class="ofa-table" height="600">
          <el-table-column label="职位名称" prop="Name"> </el-table-column>
          <el-table-column prop="TeamName" label="部门"> </el-table-column>
          <el-table-column prop="TypeName" label="职位类别"> </el-table-column>
          <el-table-column prop="LevelName" label="对应职级"> </el-table-column>
          <el-table-column prop="DutyName" label="对应职务"> </el-table-column>
          <el-table-column prop="IsEnabled" label="使用状态">
            <template #default="scope">
              <el-text :type="scope.row.IsEnabled ? 'success' : 'danger'">{{
                scope.row.IsEnabled ? '已启用' : '已停用'
              }}</el-text>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button link @click="showDrawer(scope.row)" type="primary"
                >编辑</el-button
              >
              <el-button
                link
                @click="stop(scope.row)"
                :type="scope.row.IsEnabled ? 'danger' : 'success'"
              >
                {{ scope.row.IsEnabled ? '停用' : '启用' }}</el-button
              >
              <el-button link @click="del(scope.row)" type="danger"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
        <el-drawer
          v-model="drawerVisiable"
          direction="rtl"
          class="ofa-drawer"
          size="380px"
        >
          <template #header>
            <span class="title">{{ isAdd ? '添加' : '编辑' }}职位</span>
          </template>
          <el-form
            ref="jobFormRef"
            :model="entity"
            label-width="120px"
            :rules="validationRule"
          >
            <el-form-item label="职位名称" prop="Name">
              <el-input v-model="entity.Name" placeholder="职位名称"></el-input>
            </el-form-item>
            <el-form-item label="部门" prop="TeamId">
              <TeamCascader
                showRoot
                v-model="entity.TeamId"
                rootName="无"
                placeholder="请选择所属部门"
              ></TeamCascader>
            </el-form-item>
            <el-form-item label="职位类别" prop="TypeId">
              <el-select
                clearable
                v-model="entity.TypeId"
                placeholder="职位类别"
                class="mr10"
              >
                <el-option label="无" :value="GUID"></el-option>
                <el-option
                  v-for="item in types"
                  :key="item.Id"
                  :label="item.Name"
                  :value="item.Id"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="对应职级" prop="LevelId">
              <el-select
                clearable
                v-model="entity.LevelId"
                placeholder="对应职级"
                class="mr10"
              >
                <el-option label="无" :value="GUID"></el-option>
                <el-option
                  v-for="item in levels"
                  :key="item.Id"
                  :label="item.Name"
                  :value="item.Id"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="对应职务" prop="DutyId">
              <el-select
                clearable
                v-model="entity.DutyId"
                placeholder="对应职务"
                class="mr10"
              >
                <el-option label="无" :value="GUID"></el-option>
                <el-option
                  v-for="item in dutys"
                  :key="item.Id"
                  :label="item.Name"
                  :value="item.Id"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="启用" prop="IsEnabled">
              <el-checkbox v-model="entity.IsEnabled"></el-checkbox>
            </el-form-item>
          </el-form>
          <div class="footer">
            <el-button type="primary" @click="submit">
              <font-awesome-icon fas icon="save"></font-awesome-icon>&nbsp;保存
            </el-button>
            <el-button type="warning" @click="drawerVisiable = false">
              取消
            </el-button>
          </div>
        </el-drawer>
      </div>
    </div>
    <!-- 弹窗添加类别 -->
    <el-dialog
      :title="isAddType ? '添加职位分类' : '修改职位分类'"
      v-model="typeDialogVisible"
      width="600"
      custom-class="ofa-dialog"
    >
      <el-form
        :model="typeEntity"
        :rules="jobTypeValidationRule"
        ref="typeFormRef"
        label-width="120px"
      >
        <el-form-item prop="Name" label="职位分类名称">
          <el-input
            v-model.trim="typeEntity.Name"
            placeholder="请输入内容"
          ></el-input>
        </el-form-item>
        <el-form-item prop="Remark" label="备注">
          <el-input
            v-model="typeEntity.Remark"
            :rows="4"
            type="textarea"
            placeholder="请输入备注内容"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="typeDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitType">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </el-container>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { FormRules, ElMessageBox, FormInstance } from 'element-plus'
import API from '@/apis/oa-person-api'
import { useBrowserStore } from '@/stores/browserStore'
import { JOB_LEVEL, JOB_DUTY } from '@/routers/oa-router'
import TeamCascader from './components/TeamCascader.vue'
import { IOAJob } from '@/interfaces/oa/IOAJob'
import { IOAJobType } from '@/interfaces/oa/IOAJobType'
import { IOAJobDuty } from '@/interfaces/oa/IOAJobDuty'
import { IOAJobLevel } from '@/interfaces/oa/IOAJobLevel'
import { GUID } from '@/consts/const'

const browserStore = useBrowserStore()
const isAdd = ref(false) // 是否添加类别
const isAddType = ref(false) // 是否添加类别
const drawerVisiable = ref(false) // 显示抽屉
const typeDialogVisible = ref(false) // 显示岗位类型弹窗
const types = ref<IOAJobType[]>([])
const dutys = ref<IOAJobDuty[]>([])
const levels = ref<IOAJobLevel[]>([])
const list = ref<IOAJob[]>([]) // 列表
const filterList = ref<IOAJob[]>([]) // 列表
const entity = ref<IOAJob>(Object.assign({})) // 实体
const typeEntity = ref<IOAJobType>(Object.assign({})) // 实体
const searchOption = ref({
  key: '', // 搜索条件（关键字）
  teamId: GUID, // 部门
  isEnabled: '', // 是否启用
  typeId: GUID // 类型
}) // 搜索条件
const typeTreeRef = ref() // 职业类型树组件
const jobFormRef = ref<FormInstance>() // 岗位表单
const validationRule = reactive<FormRules<any>>({
  Name: [
    { required: true, message: '请先填写岗位名称' },
    { min: 2, max: 20, message: '岗位名称长度在2~20之间' }
  ],
  Remark: [{ min: 2, max: 500, message: '备注长度在2到500个字符以内' }]
}) // 表单验证
const typeFormRef = ref<FormInstance>() // 岗位类型表单
const jobTypeValidationRule = reactive<FormRules<any>>({
  Name: [
    { required: true, message: '请先填写类别名称' },
    { min: 2, max: 20, message: '类别名称长度在2~20之间' }
  ],
  Remark: [{ min: 2, max: 500, message: '备注长度在2到500个字符以内' }]
}) // 表单验证

onMounted(() => {
  getJobTypes()
  getJobDutys()
  getJobLevels()
  get()
})

// 获取职位列表
function get() {
  API.getJobs().then(res => {
    list.value = res
    filterJobs()
  })
}

// 获取职位分类列表
function getJobTypes() {
  API.getJobTypes().then(res => {
    types.value = res
  })
}

// 获取职位分类列表
function getJobDutys() {
  API.getJobDutys().then(res => {
    dutys.value = res
  })
}

// 获取到职级
function getJobLevels() {
  API.getJobLevels().then(res => {
    levels.value = res
  })
}

// 过滤结果
function filterJobs() {
  let arr = Object.assign([], list.value) as IOAJob[]
  if (searchOption.value.teamId !== GUID) {
    arr = arr.filter(w => w.TeamId === searchOption.value.teamId)
  }
  if (searchOption.value.typeId !== GUID) {
    arr = arr.filter(w => w.TypeId === searchOption.value.typeId)
  }
  if (searchOption.value.key !== '') {
    arr = arr.filter(w => w.Name === searchOption.value.key)
  }
  if (searchOption.value.isEnabled !== '') {
    arr = arr.filter(w => w.IsEnabled === searchOption.value.isEnabled)
  }
  filterList.value = arr
}

// 切换类型
function changeType(id: string) {
  if (id !== GUID) {
    searchOption.value.typeId = id
    typeTreeRef.value.setCurrentKey(id)
  } else {
    searchOption.value.typeId = GUID
    typeTreeRef.value.setCurrentKey(null)
  }
  filterJobs()
}

// 显示添加抽屉
function showDrawer(item?: IOAJob) {
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
  jobFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      if (isAdd.value) {
        API.addJob(entity.value).then(res => {
          if (res.Status) get()
        })
      } else {
        API.updateJob(entity.value).then(res => {
          if (res.Status) get()
        })
      }
    }
  })
}

// 启用/停用
function stop(item: IOAJob) {
  API.enableJob(item.Id).then(res => {
    if (res.Status) get()
  })
}

// 删除账号
function del(item: IOAJob) {
  ElMessageBox.confirm(
    '确认要删除选中数据？删除后不可恢复，请谨慎操作！',
    '敏感操作提示',
    {
      type: 'warning',
      cancelButtonText: '放弃操作'
    }
  ).then(() => {
    API.delJob(item.Id).then(res => {
      if (res.Status) {
        get()
      }
    })
  })
}

// 显示添加抽屉
function showTypeDialog(item?: IOAJobType) {
  if (item) {
    isAddType.value = false
    typeEntity.value = item
  } else {
    isAddType.value = true
    typeEntity.value = Object.assign({ Name: '', Remark: '' })
  }
  typeDialogVisible.value = true
}

// 提交
function submitType() {
  typeFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      if (isAddType.value) {
        API.addJobType(typeEntity.value).then(res => {
          if (res.Status) getJobTypes()
        })
      } else {
        API.updateJobType(typeEntity.value).then(res => {
          if (res.Status) getJobTypes()
        })
      }
    }
  })
}

// 跳转职级页面
function toJobLevelPage() {
  browserStore.navigate(JOB_LEVEL)
}

// 跳转职务分类
function toJobDutyPage() {
  browserStore.navigate(JOB_DUTY)
}
</script>

<style lang="scss" scoped>
.job-page {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 20px;
  padding: 20px;
  .title {
    display: flex;
    justify-content: space-between;
  }
  .title-text {
    color: #303133;
    font-size: 1.75rem;
    font-weight: bold;
  }
  .right-line {
    margin-left: 15px;
    margin-right: 15px;
    color: rgb(216, 216, 216);
  }
  .title-desc {
    color: rgba(0, 0, 0, 0.65);
    font-size: 16px;
    margin-top: 10px;
  }
}

.job-content {
  display: flex;

  .job-left-tab {
    flex-shrink: 0;
    box-sizing: border-box;
    padding-top: 20px;
    padding-right: 10px;
    width: 220px;
    border-right: 1px solid #ebeef5;

    .tab-all {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;

      > span {
        color: #409eff;
      }

      > i {
        cursor: pointer;
      }
    }

    .tab-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;

      > span {
        font-size: 16px;
        font-family: PingFangSC-Medium;
      }

      > div {
        padding: 4px 8px;
        border-radius: 20px;
        font-size: 12px;
        background-color: #ebeef5;
        color: #409eff;
        cursor: pointer;
      }
    }

    .ofa-tree {
      .node-btn {
        display: none;
      }

      .tree-node {
        &:hover {
          .node-btn {
            display: block;
          }
        }
      }

      :deep(.el-tree-node__content) {
        margin: 10px 0 0 0 !important;
      }
    }
  }

  .job-right-table {
    width: calc(100vw - 600px);
    flex-shrink: 0;
    padding-top: 20px;
    padding-left: 20px;
  }

  .search-box {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    margin-bottom: 20px;

    .left {
      display: flex;
    }
  }
}
</style>
