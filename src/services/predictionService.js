const API_URL = import.meta.env.VITE_ML_API_URL

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(errorData.detail || `Error ${response.status}`)
  }

  return response.json()
}

export const predictionService = {
  getHealth() {
    return request('/health')
  },

  getInfo() {
    return request('/info')
  },

  predict(historicoReciente) {
    return request('/predict', {
      method: 'POST',
      body: JSON.stringify({ historico_reciente: historicoReciente }),
    })
  },
}
