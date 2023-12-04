<template>
    <div class="error-page-box">
      <div class="error-page">
        <img src="../../assets/img/error-403.svg" />
        <div class="error-text">访问失败</div>
        <div class="error-desc">
          <span>错误代码：</span>
          <span class="error-code">415</span>
          <span>不支持以当前方式请求</span>
        </div>
      </div>
    </div>
  </template>

<script>
export default {
  name: 'Shared415'
}
</script>
