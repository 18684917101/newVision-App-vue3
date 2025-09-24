<template>
  <view class="uni-list-item" :class="{'uni-list-item--disabled': disabled}" @click="onClick">
    <view class="uni-list-item__container" :class="direction === 'column' ? 'uni-list--border' : ''">
      <view class="uni-list-item__content">
        <view class="uni-list-item__content-main">
          <view v-if="showExtraIcon" class="uni-list-item__extra-icon">
            <uni-icons :type="extraIcon.type" :size="extraIcon.size || 20" :color="extraIcon.color || '#666'"></uni-icons>
          </view>
          <view class="uni-list-item__header">
            <view class="uni-list-item__title">
              <text class="uni-list-item__title-text">{{ title }}</text>
            </view>
            <view v-if="note" class="uni-list-item__note">
              <text class="uni-list-item__note-text">{{ note }}</text>
            </view>
          </view>
        </view>
        <view class="uni-list-item__content-right">
          <view v-if="rightText" class="uni-list-item__right-text">
            <text>{{ rightText }}</text>
          </view>
          <view v-if="showArrow" class="uni-list-item__arrow">
            <uni-icons type="arrowright" size="16" color="#bbb"></uni-icons>
          </view>
          <view v-if="showSwitch" class="uni-list-item__switch">
            <switch :checked="switchChecked" @change="onSwitchChange" />
          </view>
          <view v-if="showBadge" class="uni-list-item__badge">
            <uni-badge :text="badgeText" :type="badgeType"></uni-badge>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { computed } from 'vue'

/**
 * ListItem 列表子组件
 * @description uni-list-item 是 uni-list 的子组件，提供了丰富的配置选项
 * @tutorial https://ext.dcloud.net.cn/plugin?id=24
 * @property {String} title 标题
 * @property {String} note 描述
 * @property {String} rightText 右侧文字
 * @property {Boolean} disabled = [true|false] 是否禁用
 * @property {Boolean} showArrow = [true|false] 是否显示箭头图标
 * @property {Boolean} showBadge = [true|false] 是否显示数字角标
 * @property {String} badgeText 数字角标内容
 * @property {String} badgeType = [default|primary|success|warning|error] 数字角标类型
 * @property {Boolean} showSwitch = [true|false] 是否显示Switch
 * @property {Boolean} switchChecked = [true|false] Switch是否被选中
 * @property {Boolean} showExtraIcon = [true|false] 左侧是否显示扩展图标
 * @property {Object} extraIcon 扩展图标参数 {type: 'type', size: 20, color: '#666'}
 * @property {String} direction = [row|column] 排列方向
 * @event {Function} click 点击 uni-list-item 触发事件
 * @event {Function} switchChange 点击切换 Switch 时触发
 */
export default {
  name: 'UniListItem',
  emits: ['click', 'switchChange'],
  props: {
    direction: {
      type: String,
      default: 'row'
    },
    title: {
      type: String,
      default: ''
    },
    note: {
      type: String,
      default: ''
    },
    rightText: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    showArrow: {
      type: Boolean,
      default: true
    },
    showBadge: {
      type: Boolean,
      default: false
    },
    badgeText: {
      type: String,
      default: ''
    },
    badgeType: {
      type: String,
      default: 'default'
    },
    showSwitch: {
      type: Boolean,
      default: false
    },
    switchChecked: {
      type: Boolean,
      default: false
    },
    showExtraIcon: {
      type: Boolean,
      default: false
    },
    extraIcon: {
      type: Object,
      default() {
        return {
          type: 'contact',
          size: 20,
          color: '#666'
        }
      }
    }
  },
  setup(props, { emit }) {
    const onClick = () => {
      if (!props.disabled) {
        emit('click')
      }
    }

    const onSwitchChange = (e) => {
      emit('switchChange', e.detail)
    }

    return {
      onClick,
      onSwitchChange
    }
  }
}
</script>

<style lang="scss" scoped>
.uni-list-item {
  position: relative;
  width: 100%;
  flex-direction: column;
}

.uni-list-item--disabled {
  opacity: 0.3;
}

.uni-list-item__container {
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background-color: #fff;
  border-bottom: 1rpx solid #ebeef5;
}

.uni-list--border {
  border-bottom: 1rpx solid #ebeef5;
}

.uni-list-item__content {
  display: flex;
  padding: 12px 0;
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;
}

.uni-list-item__content-main {
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
}

.uni-list-item__content-right {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
}

.uni-list-item__extra-icon {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
}

.uni-list-item__header {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  overflow: hidden;
}

.uni-list-item__title {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.uni-list-item__title-text {
  font-size: 16px;
  color: #3b4144;
  overflow: hidden;
}

.uni-list-item__note {
  display: flex;
  margin-top: 6rpx;
  flex-direction: row;
  align-items: center;
}

.uni-list-item__note-text {
  font-size: 12px;
  color: #999;
  overflow: hidden;
}

.uni-list-item__right-text {
  font-size: 15px;
  color: #999;
  margin-right: 5px;
}

.uni-list-item__arrow {
  margin-left: 12px;
  margin-right: 3px;
}

.uni-list-item__switch {
  margin-left: 12px;
}

.uni-list-item__badge {
  margin-left: 12px;
}
</style>