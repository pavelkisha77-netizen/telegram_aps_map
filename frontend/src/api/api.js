const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function fetchPoints() {
  const response = await fetch(`${API_BASE}/points`);

  if (!response.ok) {
    throw new Error('Не удалось загрузить точки');
  }

  return response.json();
}

export async function createPoint(pointData) {
  const response = await fetch(`${API_BASE}/points`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(pointData)
  });

  if (!response.ok) {
    throw new Error('Не удалось создать точку');
  }

  return response.json();
}

export async function updatePoint(pointId, pointData) {
  const response = await fetch(`${API_BASE}/points/${pointId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(pointData)
  });

  if (!response.ok) {
    throw new Error('Не удалось обновить точку');
  }

  return response.json();
}

export async function deletePoint(pointId) {
  const response = await fetch(`${API_BASE}/points/${pointId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    throw new Error('Не удалось удалить точку');
  }

  return response.json();
}

export async function uploadMedia(formData) {
  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Не удалось загрузить медиа');
  }

  return response.json();
}

export async function deleteMedia(public_id, resource_type) {
  const response = await fetch(`${API_BASE}/media/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      public_id,
      resource_type
    })
  });

  if (!response.ok) {
    throw new Error('Не удалось удалить медиа');
  }

  return response.json();
}
