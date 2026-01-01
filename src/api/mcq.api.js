const BASE_URL = "https://tssplatform.onrender.com/api/mcqs";
// change to Render URL later

export const createMCQ = async (data) => {
  const res = await fetch(`${BASE_URL}/createmcq`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const getAllMCQs = async () => {
  const res = await fetch(`${BASE_URL}/getallmcq`);
  return res.json();
};

export const getMCQsByCategory = async (category) => {
  const res = await fetch(`${BASE_URL}/category?category=${category}`);
  return res.json();
};

export const getMCQsByTopic = async (topic) => {
  const res = await fetch(`${BASE_URL}/topic?topic=${topic}`);
  return res.json();
};

export const deleteMCQ = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE"
  });
  return res.json();
};
