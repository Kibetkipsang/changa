import { prisma } from "../lib/prisma.js";
const getChamaId = (params) => Array.isArray(params.chamaId) ? params.chamaId[0] : params.chamaId || "";
export const getSettings = async (req, res) => {
    try {
        const chamaId = getChamaId(req.params);
        if (!chamaId) {
            return res.status(400).json({ error: "Invalid chamaId" });
        }
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Check if user is a member of this chama
        const membership = await prisma.membership.findUnique({
            where: {
                userId_chamaId: {
                    userId,
                    chamaId,
                },
            },
        });
        if (!membership) {
            return res.status(403).json({ error: "Access denied" });
        }
        // Get settings
        const settings = await prisma.chamaSettings.findUnique({
            where: { chamaId },
        });
        res.json({ settings });
    }
    catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ error: "Failed to fetch settings" });
    }
};
export const saveSettings = async (req, res) => {
    try {
        const chamaId = getChamaId(req.params);
        if (!chamaId) {
            return res.status(400).json({ error: "Invalid chamaId" });
        }
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Get user's role from membership
        const membership = await prisma.membership.findUnique({
            where: {
                userId_chamaId: {
                    userId,
                    chamaId,
                },
            },
        });
        if (!membership) {
            return res.status(403).json({ error: "Access denied" });
        }
        // ✅ Allow Secretary to update settings along with Owner and Treasurer
        if (membership.role !== "OWNER" && membership.role !== "TREASURER" && membership.role !== "SECRETARY") {
            return res.status(403).json({
                error: "Only Owner, Treasurer, or Secretary can update settings"
            });
        }
        const { allowMemberInvites, requireApprovalForJoin, contributionDay, gracePeriodDays, allowPartialPayment, maxLoanAmount, minLoanAmount, defaultLoanPeriod, maxLoanPeriod, requireCollateral, loanApprovalThreshold, meetingFrequency, defaultMeetingDay, requireAttendance, notifyOnContribution, notifyOnLoanRequest, notifyOnMeeting, notifyOnPayment, } = req.body;
        // Validate settings
        if (gracePeriodDays !== undefined && gracePeriodDays < 0) {
            return res.status(400).json({ error: "Grace period cannot be negative" });
        }
        if (defaultLoanPeriod !== undefined && defaultLoanPeriod < 1) {
            return res.status(400).json({ error: "Default loan period must be at least 1 month" });
        }
        if (maxLoanPeriod !== undefined && defaultLoanPeriod !== undefined && maxLoanPeriod < defaultLoanPeriod) {
            return res.status(400).json({
                error: "Maximum loan period cannot be less than default loan period"
            });
        }
        if (minLoanAmount !== undefined && maxLoanAmount !== undefined && minLoanAmount > maxLoanAmount) {
            return res.status(400).json({
                error: "Minimum loan amount cannot exceed maximum loan amount"
            });
        }
        if (contributionDay !== undefined && contributionDay !== null && (contributionDay < 1 || contributionDay > 31)) {
            return res.status(400).json({ error: "Contribution day must be between 1 and 31" });
        }
        // Check if chama exists
        const chama = await prisma.chama.findUnique({
            where: { id: chamaId },
        });
        if (!chama) {
            return res.status(404).json({ error: "Chama not found" });
        }
        // Prepare data for upsert
        const settingsData = {
            allowMemberInvites: allowMemberInvites ?? true,
            requireApprovalForJoin: requireApprovalForJoin ?? false,
            contributionDay: contributionDay ?? null,
            gracePeriodDays: gracePeriodDays ?? 3,
            allowPartialPayment: allowPartialPayment ?? false,
            maxLoanAmount: maxLoanAmount ?? null,
            minLoanAmount: minLoanAmount ?? null,
            defaultLoanPeriod: defaultLoanPeriod ?? 6,
            maxLoanPeriod: maxLoanPeriod ?? 12,
            requireCollateral: requireCollateral ?? false,
            loanApprovalThreshold: loanApprovalThreshold ?? null,
            meetingFrequency: meetingFrequency ?? null,
            defaultMeetingDay: defaultMeetingDay ?? null,
            requireAttendance: requireAttendance ?? false,
            notifyOnContribution: notifyOnContribution ?? true,
            notifyOnLoanRequest: notifyOnLoanRequest ?? true,
            notifyOnMeeting: notifyOnMeeting ?? true,
            notifyOnPayment: notifyOnPayment ?? true,
            updatedAt: new Date(),
        };
        // Upsert settings
        const settings = await prisma.chamaSettings.upsert({
            where: { chamaId },
            update: settingsData,
            create: {
                chamaId,
                ...settingsData,
            },
        });
        // Log the settings change
        await prisma.auditLog.create({
            data: {
                chamaId,
                userId,
                action: "UPDATE",
                entity: "SETTINGS",
                entityId: settings.id,
                newValues: settings,
                createdAt: new Date(),
            },
        });
        res.json({
            message: "Settings saved successfully",
            settings
        });
    }
    catch (error) {
        console.error("Error saving settings:", error);
        res.status(500).json({ error: "Failed to save settings" });
    }
};
// Get settings with validation rules applied
export const getEffectiveSettings = async (req, res) => {
    try {
        const chamaId = getChamaId(req.params);
        if (!chamaId) {
            return res.status(400).json({ error: "Invalid chamaId" });
        }
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Check if user is a member
        const membership = await prisma.membership.findUnique({
            where: {
                userId_chamaId: {
                    userId,
                    chamaId,
                },
            },
        });
        if (!membership) {
            return res.status(403).json({ error: "Access denied" });
        }
        // Get chama with settings
        const chama = await prisma.chama.findUnique({
            where: { id: chamaId },
            include: {
                settings: true,
            },
        });
        if (!chama) {
            return res.status(404).json({ error: "Chama not found" });
        }
        // Get member count
        const memberCount = await prisma.membership.count({
            where: { chamaId },
        });
        // Apply settings with defaults
        const settings = chama.settings || {
            allowMemberInvites: true,
            requireApprovalForJoin: false,
            contributionDay: null,
            gracePeriodDays: 3,
            allowPartialPayment: false,
            maxLoanAmount: null,
            minLoanAmount: null,
            defaultLoanPeriod: 6,
            maxLoanPeriod: 12,
            requireCollateral: false,
            loanApprovalThreshold: null,
            meetingFrequency: null,
            defaultMeetingDay: null,
            requireAttendance: false,
            notifyOnContribution: true,
            notifyOnLoanRequest: true,
            notifyOnMeeting: true,
            notifyOnPayment: true,
        };
        // Calculate next contribution date
        const today = new Date();
        let nextContributionDate = new Date(today);
        if (settings.contributionDay) {
            nextContributionDate.setDate(settings.contributionDay);
            if (nextContributionDate < today) {
                nextContributionDate.setMonth(nextContributionDate.getMonth() + 1);
            }
        }
        else {
            nextContributionDate = new Date(chama.startDate || today);
            switch (chama.frequency) {
                case "weekly":
                    nextContributionDate.setDate(nextContributionDate.getDate() + 7);
                    break;
                case "biweekly":
                    nextContributionDate.setDate(nextContributionDate.getDate() + 14);
                    break;
                case "monthly":
                    nextContributionDate.setMonth(nextContributionDate.getMonth() + 1);
                    break;
                default:
                    nextContributionDate.setMonth(nextContributionDate.getMonth() + 1);
            }
        }
        // Build effective settings with business rules
        const effectiveSettings = {
            ...settings,
            canMembersInvite: settings.allowMemberInvites && memberCount > 1,
            needsApproval: settings.requireApprovalForJoin,
            contributionDueDate: settings.contributionDay ?
                new Date(new Date().getFullYear(), new Date().getMonth(), settings.contributionDay) :
                null,
            nextContributionDate,
            loanLimits: {
                min: settings.minLoanAmount || 0,
                max: settings.maxLoanAmount || null,
                defaultPeriod: settings.defaultLoanPeriod,
                maxPeriod: settings.maxLoanPeriod,
            },
            requiresBothApprovals: (amount) => {
                if (!settings.loanApprovalThreshold)
                    return false;
                return amount > settings.loanApprovalThreshold;
            },
        };
        res.json({
            settings: effectiveSettings,
            chama: {
                id: chama.id,
                name: chama.name,
                frequency: chama.frequency,
                contributionAmount: chama.contributionAmount,
                penaltyAmount: chama.penaltyAmount,
                loanInterestRate: chama.loanInterestRate,
                memberCount,
            }
        });
    }
    catch (error) {
        console.error("Error fetching effective settings:", error);
        res.status(500).json({ error: "Failed to fetch settings" });
    }
};
// Apply settings to a specific action (e.g., loan request)
export const validateLoanRequest = async (req, res) => {
    try {
        const chamaId = getChamaId(req.params);
        const { amount, period } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Get chama settings
        const chama = await prisma.chama.findUnique({
            where: { id: chamaId },
            include: {
                settings: true,
            },
        });
        if (!chama) {
            return res.status(404).json({ error: "Chama not found" });
        }
        const settings = (chama.settings ?? {});
        const errors = [];
        // Validate against settings
        if (settings.minLoanAmount && amount < settings.minLoanAmount) {
            errors.push(`Minimum loan amount is ${settings.minLoanAmount}`);
        }
        if (settings.maxLoanAmount && amount > settings.maxLoanAmount) {
            errors.push(`Maximum loan amount is ${settings.maxLoanAmount}`);
        }
        if (settings.defaultLoanPeriod && period < settings.defaultLoanPeriod) {
            errors.push(`Minimum loan period is ${settings.defaultLoanPeriod} months`);
        }
        if (settings.maxLoanPeriod && period > settings.maxLoanPeriod) {
            errors.push(`Maximum loan period is ${settings.maxLoanPeriod} months`);
        }
        // Check if requires both approvals
        const requiresBoth = settings.loanApprovalThreshold && amount > settings.loanApprovalThreshold;
        // Check if collateral is required
        const requiresCollateral = settings.requireCollateral || false;
        res.json({
            valid: errors.length === 0,
            errors,
            requiresBothApprovals: requiresBoth || false,
            requiresCollateral,
            settings: {
                minAmount: settings.minLoanAmount || null,
                maxAmount: settings.maxLoanAmount || null,
                defaultPeriod: settings.defaultLoanPeriod || null,
                maxPeriod: settings.maxLoanPeriod || null,
                approvalThreshold: settings.loanApprovalThreshold || null,
            },
        });
    }
    catch (error) {
        console.error("Error validating loan request:", error);
        res.status(500).json({ error: "Failed to validate loan request" });
    }
};
// Get contribution rules based on settings
export const getContributionRules = async (req, res) => {
    try {
        const { chamaId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const membership = await prisma.membership.findUnique({
            where: {
                userId_chamaId: {
                    userId,
                    chamaId,
                },
            },
        });
        if (!membership) {
            return res.status(403).json({ error: "Access denied" });
        }
        const chama = await prisma.chama.findUnique({
            where: { id: chamaId },
            include: {
                settings: true,
            },
        });
        if (!chama) {
            return res.status(404).json({ error: "Chama not found" });
        }
        const settings = chama.settings;
        // Calculate next contribution date
        const today = new Date();
        let nextContributionDate = new Date(today);
        if (settings?.contributionDay) {
            nextContributionDate.setDate(settings.contributionDay);
            if (nextContributionDate < today) {
                nextContributionDate.setMonth(nextContributionDate.getMonth() + 1);
            }
        }
        else {
            nextContributionDate = new Date(chama.startDate || today);
            switch (chama.frequency) {
                case "weekly":
                    nextContributionDate.setDate(nextContributionDate.getDate() + 7);
                    break;
                case "biweekly":
                    nextContributionDate.setDate(nextContributionDate.getDate() + 14);
                    break;
                case "monthly":
                    nextContributionDate.setMonth(nextContributionDate.getMonth() + 1);
                    break;
                default:
                    nextContributionDate.setMonth(nextContributionDate.getMonth() + 1);
            }
        }
        // Calculate grace period end date
        const gracePeriodEnd = new Date(nextContributionDate);
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + (settings?.gracePeriodDays ?? 3));
        res.json({
            rules: {
                contributionAmount: chama.contributionAmount || 0,
                frequency: chama.frequency,
                gracePeriodDays: settings?.gracePeriodDays ?? 3,
                allowPartial: settings?.allowPartialPayment ?? false,
                penaltyAmount: chama.penaltyAmount || 0,
                nextContributionDate,
                gracePeriodEnd,
                contributionDay: settings?.contributionDay ?? null,
                isOverdue: today > gracePeriodEnd,
            },
        });
    }
    catch (error) {
        console.error("Error fetching contribution rules:", error);
        res.status(500).json({ error: "Failed to fetch contribution rules" });
    }
};
//# sourceMappingURL=settingsControllers.js.map