FROM nginx:alpine

ENV NODE_EVN=production

COPY .docker/nginx/default.conf /etc/nginx/conf.d/
RUN rm -rf /home/user/dbdiagram-oss-wrep.nmdrzr.com/public/*
COPY /dist/spa /home/user/dbdiagram-oss-wrep.nmdrzr.com/public/

CMD ["nginx", "-g", "daemon off;"]