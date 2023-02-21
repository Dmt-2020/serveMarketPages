<template>
  <headerComponent @getSearchInput="searchEvent" :inputParam="inputParam">
    <template slot="mainContent">
      <div class="main-left"></div>
      <div class="main-middle">
        <div class="middle-content">
          <!-- 筛选 -->
          <div class="filter-apply">
            <!-- <h4>筛选项</h4> -->
            <div class="tags-row">
              <span class="tags-title">一级分类</span>
              <ul class="tags-list" @click="clickParent">
                <!-- <li key="-9999" data-index="-9999">全部</li> -->
                <template v-for="cls in classIds">
                  <el-tag
                    v-if="checkTrue(cls.parentClass)"
                    :key="cls.parentClass.classId"
                    :disable-transitions="true"
                    size="medium"
                    closable
                    @close="closeParent(cls)"
                  >
                    {{ cls.parentClass.className }}
                  </el-tag>
                  <li
                    v-else
                    :key="cls.parentClass.classId"
                    :data-index="cls.parentClass.classId"
                  >
                    {{ cls.parentClass.className }}
                  </li>
                </template>
              </ul>
            </div>
            <div class="tags-row" v-if="subClassIds.length > 0">
              <span class="tags-title">二级分类</span>
              <ul class="tags-list" @click="clickSub">
                <template v-for="sub in subClassIds">
                  <el-tag
                    v-if="checkTrue(sub)"
                    :key="sub.classId"
                    :disable-transitions="true"
                    size="small"
                    closable
                    @close="closeSub(sub)"
                  >
                    {{ sub.className }}
                  </el-tag>
                  <li v-else :key="sub.classId" :data-index="sub.classId">
                    {{ sub.className }}
                  </li>
                </template>
              </ul>
            </div>
            <div class="tags-row">
              <span class="tags-title">价格</span>
              <ul class="tags-list" @click="isSupportClick">
                <template v-for="item in isSupportData">
                  <el-tag
                    v-if="checkTrue(item)"
                    :key="item.value"
                    :disable-transitions="true"
                    size="small"
                    closable
                    @close="closeTryout(item)"
                  >
                    {{ item.text }}
                  </el-tag>
                  <li v-else :key="item.value" :data-index="item.value">
                    {{ item.text }}
                  </li>
                </template>
              </ul>
            </div>
          </div>
          <!-- 检索结果 -->
          <div class="middle-apply" v-loading="loading">
            <div v-if="applyData.length <= 0" class="empty_box">暂无数据</div>
            <div v-else>
              <el-row :gutter="20">
                <template v-for="item in applyData">
                  <el-col :key="item.recId">
                    <div
                      class="grid-content bg-purple"
                      @click="getApplyDetails(item.recId)"
                    >
                      <div class="img-box">
                        <img
                          :src="transferImgUrl(item.imgUrl)"
                          alt="应用图片"
                          width="100%"
                          height="100%"
                        />
                      </div>
                      <div class="apply-name">
                        <span>{{ item.appName }}</span>
                        <span>{{ item.appShortDesc }}</span>
                        <span>￥ {{ item.priceScope }}</span>
                      </div>
                    </div>
                  </el-col>
                </template>
              </el-row>
            </div>
          </div>
        </div>
      </div>
      <div class="main-right"></div>
    </template>
  </headerComponent>
</template>
<script>
import { searchApplication } from "@/api/frontApi.js";
import { getClassIds } from "@/api/backApi.js";
import headerComponent from "@/components/header.vue";
export default {
  components: {
    headerComponent,
  },
  data() {
    return {
      inputParam: "",
      loading: false,
      applyData: [], //检索出来的应用数据
      classIds: [], //一级分类数组
      subClassIds: [], //二级分类数组
      firstClassId: null, //一级分类
      secondClassId: null, //二级分类
      isSupportTry: null, //是否支持试用
      isSearchByInput: false, //判断是否通过搜索框输入
      pageConfig: {
        current: 1,
        size: 10,
      },
      isAchiveBottom: false, //是否滚到底部，避免重复加载
      isSupportData: [
        // { value: -9999, text: "全部", isChecked: false },
        { value: 0, text: "付费", isChecked: false },
        { value: 1, text: "免费", isChecked: false },
      ]
    };
  },
  created() {
    this.getClassIdsMethod().then(() => {
      const urlparam = this.$route.query;
      if (urlparam.searchParam1 || urlparam.searchParam2) {
        // 从首页跳过来携带分类参数
        this.firstClassId = urlparam["searchParam1"];
        this.secondClassId = urlparam["searchParam2"];
        this.setCheckedFirstClass();
        this.setCheckedSecondClass();
      } else {
        this.inputParam = urlparam.keyword ? urlparam.keyword : "";
        this.searchApplicationMethod();
      }
      window.addEventListener("scroll", this.scrollRequestData);
      // this.scrollRequestData();
    });
  },
  beforeDestroy() {
    //  滚动事件要销毁
    window.removeEventListener("scroll", this.scrollRequestData);
  },
  methods: {
    async searchApplicationMethod() {
      const temp = {
        keyword: this.inputParam ? this.inputParam : null,
        probationary:
          parseInt(this.isSupportTry) === -9999 ? null : this.isSupportTry,
        firstLevelClassId: this.firstClassId,
        secondLevelClassId: this.secondClassId,
        current: this.pageConfig.current,
        size: this.pageConfig.size,
        status: 10,
      };
      this.loading = true;
      const { data } = await searchApplication(temp);
      if (this.pageConfig.current === 1) {
        // 第一页就直接赋值
        this.applyData = data.records;
      } else {
        if (data.records.length > 0) {
          this.applyData.push(...data.records);
          this.isAchiveBottom = false;
        } else {
          this.$message.warning("没有更多数据了");
        }
      }
      this.loading = false;
    },
    // 滚动加载数据
    scrollRequestData() {
      let scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop;
      let clientHeight =
        document.documentElement.clientHeight || document.body.clientHeight;
      let scrollHeight =
        document.documentElement.scrollHeight || document.body.scrollHeight;
        // 整个页面的高度(包括滚动) - 已滚动高度 - 可视区高度
      let bottomPx = scrollHeight - (scrollTop + clientHeight) <= 50;
      // 距离底部50px时触发
      if (bottomPx && !this.isAchiveBottom) {
        this.isAchiveBottom = true;
        this.pageConfig.current++;
        this.searchApplicationMethod();
      }
    },
    // 初始化分页,加载滚动数据
    initPageAndScroll() {
      this.pageConfig = {
        current: 1,
        size: 10,
      };
      // 切换分类时要重启滚动加载
      this.isAchiveBottom = false;
    },
    searchEvent(val) {
      // 是否手动输入，以便取消筛选项的勾选
      this.isSearchByInput = true; //在筛选项中置为false
      this.inputParam = val;
      this.initPageAndScroll();
      this.searchApplicationMethod();
    },
    getApplyDetails(val) {
      this.$router.push({
        path: "/usersystem/applydetails",
        query: { id: val },
      });
    },
    //获取分类数据
    async getClassIdsMethod() {
      const { data } = await getClassIds();
      if (data) {
        //追加isChecked字段
        this.classIds = data.map((item) => {
          this.$set(item.parentClass, "isChecked", false);
          item.subClassList.forEach((sub) => {
            this.$set(sub, "isChecked", false);
          });
          return item;
        });
        // 手动选中一级分类中的第一个
        // this.firstClassId = this.classIds[0].parentClass.classId
      }
    },
    clickParent(e) {
      if (e.target.nodeName.toLowerCase() === "li") {
        this.firstClassId = e.target.dataset.index;
        // 修改对应分类里的isChecked的值
        this.setCheckedFirstClass();
        //初始化事件在监听函数里
        // 只有在点击一级时才清空二级分类,从首页进入时不能清空二级分类
        this.secondClassId = null;
      }
    },
    // 设置一级分类选中的样式
    setCheckedFirstClass() {
      this.classIds.forEach((item) => {
        if (item.parentClass.classId === parseInt(this.firstClassId)) {
          item.parentClass.isChecked = true;
        } else {
          item.parentClass.isChecked = false;
        }
      });
    },
    // 一级分类的关闭事件
    closeParent(val) {
      //会走监听事件
      val.parentClass.isChecked = false;
      // 将所有二级分类项置为未选中
      val.subClassList.forEach((sub) => {
        sub.isChecked = false;
      });
      this.initPageAndScroll();
      // 将一级分类的值变为空
      this.firstClassId = null;
      this.secondClassId = null;
    },
    clickSub(e) {
      if (e.target.nodeName.toLowerCase() === "li") {
        this.secondClassId = e.target.dataset.index;
        this.initPageAndScroll();
        // 修改对应分类里的isChecked的值
        this.setCheckedSecondClass();
        this.searchApplicationMethod();
      }
    },
    // 设置二级分类选中的样式
    setCheckedSecondClass() {
      this.classIds.forEach((item) => {
        if (item.parentClass.classId === parseInt(this.firstClassId)) {
          item.subClassList.forEach((sub) => {
            if (sub.classId === parseInt(this.secondClassId)) {
              sub.isChecked = true;
            } else {
              sub.isChecked = false;
            }
          });
        }
      });
    },
    closeSub(val) {
      val.isChecked = false;
      this.secondClassId = null;
      this.initPageAndScroll();
      this.searchApplicationMethod();
    },

    // 价格点击事件
    isSupportClick(e) {
      if (e.target.nodeName.toLowerCase() === "li") {
        this.isSupportTry = e.target.dataset.index;
        this.isSupportData.forEach((item) => {
          if (item.value === parseInt(this.isSupportTry)) {
            item.isChecked = true;
          } else {
            item.isChecked = false;
          }
        });
        this.initPageAndScroll();
        this.searchApplicationMethod();
      }
    },
    closeTryout(val) {
      val.isChecked = false;
      this.isSupportTry = -9999;
      this.initPageAndScroll();
      this.searchApplicationMethod();
    },
    // // 清空价格选项
    // clearPriceItem(){
    //    //  将价格选择清空
    //     this.isSupportData.map((item) => {
    //       if (item.value === parseInt(this.isSupportTry)) {
    //         item.isChecked = false;
    //       }
    //     });
    //     this.isSupportTry = null
    // },
    checkTrue(val) {
      if (val && val.isChecked) {
        // 存在并且为true,显示选中的tag
        return true;
      }
      return false;
    },
    transferImgUrl(val) {
      if (val) {
        return JSON.parse(val).url;
      }
      // 默认图片
      return require("@/assets/url_default.png");
    },
  },
  watch: {
    // 监听一级分类变化时改变二级分类数据
    firstClassId: {
      handler: function (val, oldVal) {
        // 将切换之前的一级分类下选中的二级分类取消选中
        if (oldVal !== null) {
          this.classIds.map((item) => {
            if (item.parentClass.classId == oldVal) {
              item.subClassList.forEach((sub) => {
                sub.isChecked = false;
              });
            }
          });
        }
        // 找到选中的一级分类下的二级分类
        const temp = this.classIds.find((item) => {
          return item.parentClass.classId === parseInt(val);
        });
        this.subClassIds = temp ? temp.subClassList : [];
        this.initPageAndScroll();
        this.searchApplicationMethod();
      },
    },
    // 首字母筛选项
    // capitalLetter() {
    //   const capital = []
    //   for (let i = 0; i < 25; i++) {
    //     capital.push(String.fromCharCode(65 + i));
    //   }
    //   return capital;
    // },
  },
};
</script>
<style lang="scss" scoped>
.main-middle::v-deep {
  .middle-content {
    .filter-apply {
      background-color: white;
      border-radius: 4px;
      ul {
        list-style: none;
        margin: 0px;
        li {
          display: inline-block;
          margin: 5px 20px;
          position: relative;
          cursor: pointer;
        }
        .checkedStlye {
          border: 1px solid grey;
          background-color: #486aaf;
          color: white;
          padding: 2px;
        }
        .el-tag {
          border-radius: 2px;
          border-color: #0ea5ff;
          background-color: #ffffff;
          display: inline-flex;
          justify-content: center;
          align-items: center;
        }
        .el-tag--light {
          font-size: 14px;
        }
      }
      .tags-row {
        overflow: hidden;
        padding: 10px 24px 8px;
        font-size: 14px;
        border-bottom: 1px dashed #e1e3e9;
      }
      .tags-row:last-child {
        border-bottom: none;
      }
      .tags-title {
        position: relative;
        display: inline-block;
        width: 70px;
        top: 5px;
        text-align: left;
        vertical-align: top;
        color: #262626;
        font-size: 14px;
        font-weight: 600;
      }
      .tags-list {
        display: inline-block;
        color: rgba(0, 0, 0, 0.65);
        // color: #000000;
        // opacity: 0.6;
        padding: 0px;
        max-height: 200px;
        overflow: hidden;
      }
    }
    .middle-apply {
      margin-top: 20px;
      background-color: white;
      border-radius: 4px;
      padding: 24px;
      padding-bottom: 0px;
      .el-row {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
      }
      .el-col {
        width: 20%;
        margin-bottom: 20px;
      }
      .grid-content {
        width: 100%;
        height: auto;
        border-radius: 4px;
        outline: 1px solid #eaedf7;
        .img-box {
          position: relative;
          width: 100%;
          // 设置高等宽
          height: 0;
          padding-top: 100%;
          img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          border-radius: 4px 4px 0 0;
          }
        }
        .apply-name {
          padding: 16px;
          // border: 1px solid #eaedf7;
          // border-radius: 0 0 4px 4px;
          // display: flex;
          // flex-direction: column;
          // justify-content: space-between;
          span {
            display: block;
            width: 100%;
            margin-top: 4px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
          span:nth-child(1) {
            margin-top: 0px;
            font-weight: 600;
            font-size: 16px;
            line-height: 1.5;
          }
          span:nth-child(2) {
            font-size: 14px;
            color: #8c8c8c; 
            min-height: 28px;
            line-height: 28px; 
            // line-height: 1.5;
            // min-height: 16PX;
          }
          span:nth-child(3) {
            color: #f87039;
            font-size: 18px;
            margin-top: 8px;
          }
        }
      }
      .grid-content:hover {
        // border-color: #0ea5ff;
        outline: 1px solid #0ea5ff;
        box-shadow: 5px 4px 5px 0px rgba(28, 41, 90, 0.08);
        // .apply-name {
        //   border: none;
        // }
      }

      // width: 100%;
      // display: flex;
      // flex-direction: row;
      // flex-wrap: wrap;
      // justify-content: space-between;
      // > div:nth-child(2) {
      //   width: 100%;
      //   display: flex;
      //   flex-direction: row;
      //   flex-wrap: wrap;
      // }

      // .el-col:nth-last-child(1){
      //   margin-bottom: 20px;
      // }
      .empty_box {
        min-height: 200px;
        text-align: center;
        line-height: 200px;
        font-size: 20px;
        color: #d1d1d1;
      }
    }
  }
}
</style>
