'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BriefcaseIcon,
  TrendingUpIcon,
  UsersIcon,
  MessageSquareIcon,
  TargetIcon,
  UserCogIcon,
  ScaleIcon,
  PlusIcon,
  SendIcon,
  XIcon,
  PencilIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SUPER_EMPLOYEE_MODULES } from "@/lib/super-employee-modules";

const MODULES = [
  {
    id: 'product-manager',
    name: '产品经理',
    icon: BriefcaseIcon,
    description: '市场分析、产品规划、竞品分析',
  },
  {
    id: 'marketing-expert',
    name: '营销策划专家',
    icon: TrendingUpIcon,
    description: '营销方案、品牌策略、用户增长',
  },
  {
    id: 'community-manager',
    name: '社群运营专家',
    icon: UsersIcon,
    description: '社群管理、活动策划、用户运营',
  },
  {
    id: 'sales-consultant',
    name: '销售话术顾问',
    icon: MessageSquareIcon,
    description: '销售技巧、话术设计、客户分析',
  },
  {
    id: 'strategy-advisor',
    name: '战略规划顾问',
    icon: TargetIcon,
    description: '行业分析、战略制定、发展规划',
  },
  {
    id: 'hr-consultant',
    name: '人事顾问',
    icon: UserCogIcon,
    description: '招聘管理、绩效评估、团队建设',
  },
  {
    id: 'legal-advisor',
    name: '法务顾问',
    icon: ScaleIcon,
    description: '合同审查、风险评估、法律咨询',
  },
];

const CUSTOM_PROMPTS_KEY = 'ai-employee-custom-prompts';

export default function SuperEmployeePage() {
  const [appStoreMutate, openAISettings] = appStore(
    useShallow((state) => [state.mutate, state.openAISettings])
  );

  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({});
  const [selectedModule, setSelectedModule] = useState<typeof MODULES[0] | { id: string; name: string; icon: any; description: string; isCustom: true } | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant'; content: string}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customEmployees, setCustomEmployees] = useState<Array<{id: string; name: string; description: string; icon?: any; instructions?: any}>>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeDescription, setNewEmployeeDescription] = useState('');
  const [newEmployeePrompt, setNewEmployeePrompt] = useState('');
  // 设置对话框中的编辑状态
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editingPromptValue, setEditingPromptValue] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const promptTextareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    const saved = localStorage.getItem(CUSTOM_PROMPTS_KEY);
    if (saved) {
      try {
        setCustomPrompts(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load custom prompts:', e);
      }
    }
  }, []);

  // 加载自定义AI员工
  useEffect(() => {
    const loadCustomEmployees = async () => {
      try {
        const response = await fetch('/api/super-employee/custom');
        if (response.ok) {
          const data = await response.json();
          setCustomEmployees(data);
        }
      } catch (error) {
        console.error('Failed to load custom employees:', error);
      }
    };
    loadCustomEmployees();
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current && chatMessages.length > 0) {
      // 使用 setTimeout 确保 DOM 已更新
      setTimeout(() => {
        const viewport = scrollAreaRef.current?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
        if (viewport) {
          viewport.scrollTo({
            top: viewport.scrollHeight,
            behavior: 'smooth',
          });
        }
      }, 50);
    }
  }, [chatMessages, isLoading]);

  // 当对话框打开时，聚焦输入框
  useEffect(() => {
    if (selectedModule && textareaRef.current) {
      // 延迟一下，确保DOM已渲染
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [selectedModule]);

  const handleModuleClick = (module: typeof MODULES[0]) => {
    // 如果点击的是已选中的模块，则关闭对话框
    if (selectedModule?.id === module.id) {
      setSelectedModule(null);
      setChatMessages([]);
      return;
    }

    setSelectedModule(module);

    const historyKey = `ai-employee-chat-${module.id}`;
    const savedHistory = localStorage.getItem(historyKey);
    if (savedHistory) {
      try {
        setChatMessages(JSON.parse(savedHistory));
      } catch (e) {
        setChatMessages([]);
      }
    } else {
      setChatMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedModule) return;

    const userMessage = inputMessage.trim();
    const newMessages = [...chatMessages, { role: 'user' as const, content: userMessage }];
    setChatMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    const historyKey = `ai-employee-chat-${selectedModule.id}`;
    localStorage.setItem(historyKey, JSON.stringify(newMessages));

    try {
      // 检查是否是自定义员工
      const isCustom = 'isCustom' in selectedModule && selectedModule.isCustom;
      
      // 统一使用super-employee API，它现在支持自定义员工
      const response = await fetch('/api/chat/super-employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          employeeId: selectedModule.id,
          isCustom: isCustom || false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const aiResponse = data.content || '抱歉，我暂时无法回复。';

      setChatMessages([...newMessages, { role: 'assistant' as const, content: aiResponse }]);
      localStorage.setItem(historyKey, JSON.stringify([...newMessages, { role: 'assistant' as const, content: aiResponse }]));
    } catch (error) {
      console.error('Failed to send message:', error);
      setChatMessages([...newMessages, { role: 'assistant' as const, content: '抱歉，发生了错误，请稍后重试。' }]);
    } finally {
      setIsLoading(false);
      // 聚焦到输入框
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  const handleResetPrompt = (moduleId: string) => {
    const newCustomPrompts = { ...customPrompts };
    delete newCustomPrompts[moduleId];
    setCustomPrompts(newCustomPrompts);
    localStorage.setItem(CUSTOM_PROMPTS_KEY, JSON.stringify(newCustomPrompts));
  };

  const handleStartEditPrompt = (moduleId: string, currentPrompt: string) => {
    setEditingPromptId(moduleId);
    setEditingPromptValue(currentPrompt);
    // 聚焦到textarea
    setTimeout(() => {
      promptTextareaRefs.current[moduleId]?.focus();
    }, 100);
  };

  const handleSavePrompt = async (moduleId: string, isCustom: boolean) => {
    if (!editingPromptValue.trim()) {
      alert('提示词不能为空');
      return;
    }

    try {
      if (isCustom) {
        // 自定义AI员工：调用API更新
        const response = await fetch('/api/super-employee/custom', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: moduleId,
            systemPrompt: editingPromptValue.trim(),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          alert(error.error || '保存失败');
          return;
        }

        const updatedEmployee = await response.json();
        setCustomEmployees(customEmployees.map(emp => 
          emp.id === moduleId ? updatedEmployee : emp
        ));
      } else {
        // 默认AI员工：保存到localStorage
        const newCustomPrompts = { ...customPrompts, [moduleId]: editingPromptValue.trim() };
        setCustomPrompts(newCustomPrompts);
        localStorage.setItem(CUSTOM_PROMPTS_KEY, JSON.stringify(newCustomPrompts));
      }

      setEditingPromptId(null);
      setEditingPromptValue('');
    } catch (error) {
      console.error('Failed to save prompt:', error);
      alert('保存失败，请稍后重试');
    }
  };

  const handleCancelEditPrompt = () => {
    setEditingPromptId(null);
    setEditingPromptValue('');
  };

  const handleAddCustomEmployee = async () => {
    if (!newEmployeeName.trim() || !newEmployeeDescription.trim() || !newEmployeePrompt.trim()) {
      alert('请填写所有字段');
      return;
    }
    if (newEmployeeName.length > 14 || newEmployeeDescription.length > 14) {
      alert('名称和描述不能超过14个字符');
      return;
    }

    try {
      const response = await fetch('/api/super-employee/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEmployeeName.trim(),
          description: newEmployeeDescription.trim(),
          systemPrompt: newEmployeePrompt.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || '创建失败');
        return;
      }

      const newEmployee = await response.json();
      setCustomEmployees([...customEmployees, newEmployee]);
      setShowAddDialog(false);
      setNewEmployeeName('');
      setNewEmployeeDescription('');
      setNewEmployeePrompt('');
    } catch (error) {
      console.error('Failed to create custom employee:', error);
      alert('创建失败，请稍后重试');
    }
  };

  const handleDeleteCustomEmployee = async (id: string, name: string) => {
    if (!confirm(`确定要删除"${name}"吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/super-employee/custom?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        alert('删除失败');
        return;
      }

      setCustomEmployees(customEmployees.filter(emp => emp.id !== id));
      if (selectedModule && 'isCustom' in selectedModule && selectedModule.id === id) {
        setSelectedModule(null);
        setChatMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete custom employee:', error);
      alert('删除失败，请稍后重试');
    }
  };

  const handleCustomEmployeeClick = (employee: typeof customEmployees[0]) => {
    const module = {
      id: employee.id,
      name: employee.name,
      icon: () => <span className="text-2xl">🤖</span>,
      description: employee.description,
      isCustom: true as const,
    };
    handleModuleClick(module as any);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-card-foreground mb-4">
          AI员工
        </h1>
        <div className="h-1 w-32 bg-primary mx-auto mb-4 rounded-full"></div>
        <p className="text-xl text-muted-foreground">
          您的一站式企业运营智能助手
        </p>
      </div>

      {/* AI Employee Chat Area - 内嵌显示 */}
      {selectedModule && (
        <div className="mb-6 border rounded-xl bg-card shadow-lg overflow-hidden" style={{ height: '600px' }}>
          <div className="flex flex-col h-full">
            {/* Header - 固定高度 */}
            <div className="shrink-0 border-b px-6 py-4 flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  {selectedModule.icon && <selectedModule.icon className="w-5 h-5 text-primary" />}
                </div>
                <div>
                  <h2 className="font-semibold text-lg">{selectedModule.name}</h2>
                  <p className="text-xs text-muted-foreground">{selectedModule.description}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedModule(null);
                  setChatMessages([]);
                }}
              >
                <XIcon className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages Area - 可滚动，占据剩余空间 */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea ref={scrollAreaRef} className="h-full">
                <div className="px-6 py-4 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">开始与{selectedModule.name}对话...</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="flex items-start gap-3 max-w-[80%]">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            {msg.role === 'assistant' ? (
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {selectedModule.icon && <selectedModule.icon className="h-4 w-4" />}
                              </AvatarFallback>
                            ) : (
                              <AvatarFallback className="bg-muted">我</AvatarFallback>
                            )}
                          </Avatar>
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Input Area - 固定在底部 */}
            <div className="shrink-0 border-t px-6 py-4 bg-muted/30">
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`向${selectedModule.name}提问...`}
                  rows={1}
                  className="flex-1 min-h-[60px] resize-none rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="icon"
                  className="h-10 w-10 flex-shrink-0"
                >
                  {isLoading ? (
                    <div className="animate-spin h-5 w-5">⏳</div>
                  ) : (
                    <SendIcon className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <Card
              key={module.id}
              className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50"
              onClick={() => handleModuleClick(module)}
            >
              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-center">{module.name}</CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                  {module.description}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
        {customEmployees.map((employee) => (
          <Card
            key={employee.id}
            className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 relative"
            onClick={() => handleCustomEmployeeClick(employee)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCustomEmployee(employee.id, employee.name);
              }}
            >
              <XIcon className="h-4 w-4 text-destructive" />
            </Button>
            <CardHeader>
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                <span className="text-2xl">🤖</span>
              </div>
              <CardTitle className="text-center">{employee.name}</CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                {employee.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
        {customEmployees.length < 5 && (
          <Card
            className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 border-dashed"
            onClick={() => setShowAddDialog(true)}
          >
            <CardHeader>
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-2xl flex items-center justify-center group-hover:bg-muted/80 transition-colors duration-300">
                <PlusIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-center text-muted-foreground">添加AI员工</CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                点击添加自定义AI员工
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Usage Tips */}
      <div className="mt-12 bg-muted/50 rounded-xl p-6 text-center">
        <p className="text-sm text-muted-foreground">
          提示：点击卡片即可与AI员工对话。点击右上角设置按钮可自定义每个AI员工的提示词。
        </p>
      </div>

      {/* Add Custom Employee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>添加自定义AI员工</DialogTitle>
            <DialogDescription>
              创建一个新的AI员工，最多可添加5个
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 pr-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">名称 *</Label>
                <Input
                  id="name"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  placeholder="请输入AI员工名称（最多14个字符）"
                  maxLength={14}
                />
              </div>
              <div>
                <Label htmlFor="description">描述 *</Label>
                <Input
                  id="description"
                  value={newEmployeeDescription}
                  onChange={(e) => setNewEmployeeDescription(e.target.value)}
                  placeholder="请输入描述（最多14个字符）"
                  maxLength={14}
                />
              </div>
              <div>
                <Label htmlFor="prompt">提示词 *</Label>
                <Textarea
                  id="prompt"
                  value={newEmployeePrompt}
                  onChange={(e) => setNewEmployeePrompt(e.target.value)}
                  placeholder="请输入AI员工的系统提示词"
                  rows={10}
                  className="resize-none max-h-[400px]"
                />
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAddCustomEmployee}>
              创建
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Employee Settings Dialog */}
      <Dialog open={openAISettings} onOpenChange={(open) => appStoreMutate({ openAISettings: open })}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>AI员工设置</DialogTitle>
            <DialogDescription>
              自定义每个AI员工的提示词
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 pr-4">
            <div className="space-y-6">
              {MODULES.map((module) => {
                const Icon = module.icon;
                const isCustomPrompt = customPrompts[module.id] !== undefined;
                const defaultPrompt = SUPER_EMPLOYEE_MODULES[module.id as keyof typeof SUPER_EMPLOYEE_MODULES]?.systemPrompt || '';
                const currentPrompt = isCustomPrompt ? customPrompts[module.id] : defaultPrompt;
                const isEditing = editingPromptId === module.id;

                return (
                  <div key={module.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{module.name}</h3>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      </div>
                      <div className="flex gap-2">
                        {isCustomPrompt && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`确定要恢复${module.name}的默认提示词吗？`)) {
                                handleResetPrompt(module.id);
                                if (editingPromptId === module.id) {
                                  setEditingPromptId(null);
                                }
                              }
                            }}
                          >
                            恢复默认
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">系统提示词</Label>
                        {!isEditing && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEditPrompt(module.id, currentPrompt)}
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            编辑
                          </Button>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="relative">
                            <Textarea
                              ref={(el) => { promptTextareaRefs.current[module.id] = el; }}
                              value={editingPromptValue}
                              onChange={(e) => setEditingPromptValue(e.target.value)}
                              rows={15}
                              className="resize-none font-mono text-sm max-h-[400px] overflow-y-auto"
                              placeholder="请输入系统提示词"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEditPrompt}
                            >
                              取消
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSavePrompt(module.id, false)}
                            >
                              保存
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => handleStartEditPrompt(module.id, currentPrompt)}
                        >
                          {currentPrompt || '暂无提示词'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {customEmployees.map((employee) => {
                const currentPrompt = employee.instructions?.systemPrompt || '';
                const isEditing = editingPromptId === employee.id;

                return (
                  <div key={employee.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">🤖</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{employee.name}</h3>
                        <p className="text-sm text-muted-foreground">{employee.description}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">系统提示词</Label>
                        {!isEditing && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEditPrompt(employee.id, currentPrompt)}
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            编辑
                          </Button>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="relative">
                            <Textarea
                              ref={(el) => { promptTextareaRefs.current[employee.id] = el; }}
                              value={editingPromptValue}
                              onChange={(e) => setEditingPromptValue(e.target.value)}
                              rows={15}
                              className="resize-none font-mono text-sm max-h-[400px] overflow-y-auto"
                              placeholder="请输入系统提示词"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEditPrompt}
                            >
                              取消
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSavePrompt(employee.id, true)}
                            >
                              保存
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => handleStartEditPrompt(employee.id, currentPrompt)}
                        >
                          {currentPrompt || '暂无提示词'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

    </div>
  );
}
