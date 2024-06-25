<template>
  <excel-uploader
    ref="uploaderRef"
    :uploadUrl="uploadUrl"
    :uploading="importing"
    :templateUrl="templateUrl"
    @onSuccess="uploadFinished"
  ></excel-uploader>
  <el-table
    border
    :data="errors"
    height="400px"
    :row-class-name="getRowClassName"
  >
    <el-table-column prop="RowIndex" label="行号" width="60">
      <template #default="scope">
        {{ scope.row.RowIndex + 1 }}
      </template>
    </el-table-column>
    <el-table-column prop="Source[0]" label="工号"></el-table-column>
    <el-table-column prop="Source[1]" label="姓名"></el-table-column>
    <el-table-column prop="Source[2]" label="职级"></el-table-column>
    <el-table-column prop="Source[3]" label="身份证号"></el-table-column>
    <el-table-column prop="Source[4]" label="部门"></el-table-column>
    <el-table-column prop="Source[5]" label="是否主管"></el-table-column>
    <el-table-column prop="Source[6]" label="电话"></el-table-column>
    <el-table-column prop="Source[7]" label="邮箱"></el-table-column>
    <el-table-column prop="Source[8]" label="入职日期"></el-table-column>
    <el-table-column prop="Source[9]" label="员工类型"></el-table-column>
    <el-table-column prop="Source[10]" label="备注"></el-table-column>
    <el-table-column prop="Columns" label="错误原因" width="200">
      <template #default="scope">
        <ul>
          <li v-for="item in scope.row.Columns" :key="item.ColumnIndex">
            <span
              ><label>列</label>{{ item.ColumnIndex + 1 }}：{{
                item.Error
              }}</span
            >
          </li>
        </ul>
      </template>
    </el-table-column>
  </el-table>
</template>

<script lang="ts" setup>
import { ref, computed, defineProps } from 'vue'
import API from '@/apis/oa-api'
import { IBaseMessage } from '@/interfaces/IBaseMessage'

const props = defineProps({
  teamId: {
    type: String,
    default: ''
  }
})
const { teamId } = props
const errors = ref()
const uploaderRef = ref(null) // 上传组件
const templateUrl = API.getImportTeamMemberExcelTempUrl() // 模板下载地址
const importing = ref(false) // 导入中
// 导入地址
const uploadUrl = computed(() => {
  return API.getImportTeamMemberExcelUrl(teamId)
})
// 上传
function uploadFinished(response: IBaseMessage) {
  if (!response.Status) {
    errors.value = response.Data
  } else {
    errors.value = []
  }
}

// 获取行样式
function getRowClassName({ row }: { row: any }) {
  if (row.Columns.length > 0) {
    return 'error-row'
  }
  return ''
}
</script>

<style lang="scss" scoped>
.el-table {
  margin-top: 20px;
  :deep(.error-row) {
    .el-table__cell:last-child {
      color: #f56c6c;
    }
  }
}
</style>
