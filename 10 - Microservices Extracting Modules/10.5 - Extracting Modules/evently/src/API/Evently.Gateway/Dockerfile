# Pinned (not floating 10.0) — a newer SDK patch's analyzer flagged CA1873 on
# code that builds clean under this version; keeps CI/ACR builds matching local.
FROM mcr.microsoft.com/dotnet/aspnet:10.0.1 AS base
USER app
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:10.0.101 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["Directory.Build.props", "."]
COPY ["src/API/Evently.Gateway/Evently.Gateway.csproj", "src/API/Evently.Gateway/"]
RUN dotnet restore "./src/API/Evently.Gateway/Evently.Gateway.csproj"
COPY . .
WORKDIR "/src/src/API/Evently.Gateway"
RUN dotnet build "./Evently.Gateway.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Evently.Gateway.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Evently.Gateway.dll"]