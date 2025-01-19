// сервис для работы с данными мероприятий, который:

// Сохраняет данные в localStorage с метаданными:
// Список мероприятий
// Временная метка сохранения
// ID города
// Предоставляет методы:
// saveRequest: сохранение списка мероприятий
// getRequest: получение сохраненных данных
// clearRequest: очистка сохраненных данных
// clearAllRequests: очистка всех сохраненных данных
// isRequestValid: проверка валидности данных (не старше 24 часов)

interface Action {
    actionId: string;
    actionName: string;
    venues: Record<string, any>;
    cityId: string;
    from: string;
    time: string;
    age: string;
    genres: Record<string, { genreName: string }>;
    minPrice: number;
    maxPrice: number;
}

interface ActionExt {
    action: Action;
    available: boolean;
    // другие поля из ответа get_action_ext
}

interface RequestData {
    data: Action[] | ActionExt;
    timestamp: number;
}

interface StoredRequests {
    [key: string]: RequestData;
}

interface CityActionExtData {
    [`get_action_ext_${actionId}`]: RequestData;
}

// const STORAGE_KEY = 'alfa_api_requests';

export const actionsService = {
    saveGetAllActionsByCityRequest(cityId: string, data: Action[]): void {
        const storageKey = `get_all_actions_by_city_${cityId}`;
        const requestData = {
            data,
            timestamp: Date.now()
        };
        
        localStorage.setItem(storageKey, JSON.stringify(requestData));
    },

    getGetAllActionsByCityRequest(cityId: string): RequestData | null {
        const storageKey = `get_all_actions_by_city_${cityId}`;
        const data = localStorage.getItem(storageKey);
        return data ? JSON.parse(data) : null;
    },

    saveGetActionExtRequest(cityId: string, actionId: string, data: ActionExt): void {
        const cityKey = `get_action_ext_city_${cityId}`;
        const actionKey = `get_action_ext_${actionId}`;
        let cityData: CityActionExtData = {};
        
        const existingData = localStorage.getItem(cityKey);
        if (existingData) {
            cityData = JSON.parse(existingData);
        }
        
        cityData[actionKey] = {
            data,
            timestamp: Date.now()
        };
        
        localStorage.setItem(cityKey, JSON.stringify(cityData));
    },

    getGetActionExtRequest(cityId: string, actionId: string): RequestData | null {
        const cityKey = `get_action_ext_city_${cityId}`;
        const actionKey = `get_action_ext_${actionId}`;
        const cityData = localStorage.getItem(cityKey);
        
        if (!cityData) return null;
        
        const parsedData: CityActionExtData = JSON.parse(cityData);
        return parsedData[actionKey] || null;
    },

    getAllRequests(): StoredRequests {
        const requests: StoredRequests = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('get_all_actions_by_city_')) {
                const data = localStorage.getItem(key);
                if (data) {
                    requests[key] = JSON.parse(data);
                }
            }
        }
        return requests;
    },

    clearGetAllActionsByCityRequest(cityId: string): void {
        const storageKey = `get_all_actions_by_city_${cityId}`;
        localStorage.removeItem(storageKey);
    },

    clearGetActionExtRequest(cityId: string, actionId: string): void {
        const cityKey = `get_action_ext_city_${cityId}`;
        const actionKey = `get_action_ext_${actionId}`;
        const cityData = localStorage.getItem(cityKey);
        
        if (cityData) {
            const parsedData: CityActionExtData = JSON.parse(cityData);
            delete parsedData[actionKey];
            
            if (Object.keys(parsedData).length === 0) {
                localStorage.removeItem(cityKey);
            } else {
                localStorage.setItem(cityKey, JSON.stringify(parsedData));
            }
        }
    },

    clearAllRequests(): void {
        // Очищаем все get_all_actions_by_city_* ключи
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('get_all_actions_by_city_')) {
                localStorage.removeItem(key);
            }
        }
        // Очищаем все get_action_ext_city_* ключи
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('get_action_ext_city_')) {
                localStorage.removeItem(key);
            }
        }
    },

    isGetAllActionsByCityRequestValid(cityId: string): boolean {
        const data = this.getGetAllActionsByCityRequest(cityId);
        if (!data) return false;
        
        // Проверяем, что данные не старше 24 часов
        const isExpired = Date.now() - data.timestamp > 24 * 60 * 60 * 1000;
        return !isExpired;
    },

    isGetActionExtRequestValid(cityId: string, actionId: string): boolean {
        const data = this.getGetActionExtRequest(cityId, actionId);
        if (!data) return false;
        
        // Проверяем, что данные не старше 1 часа для проверки доступности
        const isExpired = Date.now() - data.timestamp > 60 * 60 * 1000;
        return !isExpired;
    }
};
