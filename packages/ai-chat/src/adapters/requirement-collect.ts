import type { MessageAdapter } from '../types/adapter';

export const requirementCollectAdapter: MessageAdapter = {
  name: 'requirement-collect',

  toStandard: () => {
    return {
      id: '',
      role: 'assistant' as const,
      content: '',
      createdAt: new Date(),
      status: 'done' as const,
    };
  },

  fromStandard: (standardMessage) => {
    return {
      id: standardMessage.id,
      role: standardMessage.role,
      content: standardMessage.content,
      createdAt: standardMessage.createdAt.toISOString(),
      status: standardMessage.status,
    };
  },

  transformRequest: (request: unknown) => {
    const req = request as { message?: string; sessionId?: string; conversationId?: string; rawRequirementId?: string };
    return {
      content: req.message || '',
      files: undefined,
    };
  },

  transformResponse: (response: unknown) => {
    const res = response as Record<string, unknown>;

    if (res.type === 'content' && res.content) {
      return {
        type: 'content',
        content: res.content as string,
      };
    }

    if (res.type === 'metadata') {
      return {
        type: 'metadata',
        conversationId: res.conversationId as string | undefined,
        isNewConversation: res.isNewConversation as boolean | undefined,
        followUpQuestions: res.followUpQuestions,
        keyElements: res.keyElements,
      };
    }

    if (res.type === 'error') {
      return {
        type: 'error',
        error: res.error as string,
      };
    }

    return res;
  },
};
