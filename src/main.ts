import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import {
  create,
  NButton,
  NCard,
  NConfigProvider,
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NProgress,
  NSlider,
  NSpace,
  NSwitch,
  NUpload,
  NUploadDragger,
  NMessageProvider
} from 'naive-ui'
import './style.css'

const naive = create({
  components: [
    NButton,
    NCard,
    NConfigProvider,
    NIcon,
    NLayout,
    NLayoutContent,
    NLayoutHeader,
    NProgress,
    NSlider,
    NSpace,
    NSwitch,
    NUpload,
    NUploadDragger,
    NMessageProvider
  ]
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(naive)

app.mount('#app') 