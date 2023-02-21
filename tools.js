import jwt from "jwt-decode";

export function jwtToken(param) {
  return jwt(param);
}

//深拷贝
export function deepCopy(obj) {
  if (typeof obj !== "object" || obj === null) {
    throw new TypeError("传入参数不是对象");
  }

  let newObj = {};
  const objKeys = Object.keys(obj);
  objKeys.forEach((item) => {
    const currentDataValue = obj[item];
    if (typeof currentDataValue !== "object" || currentDataValue === null) {
      newObj[item] = currentDataValue;
    } else if (Array.isArray(currentDataValue)) {
      // 实现数组的深拷贝
      newObj[item] = [...currentDataValue];
    } else if (currentDataValue instanceof Set) {
      // 实现set数据的深拷贝
      newObj[item] = new Set([...currentDataValue]);
    } else if (currentDataValue instanceof Map) {
      // 实现map数据的深拷贝
      newObj[item] = new Map([...currentDataValue]);
    } else {
      // 普通对象则递归赋值
      newObj[item] = deepCopy(currentDataValue);
    }
  });

  return newObj;
}

// 简单的对象转化xxx-form-urldecode
export function formatUrlencoded(obj) {
  let str = "";
  for (const o in obj) {
    str += `${o}=${obj[o]}&`;
  }
  str = str.substring(0, str.length - 1);
  return str;
}

// // 防抖函数
export function debounce(fn, delay) {
  let timout = null;
  return function () {
    clearTimeout(timout);
    timout = setTimeout(() => {
      fn.apply(this);
    }, delay);
  };
}

// // 节流函数(第一次延迟执行)
export function throttle1(fn, delay) {
  //   let timeout = null;
  let flag = true;
  return function () {
    if (!flag) return;
    flag = false;
    // if (!timeout) {  timeout =
    setTimeout(() => {
      // timeout = null;
      fn.apply(this);
      flag = true;
    }, delay);
    // }
  };
}

// // 节流函数
export function throttle2(fn, wait) {
  let previous = 0;
  return function () {
    let now = new Date();
    if (now - previous > wait) {
      previous = now;
      fn.apply(this);
    }
  };
}

// 判断手机号格式
export const isPhone = (phone) => {
  return /^(1[3-9][0-9])+\d{8}$/.test(phone);
};

// 导出功能
export function exoprtExcelFunc(data, str) {
  const url = window.URL.createObjectURL(
    new Blob([data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
  );
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.setAttribute("download", str);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// 导出时间戳的格式化
export function formatExportTime() {
  let nowTime = new Date();
  const year = nowTime.getFullYear();
  const month = nowTime.getMonth() + 1;
  const days = nowTime.getDate();
  const hours = nowTime.getHours();
  const minutes = nowTime.getMinutes();
  const seconds = nowTime.getSeconds();
  return (
    year +
    placeHolder(month) +
    placeHolder(days) +
    placeHolder(hours) +
    placeHolder(minutes) +
    placeHolder(seconds)
  );
}

// 时间补位
function placeHolder(m) {
  return m < 10 ? "0" + m : m;
}
