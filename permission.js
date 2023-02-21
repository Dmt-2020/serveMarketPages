
import Vue from 'vue'
import store from '@/store/store.js'

function checkPermission(value) {
    if (value && value instanceof Array && value.length > 0) {
      const rightLists = store.state.rightList //用户拥有的权限
      const permissionRoles = value  //指令传入的权限
      // 只要拥有一个权限就返回true
      const hasPermission = rightLists.some(rl => {
        return permissionRoles.indexOf(rl)!==-1
      })
      return hasPermission
    } else {
      console.error(`need permission! Like v-permission="['QUERY','MODIFY']"`)
      return false
    }
  }


  export default function authority(){
  Vue.directive("permission",{
    inserted:function(el,binding){
      if (!checkPermission(binding.value)) {
        el.parentNode && el.parentNode.removeChild(el);
      }
    }
  })
}
