import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ? "https://admin.chama.keptwise.com" : "http://localhost:5000/changa";


export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiration (401 from server)
    if (error.response?.status === 401) {
      // Clear local storage
      localStorage.removeItem("changa-auth-storage");
      localStorage.removeItem("changa-chama-storage");

      // Redirect to login if not already there
      if (
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/register"
      ) {
        window.location.href = "/login";
      }
    }

    // Handle network errors
    if (error.code === "ECONNABORTED") {
      console.error("Request timeout");
      error.message = "Request timeout. Please try again.";
    }

    if (!error.response) {
      console.error("Network error");
      error.message = "Network error. Please check your connection.";
    }

    return Promise.reject(error);
  },
);

// API Helper Functions
export const authAPI = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
};

export const chamaAPI = {
  create: (data: any) => api.post("/chamas", data),
  join: (inviteCode: string) => api.post("/chamas/join", { inviteCode }),
  getAll: () => api.get("/chamas"),
  getMyChamas: () => api.get("/chamas"),
  getOne: (id: string) => api.get(`/chamas/${id}`),
  update: (id: string, data: any) => api.put(`/chamas/${id}`, data),
  delete: (id: string) => api.delete(`/chamas/${id}`),
};

export const contributionAPI = {
  create: (chamaId: string, data: any) =>
    api.post(`/contributions/${chamaId}`, data),
  getAll: (chamaId: string, params?: any) =>
    api.get(`/contributions/${chamaId}`, { params }),
  getOne: (chamaId: string, contributionId: string) =>
    api.get(`/contributions/${chamaId}/${contributionId}`),
  update: (chamaId: string, contributionId: string, data: any) =>
    api.put(`/contributions/${chamaId}/${contributionId}`, data),
  delete: (chamaId: string, contributionId: string) =>
    api.delete(`/contributions/${chamaId}/${contributionId}`),
  getStats: (chamaId: string) => api.get(`/contributions/stats/${chamaId}`),
  getMemberContributions: (chamaId: string, memberId: string) =>
    api.get(`/contributions/member/${chamaId}/${memberId}`),
};

export const loanAPI = {
  request: (chamaId: string, data: any) => api.post(`/loans/${chamaId}`, data),
  getAll: (chamaId: string, params?: any) =>
    api.get(`/loans/${chamaId}`, { params }),
  getOne: (chamaId: string, loanId: string) =>
    api.get(`/loans/${chamaId}/${loanId}`),
  approve: (chamaId: string, loanId: string) =>
    api.patch(`/loans/approve/${chamaId}/${loanId}`),
  reject: (chamaId: string, loanId: string, reason: string) =>
    api.patch(`/loans/reject/${chamaId}/${loanId}`, {
      rejectionReason: reason,
    }),
  activate: (chamaId: string, loanId: string) =>
    api.patch(`/loans/activate/${chamaId}/${loanId}`),
  recordRepayment: (chamaId: string, loanId: string, data: any) =>
    api.post(`/loans/repayment/${chamaId}/${loanId}`, data),
  getRepayments: (chamaId: string, loanId: string) =>
    api.get(`/loans/repayment/${chamaId}/${loanId}`),
  delete: (chamaId: string, loanId: string) =>
    api.delete(`/loans/${chamaId}/${loanId}`),
};

export const meetingAPI = {
  create: (chamaId: string, data: any) =>
    api.post(`/meetings/${chamaId}`, data),
  getAll: (chamaId: string, params?: any) =>
    api.get(`/meetings/${chamaId}`, { params }),
  getOne: (chamaId: string, meetingId: string) =>
    api.get(`/meetings/${chamaId}/${meetingId}`),
  update: (chamaId: string, meetingId: string, data: any) =>
    api.put(`/meetings/${chamaId}/${meetingId}`, data),
  markAttendance: (chamaId: string, meetingId: string, attendeeIds: string[]) =>
    api.patch(`/meetings/attendance/${chamaId}/${meetingId}`, { attendeeIds }),
  addMinutes: (chamaId: string, meetingId: string, minutes: string) =>
    api.patch(`/meetings/minutes/${chamaId}/${meetingId}`, { minutes }),
  cancel: (chamaId: string, meetingId: string) =>
    api.patch(`/meetings/cancel/${chamaId}/${meetingId}`),
  getUpcoming: (chamaId: string) => api.get(`/meetings/upcoming/${chamaId}`),
  delete: (chamaId: string, meetingId: string) =>
    api.delete(`/meetings/${chamaId}/${meetingId}`),
};

export const memberAPI = {
  getAll: (chamaId: string) => api.get(`/chamas/${chamaId}`),
  updateRole: (chamaId: string, memberId: string, role: string) =>
    api.patch(`/chamas/${chamaId}/members/${memberId}`, { role }),
  remove: (chamaId: string, memberId: string) =>
    api.delete(`/chamas/${chamaId}/members/${memberId}`),
};
