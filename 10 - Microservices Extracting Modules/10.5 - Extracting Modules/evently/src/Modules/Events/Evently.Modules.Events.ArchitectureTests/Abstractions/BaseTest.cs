using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using Evently.Modules.Events.Domain.Events;
using Evently.Modules.Events.Infrastructure;

namespace Evently.Modules.Events.ArchitectureTests.Abstractions;

[SuppressMessage("Design", "CA1515", Justification = "xUnit requires the base class of public test classes to be public.")]
public abstract class BaseTest
{
    protected static readonly Assembly ApplicationAssembly = typeof(Events.Application.AssemblyReference).Assembly;

    protected static readonly Assembly DomainAssembly = typeof(Event).Assembly;

    protected static readonly Assembly InfrastructureAssembly = typeof(EventsModule).Assembly;

    protected static readonly Assembly PresentationAssembly = typeof(Events.Presentation.AssemblyReference).Assembly;
}
