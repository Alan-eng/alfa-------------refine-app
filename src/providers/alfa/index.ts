import { DataProvider } from "@refinedev/core";

interface ActionExtPayload {
    aid: string;
    api_key: string;
    cid: string;
    vid: string;
}

interface ProgressCallback {
    (progress: { current: number; total: number }): void;
}

const BASE_URL = "/api";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const alfaDataProvider: DataProvider = {
    getList: async ({ meta }) => {
        const response = await fetch(`${BASE_URL}/json/get_all_actions_by_city`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                api_key: meta?.api_key,
                cid: meta?.cid
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        
        if (!data || data.error) {
            throw new Error(data?.error || 'Invalid response from server');
        }

        return {
            data: data,
            total: Array.isArray(data) ? data.length : 0
        };
    },

    getOne: async ({ id, meta }) => {
        const response = await fetch(`${BASE_URL}/json/get_action_ext`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                aid: id,
                api_key: meta?.api_key,
                cid: meta?.cid,
                vid: meta?.vid
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        
        if (!data || data.error) {
            throw new Error(data?.error || 'Invalid response from server');
        }

        return {
            data: data
        };
    },

    create: async () => ({ data: null }),
    update: async () => ({ data: null }),
    deleteOne: async () => ({ data: null }),
    getMany: async () => ({ data: [] }),
    createMany: async () => ({ data: [] }),
    deleteMany: async () => ({ data: [] }),
    updateMany: async () => ({ data: [] }),
    custom: async () => ({ data: null }),
};
