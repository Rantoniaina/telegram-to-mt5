/**
 * Sync Service for interacting with the Sync API endpoints.
 */

import apiService from './apiService';

// Endpoints
const ENDPOINTS = {
  SYNC: '/sync',
  USER_SYNCS: '/sync/user',
  SYNC_BY_STATE: '/sync/state',
};

export interface Sync {
  id: number;
  user_id: number;
  discussion_name: string;
  state: string;
  created_at: string;
  updated_at: string;
}

export interface SyncCreate {
  user_id: number;
  discussion_name: string;
  state: string;
  dialog_id?: number;
}

export interface SyncUpdate {
  discussion_name?: string;
  state?: string;
}

/**
 * Service to interact with Sync API endpoints.
 */
const syncService = {
  /**
   * Create a new sync.
   * 
   * @param syncData - Data for creating a new sync
   * @returns Promise resolving to the created sync
   */
  async createSync(syncData: SyncCreate): Promise<Sync> {
    return apiService.post<Sync>(ENDPOINTS.SYNC, syncData);
  },

  /**
   * Get all syncs.
   * 
   * @returns Promise resolving to a list of syncs
   */
  async getAllSyncs(): Promise<Sync[]> {
    return apiService.get<Sync[]>(ENDPOINTS.SYNC);
  },

  /**
   * Get syncs for a specific user.
   * 
   * @param userId - ID of the user
   * @returns Promise resolving to a list of syncs
   */
  async getUserSyncs(userId: number): Promise<Sync[]> {
    return apiService.get<Sync[]>(`${ENDPOINTS.USER_SYNCS}/${userId}`);
  },

  /**
   * Get syncs with a specific state.
   * 
   * @param state - State of the syncs to retrieve
   * @returns Promise resolving to a list of syncs
   */
  async getSyncsByState(state: string): Promise<Sync[]> {
    return apiService.get<Sync[]>(`${ENDPOINTS.SYNC_BY_STATE}/${state}`);
  },

  /**
   * Get a specific sync by ID.
   * 
   * @param syncId - ID of the sync to retrieve
   * @returns Promise resolving to the sync
   */
  async getSync(syncId: number): Promise<Sync> {
    return apiService.get<Sync>(`${ENDPOINTS.SYNC}/${syncId}`);
  },

  /**
   * Update a sync by ID.
   * 
   * @param syncId - ID of the sync to update
   * @param syncData - Data to update in the sync
   * @returns Promise resolving to the updated sync
   */
  async updateSync(syncId: number, syncData: SyncUpdate): Promise<Sync> {
    return apiService.post<Sync>(`${ENDPOINTS.SYNC}/${syncId}`, syncData);
  },

  /**
   * Update a sync's state.
   * 
   * @param syncId - ID of the sync to update
   * @param state - New state for the sync
   * @returns Promise resolving to the updated sync
   */
  async updateSyncState(syncId: number, state: string): Promise<Sync> {
    return apiService.put<Sync>(`${ENDPOINTS.SYNC}/${syncId}/state/${state}`, {});
  },

  /**
   * Delete a sync by ID.
   * 
   * @param syncId - ID of the sync to delete
   * @returns Promise resolving to a success status
   */
  async deleteSync(syncId: number): Promise<{ detail: string }> {
    return apiService.delete<{ detail: string }>(`${ENDPOINTS.SYNC}/${syncId}`);
  },
};

export default syncService; 