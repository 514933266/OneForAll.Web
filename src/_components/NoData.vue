<template>
  <div class="error-page-box">
    <div class="error-page">
      <img src="../assets/img/error-empty.jpg" />
      <div class="error-info error-empty">
        <label>
          <slot>{{text}}</slot>
        </label><br />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'nodata',
  props: {
    text: {
      type: String,
      default: '没有更多数据'
    }
  }
}
</script>
<style lang="scss" scoped>
.error-page-box {
  width: 100%;
  height: 100%;
  color: #C0C4CC;
}

.error-page {
  display: flex;
  align-items: center;
  margin: 0 auto;
  padding-top: 5%;
  width: 100%;
  height: 100%;

  img {
    width: 35%;
  }
}

.error-info {
  flex: 1;
  font-size: 1.25rem;
  font-weight: normal;
  text-align: left;
}
</style>
