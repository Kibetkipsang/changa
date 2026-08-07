import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { useChamaStore } from "../stores/chamaStore";
import { api } from "../lib/api";
import {
  Search,
  Crown,
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  UserCog,
  UserMinus,
  Copy,
  Check,
  Loader2,
  Users as UsersIcon,
  X,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  joinedAt: string;
}

export function Members() {
  const { currentChama } = useChamaStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [showRoleModal, setShowRoleModal] = useState<Member | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState<Member | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch chama details with members
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["chama-members", currentChama?.id],
    queryFn: async () => {
      const response = await api.get(`/chamas/${currentChama?.id}`);
      return response.data;
    },
    enabled: !!currentChama?.id,
  });

  // Update role mutation - Only Owner or Treasurer can update roles
  const updateRoleMutation = useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: string;
      role: string;
    }) => {
      const response = await api.patch(
        `/members/${currentChama?.id}/members/${memberId}`,
        { role }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chama-members", currentChama?.id],
      });
      toast.success("Member role updated successfully");
      setShowRoleModal(null);
      refetch();
    },
    onError: (error: any) => {
      console.error("Update role error:", error);
      toast.error(error.response?.data?.error || "Failed to update role");
    },
  });

  // Remove member mutation - Only Owner or Secretary can remove members
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/members/${currentChama?.id}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chama-members", currentChama?.id],
      });
      toast.success("Member removed from chama successfully");
      setShowRemoveModal(null);
      refetch();
    },
    onError: (error: any) => {
      console.error("Remove member error:", error);
      toast.error(error.response?.data?.error || "Failed to remove member");
    },
  });

  const copyInviteCode = () => {
    if (currentChama?.inviteCode) {
      navigator.clipboard.writeText(currentChama.inviteCode);
      setCopied(true);
      toast.success("Invite code copied");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case "TREASURER":
        return <Shield className="w-4 h-4 text-blue-600" />;
      case "SECRETARY":
        return <UserCog className="w-4 h-4 text-green-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      OWNER: "bg-yellow-100 text-yellow-800",
      TREASURER: "bg-blue-100 text-blue-800",
      SECRETARY: "bg-green-100 text-green-800",
      MEMBER: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role as keyof typeof styles] || styles.MEMBER}`}
      >
        {role}
      </span>
    );
  };

  const members = data?.members || [];
  const userRole = currentChama?.role;

  // ✅ UPDATED PERMISSIONS:
  // - Owner or Treasurer can update roles
  // - Owner or Secretary can remove members
  const canUpdateRole = userRole === "OWNER" || userRole === "TREASURER";
  const canRemoveMember = userRole === "OWNER" || userRole === "SECRETARY";
  const canManage = canUpdateRole || canRemoveMember;

  // Calculate counts
  const totalMembers = members.length;
  const ownersCount = members.filter((m: Member) => m.role === "OWNER").length;
  const treasurersCount = members.filter(
    (m: Member) => m.role === "TREASURER",
  ).length;
  const secretariesCount = members.filter(
    (m: Member) => m.role === "SECRETARY",
  ).length;
  const regularMembersCount = members.filter(
    (m: Member) => m.role === "MEMBER",
  ).length;

  const filteredMembers = members.filter((member: Member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Close modal helpers
  const closeRoleModal = () => setShowRoleModal(null);
  const closeRemoveModal = () => setShowRemoveModal(null);

  if (!currentChama) {
    return (
      <Layout>
        <div className="text-center py-16 bg-white rounded-xl shadow-sm p-8">
          <p className="text-gray-600">
            Please select a chama to view members.
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Members</h1>
            <p className="text-sm text-gray-600 mt-0.5 hidden sm:block">
              Manage members of {currentChama.name}
            </p>
            <p className="text-sm text-purple-600 mt-1">
              👥 Total Members: {totalMembers}
            </p>
          </div>
          {canManage && (
            <div className="flex gap-3">
              <button
                onClick={copyInviteCode}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied!" : "Invite Code"}
              </button>
            </div>
          )}
        </div>

        {/* Mobile chama name */}
        <p className="text-sm text-gray-600 block sm:hidden">
          {currentChama.name}
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-sm text-gray-500">Total Members</p>
                <p className="text-base sm:text-2xl font-bold text-gray-900">
                  {totalMembers}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-sm text-gray-500">Owners</p>
                <p className="text-base sm:text-2xl font-bold text-yellow-600">
                  {ownersCount}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-sm text-gray-500">Treasurers</p>
                <p className="text-base sm:text-2xl font-bold text-blue-600">
                  {treasurersCount}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-sm text-gray-500">Secretaries</p>
                <p className="text-base sm:text-2xl font-bold text-green-600">
                  {secretariesCount}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                <UserCog className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-sm text-gray-500">Regular</p>
                <p className="text-base sm:text-2xl font-bold text-gray-900">
                  {regularMembersCount}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
            >
              <option value="all">All Roles ({totalMembers})</option>
              <option value="OWNER">Owner ({ownersCount})</option>
              <option value="TREASURER">Treasurer ({treasurersCount})</option>
              <option value="SECRETARY">Secretary ({secretariesCount})</option>
              <option value="MEMBER">Member ({regularMembersCount})</option>
            </select>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Member</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Role</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Contact</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Joined</th>
                  {canManage && <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={canManage ? 5 : 4} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                      <p className="text-sm text-gray-500 mt-2">Loading members...</p>
                    </td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 5 : 4} className="text-center py-12">
                      <UsersIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500">No members found</p>
                      {searchTerm && (
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member: Member) => {
                    const isOwner = member.role === "OWNER";
                    const canEditRole = canUpdateRole && !isOwner;
                    const canRemove = canRemoveMember && !isOwner;
                    
                    return (
                      <tr key={member.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-700 font-medium">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{member.name}</p>
                              <p className="text-xs text-gray-500">ID: {member.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(member.role)}
                            {getRoleBadge(member.role)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-3 h-3" />
                              <span>{member.email}</span>
                            </div>
                            {member.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-3 h-3" />
                                <span>{member.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(member.joinedAt), "dd MMM yyyy")}</span>
                          </div>
                        </td>
                        {canManage && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {canEditRole && (
                                <button
                                  onClick={() => setShowRoleModal(member)}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                                  title="Change Role"
                                >
                                  <UserCog className="w-4 h-4 text-blue-500" />
                                </button>
                              )}
                              {canRemove && (
                                <button
                                  onClick={() => setShowRemoveModal(member)}
                                  className="p-1 hover:bg-red-50 rounded transition-colors"
                                  title="Remove Member"
                                >
                                  <UserMinus className="w-4 h-4 text-red-500" />
                                </button>
                              )}
                              {isOwner && (
                                <span className="text-xs text-gray-400">Cannot modify owner</span>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-gray-100">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                <UsersIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>No members found</p>
              </div>
            ) : (
              filteredMembers.map((member: Member) => {
                const isOwner = member.role === "OWNER";
                const canEditRole = canUpdateRole && !isOwner;
                const canRemove = canRemoveMember && !isOwner;
                
                return (
                  <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-700 font-medium text-sm">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {member.name}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {getRoleIcon(member.role)}
                              {getRoleBadge(member.role)}
                            </div>
                          </div>
                        </div>
                      </div>
                      {canManage && !isOwner && (
                        <div className="flex items-center gap-1 ml-2">
                          {canEditRole && (
                            <button
                              onClick={() => setShowRoleModal(member)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <UserCog className="w-3.5 h-3.5 text-blue-500" />
                            </button>
                          )}
                          {canRemove && (
                            <button
                              onClick={() => setShowRemoveModal(member)}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <UserMinus className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-3 h-3" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(member.joinedAt), "dd MMM yyyy")}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with count */}
          <div className="bg-gray-50 px-4 py-2 sm:px-6 sm:py-3 border-t">
            <p className="text-xs sm:text-sm text-gray-500">
              Showing {filteredMembers.length} of {totalMembers} members
              {searchTerm && ` matching "${searchTerm}"`}
              {selectedRole !== "all" && ` with role ${selectedRole}`}
            </p>
          </div>
        </div>
      </div>

      {/* Change Role Modal - With Blur and Back Arrow */}
      {showRoleModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeRoleModal}
        >
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeRoleModal}
          />
          <div 
            className="relative bg-white rounded-t-2xl sm:rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={closeRoleModal}
                className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <button
                onClick={closeRoleModal}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <h2 className="text-lg sm:text-xl font-bold mb-2">Change Member Role</h2>
            <p className="text-sm text-gray-600 mb-4">
              Update role for <span className="font-medium">{showRoleModal.name}</span>
            </p>
            <div className="space-y-3">
              {["TREASURER", "SECRETARY", "MEMBER"].map((role) => (
                <button
                  key={role}
                  onClick={() =>
                    updateRoleMutation.mutate({
                      memberId: showRoleModal.id,
                      role,
                    })
                  }
                  className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    showRoleModal.role === role
                      ? "bg-purple-50 border-purple-300"
                      : "hover:bg-gray-50"
                  }`}
                  disabled={updateRoleMutation.isPending}
                >
                  <div className="flex items-center gap-3">
                    {getRoleIcon(role)}
                    <span className="font-medium">{role}</span>
                  </div>
                  {showRoleModal.role === role && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={closeRoleModal}
                className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Modal - With Blur */}
      {showRemoveModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeRemoveModal}
        >
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeRemoveModal}
          />
          <div 
            className="relative bg-white rounded-t-2xl sm:rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeRemoveModal}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" />
              </div>
              
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Remove Member</h2>
              <p className="text-sm text-gray-600 mb-3 sm:mb-4">
                Are you sure you want to remove{" "}
                <span className="font-semibold">{showRemoveModal.name}</span>{" "}
                from {currentChama.name}?
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3 w-full mb-3 sm:mb-4 text-left text-sm">
                <p className="text-xs text-gray-500">Member Details</p>
                <p className="font-medium text-gray-900">{showRemoveModal.name}</p>
                <p className="text-xs text-gray-500 mt-1">Email</p>
                <p className="text-sm text-gray-700">{showRemoveModal.email}</p>
                <p className="text-xs text-gray-500 mt-1">Role</p>
                <p className="text-sm text-gray-700">{showRemoveModal.role}</p>
              </div>
              
              <p className="text-xs sm:text-sm text-red-600 mb-4 sm:mb-6">
                ⚠️ This action cannot be undone.
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => removeMemberMutation.mutate(showRemoveModal.id)}
                  disabled={removeMemberMutation.isPending}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  {removeMemberMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Removing...</>
                  ) : (
                    <><UserMinus className="w-4 h-4" /> Remove Member</>
                  )}
                </button>
                <button
                  onClick={closeRemoveModal}
                  className="flex-1 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}