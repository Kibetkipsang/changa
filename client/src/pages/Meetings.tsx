import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isAfter, addMinutes } from "date-fns";
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
  Edit,
  Loader2,
  AlertCircle,
  X,
  ArrowLeft,
  UserCheck,
  Lock,
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
  attendanceList: string[];
  attendanceCount: number;
  attendees?: { id: string; name: string; email: string }[];
  allMembers?: { id: string; name: string; email: string }[];
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
      const response = await api.get(`/meeting/${currentChama?.id}?${params}`);
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
      const response = await api.post(`/meeting/${currentChama?.id}`, data);
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
      const response = await api.put(`/meeting/${currentChama?.id}/${id}`, data);
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
        `/meeting/cancel/${currentChama?.id}/${id}`,
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
        `/meeting/attendance/${currentChama?.id}/${id}`,
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
        `/meeting/minutes/${currentChama?.id}/${id}`,
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
  const members = chamaData?.members || [];
  const userRole = currentChama?.role;
  
  // Only Owner, Secretary, or Treasurer can manage meetings
  const canManage = userRole === "OWNER" || userRole === "SECRETARY" || userRole === "TREASURER";

  // Check if attendance can be marked (meeting must have started)
  const canMarkAttendance = (meetingDate: string) => {
    const now = new Date();
    const meetingTime = new Date(meetingDate);
    // Allow marking attendance 15 minutes before meeting start
    const startTime = addMinutes(meetingTime, -15);
    return isAfter(now, startTime);
  };

  // Check if meeting has passed
  // const isMeetingPast = (meetingDate: string) => {
  //   const now = new Date();
  //   const meetingTime = new Date(meetingDate);
  //   return isAfter(now, meetingTime);
  // };

  // Calculate attendance percentage correctly
  const calculateAttendancePercentage = (meeting: Meeting) => {
    if (!members || members.length === 0) return 0;
    const totalMembers = members.length;
    const attended = meeting.attendanceList?.length || 0;
    return Math.round((attended / totalMembers) * 100);
  };

  // Close modal helpers
  const closeFormModal = () => {
    setShowForm(false);
    setEditingMeeting(null);
  };

  const closeAttendanceModal = () => setShowAttendance(null);
  const closeMinutesModal = () => setShowMinutes(null);
  const closeDetailsModal = () => setSelectedMeeting(null);

  // Get attendee names from IDs
  const getAttendeeNames = (attendanceList: string[]) => {
    if (!attendanceList || attendanceList.length === 0) return [];
    return members.filter((m: any) => attendanceList.includes(m.id));
  };

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
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meetings</h1>
            <p className="text-sm text-gray-600 mt-0.5 hidden sm:block">
              Schedule and manage meetings for {currentChama.name}
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm flex-1 sm:flex-none justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Meeting</span>
            </button>
          )}
        </div>

        {/* Mobile chama name */}
        <p className="text-sm text-gray-600 block sm:hidden">
          {currentChama.name}
        </p>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100">
            <p className="text-[10px] sm:text-sm text-gray-500">Total Meetings</p>
            <p className="text-base sm:text-2xl font-bold text-gray-900">
              {summary.total || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100">
            <p className="text-[10px] sm:text-sm text-gray-500">Upcoming</p>
            <p className="text-base sm:text-2xl font-bold text-blue-600">
              {summary.upcoming || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100">
            <p className="text-[10px] sm:text-sm text-gray-500">Completed</p>
            <p className="text-base sm:text-2xl font-bold text-green-600">
              {summary.past || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100">
            <p className="text-[10px] sm:text-sm text-gray-500">Attendance</p>
            <p className="text-base sm:text-2xl font-bold text-gray-900">
              {meetings.length
                ? Math.round(
                    meetings.reduce(
                      (sum: number, m: Meeting) =>
                        sum + (m.attendanceCount || 0),
                      0,
                    ) / meetings.length
                  )
                : 0}
              %
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
          >
            <option value="all">All Meetings</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Meetings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            </div>
          ) : meetings.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-100">
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
            meetings.map((meeting: Meeting) => {
              // const attendees = meeting.attendanceList 
              //   ? getAttendeeNames(meeting.attendanceList)
              //   : [];
              const attendancePercentage = calculateAttendancePercentage(meeting);
              const canMark = canMarkAttendance(meeting.date);
              // const isPast = isMeetingPast(meeting.date);
              
              return (
                <div
                  key={meeting.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {meeting.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {meeting.type}
                        </p>
                      </div>
                      {getStatusBadge(meeting.status)}
                    </div>

                    <div className="space-y-2 mt-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                          {format(
                            new Date(meeting.date),
                            "MMM d, yyyy h:mm a",
                          )}
                        </span>
                      </div>
                      {meeting.location && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{meeting.location}</span>
                        </div>
                      )}
                      {meeting.status === "COMPLETED" && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <UserCheck className="w-4 h-4 flex-shrink-0" />
                          <span>{meeting.attendanceCount || 0} attendees ({attendancePercentage}%)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 sm:gap-2 mt-4 pt-4 border-t">
                      {/* View Details - Everyone */}
                      <button
                        onClick={() => setSelectedMeeting(meeting)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs sm:text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>

                      {/* View/Edit Attendance - Everyone can view, only managers can edit */}
                      <button
                        onClick={() => setShowAttendance(meeting)}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs sm:text-sm border rounded-lg transition-colors ${
                          canManage && canMark && meeting.status === "SCHEDULED"
                            ? "hover:bg-green-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        {meeting.attendanceCount > 0 
                          ? `${meeting.attendanceCount} attended` 
                          : canManage && canMark && meeting.status === "SCHEDULED"
                            ? "Mark Attendance"
                            : "Attendance"}
                        {canManage && canMark && meeting.status === "SCHEDULED" && (
                          <span className="text-[8px] text-green-600">(available)</span>
                        )}
                        {canManage && !canMark && meeting.status === "SCHEDULED" && (
                          <span className="text-[8px] text-gray-400">(waiting)</span>
                        )}
                      </button>

                      {/* Manage actions - Only Owner, Secretary, Treasurer */}
                      {canManage && meeting.status === "SCHEDULED" && (
                        <>
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
                      
                      {/* Add Minutes - Only Owner, Secretary, Treasurer */}
                      {canManage &&
                        meeting.status === "COMPLETED" &&
                        !meeting.minutes && (
                          <button
                            onClick={() => setShowMinutes(meeting)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs sm:text-sm border rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Minutes
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create/Edit Meeting Modal */}
      {(showForm || editingMeeting) && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeFormModal}
        >
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeFormModal}
          />
          <div 
            className="relative bg-white rounded-t-2xl sm:rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-2xl max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={closeFormModal}
                className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <button
                onClick={closeFormModal}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <h2 className="text-lg sm:text-xl font-bold mb-4">
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Type
                </label>
                <select
                  name="type"
                  defaultValue={editingMeeting?.type || "REGULAR"}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>
                    : editingMeeting
                      ? "Update"
                      : "Schedule"}
                </button>
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="flex-1 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View/Edit Attendance Modal */}
      {showAttendance && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeAttendanceModal}
        >
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeAttendanceModal}
          />
          <div 
            className="relative bg-white rounded-t-2xl sm:rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={closeAttendanceModal}
                className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <button
                onClick={closeAttendanceModal}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <h2 className="text-lg sm:text-xl font-bold mb-2">
              {canManage ? "Mark Attendance" : "Attendance List"}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {showAttendance.title} ·{" "}
              {format(new Date(showAttendance.date), "MMMM d, yyyy h:mm a")}
              {showAttendance.attendanceCount > 0 && (
                <span className="ml-2 text-purple-600">
                  ({showAttendance.attendanceCount} attendees)
                </span>
              )}
            </p>

            {/* Check if attendance can be marked */}
            {canManage && !canMarkAttendance(showAttendance.date) && showAttendance.status === "SCHEDULED" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-yellow-600" />
                <p className="text-xs text-yellow-700">
                  Attendance can only be marked from 15 minutes before the meeting starts.
                  <br />
                  Meeting starts at: {format(new Date(showAttendance.date), "h:mm a")}
                </p>
              </div>
            )}

            {canManage ? (
              // Edit mode for managers
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
                <div className="max-h-72 overflow-y-auto border rounded-lg p-2">
                  {members.map((member: any) => {
                    const isAttending = showAttendance.attendanceList?.includes(member.id);
                    const canEdit = canMarkAttendance(showAttendance.date) || showAttendance.status === "COMPLETED";
                    return (
                      <label
                        key={member.id}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                          isAttending ? "bg-green-50" : "hover:bg-gray-50"
                        } ${!canEdit ? "opacity-75 cursor-not-allowed" : ""}`}
                      >
                        <input
                          type="checkbox"
                          name="attendees"
                          value={member.id}
                          defaultChecked={isAttending}
                          disabled={!canEdit}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 disabled:opacity-50"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                        {isAttending && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </label>
                    );
                  })}
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="submit"
                    disabled={attendanceMutation.isPending || !canMarkAttendance(showAttendance.date)}
                    className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    {attendanceMutation.isPending
                      ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>
                      : "Save Attendance"}
                  </button>
                  <button
                    type="button"
                    onClick={closeAttendanceModal}
                    className="flex-1 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </form>
            ) : (
              // View only mode for non-managers
              <div className="space-y-4">
                <div className="max-h-72 overflow-y-auto border rounded-lg p-2">
                  {members.map((member: any) => {
                    const isAttending = showAttendance.attendanceList?.includes(member.id);
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-3 p-2 rounded ${
                          isAttending ? "bg-green-50" : "bg-gray-50"
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                        {isAttending ? (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Present
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <XCircle className="w-3.5 h-3.5" />
                            Absent
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeAttendanceModal}
                    className="w-full border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Minutes Modal */}
      {showMinutes && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeMinutesModal}
        >
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeMinutesModal}
          />
          <div 
            className="relative bg-white rounded-t-2xl sm:rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-2xl max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={closeMinutesModal}
                className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <button
                onClick={closeMinutesModal}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <h2 className="text-lg sm:text-xl font-bold mb-2">Add Meeting Minutes</h2>
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono"
                  placeholder="Meeting minutes, decisions made, action items..."
                />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={minutesMutation.isPending}
                  className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {minutesMutation.isPending
                    ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>
                    : "Save Minutes"}
                </button>
                <button
                  type="button"
                  onClick={closeMinutesModal}
                  className="flex-1 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
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
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeDetailsModal}
        >
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeDetailsModal}
          />
          <div 
            className="relative bg-white rounded-t-2xl sm:rounded-xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold truncate">{selectedMeeting.title}</h2>
              <button
                onClick={closeDetailsModal}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Date & Time</p>
                    <p className="font-medium">
                      {format(
                        new Date(selectedMeeting.date),
                        "EEEE, MMMM d, yyyy h:mm a",
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="font-medium">{selectedMeeting.type}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-medium">
                      {selectedMeeting.location || "Not specified"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Status</p>
                    <p>{getStatusBadge(selectedMeeting.status)}</p>
                  </div>
                  {selectedMeeting.attendanceCount > 0 && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Attendance</p>
                      <p className="font-medium text-green-600">
                        {selectedMeeting.attendanceCount} members attended
                        {members.length > 0 && 
                          ` (${Math.round((selectedMeeting.attendanceCount / members.length) * 100)}%)`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedMeeting.agenda && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Agenda</h3>
                  <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                    {selectedMeeting.agenda}
                  </div>
                </div>
              )}

              {selectedMeeting.minutes && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Minutes</h3>
                  <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                    {selectedMeeting.minutes}
                  </div>
                </div>
              )}

              {/* Show attendees if any */}
              {selectedMeeting.attendanceList && selectedMeeting.attendanceList.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">
                    Attendees ({selectedMeeting.attendanceList.length})
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {getAttendeeNames(selectedMeeting.attendanceList).map((member: any) => (
                      <span
                        key={member.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs"
                      >
                        <UserCheck className="w-3 h-3" />
                        {member.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <button
                  onClick={closeDetailsModal}
                  className="w-full border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
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