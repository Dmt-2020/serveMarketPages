import {
  checkApply,
  checkApplications,
  saveScratchMessage,
  jumpToDevParam,
  uploadFile,
  deleteFile,
  submitApply,
  auditToPass,
  auditToReject,
  getClassIds,
  getPrincipal,
  getReviewer,
  dropApplication,
} from "@/api/backApi.js";
import WEditor from "@/components/WEditor";
import { throttle2 } from "@/utils/tools.js";
import {
  filterAppType,
  filterSpecStatus,
  getCheckStatue,
} from "@/utils/common.js";

export default {
  components: {
    WEditor,
    // DevParam: () => import("./DevParam.vue"),
  },
  data() {
    // 弹窗中规格名验证规则
    let validateSpecName = (rule, value, callback) => {
      if (!value) {
        return callback(new Error("规格名不能为空"));
      } else {
        // 符合条件的情况如下:
        //1. 再次修改规格时，修改规格名时(修改后的值和原本的规格名不相等时)
        //2. 新建时,新增规格名
        if (this.tempForReopenSpecNo !== this.dialogForm.specName) {
          const reuslt = this.setSpecAndPrice.find((item) => {
            return item.specName === this.dialogForm.specName;
          });
          if (reuslt) {
            return callback(new Error("规格名已存在"));
          }
          callback();
        } else {
          callback();
        }
      }
    };
    let validateSpec = (rule, value, callback) => {
      if (this.setSpecAndPrice.length <= 0) {
        return callback(new Error("规格及价格不能为空"));
      } else {
        callback();
      }
    };
    return {
      active: 0,
      loading: false,
      isShowDialog: false,
      appTypeChange: false, //应用类型是否可修改(更新时)
      ifDisabled: false, //是否禁用表单(已完成查看的时候)
      isAudit: false, //管理员审核时查看（是否有审核按钮）
      course_img: [],
      course_img_pos: {}, //
      describe_img: [], //富文本中图片列表(保存后端返回的图片数据)
      describe_img_pos: {}, //上传图片时临时存放图片
      applyFileList: [], //应用图片列表
      describeHtml: "", //描述markdown
      courseHtml: "", //教程
      urlQuery: { type: "", param: "" }, //url的参数获取
      options1: [], //一级分类选项
      category1: "", //一级分类绑定的值（应用分类）
      options2: [], //二级分类选项
      classOptions: [], //应用分类数据的获取
      principal: [{ id: 0, name: "无" }], //负责人下拉列表
      reviewer: [{ id: 0, name: "无" }], //审核人下拉列表
      subscribeWayTemp: [], //用来清空选中项,在created里初始化
      subscribeWay: [
        {
          subscribeMode: 0,
          title: "试用期",
          subscribeDays: null,
          price: "0",
          isWritable: false,
          originalPrice: 0,
          applyType: "0",
          specPriceId: "", //传给后端需要初始化的字段
        },
        {
          subscribeMode: 2,
          title: "包月",
          subscribeDays: 30,
          title2: "30天",
          price: "",
          isWritable: false,
          originalPrice: 0,
          applyType: "0",
          specPriceId: "", //传给后端需要初始化的字段
        },
        {
          subscribeMode: 3,
          title: "包季",
          subscribeDays: 90,
          title2: "90天",
          price: "",
          isWritable: false,
          originalPrice: 0,
          applyType: "0",
          specPriceId: "", //传给后端需要初始化的字段
        },
        {
          subscribeMode: 4,
          title: "半年",
          subscribeDays: 180,
          title2: "180天",
          price: "",
          isWritable: false,
          originalPrice: 0,
          applyType: "0",
          specPriceId: "", //传给后端需要初始化的字段
        },
        {
          subscribeMode: 5,
          title: "包年",
          subscribeDays: 365,
          title2: "365天",
          price: "",
          isWritable: false,
          originalPrice: 0,
          applyType: "0",
          specPriceId: "", //传给后端需要初始化的字段
        },
        {
          subscribeMode: 1,
          title: "买断",
          subscribeDays: null,
          title2: "ERP有效期",
          price: "",
          isWritable: false,
          originalPrice: 0,
          applyType: "0",
          specPriceId: "", //传给后端需要初始化的字段
        },
      ],
      applyForm: {
        recId: 0,
        appId: null,
        appName: "",
        appNo: "",
        imgUrl: "",
        bitFlag: 0, //修改应用时需要的字段
        status: 0, //审核状态
        appShortDesc: "", //简介
        appDoc: "", //教程
        appDesc: "", //描述
        classId: null, //应用分类2
        applyReason: "",
        creatorId: null, //创建人id，后端需要的字段
        applySpecList: [], //规格
        responsiblerId: null, //负责人
        productLine: "旗舰版",
        applyType: "0", //申请类型（ 0 新增 1 修改 2 下架）
        subStatus: null,
        checkorId: null, //审核人字段（查看应用时没有该字段）
      },
      setSpecAndPrice: [], //设置的 规格价格的 数组
      dialogForm: {
        //在clearDialogForm函数中也有重置为初始值的操作，resetFields失效，故需要手动同步（否则会初始化失败）
        specName: "",
        specNo: "",
        appType: 0,
        supportOpen: -1,
        supportClose: -2,
        applySpecPriceList: [],
        applyType: "0",
        specId: "", //后端数据反显需要初始的字段
        outerAppId: "", //后端数据反显需要初始的字段
        deployerId: "", //后端数据反显需要初始的字段
        versionNo: "", //后端数据反显需要初始的字段
      },
      reOpenWithValue: false,
      // saveScatchInfo: {}, //保存第一步后端返给的值（recId啥的），然后在第二步重新发给后端
      tempForReopenSpecNo: "", //修改规格时，记录修改前的规格编码，以找到修改的对象
      showDropSpec: null, //查看和审核时值为1，修改（包括驳回状态的）值为0
      applyFormRule: {
        // 保存草稿时校验
        appName: [{ required: true, message: "应用名不能为空" }],
        // 点击 下一步 时校验
        vertifySpec: [{ validator: validateSpec }],
        classId: [
          {
            required: true,
            message: "分类不能为空",
            trigger: "change",
          },
        ],
        checkorId: [{ required: true, message: "审核人不能为空" }],
      },
      // 弹窗的规则校验
      dialogRule: {
        specName: [{ validator: validateSpecName, trigger: "blur" }],
      },
    };
  },
  created() {
    // 获取分类数据和负责人、审核人数据
    this.getClassIdsMethod();
    this.getPrincipalMethod();
    this.getReviewerMethod();
    // 为规格价格提前拷贝一份
    this.subscribeWayTemp = JSON.parse(JSON.stringify(this.subscribeWay));
  },
  mounted() {
    this.urlQuery = Object.assign({}, this.$route.query);
    this.checkApplyStatus(this.urlQuery["type"]);
  },
  methods: {
    checkApplyStatus(val) {
      // 1.从我的应用跳过来：checkApplications（type：0 新增 1 修改 2 下架）
      // 2.从我的申请跳过来：checkApplyMethod
      switch (val) {
        case "-1": //从【我的应用】跳转过来：仅查看
          this.active = 2;
          this.checkApplications(this.urlQuery["param"]);
          this.ifDisabled = true; //表单不可编辑
          break;
        case "0": //新增
          break;
        case "1": //修改
          this.checkApplications(this.urlQuery["param"]);
          break;
        case "2": //下架
          this.checkApplications(this.urlQuery["param"]);
          this.ifDisabled = true; //表单不可编辑
          this.active = 2;
          break;
        case "3": //审核
          this.active = 2;
          this.isAudit = true; //显示审核按钮
          this.showDropSpec = 1;
          this.checkApplyMethod(this.urlQuery["param"]);
          this.ifDisabled = true; //表单不可编辑
          break;
        case "4": //仅查看（没有审核按钮）
          this.active = 2;
          this.ifDisabled = true; //表单不可编辑
          this.showDropSpec = 1;
          this.checkApplyMethod(this.urlQuery["param"]);
          break;
        case "5": //申请单的修改和编辑
          this.showDropSpec = 0;
          this.checkApplyMethod(this.urlQuery["param"]);
          break;
        default:
          break;
      }
    },
    // 获取分类下拉框数据
    async getClassIdsMethod() {
      const { data } = await getClassIds();
      if (data) {
        this.classOptions = data;
        this.classOptions.map((item) => {
          this.options1.push(item.parentClass);
        });
      }
    },

    // 负责人列表
    async getPrincipalMethod() {
      const { data } = await getPrincipal();
      if (data) {
        this.principal = this.principal.concat([...data]);
      }
    },

    // 审核人列表
    async getReviewerMethod() {
      const { data } = await getReviewer();
      if (data) {
        this.reviewer = this.reviewer.concat([...data]);
      }
    },
    findPerson(str, id) {
      let tempArr = [];
      switch (str) {
        case "checkorId":
          tempArr = this.reviewer;
          break;
        case "deployerId":
        case "responsiblerId":
          tempArr = this.principal;
          break;
        default:
          break;
      }
      const temp = tempArr.find((item) => {
        return item.id === id;
      });
      return temp && temp.name;
    },
    findAppClassify(val) {
      let subClassName = "";
      const result = this.classOptions.find((item) => {
        const temp = item.subClassList.find((i) => i.classId === val);
        subClassName = temp && temp.className;
        return temp;
      });
      return result && result.parentClass.className + "--" + subClassName;
    },
    // 获取应用申请单详情
    async checkApplyMethod(val) {
      const temp = {
        applyId: Number(val),
        showDropSpec: this.showDropSpec,
      };
      this.loading = true;
      const { data } = await checkApply(temp);
      if (parseInt(data.status) === 0 && parseInt(data.subStatus) === 2) {
        // 修改申请单时,如果之前已经点击过[下一步],则之间进入流程2
        this.active = 1;
      }
      this.loading = false;
      this.assignToApplyForm(data);
      if (parseInt(data.applyType) === 2) {
        // 下架应用的申请单再次编辑也只能填原因，其它不可编辑
        this.ifDisabled = true;
        this.active = 2;
      }
      if (parseInt(this.applyForm.status) === 30) {
        // 如果申请单状态已完成
        this.active = 3;
      }
    },
    // 将后端返回的数据赋值给applyForm
    assignToApplyForm(data) {
      for (const item in this.applyForm) {
        if (item in data) {
          if (Array.isArray(data[item])) {
            // 清空属性里之前的内容
            this.applyForm[item].splice(
              0,
              this.applyForm[item].length,
              ...data[item]
            );
            if (item === "applySpecList") {
              // 数据初始化时加上open和close字段
              this.applyForm[item].map((i) => {
                this.$set(i, "open", { way: 1, isOrNot: null });
                this.$set(i, "close", { way: 2, isOrNot: null });
                this.formatSpecOpen(i);
                this.formatSpecClose(i);
              });
            }
            this.setSpecAndPrice = this.applyForm["applySpecList"]; //反显第一流程中的【规格及价格】
          } else {
            if (item === "imgUrl") {
              if (data[item].length > 0) {
                const temp = JSON.parse(data[item]);
                this.applyFileList = [];
                //  展示图片
                this.applyFileList.push({
                  name: temp.fileName,
                  url: temp.url,
                });
                // 将数据放进applyForm对象
                this.applyForm[item] = data[item];
              }
            } else if (item === "classId") {
              for (let i = 0; i < this.classOptions.length; i++) {
                const temp = this.classOptions[i].subClassList.find((sub) => {
                  return sub.classId === data[item];
                });
                if (temp) {
                  this.category1 = this.classOptions[i].parentClass["classId"];
                  this.$nextTick(() => {
                    // 防止category1发生变化导致该字段被清空
                    this.applyForm[item] = data[item];
                  });
                }
              }
            } else {
              this.applyForm[item] = data[item];
            }
          }
        }
      }
    },
    // 从【我的应用】跳转过来，获取应用详情
    async checkApplications(val) {
      const tempData = {
        appId: Number(val),
        applyType: parseInt(this.urlQuery["type"]),
      };
      this.loading = true;
      const { data } = await checkApplications(tempData);
      this.loading = false;
      // 将data中的字段名更改
      if (Object.hasOwnProperty.call(data, "appSpecList")) {
        // 1. 将返回的 appSpecList 字段的值 存入 this.applyForm['applySpecList']
        this.applyForm["applySpecList"] = data["appSpecList"];
        // 2. 把data["appSpecList"]字段中的specPriceList 改名为 applySpecPriceList
        this.applyForm["applySpecList"] = this.applyForm["applySpecList"].map(
          (item) => {
            return JSON.parse(
              JSON.stringify(item).replace(
                /specPriceList/g,
                "applySpecPriceList"
              )
            );
          }
        );
        this.setSpecAndPrice = this.applyForm["applySpecList"]; //反显第一流程中的【规格及价格】
      }
      this.applyForm["applySpecList"].map((i) => {
        this.$set(i, "open", { way: null, isOrNot: null });
        this.$set(i, "close", { way: null, isOrNot: null });
        this.formatSpecOpen(i);
        this.formatSpecClose(i);
      });
      for (const item in this.applyForm) {
        if (item in data) {
          if (Array.isArray(data[item])) {
            // 待定
            this.applyForm[item].splice(0, 1, ...data[item]);
          } else {
            if (item === "imgUrl") {
              if (data[item].length > 0) {
                const temp = JSON.parse(data[item]);
                this.applyFileList = [];
                this.applyFileList.push({
                  name: temp.fileName,
                  url: temp.url,
                });
                // 将数据放进applyForm对象
                this.applyForm[item] = data[item];
              }
            } else if (item === "classId") {
              for (let i = 0; i < this.classOptions.length; i++) {
                const temp = this.classOptions[i].subClassList.find((sub) => {
                  return sub.classId === data[item];
                });
                if (temp) {
                  this.category1 = this.classOptions[i].parentClass["classId"];
                  this.$nextTick(() => {
                    this.applyForm[item] = data[item];
                  });
                }
              }
            } else {
              // 应用跳过来时，status字段代表的是应用状态，而这应该展示申请单状态。
              if (item === "status") {
                // 使用初始值,不需操作
              } else {
                this.applyForm[item] = data[item];
              }
            }
          }
        }
      }
      // 把应用id（recid）赋值给appId传给后端
      // this.applyForm["appId"] = this.urlQuery["param"];
    },
    nextOnly() {
      this.active = 1;
    },
    // 是否开通参数反显数据
    formatSpecOpen(val) {
      switch (val.supportOpen) {
        case -2:
          val.open.way = 2;
          break;
        case -1:
          val.open.way = 1;
          break;
        case 0:
          val.open.way = 3;
          val.open.isOrNot = 2;
          break;
        case 1:
          val.open.way = 3;
          val.open.isOrNot = 1;
          break;
        default:
          break;
      }
    },
    formatSpecClose(val) {
      switch (val.supportClose) {
        case -2:
          val.close.way = 2;
          break;
        case -1:
          val.close.way = 1;
          break;
        case 0:
          val.close.way = 3;
          val.close.isOrNot = 2;
          break;
        case 1:
          val.close.way = 3;
          val.close.isOrNot = 1;
          break;
        default:
          break;
      }
    },
    // 规格的删除事件
    delSpecEvent(val) {
      // 通过规格的recId来查找
      const tempIndex = this.setSpecAndPrice.findIndex((item) => {
        return item.specName === val.specName;
      });
      if (tempIndex !== -1) {
        this.setSpecAndPrice.splice(tempIndex, 1);
      }
    },
    // 应用图片删除功能
    removeApplyFile() {
      // if (this.applyForm["imgUrl"]) {
      //   this.deleteFileMethod(JSON.parse(this.applyForm["imgUrl"]).fileName);
      // }
    },
    async deleteFileMethod(val) {
      try {
        await deleteFile(val);
        this.applyForm["imgUrl"] = "";
        this.applyFileList = [];
        this.$message({
          type: "success",
          message: `删除图片成功！`,
        });
      } catch (error) {
        this.$message({
          type: "error",
          message: `删除失败-${error.message}`,
        });
      }
    },
    handleApplyExceed() {
      // 上传图片张数超过限制时的回调
      this.$message({
        type: "warning",
        message: "上传图片数量超过限制，仅允许上传一张图片",
      });
    },
    beforeUpload(file) {
      let types = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/bmp",
        "image/gif",
      ];
      const isLimitSize = file.size / 1024 / 1024 > 5;
      if (isLimitSize) {
        this.$message.error("上传图片大小不能超过5MB！");
        return false;
      }
      if (types.indexOf(file.type) === -1) {
        this.$message({
          type: "error",
          message: '图片仅支持"gif", "jpg", "jpeg", "png", "bmp", "jfif"格式',
        });
        return false;
      }
      return true;
    },
    uploadApplyFile(param) {
      this.uploadFileMethod(param.file);
    },
    async uploadFileMethod(val) {
      // 应用图片的上传
      let img_formdata = new FormData();
      img_formdata.append("file", val);
      const { data, code } = await uploadFile(img_formdata);
      if (data) {
        this.applyForm["imgUrl"] = JSON.stringify(data);
      }
      switch (code) {
        case 3001:
          this.$message.error("请选择文件");
          break;
        case 3002:
          this.$message.error("上传文件不能为空");
          break;
        case 3003:
          this.$message.error("上传文件大小超过5MB限制");
          break;
        case 3004:
          this.$message.error("文件名是空");
          break;
        case 3005:
          this.$message.error(
            "上传文件扩展名是不允许的扩展名只允许gif,jpg,jpeg,png,bmp格式"
          );
          break;
        default:
          break;
      }
    },
    backToHome() {
      this.$router.go(-1);
    },
    //保存草稿
    saveBaseInfo() {
      this.$refs["applyForm"].validateField(["appName"], (error) => {
        if (!error) {
          this.saveScratchMessageMethod();
        } else {
          return false;
        }
      });
    },
    async saveScratchMessageMethod() {
      const temp = this.resetDataFormat();
      // const temp =
      //   Object.keys(this.saveScatchInfo).length > 0
      //     ? this.saveScatchInfo
      //     : this.resetDataFormat();
      try {
        const { code, data } = await saveScratchMessage(JSON.stringify(temp));
        if (code === 20000) {
          // this.saveScatchInfo = data; //将后端返回的数据存储起来
          // 将后端返回的数据格式解耦出来重组
          let tempData = Object.assign({}, data.appApply);
          this.$set(tempData, "applySpecList", data.applySpecList);
          this.assignToApplyForm(tempData);
          this.$message({
            message: "保存草稿成功！",
            type: "success",
          });
        }
      } catch (error) {
        this.$message({
          type: "error",
          message: `保存失败哦~${error.message}`,
        });
      }
    },
    //  // 重整数据格式发给后端（后端需要appApply对象和applySpecList对象组成的数据格式）
    resetDataFormat() {
      const tempData = { applySpecList: [], appApply: {} };
      for (const obj in this.applyForm) {
        if (obj === "applySpecList") {
          tempData["applySpecList"].splice(0, 1, ...this.applyForm[obj]);
        } else {
          this.$set(tempData["appApply"], obj, this.applyForm[obj]);
        }
      }
      return tempData;
    },
    next() {
      const validList = [];
      this.$refs["applyForm"].validateField(
        ["vertifySpec", "classId", "applyReason", "checkorId"],
        (error) => {
          validList.push(error);
        }
      );
      if (validList.every((item) => item === "")) {
        this.jumpToDevParamMethod();
      } else {
        return false;
      }
    },
    async jumpToDevParamMethod() {
      // 对象判空待定（直接下一步的情况）
      //如果不为空，直接传this.saveScatchInfo,需排除保存草稿后又进行修改的情况
      const temp = this.resetDataFormat();
      // const temp =
      //   Object.keys(this.saveScatchInfo).length > 0
      //     ? this.saveScatchInfo
      //     : this.resetDataFormat();
      try {
        const { data } = await jumpToDevParam(JSON.stringify(temp));
        if (data) {
          this.active = 1;
          let tempData = Object.assign({}, data.appApply);
          this.$set(tempData, "applySpecList", data.applySpecList);
          this.assignToApplyForm(tempData);
          // this.saveScatchInfo = data;
          // // 把后端返回的【规格的值】再赋给applyForm['applySpecList']
          // this.applyForm["applySpecList"].splice(
          //   0,
          //   this.applyForm["applySpecList"].length,
          //   ...data.applySpecList
          // );
          // // 前端追加字段用于设置监听开通方式和是否设参
          // this.applyForm["applySpecList"].map((item) => {
          //   // 初始化开通方式默认选中值
          //   this.$set(item, "open", { way: 1, isOrNot: null });
          //   this.$set(item, "close", { way: 2, isOrNot: null });
          //   if (item.supportOpen === -2) {
          //     // 内置时
          //     // 给第二流程中 开通方式 初始化值
          //     this.formatSpecOpen(item);
          //     this.formatSpecClose(item);
          //   }
          // });
        }
      } catch (error) {
        this.$message({
          type: "error",
          message: `${error.message}`,
        });
      }
    },
    handleClose() {
      this.isShowDialog = false;
      this.reOpenWithValue = false;
    },
    // 新建规格打开弹窗
    openNewDialog() {
      // 初始化一下弹窗值
      this.isShowDialog = true;
      // 还原多选框的状态为初始化状态
      this.subscribeWay = JSON.parse(JSON.stringify(this.subscribeWayTemp));
      //清除一下弹窗之前的值
      this.clearDialogForm();
    },
    clearDialogForm() {
      // 因为form表单在created初始化完成的，所以后续的重置操作也只会重置为【初始化时已经改变过】的数据。
      // this.$refs['dialogForm'].resetFields();
      this.dialogForm = {
        specName: "",
        specNo: "",
        supportOpen: -1,
        supportClose: -2,
        applySpecPriceList: [],
        applyType: "0",
        appType: 0,
        specId: "",
        outerAppId: "",
        deployerId: "",
        versionNo: "",
      };
    },
    checkWay(val) {
      this.subscribeWay.forEach((obj) => {
        if (val.indexOf(obj.subscribeMode) !== -1) {
          // 如果是选中的值
          obj.isWritable = true; // input框可输入
        } else {
          // 将input框清空
          parseInt(obj.subscribeMode) === 0
            ? (obj.subscribeDays = null)
            : (obj.price = null);
          obj.isWritable = false;
        }
      });
    },
    // 保存修改的规格-价格
    saveSpecInfo() {
      // 保存并抛出给底层的input框，把当前弹窗对象值dialogForm保存到setSpecAndPrice数组里
      this.$refs["dialogForm"].validate((valid) => {
        if (valid) {
          if (!this.reOpenWithValue) {
            // 新增就把结果push进数组
            // 获取选中的价格数组
            const temp = this.subscribeWay.filter((item) => {
              return (
                this.dialogForm.applySpecPriceList.indexOf(
                  item.subscribeMode
                ) !== -1
              );
            });
            // 把窗口数据对象放进setSpecAndPrice规格数组
            this.setSpecAndPrice.push(
              JSON.parse(JSON.stringify(this.dialogForm))
            );
            // 修改数组最后一个对象中的applySpecPriceList字段为temp（价格数组对象）
            this.setSpecAndPrice[
              this.setSpecAndPrice.length - 1
            ].applySpecPriceList = temp; // JSON.parse(JSON.stringify(temp))
          } else {
            // 修改，不push数组，直接更改对应的值
            //1. 通过规格编码 找到当前要修改的对象
            const currentIndex = this.setSpecAndPrice.findIndex((item) => {
              return item.specName === this.tempForReopenSpecNo;
            });
            //2. 找到对象后进行修改数据
            for (const obj in this.setSpecAndPrice[currentIndex]) {
              if (obj === "applySpecPriceList") {
                //  如果修改的是价格数组的值
                const temp = this.subscribeWay.filter((item) => {
                  // 找到选中的价格mode
                  return (
                    this.dialogForm.applySpecPriceList.indexOf(
                      item.subscribeMode
                    ) !== -1
                  );
                });
                this.setSpecAndPrice[currentIndex].applySpecPriceList = temp;
              } else {
                //  修改的是规格对象里其它属性的值，比如规格编码、是否内置
                this.setSpecAndPrice[currentIndex][obj] = this.dialogForm[obj];
              }
            }
            // this.setSpecAndPrice[currentIndex].applySpecPriceList = temp
            this.reOpenWithValue = false;
          }
          this.$set(this.applyForm, "applySpecList", this.setSpecAndPrice);
          this.isShowDialog = false;
        } else {
          return false;
        }
      });
    },
    // 修改规格-价格
    openWithValue(specPrice) {
      // 初始化多选框组数据
      this.subscribeWay = JSON.parse(JSON.stringify(this.subscribeWayTemp));
      // 清除this.dialogForm里的值
      this.clearDialogForm();
      this.isShowDialog = true;
      this.reOpenWithValue = true;
      for (const obj in this.dialogForm) {
        // 处理价格数组
        if (obj === "applySpecPriceList") {
          if (specPrice[obj].length > 0) {
            specPrice[obj].map((item) => {
              // 1. 将选中的价格赋给dialogForm对象
              this.dialogForm[obj].push(item.subscribeMode);
              // 2. 把选中的价格的参数同步给subscribeWay对象用于展示界面
              const temp = this.subscribeWay.find((i) => {
                return i.subscribeMode === item.subscribeMode;
              });
              if (temp.subscribeMode === 0) {
                temp.subscribeDays = item.subscribeDays;
                temp.isWritable = true;
              } else {
                temp.price = item.price;
                temp.isWritable = true;
              }
              // 将【specPriceId，applyType】数据同步给subscribeWay对象（【更新】价格时需要使用后台传的数据）
              if (Object.hasOwnProperty.call(item, "specPriceId")) {
                temp["specPriceId"] = item["specPriceId"];
              }
              if (Object.hasOwnProperty.call(item, "applyType")) {
                temp["applyType"] = item["applyType"];
              }
            });
          }
        } else {
          this.dialogForm[obj] = specPrice[obj];
        }
      }
      // 暂存一下打开弹窗之前的specName，保存修改时查找这个值
      // this.tempForReopenSpecNo = this.dialogForm["specNo"];
      this.tempForReopenSpecNo = this.dialogForm["specName"];
    },

    // 流程2的点击事件subscribeWay
    back() {
      this.active = 0;
    },
    // 下架应用
    dropApplyEvent() {
      const validList = [];
      this.$refs["applyForm"].validateField(
        ["applyReason", "checkorId"],
        (error) => {
          validList.push(error);
        }
      );
      if (validList.every((item) => item === "")) {
        this.dropApplicationMethod();
      } else {
        return false;
      }
    },
    async dropApplicationMethod() {
      const temp = {
        appId: this.applyForm["appId"],
        applyReason: this.applyForm["applyReason"],
        checkorId: this.applyForm["checkorId"],
      };
      // this.urlQuery['type']>2说明是从申请单进入的,需传给后端申请单的id
      if (parseInt(this.urlQuery["type"]) > 2) {
        this.$set(temp, "applyId", parseInt(this.urlQuery["param"]));
      }
      try {
        await dropApplication(temp);
        this.$message({
          type: "success",
          message: "下架申请成功！",
        });
        this.$router.go(-1);
      } catch (error) {
        this.$message({
          type: "error",
          message: `${error.message}`,
        });
      }
    },
    submitEvent: throttle2(function () {
      this.submitApplyMethod();
    }, 1000),
    async submitApplyMethod() {
      const temp = this.resetDataFormat();
      // if (this.urlQuery["type"] === "2" || this.applyForm['subStatus'] === 2) {
      //   //1. 解决[下线]应用时没有保存数据到saveScatchInfo
      //   // 2. 当子状态直接进入第二步流程中
      //   // 没有在初始化时赋值是为了保存申请原因的修改
      //   this.saveScatchInfo = this.resetDataFormat();
      // }
      //用户第二步修改的规格信息(开通方式)重新赋值给 this.applyForm
      // this.applyForm["applySpecList"] = JSON.parse(
      //   JSON.stringify(this.applyForm.applySpecList)
      // );
      try {
        await submitApply(JSON.stringify(temp));
        this.$message({
          message: "提交成功！",
          type: "success",
        });
        this.$router.go(-1);
      } catch (error) {
        this.$message({
          type: "error",
          message: `${error.message}`,
        });
      }
    },

    // 过滤应用类型
    filterAppType(val) {
      return filterAppType(val);
    },
    // 过滤规格状态
    filterSpecStatus(val) {
      return filterSpecStatus(val);
    },
    // 过滤审核状态
    getCheckStatue(val) {
      return getCheckStatue(val);
    },
    // 过滤申请状态
    checkApplyType(val) {
      let str = "";
      switch (parseInt(val)) {
        case 0:
          str = "发布应用";
          break;
        case 1:
          str = "更新应用";
          break;
        case 2:
          str = "下架应用";
          break;
        default:
          break;
      }
      return str;
    },
    getSubscribeTitle(val) {
      const temp = this.subscribeWay.find((item) => {
        return item.subscribeMode === val;
      });
      if (temp) {
        return temp.title;
      }
    },
    openChange(val) {
      const configWay = val.open.way;
      if (configWay === 1) {
        val.open.isOrNot = null;
        // 人工
        this.$set(val, "supportOpen", -1);
      } else if (configWay === 2) {
        val.open.isOrNot = null;
        // 内置
        this.$set(val, "supportOpen", -2);
      } else {
        // 自动时给个默认值,给之前是null
        // 如果是手动选择的是否传参就不取默认值,
        val.open.isOrNot = val.open.isOrNot ? val.open.isOrNot : 2;
        if (val.open.isOrNot === 1) {
          // 需要参数
          this.$set(val, "supportOpen", 1);
        } else if (val.open.isOrNot === 2) {
          // 无需参数
          this.$set(val, "supportOpen", 0);
        }
      }
    },
    closeChange(val) {
      const configWay = val.close.way;
      if (configWay === 1) {
        val.close.isOrNot = null;
        this.$set(val, "supportClose", -1);
      } else if (configWay === 2) {
        val.close.isOrNot = null;
        this.$set(val, "supportClose", -2);
      } else {
        // 选择自动时给个默认值
        val.close.isOrNot = val.close.isOrNot ? val.close.isOrNot : 2;
        if (val.close.isOrNot === 1) {
          this.$set(val, "supportClose", 1);
        } else if (val.close.isOrNot === 2) {
          this.$set(val, "supportClose", 0);
        }
      }
    },
    passAuditEvent() {
      this.auditToPassMethod();
    },
    async auditToPassMethod() {
      // `applyId=${parseInt(this.urlQuery.param)}`
      try {
        await auditToPass(parseInt(this.urlQuery.param));
        this.$message({
          message: "审核成功！",
          type: "success",
        });
        this.$router.go(-1);
      } catch (error) {
        this.$message({
          type: "error",
          message: error.message,
        });
      }
    },
    rejectAuditEvent() {
      this.$prompt("请输入驳回原因", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /\S+/,
        inputErrorMessage: "驳回原因不能为空",
      })
        .then(({ value }) => {
          // value是输入的值
          this.auditToRejectMethod(value);
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "取消输入",
          });
        });
    },
    async auditToRejectMethod(reason) {
      const temp = {
        applyId: parseInt(this.urlQuery.param),
        rejectReason: reason,
      };
      // formatUrlencoded
      try {
        await auditToReject(JSON.stringify(temp));
        this.$router.go(-1);
      } catch (error) {
        this.$message.error(error.message);
      }
    },
    checkSupportOpen(val) {
      // 弹窗选择应用类型
      this.subscribeWay = JSON.parse(JSON.stringify(this.subscribeWayTemp));
      this.dialogForm["applySpecPriceList"] = [];
      // 同步值到supportClose字段
      if ([1, 2, 3].indexOf(val) !== -1) {
        this.dialogForm["supportClose"] = -2;
        this.dialogForm["supportOpen"] = -2;
      } else {
        this.dialogForm["supportOpen"] = -1;
      }
    },

    // 我的应用-更新时，应用类型只有为预发布应用(2)才可修改
    checkAppTypeCanChange(form) {
      // 注意：增加规格的情况
      if (form.specId) {
        return form.appType == 2 && this.urlQuery["type"] == 1 ? false : true;
      } else {
        return false;
      }
    },
  },
  computed: {
    formatSubscribeWay: function () {
      if (this.dialogForm.appType === 1) {
        const temp = this.subscribeWay.slice(5);
        return temp;
      }
      return this.subscribeWay;
    },
  },
  watch: {
    category1: function (val) {
      // 应用分类的监听事件
      this.applyForm["classId"] = null;
      this.options2 = this.classOptions.find((item) => {
        return item.parentClass.classId === val;
      }).subClassList;
    },
    // describeHtml: function () {
    //   console.log(this.$refs.describemd.d_render);
    // },
    // "dialogForm.supportOpen": {
    //   // 弹窗的是否内置的监听事件
    //   handler: function (val) {
    //     debugger
    //     this.subscribeWay = JSON.parse(JSON.stringify(this.subscribeWayTemp));
    //     if (parseInt(val)) {
    //       this.dialogForm["applySpecPriceList"] = [];
    //     }
    //     // 同步值到supportClose字段
    //     this.dialogForm['supportClose'] = val
    //   },
    // },
  },
};
