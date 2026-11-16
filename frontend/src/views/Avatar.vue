<template>
  <div class="split-layout left-rail">
    <aside class="panel panel-pad">
      <div class="panel-heading">
        <div>
          <h2>剧情角色</h2>
          <p>已识别 {{ characters.length }} 个角色</p>
        </div>
        <button
          class="icon-button"
          title="添加角色"
          :disabled="!flow.script_id"
          @click="addCharacter"
        >
          <el-icon><Plus /></el-icon>
        </button>
      </div>
      <div class="selection-list">
        <button
          v-for="(character, i) in characters"
          :key="i"
          class="record-link"
          :class="{ active: selectedIndex === i }"
          @click="selectedIndex = i"
        >
          <span class="avatar-square">{{
            character.name?.charAt(0) || "角"
          }}</span>
          <div>
            <strong
              >{{ character.name
              }}{{ character.role ? " · " + character.role : "" }}</strong
            ><small>{{ character.appearance || "尚未填写外观描述" }}</small>
          </div>
          <el-icon><ArrowRight /></el-icon>
        </button>
      </div>
      <div v-if="!characters.length" class="empty compact">
        当前剧本没有角色
      </div>
      <button class="text-button form-gap" @click="scriptPicker = true">
        {{ flow.script_id ? "切换剧情稿" : "选择剧情稿"
        }}<el-icon><ArrowRight /></el-icon>
      </button>
      <button
        class="text-button form-gap"
        style="display: flex"
        @click="libraryOpen = true"
      >
        <el-icon><FolderOpened /></el-icon>打开形象库
      </button>
    </aside>
    <div class="stack" v-loading="loading">
      <template v-if="selected">
        <section class="panel panel-pad">
          <div class="panel-heading">
            <div>
              <h2>角色外观设定</h2>
              <p>描述越具体，生成的角色一致性越高</p>
            </div>
            <span class="badge info">{{ selected.role || "剧情角色" }}</span>
          </div>
          <div class="fields">
            <label class="field"
              >角色名称<input v-model="selected.name" maxlength="60" /></label
            ><label class="field"
              >角色定位<input
                v-model="selected.role"
                maxlength="100"
                placeholder="填写角色定位"
            /></label>
          </div>
          <label class="field form-gap"
            >外观描述<textarea
              v-model="selected.appearance"
              rows="3"
              maxlength="3000"
              placeholder="描述年龄、发型、五官、服饰和气质"
            />
          </label>
          <div class="toolbar form-gap">
            <button
              class="btn small"
              :disabled="saving || generating"
              @click="save"
            >
              <el-icon><Check /></el-icon
              >{{ saving ? "保存中…" : "保存设定" }}</button
            ><button
              class="icon-button delete-button"
              title="删除角色"
              aria-label="删除角色"
              :disabled="saving || generating"
              @click="removeCharacter"
            >
              <el-icon aria-hidden="true"><Delete /></el-icon>
            </button>
          </div>
        </section>
        <section class="panel panel-pad">
          <div class="panel-heading">
            <div>
              <h2>角色三视图</h2>
              <p>正面、侧面、背面整合并在同一张参考图中</p>
            </div>
            <button
              class="btn"
              :disabled="generating || saving || !selected.appearance?.trim()"
              @click="generate"
            >
              <el-icon :class="{ 'is-loading': generating }"
                ><Refresh /></el-icon
              >{{
                generating
                  ? "正在生成…"
                  : selected.views?.sheet
                    ? "重新生成"
                    : "生成三视图"
              }}
            </button>
          </div>
          <div v-if="selected.views?.sheet" class="character-sheet">
            <el-image
              :src="selected.views.sheet"
              :preview-src-list="[selected.views.sheet]"
              fit="contain"
              :alt="selected.name + '正面、侧面及背面参考图'"
            />
            <div class="sheet-labels">
              <span>正面</span><span>侧面</span><span>背面</span>
            </div>
          </div>
          <div v-else class="sheet-empty" v-loading="generating">
            <el-icon><Picture /></el-icon
            ><span>{{
              generating ? "正在生成角色参考图" : "尚未生成角色三视图"
            }}</span>
          </div>
          <div class="toolbar form-gap">
            <button class="btn small" @click="libraryOpen = true">
              <el-icon><FolderOpened /></el-icon>从形象库选择</button
            ><button
              v-if="selected.views?.sheet"
              class="btn small"
              @click="download"
            >
              <el-icon><Download /></el-icon>下载参考图</button
            ><button
              class="btn primary small"
              style="margin-left: auto"
              @click="next"
            >
              前往视频合成<el-icon><ArrowRight /></el-icon>
            </button>
          </div>
        </section>
      </template>
      <section v-else class="panel empty">
        <el-icon><User /></el-icon
        ><span>{{
          flow.script_id ? "为当前剧情添加角色" : "先选择一篇剧情稿"
        }}</span
        ><button
          class="btn primary"
          @click="flow.script_id ? addCharacter() : (scriptPicker = true)"
        >
          {{ flow.script_id ? "添加角色" : "选择剧情稿" }}
        </button>
      </section>
    </div>
    <el-dialog v-model="libraryOpen" title="形象库" width="780px">
      <div class="toolbar" style="margin-bottom: 18px">
        <button class="btn primary small" @click="imageDialog = true">
          <el-icon><Plus /></el-icon>生成新形象</button
        ><span class="muted">共 {{ assetTotal }} 个形象</span>
      </div>
      <div class="asset-grid" v-loading="libraryLoading">
        <article v-for="asset in assets" :key="asset.id" class="asset-item">
          <button
            class="asset-select"
            @click="chooseAsset(asset)"
            :title="selected ? '应用到当前角色' : '选择角色后可应用形象'"
          >
            <img
              :src="asset.result_image_url"
              :alt="asset.name || '角色形象'"
            />
          </button>
          <div class="asset-footer">
            <span>{{ asset.name }}</span
            ><button
              class="icon-button delete-button"
              title="删除形象"
              :aria-label="'删除形象 ' + (asset.name || '#' + asset.id)"
              @click="deleteAsset(asset)"
            >
              <el-icon aria-hidden="true"><Delete /></el-icon>
            </button>
          </div>
        </article>
      </div>
      <div v-if="!assets.length" class="empty">暂无已生成的角色图片</div>
      <div v-if="assetTotal > 12" class="pagination">
        <el-pagination
          small
          layout="prev, pager, next"
          :total="assetTotal"
          :page-size="12"
          v-model:current-page="assetPage"
          @current-change="loadAssets"
        /></div
    ></el-dialog>
    <el-dialog
      v-model="imageDialog"
      title="生成形象"
      width="580px"
      :close-on-click-modal="!imageGenerating"
    >
      <div class="stack">
        <el-radio-group v-model="imageMode" :disabled="imageGenerating"
          ><el-radio-button label="text">文字生图</el-radio-button
          ><el-radio-button label="image"
            >参考图微调</el-radio-button
          ></el-radio-group
        ><label class="field"
          >形象名称<input v-model="imageName" maxlength="60" /></label
        ><label v-if="imageMode === 'image'" class="field"
          >参考图片<input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            :disabled="imageGenerating"
            @change="
              imageSource =
                ($event.target as HTMLInputElement).files?.[0] || null
            " /></label
        ><label class="field"
          >{{ imageMode === "image" ? "调整要求" : "形象描述"
          }}<textarea v-model="imagePrompt" rows="5" maxlength="3000" /></label
        ><button
          class="btn primary full"
          :disabled="
            imageGenerating ||
            !imagePrompt.trim() ||
            (imageMode === 'image' && !imageSource)
          "
          @click="generateImage"
        >
          <el-icon :class="{ 'is-loading': imageGenerating }"
            ><MagicStick /></el-icon
          >{{ imageGenerating ? "正在生成…" : "生成形象" }}
        </button>
      </div>
    </el-dialog>
    <el-dialog v-model="scriptPicker" title="选择剧情稿" width="600px"
      ><button
        v-for="item in scripts"
        :key="item.id"
        class="record-link"
        @click="chooseScript(item)"
      >
        <div>
          <strong>{{ titleOf(item) }}</strong
          ><small>{{ dateText(item.created_at) }}</small>
        </div>
        <el-icon><ArrowRight /></el-icon>
      </button>
      <div v-if="!scripts.length" class="empty">
        暂无剧情稿<button class="btn primary" @click="router.push('/script')">
          前往创作
        </button>
      </div>
      <div v-if="scriptTotal > 10" class="pagination">
        <el-pagination
          small
          layout="prev, pager, next"
          :total="scriptTotal"
          :page-size="10"
          v-model:current-page="scriptPage"
          @current-change="loadScripts"
        /></div
    ></el-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { scriptApi, avatarApi } from "@/api";
import { useProductionStore } from "@/stores/production";
import { titleOf, dateText, useScript, downloadFile } from "@/utils/studio";
const router = useRouter(),
  { flow } = useProductionStore();
const characters = ref<any[]>(JSON.parse(JSON.stringify(flow.characters))),
  selectedIndex = ref(0);
const selected = computed(() => characters.value[selectedIndex.value]);
const imageDialog = ref(false),
  imageMode = ref("text"),
  imageName = ref(""),
  imagePrompt = ref(""),
  imageSource = ref<File | null>(null),
  imageGenerating = ref(false);
const loading = ref(false),
  saving = ref(false),
  generating = ref(false),
  libraryOpen = ref(false),
  libraryLoading = ref(false),
  assets = ref<any[]>([]),
  assetTotal = ref(0),
  assetPage = ref(1);
const scripts = ref<any[]>([]),
  scriptPicker = ref(false),
  scriptTotal = ref(0),
  scriptPage = ref(1);
function addCharacter() {
  characters.value.push({ name: "", role: "", appearance: "", views: {} });
  selectedIndex.value = characters.value.length - 1;
}
async function save() {
  if (!flow.script_id) return false;
  if (characters.value.some((c) => !c.name?.trim() || !c.appearance?.trim())) {
    ElMessage.warning("请填写每个角色的名称和外观描述");
    return false;
  }
  saving.value = true;
  try {
    const r = await scriptApi.updateCharacters(
      flow.script_id,
      characters.value,
    );
    useScript(r.data);
    characters.value = JSON.parse(JSON.stringify(flow.characters));
    ElMessage.success("角色设定已保存");
    return true;
  } catch {
    return false;
  } finally {
    saving.value = false;
  }
}
async function removeCharacter() {
  try {
    await ElMessageBox.confirm("删除当前角色设定？", "删除角色", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    return;
  }
  const backup = JSON.parse(JSON.stringify(characters.value));
  characters.value.splice(selectedIndex.value, 1);
  if (!(await save())) characters.value = backup;
  selectedIndex.value = Math.max(
    0,
    Math.min(selectedIndex.value, characters.value.length - 1),
  );
}
async function generate() {
  if (!selected.value || generating.value || !(await save())) return;
  const index = selectedIndex.value,
    character = characters.value[index];
  generating.value = true;
  try {
    const r = await avatarApi.generateCharacter({
      name: character.name,
      appearance: character.appearance,
      style: flow.storyboard?.style,
    });
    characters.value[index].views = { sheet: r.data.image_url };
    await save();
    await loadAssets();
  } catch {
  } finally {
    generating.value = false;
  }
}
async function loadAssets() {
  libraryLoading.value = true;
  try {
    const r = await avatarApi.getAvatars(assetPage.value, 12);
    assets.value = r.data.avatars.filter((a: any) => a.result_image_url);
    assetTotal.value = r.data.total;
  } catch {
  } finally {
    libraryLoading.value = false;
  }
}
async function chooseAsset(asset: any) {
  if (!selected.value) {
    ElMessage.info("请先选择或添加一个剧情角色");
    return;
  }
  selected.value.views = { sheet: asset.result_image_url };
  if (await save()) libraryOpen.value = false;
}
async function generateImage() {
  imageGenerating.value = true;
  try {
    if (imageMode.value === "image") {
      const form = new FormData();
      form.append("image", imageSource.value!);
      form.append("prompt", imagePrompt.value);
      if (imageName.value) form.append("name", imageName.value);
      await avatarApi.imageToImage(form);
    } else
      await avatarApi.textToImage({
        prompt: imagePrompt.value,
        name: imageName.value || undefined,
      });
    imageDialog.value = false;
    assetPage.value = 1;
    await loadAssets();
    ElMessage.success("形象已生成并保存到形象库");
  } catch {
  } finally {
    imageGenerating.value = false;
  }
}
async function deleteAsset(asset: any) {
  try {
    await ElMessageBox.confirm(
      "删除此形象？使用中的角色请先更换参考图。",
      "删除形象",
      { confirmButtonText: "删除", cancelButtonText: "取消", type: "warning" },
    );
  } catch {
    return;
  }
  try {
    await avatarApi.deleteAvatar(asset.id);
    await loadAssets();
    ElMessage.success("形象已删除");
  } catch {}
}
async function download() {
  try {
    await downloadFile(
      selected.value.views.sheet,
      selected.value.name + ".png",
    );
  } catch {
    ElMessage.error("下载失败");
  }
}
async function next() {
  if (await save()) router.push("/video");
}
async function loadScripts() {
  try {
    const r = await scriptApi.getScripts(scriptPage.value, 10);
    scripts.value = r.data.scripts;
    scriptTotal.value = r.data.total;
  } catch {}
}
function chooseScript(item: any) {
  if (generating.value || saving.value) return;
  useScript(item);
  characters.value = JSON.parse(JSON.stringify(flow.characters));
  selectedIndex.value = 0;
  scriptPicker.value = false;
}
watch(libraryOpen, (value) => {
  if (value) loadAssets();
});
watch(scriptPicker, (value) => {
  if (value) loadScripts();
});
onMounted(async () => {
  if (!flow.script_id) return;
  loading.value = true;
  try {
    const r = await scriptApi.getScript(flow.script_id);
    chooseScript(r.data);
  } catch {
  } finally {
    loading.value = false;
  }
});
</script>
<style scoped>
.character-sheet {
  background: #f2f7f7;
  border: 1px solid #dce6e9;
  border-radius: 9px;
  overflow: hidden;
}
.character-sheet .el-image {
  width: 100%;
  display: block;
  min-height: 250px;
  max-height: 570px;
}
.sheet-labels {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  text-align: center;
  padding: 14px;
  background: #fff;
  color: #8396a1;
  font-size: 11px;
}
.sheet-empty {
  min-height: 270px;
  border: 1px dashed #c3dbdc;
  background: #f4f9f9;
  border-radius: 9px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8ca4ab;
  gap: 14px;
}
.sheet-empty > .el-icon {
  font-size: 42px;
  color: #a5c6c6;
}
.asset-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.asset-item {
  border: 1px solid #dce7e9;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}
.asset-select {
  width: 100%;
  background: none;
  border: 0;
  display: block;
  padding: 0;
}
.asset-footer {
  display: flex;
  align-items: center;
  padding-right: 10px;
  gap: 8px;
  justify-content: space-between;
}
.asset-footer > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.asset-item img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  background: #f4f7f7;
}
.asset-item span {
  display: block;
  padding: 10px;
  font-size: 11px;
}
.asset-item:hover {
  border-color: #1baca3;
}
@media (max-width: 700px) {
  .asset-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .character-sheet .el-image {
    min-height: 180px;
  }
  .panel-heading > .btn {
    padding: 8px;
    font-size: 11px;
  }
}
</style>
