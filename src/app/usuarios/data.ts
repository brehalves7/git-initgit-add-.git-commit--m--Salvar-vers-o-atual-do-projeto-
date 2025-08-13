
export interface UserData {
    id: string;
    name: string;
    email: string;
    role: 'mestre' | 'pessoa' | 'aluno' | 'limitado';
    createdAt: string;
    city: string;
    password?: string;
}

const getStorageKey = (city: string) => `usersData_${city}`;


export let initialUsers: UserData[] = [
    { id: '1', name: 'Brayan Lucena', email: '1lucena.brayan@outlook.com', role: 'mestre', password: '123', createdAt: '01/01/2024 10:00:00', city: 'Acará/PA' },
    { id: '2', name: 'Teste 1', email: 'teste1@gcscursos.com.br', role: 'aluno', password: '123456', createdAt: '01/01/2024 11:00:00', city: 'Acará/PA' }
    ,{ id: '3', name: 'Brayan Mestre', email: 'brayan@mestre.com', role: 'mestre', password: '84407257', createdAt: '13/08/2025 10:00:00', city: 'Acará/PA' }
];

export const getUsers = (city?: string): UserData[] => {
    if (typeof window === 'undefined') {
        return []; 
    }

    const targetCity = city || localStorage.getItem('selectedCity');
    if (!targetCity) return []; // Cannot get users if no city is identified

    const storageKey = getStorageKey(targetCity);
    const savedData = localStorage.getItem(storageKey);

    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            if(Array.isArray(parsedData)) {
                return parsedData;
            }
        } catch (e) {
            console.error(`Failed to parse users for city ${targetCity}`, e);
            return [];
        }
    }
    
    // For the default city, populate with initial data if nothing is in storage
    if (targetCity.toLowerCase() === 'acará/pa') {
        localStorage.setItem(storageKey, JSON.stringify(initialUsers));
        return initialUsers;
    }

    return [];
};


export const saveUsers = (city: string, data: UserData[]) => {
    if (typeof window !== 'undefined') {
        const storageKey = getStorageKey(city);
        localStorage.setItem(storageKey, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('usersDataChanged', { detail: { city } }));
    }
};

export const addUser = (city: string, user: Omit<UserData, 'createdAt'>) => {
    const users = getUsers(city);
    const newUser: UserData = {
        ...user,
        city,
        createdAt: new Date().toLocaleString('pt-BR'),
    }
    const updatedUsers = [newUser, ...users];
    saveUsers(city, updatedUsers);
};

export const updateUser = (city: string, id: string, updatedData: Partial<Omit<UserData, 'id' | 'createdAt'>>) => {
    const users = getUsers(city);
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex !== -1) {
        const originalUser = users[userIndex];
        
        const updatedUser = {
            ...originalUser,
            name: updatedData.name ?? originalUser.name,
            email: updatedData.email ?? originalUser.email,
            role: updatedData.role ?? originalUser.role,
            password: updatedData.password ? updatedData.password : originalUser.password
        };

        users[userIndex] = updatedUser;
        saveUsers(city, users);
    }
}

export const deleteUser = (city: string, id: string) => {
    let users = getUsers(city);
    users = users.filter(u => u.id !== id);
    saveUsers(city, users);
};
