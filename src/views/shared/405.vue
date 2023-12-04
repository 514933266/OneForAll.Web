<template>
  <div class="error-page-box">
    <div class="error-page">
      <img src="../../assets/img/error-500.svg" />
      <div class="error-text">访问失败</div>
      <div class="error-desc">
        <span>错误代码：</span>
        <span class="error-code">405</span>
        <span>错误的请求方式</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Shared405'
}
</script>
