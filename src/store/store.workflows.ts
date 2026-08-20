/**
 * Workflow slice — ComfyUI workflow CRUD
 */
import type { StateCreator } from 'zustand';
import type { AppState } from './useAppStore';
import type { WorkflowDefinition } from '../types';
import * as fileService from '../services/fileService';
import {
  syncBuiltInWorkflows,
  withBuiltInEditableContent,
  obsoleteBuiltInWorkflowIds,
} from '../services/builtinWorkflows';

export interface WorkflowSlice {
  workflows: WorkflowDefinition[];
  workflowPanelOpen: boolean;
  setWorkflowPanelOpen: (open: boolean) => void;
  addWorkflow: (wf: WorkflowDefinition) => Promise<void>;
  updateWorkflow: (id: string, updates: Partial<Omit<WorkflowDefinition, 'id' | 'createdAt'>>) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  loadWorkflows: () => Promise<void>;
}

export const createWorkflowSlice: StateCreator<AppState, [], [], WorkflowSlice> = (set, get) => ({
  workflows: [],
  workflowPanelOpen: false,

  setWorkflowPanelOpen: (open) => set({ workflowPanelOpen: open }),

  addWorkflow: async (wf) => {
    await fileService.saveWorkflow({
      id: wf.id,
      name: wf.name,
      category: wf.category,
      fileName: wf.fileName,
      fileContent: wf.fileContent,
      editableContent: wf.editableContent,
      ioNodes: wf.ioNodes,
      defaultNodes: wf.defaultNodes,
      createdAt: wf.createdAt,
      updatedAt: wf.updatedAt,
    });
    set((state) => ({ workflows: [...state.workflows, wf] }));
  },

  updateWorkflow: async (id, updates) => {
    const existing = get().workflows.find((workflow) => workflow.id === id);
    if (!existing) throw new Error('要更新的工作流不存在');
    const updatedWorkflow: WorkflowDefinition = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
    };
    await fileService.saveWorkflow(updatedWorkflow);
    set((state) => ({
      workflows: state.workflows.map((workflow) => (
        workflow.id === id ? updatedWorkflow : workflow
      )),
    }));
  },

  deleteWorkflow: async (id) => {
    set((state) => ({
      workflows: state.workflows.filter((w) => w.id !== id),
    }));
    await fileService.deleteWorkflow(id).catch((e) => console.warn('[删除工作流] 清理失败:', e));
  },

  loadWorkflows: async () => {
    const records = await fileService.loadWorkflows();
    const mapped: WorkflowDefinition[] = records.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category as WorkflowDefinition['category'],
      fileName: r.fileName,
      fileContent: r.fileContent,
      editableContent: r.editableContent,
      ioNodes: r.ioNodes as WorkflowDefinition['ioNodes'],
      defaultNodes: r.defaultNodes as WorkflowDefinition['defaultNodes'],
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
    // 清理已从内置规格里移除的旧内置工作流，避免列表里还出现占位符/已删模板
    const obsoleteIds = obsoleteBuiltInWorkflowIds(mapped);
    for (const id of obsoleteIds) {
      fileService.deleteWorkflow(id).catch((e) => console.warn('[内置工作流] 清理旧数据失败:', e));
    }
    const afterCleanup = mapped.filter((workflow) => !obsoleteIds.includes(workflow.id));
    // 早先播种的内置工作流缺可编辑图，补上后 ComfyUI 才能正常打开
    const patched = afterCleanup.map((workflow) => {
      const upgraded = withBuiltInEditableContent(workflow);
      if (upgraded) {
        fileService.saveWorkflow(upgraded).catch((e) => console.warn('[内置工作流] 补可编辑图失败:', e));
      }
      return upgraded ?? workflow;
    });
    // 首次启动把内置工作流落盘，文件内容变化时也同步更新本地数据
    const { toAdd, toUpdate } = syncBuiltInWorkflows(patched);
    for (const workflow of toAdd) {
      fileService.saveWorkflow(workflow).catch((e) => console.warn('[内置工作流] 持久化失败:', e));
    }
    for (const workflow of toUpdate) {
      fileService.saveWorkflow(workflow).catch((e) => console.warn('[内置工作流] 更新失败:', e));
    }
    const synced = [...toAdd, ...toUpdate];
    if (patched.length > 0 || synced.length > 0) {
      set({ workflows: [...synced, ...patched.map((w) => {
        const updated = toUpdate.find((u) => u.id === w.id);
        return updated ?? w;
      })] });
    }
  },
});
