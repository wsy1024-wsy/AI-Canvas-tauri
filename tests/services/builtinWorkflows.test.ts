import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  corsSafeFetch: vi.fn(),
  storeState: {
    config: { comfyUIUrl: 'http://comfy.test:8188' },
    currentProjectId: 'p1',
    workflows: [] as Array<Record<string, unknown>>,
  },
}));

vi.mock('../../src/services/ai/httpTransport', () => ({
  corsSafeFetch: mocks.corsSafeFetch,
}));
vi.mock('../../src/store/useAppStore', () => ({
  useAppStore: { getState: () => mocks.storeState },
  generateId: () => 'id-1',
}));
vi.mock('../../src/services/pollManager', () => ({
  savePendingTask: vi.fn(),
  updatePendingTask: vi.fn(),
  removePendingTask: vi.fn(),
  registerNodePolling: vi.fn(() => undefined),
  cleanupNodePolling: vi.fn(),
}));
vi.mock('../../src/services/nodeReferenceService', () => ({
  resolveNodeReferences: (value: string) => value,
}));

import { syncBuiltInWorkflows } from '../../src/services/builtinWorkflows';
import { executeComfyUIGenerate, executeComfyUIVideoGenerate } from '../../src/services/comfyWorkflowService';
import type { WorkflowDefinition } from '../../src/types';

function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) };
}

function submittedWorkflow(): Record<string, { class_type: string; inputs: Record<string, unknown> }> {
  const call = mocks.corsSafeFetch.mock.calls.find(([url]) => String(url).endsWith('/prompt'));
  return JSON.parse(String((call?.[1] as RequestInit).body)).prompt;
}

/** 把内置工作流装进 store，按 id 找到对应定义 */
function seedBuiltIns(): WorkflowDefinition[] {
  const workflows = syncBuiltInWorkflows([]).toAdd;
  mocks.storeState.workflows = workflows as unknown as Array<Record<string, unknown>>;
  return workflows;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.corsSafeFetch.mockImplementation(async (url: string) => {
    if (url.endsWith('/upload/image')) {
      return jsonResponse({ name: 'upload_1.png', subfolder: '', type: 'input' });
    }
    if (url.endsWith('/object_info/ResolutionSelector')) {
      return jsonResponse({
        ResolutionSelector: {
          input: {
            required: {
              aspect_ratio: [['16:9 (Widescreen)', '9:16 (Portrait Widescreen)', '1:1 (Square)'], {}],
              megapixels: ['FLOAT', { min: 0.1, max: 16 }],
            },
          },
        },
      });
    }
    if (url.endsWith('/prompt')) return jsonResponse({ prompt_id: 'prompt-1' });
    if (url.includes('/history/')) {
      return jsonResponse({
        'prompt-1': {
          status: { completed: true },
          outputs: {
            '9': { images: [{ filename: 'out.png', subfolder: '', type: 'output' }] },
            '12': { videos: [{ filename: 'out.mp4', subfolder: '', type: 'output' }] },
          },
        },
      });
    }
    throw new Error(`未预期的请求：${url}`);
  });
});

describe('内置 ComfyUI 工作流', () => {
  it('首次启动播种三个内置工作流，之后不再重复添加', () => {
    const first = syncBuiltInWorkflows([]);
    expect(first.toAdd).toHaveLength(3);
    expect(first.toAdd.filter((workflow) => workflow.category === 'ai-image')).toHaveLength(2);
    expect(first.toAdd.filter((workflow) => workflow.category === 'ai-video')).toHaveLength(1);
    expect(syncBuiltInWorkflows([]).toAdd).toHaveLength(0);
  });

  it('只记账已经建出来的，剩下的下次启动继续补', () => {
    localStorage.setItem(
      'aicanvas.builtinWorkflows.seededIds',
      JSON.stringify(['builtin-wen-sheng-tu']),
    );
    const pending = syncBuiltInWorkflows([]);
    expect(pending.toAdd.map((workflow) => workflow.id)).not.toContain('builtin-wen-sheng-tu');
    expect(pending.toAdd).toHaveLength(2);
  });

  it('默认 IO 节点都能在工作流 JSON 里找到对应的输入', () => {
    for (const workflow of syncBuiltInWorkflows([]).toAdd) {
      const json = JSON.parse(workflow.fileContent) as Record<string, { inputs: Record<string, unknown> }>;
      for (const [type, nodeId] of Object.entries(workflow.defaultNodes ?? {})) {
        expect(json[nodeId], `${workflow.name} 的 ${type} 默认节点`).toBeTruthy();
        expect(workflow.ioNodes?.some((io) => io.nodeId === nodeId && io.type === type)).toBe(true);
      }
    }
  });

  it('文生图：提示词写进默认文本节点，尺寸写进 latent 节点', async () => {
    seedBuiltIns();
    await executeComfyUIGenerate({
      workflowId: 'builtin-wen-sheng-tu',
      workflowInputs: {},
      prompt: '可爱小猫',
      imageSize: '1K',
      aspectRatio: '1:1',
      model: 'wf',
      provider: 'comfyui',
    }, undefined, []);

    const submitted = submittedWorkflow();
    expect(submitted['6'].inputs.text).toBe('可爱小猫');
    expect(submitted['13'].inputs.width).toBe(1024);
    expect(submitted['13'].inputs.height).toBe(1024);
  });

  it('图生图：提示词写进默认文本节点，参考图片写进默认图片节点', async () => {
    seedBuiltIns();
    await executeComfyUIGenerate({
      workflowId: 'builtin-tu-sheng-tu',
      workflowInputs: {},
      prompt: '把它变成油画',
      imageSize: '2K',
      aspectRatio: '16:9',
      model: 'wf',
      provider: 'comfyui',
    }, undefined, ['data:image/png;base64,QUJD']);

    const submitted = submittedWorkflow();
    expect(submitted['67'].inputs.text).toBe('把它变成油画');
    expect(submitted['72'].inputs.image).toBe('upload_1.png');
  });

  it('文生视频：提示词写进默认条件节点，时长写进秒数节点', async () => {
    seedBuiltIns();
    await executeComfyUIVideoGenerate({
      workflowId: 'builtin-wen-sheng-shi-pin',
      workflowInputs: {},
      prompt: '海边日落',
      model: 'wf',
      provider: 'comfyui',
      videoResolution: 832,
      seedanceRatio: '16:9',
      seedanceDuration: 6,
      videoFps: 24,
    });

    const submitted = submittedWorkflow();
    expect(submitted['6'].inputs.prompt).toBe('海边日落');
    expect(submitted['14'].inputs.value).toBe(6);
    expect(submitted['16'].inputs.aspect_ratio).toBe('16:9 (Widescreen)');
  });
});
