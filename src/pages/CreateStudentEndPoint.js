const API_BASE = process.env.REACT_APP_API_BASE_URL;

export async function fetchCampuses() {
  const res = await fetch(`${API_BASE}/campus/get`);
  const result = await res.json();
  console.log(result);
}

export async function fetchYearsByCampus(campus) {
  const res = await fetch(
    `${API_BASE}/year/get-by-campus?campus=${encodeURIComponent(campus)}`
  );
  return res.json();
}

export async function fetchBatchesByCampusYear(campus, year) {
  const res = await fetch(
    `${API_BASE}/batch/get-by-campus-year?campus=${encodeURIComponent(
      campus
    )}&year=${encodeURIComponent(year)}`
  );
  return res.json();
}

export async function createStudent(payload) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return res.json();
}
