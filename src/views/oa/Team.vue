<template>
  <el-container class="team-page">
    <!-- 组织架构 -->
    <el-aside class="tree">
      <div class="header">
        <el-input enterable v-model="searchOption.key" placeholder="部门名称">
          <template #prefix>
            <font-awesome-icon fas icon="search"></font-awesome-icon>
          </template>
        </el-input>
        <el-button-group>
          <el-button :type="IsValidlist ? 'primary' : ''" @click="get(true)">
            <font-awesome-icon fas icon="sitemap"></font-awesome-icon
            >&nbsp;组织架构
          </el-button>
          <el-button :type="IsValidlist ? '' : 'danger'" @click="get(false)">
            <font-awesome-icon fas icon="trash-alt"></font-awesome-icon
            >&nbsp;回收站
          </el-button>
        </el-button-group>
      </div>
      <el-tree
        highlight-current
        accordion
        :expand-on-click-node="false"
        :data="trees"
        :filter-node-method="filterTeamNode"
        :props="{ children: 'Children' }"
        @node-click="clickTreeNode"
        ref="teamTree"
        class="ofa-tree"
        node-key="Id"
        :empty-text="IsValidlist ? '暂无部门' : '暂无已删除的部门'"
      >
        <template #default="{ data }">
          <span class="tree-node">
            <span>
              <font-awesome-icon
                fas
                icon="network-wired"
                style="margin-right: 5px"
              ></font-awesome-icon>
              <label>{{ data.Name }}&nbsp;</label>
              <label>({{ data.MemberNumber }}人)</label>
            </span>
          </span>
        </template>
      </el-tree>
    </el-aside>
    <!-- 右侧面板 -->
    <el-main class="right-content">
      <div v-show="currentNode" class="tenant-info">
        <label class="name">{{ currentNode?.Name }}</label>
        <el-tag class="tag" effect="dark">{{ currentNode?.Type }}</el-tag>
        <el-tag
          v-show="currentNode?.LeaderName"
          class="tag"
          type="warning"
          effect="dark"
        >
          {{ currentNode?.LeaderName }}</el-tag
        >
        <el-button
          v-show="currentNode?.Id !== GUID"
          round
          @click="showDrawer(currentNode)"
          style="margin-left: 10px; width: 80px"
          >编辑</el-button
        >
      </div>
      <div class="team-box">
        <div class="title">
          <font-awesome-icon fas icon="sitemap"></font-awesome-icon
          >&nbsp;下级部门
        </div>
        <div class="btn-title">
          <el-button @click="showDrawer()">
            <font-awesome-icon fas icon="plus"></font-awesome-icon
            >&nbsp;添加子部门
          </el-button>
          <el-button
            :disabled="!childTeams || childTeams.length === 0"
            @click="initTeamTableRowDrop"
          >
            <font-awesome-icon fas icon="sort"></font-awesome-icon
            >&nbsp;调整排序
          </el-button>
        </div>
        <el-collapse-transition>
          <div v-show="isSortableChildTeam" class="sort-title">
            <label style="margin-right: 10px">可通过拖动部门调整位置</label>
            <el-button link @click="submitSortTeams" type="primary"
              >保存</el-button
            >
            <el-button link @click="isSortableChildTeam = false" type="info"
              >撤销</el-button
            >
          </div>
        </el-collapse-transition>
        <el-table
          :show-header="false"
          :data="childTeams"
          row-key="Id"
          ref="teamTable"
          empty-text="当前部门不包含下级部门"
          max-height="400"
          row-class-name="allowDrop"
        >
          <el-table-column prop="Name">
            <template #default="scope">
              <label
                >{{ scope.row.Name
                }}{{
                  scope.row.LeaderName ? '-' + scope.row.LeaderName : ''
                }}&nbsp;</label
              >
              <el-text type="info"
                >（直属 {{ scope.row.MemberNumber }} 人）</el-text
              >
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="member-box">
        <div class="title">
          <font-awesome-icon fas icon="users"></font-awesome-icon>&nbsp;部门人员
        </div>
        <div class="btn-title">
          <div v-show="currentNode.Id !== GUID">
            <el-button @click="showAddMemberDrawer" type="primary">
              <font-awesome-icon fas icon="plus"></font-awesome-icon
              >&nbsp;添加人员
            </el-button>
            <el-button @click="excelDialogVisiable = true">
              <font-awesome-icon fas icon="file-import"></font-awesome-icon
              >&nbsp;批量导入
            </el-button>
            <el-button
              :disabled="members.length === 0"
              @click="transferDialogVisiable = true"
            >
              <font-awesome-icon fas icon="users-cog"></font-awesome-icon
              >&nbsp;修改部门
            </el-button>
            <el-button
              plain
              :disabled="members.length === 0"
              @click="delMember"
              type="danger"
            >
              <font-awesome-icon fas icon="user-times"></font-awesome-icon
              >&nbsp;移除
            </el-button>
            <el-button
              plain
              :disabled="members.length === 0"
              @click="leaveMember"
              type="warning"
            >
              <font-awesome-icon fas icon="users-slash"></font-awesome-icon
              >&nbsp;离职
            </el-button>
          </div>
          <div>
            <el-checkbox v-model="memberSearchOption.isOnJob">在职</el-checkbox>
          </div>
        </div>
        <el-table
          :data="filterMembers"
          empty-text="当前部门暂无人员"
          max-height="400"
          ref="memberTable"
        >
          <el-table-column
            type="selection"
            width="50"
            header-align="center"
            align="center"
          ></el-table-column>
          <el-table-column label="姓名" prop="Name">
            <template #default="scope">
              <div class="person-name-box">
                <el-avatar
                  :src="domain + scope.row.IconUrl"
                  fit="contain"
                  class="person-icon"
                >
                  {{ getSubName(scope.row.Name) }}
                </el-avatar>
                <label style="margin-left: 8px">{{ scope.row.Name }}</label>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="职级" prop="Job"></el-table-column>
          <el-table-column label="手机" prop="Phone"></el-table-column>
          <el-table-column label="邮箱" prop="Email"></el-table-column>
          <el-table-column label="入职日期" prop="EntryDate" width="120">
            <template #default="scope">
              <el-text v-if="scope.row.IsLeave" type="danger">已离职</el-text>
              <el-text v-else>{{
                scope.row.EntryDate
                  ? dayjs(scope.row.EntryDate).format('YYYY-MM-DD')
                  : '未入职'
              }}</el-text>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-main>
  </el-container>
  <!-- 部门抽屉 -->
  <el-drawer
    v-model="drawerVisiable"
    :modal="false"
    :show-close="false"
    direction="rtl"
    size="460"
    class="ofa-drawer"
  >
    <template #header>
      <span class="title">{{ isAdd ? '创建' : '编辑' }}部门</span>
    </template>
    <el-form
      :model="entity"
      :rules="validationRule"
      label-width="120px"
      ref="teamFormRef"
    >
      <el-form-item label="部门名称" prop="Name">
        <el-input
          v-model.trim="entity.Name"
          placeholder="请输入部门名称，如XX部"
        ></el-input>
      </el-form-item>
      <el-form-item label="上级" prop="ParentId">
        <el-cascader
          v-model="treePath"
          :props="{
            children: 'Children',
            value: 'Id',
            label: 'Name',
            checkStrictly: true
          }"
          :show-all-levels="false"
          :options="trees"
          placeholder="请选择上级部门"
        ></el-cascader>
      </el-form-item>
      <el-form-item label="类型" prop="Type">
        <el-select
          allow-create
          filterable
          v-model="entity.Type"
          placeholder="部门类型"
        >
          <el-option
            v-for="item in types"
            :key="item.Id"
            :label="item.Name"
            :value="item.Name"
          >
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="直接负责人" prop="LeaderId">
        <el-select
          filterable
          remote
          :remote-method="getLeaders"
          v-model="entity.LeaderId"
          no-data-text="请搜索员工名称设置"
          placeholder="直接负责人"
        >
          <el-option disabled label="未选择" :value="GUID"></el-option>
          <el-option
            v-for="item in persons"
            :key="item.Id"
            :label="item.Name"
            :value="item.Id"
          >
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <div class="footer">
      <el-button
        v-show="!currentNode?.IsDeleted"
        type="primary"
        @click="submit"
      >
        <font-awesome-icon fas icon="save"></font-awesome-icon>&nbsp;{{
          isAdd ? '创建' : '保存'
        }}
      </el-button>
      <el-button
        v-show="!isAdd"
        :type="currentNode?.IsDeleted ? 'success' : 'danger'"
        @click="del"
      >
        {{ currentNode?.IsDeleted ? '恢复' : '删除' }}
      </el-button>
      <el-button
        v-show="permission.Delete && currentNode?.IsDeleted"
        type="danger"
        @click="delTrue"
        >彻底删除
      </el-button>
      <el-button type="warning" @click="drawerVisiable = false">
        取消
      </el-button>
    </div>
  </el-drawer>
  <!-- 批量加入部门弹窗 -->
  <el-dialog
    custom-class="ofa-dialog"
    :title="'添加成员到-' + currentNode.Name"
    v-model="personDialogVisible"
    @open="getNoTeamPersons"
    width="80%"
  >
    <div style="margin-bottom: 10px">
      <el-input
        enterable
        v-model="searchPersonOption.key"
        style="width: 200px"
        placeholder="搜索"
      >
        <template #prefix>
          <font-awesome-icon fas icon="search"></font-awesome-icon>
        </template>
      </el-input>
      <el-checkbox
        v-model="searchPersonOption.isTeamMember"
        @change="getNoTeamPersons"
        style="margin-left: 10px"
        >搜索部门成员
      </el-checkbox>
    </div>
    <el-table
      border
      :data="
        noTeamPersons.filter(
          data =>
            !searchPersonOption.key ||
            data.Name.includes(searchPersonOption.key)
        )
      "
      ref="noTeamTable"
      empty-text="没有可加入部门的人员"
      max-height="400"
    >
      <el-table-column
        type="selection"
        width="50"
        header-align="center"
        align="center"
      ></el-table-column>
      <el-table-column label="姓名" prop="Name"></el-table-column>
      <el-table-column label="手机" prop="MobilePhone"></el-table-column>
      <el-table-column label="职级" prop="Job"></el-table-column>
      <el-table-column label="入职日期" prop="EntryDate" width="120">
        <template #default="scope">
          {{
            scope.row.EntryDate
              ? dayjs(scope.row.EntryDate).format('YYYY-MM-DD')
              : '未入职'
          }}
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="personDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMembers">确 定</el-button>
      </span>
    </template>
  </el-dialog>
  <!-- 人员抽屉 -->
  <el-drawer
    v-model="memberDrawerVisiable"
    :modal="false"
    :show-close="false"
    direction="rtl"
    size="460"
    class="ofa-drawer"
  >
    <template #header>
      <span class="title">添加新成员</span>
    </template>
    <div>
      <el-alert
        center
        :closable="false"
        type="warning"
        style="margin-bottom: 10px"
      >
        <el-link @click="showPersonDialog" type="primary"
          ><font-awesome-icon fas icon="arrow-pointer"></font-awesome-icon
          >&nbsp;点击此处，从现有人员档案中选择加入</el-link
        >
      </el-alert>
      <el-form
        :model="memberEntity"
        :rules="memberValidationRule"
        label-width="120px"
        class="form"
        ref="memberForm"
      >
        <el-form-item label="姓名" prop="Name">
          <el-input
            v-model.trim="memberEntity.Name"
            placeholder="姓名"
          ></el-input>
        </el-form-item>
        <el-form-item label="性别" prop="Sex">
          <el-radio-group v-model="memberEntity.Sex">
            <el-radio :value="false">女</el-radio>
            <el-radio :value="true">男</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="加入部门" prop="TeamId">
          <el-cascader
            v-model="treePath2"
            :props="{
              children: 'Children',
              value: 'Id',
              label: 'Name',
              checkStrictly: true
            }"
            :show-all-levels="false"
            :options="list"
            placeholder="请选择加入部门"
          ></el-cascader>
        </el-form-item>
        <el-form-item label="职级" prop="Job">
          <el-select
            clearable
            v-model="memberEntity.Job"
            placeholder="岗位职级"
          >
            <el-option
              v-for="item in jobs"
              :key="item.Id"
              :label="item.Name"
              :value="item.Name"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="手机" prop="MobilePhone">
          <el-input
            v-model.trim="memberEntity.MobilePhone"
            placeholder="联系手机"
          ></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="Email">
          <el-input
            v-model.trim="memberEntity.Email"
            placeholder="电子邮箱"
          ></el-input>
        </el-form-item>
        <el-form-item label="身份证" prop="IdCard">
          <el-input
            v-model="memberEntity.IdCard"
            placeholder="身份证"
          ></el-input>
        </el-form-item>
        <el-form-item label="管理" prop="IsLeader">
          <el-checkbox v-model="memberEntity.IsLeader"></el-checkbox>
        </el-form-item>
        <el-divider content-position="left">入职信息</el-divider>
        <el-form-item label="工号" prop="WorkNumber">
          <el-input
            v-model="memberEntity.WorkNumber"
            placeholder="工号"
          ></el-input>
        </el-form-item>
        <el-form-item label="入职时间" prop="EntryDate">
          <el-date-picker
            v-model="memberEntity.EntryDate"
            value-format="YYYY-MM-DD"
            type="date"
            placeholder="入职时间"
          >
          </el-date-picker>
        </el-form-item>
        <el-form-item label="员工类型" prop="EmployeeType">
          <el-select v-model="memberEntity.EmployeeType" placeholder="员工类型">
            <el-option
              v-for="item in PERSON_EMPLOYEE_TYPE"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="员工状态" prop="EmployeeStatus">
          <el-select
            v-model="memberEntity.EmployeeStatus"
            placeholder="员工状态"
          >
            <el-option
              v-for="item in PERSON_EMPLOYEE_STATUS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="Remark" placeholder="备注">
          <el-input v-model="memberEntity.Remark"></el-input>
        </el-form-item>
      </el-form>
    </div>
    <div class="footer">
      <el-button type="primary" @click="submitMember">
        <font-awesome-icon fas icon="save"></font-awesome-icon
        >&nbsp;添加</el-button
      >
      <el-button type="warning" @click="memberDrawerVisiable = false">
        取消
      </el-button>
    </div>
  </el-drawer>
  <!-- 人员调动弹窗 -->
  <el-dialog
    custom-class="ofa-dialog"
    title="人员调动"
    v-model="transferDialogVisiable"
    width="400"
  >
    <div class="transfer-content">
      <span>目标部门：</span>
      <el-cascader
        v-model="treePath3"
        :props="{
          children: 'Children',
          value: 'Id',
          label: 'Name',
          checkStrictly: true
        }"
        :show-all-levels="false"
        :options="list"
        placeholder="请选择目标部门"
      ></el-cascader>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="transferDialogVisiable = false">取消</el-button>
        <el-button type="primary" @click="transferSubmit">确 定</el-button>
      </span>
    </template>
  </el-dialog>
  <!-- Excel导入成员弹窗 -->
  <el-dialog
    v-model="excelDialogVisiable"
    :title="`导入成员到-${currentNode.Name}`"
    custom-class="ofa-dialog"
    width="80%"
  >
    <TeamMemberExcelUploader :teamId="currentNode.Id"></TeamMemberExcelUploader>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, watch, computed } from 'vue'
import {
  dayjs,
  ElMessageBox,
  FormRules,
  FormInstance,
  ElMessage
} from 'element-plus'
import Sortable from 'sortablejs'
import { useUserStore } from '@/stores/userStore'
import API from '@/apis/oa-api'
import { TEAM } from '@/routers/oa-router'
import { GUID } from '@/consts/const'
import { PERSON_EMPLOYEE_TYPE, PERSON_EMPLOYEE_STATUS } from '@/consts/oa-const'
import { IOATeamTree, IOATeamForm } from '@/interfaces/oa/IOATeam'
import { IOATeamMember } from '@/interfaces/oa/IOATeamMember'
import { IOATeamType } from '@/interfaces/oa/IOATeamType'
import { IOAPerson } from '@/interfaces/oa/IOAPerson'
import { IOAJob } from '@/interfaces/oa/IOAJob'
import { IOATeamMemberForm } from '@/interfaces/oa/IOATeamMember'
import TeamMemberExcelUploader from './components/TeamMemberExcelUploader.vue'

const userStore = useUserStore()
const IsValidlist = ref(true) // 显示未删除部门
const isSortableChildTeam = ref(false) // 子部门排序
const excelDialogVisiable = ref(false) // 导入excel弹窗
const drawerVisiable = ref(false) // 显示部门抽屉
const personDialogVisible = ref(false) // 显示从现有成员加入弹窗
const memberDrawerVisiable = ref(false) // 显示添加成员抽屉
const transferDialogVisiable = ref(false) // 显示人员调动弹窗
const isAdd = ref(false) // 添加模式
const domain = ref(API.getHost()) // 域名
const list = ref<IOATeamTree[]>([]) // 部门列表
const trees = ref<IOATeamTree[]>([]) // 部门树列表
const childTeams = ref<IOATeamTree[]>([]) // 部门列表
const currentNode = ref<IOATeamTree>(Object.assign({ Id: GUID })) // 部门列表
const entity = ref<IOATeamForm>(Object.assign({ Id: GUID })) // 当前操作部门
const members = ref<IOATeamMember[]>([]) // 部门成员
const noTeamPersons = ref<IOATeamMember[]>([]) // 非部门成员
const memberEntity = ref<IOATeamMemberForm>(Object.assign({ Id: GUID })) // 部门成员
const types = ref<IOATeamType[]>([]) // 部门类型
const jobs = ref<IOAJob[]>([]) // 部门类型
const persons = ref<IOAPerson[]>([]) // 用户列表
const teamTree = ref() // 部门树
const treePath = ref<string[]>([]) // 选中的父级部门路径
const treePath2 = ref<string[]>([]) // 选中的成员要加入部门路径
const treePath3 = ref<string[]>([]) // 调动人员目标部门路径
const teamTable = ref() // 子部门列表
const noTeamTable = ref() // 批量选择成员表格列表
const memberTable = ref() // 部门成员表格
// 搜索条件
const searchOption = ref({
  key: ''
})
// 成员搜索条件
const memberSearchOption = ref({
  isOnJob: true
})
// 搜索未加入部门人员条件
const searchPersonOption = ref({
  key: '',
  isTeamMember: false
})
// 表单
const teamFormRef = ref<FormInstance>()
// 表单验证
const validationRule = reactive<FormRules<any>>({
  ParentId: [{ required: true, message: '请先选择上级' }],
  Name: [
    { required: true, message: '请先填写部门名称' },
    { min: 2, max: 20, message: '部门名称长度在2~20之间' }
  ],
  Type: [{ required: true, message: '请先填写类型' }]
})
// 成员表单
const memberForm = ref<FormInstance>()
// 表单验证
const memberValidationRule = reactive<FormRules<any>>({
  TeamId: [{ required: true, message: '请先选择加入部门' }],
  Name: [
    { required: true, message: '请先填写人员姓名' },
    { min: 2, max: 20, message: '人员姓名长度在2~20之间' }
  ],
  Job: [
    { required: true, message: '请先填写岗位职级' },
    { min: 2, max: 20, message: '岗位职级长度在2~20之间' }
  ],
  MobilePhone: [{ min: 11, max: 20, message: '手机号码长度错误' }]
})
// 权限列表
const permission = computed(() => {
  return userStore.getPermissions(TEAM.Url)
})
// 过滤后的部门成员列表
const filterMembers = computed(() => {
  if (memberSearchOption.value.isOnJob) {
    return members.value.filter(data => !data.IsLeave)
  } else {
    return members.value
  }
})
// 监控部门名称检索
watch(
  () => searchOption.value.key,
  newValue => {
    teamTree.value.filter(newValue)
  }
)
// 监控选择上级菜单
watch(
  () => treePath.value,
  newValue => {
    if (newValue) {
      const val = newValue[newValue.length - 1]
      if (entity.value.ParentId !== val)
        entity.value.ParentId = newValue[newValue.length - 1] ?? GUID
    } else {
      entity.value.ParentId = GUID
    }
  }
)
onMounted(() => {
  get()
  getTypes()
  getJobs()
})

// 获取部门列表
function get(isValidlist?: boolean) {
  IsValidlist.value = isValidlist === undefined ? true : isValidlist
  const scope = IsValidlist.value ? 0 : 1
  API.getTeamTrees(GUID, undefined, undefined, scope).then(res => {
    const node: IOATeamTree = Object.assign({
      Id: GUID,
      ParentId: '',
      Name: userStore.user?.TenantName,
      Type: '企业',
      MemberNumber: res.map(s => s.MemberNumber).reduce((a, b) => a + b),
      Children: res
    })
    trees.value = [node]
    list.value = res
    nextTick(() => {
      teamTree.value.setCurrentKey(GUID)
      clickTreeNode(null, { data: node })
    })
  })
}

// 树节点过滤
function filterTeamNode(value: string, data: any) {
  if (!value) return true
  return data.Name.indexOf(value) !== -1
}

// 树节点点击
function clickTreeNode(_event: any, node: any) {
  isSortableChildTeam.value = false
  currentNode.value = node.data
  childTeams.value = node.data.Children
  getMembers()
}

// 获取部门类型列表
function getTypes() {
  API.getTeamTypes().then(res => {
    types.value = res
  })
}

// 获取人员职级列表
function getJobs() {
  API.getJobs().then(res => {
    jobs.value = res
  })
}

// 显示添加抽屉
function showDrawer(item?: IOATeamTree) {
  drawerVisiable.value = true
  if (item) {
    isAdd.value = false
    entity.value = Object.assign({
      Id: item.Id,
      Name: item.Name,
      ParentId: item.ParentId,
      LeaderId: item.LeaderId,
      Type: item.Type
    })
    treePath.value = getTreePath(item?.ParentId)
    getLeader()
  } else {
    isAdd.value = true
    // 添加子级部门自动选中上级
    treePath.value = getTreePath(currentNode.value.Id)
    entity.value = Object.assign({})
    nextTick(() => {
      teamFormRef.value?.resetFields()
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

// 获取部门负责人
function getLeader() {
  if (currentNode.value.LeaderId !== GUID) {
    API.getPerson(currentNode.value.LeaderId).then(res => {
      persons.value = [res]
    })
  }
}

// 获取部门负责人列表
function getLeaders(key: string) {
  API.getPersons(key).then(res => {
    persons.value = res
  })
}

// 提交
function submit() {
  teamFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      if (isAdd.value) {
        API.addTeam(entity.value).then(res => {
          if (res.Status) get()
        })
      } else {
        API.updateTeam(entity.value)
      }
    }
  })
}

// 删除
function del() {
  let tips = `确认要移除 ${currentNode.value?.Name}？确认操作后部门成员将会被解散`
  if (currentNode.value?.IsDeleted)
    tips = `确认要恢复（${currentNode.value?.Type}）${entity.value.Name}`
  ElMessageBox.confirm(tips, '温馨提示', {
    type: 'warning',
    cancelButtonText: '放弃操作'
  }).then(() => {
    API.delTeam(entity.value.Id, false).then(res => {
      if (res.Status) {
        get()
        drawerVisiable.value = false
      }
    })
  })
}

// 彻底删除
function delTrue() {
  ElMessageBox.confirm(
    `确认要彻底删除${entity.value.Name}?删除后不可恢复`,
    '敏感操作提示',
    {
      type: 'warning',
      cancelButtonText: '放弃操作'
    }
  ).then(() => {
    API.delTeam(entity.value.Id, false).then(res => {
      if (res.Status) {
        get()
        drawerVisiable.value = false
      }
    })
  })
}

// 初始化表格拖拽
function initTeamTableRowDrop() {
  isSortableChildTeam.value = true
  const table = teamTable.value.$el.querySelector(
    '.el-table__body-wrapper tbody'
  )
  Sortable.create(table, {
    handle: '.allowDrop', // 允许拖拽的类名
    animation: 180,
    delay: 0,
    onEnd(evt: any) {
      const curRow = currentNode.value.Children.splice(evt.oldIndex, 1)[0]
      currentNode.value.Children.splice(evt.newIndex, 0, curRow)
    }
  })
}

// 提交子部门排序
function submitSortTeams() {
  const ids = currentNode.value.Children.map(e => {
    return e.Id
  })
  API.sortTeam(ids).then(res => {
    if (res.Status) {
      isSortableChildTeam.value = false
    }
  })
}

// 获取成员列表
function getMembers() {
  API.getTeamMembers(currentNode.value.Id).then(res => {
    members.value = res
  })
}

// 获取简略名字
function getSubName(str: string) {
  return str.substring(0, 1)
}

// 显示添加成员抽屉
function showAddMemberDrawer() {
  treePath2.value = getTreePath(currentNode.value.Id)
  memberEntity.value = Object.assign({
    TeamId: currentNode.value.Id,
    Sex: false,
    EmployeeType: PERSON_EMPLOYEE_TYPE[0].label,
    EmployeeStatus: PERSON_EMPLOYEE_STATUS[0].label
  })
  memberDrawerVisiable.value = true
}

// 显示从现有成员添加弹窗
function showPersonDialog() {
  personDialogVisible.value = true
  memberDrawerVisiable.value = false
}

// 获取待加入部门的成员
function getNoTeamPersons() {
  if (searchPersonOption.value.isTeamMember) {
    API.getTeamMembers(GUID).then(res => {
      noTeamPersons.value = res
    })
  } else {
    API.getNoTeamPersons().then(res => {
      noTeamPersons.value = res
    })
  }
}

// 提交成员加入部门
function submitMember() {
  memberForm.value?.validate((valid: boolean) => {
    if (valid) {
      memberEntity.value.TeamId = treePath2.value[treePath2.value.length - 1]
      API.addTeamMember2(memberEntity.value).then(res => {
        if (res.Status) getMembers()
      })
    }
  })
}

// 批量选择成员加入部门
function submitMembers() {
  const ids = noTeamTable.value.getSelectionRows().map((x: any) => x.Id)
  if (ids.length < 1) {
    ElMessage.error('请选择要加入部门的人员')
    return false
  }
  API.addTeamMember(currentNode.value.Id, ids).then(res => {
    if (res.Status) getMembers()
  })
}

// 移除成员
function delMember() {
  ElMessageBox.confirm('确认要移除选中成员？', '敏感操作提示', {
    type: 'warning',
    cancelButtonText: '放弃操作'
  }).then(() => {
    const ids = memberTable.value.getSelectionRows().map((x: any) => x.Id)
    API.delTeamMember(entity.value.Id, ids).then(res => {
      if (res.Status) {
        get()
        drawerVisiable.value = false
      }
    })
  })
}

// 成员离职
function leaveMember() {
  ElMessageBox.confirm('确认选中成员已离职？', '敏感操作提示', {
    type: 'warning',
    cancelButtonText: '放弃操作'
  }).then(() => {
    const ids = memberTable.value.getSelectionRows().map((x: any) => x.Id)
    API.leaveTeamMember(entity.value.Id, ids).then(res => {
      if (res.Status) {
        get()
        drawerVisiable.value = false
      }
    })
  })
}

// 人员调动
function transferSubmit() {
  const targetTeamId = treePath3.value[treePath3.value.length - 1]
  const ids = memberTable.value.getSelectionRows().map((x: any) => x.Id)
  API.transferTeamMember(currentNode.value.Id, targetTeamId, ids).then(res => {
    if (res.Status) {
      get()
      getMembers()
      transferDialogVisiable.value = false
    }
  })
}
</script>

<style lang="scss" scoped>
.team-page {
  display: flex;
  background: #fff;
  border-radius: 20px;
  padding: 20px;
}

.tree {
  width: 300px;
  min-height: 650px;
  border-right: 1px solid #ebeef5;

  .header {
    display: flex;
    flex-direction: column;
    padding: 0.75rem;
    border-bottom: 1px solid #ebeef5;

    .el-button-group {
      margin-top: 10px;

      button {
        width: 50%;
      }
    }
  }
}

.tree-label {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  > a {
    font-size: 0.85rem;
  }
}

.right-content {
  flex: 1;
  padding: 20px;
  position: relative;
  overflow: hidden;

  .tenant-info {
    display: flex;
    align-items: center;

    .name {
      font-size: 1.75rem;
      font-weight: 600;
    }

    .tag {
      margin-left: 10px;
    }
  }

  .team-box,
  .member-box {
    .title {
      padding: 30px 0;
      font-size: 1.25rem;
    }

    .btn-title {
      padding: 10px;
      background: #f2f6fc;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 10px;
      margin-bottom: 10px;
    }

    .sort-title {
      background: rgb(253, 246, 236) none repeat scroll 0% 0%;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 8px;
      color: #909399;
    }

    .person-name-box {
      display: flex;
      align-items: center;

      .person-icon {
        margin-right: 10px;
        border-radius: 50%;
        width: 45px;
        height: 45px;
        background: rgba(27, 154, 247, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        color: #fff;
      }
    }
  }

  .btn-box {
    position: absolute;
    right: 0;
    top: 0;
    z-index: 1;

    .el-input {
      width: 150px;
      margin-right: 10px;
    }
  }

  .user-icon {
    border-radius: 50%;
    vertical-align: middle;
    margin-right: 10px;

    img {
      width: 40px;
      height: 40px;
    }
  }
}

.transfer-content {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
