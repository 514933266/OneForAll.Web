<template>
  <el-container class="xiaomi-page">
    <el-aside width="240px" class="left-content">
      <el-button round @click="newChat" type="primary" class="new-bun">
        <font-awesome-icon
          fas
          icon="circle-plus"
          class="ofa-mr10"
        ></font-awesome-icon>
        新建会话
      </el-button>
      <ul class="chat-historys-ul">
        <li
          v-for="item in historys"
          :key="item.Id"
          :class="['chat-historys-li', { active: item.Active }]"
        >
          {{ item.Title }}
        </li>
      </ul>
    </el-aside>
    <el-main class="right-content">
      <div v-show="isAsking" class="content">
        <div v-for="item in chatContents" :key="item.Id" class="chat-box">
          <div class="chat-item">
            <div class="ofa-mr20">
              <el-avatar :src="headerDomain + userStore.user.IconUrl">
                <font-awesome-icon fas icon="user"></font-awesome-icon>
              </el-avatar>
            </div>
            <div class="chat-content">{{ item.Question }}</div>
          </div>
          <div class="chat-item">
            <div class="ofa-mr20">
              <el-avatar>
                <font-awesome-icon fas icon="robot"></font-awesome-icon>
              </el-avatar>
            </div>
            <div class="chat-content">
              <div>{{ item.Answer }}</div>
              <div v-if="item.Answer.length < 1" class="chat-loading">
                <font-awesome-icon fas spin icon="spinner"></font-awesome-icon
                >&nbsp;正在思考
              </div>
              <div v-else class="chat-btn-group">
                <el-button round :disabled="item.Like" @click="like(item)">
                  <font-awesome-icon fas icon="thumbs-up"></font-awesome-icon>
                </el-button>
                <el-button
                  round
                  :disabled="item.DisLike"
                  @click="disLike(item)"
                >
                  <font-awesome-icon fas icon="thumbs-down"></font-awesome-icon>
                </el-button>
                <el-button round @click="copy(item)"
                  ><font-awesome-icon fas icon="copy"></font-awesome-icon
                ></el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-show="!isAsking" class="home">
        <font-awesome-icon fas icon="robot" class="icon"></font-awesome-icon>
        <div class="title">你好，我是企小秘</div>
        <div class="title-desc">你可以试试下面这样问，我会帮助你解答</div>
        <div class="example-box">
          <div class="btn-box">
            <el-button round @click="getListTopQACorpus">
              <font-awesome-icon
                fas
                icon="rotate"
                class="ofa-mr4"
              ></font-awesome-icon>
              换一批
            </el-button>
          </div>
          <div class="example-ul-box">
            <div class="title">
              <font-awesome-icon
                fas
                icon="message"
                class="ofa-mr4"
              ></font-awesome-icon
              >常见问题
            </div>
            <ul class="question-ul">
              <li
                class="question-li"
                v-for="item in constQAList"
                :key="item.Id"
                @click="quickAsk(item.Question)"
              >
                <label>{{ item.Question }}</label>
                <el-tag round effect="dark" type="primary">{{
                  item.Type
                }}</el-tag>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div :class="['footer', active ? 'border' : '']">
        <div class="textarea-box">
          <el-input
            autosize
            v-model="question"
            @focus="active = true"
            @blur="active = false"
            type="textarea"
            resize="none"
            placeholder="在这里输入问题"
          >
          </el-input>
        </div>
        <div class="send-box">
          <el-button :disabled="disabled" @click="ask" type="primary">
            <font-awesome-icon fas icon="paper-plane"> </font-awesome-icon>
          </el-button>
        </div>
      </div>
    </el-main>
  </el-container>
  <!-- 弹窗添加类别 -->
  <el-dialog
    title="修改问题答案"
    v-model="dialogVisible"
    width="600"
    custom-class="ofa-dialog"
  >
    <el-form :model="entity" ref="formRef" label-width="120px">
      <div class="form-question-title">问题：{{ entity.Question }}</div>
      <div>调整后的答案</div>
      <el-form-item prop="Answer" label="职位分类名称">
        <el-input
          v-model.trim="entity.Answer"
          placeholder="请输入内容"
        ></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitAnswer">确 定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import clipboard3 from 'vue-clipboard3'
import API from '@/apis/chatgpt-api'
import BASE_API from '@/apis/base-api'
import { IBaseQACorpus } from '@/interfaces/chatgpt/IBaseQACorpus'
import { useUserStore } from '@/stores/userStore'
import { ElMessage } from 'element-plus'

interface IChatHistory {
  Id: number
  Active: boolean
  Title: string
  Contents: IChatContent[]
}

interface IChatContent {
  Id: string
  Question: string
  Answer: string
  Like?: boolean
  DisLike?: boolean
}

const { toClipboard } = clipboard3()
const userStore = useUserStore()

const active = ref(false) // 激活输入
const isAsking = ref(false) // 开始问答中
const dialogVisible = ref(false) // 显示弹窗
const question = ref('') // 输入文本
const constQAList = ref<IBaseQACorpus[]>([]) // 数据列表
const historys = ref<IChatHistory[]>([]) // 会话历史
const chatContents = ref<IChatContent[]>([]) // 当前聊天内容
const entity = ref<IChatContent>(Object.assign({})) // 当前修改的对象

// 是否允许发送
const disabled = computed(() => {
  return question.value.length < 1
})
// 是否允许发送
const headerDomain = computed(() => {
  return BASE_API.getHost()
})

onMounted(() => {
  getListTopQACorpus()
})

// 获取常见问题列表
function getListTopQACorpus() {
  API.getListTopQACorpus().then(res => {
    constQAList.value = res
  })
}

// 点击问题
function quickAsk(str: string) {
  question.value = str
  ask()
}

// 新建会话
function newChat() {
  isAsking.value = false
  chatContents.value = []
}

// 获取回答
function ask() {
  // 将对话内容按照规定格式组装请求体
  const hisList = chatContents.value.flatMap(x => {
    return [
      { Role: 'User', Content: x.Question },
      { Role: 'Robot', Content: x.Answer }
    ]
  })
  const data = {
    Question: question.value,
    Historys: hisList
  }
  setChatHistory(chatContents.value)
  // 将当前对话内容同步到会话历史
  chatContents.value.push({ Id: '', Question: question.value, Answer: '' })
  // 请求回答
  isAsking.value = true
  API.getAnswer(data).then(res => {
    if (res.Status) {
      const item = chatContents.value[chatContents.value.length - 1]
      if (item) {
        item.Id = res.Data.Id
        typeWriterEffect(item, res.Data.Value)
      }
    }
  })
}

// 设置会话历史
function setChatHistory(chatContents: IChatContent[]) {
  const activeChat =
    chatContents.length > 0 ? historys.value.find(w => w.Active) : undefined
  if (activeChat) {
    activeChat.Contents = chatContents
  } else {
    historys.value.push({
      Id: 1,
      Title: question.value,
      Active: true,
      Contents: chatContents
    })
  }
}

// 文本逐个输出
function typeWriterEffect(elementRef: IChatContent, text: string, delay = 100) {
  let index = 0
  const type = async () => {
    if (index < text.length) {
      elementRef.Answer += text.charAt(index)
      index++
      await new Promise(resolve => setTimeout(resolve, delay))
      await type() // 递归调用自身直到文本输出完毕
    }
  }
  // 返回 promise 以便在需要时可以等待执行完成
  return type()
}

// 点赞
function like(item: IChatContent) {
  API.like(item.Id).then(res => {
    if (res.Status) {
      item.Like = true
    }
  })
}

// 点踩
function disLike(item: IChatContent) {
  API.dislike(item.Id).then(res => {
    if (res.Status) {
      item.DisLike = true
    }
  })
}

// 复制内容到粘贴板
function copy(item: IChatContent) {
  toClipboard(item.Answer)
  ElMessage.success('复制成功！')
}

// 提交修改答案
function submitAnswer() {
  if (entity.value.Answer.length < 1) {
    ElMessage.error('请输入修改后的回答')
    return
  }
  API
}
</script>

<style lang="scss" scoped>
.xiaomi-page {
  border-radius: 10px;
  height: calc(100vh - 100px);
  background-color: #fff;

  .left-content {
    padding: 20px;
    .new-bun {
      width: 100%;
      height: 48px;
      font-size: 24px;
    }

    .chat-historys-ul {
      .chat-historys-li {
        padding: 10px;
        margin-top: 10px;
        border-radius: 4px;
        border: 1px solid #e4e7ed;
        cursor: pointer;
        transition: all 0.3s;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &:hover {
          background-color: #ecf5ff;
        }
      }

      .chat-historys-li.active {
        border-color: #79bbff;
        background-color: #ecf5ff;
      }
    }
  }

  .right-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    background-color: #f4f4f5;
    border-radius: 0 20px 20px 0;
    padding: 20px;

    .content {
      flex: 3;
      border-radius: 20px;
      width: 1080px;
      padding: 20px;
    }

    .chat-item {
      display: flex;
      margin-top: 10px;
      .el-avatar {
        margin-top: 10px;
        width: 40px;
        height: 40px;
        background-color: #409eff;
      }

      .chat-content {
        padding: 20px;
        width: 100%;
        border-radius: 10px;
        background-color: #fff;
        font-size: 16px;
      }

      .chat-loading {
        width: 160px;
        padding: 10px;
        border-radius: 10px;
        background-color: #f2f6fc;
        color: #a0cfff;
      }

      .chat-btn-group {
        display: flex;
        justify-content: right;
        padding: 10px;
        margin-top: 20px;
      }
    }

    .home {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 100px;
      width: 600px;
    }

    .icon {
      width: 60px;
      height: 60px;
      color: #409eff;
    }

    .title {
      font-size: 26px;
      font-weight: bold;
      padding: 10px;
      color: #333333;
    }

    .title-desc {
      font-size: 16px;
    }

    .example-box {
      margin-top: 20px;
      width: 100%;

      .example-ul-box {
        background-color: #fff;
        border-radius: 10px;
        padding: 20px;
        margin-top: 10px;
      }

      .btn-box {
        display: flex;
        justify-content: right;
        color: #e4e7ed;
      }

      .title {
        font-size: 16px;
        font-weight: normal;
        padding: 0;
        color: #409eff;
      }
    }
    .border {
      border-color: #409eff;
      transition: all 0.2s;
    }

    .question-ul {
      margin-top: 10px;

      .question-li {
        display: flex;
        justify-content: space-between;
        padding: 10px;
        margin-top: 10px;
        border-radius: 10px;
        background-color: #ecf5ff;
        border: 1px solid transparent;
        cursor: pointer;
        transition: all 0.3s;

        label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
        }

        &:hover {
          border-color: #79bbff;
        }
      }
    }

    .footer {
      border: 1px solid transparent;
      background-color: #fff;
      border-radius: 20px;
      width: 1080px;
      padding: 10px;
      margin-bottom: 50px;
      .textarea-box {
        height: 60px;
        overflow-y: auto;
      }

      :deep(.el-textarea__inner) {
        box-shadow: none;
      }

      .send-box {
        display: flex;
        justify-content: right;

        .el-button {
          width: 40px;
          height: 40px;
          border-radius: 10px;
        }
      }

      &:hover {
        box-shadow: 0 4px 8px 0 rgba(115, 110, 240, 0.1);
      }
    }
  }
}
</style>
