FROM quay.io/keycloak/keycloak:latest

# docker-compose bind-mounts .files/ into /opt/keycloak/data/import for local dev,
# which Container Apps can't do — bake the realm in instead so `--import-realm`
# still finds it in Azure.
COPY evently-realm-export.json /opt/keycloak/data/import/evently-realm-export.json
