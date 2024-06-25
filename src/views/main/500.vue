<template>
	<el-container class="error-page">
		<el-main class="content-box">
			<img src="@/assets/images/error-500.svg" />
			<div class="error-text">请求出错</div>
			<div class="error-desc">
				<span class="error-code">错误代码：500</span>
				<span>服务器遇到了意外情况，导致无法完成请求</span>
			</div>
		</el-main>
	</el-container>
</template>

<style lang="scss" scoped>
.error-page {
	width: 100%;
	height: 100%;
}
.content-box {
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;

	.error-text {
		margin-top: 13px;
		font-size: 16px;
		font-weight: 500;
		color: #909399;
		margin-bottom: 6px;
	}

	.error-desc {
		font-size: 12px;
		font-weight: 500;
		color: #909399;
	}

	.error-code {
		color: #f56c6c;
		margin-right: 6px;
	}
}
</style>