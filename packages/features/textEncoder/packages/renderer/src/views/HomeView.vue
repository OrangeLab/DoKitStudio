<template>
  <div class="mainContainer">
    <div>
      <p class="heading"><b>Dokit Studio编解码工具</b></p>
    </div>

    <div class="header">
      <div class="header-left">
        <p class="code-label">编码方式:</p>
        <a-cascader class="type-selector"
            :options="options" 
            :style="{width:'320px'}" 
            v-model="state.selectedType" 
            :format-label="format"
            @change="convert"
            style="border-radius: 5px;"/>
        <a-button class="convert-btn" type="primary" @click="convert">开始转换</a-button>
        <a-button class="convert-btn" type="outline" @click="clear">清空</a-button>
      </div>
      <a-button class="convert-btn" type="secondary" @click="copy">复制输出结果</a-button>
    </div>

    <div class="textarea-grid">
      <div class="text-input">
        <a-textarea
          :auto-size="{minRows:15, maxRows:15}"
          placeholder="请输入文本"
          v-model="state.sourceContent"
          style="margin-top: 20px;
            padding: 10px;
            border-radius: 10px;"
          allow-clear/>
      </div>
      <div class="text-output">
        <a-textarea
          :auto-size="{minRows:15, maxRows:15}"
          placeholder="输出转换内容"
          v-model="state.resultContent"
          style="margin-top: 20px;
            padding: 10px;
            border-radius: 10px;"
          readonly/>
      </div>
      <!-- <p>{{ state.resultContent }}</p>
      <a-textarea>this is the content</a-textarea> -->
    </div>

    <div class="bottom-label">
      <p>输入文本内容</p>
      <p>输出文本内容</p>
    </div>

    <div class="footer">
      <p>Dokit Studio编解码工具是基于FeHelper（MIT license）的一款编解码工具</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive, getCurrentInstance } from 'vue'
import EncodeUtils from '../utils/endecode-lib.js'
import he from '../utils/he.js'

// 变量
const state = reactive({
    selectedType: 'encode-Unicode',
    sourceContent: '',
    resultContent: '',
})

// 获取this.$message组合式API写法
const cns = getCurrentInstance()

const options = [
  {
    value: 'encode',
    label: '编码',
    children: [
      { value: 'encode-Unicode', label: 'Unicode (\\u开头)'},
      { value: 'encode-UTF8', label: 'UTF-8 (%开头)'},
      { value: 'encode-UTF16', label: 'UTF-16 (\\x开头)'},
      { value: 'encode-Base64', label: 'Base64'},
      { value: 'encode-Hex', label: 'Hex'},
      { value: 'encode-normalHTML', label: 'HTML普通编码'},
      { value: 'encode-fullHTML', label: 'HTML深度编码'},
      { value: 'encode-HTML2Js', label: 'HTML转JS'},
    ],
  },
  {
    value: 'decode',
    label: '解码',
    children :[
      { value: 'decode-Unicode', label: 'Unicode (\\u开头)'},
      { value: 'decode-UTF8', label: 'UTF-8 (%开头)'},
      { value: 'decode-UTF16', label: 'UTF-16 (\\x开头)'},
      { value: 'decode-Base64', label: 'Base64'},
      { value: 'decode-Hex', label: 'Hex'},
      { value: 'decode-HTML', label: 'HTML'},
    ]
  },
  {
    value: 'encrypt',
    label: '加密',
    children :[
      { value: 'encrypt-MD5', label: 'MD5计算'},
      { value: 'encrypt-Sha1', label: 'Sha-1加密'},
    ]
  },
]

const format = (options: any) => {
  const labels = options.map(option => option.label)
  return labels.join('-')
}

// 函数
function convert() {
  // 编码
  if(state.selectedType === 'encode-Unicode') {
    // Unicode
    state.resultContent = EncodeUtils.uniEncode(state.sourceContent)
  } else if(state.selectedType === 'encode-UTF8') {
    // UTF8 or URL encode
    state.resultContent = encodeURIComponent(state.sourceContent)
  } else if(state.selectedType === 'encode-UTF16') {
    // UTF16
    state.resultContent = EncodeUtils.utf8to16(encodeURIComponent(state.sourceContent))
  } else if(state.selectedType === 'encode-Base64') {
    // Base64
    state.resultContent = EncodeUtils.base64Encode(EncodeUtils.utf8Encode(state.sourceContent))
  } else if(state.selectedType === 'encode-Hex') {
    // hex or 十六进制编码
    state.resultContent = EncodeUtils.hexEncode(state.sourceContent)
  } else if(state.selectedType === 'encode-normalHTML') {
    // HTML普通编码
    state.resultContent = he.encode(state.sourceContent, {
      'useNamedReferences': true,
      'allowUnsafeSymbols': true
    })
  } else if(state.selectedType === 'encode-fullHTML') {
    // HTML深度编码
    state.resultContent = he.encode(state.sourceContent, {
      'encodeEverything': true,
      'useNamedReferences': true,
      'allowUnsafeSymbols': true
    })
  } else if(state.selectedType === 'encode-HTML2Js') {
    // HTML转JS
    state.resultContent = EncodeUtils.html2js(state.sourceContent)
  } 

  // 解码
  else if(state.selectedType === 'decode-Unicode') {
    // unicode
    state.resultContent = EncodeUtils.uniDecode(state.sourceContent)
  }  else if(state.selectedType === 'decode-UTF8') {
    // UTF8 or URL decode
    state.resultContent = decodeURIComponent(state.sourceContent)
  } else if(state.selectedType === 'decode-UTF16') {
    // UTF16
    state.resultContent = decodeURIComponent(EncodeUtils.utf16to8(state.sourceContent))
  }else if(state.selectedType === 'decode-Base64') {
    // Base64
    state.resultContent = EncodeUtils.utf8Decode(EncodeUtils.base64Decode(state.sourceContent))
  } else if(state.selectedType === 'decode-Hex') {
    // hex or 十六进制解码
    state.resultContent = EncodeUtils.hexDecode(state.sourceContent)
  } else if(state.selectedType === 'decode-HTML') {
    // HTML
    state.resultContent = he.decode(state.sourceContent, {
      'isAttributeValue': false
    })
  }

  // 加密
  else if(state.selectedType === 'encrypt-MD5') {
    // MD5
    state.resultContent = EncodeUtils.md5(state.sourceContent)
  } else if(state.selectedType === 'encrypt-Sha1') {
    // sha-1
    state.resultContent = EncodeUtils.sha1Encode(state.sourceContent);
  }
    // console.log(EncodeUtils.uniEncode(state.text1))
}

function clear() {
  state.sourceContent = ''
  state.resultContent = ''
}

function copy() {
  const instance = getCurrentInstance()
  try {
    if(state.resultContent !== '') {
      navigator.clipboard.writeText(state.resultContent)
      cns?.appContext.config.globalProperties.$message.success('已复制到剪切板!\n')
    }else {
      cns?.appContext.config.globalProperties.$message.error('当前输出面板为空')
    }
  } catch(e) {
    throw e
  }
}

</script>

<style scoped>
.mainContainer {
  margin: 40px;
}

.heading {
  font-size: 40px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}

.code-label {
  font-size: 20px;
  margin: 0 20px 0 0;
  font-weight: bold;
}

.convert-btn{
  margin: 0 0 0 10px;
  border-radius: 5px;
}

.textarea-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 20px;
}
.bottom-label {
  margin: 0 10px;
  color: gray;
  opacity: 50%;
  display: flex;
  justify-content: space-between;
}
.footer {
  color: gray;
  opacity: 50%;
  -moz-user-select: none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  -o-user-select: none;
  user-select: none;
  display: flex;
  justify-content: center;
}
</style>
