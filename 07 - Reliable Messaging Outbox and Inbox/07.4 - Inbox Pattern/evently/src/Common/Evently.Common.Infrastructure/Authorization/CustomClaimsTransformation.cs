using System.Security.Claims;
using Evently.Common.Application.Authorization;
using Evently.Common.Application.Exceptions;
using Evently.Common.Domain;
using Evently.Common.Infrastructure.Authentication;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Evently.Common.Infrastructure.Authorization;

internal sealed class CustomClaimsTransformation(
    IServiceScopeFactory serviceScopeFactory,
    ILogger<CustomClaimsTransformation> logger)
    : IClaimsTransformation
{
    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (principal.HasClaim(c => c.Type == CustomClaims.Sub))
        {
            return principal;
        }

        using IServiceScope scope = serviceScopeFactory.CreateScope();

        IPermissionService permissionService = scope.ServiceProvider.GetRequiredService<IPermissionService>();

        string identityId = principal.GetIdentityId();

        Result<PermissionsResponse> result = await permissionService.GetUserPermissionsAsync(identityId);

        if (result.IsFailure)
        {
            if (result.Error.Type == ErrorType.NotFound)
            {
                logger.LogWarning(
                    "Claims transformation skipped: no local user found for identity {IdentityId}",
                    identityId);

                return principal;
            }

            throw new EventlyException(nameof(IPermissionService.GetUserPermissionsAsync), result.Error);
        }

        var claimsIdentity = new ClaimsIdentity();

        claimsIdentity.AddClaim(new Claim(CustomClaims.Sub, result.Value.UserId.ToString()));

        foreach (string permission in result.Value.Permissions)
        {
            claimsIdentity.AddClaim(new Claim(CustomClaims.Permission, permission));
        }

        principal.AddIdentity(claimsIdentity);

        return principal;
    }
}
