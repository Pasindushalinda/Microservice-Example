namespace Evently.Api.Extensions;

internal static class ConfigurationExtensions
{
    internal static void AddModuleConfiguration(this IConfigurationBuilder configurationBuilder, string[] modules, IHostEnvironment environment)
    {
        foreach (string module in modules)
        {
            configurationBuilder.AddJsonFile($"modules.{module}.json", false, true);

            if (environment.IsDevelopment())
            {
                configurationBuilder.AddJsonFile($"modules.{module}.Development.json", true, true);
            }
        }
    }
}
