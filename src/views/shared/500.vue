<template>
  <el-card>
    <div class="error-page-box">
      <div class="error-page clearfix"><img src="../../assets/img/error-500.jpg" />
        <div class="error-info">
          <span class="title">Sorry，服务器啦o(╥﹏╥)o</span><br />
          <div class="info">
            <span>可能的原因：</span><br />
            <span>1、服务器炸了。</span><br />
            <span>2、网络信号连接中断。</span><br />
            <span>3、访问的人太多，忙不过来啦。</span><br />
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script>
export default {
  name: 'Shared500'
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
