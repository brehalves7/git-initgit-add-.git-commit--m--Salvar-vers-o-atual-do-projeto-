
export interface MatriculaData {
  id: string;
  nome: string;
  cpf: string;
  whatsapp: string;
  status: 'ativo' | 'inativo' | 'trancado' | 'aguardando_pagamento';
  maquinas: string[];
  criado: string;
  horario?: string;
  pagamento?: {
    total: number;
    dinheiro: number;
    cartao: number;
    metodo: 'dinheiro' | 'cartao' | 'pix' | 'dinheiro-cartao';
  }
}

export interface PreMatriculaData {
  id: string;
  nome: string;
  cpf: string;
  whatsapp:string;
  status: 'pre' | 'ativo' | 'inativo' | 'matriculado' | 'aguardando_pagamento';
  local: string;
  criado: string;
  matricula?: MatriculaData;
}

const getStorageKey = (city: string) => `preMatriculasData_${city}`;

const getInitialData = (city: string): PreMatriculaData[] => [
    { id: '206682', nome: 'Fabrício Andrel de Souza Santiago', status: 'pre', local: city, cpf: '095.642.962-93', whatsapp: '(91) 9859-63800', criado: '07/08/2025 15:22:25' },
    { id: '206678', nome: 'Luan Coutinho Gemaque', status: 'pre', local: city, cpf: '016.941.802-20', whatsapp: '(91) 9925-47930', criado: '07/08/2025 15:14:40' },
    { id: '206677', nome: 'Matheus Cavalcante de Souza', status: 'pre', local: city, cpf: '702.249.082-19', whatsapp: '(91) 9858-64299', criado: '07/08/2025 15:10:41' },
    { id: '206671', nome: 'Rivanildo Santos Borges', status: 'pre', local: city, cpf: '711.604.542-21', whatsapp: '(91) 9848-59031', criado: '07/08/2025 14:26:22' },
    { id: '206659', nome: 'Ruan da Silva Marques', status: 'pre', local: city, cpf: '040.525.852-67', whatsapp: '(91) 9844-57136', criado: '07/08/2025 13:43:49' },
    { id: '206657', nome: 'Diego Neves Quaresma', status: 'pre', local: city, cpf: '052.728.112-32', whatsapp: '(91) 9851-18609', criado: '07/08/2025 13:28:26' },
    { id: '206641', nome: 'Ytalo Gabriel Carneiro Da Silva', status: 'pre', local: city, cpf: '050.400.012-82', whatsapp: '(91) 9915-27056', criado: '07/08/2025 12:07:15' },
    { id: '206606', nome: 'Ray Jean De Abreu Vaz', status: 'pre', local: city, cpf: '067.509.462-32', whatsapp: '(91) 9910-87453', criado: '07/08/2025 10:50:10' },
];

export const getPreMatriculas = (city?: string): PreMatriculaData[] => {
    if (typeof window === 'undefined') {
      return [];
    }
    const targetCity = city || localStorage.getItem('selectedCity') || 'Acará/PA';
    const storageKey = getStorageKey(targetCity);
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
        try {
            return JSON.parse(savedData);
        } catch (e) {
            console.error("Failed to parse pre-matriculas from localStorage", e);
            return getInitialData(targetCity);
        }
    }
    
    const initialData = getInitialData(targetCity);
    localStorage.setItem(storageKey, JSON.stringify(initialData));
    return initialData;
};

export const savePreMatriculas = (city: string, data: PreMatriculaData[]) => {
    if (typeof window !== 'undefined') {
        const storageKey = getStorageKey(city);
        localStorage.setItem(storageKey, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('preMatriculaDataChanged', { detail: { city } }));
    }
};

export const addPreMatricula = (city: string, preMatricula: PreMatriculaData) => {
    const data = getPreMatriculas(city);
    data.unshift(preMatricula);
    savePreMatriculas(city, data);
};

export const deletePreMatricula = (city: string, id: string) => {
    let data = getPreMatriculas(city);
    data = data.filter(p => p.id !== id);
    savePreMatriculas(city, data);
};


export const updatePreMatriculaData = (city: string, id: string, updatedData: PreMatriculaData) => {
    const data = getPreMatriculas(city);
    const index = data.findIndex(p => p.id === id);
    if (index !== -1) {
        data[index] = updatedData;
        savePreMatriculas(city, data);
    }
};

export const addMatriculaData = (cpf: string, matricula: MatriculaData, city?: string) => {
    const targetCity = city || localStorage.getItem('selectedCity') || 'Acará/PA';
    const data = getPreMatriculas(targetCity);
    const cleanCpf = cpf.replace(/[^\d]/g, '');
    const index = data.findIndex(p => p.cpf.replace(/[^\d]/g, '') === cleanCpf);
    if (index !== -1) {
      data[index].matricula = matricula;
      data[index].status = 'aguardando_pagamento';
      savePreMatriculas(targetCity, data);
      window.dispatchEvent(new CustomEvent('matriculaCriada', { detail: { city: targetCity } }));
    }
}

export const updatePreMatriculaStatus = (city: string, cpf: string, newStatus: PreMatriculaData['status']) => {
    const data = getPreMatriculas(city);
    const cleanCpf = cpf.replace(/[^\d]/g, '');
    const index = data.findIndex(p => p.cpf.replace(/[^\d]/g, '') === cleanCpf);
    if (index !== -1) {
      data[index].status = newStatus;
      savePreMatriculas(city, data);
    }
};

export const updateMatriculaStatus = (city: string, matriculaId: string, newStatus: MatriculaData['status'], paymentInfo?: MatriculaData['pagamento']) => {
    const data = getPreMatriculas(city);
    const preMatricula = data.find(p => p.matricula?.id === matriculaId);
    if (preMatricula && preMatricula.matricula) {
        preMatricula.matricula.status = newStatus;
        if (paymentInfo) {
            preMatricula.matricula.pagamento = paymentInfo;
        }

        if (newStatus === 'ativo') {
            preMatricula.status = 'matriculado';
        } else if (newStatus === 'aguardando_pagamento') {
             preMatricula.status = 'aguardando_pagamento';
        } else {
             preMatricula.status = 'pre';
        }

        savePreMatriculas(preMatricula.local, data);
        window.dispatchEvent(new CustomEvent('matriculaAtualizada', { detail: { city: preMatricula.local } }));
    }
};
