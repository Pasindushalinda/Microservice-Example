﻿namespace Evently.Modules.Attendance.Application.EventStatistics;

public sealed class TicketModel
{
    public Guid AttendeeId { get; init; }

    public Guid EventId { get; init; }

    public Guid TicketId { get; init; }

    public string TicketCode { get; init; }
}
