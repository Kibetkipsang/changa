import { chamaAPI } from "../lib/api";
import { Chama } from "../stores/chamaStore";

export const chamaService = {
  async getMyChamas(): Promise<Chama[]> {
    try {
      const response = await chamaAPI.getMyChamas();
      console.log("Raw API Response:", response.data);

      // The response data structure is { chamas: [...] }
      const chamas = (response.data.chamas || []).map((chama: any) => ({
        id: chama.id,
        name: chama.name,
        description: chama.description,
        inviteCode: chama.inviteCode,
        contributionAmount: chama.contributionAmount,
        frequency: chama.frequency,
        role: chama.role,
        memberCount: chama.memberCount ?? 0,
      }));

      console.log("Processed chamas with memberCount:", chamas);
      return chamas;
    } catch (error) {
      console.error("Error fetching my chamas:", error);
      throw error;
    }
  },
};
