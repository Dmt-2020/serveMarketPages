<template>
  <div class="apply-box">
    <!-- 订购 -->
    <div class="apply-book" v-if="bookApplyMesages.appType === 1">
      <span>收货地址</span>
      <el-button
        type="primary"
        size="mini"
        class="float-right"
        @click="jumpToUserCenter"
        >管理地址</el-button
      >
      <div class="apply-book-address">
        <el-radio-group v-model="deliveryAddress" size="medium">
          <el-radio
            v-for="address in computeAddress"
            :label="address.recId"
            :key="address.recId"
            border
          >
            <span class="inline_block">{{ address.receiverName }}</span>
            <span class="inline_block">{{ address.receiverPhone }}</span>
            <span class="inline_block">{{ address.regionAddress }}</span>
            <span class="inline_block">{{ address.detailAddress }}</span>
            <span v-if="address.primaryFlag" class="default_address">
              默认地址
            </span>
          </el-radio>
        </el-radio-group>
        <div class="more_address" @click="isMoreAddress = !isMoreAddress">
          {{ isMoreAddress ? "收起地址" : "更多地址" }}
          <svg
            :class="['icon', { rotate_icon: isMoreAddress }]"
            aria-hidden="true"
          >
            <use xlink:href="#icon-gengduo"></use>
          </svg>
        </div>
      </div>
    </div>
    <div class="apply-book" v-loading="loading">
      <span>订单信息</span>
      <div class="apply-book-content">
        <img :src="getImgUrl(bookApplyMesages.appImg)" alt="" />
        <div class="right-text">
          <span class="book-title">应用名称</span>
          <span>{{ bookApplyMesages.appName }}</span
          ><br />
          <span class="book-title">订购规格 </span>
          <span>{{ bookApplyMesages.specName }}</span>
          <p v-if="bookApplyMesages.appType !== 1">
            <span class="book-title">订购方式 </span>
            <span>{{
              bookApplyMesages.subscribeMode == 0
                ? bookApplyMesages.subscribeDays +
                  "天(" +
                  computedMode(bookApplyMesages.subscribeMode) +
                  ")"
                : computedMode(bookApplyMesages.subscribeMode)
            }}</span>
          </p>
          <p>
            <span class="book-title">订购价格 </span>
            <span>￥{{ bookApplyMesages.appAmount }}</span>
          </p>
          <p v-if="bookApplyMesages.appType === 1">
            <span class="book-title">订购数量 </span>
            <span>{{ bookApplyMesages.bookNumber }} 件</span>
          </p>
          <!-- <span class="book-title">发票信息 </span> -->
          <!-- <div @click="isShowInvoice = true">+ 点击新建发票信息</div> -->
        </div>
        <el-input
          type="textarea"
          placeholder="备注:"
          v-model="remark"
          maxlength="100"
          show-word-limit
        >
        </el-input>
      </div>
    </div>

    <div class="bottom-box">
      <div class="float-right">
        <div class="protocol">
          <span
            >订购金额：<span>￥{{ lastPay() }}</span></span
          >
          <!-- <el-checkbox v-model="checked">点击勾选同意 </el-checkbox>
          <span>《xxxxxx》</span> -->
        </div>
        <!-- <el-button size="small" @click="backToDetail">返回</el-button> -->
        <el-button type="primary" size="medium" @click="bookBillEvent"
          >提交订单</el-button
        >
      </div>
    </div>
  </div>
</template>
<script>
import {
  submitBill,
  informBack,
  queryForSubscribe,
  queryForAddressInfo,
} from "@/api/frontApi.js";
// import { mapState } from "vuex";
import { filterSpec, getImgUrl } from "@/utils/common.js";
import { throttle2 } from "@/utils/tools.js";
export default {
  props: {
    // refreshBookApplyDetail: {
    //   type: Object,
    //   default: () => ({}),
    // },
  },
  data() {
    return {
      loading: false,
      remark: "",
      checked: "",
      isShowInvoice: false,
      isShowPay: false,
      bookBillData: {},
      applyId: "", //保存的跳转前的应用id
      orderIdAfterPay: "", //打开支付界面后端返给的订单号(用来通知后端)
      bookApplyMesages: {},
      deliveryAddress: "",
      isMoreAddress: false, //是否显示更多地址
      addressList: [], //地址数组
    };
  },
  mounted() {
    this.applyId = this.$route.query.id;
    if (typeof this.bookApplyDetail === "string") {
      this.bookApplyMesages = JSON.parse(this.bookApplyDetail);
    } else {
      this.bookApplyMesages = this.bookApplyDetail;
    }
    // if (this.active === 0) {
    // 只在提交订单流程中刷新时才请求数据
    this.queryForSubscribeMethod().then(() => {
      // if (this.bookApplyMesages.appType === 1) {
      this.getAddressList();
      // }
    });
    // }
  },
  methods: {
    closeDialog(val) {
      this.isShowInvoice = val;
    },
    bookBillEvent: throttle2(function () {
      this.submitBill();
    }, 1000),
    // 刷新时重新请求资源
    async queryForSubscribeMethod() {
      try {
        const tempData = {
          specId: this.bookApplyMesages["specId"],
          specPriceId: this.bookApplyMesages["specPriceId"],
        };
        this.loading = true;
        const { data } = await queryForSubscribe(tempData);
        this.loading = false;
        for (const o in data) {
          if (o !== "orderFrom") {
            this.$set(this.bookApplyMesages, o, data[o]);
          }
        }
      } catch (error) {
        this.$message({
          type: "error",
          message: error.message,
        });
      }
    },
    // 获取收货地址列表
    async getAddressList() {
      const { data } = await queryForAddressInfo();
      this.addressList = data || [];
      // 选中默认地址
      this.deliveryAddress = this.addressList[0].recId;
    },
    async submitBill() {
      let checkedAddress = null;
      if (this.bookApplyMesages.appType === 1) {
        checkedAddress = this.addressList.find((item) => {
          return item.recId === this.deliveryAddress;
        });
      }

      const temp = {
        ...this.bookApplyMesages,
        // 提交订单时需传商户id
        sid: this.$store.state.accountInfo["sub"].user_no,
        receivable: this.lastPay(),
        appAmount: this.lastPay(),
        remark: this.remark,
        num: this.bookApplyMesages.bookNumber,
        addressId: checkedAddress && checkedAddress.recId,
        detailAddress: checkedAddress && checkedAddress.detailAddress,
        receiverName: checkedAddress && checkedAddress.receiverName,
        receiverPhone: checkedAddress && checkedAddress.receiverPhone,
        regionAddress: checkedAddress && checkedAddress.regionAddress,
      };
      let payPage = null;
      try {
        const { data } = await submitBill(temp);
        // if (data) {
        if (data.indexOf("http") !== -1) {
          // 将返回的url中的订单号获取保存
          const t1 = data.split("&");
          //待定， this.orderIdAfterPay这个值要传给paidPage页面获取支付成功之后的订单信息
          this.orderIdAfterPay = t1[t1.length - 1].split("=")[1];
          //打开支付界面
          // this.$emit("updateActive", 2, this.orderIdAfterPay);
          payPage = window.open(data, "_self");
          // 判断是否关闭支付页
          const _context = this;
          const timer = setInterval(function () {
            if (payPage !== null && payPage.closed) {
              _context.informBackMethod();
              clearInterval(timer);
            }
          }, 1000);
        } else {
          // 支付零元时直接跳转支付成功页面
          this.orderIdAfterPay = data;
          // 解决在订购成功页面刷新时没有orderId，active被初始化为0的问题
          this.$router.push({
            path: `/usersystem/bookapply`,
            query: { id: this.applyId, orderId: this.orderIdAfterPay },
          });
        }
        // }
      } catch (error) {
        this.$message({
          type: "error",
          message: error.message,
        });
      }
    },
    // 关闭界面通知后端
    async informBackMethod() {
      await informBack(JSON.stringify(this.orderIdAfterPay));
    },
    getImgUrl(val) {
      return getImgUrl(val);
    },
    // 计算最终的结算金额
    lastPay() {
      const lastPaid =
        this.bookApplyMesages.bookNumber == 1
          ? this.bookApplyMesages.appAmount
          : this.bookApplyMesages.appAmount * this.bookApplyMesages.bookNumber;
      return lastPaid;
    },
    computedMode(val) {
      return filterSpec(val);
    },
    jumpToNew() {
      this.$router.push("/usersystem/search");
    },
    // 管理地址功能跳转用户信息界面
    jumpToUserCenter() {
      this.$router.push("/usersystem/sellerCenter/usercenter");
    },
  },
  computed: {
    bookApplyDetail() {
      return this.$store.state.bookApplyDetail;
    },
    computeAddress() {
      if (!this.isMoreAddress) {
        const temp = this.addressList.slice(0, 1);
        return temp;
      }
      return this.addressList;
    },
  },
};
</script>
<style lang="scss" scoped>
.apply-box::v-deep {
  overflow: hidden;
  .float-right {
    float: right;
  }
  .apply-book-address {
    .el-radio {
      display: block;
      margin: 0px;
      margin-bottom: 20px;
      .inline_block {
        display: inline-block;
        margin-right: 10px;
      }
      // 默认地址四个字的样式
      .default_address {
        background: orange;
        color: white;
        padding: 4px 8px;
      }
    }
    .el-radio:hover {
      color: #0ea5ff;
    }
    .more_address {
      width: 100px;
      cursor: pointer;
      font-size: 14px;
      .icon {
        width: 20px;
      }
      .rotate_icon {
        transform: rotate(180deg);
      }
    }
    .more_address:hover {
      color: #0ea5ff;
    }
  }
  .apply-book {
    background-color: white;
    padding: 16px 24px 24px 24px;
    overflow: hidden;
    margin: 10px 0;
    .apply-book-content {
      border: 1px solid #ebedf0;
      padding: 20px 24px 0 24px;
    }
    > span {
      display: inline-block;
      margin-bottom: 22px;
      font-size: 20px;
      font-weight: 600;
    }
    img {
      width: 100px;
      height: 100px;
      object-fit: fill;
      vertical-align: top;
    }
    .right-text {
      position: relative;
      width: calc(100% - 320px);
      margin-left: 10px;
      font-size: 14px;
      display: inline-block;
      line-height: 25px;
      .book-title {
        display: inline-block;
        width: 80px;
        color: #8c8c8c;
      }
      p {
        margin: 0;
      }
    }
    .el-textarea__inner {
      border: none;
      border-top: 1px solid #ebedf0;
      margin-top: 10px;
    }
  }
  .bottom-box {
    background-color: white;
    padding: 15px;
    border-radius: 4px;
    overflow: hidden;
    .float-right {
      float: right;
    }
    .protocol {
      display: inline-block;
      text-align: right;
      line-height: 25px;
      vertical-align: middle;
      margin-right: 10px;
      > span:nth-child(1) {
        display: block;
        font-size: 14px;
        span {
          color: #f87039;
          font-size: 24px;
        }
      }
      .el-checkbox__label {
        color: #8c8c8c;
        font-size: 12px;
      }
      // > span:last-child {
      //   color: #0ea5ff;
      //   font-size: 12px;
      //   cursor: pointer;
      // }
    }
  }
}
</style>
