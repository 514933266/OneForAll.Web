import Vue from 'vue'
import Vuex from 'vuex'
import state from './state'
import mutations from './mutations'
import getters from './getters'

Vue.use(Vuex)

const store = new Vuex.Store({
  strict: true,
  state: state,
  mutations: mutations,
  getters: getters
})

export default store
