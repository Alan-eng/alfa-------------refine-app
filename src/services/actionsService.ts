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

interface RequestData {
    data: Action[];
    timestamp: number;
}

interface StoredRequests {
    [key: string]: RequestData;
}

const STORAGE_KEY = 'alfa_api_requests';

export const actionsService = {
    saveRequest(methodName: string, cityId: string, data: Action[]): void {
        const key = `${methodName}_${cityId}`;
        const storedData = this.getAllRequests();
        
        storedData[key] = {
            data,
            timestamp: Date.now()
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
    },

    getRequest(methodName: string, cityId: string): RequestData | null {
        const key = `${methodName}_${cityId}`;
        const storedData = this.getAllRequests();
        return storedData[key] || null;
    },

    getAllRequests(): StoredRequests {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    },

    clearRequest(methodName: string, cityId: string): void {
        const key = `${methodName}_${cityId}`;
        const storedData = this.getAllRequests();
        delete storedData[key];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
    },

    clearAllRequests(): void {
        localStorage.removeItem(STORAGE_KEY);
    },

    isRequestValid(methodName: string, cityId: string): boolean {
        const data = this.getRequest(methodName, cityId);
        if (!data) return false;
        
        // Проверяем, что данные не старше 24 часов
        const isExpired = Date.now() - data.timestamp > 24 * 60 * 60 * 1000;
        return !isExpired;
    }
};
