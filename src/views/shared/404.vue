<template>
  <el-card>
    <div class="error-page-box">
      <div class="error-page"><img src="../../assets/img/error-404.jpg" />
        <div class="error-info">
          <span class="title">Sorry,你要找的页面已经飞到太空啦o(╥﹏╥)o</span><br />
          <div class="info">
            <span>可能的原因：</span><br />
            <span>1、网络信号连接中断。</span><br />
            <span>2、你要找的链接已经不存在了喔。</span><br />
            <span>3、被外星人抢走啦。</span><br />
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script>
export default {
  name: 'Shared404'
}
</script>

<style lang="scss">
.error-page-box {
  width: 100%;
  color: #999;
}

.error-page {
  display: flex;
  align-items: center;
  margin: 0 auto;
  padding-top: 5%;
  width: 60%;

  img {
    width: 35%;
  }
}

.error-info {
  flex: 1;
  text-align: left;
  font-size: 1rem;

  .title {
    font-size: 1.25rem;
  }

  .info {
    margin-top: 1rem;

    span {
      display: inline-block;
      padding: .25rem;
    }
  }
}
</style>
