/**
 * 内置 ComfyUI 工作流 —— 首次启动时写进「工作流管理」，之后就是普通工作流（可改可删）。
 * 已播种的 id 记在 localStorage 里，删掉的不会自动恢复，新加的下次启动自动补上。
 */
import type { WorkflowCategory, WorkflowDefinition, WorkflowIONodeType } from '../types';
import { extractComfyUIIONodes } from './comfyUIWindowService';
const WORKFLOW_FILES = import.meta.glob('../assets/comfyWorkflows/*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** ComfyUI 界面格式的同名工作流；有它才能在 ComfyUI 里正常打开编辑 */
const WORKFLOW_UI_FILES = import.meta.glob('../assets/comfyWorkflows/ui/*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function readWorkflowFile(fileName: string): string {
  const path = Object.keys(WORKFLOW_FILES).find((key) => key.endsWith(`/${fileName}`));
  if (!path) throw new Error(`内置工作流文件缺失：${fileName}`);
  return WORKFLOW_FILES[path];
}

function readWorkflowUiFile(fileName: string): string | undefined {
  const path = Object.keys(WORKFLOW_UI_FILES).find((key) => key.endsWith(`/ui/${fileName}`));
  return path ? WORKFLOW_UI_FILES[path] : undefined;
}

const SEEDED_IDS_KEY = 'aicanvas.builtinWorkflows.seededIds';

interface BuiltInWorkflowSpec {
  id: string;
  name: string;
  fileName: string;
  category: WorkflowCategory;
  /** 用户没 @ 具体节点时，提示词与参考媒体默认送进这些节点 */
  defaultNodes: Partial<Record<WorkflowIONodeType, string>>;
}

const BUILT_IN_SPECS: BuiltInWorkflowSpec[] = [
  {
    id: 'builtin-wen-sheng-tu',
    name: '文生图',
    fileName: 'wen-sheng-tu.json',
    category: 'ai-image',
    defaultNodes: { prompt: '6' },
  },
  {
    id: 'builtin-tu-sheng-tu',
    name: '图生图',
    fileName: 'tu-sheng-tu.json',
    category: 'ai-image',
    defaultNodes: { prompt: '67', image: '72' },
  },
  {
    id: 'builtin-wen-sheng-shi-pin',
    name: '文生视频',
    fileName: 'wen-sheng-shi-pin.json',
    category: 'ai-video',
    defaultNodes: { prompt: '6' },
  },
];

function toWorkflowDefinition(spec: BuiltInWorkflowSpec, createdAt: number): WorkflowDefinition {
  const fileContent = readWorkflowFile(spec.fileName);
  return {
    id: spec.id,
    name: spec.name,
    category: spec.category,
    fileName: spec.fileName,
    fileContent,
    editableContent: readWorkflowUiFile(spec.fileName),
    ioNodes: extractComfyUIIONodes(fileContent),
    defaultNodes: spec.defaultNodes,
    createdAt,
    updatedAt: createdAt,
  };
}

/**
 * 给早先播种、还没有可编辑图的内置工作流补上界面格式的图。
 * 只补空缺，不覆盖任何已有内容；没什么可补时返回 null。
 */
export function withBuiltInEditableContent(
  workflow: WorkflowDefinition,
): WorkflowDefinition | null {
  if (workflow.editableContent) return null;
  const spec = BUILT_IN_SPECS.find((item) => item.id === workflow.id);
  const editableContent = spec ? readWorkflowUiFile(spec.fileName) : undefined;
  return editableContent ? { ...workflow, editableContent } : null;
}

function readSeededIds(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEDED_IDS_KEY) ?? '[]') as unknown;
    return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * 返回需要从持久化中清理掉的旧内置工作流 id。
 * 当 BUILT_IN_SPECS 里删掉某个内置工作流后，本地 IndexedDB 里可能还留着旧数据，
 * 启动时用它把这类过时内置工作流自动移除（不会碰用户自己导入的工作流）。
 */
export function obsoleteBuiltInWorkflowIds(existing: WorkflowDefinition[]): string[] {
  const validIds = new Set(BUILT_IN_SPECS.map((spec) => spec.id));
  return existing
    .filter((workflow) => workflow.id.startsWith('builtin-') && !validIds.has(workflow.id))
    .map((workflow) => workflow.id);
}

/**
 * 同步内置工作流：首次启动补种，文件内容变化时更新本地持久化。
 * 返回需要新增和更新的工作流，由调用方负责落盘。
 */
export function syncBuiltInWorkflows(existing: WorkflowDefinition[]): {
  toAdd: WorkflowDefinition[];
  toUpdate: WorkflowDefinition[];
} {
  const seededIds = readSeededIds();
  const existingMap = new Map(existing.map((workflow) => [workflow.id, workflow]));
  const createdAt = Date.now();
  const toAdd: WorkflowDefinition[] = [];
  const toUpdate: WorkflowDefinition[] = [];

  for (const spec of BUILT_IN_SPECS) {
    const current = toWorkflowDefinition(spec, createdAt);
    const old = existingMap.get(spec.id);
    if (!old) {
      if (!seededIds.includes(spec.id)) {
        toAdd.push(current);
      }
    } else if (old.fileContent !== current.fileContent) {
      // 内置工作流文件内容变了，同步更新本地数据（保留创建时间）
      toUpdate.push({ ...current, createdAt: old.createdAt });
    }
  }

  if (toAdd.length > 0) {
    localStorage.setItem(
      SEEDED_IDS_KEY,
      JSON.stringify([...seededIds, ...toAdd.map((workflow) => workflow.id)]),
    );
  }
  return { toAdd, toUpdate };
}

/**
 * 返回本次启动需要补进工作流列表的内置工作流。
 * @deprecated 使用 syncBuiltInWorkflows 替代，它会同时处理文件更新。
 */
export function pendingBuiltInWorkflows(existing: WorkflowDefinition[]): WorkflowDefinition[] {
  return syncBuiltInWorkflows(existing).toAdd;
}
