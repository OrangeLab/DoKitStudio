<template>
    <div class="app">
        <JsonEditor></JsonEditor>
    </div>
</template>
<script>
import JsonEditor from './components/JsonEditor.vue';

export default {
    components: {
        JsonEditor
    },
}
</script>
<style>
.app {
    position: fixed;
    top: 20px;
    bottom: 20px;
    left: 20px;
    right: 20px;
}
</style>