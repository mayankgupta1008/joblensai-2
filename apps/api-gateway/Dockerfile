FROM nginx:1.28-alpine

# By default, envsubst outputs to /etc/nginx/conf.d/, but we are replacing the root nginx.conf
ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx

# Remove default nginx configs
RUN rm /etc/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy custom configuration as a template so nginx entrypoint replaces variables automatically
COPY apps/api-gateway/nginx.conf.template /etc/nginx/templates/nginx.conf.template

EXPOSE 80
