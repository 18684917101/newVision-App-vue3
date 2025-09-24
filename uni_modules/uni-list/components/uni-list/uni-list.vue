<template>
  <view class="uni-list" :class="{'uni-list--border': border}">
    <view v-if="border" class="uni-list__border-top"></view>
    <slot></slot>
    <view v-if="border" class="uni-list__border-bottom"></view>
  </view>
</template>

<script>
/**
 * List 列表组件
 * @description uni-list 是列表组件，包含了 uni-list-item 列表项子组件
 * @tutorial https://ext.dcloud.net.cn/plugin?id=24
 * @property {Boolean} border = [true|false] 是否显示边框
 */
export default {
  name: 'UniList',
  props: {
    border: {
      type: Boolean,
      default: true
    }
  }
}
</script>

<style lang="scss" scoped>
.uni-list {
  background-color: #ffffff;
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.uni-list--border {
  position: relative;
  border-top: 1rpx solid #ebeef5;
  border-bottom: 1rpx solid #ebeef5;
}

.uni-list__border-top {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 1rpx;
  background-color: #ebeef5;
}

.uni-list__border-bottom {
  position: absolute;
  bottom: 0;
  right: 0;
  left: 0;
  height: 1rpx;
  background-color: #ebeef5;
}
</style>