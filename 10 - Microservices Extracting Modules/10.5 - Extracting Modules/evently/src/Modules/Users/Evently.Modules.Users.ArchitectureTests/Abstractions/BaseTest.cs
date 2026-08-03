using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using Evently.Modules.Users.Domain.Users;
using Evently.Modules.Users.Infrastructure;

namespace Evently.Modules.Users.ArchitectureTests.Abstractions;

[SuppressMessage("Design", "CA1515", Justification = "xUnit requires the base class of public test classes to be public.")]
public abstract class BaseTest
{
    protected static readonly Assembly ApplicationAssembly = typeof(Users.Application.AssemblyReference).Assembly;

    protected static readonly Assembly DomainAssembly = typeof(User).Assembly;

    protected static readonly Assembly InfrastructureAssembly = typeof(UsersModule).Assembly;

    protected static readonly Assembly PresentationAssembly = typeof(Users.Presentation.AssemblyReference).Assembly;
}
