import { type OpenAICompatibleProvider } from './create-openai-compatiable';

const glmProvider: OpenAICompatibleProvider = {
  provider: 'GLM',
  apiKey: '10134a35ea9f4ef78973c27640d01227.acspbUJRwaRYsRvj',
  baseUrl: 'https://open.bigmodel.cn/api/paas/v4/',
  models: [
    {
      apiName: 'glm-4-flash',
      uiName: 'GLM-4 Flash',
      supportsTools: true,
    },
    {
      apiName: 'glm-4.7',
      uiName: 'GLM-4.7',
      supportsTools: true,
    },
    {
      apiName: 'glm-4.6',
      uiName: 'GLM-4.6',
      supportsTools: true,
    },
    {
      apiName: 'glm-4.5',
      uiName: 'GLM-4.5',
      supportsTools: true,
    },
    {
      apiName: 'glm-4.5-air',
      uiName: 'GLM-4.5 Air',
      supportsTools: true,
    },
  ],
};

export default glmProvider;
