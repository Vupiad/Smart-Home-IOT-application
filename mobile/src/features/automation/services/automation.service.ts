import { apiRequest } from "../../../shared/services/api.client";
import { Mode, CreateModeDto } from "../types";

export const automationService = {
  getModes: async (): Promise<Mode[]> => {
    return apiRequest<Mode[]>("/modes");
  },

  getModeById: async (modeId: number | string): Promise<Mode> => {
    return apiRequest<Mode>(`/modes/${modeId}`);
  },

  createMode: async (data: CreateModeDto): Promise<Mode> => {
    return apiRequest<Mode>("/modes", {
      method: "POST",
      body: data,
    });
  },

  updateMode: async (modeId: number | string, data: Partial<CreateModeDto>): Promise<Mode> => {
    return apiRequest<Mode>(`/modes/${modeId}`, {
      method: "PUT",
      body: data,
    });
  },

  deleteMode: async (modeId: number | string): Promise<void> => {
    return apiRequest<void>(`/modes/${modeId}`, {
      method: "DELETE",
    });
  },

  toggleMode: async (modeId: number | string, isActive: boolean): Promise<Mode> => {
    return apiRequest<Mode>(`/modes/${modeId}/toggle`, {
      method: "PATCH",
      body: { isActive },
    });
  },
};
