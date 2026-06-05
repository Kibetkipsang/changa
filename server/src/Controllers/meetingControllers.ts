import { Response } from 'express';
import {prisma} from '../lib/prisma.ts'
import { AuthRequest } from '../types/express.js';



// ==================== CREATE ====================

// Schedule a meeting (TREASURER/SECRETARY/OWNER only)
export const scheduleMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chamaId } = req.params as {chamaId: string}
    const { title, description, date, location, type, agenda } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Check permission
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    });

    if (!membership || (membership.role !== 'TREASURER' && membership.role !== 'SECRETARY' && membership.role !== 'OWNER')) {
      res.status(403).json({ error: 'Only treasurer, secretary, or owner can schedule meetings' });
      return;
    }

    // Validate input
    if (!title || !date) {
      res.status(400).json({ error: 'Title and date are required' });
      return;
    }

    const meetingDate = new Date(date);
    if (isNaN(meetingDate.getTime())) {
      res.status(400).json({ error: 'Invalid date format' });
      return;
    }

    // Create meeting
    const meeting = await prisma.$transaction(async (tx) => {
      const newMeeting = await tx.meeting.create({
        data: {
          chamaId,
          title,
          description,
          date: meetingDate,
          location,
          type: type || 'REGULAR',
          agenda: agenda || null,
          status: 'SCHEDULED',
          createdBy: userId,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          chamaId,
          userId,
          action: 'SCHEDULE_MEETING',
          entity: 'Meeting',
          entityId: newMeeting.id,
          newValues: {
            title,
            date: meetingDate,
            location,
            type,
          },
        },
      });

      return newMeeting;
    });

    res.status(201).json({
      success: true,
      message: 'Meeting scheduled successfully',
      meeting,
    });
  } catch (error) {
    console.error('Schedule meeting error:', error);
    res.status(500).json({ error: 'Failed to schedule meeting' });
  }
};

// ==================== READ ====================

// Get all meetings for a chama
export const getMeetings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chamaId } = req.params as {chamaId: string}
    const { status, fromDate, toDate, type } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Check membership
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Build filters
    const filters: any = { chamaId };

    if (status) {
      filters.status = status as string;
    }

    if (type) {
      filters.type = type as string;
    }

    if (fromDate || toDate) {
      filters.date = {};
      if (fromDate) filters.date.gte = new Date(fromDate as string);
      if (toDate) filters.date.lte = new Date(toDate as string);
    }

    // Get meetings
    const meetings = await prisma.meeting.findMany({
      where: filters,
      orderBy: {
        date: 'desc',
      },
    });

    // Add attendance stats for each meeting
    const meetingsWithStats = meetings.map(meeting => {
      let attendanceCount = 0;
      let attendanceList: string[] = [];
      
      if (meeting.attendanceList) {
        try {
          attendanceList = JSON.parse(meeting.attendanceList);
          attendanceCount = attendanceList.length;
        } catch (e) {
          // Handle legacy format (comma-separated)
          attendanceCount = meeting.attendanceList.split(',').filter(a => a.trim()).length;
        }
      }

      return {
        ...meeting,
        attendanceCount,
        isUpcoming: new Date(meeting.date) > new Date(),
        isPast: new Date(meeting.date) < new Date(),
      };
    });

    // Summary
    const upcomingMeetings = meetingsWithStats.filter(m => m.isUpcoming && m.status !== 'CANCELLED');
    const pastMeetings = meetingsWithStats.filter(m => m.isPast || m.status === 'COMPLETED');

    res.json({
      success: true,
      meetings: meetingsWithStats,
      summary: {
        total: meetings.length,
        upcoming: upcomingMeetings.length,
        past: pastMeetings.length,
        cancelled: meetings.filter(m => m.status === 'CANCELLED').length,
      },
      userRole: membership.role,
    });
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
};

// Get single meeting by ID
export const getMeetingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chamaId, meetingId } = req.params as {chamaId: string, meetingId: string}
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Check access
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
      include: {
        chama: {
          include: {
            memberships: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        chamaId,
      },
    });

    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    // Parse attendance list
    let attendanceList: string[] = [];
    let attendees: any[] = [];
    
    if (meeting.attendanceList) {
      try {
        attendanceList = JSON.parse(meeting.attendanceList);
        // Get attendee details
        attendees = membership.chama.memberships
          .filter(m => attendanceList.includes(m.userId))
          .map(m => ({
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            phone: m.user.phone,
          }));
      } catch (e) {
        // Legacy format
        attendanceList = meeting.attendanceList.split(',').filter(a => a.trim());
        attendees = membership.chama.memberships
          .filter(m => attendanceList.includes(m.userId))
          .map(m => ({
            id: m.user.id,
            name: m.user.name,
          }));
      }
    }

    // Get all members for attendance marking
    const allMembers = membership.chama.memberships.map(m => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      phone: m.user.phone,
    }));

    res.json({
      success: true,
      meeting: {
        ...meeting,
        attendanceList: attendees,
        attendanceCount: attendees.length,
        allMembers, // For UI to mark attendance
      },
      userRole: membership.role,
      canEdit: ['OWNER', 'SECRETARY', 'TREASURER'].includes(membership.role),
    });
  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({ error: 'Failed to fetch meeting' });
  }
};

// Get upcoming meetings (for dashboard)
export const getUpcomingMeetings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chamaId } = req.params as {chamaId: string}
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Check membership
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const upcomingMeetings = await prisma.meeting.findMany({
      where: {
        chamaId,
        date: {
          gte: new Date(),
        },
        status: {
          not: 'CANCELLED',
        },
      },
      orderBy: {
        date: 'asc',
      },
      take: 5, // Next 5 meetings
    });

    res.json({
      success: true,
      meetings: upcomingMeetings,
    });
  } catch (error) {
    console.error('Get upcoming meetings error:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming meetings' });
  }
};

// ==================== UPDATE ====================

// Update meeting details (SECRETARY/OWNER only)
export const updateMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chamaId, meetingId } = req.params as {chamaId: string, meetingId: string}
    const { title, description, date, location, type, agenda, status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Check permission
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    });

    if (!membership || (membership.role !== 'SECRETARY' && membership.role !== 'OWNER')) {
      res.status(403).json({ error: 'Only secretary or owner can update meetings' });
      return;
    }

    // Get old values
    const oldMeeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        chamaId,
      },
    });

    if (!oldMeeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    // Prepare update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);
    if (location !== undefined) updateData.location = location;
    if (type !== undefined) updateData.type = type;
    if (agenda !== undefined) updateData.agenda = agenda;
    if (status !== undefined) updateData.status = status;

    // Update meeting
    const updatedMeeting = await prisma.$transaction(async (tx) => {
      const updated = await tx.meeting.update({
        where: { id: meetingId },
        data: updateData,
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          chamaId,
          userId,
          action: 'UPDATE_MEETING',
          entity: 'Meeting',
          entityId: meetingId,
          oldValues: {
            title: oldMeeting.title,
            date: oldMeeting.date,
            status: oldMeeting.status,
          },
          newValues: {
            title: updated.title,
            date: updated.date,
            status: updated.status,
          },
        },
      });

      return updated;
    });

    res.json({
      success: true,
      message: 'Meeting updated successfully',
      meeting: updatedMeeting,
    });
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
};

// Mark attendance for a meeting
export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chamaId, meetingId } = req.params as {chamaId: string, meetingId: string}
    const { attendeeIds } = req.body; // Array of user IDs
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Check permission
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    });

    if (!membership || (membership.role !== 'SECRETARY' && membership.role !== 'OWNER')) {
      res.status(403).json({ error: 'Only secretary or owner can mark attendance' });
      return;
    }

    // Get meeting
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        chamaId,
      },
    });

    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    if (!attendeeIds || !Array.isArray(attendeeIds)) {
      res.status(400).json({ error: 'Attendee IDs array is required' });
      return;
    }

    // Update attendance
    const updatedMeeting = await prisma.$transaction(async (tx) => {
      const updated = await tx.meeting.update({
        where: { id: meetingId },
        data: {
          attendanceList: JSON.stringify(attendeeIds),
          status: meeting.status === 'SCHEDULED' ? 'COMPLETED' : meeting.status,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          chamaId,
          userId,
          action: 'MARK_ATTENDANCE',
          entity: 'Meeting',
          entityId: meetingId,
          newValues: {
            attendeeCount: attendeeIds.length,
            status: updated.status,
          },
        },
      });

      return updated;
    });

    res.json({
      success: true,
      message: `Attendance marked for ${attendeeIds.length} members`,
      meeting: updatedMeeting,
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

// Add meeting minutes (SECRETARY/OWNER only)
export const addMinutes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chamaId, meetingId } = req.params as {chamaId: string, meetingId: string}
    const { minutes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Check permission
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    });

    if (!membership || (membership.role !== 'SECRETARY' && membership.role !== 'OWNER')) {
      res.status(403).json({ error: 'Only secretary or owner can add minutes' });
      return;
    }

    if (!minutes) {
      res.status(400).json({ error: 'Minutes are required' });
      return;
    }

    // Get meeting
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        chamaId,
      },
    });

    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    // Update meeting with minutes
    const updatedMeeting = await prisma.$transaction(async (tx) => {
      const updated = await tx.meeting.update({
        where: { id: meetingId },
        data: {
          minutes,
          status: 'COMPLETED',
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          chamaId,
          userId,
          action: 'ADD_MINUTES',
          entity: 'Meeting',
          entityId: meetingId,
          newValues: {
            minutesLength: minutes.length,
          },
        },
      });

      return updated;
    });

    res.json({
      success: true,
      message: 'Meeting minutes added successfully',
      meeting: updatedMeeting,
    });
  } catch (error) {
    console.error('Add minutes error:', error);
    res.status(500).json({ error: 'Failed to add minutes' });
  }
};

// ==================== DELETE ====================

// Cancel/Delete meeting (SECRETARY/OWNER only)
export const cancelMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chamaId, meetingId } = req.params as {chamaId: string, meetingId: string}
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Check permission
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    });

    if (!membership || (membership.role !== 'SECRETARY' && membership.role !== 'OWNER')) {
      res.status(403).json({ error: 'Only secretary or owner can cancel meetings' });
      return;
    }

    // Get meeting
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        chamaId,
      },
    });

    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    // Update status to CANCELLED
    const cancelledMeeting = await prisma.$transaction(async (tx) => {
      const updated = await tx.meeting.update({
        where: { id: meetingId },
        data: {
          status: 'CANCELLED',
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          chamaId,
          userId,
          action: 'CANCEL_MEETING',
          entity: 'Meeting',
          entityId: meetingId,
          oldValues: { status: meeting.status },
          newValues: { status: 'CANCELLED' },
        },
      });

      return updated;
    });

    res.json({
      success: true,
      message: 'Meeting cancelled successfully',
      meeting: cancelledMeeting,
    });
  } catch (error) {
    console.error('Cancel meeting error:', error);
    res.status(500).json({ error: 'Failed to cancel meeting' });
  }
};

// Permanently delete meeting (OWNER only)
export const deleteMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chamaId, meetingId } = req.params as {chamaId: string, meetingId: string}
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Check if user is OWNER
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    });

    if (!membership || membership.role !== 'OWNER') {
      res.status(403).json({ error: 'Only chama owner can delete meetings' });
      return;
    }

    // Get meeting
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        chamaId,
      },
    });

    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    // Delete meeting
    await prisma.$transaction(async (tx) => {
      await tx.meeting.delete({
        where: { id: meetingId },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          chamaId,
          userId,
          action: 'DELETE_MEETING',
          entity: 'Meeting',
          entityId: meetingId,
          oldValues: {
            title: meeting.title,
            date: meeting.date,
          },
        },
      });
    });

    res.json({
      success: true,
      message: 'Meeting deleted permanently',
    });
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
};