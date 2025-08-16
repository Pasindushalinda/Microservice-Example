﻿using Evently.Common.Application.Messaging;
using Evently.Modules.Attendance.Domain.Attendees;

namespace Evently.Modules.Attendance.Application.EventStatistics.Projections;

internal sealed class InvalidCheckInAttemptedDomainEventHandler(IEventStatisticsRepository eventStatisticsRepository)
    : DomainEventHandler<InvalidCheckInAttemptedDomainEvent>
{
    public override async Task Handle(
        InvalidCheckInAttemptedDomainEvent domainEvent,
        CancellationToken cancellationToken = default)
    {
        EventStatistics eventStatistics =
            await eventStatisticsRepository.GetAsync(domainEvent.EventId, cancellationToken);

        eventStatistics.InvalidCheckInTickets.Add(new TicketModel
        {
            AttendeeId = domainEvent.AttendeeId,
            EventId = domainEvent.EventId,
            TicketId = domainEvent.TicketId,
            TicketCode = domainEvent.TicketCode
        });

        await eventStatisticsRepository.ReplaceAsync(eventStatistics, cancellationToken);
    }
}
