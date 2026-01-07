import { appStore } from "@/app/store";
import { fetcher } from "lib/utils";
import useSWR, { SWRConfiguration } from "swr";

export const useChatModels = (options?: SWRConfiguration) => {
  return useSWR<
    {
      provider: string;
      hasAPIKey: boolean;
      models: {
        name: string;
        isToolCallUnsupported: boolean;
        isImageInputUnsupported: boolean;
        supportedFileMimeTypes: string[];
      }[];
    }[]
  >("/api/chat/models", fetcher, {
    dedupingInterval: 60_000 * 5,
    revalidateOnFocus: false,
    fallbackData: [],
    onSuccess: (data) => {
      const status = appStore.getState();
      if (!status.chatModel) {
        // 优先选择GLM模型
        const glmProvider = data.find((p) => p.provider === "GLM");
        const openaiProvider = data.find((p) => p.provider === "OpenAI");
        
        let selectedProvider;
        let selectedModel;
        
        if (glmProvider && glmProvider.models.length > 0) {
          // 优先选择GLM-4 Flash（免费且快速）
          const flashModel = glmProvider.models.find((m) => m.name === "glm-4-flash");
          selectedProvider = "GLM";
          selectedModel = flashModel ? "glm-4-flash" : glmProvider.models[0].name;
        } else if (openaiProvider && openaiProvider.models.length > 0) {
          selectedProvider = "OpenAI";
          selectedModel = openaiProvider.models[0].name;
        } else if (data[0] && data[0].models.length > 0) {
          selectedProvider = data[0].provider;
          selectedModel = data[0].models[0].name;
        }
        
        if (selectedProvider && selectedModel) {
          appStore.setState({ 
            chatModel: { provider: selectedProvider, model: selectedModel } 
          });
        }
      }
    },
    ...options,
  });
};
