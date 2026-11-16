<template>
  <div class="auth">
    <!-- ==================== 表单侧 ==================== -->
    <section class="auth-panel">
      <header class="brand">
        <span class="brand-mark" aria-hidden="true">
          <!-- 与 components/layout/Sidebar.vue 的品牌立方体保持一致，后续可抽成公共组件 -->
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" fill="white" opacity="0.9" />
            <path
              d="M12 22V12M12 12L2 7M12 12L22 7"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="brand-name">AI视频 · CPU/GPU版</span>
      </header>

      <div class="auth-block">
        <h1 class="auth-title">{{ isRegister ? '创建账号' : '欢迎回来' }}</h1>
        <p class="auth-lede">
          {{ isRegister ? '注册后即可创建第一条剧情短视频。' : '登录后管理形象定制、内容创作、视频合成与剪辑发布。' }}
        </p>

        <div class="mode-switch" role="group" aria-label="切换登录或注册">
          <span class="mode-thumb" :class="{ 'is-right': isRegister }" aria-hidden="true"></span>
          <button
            type="button"
            class="mode-btn"
            :class="{ 'is-active': !isRegister }"
            :aria-pressed="!isRegister"
            @click="setMode(false)"
          >
            登录
          </button>
          <button
            type="button"
            class="mode-btn"
            :class="{ 'is-active': isRegister }"
            :aria-pressed="isRegister"
            @click="setMode(true)"
          >
            注册
          </button>
        </div>

        <p
          v-if="notice"
          class="notice"
          :class="`notice--${notice.tone}`"
          :role="notice.tone === 'error' ? 'alert' : 'status'"
        >
          {{ notice.text }}
        </p>

        <!-- ---------------- 登录 ---------------- -->
        <el-form
          v-show="!isRegister"
          ref="loginFormRef"
          class="auth-form"
          label-position="top"
          :model="loginForm"
          :rules="loginRules"
          @submit.prevent="handleLogin"
          @validate="onValidate('login')"
        >
          <el-form-item prop="username">
            <template #label><span class="field-label">用户名</span></template>
            <input
              v-model="loginForm.username"
              class="field"
              type="text"
              name="username"
              autocomplete="username"
              spellcheck="false"
              v-bind="loginFieldAria('username')"
              @blur="checkLoginField('username')"
              @input="inputLoginField('username')"
            />
            <template #error="{ error }">
              <p :id="errorId('login', 'username')" class="field-error">{{ error }}</p>
            </template>
          </el-form-item>

          <el-form-item prop="password">
            <template #label><span class="field-label">密码</span></template>
            <div class="field-group">
              <input
                v-model="loginForm.password"
                class="field field--affixed"
                :type="showLoginPassword ? 'text' : 'password'"
                name="password"
                autocomplete="current-password"
                v-bind="loginFieldAria('password')"
                @blur="checkLoginField('password')"
                @input="inputLoginField('password')"
              />
              <button
                type="button"
                class="field-affix"
                :aria-label="showLoginPassword ? '隐藏密码' : '显示密码'"
                :aria-pressed="showLoginPassword"
                @click="showLoginPassword = !showLoginPassword"
              >
                <el-icon :size="17">
                  <Hide v-if="showLoginPassword" />
                  <View v-else />
                </el-icon>
              </button>
            </div>
            <template #error="{ error }">
              <p :id="errorId('login', 'password')" class="field-error">{{ error }}</p>
            </template>
          </el-form-item>

          <div class="options-row">
            <label class="remember">
              <input v-model="remember" class="remember-input" type="checkbox" />
              <span class="remember-text">记住我</span>
            </label>
          </div>

          <button class="submit" type="submit" :disabled="submitting">
            <span v-if="submitting" class="spinner" aria-hidden="true"></span>
            <span>{{ submitting ? '登录中' : '登录' }}</span>
          </button>
        </el-form>

        <!-- ---------------- 注册 ---------------- -->
        <el-form
          v-show="isRegister"
          ref="registerFormRef"
          class="auth-form"
          label-position="top"
          :model="registerForm"
          :rules="registerRules"
          @submit.prevent="handleRegister"
          @validate="onValidate('register')"
        >
          <el-form-item prop="username">
            <template #label>
              <span class="field-label">用户名</span>
              <span class="field-label-meta">3 到 20 个字符</span>
            </template>
            <input
              v-model="registerForm.username"
              class="field"
              type="text"
              name="new-username"
              autocomplete="username"
              spellcheck="false"
              v-bind="registerFieldAria('username')"
              @blur="checkRegisterField('username')"
              @input="inputRegisterField('username')"
            />
            <template #error="{ error }">
              <p :id="errorId('register', 'username')" class="field-error">{{ error }}</p>
            </template>
          </el-form-item>

          <el-form-item prop="email">
            <template #label><span class="field-label">邮箱</span></template>
            <input
              v-model="registerForm.email"
              class="field"
              type="email"
              name="email"
              autocomplete="email"
              spellcheck="false"
              placeholder="name@example.com"
              v-bind="registerFieldAria('email')"
              @blur="checkRegisterField('email')"
              @input="inputRegisterField('email')"
            />
            <template #error="{ error }">
              <p :id="errorId('register', 'email')" class="field-error">{{ error }}</p>
            </template>
          </el-form-item>

          <el-form-item prop="password">
            <template #label>
              <span class="field-label">密码</span>
              <span class="field-label-meta">至少 6 位</span>
            </template>
            <div class="field-group">
              <input
                v-model="registerForm.password"
                class="field field--affixed"
                :type="showRegisterPassword ? 'text' : 'password'"
                name="new-password"
                autocomplete="new-password"
                v-bind="registerFieldAria('password')"
                @blur="checkRegisterField('password')"
                @input="inputRegisterField('password')"
              />
              <button
                type="button"
                class="field-affix"
                :aria-label="showRegisterPassword ? '隐藏密码' : '显示密码'"
                :aria-pressed="showRegisterPassword"
                @click="showRegisterPassword = !showRegisterPassword"
              >
                <el-icon :size="17">
                  <Hide v-if="showRegisterPassword" />
                  <View v-else />
                </el-icon>
              </button>
            </div>
            <template #error="{ error }">
              <p :id="errorId('register', 'password')" class="field-error">{{ error }}</p>
            </template>
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <template #label><span class="field-label">确认密码</span></template>
            <input
              v-model="registerForm.confirmPassword"
              class="field"
              :type="showRegisterPassword ? 'text' : 'password'"
              name="confirm-password"
              autocomplete="new-password"
              v-bind="registerFieldAria('confirmPassword')"
              @blur="checkRegisterField('confirmPassword')"
              @input="inputRegisterField('confirmPassword')"
            />
            <template #error="{ error }">
              <p :id="errorId('register', 'confirmPassword')" class="field-error">{{ error }}</p>
            </template>
          </el-form-item>

          <button class="submit" type="submit" :disabled="submitting">
            <span v-if="submitting" class="spinner" aria-hidden="true"></span>
            <span>{{ submitting ? '注册中' : '注册' }}</span>
          </button>
        </el-form>
      </div>
    </section>

    <!-- ==================== 展示侧：固定人物 + 文字轮换 ==================== -->
    <aside class="stage">
      <div class="stage-inner">
        <figure class="hero-figure">
          <img class="hero-img" :src="heroImg" alt="AI 剧情视频创作" />
          <div class="hero-copy" @mouseenter="stopHero" @mouseleave="startHero">
            <div class="hero-slides">
              <div
                v-for="(slide, i) in heroSlides"
                :key="slide.heading"
                class="hero-slide-copy"
                :class="{ 'is-active': i === heroIndex }"
              >
                <h3 class="hero-heading">{{ slide.heading }}</h3>
                <p class="hero-accent">{{ slide.accent }}</p>
              </div>
            </div>

            <div class="hero-dots" role="group" aria-label="横幅文字切换">
              <button
                v-for="(slide, i) in heroSlides"
                :key="slide.cta"
                type="button"
                class="hero-dot"
                :class="{ 'is-active': i === heroIndex }"
                :aria-label="`切换到第 ${i + 1} 组文案`"
                @click="showHero(i)"
              ></button>
            </div>

            <div class="hero-ctas">
              <span
                v-for="(slide, i) in heroSlides"
                :key="slide.cta"
                class="hero-cta"
                :class="{ 'is-active': i === heroIndex }"
              >{{ slide.cta }}</span>
            </div>
          </div>
        </figure>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Hide, View } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import heroImg from '../assets/hero-person.png'

const router = useRouter()
const authStore = useAuthStore()

const isRegister = ref(false)
const submitting = ref(false)
const remember = ref(true)

const showLoginPassword = ref(false)
const showRegisterPassword = ref(false)

/* ---------------- 展示侧文字轮换（人物图固定） ---------------- */
const heroSlides = [
  { heading: '无需显卡的短视频工作台', accent: '云端生成，本地轻量制作', cta: '开始创作' },
  { heading: '本地 CPU / GPU 语音识别', accent: '音视频转文字与字幕导出', cta: '本地识别' },
  { heading: '分镜生成与成片管理', accent: '逐镜预览，按需重做，人工确认发布', cta: '视频制作' }
]

const HERO_INTERVAL = 4500
const heroIndex = ref(0)
let heroTimer: ReturnType<typeof setInterval> | null = null

const showHero = (next: number) => {
  heroIndex.value = (next + heroSlides.length) % heroSlides.length
}

const startHero = () => {
  stopHero()
  // 尊重系统的减少动态偏好：不开自动轮换，用户可用三条杠手动切换
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  heroTimer = setInterval(() => showHero(heroIndex.value + 1), HERO_INTERVAL)
}

const stopHero = () => {
  if (heroTimer) {
    clearInterval(heroTimer)
    heroTimer = null
  }
}

onMounted(startHero)
onBeforeUnmount(stopHero)

const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()

/** 顶部的表单元信息：服务端错误用红色告警条，注册成功用绿色提示条 */
const notice = ref<{ tone: 'error' | 'success'; text: string } | null>(null)

/** 每个字段最近一次校验结果，用于 aria-invalid */
const invalid = reactive<Record<string, boolean>>({})

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loginRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

type FormKey = 'login' | 'register'

/**
 * 两张表单的 prop 同名（username / password），
 * 所以校验状态和错误提示的 id 都要带表单前缀，否则登录页输入一次会把注册页置为错误态，
 * 而且两张表单同时挂载（v-show）会出现重复 DOM id。
 */
const fieldKey = (form: FormKey, prop: string) => `${form}:${prop}`
const errorId = (form: FormKey, prop: string) => `${form}-error-${prop}`

/** 直接交给 input 的 v-bind，一次把 aria 状态接对 */
const fieldAria = (form: FormKey, prop: string) => ({
  'aria-invalid': invalid[fieldKey(form, prop)] ? 'true' : 'false',
  'aria-describedby': invalid[fieldKey(form, prop)] ? errorId(form, prop) : undefined
})

const loginFieldAria = (prop: string) => fieldAria('login', prop)
const registerFieldAria = (prop: string) => fieldAria('register', prop)

/** el-form 每次校验后派发结果，按表单分开记 */
const onValidate = (form: FormKey) => (prop: string, isValid: boolean) => {
  invalid[fieldKey(form, prop)] = !isValid
}

/**
 * 本项目用的是原生 input（为了完整控制视觉），
 * 所以 blur 时的校验触发要手动调一次 validateField，不能依赖 el-input 组件。
 */
const checkField = (formRef: typeof loginFormRef, form: FormKey, prop: string) => {
  formRef.value?.validateField(prop, () => {})
}

const onFieldInput = (formRef: typeof loginFormRef, form: FormKey, prop: string) => {
  if (notice.value?.tone === 'error') notice.value = null
  if (invalid[fieldKey(form, prop)]) checkField(formRef, form, prop)
}

const checkLoginField = (prop: string) => checkField(loginFormRef, 'login', prop)
const checkRegisterField = (prop: string) => checkField(registerFormRef, 'register', prop)
const inputLoginField = (prop: string) => onFieldInput(loginFormRef, 'login', prop)
const inputRegisterField = (prop: string) => onFieldInput(registerFormRef, 'register', prop)

const setMode = (register: boolean) => {
  if (isRegister.value === register) return
  isRegister.value = register
  notice.value = null
  Object.keys(invalid).forEach((key) => delete invalid[key])
  showLoginPassword.value = false
  showRegisterPassword.value = false
}

/** 后端 FastAPI 的 detail 优先，其次才是 axios 的通用文案 */
const readError = (error: any, fallback: string) => {
  const data = error?.response?.data
  if (typeof data?.detail === 'string' && data.detail) return data.detail
  if (Array.isArray(data?.detail) && data.detail.length) {
    return data.detail[0]?.msg || fallback
  }
  if (typeof data?.message === 'string' && data.message) return data.message
  if (typeof error?.message === 'string' && !/status code/i.test(error.message)) {
    return error.message
  }
  return fallback
}

const handleLogin = async () => {
  if (submitting.value) return
  notice.value = null

  const valid = await loginFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await authStore.login(loginForm.username, loginForm.password, remember.value)
    ElMessage.success('登录成功')
    router.replace('/')
  } catch (error) {
    notice.value = { tone: 'error', text: readError(error, '登录失败，请稍后重试') }
  } finally {
    submitting.value = false
  }
}

const handleRegister = async () => {
  if (submitting.value) return
  notice.value = null

  const valid = await registerFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const username = registerForm.username
    await authStore.register(username, registerForm.email, registerForm.password)
    setMode(false)
    loginForm.username = username
    loginForm.password = ''
    notice.value = { tone: 'success', text: '注册成功，用刚才的账号登录即可。' }
  } catch (error) {
    notice.value = { tone: 'error', text: readError(error, '注册失败，请稍后重试') }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* ==========================================================
   登录页设计令牌
   形状规则：外层控件（输入框、按钮、分段开关、提示条）统一 10px；
             控件内部元素（分段指示块、内嵌图标按钮）统一 7px = 10 - 3。
   配色锁定：只用一个品牌紫蓝，语义色只用于错误态。
   ========================================================== */
.auth {
  --r-outer: 10px;
  --r-inner: 7px;

  --ink-900: #0d0d16;

  --paper: #ffffff;
  --canvas: #f7f8fb;
  --line: #e3e6ef;
  --line-strong: #cdd3e2;

  --text-1: #171923;
  --text-2: #5b6070;
  --text-3: #6b7183;

  --brand: #5568d3;
  --brand-deep: #6a4098;
  --brand-soft: rgba(85, 104, 211, 0.14);
  --danger: #d92d20;

  --font-mono: 'SF Mono', Consolas, Monaco, 'Courier New', monospace;

  display: grid;
  grid-template-columns: minmax(0, 46fr) minmax(0, 54fr);
  height: 100%;
  min-height: 100dvh;
  background: var(--canvas);
  color: var(--text-1);
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', 'Segoe UI', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ---------------- 表单侧 ---------------- */
.auth-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 40px clamp(28px, 4vw, 56px) 48px;
  background: var(--paper);
  /* 窗口太矮时让表单侧自己滚，不去挤占展示侧 */
  overflow-y: auto;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%);
  box-shadow: 0 2px 10px rgba(85, 104, 211, 0.26);
}

.brand-name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.auth-block {
  width: 100%;
  max-width: 392px;
  margin: auto;
  padding: 32px 0 24px;
}

.auth-title {
  margin: 0;
  font-size: 30px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.auth-lede {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-2);
}

/* ---------------- 登录 / 注册 分段开关 ---------------- */
.mode-switch {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  margin-top: 28px;
  padding: 4px;
  border-radius: var(--r-outer);
  background: #f1f3f9;
}

.mode-thumb {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: 38px;
  border-radius: var(--r-inner);
  background: var(--paper);
  box-shadow: 0 1px 3px rgba(23, 25, 35, 0.12);
  transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.mode-thumb.is-right {
  transform: translateX(100%);
}

.mode-btn {
  position: relative;
  z-index: 1;
  height: 38px;
  border: 0;
  background: transparent;
  border-radius: var(--r-inner);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-3);
  cursor: pointer;
  transition: color 180ms ease;
}

.mode-btn.is-active {
  color: var(--text-1);
}

.mode-btn:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

/* ---------------- 提示条 ---------------- */
.notice {
  margin: 18px 0 0;
  padding: 11px 14px;
  border-radius: var(--r-outer);
  border-left: 3px solid transparent;
  font-size: 13.5px;
  line-height: 1.6;
}

.notice--error {
  border-left-color: var(--danger);
  background: rgba(217, 45, 32, 0.06);
  color: #a8241a;
}

.notice--success {
  border-left-color: #157347;
  background: rgba(21, 115, 71, 0.07);
  color: #10603b;
}

/* ---------------- 表单 ---------------- */
.auth-form {
  margin-top: 24px;
}

.auth-form :deep(.el-form-item) {
  margin-bottom: 22px;
}

.auth-form :deep(.el-form-item__label) {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  width: 100%;
  height: auto;
  padding: 0 0 8px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--text-2);
}

.field-label-meta {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-3);
}

.auth-form :deep(.el-form-item__content) {
  display: block;
  line-height: normal;
}

.field {
  width: 100%;
  height: 46px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: var(--r-outer);
  background: var(--paper);
  font-family: inherit;
  font-size: 14px;
  color: var(--text-1);
  outline: none;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.field::placeholder {
  color: var(--text-3);
}

.field:hover {
  border-color: var(--line-strong);
}

.field:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-soft);
}

.field[aria-invalid='true'] {
  border-color: var(--danger);
}

.field[aria-invalid='true']:focus {
  box-shadow: 0 0 0 3px rgba(217, 45, 32, 0.13);
}

.field--affixed {
  padding-right: 46px;
}

.field-group {
  position: relative;
}

.field-affix {
  position: absolute;
  top: 50%;
  right: 6px;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  transform: translateY(-50%);
  border: 0;
  border-radius: var(--r-inner);
  background: transparent;
  color: var(--text-3);
  cursor: pointer;
  transition:
    color 150ms ease,
    background 150ms ease;
}

.field-affix:hover {
  color: var(--text-1);
  background: rgba(23, 25, 35, 0.05);
}

.field-affix:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: -2px;
}

.field-error {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.4;
}

.auth-form :deep(.el-form-item__error) {
  color: var(--danger);
}

/* ---------------- 记住我 ---------------- */
.options-row {
  display: flex;
  align-items: center;
  margin: 2px 0 24px;
}

.remember {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  user-select: none;
}

.remember-input {
  appearance: none;
  position: relative;
  flex: none;
  width: 17px;
  height: 17px;
  margin: 0;
  border: 1.5px solid var(--line-strong);
  border-radius: 5px;
  background: var(--paper);
  cursor: pointer;
  transition:
    background 160ms ease,
    border-color 160ms ease;
}

.remember-input:checked {
  border-color: var(--brand);
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%);
}

.remember-input:checked::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 4px;
  width: 8px;
  height: 4px;
  border-left: 2px solid #ffffff;
  border-bottom: 2px solid #ffffff;
  transform: rotate(-45deg);
}

.remember-input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--brand-soft);
}

.remember-text {
  font-size: 13.5px;
  color: var(--text-2);
}

/* ---------------- 主按钮 ---------------- */
.submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  height: 48px;
  border: 0;
  border-radius: var(--r-outer);
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%);
  box-shadow: 0 6px 18px rgba(85, 104, 211, 0.24);
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #ffffff;
  cursor: pointer;
  transition:
    transform 140ms ease,
    box-shadow 180ms ease,
    filter 180ms ease;
}

.submit:hover:not(:disabled) {
  filter: brightness(1.06);
  box-shadow: 0 10px 24px rgba(85, 104, 211, 0.3);
}

.submit:active:not(:disabled) {
  transform: translateY(1px);
}

.submit:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 3px;
}

.submit:disabled {
  cursor: default;
  opacity: 0.72;
  box-shadow: none;
  filter: saturate(0.6);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.42);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: auth-spin 700ms linear infinite;
}

@keyframes auth-spin {
  to {
    transform: rotate(1turn);
  }
}

/* ---------------- 展示侧：固定人物图 + 文字轮换 ---------------- */
.stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: clamp(32px, 5vw, 72px);
  background:
    radial-gradient(90% 70% at 82% 8%, rgba(120, 132, 235, 0.16), transparent 62%),
    radial-gradient(80% 60% at 8% 96%, rgba(150, 105, 200, 0.12), transparent 60%),
    linear-gradient(160deg, #f2f3fd 0%, #eaecfb 52%, #e7e3f8 100%);
  animation: auth-fade 700ms ease both;
}

.stage-inner {
  position: relative;
  width: min(100%, 880px);
}

.hero-figure {
  position: relative;
  width: 100%;
  margin: 0;
  aspect-ratio: 2.5 / 1;
  border-radius: 18px;
  overflow: hidden;
  background: linear-gradient(105deg, #f7f5fc 0%, #eef1fa 46%, #f0f7fb 78%, #f2f8fc 100%);
  box-shadow:
    0 24px 60px rgba(85, 104, 211, 0.18),
    0 4px 14px rgba(23, 25, 35, 0.06);
  animation: auth-rise 620ms cubic-bezier(0.16, 0.84, 0.44, 1) both;
}

/* 人物图按高铺满、左对齐，右缘蒙版淡出融入卡片渐变背景 */
.hero-img {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: auto;
  -webkit-mask-image: linear-gradient(to right, #000 94%, rgba(0, 0, 0, 0.55) 100%);
  mask-image: linear-gradient(to right, #000 94%, rgba(0, 0, 0, 0.55) 100%);
}

.hero-copy {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 47%;
  padding-right: 2%;
  text-align: center;
}

/* grid 叠放：三组文字同占一格，取最高者定高，切换不跳动 */
.hero-slides {
  display: grid;
  width: 100%;
}

.hero-slide-copy {
  grid-area: 1 / 1;
  opacity: 0;
  transform: translateX(16px);
  transition:
    opacity 600ms ease,
    transform 600ms ease;
}

.hero-slide-copy.is-active {
  opacity: 1;
  transform: none;
}

.hero-heading {
  margin: 0;
  font-size: clamp(19px, 2vw, 29px);
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: 0.01em;
  color: #2c2f3a;
}

.hero-accent {
  margin: 8px 0 0;
  font-size: clamp(19px, 2.05vw, 30px);
  font-weight: 700;
  line-height: 1.35;
  background: linear-gradient(115deg, #3d55e8 0%, #7b4df1 55%, #c06cf0 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-ctas {
  display: grid;
}

.hero-cta {
  grid-area: 1 / 1;
  justify-self: center;
  padding: 9px 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6b5cf1 0%, #8b5cf6 100%);
  box-shadow: 0 6px 16px rgba(107, 92, 241, 0.3);
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity 500ms ease 120ms,
    transform 500ms ease 120ms;
  pointer-events: none;
}

.hero-cta.is-active {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}

/* ---- 三条杠指示器 ---- */
.hero-dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  animation: auth-fade 500ms ease 260ms both;
}

.hero-dot {
  width: 28px;
  height: 4px;
  padding: 0;
  border: 0;
  border-radius: 2px;
  background: #c7cde6;
  cursor: pointer;
  transition:
    background 220ms ease,
    width 220ms ease;
}

.hero-dot:hover {
  background: #aab2d6;
}

.hero-dot.is-active {
  width: 40px;
  background: #6b5cf1;
}

.hero-dot:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 3px;
}

/* ---------------- 入场节奏 ---------------- */
.auth-block > * {
  animation: auth-rise 420ms cubic-bezier(0.16, 0.84, 0.44, 1) both;
}

.auth-block > *:nth-child(2) {
  animation-delay: 50ms;
}

.auth-block > *:nth-child(3) {
  animation-delay: 100ms;
}

.auth-block > *:nth-child(4) {
  animation-delay: 150ms;
}

.auth-block > *:nth-child(5) {
  animation-delay: 200ms;
}

@keyframes auth-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes auth-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* ---------------- 响应式 ---------------- */
@media (max-width: 1023px) {
  .auth {
    grid-template-columns: 1fr;
  }

  /* 明确规则：窄屏隐藏展示侧，表单侧铺满，品牌标仍在左上角 */
  .stage {
    display: none;
  }

  .auth-panel {
    padding: 32px 24px 40px;
  }
}

@media (max-width: 480px) {
  .auth-panel {
    padding: 26px 20px 32px;
  }

  .auth-title {
    font-size: 26px;
  }

  .field,
  .submit {
    height: 46px;
  }
}

/* 矮窗口：整体收紧，保证主按钮不落到折线以下 */
@media (max-height: 820px) {
  .auth-block {
    padding: 12px 0;
  }

  .hero-copy {
    gap: 12px;
  }
}

@media (max-height: 720px) {
  .auth-title {
    font-size: 26px;
  }

  .mode-switch {
    margin-top: 20px;
  }

  .auth-form {
    margin-top: 18px;
  }

  .stage {
    padding: 24px 28px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-block > *,
  .stage,
  .hero-figure {
    animation: none !important;
  }

  /* 加载指示器是状态表达，不关闭，只放慢 */
  .spinner {
    animation-duration: 1800ms;
  }

  .mode-thumb,
  .field,
  .field-affix,
  .submit,
  .remember-input,
  .hero-slide-copy,
  .hero-cta,
  .hero-dot {
    transition: none !important;
  }
}
</style>
