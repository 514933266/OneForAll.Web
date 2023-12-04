<template>
  <div>
    <div class="backlog-top">
      <div>
        <img src="./../../../assets/img/tudo.png" alt="">
        <span class="backlog-top-name">待办事项</span>
      </div>
      <div class="backlog-top-right">
        <span>查看全部</span>
        <i class="el-icon-arrow-right"></i>
      </div>
    </div>
    <div class="backlog-tab">
      <div :class="{act:actrtab==1}" @click="actrtab=1">待处理</div>
      <div :class="{act:actrtab==2}" @click="actrtab=2">已处理</div>
    </div>
    <div class="backlog-list">
      <div class="none-box">
        <el-empty v-if="list.length < 1" description="暂无事项" :image-size="100"></el-empty>
      </div>
      <div class="backlog-list-item" v-for="item in list" :key="item.id">
        <div class="backlog-list-top">
          <div class="backlog-list-top-left">
            <span>入职处理事项</span>
            <img src="./../../../assets/img/new.png" alt="">
          </div>
          <div class="backlog-list-top-right">
            <span>2023-09-12 12:00</span>
            <el-dropdown trigger="click">
              <img src="./../../../assets/img/mao.svg" alt="">
              <el-dropdown-menu slot="dropdown" class="dropdown-back">
                <div class="menu-box">
                  <div>去处理</div>
                  <div>关闭</div>
                </div>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>
        <div class="backlog-list-desc"></div>
        <div class="backlog-list-line"></div>
      </div>
    </div>
  </div>
</template>

<script>
// 待办事项
export default {
  name: 'PersonalBacklog',

  data () {
    return {
      actrtab: 1,
      list: []
    }
  },
  methods: {

  },
  created () {

  }
}
</script>

<style lang="scss" scoped>
.dropdown-back.el-dropdown-menu {
  padding: 0;
  border-radius: 0px;
  box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.15);
}

.backlog-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 19px 0 14px;
  padding: 16px 0 28px;

  >div {
    display: flex;
    align-items: center;
  }

  &-name {
    font-size: 18px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);
    line-height: 24px;
    margin-right: 7px;
  }

  &-num {
    font-size: 16px;
    font-weight: 400;
    color: #7f8fa4;
    line-height: 24px;
  }

  img {
    width: 24px;
    height: 24px;
    margin-right: 9px;
  }

  &-right {
    font-size: 14px;
    font-weight: 400;
    color: #409eff;
    line-height: 22px;
    cursor: pointer;
  }
}

.backlog-tab {
  display: flex;
  align-items: center;
  margin-left: 14px;

  >div {
    padding: 5px 15px;
    background: #ffffff;
    border-radius: 2px;
    border: 1px solid #d9d9d9;
    font-size: 14px;
    font-weight: 400;
    color: rgba(0, 0, 0, 0.65);
    line-height: 22px;
    cursor: pointer;
  }

  :nth-child(1) {
    border-right: none;
    border-top-right-radius: 0px;
    border-bottom-right-radius: 0px;
  }

  :nth-child(2) {
    border-left: none;
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
  }

  .act {
    color: #409eff;
    border: none;
    border: 1px solid #409eff;
  }
}

.backlog-list {
  height: 170px;
  overflow-x: hidden;
  overflow-y: auto;

  &-item {
    margin: 0 19px 0 14px;
  }

  &-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 15px 0 7px;

    &-left {
      display: flex;
      align-items: center;

      >span {
        font-size: 14px;
        font-weight: 500;
        color: #354052;
        line-height: 22px;
      }

      >img {
        width: 26px;
        height: 16px;
        margin-left: 6px;
      }
    }

    &-right {
      display: flex;
      align-items: center;
      font-size: 14px;
      font-weight: 400;
      color: #7f8fa4;
      line-height: 22px;

      img {
        margin-left: 14px;
        width: 20px;
        height: 20px;
        cursor: pointer;
      }
    }
  }

  &-desc {
    padding-right: 20px;
    font-size: 14px;
    font-weight: 400;
    color: #354052;
    line-height: 22px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 14px;
  }

  &-line {
    margin: 0 11px 0 16px;
    height: 1px;
    background: #e9e9e9;
  }
}

.backlog-list-item:last-child .backlog-list-line {
  background: transparent;
}

.menu-box {
  padding: 0 8px;

  >div {
    box-sizing: border-box;
    width: 126px;
    padding: 12px 21px;
    border-bottom: 1px solid #e8e8e8;
    cursor: pointer;
    font-size: 14px;
    font-family: PingFangSC-Regular, PingFang SC;
    font-weight: 400;
    color: #354052;
    line-height: 22px;
  }
}

.menu-box div:last-child {
  border-bottom: 1px solid transparent;
}

.none-box {
  .el-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
}
</style>
