import Vue from "vue";
import VueRouter from "vue-router";
import store from "../store/store";
import Login from "../views/Login.vue";

Vue.use(VueRouter);
export const baseRouter = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    component: Login,
  },
  // {
  // todo:255
  //   path: "*",
  //   component: () => import("@/views/404.vue"),
  // },
];

export const dynamicRouter = [
  {
    path: "/usersystem",
    redirect: "/usersystem/home",
    // component:()=>import('@/components/header.vue'),
    component: () => import("@/views/BlankPage.vue"),
    meta: { auths: ["APP_QUERY"] },
    children: [
      {
        path: "home",
        component: () => import("@/views/userViews/Index.vue"),
        meta: { auths: ["APP_QUERY"], title: "首页" },
      },
      {
        path: "search",
        component: () => import("@/views/userViews/Search.vue"),
        meta: {
          auths: ["APP_QUERY"],
          title: "搜索页",
          arr: [{ name: "首页", url: "/usersystem/home" }, "搜索页"],
        },
      },
      {
        path: "applydetails",
        component: () => import("@/views/userViews/ApplyDetails.vue"),
        meta: {
          auths: ["APP_QUERY"],
          title: "应用详情",
          arr: [{ name: "首页", url: "/usersystem/home" }, "应用详情"],
        },
      },
      {
        path: "bookapply",
        component: () => import("@/views/userViews/BookApply.vue"),
        meta: {
          auths: ["APP_SUBSCRIBE"],
          title: "订购应用",
          arr: [
            { name: "首页", url: "/usersystem/home" },
            { name: "应用详情", url: "/usersystem/applydetails" },
            "订购应用",
          ],
        },
        beforeEnter: (to, from, next) => {
          to.meta.arr.map((item) => {
            if (item.name === "应用详情") {
              item.url = "/usersystem/applydetails" + "?id=" + to.query.id;
            }
            return item;
          });
          next();
        },
      },
      {
        path: "noticecenter",
        component: () =>
          import("@/views/userViews/sellerCenter/NoticeCenter.vue"),
        meta: { auths: ["APP_QUERY"], title: "通知中心" },
      },
      {
        path: "noticecenter/:id",
        component: () =>
          import("@/views/userViews/sellerCenter/NoticeDetail.vue"),
        meta: {
          auths: ["APP_QUERY"],
          title: "通知详情",
          arr: [
            { name: "通知中心", url: "/usersystem/noticecenter" },
            "通知详情",
          ],
        },
      },
      {
        path: "sellercenter",
        component: () => import("@/views/userViews/SellerCenter.vue"),
        meta: { auths: ["APP_QUERY"], title: "商户中心" },
        children: [
          {
            path: "myapplication",
            component: () =>
              import("@/views/userViews/sellerCenter/MyApplication.vue"),
            meta: { auths: ["APP_QUERY"], title: "我的应用" },
          },
          {
            path: "ordercenter",
            component: () =>
              import("@/views/userViews/sellerCenter/OrderCenter.vue"),
            meta: { auths: ["APP_SUBSCRIBE"], title: "订单中心" },
          },
          {
            path: "myhardware",
            component: () =>
              import("@/views/userViews/sellerCenter/MyHardware.vue"),
            meta: { auths: ["APP_QUERY"], title: "我的硬件" },
          },
          {
            path: "usercenter",
            component: () =>
              import("@/views/userViews/sellerCenter/UserCenter.vue"),
            meta: { auths: ["APP_QUERY"], title: "商户信息" },
          },
          {
            path: "MyAddress",
            component: () =>
              import("@/views/userViews/sellerCenter/MyAddress.vue"),
            meta: { auths: ["APP_QUERY"], title: "收货地址" },
          },
        ],
      },
      {
        path: "ordercenter/:id",
        component: () =>
          import("@/views/userViews/sellerCenter/OrderDetail.vue"),
        meta: {
          auths: ["APP_QUERY"],
          title: "订单详情",
          arr: [
            { name: "订单中心", url: "/usersystem/sellercenter/ordercenter" },
            "订单详情",
          ],
        },
      },

      // {
      //   path: "paidpage",
      //   component: () => import("@/views/userViews/PaidPage.vue"),
      //   meta: { auths: ["APP_SUBSCRIBE"] },
      //   // beforeEnter: (to, from, next) => {
      //   //   console.log(to, from, next);
      //   //   next()
      //   // }
      // },
    ],
  },
  {
    path: "/backsystem",
    redirect: "/backsystem/home",
    component: () => import("@/views/BlankPage.vue"),
    meta: { auths: ["MGR_QUERY"] },
    children: [
      {
        path: "home",
        component: () => import("@/views/backViews/Index.vue"),
        redirect: "/backsystem/home/myapplication",
        meta: { auths: ["MGR_QUERY"] },
        children: [
          {
            path: "myapplication",
            component: () => import("@/views/backViews/MyApplication.vue"),
            meta: { auths: ["MGR_QUERY"] },
          },
          {
            path: "myapplylist",
            component: () => import("@/views/backViews/MyApplyList.vue"),
            meta: { auths: ["MGR_QUERY"] },
          },          
          {
            path: "createapply",
            component: () => import("@/views/backViews/ApplicationForm.vue"),
            meta: { auths: ["MGR_QUERY"] },
          },
          // 1、我的应用和我的申请的详情界面
          {
            path: "appformdetail",
            component: () => import("@/views/backViews/appForm/AppFormDetail.vue"),
            meta: { auths: ["MGR_QUERY"] },
          },
          //2、我的应用和我的申请的编辑界面
          {
            path: "appformedit",
            component: () => import("@/views/backViews/appForm/operationForm/Index.vue"),
            meta: { auths: ["MGR_QUERY"] },
          },
          {
            path: "ordermanage",
            component: () => import("@/views/backViews/OrderManage.vue"),
            meta: { auths: ["MGR_STATISTICS"] },
          },
          {
            path: "merchant",
            component: () =>
              import("@/views/backViews/MerchantApplication.vue"),
            meta: { auths: ["MGR_STATISTICS"] },
          },
          {
            path: "usermanage",
            component: () => import("@/views/backViews/UserManage.vue"),
            meta: { auths: ["MGR_GRANT"] },
          },
          //
          {
            path: "taskmanage",
            component: () => import("@/views/backViews/TaskManage.vue"),
            meta: { auths: ["MGR_DEPLOY"] },
          },
          {
            path: "noticecenter",
            component: () => import("@/views/backViews/NoticeCenter.vue"),
            meta: { auths: ["MGR_QUERY"] },
          },
          {
            path: "noticedetail",
            component: () => import("@/views/backViews/NoticeDetail.vue"),
            meta: { auths: ["MGR_QUERY"] },
          },
          {
            path: "datastatistics",
            component: () => import("@/views/backViews/DataStatistics.vue"),
            meta: { auths: ["MGR_STATISTICS"], keepAlive: true, isBack: false },
            beforeEnter(to, from, next) {
              console.log(from);
              if (from.name == "datastatisticsdetail") {
                to.meta.isBack = true;
              } else {
                to.meta.isBack = false;
              }
              next();
            },
          },
          {
            path: "datastatisticsdetail",
            name: "datastatisticsdetail", //不准删！！！
            component: () =>
              import("@/views/backViews/DataStatisticsDetail.vue"),
            meta: { auths: ["MGR_QUERY"] },
          },

        ],
      },
    ],
  },
];

const router = new VueRouter({
  mode: "hash",
  base: process.env.BASE_URL,
  routes: baseRouter,
});

// 全局路由守卫
router.beforeEach(async (to, from, next) => {
  // 判断用户有没有访问权限
  if (to.path === "/login") {
    next();
  } else {
    // to.path === "/backsystem/home" || to.path === "/usersystem/home"
    if ("token" in to.query) {
      store.commit("setToken", to.query.token);
    }
    const token = localStorage.getItem("token");
    if (!token || token === "undefined" || token === "") {
      next({ path: "/login" });
    } else {
      // token验证成功
      store.commit("setRightList"); //获取权限
      if (!store.state.routers) {
        // 动态添加路由(第一次生成动态路由表)
        store.commit("setRouters", dynamicRouter);
        store.state.routers.forEach((route) => {
          router.addRoute(route);
        });
        next({ ...to, replace: true });
      } else {
        next();
      }
    }
  }
});

// //获取原型对象上的push函数
// const originalPush = VueRouter.prototype.push
// //修改原型对象中的push方法
// VueRouter.prototype.push = function push(location) {
//    return originalPush.call(this, location).catch(err => err)
// }

export default router;
