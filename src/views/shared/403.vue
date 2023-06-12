<template>
  <el-card>
    <div class="error-page-box">
      <div class="error-page"><img src="../../assets/img/error-403.jpg" />
        <div class="error-info">
          <span class="title">Sorry，被拒绝请求资源啦o(╥﹏╥)o</span><br />
          <div class="info">
            <span>可能的原因：</span><br />
            <span>1、无权访问资源。</span><br />
            <span>2、资源目录不被列出。</span><br />
            <span>3、服务器资源配置异常。</span><br />
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script>
export default {
  name: 'Shared403'
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
