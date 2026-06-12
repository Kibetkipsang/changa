import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { useChamaStore } from "../stores/chamaStore";
import { api } from "../lib/api";
import {
  Plus,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trash2,
  Edit,
  Loader2,
  Video,
  AlertCircle,
} from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  type: string;
  agenda: string;
  minutes: string;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  attendanceList: string;
  attendanceCount: number;
  allMembers?: { id: string; name: string }[];
}

export function Meetings() {
  const { currentChama } = useChamaStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [showAttendance, setShowAttendance] = useState<Meeting | null>(null);
  const [showMinutes, setShowMinutes] = useState<Meeting | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch meetings
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["meetings", currentChama?.id, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      const response = await api.get(`/meetings/${currentChama?.id}?${params}`);
      return response.data;
    },
    enabled: !!currentChama?.id,
  });

  // Fetch members for attendance
  const { data: chamaData } = useQuery({
    queryKey: ["chama-members-attendance", currentChama?.id],
    queryFn: async () => {
      const response = await api.get(`/chamas/${currentChama?.id}`);
      return response.data;
    },
    enabled: !!currentChama?.id,
  });

  // Create meeting mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post(`/meetings/${currentChama?.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["meetings", currentChama?.id],
      });
      toast.success("Meeting scheduled successfully");
      setShowForm(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to schedule meeting");
    },
  });

  // Update meeting mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(
        `/meetings/${currentChama?.id}/${id}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["meetings", currentChama?.id],
      });
      toast.success("Meeting updated successfully");
      setEditingMeeting(null);
      refetch();
    },
  });

  // Cancel meeting mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(
        `/meetings/cancel/${currentChama?.id}/${id}`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["meetings", currentChama?.id],
      });
      toast.success("Meeting cancelled");
      refetch();
    },
  });

  // Mark attendance mutation
  const attendanceMutation = useMutation({
    mutationFn: async ({
      id,
      attendeeIds,
    }: {
      id: string;
      attendeeIds: string[];
    }) => {
      const response = await api.patch(
        `/meetings/attendance/${currentChama?.id}/${id}`,
        { attendeeIds },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["meetings", currentChama?.id],
      });
      toast.success("Attendance marked successfully");
      setShowAttendance(null);
      refetch();
    },
  });

  // Add minutes mutation
  const minutesMutation = useMutation({
    mutationFn: async ({ id, minutes }: { id: string; minutes: string }) => {
      const response = await api.patch(
        `/meetings/minutes/${currentChama?.id}/${id}`,
        { minutes },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["meetings", currentChama?.id],
      });
      toast.success("Meeting minutes added");
      setShowMinutes(null);
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      title: formData.get("title"),
      description: formData.get("description"),
      date: formData.get("date"),
      location: formData.get("location"),
      type: formData.get("type"),
      agenda: formData.get("agenda"),
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMeeting) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingMeeting.id,
      data: {
        title: formData.get("title"),
        description: formData.get("description"),
        date: formData.get("date"),
        location: formData.get("location"),
        type: formData.get("type"),
        agenda: formData.get("agenda"),
        status: formData.get("status"),
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" /> Scheduled
          </span>
        );
      case "ONGOING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <AlertCircle className="w-3 h-3" /> Ongoing
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <CheckCircle className="w-3 h-3" /> Completed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const meetings = data?.meetings || [];
  const summary = data?.summary || {};
  const members = chamaData?.chama?.members || [];
  const userRole = currentChama?.role;
  const canManage =
    userRole === "OWNER" ||
    userRole === "SECRETARY" ||
    userRole === "TREASURER";

  if (!currentChama) {
    return (
      <Layout>
        <div className="text-center py-16 bg-white rounded-xl shadow-sm p-8">
          <p className="text-gray-600">
            Please select a chama to manage meetings.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
            <p className="text-gray-600 mt-1">
              Schedule and manage meetings for {currentChama.name}
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Schedule Meeting
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500">Total Meetings</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary.total || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500">Upcoming</p>
            <p className="text-2xl font-bold text-blue-600">
              {summary.upcoming || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {summary.past || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500">Average Attendance</p>
            <p className="text-2xl font-bold text-gray-900">
              {meetings.length
                ? Math.round(
                    meetings.reduce(
                      (sum: number, m: Meeting) =>
                        sum + (m.attendanceCount || 0),
                      0,
                    ) / meetings.length,
                  )
                : 0}
              %
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            >
              <option value="all">All Meetings</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Meetings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            </div>
          ) : meetings.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No meetings found</p>
              {canManage && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-3 text-purple-600 hover:underline text-sm"
                >
                  Schedule your first meeting →
                </button>
              )}
            </div>
          ) : (
            meetings.map((meeting: Meeting) => (
              <div
                key={meeting.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {meeting.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {meeting.type}
                      </p>
                    </div>
                    {getStatusBadge(meeting.status)}
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        {format(
                          new Date(meeting.date),
                          "EEEE, MMMM d, yyyy h:mm a",
                        )}
                      </span>
                    </div>
                    {meeting.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{meeting.location}</span>
                      </div>
                    )}
                    {meeting.attendanceCount !== undefined &&
                      meeting.status === "COMPLETED" && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{meeting.attendanceCount} attendees</span>
                        </div>
                      )}
                  </div>

                  <div className="flex gap-2 mt-5 pt-4 border-t">
                    <button
                      onClick={() => setSelectedMeeting(meeting)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    {canManage && meeting.status === "SCHEDULED" && (
                      <>
                        <button
                          onClick={() => setShowAttendance(meeting)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-green-50 transition-colors"
                        >
                          <Users className="w-4 h-4" />
                          Attendance
                        </button>
                        <button
                          onClick={() => setEditingMeeting(meeting)}
                          className="p-1.5 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Cancel this meeting?"))
                              cancelMutation.mutate(meeting.id);
                          }}
                          className="p-1.5 border rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <XCircle className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    )}
                    {canManage &&
                      meeting.status === "COMPLETED" &&
                      !meeting.minutes && (
                        <button
                          onClick={() => setShowMinutes(meeting)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Add Minutes
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Meeting Modal */}
      {(showForm || editingMeeting) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingMeeting ? "Edit Meeting" : "Schedule Meeting"}
            </h2>
            <form
              onSubmit={editingMeeting ? handleUpdate : handleSubmit}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingMeeting?.title}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingMeeting?.description}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="date"
                  required
                  defaultValue={
                    editingMeeting?.date
                      ? format(
                          new Date(editingMeeting.date),
                          "yyyy-MM-dd'T'HH:mm",
                        )
                      : ""
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  defaultValue={editingMeeting?.location}
                  placeholder="Physical address or Zoom link"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Type
                </label>
                <select
                  name="type"
                  defaultValue={editingMeeting?.type || "REGULAR"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="REGULAR">Regular Meeting</option>
                  <option value="SPECIAL">Special Meeting</option>
                  <option value="AGM">Annual General Meeting</option>
                </select>
              </div>
              {editingMeeting && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={editingMeeting.status}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agenda
                </label>
                <textarea
                  name="agenda"
                  rows={4}
                  defaultValue={editingMeeting?.agenda}
                  placeholder="1. Opening prayer&#10;2. Review of previous minutes&#10;3. Financial report&#10;4. New business&#10;5. Adjournment"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono text-sm"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingMeeting
                      ? "Update"
                      : "Schedule"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingMeeting(null);
                  }}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Attendance Modal */}
      {showAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-2">Mark Attendance</h2>
            <p className="text-sm text-gray-600 mb-4">
              {showAttendance.title} ·{" "}
              {format(new Date(showAttendance.date), "MMMM d, yyyy")}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const attendeeIds = Array.from(
                  formData.getAll("attendees"),
                ) as string[];
                attendanceMutation.mutate({
                  id: showAttendance.id,
                  attendeeIds,
                });
              }}
              className="space-y-4"
            >
              <div className="max-h-96 overflow-y-auto border rounded-lg p-3">
                {members.map((member: any) => (
                  <label
                    key={member.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="attendees"
                      value={member.id}
                      defaultChecked={showAttendance.attendanceList?.includes(
                        member.id,
                      )}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={attendanceMutation.isPending}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {attendanceMutation.isPending
                    ? "Saving..."
                    : "Save Attendance"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAttendance(null)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Minutes Modal */}
      {showMinutes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-2">Add Meeting Minutes</h2>
            <p className="text-sm text-gray-600 mb-4">
              {showMinutes.title} ·{" "}
              {format(new Date(showMinutes.date), "MMMM d, yyyy")}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                minutesMutation.mutate({
                  id: showMinutes.id,
                  minutes: formData.get("minutes") as string,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minutes *
                </label>
                <textarea
                  name="minutes"
                  required
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono text-sm"
                  placeholder="Meeting minutes, decisions made, action items..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={minutesMutation.isPending}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {minutesMutation.isPending ? "Saving..." : "Save Minutes"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMinutes(null)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Meeting Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{selectedMeeting.title}</h2>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Date & Time</p>
                    <p className="text-sm">
                      {format(
                        new Date(selectedMeeting.date),
                        "EEEE, MMMM d, yyyy h:mm a",
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="text-sm">{selectedMeeting.type}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm">
                      {selectedMeeting.location || "Not specified"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Status</p>
                    <p>{getStatusBadge(selectedMeeting.status)}</p>
                  </div>
                </div>
              </div>

              {selectedMeeting.agenda && (
                <div>
                  <h3 className="font-semibold mb-2">Agenda</h3>
                  <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                    {selectedMeeting.agenda}
                  </div>
                </div>
              )}

              {selectedMeeting.minutes && (
                <div>
                  <h3 className="font-semibold mb-2">Minutes</h3>
                  <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                    {selectedMeeting.minutes}
                  </div>
                </div>
              )}

              {selectedMeeting.attendanceCount !== undefined &&
                selectedMeeting.attendanceCount > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">
                      Attendance ({selectedMeeting.attendanceCount})
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {/* Would need to fetch attendee names from API */}
                      <p className="text-sm text-gray-600">
                        {selectedMeeting.attendanceCount} members attended
                      </p>
                    </div>
                  </div>
                )}

              <div className="pt-4">
                <button
                  onClick={() => setSelectedMeeting(null)}
                  className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
