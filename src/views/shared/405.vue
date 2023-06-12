<template>
  <el-card>
    <div class="error-page-box">
      <div class="error-page"><img src="../../assets/img/error-405.jpg" />
        <div class="error-info">
          <span class="title">Sorry,你要找的页面开了个小差o(╥﹏╥)o</span><br />
          <div class="info">
            <span>可能的原因：</span><br />
            <span>1、请求被拒绝了。</span><br />
            <span>2、页面请求的方式不正确。</span><br />
            <span>3、信号接收站已经不支持过时的消息类型。</span><br />
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script>
export default {
  name: 'Shared405'
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
