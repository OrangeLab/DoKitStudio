<template>
    <div style="width: 100%; background: #fafafa; margin-bottom: 5px;">
        <el-button @click="copyJson">复制</el-button>
        <el-button @click="pasteJson">粘贴</el-button>
        <el-button @click="clearJson">清空</el-button>
        <el-button @click="formatJson">格式化</el-button>
        <el-button @click="undoInput">撤销</el-button>
        <el-button @click="redoInput">恢复</el-button>
        <el-button @click="openFile">导入</el-button>
        <el-button @click="saveFile">导出</el-button>
    </div>
    <div class="common-layout">
        <el-container>
            <el-aside width="40vw">
                <el-input type="textarea" :autosize="{ minRows: 30, maxRows: 30 }" v-model="inputData" style="width: 100%;"
                    @keydown="keydown" @keyup="keyup" @input="debounceChangeValue"></el-input>
            </el-aside>
            <el-main>
                <json-viewer v-if="isValid['isJSON']" :value="isValid['text']" :expand-depth="100"
                    style="height:80vh; overflow: scroll;">
                </json-viewer>
                <el-alert v-else title="JSON不合法" type="error" show-icon>
                    <p style="font-size: medium;">Message: {{ isValid['text'] }}</p>
                </el-alert>
            </el-main>
        </el-container>
    </div>
</template>
    
<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { ElInput, ElContainer, ElAside, ElMain, ElAlert, ElButton } from 'element-plus'
import 'element-plus/dist/index.css'
import JsonViewer from 'vue-json-viewer'

import { useCommand } from '../utils/useCommand'
import { jsonlint } from '../utils/jsonlint'

const inputData = ref();
const isValid = ref({
    isJSON: true,
    text: ""
});

const inputTimer = ref(null);

// 更新isValid值
const changeValue = () => {
    if (!inputData.value) {
        isValid.value.text = "";
        isValid.value.isJSON = true;
        return;
    }
    try {
        isValid.value.text = jsonlint.parse(inputData.value);
        isValid.value.isJSON = true;
    }
    catch (e) {
        isValid.value.isJSON = false;
        isValid.value.text = e.message;
    }
}

// 输入框input触发事件，防抖
const debounceChangeValue = () => {
    if (inputTimer.value !== null) clearTimeout(inputTimer.value);
    inputTimer.value = setTimeout(changeValue, 500);
}

const { commands } = useCommand(inputData);

// 撤销
const undoInput = () => {
    commands.undo();
    changeValue();
}

// 恢复
const redoInput = () => {
    commands.redo();
    changeValue();
}

// 格式化json字符串
const formatJson = () => {
    if (inputData.value && isValid.value.isJSON && inputData.value != JSON.stringify(JSON.parse(inputData.value), null, '\t')) {
        commands.format();
    }
    changeValue();
}

// 拷贝输入框里内容
const copyJson = async () => {
    await navigator.clipboard.writeText(inputData.value)
    console.log("copy success")
}

// 粘贴
const pasteJson = async () => {
    commands.paste(await navigator.clipboard.readText());
    changeValue();
    console.log("paste success")
}

// 清空输入框
const clearJson = () => {
    commands.clear();
    changeValue();
}

// 记录键盘输入前的值
let beforeData = null;
// keydown keyup模拟input事件
const keydown = (e) => {
    if (e.key == "Shift") return;
    beforeData = inputData.value
}

const keyup = (e) => {
    if (e.key == "Shift") return;
    commands.input(beforeData, inputData.value)
}

// 打开文件
const openFile = async () => {
    const fileContent = await window.electronAPI.openFile()
    commands.load(fileContent);
    changeValue();
}

// 保存文件
const saveFile = async () => {
    window.electronAPI.saveFile(inputData.value);
}

</script>