import client from './client';

export const financeAPI = {
  // Journals
  getJournals: async () => {
    const response = await client.get('/api/finance/journals/');
    return response.data;
  },
  createJournal: async (data: any) => {
    const response = await client.post('/api/finance/journals/', data);
    return response.data;
  },

  // Chart of Accounts
  getAccounts: async () => {
    const response = await client.get('/api/finance/accounts/');
    return response.data;
  },
  
  // Payables
  getPayables: async () => {
    const response = await client.get('/api/finance/payables/');
    return response.data;
  },
  
  // Receivables
  getReceivables: async () => {
    const response = await client.get('/api/finance/receivables/');
    return response.data;
  }
};
