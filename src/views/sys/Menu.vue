<template>
  <el-container class="menu-page">
    <el-header class="header">
      <span>
        <el-input
          enterable
          v-model="searchOption.key"
          placeholder="菜单名称 / 代码"
          style="width: 260px"
        >
          <template #prefix>
            <font-awesome-icon fas icon="bars"></font-awesome-icon>
          </template>
        </el-input>
        <el-button @click="search" type="primary" class="ofa-ml10"
          ><font-awesome-icon fas icon="search"></font-awesome-icon
          >&nbsp;查询</el-button
        >
      </span>
      <span>
        <el-button
          link
          v-if="permission.Update"
          @click="showSortArrow = !showSortArrow"
          type="primary"
        >
          {{ showSortArrow ? '完成排序' : '调整排序' }}
        </el-button>
        <el-button v-if="permission.Add" @click="showDrawer()" type="primary">
          <font-awesome-icon fas icon="plus"></font-awesome-icon>&nbsp;新增菜单
        </el-button>
      </span>
    </el-header>
    <el-main class="content">
      <div class="title-box">
        <span class="title">
          菜单列表
          <span class="title-total">
            共有<el-text type="primary">&nbsp;{{ total }}&nbsp;</el-text>条数据
          </span>
        </span>
      </div>
      <el-table
        v-loading="loading"
        :data="list"
        :tree-props="{ children: 'Children' }"
        row-key="Id"
        class="ofa-table"
      >
        <el-table-column label="名称" prop="Name"></el-table-column>
        <el-table-column label="图标" prop="Icon" width="100" align="center">
          <template #default="scope">
            <font-awesome-icon
              v-if="scope.row.Icon"
              fas
              :icon="scope.row.Icon"
            ></font-awesome-icon>
          </template>
        </el-table-column>
        <el-table-column label="代码" prop="Code"></el-table-column>
        <el-table-column label="Url" prop="Url"></el-table-column>
        <el-table-column
          label="类型"
          prop="Type"
          width="160"
          align="center"
          header-align="center"
        >
          <template #default="scope">
            <el-tag>{{ getTypeStr(scope.row.Type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          show-overflow-tooltip
          label="备注"
          prop="Remark"
        ></el-table-column>
        <el-table-column
          label="状态"
          prop="IsEnabled"
          align="center"
          header-align="center"
          width="100"
        >
          <template #default="scope">
            <el-switch
              v-model="scope.row.IsEnabled"
              @change="updateIsEnabled(scope.row)"
              style="
                --el-switch-on-color: #13ce66;
                --el-switch-off-color: #ff4949;
              "
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" header-align="center">
          <template #default="scope">
            <el-button
              link
              v-show="showSortArrow"
              @click="sort(scope.row, true)"
              type="success"
              >升序</el-button
            >
            <el-button
              link
              v-show="showSortArrow"
              @click="sort(scope.row, false)"
              type="success"
              >降序</el-button
            >
            <el-button link @click="showCopyDialog(scope.row)" type="primary"
              >克隆</el-button
            >
            <el-button link @click="toDetailPage(scope.row)" type="primary"
              >权限</el-button
            >
            <el-button
              link
              v-if="permission.Update"
              type="primary"
              @click="showDrawer(scope.row)"
              >修改</el-button
            >
            <el-button
              link
              v-if="permission.Delete"
              type="danger"
              @click="del(scope.row)"
              >删除</el-button
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
      <span class="title">{{ isAdd ? '新增' : '编辑' }}菜单</span>
    </template>
    <el-form
      status-icon
      ref="menuForm"
      :rules="validationRule"
      :model="entity"
      label-width="120px"
    >
      <el-form-item label="名称" prop="Name">
        <el-input v-model="entity.Name" placeholder="请输入菜单名称"></el-input>
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
          :options="rootTree"
          placeholder="请选择上级菜单"
        ></el-cascader>
      </el-form-item>
      <el-form-item label="类型" prop="Type">
        <el-select v-model="entity.Type" @change="changeOpenType">
          <el-option
            v-for="item in MENU_TYPE"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="打开方式" prop="OpenType">
        <el-select v-model="entity.OpenType">
          <el-option label="无" :value="-1"> </el-option>
          <el-option
            v-for="item in MNUE_OPEN_TYPE"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="图标">
        <template #label>
          <div class="icon-label-box">
            <font-awesome-icon
              v-if="entity.Icon"
              fas
              :icon="entity.Icon"
              class="ofa-mr4"
            ></font-awesome-icon
            >图标
          </div>
        </template>
        <el-input v-model="entity.Icon" placeholder="fontawesome图标">
        </el-input>
      </el-form-item>
      <el-form-item label="代码" prop="Code">
        <el-input v-model="entity.Code" placeholder="请输入菜单代码"></el-input>
      </el-form-item>
      <el-form-item label="排序" prop="SortNumber">
        <el-input
          v-model="entity.SortNumber"
          placeholder="菜单会根据此值由小到大排序"
        ></el-input>
      </el-form-item>
      <div class="row">
        <el-form-item label="设置">
          <el-switch
            inline-prompt
            v-model="entity.IsEnabled"
            active-text="启用"
            inactive-text="停用"
            class="ofa-mr10"
          ></el-switch>
          <el-switch
            inline-prompt
            v-model="entity.IsDefault"
            active-text="默认"
            inactive-text="普通"
          ></el-switch>
        </el-form-item>
      </div>
      <el-form-item label="链接地址" prop="Url" class="url-item">
        <el-input
          v-model="entity.Url"
          class="url-input"
          placeholder="当菜单远程组件时，请输入Web地址"
        ></el-input>
      </el-form-item>
      <el-form-item
        v-show="entity.Type === 1"
        label="Api地址"
        prop="ApiUrl"
        class="url-item"
      >
        <el-input
          v-model="entity.ApiUrl"
          class="url-input"
          placeholder="当菜单远程组件时，请输入Api地址"
        ></el-input>
      </el-form-item>
      <el-form-item label="备注" prop="Remark" class="remark-item">
        <el-input
          show-word-limit
          v-model="entity.Remark"
          type="textarea"
          class="remark-textarea"
          placeholder="请输入菜单备注"
          maxlength="300"
        >
        </el-input>
      </el-form-item>
    </el-form>
    <div class="footer">
      <el-button type="primary" @click="submit">提交</el-button>
      <el-button type="warning" @click="drawerVisiable = false">取消</el-button>
    </div>
  </el-drawer>
  <!-- 弹窗 -->
  <el-dialog
    v-model="dialogVisible"
    :title="'克隆到【' + entity.Name + '】'"
    width="600px"
  >
    <el-alert show-icon title="操作提示" type="warning">
      <ul class="tips">
        <li>勾选的内容会添加成为菜单【{{ entity.Name }}】的子级菜单</li>
        <li>菜单的权限也会同步克隆</li>
      </ul>
    </el-alert>
    <div class="menu-copy-box">
      <el-cascader
        v-model="copyIds"
        :options="list"
        :props="{
          children: 'Children',
          value: 'Id',
          label: 'Name',
          checkStrictly: true,
          multiple: true
        }"
        clearable
      />
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="copy">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted, nextTick } from 'vue'
import { FormRules, ElMessageBox, FormInstance } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import { useBrowserStore } from '@/stores/browserStore'
import { MENU, PERMISSION } from '@/routers/sys-router'
import { GUID } from '@/consts/const'
import { MENU_TYPE, MNUE_OPEN_TYPE } from '@/consts/sys-const'
import API from '@/apis/sys-api'
import { ISysMenuTree } from '@/interfaces/sys/ISysMenuTree'

const userStore = useUserStore()
const browserStore = useBrowserStore()
const loading = ref(false) // 加载中
const drawerVisiable = ref(false) // 抽屉显示
const dialogVisible = ref(false) // 克隆弹窗
const showSortArrow = ref(false) // 显示排序
const total = ref(0) // 总数据量
const searchOption = ref({
  key: ''
}) // 搜索条件
const isAdd = ref(true) // 添加模式
const list = ref<ISysMenuTree[]>([]) // 菜单列表
const entity = ref<ISysMenuTree>(
  Object.assign({ Name: '', IsDefault: false, IsEnabled: true, OpenType: -1 })
) // 实体
const treePath = ref<string[]>([]) // 选中的父级菜单路径
const copyIds = ref<string[]>([]) // 克隆的菜单
const menuForm = ref<FormInstance>() // 表单
const validationRule = reactive<FormRules<any>>({
  Name: [
    { required: true, message: '请先填写菜单名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在2到20个字符', trigger: 'blur' }
  ],
  Type: [{ required: true, message: '请先选择类型', trigger: 'blur' }],
  OpenType: [{ required: true, message: '请先选择打开方式', trigger: 'blur' }],
  ParentId: [{ required: true, message: '请先选择上级菜单', trigger: 'blur' }],
  Remark: [{ min: 0, max: 300, message: '最多输入300个字符', trigger: 'blur' }]
}) // 表单验证

// 权限列表
const permission = computed(() => {
  return userStore.getPermissions(MENU.Url)
})
// 含有根节点的菜单树
const rootTree = computed(() => {
  return [{ Id: GUID, Name: '根节点' }].concat(list.value)
})
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
})

// 获取列表
function get() {
  loading.value = true
  API.getTreeMenus(false, '', searchOption.value.key).then(res => {
    total.value = res.length
    list.value = res
    loading.value = false
  })
}

// 获取类型字符串
function getTypeStr(type: number) {
  return MENU_TYPE.find(w => w.value == type)?.label
}

// 获取父级路径
function getTreePath(id: string) {
  let result = [id]
  const option = findMenu(id, list.value)
  if (option && option.ParentId !== GUID) {
    result = getTreePath(option.ParentId).concat(result)
  }
  return result
}

// 查找指定id菜单
function findMenu(
  id: string,
  sources: ISysMenuTree[]
): ISysMenuTree | undefined {
  for (let i = 0; i < sources.length; i++) {
    const e = sources[i]
    if (e.Id === id) {
      return e
    } else {
      const option = findMenu(id, e.Children)
      if (option) return option
    }
  }
  return undefined
}

// 搜索
function search() {
  nextTick(() => get())
}

// 显示添加抽屉
function showDrawer(item?: ISysMenuTree) {
  if (item) {
    isAdd.value = false
    entity.value = { ...item }
    treePath.value = getTreePath(entity.value.ParentId)
  } else {
    isAdd.value = true
    entity.value = Object.assign({
      IsDefault: false,
      IsEnabled: true,
      OpenType: -1
    })
    nextTick(() => {
      menuForm.value?.resetFields()
    })
  }
  drawerVisiable.value = true
}

// 提交
function submit() {
  menuForm.value?.validate((valid: boolean) => {
    if (valid) {
      if (isAdd.value) {
        API.addMenu(entity.value).then(res => {
          if (res.Status) get()
        })
      } else {
        API.updateMenu(entity.value).then(res => {
          if (res.Status) get()
        })
      }
    }
  })
}

// 删除
function del(item: ISysMenuTree) {
  ElMessageBox.confirm(
    '确认要删除选中菜单？删除后不可恢复，请谨慎操作！',
    '敏感操作提示',
    {
      type: 'warning',
      cancelButtonText: '放弃操作'
    }
  ).then(() => {
    API.delMenu(item.Id).then(res => {
      if (res.Status) get()
    })
  })
}

// 排序
function sort(item: ISysMenuTree, up: boolean) {
  API.sortMenu(item.Id, up).then(res => {
    if (res.Status) {
      get()
    }
  })
}

// 启用菜单
function updateIsEnabled(item: ISysMenuTree) {
  API.updateMenuIsEnabled(item.Id, !item.IsEnabled)
}

// 显示克隆弹窗
function showCopyDialog(item: ISysMenuTree) {
  entity.value = item
  dialogVisible.value = true
}

// 克隆菜单
function copy() {
  const ids = copyIds.value.map(x => x[x.length - 1])
  API.copyMenu(entity.value.Id, ids).then(res => {
    if (res.Status) get()
  })
}

// 修改菜单的打开类型
function changeOpenType(type: number) {
  if (type === 0 || type === 1) {
    entity.value.OpenType = -1
  }
}
// 跳转api页
function toDetailPage(item: ISysMenuTree) {
  browserStore.navigate(PERMISSION, item)
}
</script>

<style lang="scss" scoped>
.menu-page {
  background: #fff;
  border-radius: 20px;
  padding: 20px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }

  .title-box {
    padding: 20px 0;
  }

  .title {
    color: #303133;
    font-size: 1.75rem;
    font-weight: bold;
  }

  .arrow-up,
  .arrow-down {
    transition: all 0.3s ease;
    cursor: pointer;
    font-weight: bold;

    &:hover {
      color: #409eff;
    }
  }

  .arrow-up {
    margin-right: 12px;
  }

  .name-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.icon-label-box {
  display: flex;
  align-items: center;

  svg {
    color: #409eff;
  }
}

.menu-copy-box {
  width: 100%;
  margin: 20px 0;

  :deep(.el-cascader) {
    width: 100%;
  }
}
</style>
