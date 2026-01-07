"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ModuleConfig {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
}

const defaultModules: ModuleConfig[] = [
  {
    id: "product-manager",
    name: "产品经理",
    role: "产品管理",
    systemPrompt: `你是一位专业的产品经理，擅长市场分析、产品规划和竞品分析。你的职责包括：
1. 市场调研和用户需求分析
2. 产品规划和路线图制定
3. 竞品分析和差异化策略
4. 功能优先级排序
5. 产品需求文档(PRD)撰写

请以专业、数据驱动的方式提供建议，并关注用户体验和商业价值的平衡。`
  },
  {
    id: "marketing-expert",
    name: "营销策划",
    role: "营销策划",
    systemPrompt: `你是一位资深的营销策划专家，精通数字营销和品牌策略。你的专长包括：
1. 营销战略制定和执行方案
2. 品牌定位和传播策略
3. 内容营销和社交媒体运营
4. 用户增长和获客策略
5. 数据分析和效果优化

请提供创新、可落地的营销方案，关注ROI和用户转化率。`
  },
  {
    id: "community-manager",
    name: "社群运营",
    role: "社群运营",
    systemPrompt: `你是一位经验丰富的社群运营专家，擅长用户运营和社区建设。你的能力包括：
1. 社群搭建和规则制定
2. 用户增长和活跃度提升
3. 内容策划和活动组织
4. 用户分层和精细化运营
5. 社群氛围建设和维护

请提供实用的社群运营策略，注重用户参与感和社群价值创造。`
  },
  {
    id: "sales-consultant",
    name: "销售顾问",
    role: "销售顾问",
    systemPrompt: `你是一位顶级销售顾问，精通各种销售技巧和话术设计。你擅长：
1. 客户需求分析和痛点挖掘
2. 销售漏斗和转化路径设计
3. 谈判技巧和异议处理
4. 客户关系管理和维护
5. 销售团队培训和管理

请提供实战性强的销售建议和话术模板，关注成单率和客户满意度。`
  },
  {
    id: "strategy-advisor",
    name: "战略规划",
    role: "战略规划",
    systemPrompt: `你是一位资深的战略规划顾问，具备宏观视野和深度分析能力。你的专长：
1. 行业趋势分析和预测
2. 企业战略诊断和规划
3. 商业模式设计和优化
4. 竞争策略和市场定位
5. 发展路径和里程碑设计

请提供系统性、前瞻性的战略建议，帮助企业做出正确的战略决策。`
  },
  {
    id: "hr-consultant",
    name: "人事顾问",
    role: "人力资源",
    systemPrompt: `你是一位专业的人事顾问，精通人力资源管理的各个模块。你的能力：
1. 招聘流程优化和人才评估
2. 绩效管理体系设计
3. 薪酬激励和员工发展
4. 企业文化和团队建设
5. 劳动关系和合规管理

请提供专业、合规的人力资源解决方案，关注员工发展和组织效能。`
  },
  {
    id: "legal-advisor",
    name: "法务顾问",
    role: "法律咨询",
    systemPrompt: `你是一位经验丰富的法务顾问，擅长企业法律风险管理。你的专长：
1. 合同起草和审查
2. 法律风险识别和防范
3. 知识产权保护
4. 劳动法和合规咨询
5. 纠纷处理和谈判支持

请提供专业、谨慎的法律建议，但请注意重大法律问题应咨询专业律师。`
  },
  {
    id: "knowledge-search",
    name: "知识库检索",
    role: "知识管理",
    systemPrompt: `你是一位知识管理专家，擅长信息检索和知识组织。你的能力：
1. 快速检索和分析信息
2. 知识整合和提炼
3. 数据分析和可视化
4. 知识库构建和优化
5. 学习方法和知识管理

请提供准确、有结构的信息，帮助用户快速找到所需知识。`
  }
];

export default function SuperEmployeeSettingsPage() {
  const router = useRouter();
  const [modules, setModules] = useState<ModuleConfig[]>(defaultModules);
  const [selectedModule, setSelectedModule] = useState<ModuleConfig | null>(null);
  const [editingPrompt, setEditingPrompt] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"" | "saving" | "saved">("");

  // 从localStorage加载自定义配置
  useEffect(() => {
    const savedConfig = localStorage.getItem("super-employee-modules-config");
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setModules(parsed);
      } catch (e) {
        console.error("Failed to load config", e);
      }
    }
  }, []);

  const handleModuleSelect = (module: ModuleConfig) => {
    if (hasChanges) {
      if (!confirm("您有未保存的更改，确定要切换吗？")) {
        return;
      }
    }
    setSelectedModule(module);
    setEditingPrompt(module.systemPrompt);
    setHasChanges(false);
  };

  const handleSavePrompt = () => {
    if (!selectedModule) return;

    const updatedModules = modules.map(m =>
      m.id === selectedModule.id
        ? { ...m, systemPrompt: editingPrompt }
        : m
    );

    setModules(updatedModules);
    setSelectedModule({ ...selectedModule, systemPrompt: editingPrompt });
    setHasChanges(false);
    setSaveStatus("saving");

    // 保存到localStorage
    localStorage.setItem("super-employee-modules-config", JSON.stringify(updatedModules));

    // 模拟保存延迟
    setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    }, 500);
  };

  const handleResetPrompt = () => {
    if (!selectedModule) return;
    const defaultModule = defaultModules.find(m => m.id === selectedModule.id);
    if (defaultModule && confirm("确定要重置为默认提示词吗？")) {
      setEditingPrompt(defaultModule.systemPrompt);
      setHasChanges(true);
    }
  };

  const handleResetAll = () => {
    if (confirm("确定要重置所有模块的提示词为默认值吗？此操作不可撤销。")) {
      setModules(defaultModules);
      localStorage.setItem("super-employee-modules-config", JSON.stringify(defaultModules));
      if (selectedModule) {
        const defaultModule = defaultModules.find(m => m.id === selectedModule.id);
        if (defaultModule) {
          setSelectedModule(defaultModule);
          setEditingPrompt(defaultModule.systemPrompt);
        }
      }
      setHasChanges(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                超级员工设置
              </h1>
              <p className="text-gray-600">
                配置每个超级员工模块的角色和系统提示词
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                ← 返回
              </button>
              <button
                onClick={handleResetAll}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                重置全部
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 模块列表 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">模块列表</h2>
              <div className="space-y-2">
                {modules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => handleModuleSelect(module)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedModule?.id === module.id
                        ? "bg-blue-50 border-2 border-blue-500"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                  >
                    <div className="font-medium text-gray-800">{module.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{module.role}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 编辑区域 */}
          <div className="lg:col-span-2">
            {selectedModule ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedModule.name}</h2>
                    <p className="text-gray-600 mt-1">角色：{selectedModule.role}</p>
                  </div>
                  {hasChanges && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                      未保存
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    系统提示词
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    此提示词定义了该超级员工的专业领域、工作方式和回复风格。修改后将立即生效。
                  </p>
                  <textarea
                    value={editingPrompt}
                    onChange={(e) => {
                      setEditingPrompt(e.target.value);
                      setHasChanges(true);
                    }}
                    className="w-full h-80 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder="输入系统提示词..."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    <button
                      onClick={handleSavePrompt}
                      disabled={!hasChanges || saveStatus === "saving"}
                      className={`px-6 py-2 rounded-lg transition-colors ${
                        hasChanges && saveStatus !== "saving"
                          ? "bg-blue-500 text-white hover:bg-blue-600"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {saveStatus === "saving" ? "保存中..." : saveStatus === "saved" ? "✓ 已保存" : "保存更改"}
                    </button>
                    <button
                      onClick={handleResetPrompt}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      重置为默认
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    {editingPrompt.length} 字符
                  </div>
                </div>

                {/* 提示 */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">💡 提示词编写建议</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 明确定义角色的专业领域和职责</li>
                    <li>• 描述期望的工作方式和沟通风格</li>
                    <li>• 可以包含具体的技能列表和工具</li>
                    <li>• 添加对输出格式的要求</li>
                    <li>• 考虑添加注意事项和限制条件</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">选择一个模块开始编辑</h3>
                <p className="text-gray-600">点击左侧列表中的模块，即可编辑其系统提示词</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
