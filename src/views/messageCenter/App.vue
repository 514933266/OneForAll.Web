<template>
  <el-container v-loading="loading" class="ofa-container column">
    <div class="search-box">
      <el-input v-model="searchOption.key" size="small" placeholder="搜索站内信"></el-input>
      <el-button type="primary" class="search-btn" @click="search" size="small">
        <font-awesome-icon fas icon="search"></font-awesome-icon>&nbsp;搜索
      </el-button>
    </div>
    <el-tabs @tab-click="tabClick" type="card">
      <el-tab-pane name="-1" label="全部消息">
        <el-table :data="list" @selection-change="selectionChange" :row-class-name="getRowClass" size="small"
          class="ofa-table">
          <el-table-column width="50">
            <template slot-scope="scope">{{ scope.$index + 1 + (pageIndex - 1) * pageSize }}</template>
          </el-table-column>
          <el-table-column type="selection" width="55" align="center" header-align="center"></el-table-column>
          <el-table-column show-overflow-tooltip prop="Title" label="标题内容">
            <template slot-scope="scope">
              <el-link>{{ scope.row.Title }}</el-link>
            </template>
          </el-table-column>
          <el-table-column label="接收时间" width="160">
            <template slot-scope="scope">{{ new Date(scope.row.CreateTime).toString('yyyy年MM月dd日 hh:mm') }}</template>
          </el-table-column>
          <el-table-column prop="Type" label="类型" width="200">
            <template slot-scope="scope">{{ types[scope.row.Type] }}</template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane name="0">
        <span slot="label">
          未读消息&nbsp;<el-tag v-show="totalUnRead>0" type="danger" size="mini">{{totalUnRead}}</el-tag>
        </span>
        <el-table :data="list" @selection-change="selectionChange" :row-class-name="getRowClass" size="small"
          class="ofa-table">
          <el-table-column width="50">
            <template slot-scope="scope">{{ scope.$index + 1 + (pageIndex - 1) * pageSize }}</template>
          </el-table-column>
          <el-table-column type="selection" width="55" align="center" header-align="center"></el-table-column>
          <el-table-column show-overflow-tooltip prop="Title" label="标题内容">
            <template slot-scope="scope">
              <el-link @click="toFormPage(scope.row)">{{ scope.row.Title }}</el-link>
            </template>
          </el-table-column>
          <el-table-column label="接收时间" width="160">
            <template slot-scope="scope">{{ new Date(scope.row.CreateTime).toString('yyyy年MM月dd日 hh:mm') }}</template>
          </el-table-column>
          <el-table-column prop="Type" label="类型" width="200">
            <template slot-scope="scope">{{ types[scope.row.Type] }}</template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane name="1" label="已读消息">
        <el-table :data="list" @selection-change="selectionChange" :row-class-name="getRowClass" size="small"
          class="ofa-table">
          <el-table-column width="50">
            <template slot-scope="scope">{{ scope.$index + 1 + (pageIndex - 1) * pageSize }}</template>
          </el-table-column>
          <el-table-column type="selection" width="55" align="center" header-align="center"></el-table-column>
          <el-table-column show-overflow-tooltip prop="Title" label="标题内容">
            <template slot-scope="scope">
              <el-link>{{ scope.row.Title }}</el-link>
            </template>
          </el-table-column>
          <el-table-column label="接收时间" width="160">
            <template slot-scope="scope">{{ new Date(scope.row.CreateTime).toString('yyyy年MM月dd日 hh:mm') }}</template>
          </el-table-column>
          <el-table-column prop="Type" label="类型" width="200">
            <template slot-scope="scope">{{ types[scope.row.Type] }}</template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
    <div class="bottom">
      <el-pagination background layout="total, sizes, prev, pager, next, jumper" :current-page="pageIndex"
        :page-sizes="[10, 20, 50, 100]" :page-size="pageSize" :total="total" @size-change="pageSizeChange"
        @current-change="pageIndexChange">
      </el-pagination>
      <div>
        <el-button @click="del" class="ofa-button ofa-button-danger" size="small">删除</el-button>
        <el-button @click="read" class="ofa-button" size="small">标记已读</el-button>
        <el-button @click="readAll" class="ofa-button" size="small">全部已读</el-button>
        <el-button @click="clear" class="ofa-button ofa-button-danger" size="small">全部删除</el-button>
      </div>
    </div>
  </el-container>
</template>

<script>
import API from '../../apis/base-api'
import { MESSAGE_CENTER, MESSAGE_CENTER_FORM } from '../../router/base-router'
import { MESSAGE_TYPE } from '../../assets/js/const'

export default {
  name: MESSAGE_CENTER.name,
  data () {
    return {
      types: MESSAGE_TYPE,
      loading: false,
      searchOption: {
        key: '', // 搜索条件（关键字）
        status: -1 // 类型：-1全部 0未读 1已读
      },
      total: 1, // 总数据量
      pageIndex: 1, // 页码
      pageSize: 10, // 页数
      totalUnRead: 0, // 未读消息数量
      list: [], // 用户列表
      selectionList: [] // 选中行
    }
  },
  beforeRouteEnter (to, from, next) {
    next(vm => vm.init())
  },
  methods: {
    init () {
      if (!this.loading) {
        this.loading = true
        this.get()
        this.getUnReads()
      }
    },
    get () {
      const url = this.$root.getApi(API.KEY, API.PERSONAL_MESSAGE.URL)
      this.axios.get(`${url}/${this.pageIndex}/${this.pageSize}`, {
        params: this.searchOption
      }).then(response => {
        this.total = response.Total
        this.list = response.Items
        this.loading = false
      })
    },
    getUnReads () {
      const url = this.$root.getApi(API.KEY, API.PERSONAL_MESSAGE.UNREAD_COUNT)
      this.axios.get(`${url}`).then(response => {
        this.totalUnRead = response
      })
    },
    pageSizeChange (value) {
      this.pageSize = value
      this.$nextTick(() => this.get())
    },
    pageIndexChange (value) {
      this.pageIndex = value
      this.$nextTick(() => this.get())
    },
    search () {
      this.pageIndex = 1
      this.$nextTick(() => this.get())
    },
    tabClick (tab) {
      this.list = []
      this.searchOption.status = parseInt(tab.name)
      this.get()
      this.getUnReads()
    },
    selectionChange (rows) {
      this.selectionList = rows
    },
    getRowClass ({ row, rowIndex }) {
      if (row.IsRead) return 'is-read-row'
      return ''
    },
    read () {
      if (!this.checkHadSelection()) return false
      const ids = this.selectionList.map(s => s.Id)
      const url = this.$root.getApi(API.KEY, API.PERSONAL_MESSAGE.READ)
      this.axios.patch(url, ids).then(response => {
        if (response.Status) {
          this.get()
          this.getUnReads()
        }
      })
    },
    readAll () {
      this.$confirm('确认要已读全部消息？', '温馨提示', {
        type: 'warning',
        cancelButtonText: '放弃操作'
      }).then(() => {
        const url = this.$root.getApi(API.KEY, API.PERSONAL_MESSAGE.READ)
        this.axios.patch(url, []).then(response => {
          if (response.Status) {
            this.get()
            this.getUnReads()
          }
        })
      })
    },
    clear () {
      this.$confirm('确认要清空全部消息？清空后不可恢复，请谨慎操作！', '温馨提示', {
        type: 'warning',
        cancelButtonText: '放弃操作'
      }).then(() => {
        const url = this.$root.getApi(API.KEY, API.PERSONAL_MESSAGE.URL)
        this.axios.delete(url, []).then(response => {
          if (response.Status) {
            this.get()
            this.getUnReads()
          }
        })
      })
    },
    del () {
      if (!this.checkHadSelection()) return false
      this.$confirm('确认要删除选中消息？删除后不可恢复，请谨慎操作！', '温馨提示', {
        type: 'warning',
        cancelButtonText: '放弃操作'
      }).then(() => {
        const ids = this.selectionList.map(s => s.Id)
        const url = this.$root.getApi(API.KEY, API.PERSONAL_MESSAGE.URL)
        this.axios.delete(url, ids).then(response => {
          if (response.Status) {
            this.get()
            this.getUnReads()
          }
        })
      })
    },
    checkHadSelection () {
      if (this.selectionList.length < 1) {
        this.$message.error('请先选择要操作数据')
        return false
      }
      return true
    },
    toFormPage (entity) {
      this.$root.navigate({ ...MESSAGE_CENTER_FORM, params: entity })
    }
  },
  created () {
    this.init()
  }
}
</script>

<style lang="scss" scoped>
  .search-box {
    display: flex;
    margin-bottom: 10px;

    input { width: 200px ;}

    button {
      margin-left: 5px;
    }
  }

  .bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
  }

/deep/ .ofa-table {
  .el-link {
    font-size: 12px;
  }

  .is-read-row {
    color: #999;
    .el-link {
        color: #999;
        cursor: pointer;                                                                                                                                                                                                                   ;
        &:hover {
            color: #409EFF;
        }
    }
  }
}
</style>
