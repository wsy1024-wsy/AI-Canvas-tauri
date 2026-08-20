/**
 * 把 ComfyUI 可编辑格式（nodes/links）转成 API 格式（prompt）
 * 用法：node temp/convertComfyEditableToApi.js src/assets/comfyWorkflows/xxx.json
 */
const fs = require('fs');
const path = require('path');

function convert(inputPath) {
  const raw = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  if (!Array.isArray(raw.nodes)) {
    throw new Error('不是 ComfyUI 可编辑格式：缺少 nodes 数组');
  }

  // 构建 link_id -> { originId, originSlot, targetId, targetSlot }
  const linkMap = new Map();
  for (const link of raw.links || []) {
    const [linkId, originId, originSlot, targetId, targetSlot] = link;
    linkMap.set(linkId, { originId: String(originId), originSlot, targetId: String(targetId), targetSlot });
  }

  const api = {};
  for (const node of raw.nodes) {
    const nodeId = String(node.id);
    const classType = node.type;

    // 跳过人畜无害的注释/便签节点
    if (!classType || (/Note|MarkdownNote|ShowText|Preview/i.test(classType) && (!node.inputs?.length && !node.outputs?.length))) {
      continue;
    }

    const inputs = {};

    // 1. 处理连线输入
    for (const input of node.inputs || []) {
      if (input.link != null) {
        const link = linkMap.get(input.link);
        if (link) {
          inputs[input.name] = [link.originId, link.originSlot];
        }
      }
    }

    // 2. 处理 widget 输入（没连线的才写入）
    const widgetsNamed = node.widgets_values_named || {};
    for (const [key, value] of Object.entries(widgetsNamed)) {
      if (!(key in inputs)) {
        inputs[key] = value;
      }
    }

    api[nodeId] = { class_type: classType, inputs };
  }

  return api;
}

function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('请指定要转换的 .json 文件，例如：');
    console.error('  node temp/convertComfyEditableToApi.js src/assets/comfyWorkflows/wen-sheng-tu.json');
    process.exit(1);
  }

  for (const file of files) {
    const inputPath = path.resolve(file);
    const backupPath = inputPath.replace(/\.json$/i, '.editable.json');
    const api = convert(inputPath);

    // 备份原文件
    fs.copyFileSync(inputPath, backupPath);
    fs.writeFileSync(inputPath, JSON.stringify(api, null, 2));
    console.log(`✅ 已转换：${path.relative(process.cwd(), inputPath)}`);
    console.log(`   原文件备份：${path.relative(process.cwd(), backupPath)}`);
  }
}

main();
