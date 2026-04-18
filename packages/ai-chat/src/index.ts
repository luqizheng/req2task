export * from './types';
export * from './components';
export * from './composables';
export * from './utils';
export { requirementCollectAdapter, registerAdapter } from './adapters';

import { requirementCollectAdapter, registerAdapter } from './adapters';
registerAdapter(requirementCollectAdapter);

export { default as AIChat } from './components/AIChat.vue';
