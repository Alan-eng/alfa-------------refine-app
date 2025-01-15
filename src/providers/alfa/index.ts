import { DataProvider } from "@refinedev/core";

const BASE_URL = "/api";

export const alfaDataProvider: DataProvider = {
    getOne: async ({ meta }) => {
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

        const rawData = await response.json();
        
        if (!rawData || rawData.error) {
            throw new Error(rawData?.error || 'Invalid response from server');
        }

        return {
            data: rawData,
        };
    },
    
    // Заглушки для остальных методов DataProvider
    getList: () => Promise.resolve({ data: [], total: 0 }),
    create: () => Promise.resolve({ data: {} }),
    update: () => Promise.resolve({ data: {} }),
    deleteOne: () => Promise.resolve({ data: {} }),
    getMany: () => Promise.resolve({ data: [] }),
    createMany: () => Promise.resolve({ data: [] }),
    deleteMany: () => Promise.resolve({ data: [] }),
    updateMany: () => Promise.resolve({ data: [] }),
    custom: () => Promise.resolve({ data: {} }),
};
